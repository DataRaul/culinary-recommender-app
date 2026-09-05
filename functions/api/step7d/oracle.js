import {
  clearSessionCookie,
  currentSessionAccount,
  jsonResponse
} from "../../../src/server/auth-core.mjs";
import {
  STEP7D_EXPECTED_RECIPE_COUNT,
  roundedElapsedMs,
  step7dOracleFingerprint,
  summarizeD1Meta
} from "../../../src/server/step7d-oracle.mjs";

function rejectedSession(current) {
  const headers = current.reason === "NO_SESSION"
    ? {}
    : { "set-cookie": clearSessionCookie() };
  return jsonResponse({
    ok: false,
    error: "UNAUTHORIZED",
    reason: current.reason || "SESSION_REJECTED"
  }, 401, headers);
}

export async function onRequestGet({ request, env }) {
  const startedAt = performance.now();
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return jsonResponse({ ok: false, error: "AUTH_NOT_CONFIGURED" }, 503);
  }

  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return rejectedSession(current);

  const url = new URL(request.url);
  if (url.searchParams.get("simulate") === "free-limit") {
    return jsonResponse({
      ok: false,
      error: "FREE_LIMIT_FAIL_CLOSED",
      authenticated: true,
      protectedDataReturned: false,
      metrics: { elapsedMs: roundedElapsedMs(startedAt), oracleQueries: 0 }
    }, 503);
  }

  const db = env.CULINARY_CONTROL_DB;
  const requestedId = String(url.searchParams.get("id") || "").trim();
  const wantsSample = url.searchParams.get("sample") === "1";

  try {
    if (requestedId || wantsSample) {
      const query = requestedId
        ? db.prepare(
          "SELECT ordinal, recipe_id, body_json, body_bytes FROM step7d_recipe_oracle WHERE recipe_id = ? LIMIT 1"
        ).bind(requestedId)
        : db.prepare(
          "SELECT ordinal, recipe_id, body_json, body_bytes FROM step7d_recipe_oracle ORDER BY ordinal ASC LIMIT 1"
        );
      const result = await query.all();
      const row = result?.results?.[0] || null;
      if (!row) {
        return jsonResponse({ ok: false, error: "STEP7D_RECIPE_NOT_FOUND" }, 404);
      }
      let recipe;
      try {
        recipe = JSON.parse(row.body_json);
      } catch {
        return jsonResponse({ ok: false, error: "STEP7D_ORACLE_BODY_INVALID" }, 500);
      }
      return jsonResponse({
        ok: true,
        step: "7D",
        authenticated: true,
        protectedDataReturned: true,
        recipe,
        metrics: {
          elapsedMs: roundedElapsedMs(startedAt),
          oracleQueries: 1,
          d1: summarizeD1Meta(result?.meta || {})
        }
      });
    }

    const result = await db.prepare(
      "SELECT ordinal, recipe_id, body_json, body_bytes FROM step7d_recipe_oracle ORDER BY ordinal ASC"
    ).all();
    const rows = result?.results || [];
    if (rows.length !== STEP7D_EXPECTED_RECIPE_COUNT) {
      return jsonResponse({
        ok: false,
        error: "STEP7D_ORACLE_NOT_READY",
        expectedRecipeCount: STEP7D_EXPECTED_RECIPE_COUNT,
        actualRecipeCount: rows.length
      }, 503);
    }
    const fingerprint = await step7dOracleFingerprint(rows);
    const totalBodyBytes = rows.reduce((sum, row) => sum + Number(row.body_bytes || 0), 0);
    return jsonResponse({
      ok: true,
      step: "7D",
      authenticated: true,
      protectedDataReturned: false,
      oracleReady: true,
      recipeCount: rows.length,
      fingerprint,
      totalBodyBytes,
      firstRecipeId: rows[0]?.recipe_id || null,
      lastRecipeId: rows.at(-1)?.recipe_id || null,
      metrics: {
        elapsedMs: roundedElapsedMs(startedAt),
        oracleQueries: 1,
        d1: summarizeD1Meta(result?.meta || {})
      }
    });
  } catch {
    return jsonResponse({ ok: false, error: "STEP7D_ORACLE_NOT_INITIALIZED" }, 503);
  }
}
