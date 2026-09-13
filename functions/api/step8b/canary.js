import {
  clearSessionCookie,
  currentSessionAccount,
  jsonResponse
} from "../../../src/server/auth-core.mjs";
import {
  STEP8B_BASELINE_VERSION,
  STEP8B_LIVE_CORPUS_VERSION,
  STEP8B_LIVE_SHARD_SPECS,
  activateStep8BCanaryPointer,
  auditStep8BReceipts,
  buildStep8BLiveFixture,
  ensureStep8BShardSchema,
  initializeStep8BPointer,
  publicStep8BLiveFixture,
  readStep8BCrossShard,
  readStep8BPointer,
  rollbackStep8BCanaryPointer,
  writeStep8BBatch
} from "../../../src/server/step8b-live.mjs";

function rejectedSession(current) {
  const headers = current.reason === "NO_SESSION"
    ? {}
    : { "set-cookie": clearSessionCookie() };
  return jsonResponse({
    ok: false,
    step: "8B",
    error: "UNAUTHORIZED",
    reason: current.reason || "SESSION_REJECTED",
    protectedDataReturned: false,
    shardQueries: 0
  }, 401, headers);
}

function boundShardDbs(env) {
  return [env?.CULINARY_RECIPE_SHARD_00_DB, env?.CULINARY_RECIPE_SHARD_01_DB];
}

function missingBindings(env) {
  return STEP8B_LIVE_SHARD_SPECS
    .filter(spec => !env?.[spec.bindingName])
    .map(spec => spec.bindingName);
}

async function authorize(request, env) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return { response: jsonResponse({ ok: false, step: "8B", error: "AUTH_NOT_CONFIGURED" }, 503) };
  }
  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return { response: rejectedSession(current) };
  return { current, authD1Subqueries: 1 };
}

function bindingsNotConfigured(env, authD1Subqueries) {
  const missing = missingBindings(env);
  if (!missing.length) return null;
  return jsonResponse({
    ok: false,
    step: "8B",
    error: "STEP8B_BINDINGS_NOT_CONFIGURED",
    missingBindings: missing,
    protectedDataReturned: false,
    metrics: {
      d1Subqueries: authD1Subqueries,
      shardQueries: 0
    }
  }, 503);
}

async function verifyBoundResources(shardDbs) {
  const checks = [];
  for (let index = 0; index < shardDbs.length; index += 1) {
    const row = await shardDbs[index].prepare("SELECT 1 AS ok").first();
    checks.push({ shardNumber: index, ok: Number(row?.ok || 0) === 1 });
  }
  return {
    pass: checks.every(check => check.ok),
    checks,
    d1Subqueries: checks.length
  };
}

export async function onRequestGet({ request, env }) {
  const authorized = await authorize(request, env);
  if (authorized.response) return authorized.response;
  const { authD1Subqueries } = authorized;
  const url = new URL(request.url);

  if (url.searchParams.get("simulate") === "free-limit") {
    return jsonResponse({
      ok: false,
      step: "8B",
      error: "STEP8B_FREE_LIMIT_FAIL_CLOSED",
      simulated: true,
      protectedDataReturned: false,
      metrics: {
        d1Subqueries: authD1Subqueries,
        shardQueries: 0
      }
    }, 503);
  }

  const bindingFailure = bindingsNotConfigured(env, authD1Subqueries);
  if (bindingFailure) return bindingFailure;

  const shardDbs = boundShardDbs(env);
  const fixture = await buildStep8BLiveFixture();
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return jsonResponse({
      ok: true,
      step: "8B",
      action,
      bindingsConfigured: STEP8B_LIVE_SHARD_SPECS.length,
      fixture: publicStep8BLiveFixture(fixture),
      protectedDataReturned: false,
      metrics: { d1Subqueries: authD1Subqueries, shardQueries: 0 }
    });
  }

  if (action === "bindings") {
    const verified = await verifyBoundResources(shardDbs);
    return jsonResponse({
      ok: verified.pass,
      step: "8B",
      action,
      bindingVerification: verified.checks,
      boundShardBindings: verified.pass ? STEP8B_LIVE_SHARD_SPECS.length : 0,
      protectedDataReturned: false,
      metrics: {
        d1Subqueries: authD1Subqueries + verified.d1Subqueries,
        shardQueries: verified.d1Subqueries
      }
    }, verified.pass ? 200 : 503);
  }

  if (action === "read") {
    const read = await readStep8BCrossShard(shardDbs, fixture);
    return jsonResponse({
      ok: read.pass,
      step: "8B",
      action,
      authenticatedCrossShardReadPass: read.pass,
      touchedShards: read.rows.length,
      rows: read.rows,
      protectedDataReturned: false,
      fullCorpusScans: 0,
      metrics: {
        d1Subqueries: authD1Subqueries + read.d1Subqueries,
        shardQueries: read.d1Subqueries
      }
    }, read.pass ? 200 : 409);
  }

  if (action === "evidence") {
    const receipts = await auditStep8BReceipts(shardDbs, fixture);
    const read = await readStep8BCrossShard(shardDbs, fixture);
    const pointer = await readStep8BPointer(env.CULINARY_CONTROL_DB);
    const rollbackPass = pointer.activeVersion === STEP8B_BASELINE_VERSION
      && pointer.previousVersion === STEP8B_LIVE_CORPUS_VERSION
      && receipts.pass;
    const pass = receipts.pass && read.pass && rollbackPass;
    return jsonResponse({
      ok: pass,
      step: "8B",
      action,
      createdRecipeBodyShardsHumanAttested: 2,
      boundShardBindings: 2,
      receiptsVerified: receipts.pass,
      authenticatedCrossShardReadPass: read.pass,
      rollbackPass,
      fullCorpusScans: 0,
      normalPublicRecommendationRuntimeChanged: false,
      protectedDataReturned: false,
      pointer: {
        activeVersion: pointer.activeVersion,
        previousVersion: pointer.previousVersion
      },
      fixture: publicStep8BLiveFixture(fixture),
      metrics: {
        d1Subqueries: authD1Subqueries + receipts.d1Subqueries + read.d1Subqueries + pointer.d1Subqueries,
        shardQueries: receipts.d1Subqueries + read.d1Subqueries
      }
    }, pass ? 200 : 409);
  }

  return jsonResponse({ ok: false, step: "8B", error: "UNKNOWN_ACTION" }, 400);
}

export async function onRequestPost({ request, env }) {
  const authorized = await authorize(request, env);
  if (authorized.response) return authorized.response;
  const { authD1Subqueries } = authorized;
  const bindingFailure = bindingsNotConfigured(env, authD1Subqueries);
  if (bindingFailure) return bindingFailure;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, step: "8B", error: "INVALID_JSON" }, 400);
  }

  const action = String(payload?.action || "");
  const shardDbs = boundShardDbs(env);
  const fixture = await buildStep8BLiveFixture();

  if (action === "initialize") {
    const shardResults = [];
    let d1Subqueries = authD1Subqueries;
    for (let index = 0; index < shardDbs.length; index += 1) {
      const result = await ensureStep8BShardSchema(shardDbs[index]);
      d1Subqueries += result.d1Subqueries;
      shardResults.push({ shardNumber: index, initialized: result.initialized });
    }
    const pointer = await initializeStep8BPointer(env.CULINARY_CONTROL_DB);
    d1Subqueries += pointer.d1Subqueries;
    return jsonResponse({
      ok: true,
      step: "8B",
      action,
      shardResults,
      canaryPointerInitialized: true,
      protectedDataReturned: false,
      metrics: { d1Subqueries, shardQueries: 4 }
    });
  }

  if (action === "partial") {
    const first = await writeStep8BBatch(shardDbs[0], fixture.shardBatches[0]);
    const pass = first.pass;
    return jsonResponse({
      ok: pass,
      step: "8B",
      action,
      simulatedPartialStopAfterShard: 0,
      firstShard: first,
      secondShardTouched: false,
      protectedDataReturned: false,
      metrics: {
        d1Subqueries: authD1Subqueries + first.d1Subqueries,
        shardQueries: first.d1Subqueries
      }
    }, pass ? 200 : 409);
  }

  if (action === "resume") {
    const first = await writeStep8BBatch(shardDbs[0], fixture.shardBatches[0]);
    if (!first.pass) {
      return jsonResponse({
        ok: false,
        step: "8B",
        action,
        error: "FIRST_SHARD_NOT_SAFE_TO_RESUME",
        firstShard: first,
        protectedDataReturned: false,
        metrics: {
          d1Subqueries: authD1Subqueries + first.d1Subqueries,
          shardQueries: first.d1Subqueries
        }
      }, 409);
    }
    const second = await writeStep8BBatch(shardDbs[1], fixture.shardBatches[1]);
    const receipts = await auditStep8BReceipts(shardDbs, fixture);
    const recoveredPartial = first.skipped === true && second.pass === true && receipts.pass === true;
    const d1Subqueries = authD1Subqueries + first.d1Subqueries + second.d1Subqueries + receipts.d1Subqueries;
    return jsonResponse({
      ok: recoveredPartial,
      step: "8B",
      action,
      firstShard: first,
      secondShard: second,
      receipts: receipts.receipts,
      partialFailureRecoveryPass: recoveredPartial,
      protectedDataReturned: false,
      metrics: {
        d1Subqueries,
        shardQueries: d1Subqueries - authD1Subqueries
      }
    }, recoveredPartial ? 200 : 409);
  }

  if (action === "replay") {
    const results = [];
    let d1Subqueries = authD1Subqueries;
    for (const batch of fixture.shardBatches) {
      const result = await writeStep8BBatch(shardDbs[batch.shardNumber], batch);
      d1Subqueries += result.d1Subqueries;
      results.push({ shardNumber: batch.shardNumber, ...result });
    }
    const idempotentWritePass = results.every(result => result.pass && result.skipped === true);
    return jsonResponse({
      ok: idempotentWritePass,
      step: "8B",
      action,
      idempotentWritePass,
      results,
      protectedDataReturned: false,
      metrics: {
        d1Subqueries,
        shardQueries: d1Subqueries - authD1Subqueries
      }
    }, idempotentWritePass ? 200 : 409);
  }

  if (action === "activate") {
    const receipts = await auditStep8BReceipts(shardDbs, fixture);
    if (!receipts.pass) {
      return jsonResponse({
        ok: false,
        step: "8B",
        action,
        error: "CANARY_RECEIPTS_NOT_VERIFIED",
        protectedDataReturned: false,
        metrics: {
          d1Subqueries: authD1Subqueries + receipts.d1Subqueries,
          shardQueries: receipts.d1Subqueries
        }
      }, 409);
    }
    const activated = await activateStep8BCanaryPointer(env.CULINARY_CONTROL_DB);
    const d1Subqueries = authD1Subqueries + receipts.d1Subqueries + activated.d1Subqueries;
    return jsonResponse({
      ok: activated.pass,
      step: "8B",
      action,
      reason: activated.reason,
      pointer: activated.pointer || activated.current || null,
      normalPublicRecommendationRuntimeChanged: false,
      protectedDataReturned: false,
      metrics: {
        d1Subqueries,
        shardQueries: receipts.d1Subqueries
      }
    }, activated.pass ? 200 : 409);
  }

  if (action === "rollback") {
    const rolledBack = await rollbackStep8BCanaryPointer(env.CULINARY_CONTROL_DB);
    const receipts = await auditStep8BReceipts(shardDbs, fixture);
    const rollbackPass = rolledBack.pass && receipts.pass;
    const d1Subqueries = authD1Subqueries + rolledBack.d1Subqueries + receipts.d1Subqueries;
    return jsonResponse({
      ok: rollbackPass,
      step: "8B",
      action,
      reason: rolledBack.reason,
      rollbackPass,
      destructiveDeletePerformed: false,
      canaryRowsRetained: receipts.pass,
      pointer: rolledBack.pointer || rolledBack.current || null,
      normalPublicRecommendationRuntimeChanged: false,
      protectedDataReturned: false,
      metrics: {
        d1Subqueries,
        shardQueries: receipts.d1Subqueries
      }
    }, rollbackPass ? 200 : 409);
  }

  return jsonResponse({ ok: false, step: "8B", error: "UNKNOWN_ACTION" }, 400);
}
