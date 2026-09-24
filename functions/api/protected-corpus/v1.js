import { clearSessionCookie, currentSessionAccount, jsonResponse } from "../../../src/server/auth-core.mjs";
import {
  PROTECTED_SEARCH_HARD_MAX_D1,
  PROTECTED_SEARCH_TARGET_MAX_D1,
  browseProtectedCorpus,
  detailProtectedCorpusRecipe,
  indexProtectedCorpusBatch,
  initializeProtectedSearchIndex,
  protectedSearchIndexStatus,
  searchProtectedCorpus
} from "../../../src/server/protected-corpus-search-v1.mjs";

const STEP = "PROTECTED-CORPUS-P1";
const shardDbs = env => [env?.CULINARY_RECIPE_SHARD_00_DB, env?.CULINARY_RECIPE_SHARD_01_DB];

function missingShardBindings(env) {
  return ["CULINARY_RECIPE_SHARD_00_DB","CULINARY_RECIPE_SHARD_01_DB"].filter(name => !env?.[name]);
}

function metrics(total, { shardQueries = 0, controlQueries = 0 } = {}) {
  return {
    d1Subqueries: total,
    shardQueries,
    controlQueries,
    targetMaxD1Subqueries: PROTECTED_SEARCH_TARGET_MAX_D1,
    hardMaxD1Subqueries: PROTECTED_SEARCH_HARD_MAX_D1,
    withinTarget: total <= PROTECTED_SEARCH_TARGET_MAX_D1,
    withinHardLimit: total <= PROTECTED_SEARCH_HARD_MAX_D1
  };
}

function unauthorized(current) {
  const headers = current.reason === "NO_SESSION" ? {} : { "set-cookie": clearSessionCookie() };
  return jsonResponse({
    ok: false,
    step: STEP,
    error: "UNAUTHORIZED",
    reason: current.reason || "SESSION_REJECTED",
    protectedDataReturned: false,
    fullCorpusScans: 0,
    metrics: metrics(0)
  }, 401, headers);
}

async function authorize(request, env) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return { response: jsonResponse({
      ok: false,
      step: STEP,
      error: "AUTH_NOT_CONFIGURED",
      protectedDataReturned: false,
      fullCorpusScans: 0,
      metrics: metrics(0)
    }, 503) };
  }
  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return { response: unauthorized(current) };
  return { authD1Subqueries: 1 };
}

function withBudget(body, authD1Subqueries, status = 200) {
  const internal = Number(body?.d1Subqueries || 0);
  const total = authD1Subqueries + internal;
  const protectedDataReturned = body?.protectedDataReturned === true;
  if (total > PROTECTED_SEARCH_HARD_MAX_D1) {
    return jsonResponse({
      ok: false,
      step: STEP,
      error: "HARD_D1_BUDGET_EXCEEDED",
      protectedDataReturned: false,
      fullCorpusScans: 0,
      metrics: metrics(total)
    }, 503);
  }
  return jsonResponse({
    ...body,
    ok: body?.pass !== false,
    step: STEP,
    protectedDataReturned,
    publicRuntimeChanged: false,
    recommendationAdmissionChanged: false,
    fullCorpusScans: 0,
    metrics: metrics(total)
  }, status);
}

function parseLimit(url) {
  const value = Number(url.searchParams.get("limit") || 24);
  return Number.isInteger(value) ? value : 24;
}

export async function onRequestGet({ request, env }) {
  const auth = await authorize(request, env);
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    try {
      const result = await protectedSearchIndexStatus(env.CULINARY_CONTROL_DB);
      return withBudget({ ...result, protectedDataReturned: false }, auth.authD1Subqueries, result.pass ? 200 : 409);
    } catch (error) {
      return jsonResponse({ ok: false, step: STEP, action, error: "INDEX_NOT_INITIALIZED", reason: String(error?.message || error).slice(0,240), protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 409);
    }
  }

  if (action === "browse") {
    try {
      const result = await browseProtectedCorpus(env.CULINARY_CONTROL_DB, {
        cursor: url.searchParams.get("cursor") || "",
        limit: parseLimit(url)
      });
      return withBudget({ ...result, protectedDataReturned: true }, auth.authD1Subqueries, 200);
    } catch (error) {
      return jsonResponse({ ok: false, step: STEP, action, error: "BROWSE_FAILED", reason: String(error?.message || error).slice(0,240), protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 409);
    }
  }

  if (action === "search") {
    try {
      const result = await searchProtectedCorpus(env.CULINARY_CONTROL_DB, {
        query: url.searchParams.get("q") || "",
        cursor: url.searchParams.get("cursor") || "",
        limit: parseLimit(url)
      });
      return withBudget({ ...result, protectedDataReturned: result.pass === true }, auth.authD1Subqueries, result.pass ? 200 : 400);
    } catch (error) {
      return jsonResponse({ ok: false, step: STEP, action, error: "SEARCH_FAILED", reason: String(error?.message || error).slice(0,240), protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 409);
    }
  }

  if (action === "detail") {
    const missing = missingShardBindings(env);
    if (missing.length) return jsonResponse({ ok: false, step: STEP, action, error: "SHARD_BINDINGS_NOT_CONFIGURED", missingBindings: missing, protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 503);
    const result = await detailProtectedCorpusRecipe(env.CULINARY_CONTROL_DB, shardDbs(env), url.searchParams.get("recipeId") || "");
    return withBudget({ ...result, protectedDataReturned: result.pass === true }, auth.authD1Subqueries, result.pass ? 200 : 404);
  }

  return jsonResponse({ ok: false, step: STEP, error: "UNKNOWN_ACTION", protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 400);
}

export async function onRequestPost({ request, env }) {
  const auth = await authorize(request, env);
  if (auth.response) return auth.response;
  let payload;
  try { payload = await request.json(); }
  catch { return jsonResponse({ ok: false, step: STEP, error: "INVALID_JSON", protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 400); }
  const action = String(payload?.action || "");

  if (action === "initialize-index") {
    try {
      const result = await initializeProtectedSearchIndex(env.CULINARY_CONTROL_DB);
      return withBudget({ ...result, protectedDataReturned: false }, auth.authD1Subqueries, 200);
    } catch (error) {
      return jsonResponse({ ok: false, step: STEP, action, error: "INDEX_INITIALIZATION_FAILED", reason: String(error?.message || error).slice(0,240), protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 503);
    }
  }

  if (action === "index-batch") {
    const missing = missingShardBindings(env);
    if (missing.length) return jsonResponse({ ok: false, step: STEP, action, error: "SHARD_BINDINGS_NOT_CONFIGURED", missingBindings: missing, protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 503);
    try {
      const result = await indexProtectedCorpusBatch(env.CULINARY_CONTROL_DB, shardDbs(env), String(payload?.cursor || ""));
      return withBudget({ ...result, protectedDataReturned: false }, auth.authD1Subqueries, result.pass ? 200 : 409);
    } catch (error) {
      return jsonResponse({ ok: false, step: STEP, action, error: "INDEX_BATCH_FAILED", reason: String(error?.message || error).slice(0,240), protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 503);
    }
  }

  return jsonResponse({ ok: false, step: STEP, error: "UNKNOWN_ACTION", protectedDataReturned: false, fullCorpusScans: 0, metrics: metrics(auth.authD1Subqueries) }, 400);
}
