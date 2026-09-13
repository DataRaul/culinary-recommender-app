import {
  clearSessionCookie,
  currentSessionAccount,
  jsonResponse
} from "../../../src/server/auth-core.mjs";
import {
  STEP8D_CORPUS_VERSION,
  STEP8D_LIVE_SHARD_SPECS,
  STEP8D_MAX_PROTECTED_D1_SUBQUERIES,
  activateStep8DPointer,
  ensureStep8DShardSchema,
  initializeStep8DPointer,
  publicStep8DPlanSummary,
  readStep8DCrossShard,
  readStep8DPointer,
  readStep8DProgress,
  rollbackStep8DPointer,
  validateStep8DIncomingBatch,
  writeStep8DBatch
} from "../../../src/server/step8d-live.mjs";

const MAX_REQUEST_BYTES = 256 * 1024;

function rejectedSession(current) {
  const headers = current.reason === "NO_SESSION" ? {} : { "set-cookie": clearSessionCookie() };
  return jsonResponse({
    ok: false,
    step: "8D",
    error: "UNAUTHORIZED",
    reason: current.reason || "SESSION_REJECTED",
    protectedDataReturned: false,
    shardQueries: 0
  }, 401, headers);
}

async function authorize(request, env) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return { response: jsonResponse({ ok: false, step: "8D", error: "AUTH_NOT_CONFIGURED", protectedDataReturned: false, shardQueries: 0 }, 503) };
  }
  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return { response: rejectedSession(current) };
  return { current, authD1Subqueries: 1 };
}

function boundShardDbs(env) {
  return [env?.CULINARY_RECIPE_SHARD_00_DB, env?.CULINARY_RECIPE_SHARD_01_DB];
}

function missingBindings(env) {
  return STEP8D_LIVE_SHARD_SPECS
    .filter(spec => !env?.[spec.bindingName])
    .map(spec => spec.bindingName);
}

function bindingsNotConfigured(env, authD1Subqueries) {
  const missing = missingBindings(env);
  if (!missing.length) return null;
  return jsonResponse({
    ok: false,
    step: "8D",
    error: "STEP8D_BINDINGS_NOT_CONFIGURED",
    missingBindings: missing,
    protectedDataReturned: false,
    metrics: { d1Subqueries: authD1Subqueries, shardQueries: 0 }
  }, 503);
}

async function verifyBoundResources(shardDbs) {
  const checks = [];
  for (let index = 0; index < shardDbs.length; index += 1) {
    const row = await shardDbs[index].prepare("SELECT 1 AS ok").first();
    checks.push({ shardNumber: index, ok: Number(row?.ok || 0) === 1 });
  }
  return { pass: checks.every(check => check.ok), checks, d1Subqueries: checks.length };
}

function budgetedMetrics(authD1Subqueries, shardQueries, controlQueries = 0) {
  const d1Subqueries = authD1Subqueries + shardQueries + controlQueries;
  return {
    d1Subqueries,
    shardQueries,
    controlQueries,
    maxAllowedD1Subqueries: STEP8D_MAX_PROTECTED_D1_SUBQUERIES,
    withinBudget: d1Subqueries <= STEP8D_MAX_PROTECTED_D1_SUBQUERIES
  };
}

function requestTooLarge(request) {
  const raw = request.headers.get("content-length");
  if (!raw) return false;
  const value = Number(raw);
  return Number.isFinite(value) && value > MAX_REQUEST_BYTES;
}

export async function onRequestGet({ request, env }) {
  const authorized = await authorize(request, env);
  if (authorized.response) return authorized.response;
  const { authD1Subqueries } = authorized;
  const url = new URL(request.url);

  if (url.searchParams.get("simulate") === "free-limit") {
    return jsonResponse({
      ok: false,
      step: "8D",
      error: "STEP8D_FREE_LIMIT_FAIL_CLOSED",
      simulated: true,
      protectedDataReturned: false,
      fullCorpusScans: 0,
      metrics: budgetedMetrics(authD1Subqueries, 0)
    }, 503);
  }

  const bindingFailure = bindingsNotConfigured(env, authD1Subqueries);
  if (bindingFailure) return bindingFailure;
  const shardDbs = boundShardDbs(env);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return jsonResponse({
      ok: true,
      step: "8D",
      action,
      phase: "LIVE_POPULATION_READY",
      plan: publicStep8DPlanSummary(),
      boundShardBindings: STEP8D_LIVE_SHARD_SPECS.length,
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics: budgetedMetrics(authD1Subqueries, 0)
    });
  }

  if (action === "bindings") {
    const verified = await verifyBoundResources(shardDbs);
    const metrics = budgetedMetrics(authD1Subqueries, verified.d1Subqueries);
    return jsonResponse({
      ok: verified.pass && metrics.withinBudget,
      step: "8D",
      action,
      bindingVerification: verified.checks,
      boundShardBindings: verified.pass ? STEP8D_LIVE_SHARD_SPECS.length : 0,
      protectedDataReturned: false,
      fullCorpusScans: 0,
      metrics
    }, verified.pass && metrics.withinBudget ? 200 : 503);
  }

  if (action === "progress") {
    const progress = await readStep8DProgress(shardDbs);
    const metrics = budgetedMetrics(authD1Subqueries, progress.d1Subqueries);
    return jsonResponse({
      ok: progress.pass && metrics.withinBudget,
      step: "8D",
      action,
      ...progress,
      protectedDataReturned: false,
      metrics
    }, progress.pass && metrics.withinBudget ? 200 : 409);
  }

  if (action === "evidence") {
    const progress = await readStep8DProgress(shardDbs);
    const read = progress.completeVerified ? await readStep8DCrossShard(shardDbs) : { pass: false, rows: [], d1Subqueries: 0 };
    const pointer = await readStep8DPointer(env.CULINARY_CONTROL_DB);
    const rollbackPass = pointer.activeVersion === "step8b-canary-v1"
      && pointer.previousVersion === STEP8D_CORPUS_VERSION
      && pointer.manifestSha256 === publicStep8DPlanSummary().manifestSha256;
    const exactPostWrite501Pass = progress.completeVerified && progress.verifiedRowCount === 501;
    const pass = progress.pass && exactPostWrite501Pass && read.pass && rollbackPass;
    const metrics = budgetedMetrics(authD1Subqueries, progress.d1Subqueries + read.d1Subqueries, pointer.d1Subqueries);
    return jsonResponse({
      ok: pass && metrics.withinBudget,
      step: "8D",
      action,
      exactPostWrite501Pass,
      verifiedBatchCount: progress.verifiedBatchCount,
      verifiedRowCount: progress.verifiedRowCount,
      authenticatedCrossShardReadPass: read.pass,
      crossShardRows: read.rows,
      rollbackPass,
      pointer: {
        activeVersion: pointer.activeVersion,
        previousVersion: pointer.previousVersion,
        manifestSha256: pointer.manifestSha256
      },
      fullCorpusScans: 0,
      publicRuntimeChanged: false,
      thirdShardUsed: false,
      billingExpansion: false,
      protectedDataReturned: false,
      metrics
    }, pass && metrics.withinBudget ? 200 : 409);
  }

  return jsonResponse({ ok: false, step: "8D", error: "UNKNOWN_ACTION", protectedDataReturned: false }, 400);
}

export async function onRequestPost({ request, env }) {
  const authorized = await authorize(request, env);
  if (authorized.response) return authorized.response;
  const { authD1Subqueries } = authorized;
  const bindingFailure = bindingsNotConfigured(env, authD1Subqueries);
  if (bindingFailure) return bindingFailure;
  if (requestTooLarge(request)) {
    return jsonResponse({ ok: false, step: "8D", error: "REQUEST_TOO_LARGE", protectedDataReturned: false }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, step: "8D", error: "INVALID_JSON", protectedDataReturned: false }, 400);
  }

  const action = String(payload?.action || "");
  const shardDbs = boundShardDbs(env);

  if (action === "initialize") {
    const shardResults = [];
    let shardQueries = 0;
    for (let index = 0; index < shardDbs.length; index += 1) {
      const result = await ensureStep8DShardSchema(shardDbs[index]);
      shardQueries += result.d1Subqueries;
      shardResults.push({ shardNumber: index, initialized: result.initialized });
    }
    const pointer = await initializeStep8DPointer(env.CULINARY_CONTROL_DB);
    const metrics = budgetedMetrics(authD1Subqueries, shardQueries, pointer.d1Subqueries);
    return jsonResponse({
      ok: metrics.withinBudget,
      step: "8D",
      action,
      shardResults,
      protectedPointerInitialized: true,
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics
    }, metrics.withinBudget ? 200 : 409);
  }

  if (action === "write") {
    const validated = await validateStep8DIncomingBatch(payload.batch || {});
    if (!validated.pass) {
      return jsonResponse({
        ok: false,
        step: "8D",
        action,
        error: "STEP8D_BATCH_REJECTED",
        reason: validated.reason,
        recipeId: validated.recipeId || null,
        protectedDataReturned: false,
        metrics: budgetedMetrics(authD1Subqueries, 0)
      }, 400);
    }
    const result = await writeStep8DBatch(shardDbs[validated.batch.shardNumber], validated.batch);
    const metrics = budgetedMetrics(authD1Subqueries, result.d1Subqueries);
    const pass = result.pass && metrics.withinBudget;
    return jsonResponse({
      ok: pass,
      step: "8D",
      action,
      batchId: validated.batch.batchId,
      shardNumber: validated.batch.shardNumber,
      result,
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics
    }, pass ? 200 : result.status === "WRITE_ERROR_UNKNOWN_COMMIT_STATE" ? 503 : 409);
  }

  if (action === "activate") {
    const progress = await readStep8DProgress(shardDbs);
    if (!progress.pass || !progress.completeVerified) {
      const metrics = budgetedMetrics(authD1Subqueries, progress.d1Subqueries);
      return jsonResponse({
        ok: false,
        step: "8D",
        action,
        error: "STEP8D_POPULATION_NOT_EXACTLY_VERIFIED",
        progress,
        protectedDataReturned: false,
        metrics
      }, 409);
    }
    const activated = await activateStep8DPointer(env.CULINARY_CONTROL_DB);
    const metrics = budgetedMetrics(authD1Subqueries, progress.d1Subqueries, activated.d1Subqueries);
    return jsonResponse({
      ok: activated.pass && metrics.withinBudget,
      step: "8D",
      action,
      protectedPointerActivated: activated.pass,
      result: activated,
      normalPublicRecommendationRuntimeChanged: false,
      protectedDataReturned: false,
      fullCorpusScans: 0,
      metrics
    }, activated.pass && metrics.withinBudget ? 200 : 409);
  }

  if (action === "rollback") {
    const rolledBack = await rollbackStep8DPointer(env.CULINARY_CONTROL_DB);
    const metrics = budgetedMetrics(authD1Subqueries, 0, rolledBack.d1Subqueries);
    return jsonResponse({
      ok: rolledBack.pass && metrics.withinBudget,
      step: "8D",
      action,
      rollbackPass: rolledBack.pass,
      destructiveDeletePerformed: false,
      populatedRowsRetained: true,
      normalPublicRecommendationRuntimeChanged: false,
      protectedDataReturned: false,
      fullCorpusScans: 0,
      result: rolledBack,
      metrics
    }, rolledBack.pass && metrics.withinBudget ? 200 : 409);
  }

  return jsonResponse({ ok: false, step: "8D", error: "UNKNOWN_ACTION", protectedDataReturned: false }, 400);
}
