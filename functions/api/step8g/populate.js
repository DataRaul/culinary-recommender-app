import {
  clearSessionCookie,
  currentSessionAccount,
  jsonResponse
} from "../../../src/server/auth-core.mjs";
import { readStep8DProgress } from "../../../src/server/step8d-live-runtime.mjs";
import {
  STEP8G_CORPUS_VERSION,
  STEP8G_EXPECTED_RECIPE_COUNT,
  STEP8G_EXPECTED_ROUTE_COUNT,
  STEP8G_LIVE_SHARD_SPECS,
  STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
  activateStep8GPointer,
  ensureStep8GShardSchema,
  expectedStep8GBodyBatchIds,
  expectedStep8GRouteBatchIds,
  hydrateStep8GProtectedRecipes,
  initializeStep8GControlSchema,
  materializeStep8GIncomingBodyBatch,
  publicStep8GBodyBatch,
  publicStep8GLiveSummary,
  publicStep8GRouteBatch,
  readStep8GBodyProgress,
  readStep8GPointer,
  readStep8GRouteProgress,
  rollbackStep8GPointer,
  writeStep8GBodyBatch,
  writeStep8GRouteBatch
} from "../../../src/server/step8g-live-runtime.mjs";

const MAX_REQUEST_BYTES = 256 * 1024;

function rejectedSession(current) {
  const headers = current.reason === "NO_SESSION" ? {} : { "set-cookie": clearSessionCookie() };
  return jsonResponse({
    ok: false,
    step: "8G",
    error: "UNAUTHORIZED",
    reason: current.reason || "SESSION_REJECTED",
    protectedDataReturned: false,
    shardQueries: 0
  }, 401, headers);
}

async function authorize(request, env) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return { response: jsonResponse({ ok: false, step: "8G", error: "AUTH_NOT_CONFIGURED", protectedDataReturned: false, shardQueries: 0 }, 503) };
  }
  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return { response: rejectedSession(current) };
  return { authD1Subqueries: 1 };
}

function boundShardDbs(env) {
  return [env?.CULINARY_RECIPE_SHARD_00_DB, env?.CULINARY_RECIPE_SHARD_01_DB];
}

function missingBindings(env) {
  return STEP8G_LIVE_SHARD_SPECS.filter(spec => !env?.[spec.bindingName]).map(spec => spec.bindingName);
}

function bindingsNotConfigured(env, authD1Subqueries) {
  const missing = missingBindings(env);
  if (!missing.length) return null;
  return jsonResponse({
    ok: false,
    step: "8G",
    error: "STEP8G_BINDINGS_NOT_CONFIGURED",
    missingBindings: missing,
    protectedDataReturned: false,
    metrics: metrics(authD1Subqueries)
  }, 503);
}

function metrics(d1Subqueries, shardQueries = 0, controlQueries = 0) {
  return {
    d1Subqueries,
    shardQueries,
    controlQueries,
    maxAllowedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
    withinBudget: d1Subqueries <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES
  };
}

function requestTooLarge(request) {
  const raw = request.headers.get("content-length");
  if (!raw) return false;
  const value = Number(raw);
  return Number.isFinite(value) && value > MAX_REQUEST_BYTES;
}

async function verifyBoundResources(shardDbs) {
  const checks = [];
  for (let index = 0; index < shardDbs.length; index += 1) {
    const row = await shardDbs[index].prepare("SELECT 1 AS ok").first();
    checks.push({ shardNumber: index, ok: Number(row?.ok || 0) === 1 });
  }
  return { pass: checks.every(check => check.ok), checks, d1Subqueries: checks.length };
}

export async function onRequestGet({ request, env }) {
  const authorized = await authorize(request, env);
  if (authorized.response) return authorized.response;
  const auth = authorized.authD1Subqueries;
  const url = new URL(request.url);

  if (url.searchParams.get("simulate") === "free-limit") {
    return jsonResponse({
      ok: false,
      step: "8G",
      error: "STEP8G_FREE_LIMIT_FAIL_CLOSED",
      simulated: true,
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics: metrics(auth)
    }, 503);
  }

  const bindingFailure = bindingsNotConfigured(env, auth);
  if (bindingFailure) return bindingFailure;
  const shardDbs = boundShardDbs(env);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return jsonResponse({
      ok: true,
      step: "8G",
      action,
      phase: "LIVE_PROTECTED_LAYER_IMPLEMENTATION_READY",
      plan: publicStep8GLiveSummary(),
      bodyBatchIds: expectedStep8GBodyBatchIds(),
      routeBatchIds: expectedStep8GRouteBatchIds(),
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics: metrics(auth)
    });
  }

  if (action === "body-batch") {
    const batch = publicStep8GBodyBatch(url.searchParams.get("batchId"));
    return batch
      ? jsonResponse({ ok: true, step: "8G", action, batch, protectedDataReturned: false, metrics: metrics(auth) })
      : jsonResponse({ ok: false, step: "8G", action, error: "UNKNOWN_BODY_BATCH_ID", protectedDataReturned: false, metrics: metrics(auth) }, 404);
  }

  if (action === "route-batch") {
    const batch = publicStep8GRouteBatch(url.searchParams.get("batchId"));
    return batch
      ? jsonResponse({ ok: true, step: "8G", action, batch, protectedDataReturned: false, metrics: metrics(auth) })
      : jsonResponse({ ok: false, step: "8G", action, error: "UNKNOWN_ROUTE_BATCH_ID", protectedDataReturned: false, metrics: metrics(auth) }, 404);
  }

  if (action === "bindings") {
    const verified = await verifyBoundResources(shardDbs);
    const total = auth + verified.d1Subqueries;
    return jsonResponse({
      ok: verified.pass && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
      step: "8G",
      action,
      bindingVerification: verified.checks,
      boundShardBindings: verified.pass ? STEP8G_LIVE_SHARD_SPECS.length : 0,
      protectedDataReturned: false,
      fullCorpusScans: 0,
      metrics: metrics(total, verified.d1Subqueries)
    }, verified.pass && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES ? 200 : 503);
  }

  if (action === "progress") {
    const [body, routes, pointer] = await Promise.all([
      readStep8GBodyProgress(shardDbs),
      readStep8GRouteProgress(env.CULINARY_CONTROL_DB),
      readStep8GPointer(env.CULINARY_CONTROL_DB)
    ]);
    const total = auth + body.d1Subqueries + routes.d1Subqueries + pointer.d1Subqueries;
    const pass = body.pass && routes.pass && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({
      ok: pass,
      step: "8G",
      action,
      body,
      routes,
      pointer: {
        activeVersion: pointer.activeVersion,
        previousVersion: pointer.previousVersion,
        manifestSha256: pointer.manifestSha256
      },
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics: metrics(total, body.d1Subqueries, routes.d1Subqueries + pointer.d1Subqueries)
    }, pass ? 200 : 409);
  }

  if (action === "evidence") {
    const [body, routes, pointer, parent] = await Promise.all([
      readStep8GBodyProgress(shardDbs),
      readStep8GRouteProgress(env.CULINARY_CONTROL_DB),
      readStep8GPointer(env.CULINARY_CONTROL_DB),
      readStep8DProgress(shardDbs)
    ]);
    const exactLayerPass = body.completeVerified && body.verifiedRowCount === STEP8G_EXPECTED_RECIPE_COUNT;
    const exactCompositionRoutesPass = routes.completeVerified && routes.verifiedRowCount === STEP8G_EXPECTED_ROUTE_COUNT;
    const parentPass = parent.completeVerified && parent.verifiedRowCount === 501;
    const pointerStatePass = (
      pointer.activeVersion === STEP8G_CORPUS_VERSION
      || (pointer.activeVersion === "v8001" && pointer.previousVersion === STEP8G_CORPUS_VERSION)
    );
    const total = auth + body.d1Subqueries + routes.d1Subqueries + pointer.d1Subqueries + parent.d1Subqueries;
    const pass = exactLayerPass && exactCompositionRoutesPass && parentPass && pointerStatePass
      && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({
      ok: pass,
      step: "8G",
      action,
      exactLayerPass,
      exactCompositionRoutesPass,
      parent501IntegrityPass: parentPass,
      composedRecipeCount: exactLayerPass && parentPass ? 1416 : null,
      pointerStatePass,
      pointer: {
        activeVersion: pointer.activeVersion,
        previousVersion: pointer.previousVersion,
        manifestSha256: pointer.manifestSha256
      },
      bodyBatchesVerified: body.verifiedBatchCount,
      routeBatchesVerified: routes.verifiedBatchCount,
      fullCorpusScans: 0,
      publicRuntimeChanged: false,
      recommendationAdmissionChanged: false,
      thirdShardUsed: false,
      billingExpansion: false,
      protectedDataReturned: false,
      metrics: metrics(total, body.d1Subqueries + parent.d1Subqueries, routes.d1Subqueries + pointer.d1Subqueries)
    }, pass ? 200 : 409);
  }

  return jsonResponse({ ok: false, step: "8G", error: "UNKNOWN_ACTION", protectedDataReturned: false }, 400);
}

export async function onRequestPost({ request, env }) {
  const authorized = await authorize(request, env);
  if (authorized.response) return authorized.response;
  const auth = authorized.authD1Subqueries;
  const bindingFailure = bindingsNotConfigured(env, auth);
  if (bindingFailure) return bindingFailure;
  if (requestTooLarge(request)) {
    return jsonResponse({ ok: false, step: "8G", error: "REQUEST_TOO_LARGE", protectedDataReturned: false }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, step: "8G", error: "INVALID_JSON", protectedDataReturned: false }, 400);
  }
  const action = String(payload?.action || "");
  const shardDbs = boundShardDbs(env);

  if (action === "initialize") {
    let shardQueries = 0;
    const shardResults = [];
    for (let index = 0; index < shardDbs.length; index += 1) {
      const initialized = await ensureStep8GShardSchema(shardDbs[index]);
      shardQueries += initialized.d1Subqueries;
      shardResults.push({ shardNumber: index, initialized: initialized.initialized });
    }
    const control = await initializeStep8GControlSchema(env.CULINARY_CONTROL_DB);
    const total = auth + shardQueries + control.d1Subqueries;
    return jsonResponse({
      ok: total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
      step: "8G",
      action,
      shardResults,
      routeIndexSchemaInitialized: true,
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics: metrics(total, shardQueries, control.d1Subqueries)
    }, total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES ? 200 : 409);
  }

  if (action === "write-body") {
    const materialized = await materializeStep8GIncomingBodyBatch(payload.batch || {});
    if (!materialized.pass) {
      return jsonResponse({
        ok: false,
        step: "8G",
        action,
        error: "STEP8G_BODY_BATCH_REJECTED",
        reason: materialized.reason,
        recipeId: materialized.recipeId || null,
        protectedDataReturned: false,
        metrics: metrics(auth)
      }, 400);
    }
    const result = await writeStep8GBodyBatch(shardDbs[materialized.batch.shardNumber], materialized.batch);
    const total = auth + result.d1Subqueries;
    const pass = result.pass && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({
      ok: pass,
      step: "8G",
      action,
      batchId: materialized.batch.batchId,
      shardNumber: materialized.batch.shardNumber,
      result,
      routeEntries: materialized.batch.entries.map(entry => ({
        recipeId: entry.recipeId,
        corpusVersion: STEP8G_CORPUS_VERSION,
        shardNumber: materialized.batch.shardNumber,
        sourceCohortId: entry.sourceCohortId,
        bodySha256: entry.bodySha256,
        bodyBytes: entry.bodyBytes
      })),
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics: metrics(total, result.d1Subqueries)
    }, pass ? 200 : result.status === "WRITE_ERROR_UNKNOWN_COMMIT_STATE" ? 503 : 409);
  }

  if (action === "write-route") {
    const result = await writeStep8GRouteBatch(env.CULINARY_CONTROL_DB, shardDbs, payload);
    const total = auth + result.d1Subqueries;
    const pass = result.pass && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({
      ok: pass,
      step: "8G",
      action,
      batchId: String(payload.batchId || ""),
      result,
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics: metrics(total)
    }, pass ? 200 : result.status === "UNKNOWN_ROUTE_BATCH_ID" ? 400 : result.status === "WRITE_ERROR_UNKNOWN_COMMIT_STATE" ? 503 : 409);
  }

  if (action === "activate") {
    const [body, routes, parent] = await Promise.all([
      readStep8GBodyProgress(shardDbs),
      readStep8GRouteProgress(env.CULINARY_CONTROL_DB),
      readStep8DProgress(shardDbs)
    ]);
    if (!body.completeVerified || !routes.completeVerified || !parent.completeVerified) {
      const total = auth + body.d1Subqueries + routes.d1Subqueries + parent.d1Subqueries;
      return jsonResponse({
        ok: false,
        step: "8G",
        action,
        error: "STEP8G_COMPOSITION_NOT_EXACTLY_VERIFIED",
        bodyComplete: body.completeVerified,
        routesComplete: routes.completeVerified,
        parentComplete: parent.completeVerified,
        protectedDataReturned: false,
        publicRuntimeChanged: false,
        metrics: metrics(total)
      }, 409);
    }
    const activated = await activateStep8GPointer(env.CULINARY_CONTROL_DB);
    const total = auth + body.d1Subqueries + routes.d1Subqueries + parent.d1Subqueries + activated.d1Subqueries;
    const pass = activated.pass && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({
      ok: pass,
      step: "8G",
      action,
      result: activated,
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      recommendationAdmissionChanged: false,
      fullCorpusScans: 0,
      metrics: metrics(total)
    }, pass ? 200 : 409);
  }

  if (action === "rollback") {
    const rolledBack = await rollbackStep8GPointer(env.CULINARY_CONTROL_DB);
    const total = auth + rolledBack.d1Subqueries;
    const pass = rolledBack.pass && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({
      ok: pass,
      step: "8G",
      action,
      result: rolledBack,
      protectedDataReturned: false,
      publicRuntimeChanged: false,
      destructiveDeletePerformed: false,
      fullCorpusScans: 0,
      metrics: metrics(total)
    }, pass ? 200 : 409);
  }

  if (action === "hydrate") {
    const hydrated = await hydrateStep8GProtectedRecipes(env.CULINARY_CONTROL_DB, shardDbs, payload.recipeIds);
    const total = auth + hydrated.d1Subqueries;
    const pass = hydrated.pass && total <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
    if (!pass) {
      return jsonResponse({
        ok: false,
        step: "8G",
        action,
        error: "STEP8G_HYDRATION_REJECTED",
        reason: hydrated.reason,
        protectedDataReturned: false,
        fullCorpusScans: 0,
        metrics: metrics(total, hydrated.shardQueries || 0, hydrated.d1Subqueries - (hydrated.shardQueries || 0))
      }, hydrated.reason === "HYDRATION_CANDIDATE_LIMIT_EXCEEDED" ? 413 : 409);
    }
    return jsonResponse({
      ok: true,
      step: "8G",
      action,
      packets: hydrated.packets,
      protectedDataReturned: true,
      publicRuntimeChanged: false,
      fullCorpusScans: 0,
      metrics: metrics(total, hydrated.shardQueries, hydrated.d1Subqueries - hydrated.shardQueries)
    });
  }

  return jsonResponse({ ok: false, step: "8G", error: "UNKNOWN_ACTION", protectedDataReturned: false }, 400);
}
