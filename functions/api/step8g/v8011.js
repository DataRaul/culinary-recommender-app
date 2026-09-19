import { clearSessionCookie, currentSessionAccount, jsonResponse } from "../../../src/server/auth-core.mjs";
import {
  STEP8G_V8011_EXPECTED_RECIPE_COUNT,
  STEP8G_V8011_EXPECTED_ROUTE_COUNT,
  STEP8G_V8011_LIVE_SHARD_SPECS,
  activateStep8GV8011Pointer,
  copyStep8GV8011ParentRoutes,
  ensureStep8GV8011ShardSchema,
  expectedStep8GV8011BodyBatchIds,
  expectedStep8GV8011RouteBatchIds,
  initializeStep8GV8011ControlSchema,
  materializeStep8GV8011IncomingBodyBatch,
  publicStep8GV8011BodyBatch,
  publicStep8GV8011RouteBatch,
  publicStep8GV8011Summary,
  readStep8GV8011BodyProgress,
  readStep8GV8011RouteProgress,
  rollbackStep8GV8011Pointer,
  writeStep8GV8011BodyBatch,
  writeStep8GV8011RouteBatch
} from "../../../src/server/step8g-v8011-live-runtime.mjs";
import { hydrateStep8GV8011ProtectedRecipesBounded } from "../../../src/server/step8g-v8011-hydration-runtime.mjs";
import { readStep8GPointer } from "../../../src/server/step8g-live-runtime.mjs";

const MAX_REQUEST_BYTES = 256 * 1024;
const STEP = "8G-V8011";
const MAX_D1 = 16;

function rejectedSession(current) {
  const headers = current.reason === "NO_SESSION" ? {} : { "set-cookie": clearSessionCookie() };
  return jsonResponse({ ok: false, step: STEP, error: "UNAUTHORIZED", reason: current.reason || "SESSION_REJECTED", protectedDataReturned: false, shardQueries: 0 }, 401, headers);
}

async function authorize(request, env) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) return { response: jsonResponse({ ok: false, step: STEP, error: "AUTH_NOT_CONFIGURED", protectedDataReturned: false, shardQueries: 0 }, 503) };
  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return { response: rejectedSession(current) };
  return { authD1Subqueries: 1 };
}

const shardDbs = env => [env?.CULINARY_RECIPE_SHARD_00_DB, env?.CULINARY_RECIPE_SHARD_01_DB];
const missingBindings = env => STEP8G_V8011_LIVE_SHARD_SPECS.filter(spec => !env?.[spec.bindingName]).map(spec => spec.bindingName);
const metrics = (d1Subqueries, shardQueries = 0, controlQueries = 0) => ({ d1Subqueries, shardQueries, controlQueries, maxAllowedD1Subqueries: MAX_D1, withinBudget: d1Subqueries <= MAX_D1 });
function requestTooLarge(request) { const raw = request.headers.get("content-length"); if (!raw) return false; const value = Number(raw); return Number.isFinite(value) && value > MAX_REQUEST_BYTES; }

export async function onRequestGet({ request, env }) {
  const authResult = await authorize(request, env);
  if (authResult.response) return authResult.response;
  const auth = authResult.authD1Subqueries;
  const url = new URL(request.url);
  if (url.searchParams.get("simulate") === "free-limit") return jsonResponse({ ok: false, step: STEP, error: "STEP8G_V8011_FREE_LIMIT_FAIL_CLOSED", simulated: true, protectedDataReturned: false, publicRuntimeChanged: false, fullCorpusScans: 0, metrics: metrics(auth) }, 503);
  const missing = missingBindings(env);
  if (missing.length) return jsonResponse({ ok: false, step: STEP, error: "STEP8G_V8011_BINDINGS_NOT_CONFIGURED", missingBindings: missing, protectedDataReturned: false, metrics: metrics(auth) }, 503);
  const dbs = shardDbs(env), action = url.searchParams.get("action") || "status";
  if (action === "status") return jsonResponse({ ok: true, step: STEP, action, phase: "LIVE_PROTECTED_LAYER_IMPLEMENTATION_READY", plan: publicStep8GV8011Summary(), bodyBatchIds: expectedStep8GV8011BodyBatchIds(), routeBatchIds: expectedStep8GV8011RouteBatchIds(), protectedDataReturned: false, publicRuntimeChanged: false, fullCorpusScans: 0, metrics: metrics(auth) });
  if (action === "bindings") {
    const checks = []; let q = 0;
    for (let index = 0; index < dbs.length; index++) { const row = await dbs[index].prepare("SELECT 1 AS ok").first(); q++; checks.push({ shardNumber: index, ok: Number(row?.ok || 0) === 1 }); }
    const total = auth + q, pass = checks.every(check => check.ok) && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, bindingVerification: checks, boundShardBindings: pass ? 2 : 0, protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(total, q) }, pass ? 200 : 503);
  }
  if (action === "body-batch") {
    const batch = publicStep8GV8011BodyBatch(url.searchParams.get("batchId"));
    return batch ? jsonResponse({ ok: true, step: STEP, action, batch, protectedDataReturned: false, metrics: metrics(auth) }) : jsonResponse({ ok: false, step: STEP, action, error: "UNKNOWN_BODY_BATCH_ID", protectedDataReturned: false, metrics: metrics(auth) }, 404);
  }
  if (action === "route-batch") {
    const batch = publicStep8GV8011RouteBatch(url.searchParams.get("batchId"));
    return batch ? jsonResponse({ ok: true, step: STEP, action, batch, protectedDataReturned: false, metrics: metrics(auth) }) : jsonResponse({ ok: false, step: STEP, action, error: "UNKNOWN_ROUTE_BATCH_ID", protectedDataReturned: false, metrics: metrics(auth) }, 404);
  }
  if (action === "progress") {
    const [body, routes, pointer] = await Promise.all([readStep8GV8011BodyProgress(dbs), readStep8GV8011RouteProgress(env.CULINARY_CONTROL_DB), readStep8GPointer(env.CULINARY_CONTROL_DB)]);
    const total = auth + body.d1Subqueries + routes.d1Subqueries + pointer.d1Subqueries, pass = body.pass && routes.pass && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, body, routes, pointer: { activeVersion: pointer.activeVersion, previousVersion: pointer.previousVersion, manifestSha256: pointer.manifestSha256 }, protectedDataReturned: false, publicRuntimeChanged: false, fullCorpusScans: 0, metrics: metrics(total, body.d1Subqueries, routes.d1Subqueries + pointer.d1Subqueries) }, pass ? 200 : 409);
  }
  if (action === "evidence") {
    const [body, routes, pointer] = await Promise.all([readStep8GV8011BodyProgress(dbs), readStep8GV8011RouteProgress(env.CULINARY_CONTROL_DB), readStep8GPointer(env.CULINARY_CONTROL_DB)]);
    const pointerStatePass = pointer.activeVersion === "v8011" || (pointer.activeVersion === "v8010" && pointer.previousVersion === "v8011");
    const total = auth + body.d1Subqueries + routes.d1Subqueries + pointer.d1Subqueries;
    const pass = body.completeVerified && body.verifiedRowCount === STEP8G_V8011_EXPECTED_RECIPE_COUNT && routes.completeVerified && routes.totalRouteCount === STEP8G_V8011_EXPECTED_ROUTE_COUNT && pointerStatePass && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, exactLayerPass: body.completeVerified, exactCompositionRoutesPass: routes.completeVerified, composedRecipeCount: routes.completeVerified ? routes.totalRouteCount : null, pointerStatePass, pointer: { activeVersion: pointer.activeVersion, previousVersion: pointer.previousVersion, manifestSha256: pointer.manifestSha256 }, bodyBatchesVerified: body.verifiedBatchCount, routeBatchesVerified: routes.verifiedBatchCount, fullCorpusScans: 0, publicRuntimeChanged: false, recommendationAdmissionChanged: false, thirdShardUsed: false, billingExpansion: false, culturalAuthenticityAuthorityImported: false, protectedDataReturned: false, metrics: metrics(total, body.d1Subqueries, routes.d1Subqueries + pointer.d1Subqueries) }, pass ? 200 : 409);
  }
  return jsonResponse({ ok: false, step: STEP, error: "UNKNOWN_ACTION", protectedDataReturned: false }, 400);
}

export async function onRequestPost({ request, env }) {
  const authResult = await authorize(request, env);
  if (authResult.response) return authResult.response;
  const auth = authResult.authD1Subqueries, missing = missingBindings(env);
  if (missing.length) return jsonResponse({ ok: false, step: STEP, error: "STEP8G_V8011_BINDINGS_NOT_CONFIGURED", missingBindings: missing, protectedDataReturned: false, metrics: metrics(auth) }, 503);
  if (requestTooLarge(request)) return jsonResponse({ ok: false, step: STEP, error: "REQUEST_TOO_LARGE", protectedDataReturned: false }, 413);
  let payload;
  try { payload = await request.json(); }
  catch { return jsonResponse({ ok: false, step: STEP, error: "INVALID_JSON", protectedDataReturned: false }, 400); }
  const action = String(payload?.action || ""), dbs = shardDbs(env);
  if (action === "initialize") {
    let shardQueries = 0;
    for (const db of dbs) { const result = await ensureStep8GV8011ShardSchema(db); shardQueries += result.d1Subqueries; }
    const control = await initializeStep8GV8011ControlSchema(env.CULINARY_CONTROL_DB), total = auth + shardQueries + control.d1Subqueries, pass = total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, protectedDataReturned: false, publicRuntimeChanged: false, fullCorpusScans: 0, metrics: metrics(total, shardQueries, control.d1Subqueries) }, pass ? 200 : 409);
  }
  if (action === "copy-parent-routes") {
    const result = await copyStep8GV8011ParentRoutes(env.CULINARY_CONTROL_DB), total = auth + result.d1Subqueries, pass = result.pass && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, result, protectedDataReturned: false, publicRuntimeChanged: false, metrics: metrics(total, 0, result.d1Subqueries) }, pass ? 200 : 409);
  }
  if (action === "write-body") {
    const materialized = await materializeStep8GV8011IncomingBodyBatch(payload.batch || {});
    if (!materialized.pass) return jsonResponse({ ok: false, step: STEP, action, error: "STEP8G_V8011_BODY_BATCH_REJECTED", reason: materialized.reason, protectedDataReturned: false, metrics: metrics(auth) }, 400);
    const result = await writeStep8GV8011BodyBatch(dbs[materialized.batch.shardNumber], materialized.batch), total = auth + result.d1Subqueries, pass = result.pass && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, batchId: materialized.batch.batchId, shardNumber: materialized.batch.shardNumber, result, routeEntries: materialized.batch.entries.map(entry => ({ recipeId: entry.recipeId, corpusVersion: "v8011", shardNumber: materialized.batch.shardNumber, sourceCohortId: entry.sourceCohortId, bodySha256: entry.bodySha256, bodyBytes: entry.bodyBytes })), protectedDataReturned: false, publicRuntimeChanged: false, fullCorpusScans: 0, metrics: metrics(total, result.d1Subqueries) }, pass ? 200 : result.status === "WRITE_ERROR_UNKNOWN_COMMIT_STATE" ? 503 : 409);
  }
  if (action === "write-route") {
    const result = await writeStep8GV8011RouteBatch(env.CULINARY_CONTROL_DB, dbs, payload), total = auth + result.d1Subqueries, pass = result.pass && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, batchId: String(payload.batchId || ""), result, protectedDataReturned: false, publicRuntimeChanged: false, fullCorpusScans: 0, metrics: metrics(total, 0, result.d1Subqueries) }, pass ? 200 : result.status === "WRITE_ERROR_UNKNOWN_COMMIT_STATE" ? 503 : 409);
  }
  if (action === "activate") {
    const [body, routes] = await Promise.all([readStep8GV8011BodyProgress(dbs), readStep8GV8011RouteProgress(env.CULINARY_CONTROL_DB)]);
    if (!body.completeVerified || !routes.completeVerified) return jsonResponse({ ok: false, step: STEP, action, error: "STEP8G_V8011_COMPOSITION_NOT_EXACTLY_VERIFIED", bodyComplete: body.completeVerified, routesComplete: routes.completeVerified, protectedDataReturned: false, publicRuntimeChanged: false, metrics: metrics(auth + body.d1Subqueries + routes.d1Subqueries) }, 409);
    const result = await activateStep8GV8011Pointer(env.CULINARY_CONTROL_DB), total = auth + body.d1Subqueries + routes.d1Subqueries + result.d1Subqueries, pass = result.pass && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, result, protectedDataReturned: false, publicRuntimeChanged: false, recommendationAdmissionChanged: false, fullCorpusScans: 0, metrics: metrics(total) }, pass ? 200 : 409);
  }
  if (action === "rollback") {
    const result = await rollbackStep8GV8011Pointer(env.CULINARY_CONTROL_DB), total = auth + result.d1Subqueries, pass = result.pass && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, result, protectedDataReturned: false, publicRuntimeChanged: false, recommendationAdmissionChanged: false, fullCorpusScans: 0, metrics: metrics(total) }, pass ? 200 : 409);
  }
  if (action === "hydrate") {
    const ids = Array.isArray(payload.recipeIds) ? payload.recipeIds : [], result = await hydrateStep8GV8011ProtectedRecipesBounded(env.CULINARY_CONTROL_DB, dbs, ids), total = auth + result.d1Subqueries, pass = result.pass && total <= MAX_D1;
    return jsonResponse({ ok: pass, step: STEP, action, result, protectedDataReturned: pass, publicRuntimeChanged: false, fullCorpusScans: 0, metrics: metrics(total, result.shardQueries, result.routeQueries) }, pass ? 200 : 409);
  }
  return jsonResponse({ ok: false, step: STEP, error: "UNKNOWN_ACTION", protectedDataReturned: false }, 400);
}
