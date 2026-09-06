import {
  clearSessionCookie,
  currentSessionAccount,
  jsonResponse
} from "../../../src/server/auth-core.mjs";
import {
  roundedElapsedMs,
  summarizeD1Batch,
  summarizeD1Meta
} from "../../../src/server/step7d-oracle.mjs";
import {
  STEP7E_CHUNK_TABLE,
  STEP7E_EXPECTED_CHUNK_COUNT,
  STEP7E_PILOT_TABLE,
  expectedStep7eChunk,
  loadStep7eChunk,
  publicStep7eManifest,
  step7eStoredChunkFingerprint
} from "../../../src/server/step7e-pilot.mjs";

const CREATE_PILOT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS step7e_source_pilot (
  ordinal INTEGER PRIMARY KEY,
  source_item_id TEXT NOT NULL,
  body_json TEXT NOT NULL,
  body_bytes INTEGER NOT NULL,
  packet_sha256 TEXT NOT NULL
)`;

const CREATE_CHUNK_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS step7e_source_pilot_chunks (
  chunk_index INTEGER PRIMARY KEY,
  first_ordinal INTEGER NOT NULL,
  recipe_count INTEGER NOT NULL,
  chunk_sha256 TEXT NOT NULL,
  total_body_bytes INTEGER NOT NULL,
  source_commit TEXT NOT NULL
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

async function readStoredChunk(db, descriptor) {
  const result = await db.prepare(
    `SELECT ordinal, source_item_id, body_json, body_bytes, packet_sha256
     FROM ${STEP7E_PILOT_TABLE}
     WHERE ordinal BETWEEN ? AND ?
     ORDER BY ordinal ASC`
  ).bind(descriptor.firstOrdinal, descriptor.lastOrdinal).all();
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

  const url = new URL(request.url);
  const chunkIndex = Number(url.searchParams.get("chunk"));
  const descriptor = expectedStep7eChunk(chunkIndex);
  if (!descriptor) {
    return jsonResponse({
      ok: false,
      error: "STEP7E_CHUNK_INDEX_INVALID",
      expectedChunkCount: STEP7E_EXPECTED_CHUNK_COUNT
    }, 400);
  }

  let materialized;
  try {
    materialized = await loadStep7eChunk(chunkIndex);
  } catch {
    return jsonResponse({ ok: false, error: "STEP7E_CHUNK_BUNDLE_INTEGRITY_FAILED", chunkIndex }, 500);
  }

  const db = env.CULINARY_CONTROL_DB;
  let pilotSchemaResult;
  let chunkSchemaResult;
  try {
    pilotSchemaResult = await db.prepare(CREATE_PILOT_TABLE_SQL).run();
    chunkSchemaResult = await db.prepare(CREATE_CHUNK_TABLE_SQL).run();
  } catch {
    return jsonResponse({ ok: false, error: "STEP7E_SCHEMA_CREATE_FAILED", chunkIndex }, 503);
  }

  let existing;
  try {
    existing = await db.prepare(
      `SELECT chunk_index, first_ordinal, recipe_count, chunk_sha256, total_body_bytes, source_commit
       FROM ${STEP7E_CHUNK_TABLE} WHERE chunk_index = ? LIMIT 1`
    ).bind(chunkIndex).first();
  } catch {
    return jsonResponse({ ok: false, error: "STEP7E_CHUNK_STATE_READ_FAILED", chunkIndex }, 503);
  }

  if (existing) {
    const metadataMatches = Number(existing.chunk_index) === descriptor.chunkIndex
      && Number(existing.first_ordinal) === descriptor.firstOrdinal
      && Number(existing.recipe_count) === descriptor.recipeCount
      && String(existing.chunk_sha256 || "") === descriptor.chunkSha256
      && Number(existing.total_body_bytes) === descriptor.bodyBytes
      && String(existing.source_commit || "") === publicStep7eManifest().sourceCommit;
    if (!metadataMatches) {
      return jsonResponse({ ok: false, error: "STEP7E_CHUNK_STATE_MISMATCH", chunkIndex }, 409);
    }

    let stored;
    try {
      stored = await readStoredChunk(db, descriptor);
    } catch {
      return jsonResponse({ ok: false, error: "STEP7E_CHUNK_VERIFY_READ_FAILED", chunkIndex }, 503);
    }
    const fingerprint = await step7eStoredChunkFingerprint(stored.rows);
    if (stored.rows.length !== descriptor.recipeCount || fingerprint !== descriptor.chunkSha256) {
      return jsonResponse({ ok: false, error: "STEP7E_CHUNK_STORED_FINGERPRINT_MISMATCH", chunkIndex }, 409);
    }

    return jsonResponse({
      ok: true,
      step: "7E",
      initialized: true,
      idempotent: true,
      chunkIndex,
      chunkCount: STEP7E_EXPECTED_CHUNK_COUNT,
      recipeCount: descriptor.recipeCount,
      chunkFingerprint: descriptor.chunkSha256,
      metrics: {
        elapsedMs: roundedElapsedMs(startedAt),
        schema: {
          pilot: summarizeD1Meta(pilotSchemaResult?.meta || {}),
          chunks: summarizeD1Meta(chunkSchemaResult?.meta || {})
        },
        verificationRead: summarizeD1Meta(stored.meta)
      }
    });
  }

  const statements = materialized.rows.map(row => db.prepare(
    `INSERT INTO ${STEP7E_PILOT_TABLE}
      (ordinal, source_item_id, body_json, body_bytes, packet_sha256)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(row.ordinal, row.sourceItemId, row.bodyJson, row.bodyBytes, row.packetSha256));
  statements.push(db.prepare(
    `INSERT INTO ${STEP7E_CHUNK_TABLE}
      (chunk_index, first_ordinal, recipe_count, chunk_sha256, total_body_bytes, source_commit)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    descriptor.chunkIndex,
    descriptor.firstOrdinal,
    descriptor.recipeCount,
    descriptor.chunkSha256,
    descriptor.bodyBytes,
    publicStep7eManifest().sourceCommit
  ));

  let writeResults;
  try {
    writeResults = await db.batch(statements);
  } catch {
    return jsonResponse({ ok: false, error: "STEP7E_CHUNK_WRITE_FAILED", chunkIndex }, 503);
  }

  let stored;
  try {
    stored = await readStoredChunk(db, descriptor);
  } catch {
    return jsonResponse({ ok: false, error: "STEP7E_CHUNK_POSTWRITE_READ_FAILED", chunkIndex }, 503);
  }
  const storedFingerprint = await step7eStoredChunkFingerprint(stored.rows);
  if (stored.rows.length !== descriptor.recipeCount || storedFingerprint !== descriptor.chunkSha256) {
    return jsonResponse({
      ok: false,
      error: "STEP7E_CHUNK_POSTWRITE_VERIFY_FAILED",
      chunkIndex,
      expectedRecipeCount: descriptor.recipeCount,
      actualRecipeCount: stored.rows.length
    }, 500);
  }

  return jsonResponse({
    ok: true,
    step: "7E",
    initialized: true,
    idempotent: false,
    chunkIndex,
    chunkCount: STEP7E_EXPECTED_CHUNK_COUNT,
    recipeCount: stored.rows.length,
    chunkFingerprint: storedFingerprint,
    metrics: {
      elapsedMs: roundedElapsedMs(startedAt),
      schema: {
        pilot: summarizeD1Meta(pilotSchemaResult?.meta || {}),
        chunks: summarizeD1Meta(chunkSchemaResult?.meta || {})
      },
      writeBatch: summarizeD1Batch(writeResults),
      verificationRead: summarizeD1Meta(stored.meta)
    }
  });
}
