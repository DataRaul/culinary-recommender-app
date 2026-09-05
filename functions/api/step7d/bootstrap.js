import { ALL_RECIPES } from "../../../src/data/corpus-v1.js";
import {
  clearSessionCookie,
  currentSessionAccount,
  jsonResponse
} from "../../../src/server/auth-core.mjs";
import {
  STEP7D_EXPECTED_RECIPE_COUNT,
  roundedElapsedMs,
  serializeStep7dOracleRows,
  step7dOracleFingerprint,
  summarizeD1Batch,
  summarizeD1Meta
} from "../../../src/server/step7d-oracle.mjs";

const CREATE_ORACLE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS step7d_recipe_oracle (
  ordinal INTEGER PRIMARY KEY,
  recipe_id TEXT NOT NULL UNIQUE,
  body_json TEXT NOT NULL,
  body_bytes INTEGER NOT NULL
)`;

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

async function readOracleRows(db) {
  const result = await db.prepare(
    "SELECT ordinal, recipe_id, body_json, body_bytes FROM step7d_recipe_oracle ORDER BY ordinal ASC"
  ).all();
  return { rows: result?.results || [], meta: result?.meta || {} };
}

export async function onRequestPost({ request, env }) {
  const startedAt = performance.now();
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return jsonResponse({ ok: false, error: "AUTH_NOT_CONFIGURED" }, 503);
  }

  const requestOrigin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  if (requestOrigin !== ownOrigin) {
    return jsonResponse({ ok: false, error: "INVALID_ORIGIN" }, 403);
  }

  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return rejectedSession(current);

  const rows = serializeStep7dOracleRows(ALL_RECIPES);
  const ids = new Set(rows.map(row => row.recipeId));
  if (rows.length !== STEP7D_EXPECTED_RECIPE_COUNT || ids.size !== rows.length || ids.has("")) {
    return jsonResponse({
      ok: false,
      error: "STEP7D_GOLDEN_ORACLE_INVALID",
      expectedRecipeCount: STEP7D_EXPECTED_RECIPE_COUNT,
      actualRecipeCount: rows.length
    }, 500);
  }

  const expectedFingerprint = await step7dOracleFingerprint(rows);
  const db = env.CULINARY_CONTROL_DB;

  let schemaResult;
  try {
    schemaResult = await db.prepare(CREATE_ORACLE_TABLE_SQL).run();
  } catch {
    return jsonResponse({ ok: false, error: "STEP7D_SCHEMA_CREATE_FAILED" }, 503);
  }

  let countRow;
  try {
    countRow = await db.prepare("SELECT COUNT(*) AS count FROM step7d_recipe_oracle").first();
  } catch {
    return jsonResponse({ ok: false, error: "STEP7D_ORACLE_READ_FAILED" }, 503);
  }
  const existingCount = Number(countRow?.count || 0);

  if (existingCount !== 0 && existingCount !== STEP7D_EXPECTED_RECIPE_COUNT) {
    return jsonResponse({
      ok: false,
      error: "STEP7D_ORACLE_STATE_MISMATCH",
      expectedRecipeCount: STEP7D_EXPECTED_RECIPE_COUNT,
      actualRecipeCount: existingCount
    }, 409);
  }

  if (existingCount === STEP7D_EXPECTED_RECIPE_COUNT) {
    const existing = await readOracleRows(db);
    const existingFingerprint = await step7dOracleFingerprint(existing.rows);
    if (existingFingerprint !== expectedFingerprint) {
      return jsonResponse({
        ok: false,
        error: "STEP7D_ORACLE_FINGERPRINT_MISMATCH",
        recipeCount: existingCount
      }, 409);
    }
    return jsonResponse({
      ok: true,
      step: "7D",
      initialized: true,
      idempotent: true,
      recipeCount: existingCount,
      fingerprint: expectedFingerprint,
      metrics: {
        elapsedMs: roundedElapsedMs(startedAt),
        schema: summarizeD1Meta(schemaResult?.meta || {}),
        verificationRead: summarizeD1Meta(existing.meta)
      }
    });
  }

  const statements = rows.map(row => db.prepare(
    "INSERT INTO step7d_recipe_oracle (ordinal, recipe_id, body_json, body_bytes) VALUES (?, ?, ?, ?)"
  ).bind(row.ordinal, row.recipeId, row.bodyJson, row.bodyBytes));

  let insertResults;
  try {
    insertResults = await db.batch(statements);
  } catch {
    return jsonResponse({ ok: false, error: "STEP7D_ORACLE_WRITE_FAILED" }, 503);
  }

  const stored = await readOracleRows(db);
  const storedFingerprint = await step7dOracleFingerprint(stored.rows);
  if (stored.rows.length !== STEP7D_EXPECTED_RECIPE_COUNT || storedFingerprint !== expectedFingerprint) {
    return jsonResponse({
      ok: false,
      error: "STEP7D_ORACLE_POSTWRITE_VERIFY_FAILED",
      expectedRecipeCount: STEP7D_EXPECTED_RECIPE_COUNT,
      actualRecipeCount: stored.rows.length
    }, 500);
  }

  return jsonResponse({
    ok: true,
    step: "7D",
    initialized: true,
    idempotent: false,
    recipeCount: stored.rows.length,
    fingerprint: storedFingerprint,
    metrics: {
      elapsedMs: roundedElapsedMs(startedAt),
      schema: summarizeD1Meta(schemaResult?.meta || {}),
      writeBatch: summarizeD1Batch(insertResults),
      verificationRead: summarizeD1Meta(stored.meta)
    }
  });
}
