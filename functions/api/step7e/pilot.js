import {
  clearSessionCookie,
  currentSessionAccount,
  jsonResponse
} from "../../../src/server/auth-core.mjs";
import {
  roundedElapsedMs,
  summarizeD1Meta
} from "../../../src/server/step7d-oracle.mjs";
import {
  STEP7E_CHUNK_TABLE,
  STEP7E_EXPECTED_CHUNK_COUNT,
  STEP7E_EXPECTED_FINGERPRINT,
  STEP7E_EXPECTED_RECIPE_COUNT,
  STEP7E_PILOT_TABLE,
  publicStep7eManifest,
  step7ePilotFingerprintSha256,
  validateStoredStep7eChunkMetadata
} from "../../../src/server/step7e-pilot.mjs";

const AUDIT_READ_ATTEMPTS = 2;

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

class Step7eAuditReadError extends Error {
  constructor(code, attempts) {
    super(code);
    this.code = code;
    this.attempts = attempts;
  }
}

async function boundedAuditRead(code, operation) {
  for (let attempt = 1; attempt <= AUDIT_READ_ATTEMPTS; attempt += 1) {
    try {
      return { value: await operation(), attempts: attempt };
    } catch {
      if (attempt === AUDIT_READ_ATTEMPTS) throw new Step7eAuditReadError(code, attempt);
    }
  }
  throw new Step7eAuditReadError(code, AUDIT_READ_ATTEMPTS);
}

async function readPilotAudit(db) {
  const schemaRead = await boundedAuditRead(
    "STEP7E_AUDIT_SCHEMA_READ_FAILED",
    () => db.prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name IN (?, ?)"
    ).bind(STEP7E_PILOT_TABLE, STEP7E_CHUNK_TABLE).all()
  );
  const schemaNames = new Set((schemaRead.value?.results || []).map(row => String(row.name || "")));
  const missingTables = [STEP7E_PILOT_TABLE, STEP7E_CHUNK_TABLE].filter(name => !schemaNames.has(name));
  if (missingTables.length) {
    return {
      initialized: false,
      missingTables,
      attempts: { schema: schemaRead.attempts }
    };
  }

  const chunksRead = await boundedAuditRead(
    "STEP7E_AUDIT_CHUNK_METADATA_READ_FAILED",
    () => db.prepare(
      `SELECT chunk_index, first_ordinal, recipe_count, chunk_sha256, total_body_bytes, source_commit
       FROM ${STEP7E_CHUNK_TABLE}
       ORDER BY chunk_index ASC`
    ).all()
  );
  const chunkRows = chunksRead.value?.results || [];

  const recipeCountRead = await boundedAuditRead(
    "STEP7E_AUDIT_RECIPE_COUNT_READ_FAILED",
    () => db.prepare(
      `SELECT COUNT(*) AS recipe_count
       FROM ${STEP7E_PILOT_TABLE}`
    ).first()
  );

  const bodyBytesRead = await boundedAuditRead(
    "STEP7E_AUDIT_BODY_BYTES_READ_FAILED",
    () => db.prepare(
      `SELECT COALESCE(SUM(body_bytes), 0) AS total_body_bytes
       FROM ${STEP7E_PILOT_TABLE}`
    ).first()
  );

  return {
    initialized: true,
    chunkRows,
    chunkMeta: chunksRead.value?.meta || {},
    totals: {
      recipeCount: Number(recipeCountRead.value?.recipe_count || 0),
      totalBodyBytes: Number(bodyBytesRead.value?.total_body_bytes || 0)
    },
    attempts: {
      schema: schemaRead.attempts,
      chunkMetadata: chunksRead.attempts,
      recipeCount: recipeCountRead.attempts,
      bodyBytes: bodyBytesRead.attempts
    }
  };
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
      step: "7E",
      error: "STEP7E_FREE_LIMIT_FAIL_CLOSED",
      simulated: true,
      protectedDataReturned: false,
      metrics: {
        elapsedMs: roundedElapsedMs(startedAt),
        pilotQueries: 0,
        pilotRowsRead: 0,
        pilotRowsWritten: 0
      }
    }, 503);
  }

  const db = env.CULINARY_CONTROL_DB;
  let audit;
  try {
    audit = await readPilotAudit(db);
  } catch (error) {
    const code = error instanceof Step7eAuditReadError
      ? error.code
      : "STEP7E_AUDIT_READ_FAILED";
    return jsonResponse({
      ok: false,
      step: "7E",
      error: code,
      ready: false,
      bootstrapRequired: false,
      protectedDataReturned: false,
      auditReadAttempts: error instanceof Step7eAuditReadError ? error.attempts : null,
      manifest: publicStep7eManifest()
    }, 503);
  }

  if (!audit.initialized) {
    return jsonResponse({
      ok: false,
      step: "7E",
      error: "STEP7E_PILOT_NOT_INITIALIZED",
      ready: false,
      bootstrapRequired: true,
      missingTables: audit.missingTables,
      missingChunkIndices: Array.from({ length: STEP7E_EXPECTED_CHUNK_COUNT }, (_, index) => index),
      protectedDataReturned: false,
      metrics: {
        elapsedMs: roundedElapsedMs(startedAt),
        pilotQueries: 1,
        auditReadAttempts: audit.attempts
      },
      manifest: publicStep7eManifest()
    }, 409);
  }

  const metadataValidation = validateStoredStep7eChunkMetadata(audit.chunkRows);
  const storedFingerprint = metadataValidation.pass
    ? await step7ePilotFingerprintSha256(audit.chunkRows)
    : null;
  const totalsMatch = audit.totals.recipeCount === STEP7E_EXPECTED_RECIPE_COUNT
    && audit.totals.totalBodyBytes === publicStep7eManifest().totalBodyBytes;
  const fingerprintMatch = storedFingerprint === STEP7E_EXPECTED_FINGERPRINT;
  const ready = metadataValidation.pass && totalsMatch && fingerprintMatch;
  const presentChunkIndices = new Set(
    audit.chunkRows
      .map(row => Number(row.chunk_index))
      .filter(index => Number.isInteger(index) && index >= 0 && index < STEP7E_EXPECTED_CHUNK_COUNT)
  );
  const missingChunkIndices = Array.from(
    { length: STEP7E_EXPECTED_CHUNK_COUNT },
    (_, index) => index
  ).filter(index => !presentChunkIndices.has(index));
  const bootstrapRequired = !ready
    && metadataValidation.reason === "CHUNK_COUNT_MISMATCH"
    && missingChunkIndices.length > 0;

  const base = {
    ok: ready,
    step: "7E",
    ready,
    terminalCandidate: ready ? "STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS" : null,
    recipeCount: audit.totals.recipeCount,
    expectedRecipeCount: STEP7E_EXPECTED_RECIPE_COUNT,
    chunkCount: audit.chunkRows.length,
    expectedChunkCount: STEP7E_EXPECTED_CHUNK_COUNT,
    totalBodyBytes: audit.totals.totalBodyBytes,
    expectedTotalBodyBytes: publicStep7eManifest().totalBodyBytes,
    fingerprint: storedFingerprint,
    expectedFingerprint: STEP7E_EXPECTED_FINGERPRINT,
    metadataValidation,
    boundaries: publicStep7eManifest().boundaries,
    metrics: {
      elapsedMs: roundedElapsedMs(startedAt),
      pilotQueries: 4,
      auditReadAttempts: audit.attempts,
      chunkMetadataRead: summarizeD1Meta(audit.chunkMeta)
    }
  };

  if (!ready) {
    return jsonResponse({
      ...base,
      error: "STEP7E_PILOT_INCOMPLETE_OR_MISMATCH",
      bootstrapRequired,
      missingChunkIndices: bootstrapRequired ? missingChunkIndices : [],
      protectedDataReturned: false
    }, 409);
  }

  if (url.searchParams.get("sample") !== "1") {
    return jsonResponse({ ...base, bootstrapRequired: false, protectedDataReturned: false });
  }

  let sample;
  try {
    sample = await db.prepare(
      `SELECT ordinal, source_item_id, body_json, body_bytes, packet_sha256
       FROM ${STEP7E_PILOT_TABLE}
       WHERE ordinal = 0
       LIMIT 1`
    ).first();
  } catch {
    return jsonResponse({ ok: false, step: "7E", error: "STEP7E_SAMPLE_READ_FAILED", protectedDataReturned: false }, 503);
  }
  if (!sample?.body_json) {
    return jsonResponse({ ok: false, step: "7E", error: "STEP7E_SAMPLE_MISSING", protectedDataReturned: false }, 409);
  }

  let packet;
  try {
    packet = JSON.parse(sample.body_json);
  } catch {
    return jsonResponse({ ok: false, step: "7E", error: "STEP7E_SAMPLE_JSON_INVALID", protectedDataReturned: false }, 500);
  }

  return jsonResponse({
    ...base,
    bootstrapRequired: false,
    protectedDataReturned: true,
    sample: {
      ordinal: Number(sample.ordinal),
      sourceItemId: String(sample.source_item_id),
      bodyBytes: Number(sample.body_bytes),
      packetSha256: String(sample.packet_sha256),
      packet
    },
    metrics: {
      ...base.metrics,
      pilotQueries: 5
    }
  });
}
