import {
  STEP7E_LIVE_MANIFEST,
  step7eChunkBase64
} from "../data/external/generated/forkrecipe-step7e-live/index.mjs";

const encoder = new TextEncoder();

export const STEP7E_PILOT_TABLE = "step7e_source_pilot";
export const STEP7E_CHUNK_TABLE = "step7e_source_pilot_chunks";
export const STEP7E_EXPECTED_RECIPE_COUNT = STEP7E_LIVE_MANIFEST.liveRecipeCount;
export const STEP7E_EXPECTED_CHUNK_COUNT = STEP7E_LIVE_MANIFEST.chunkCount;
export const STEP7E_EXPECTED_FINGERPRINT = STEP7E_LIVE_MANIFEST.livePilotFingerprintSha256;

function bytesFromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function gunzipText(base64) {
  const compressed = bytesFromBase64(base64);
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

export function expectedStep7eChunk(index) {
  if (!Number.isInteger(index) || index < 0 || index >= STEP7E_EXPECTED_CHUNK_COUNT) return null;
  return STEP7E_LIVE_MANIFEST.chunks[index] || null;
}

export function normalizeStep7eChunkRows(value) {
  if (!Array.isArray(value)) throw new Error("STEP7E_CHUNK_ROWS_REQUIRED");
  return value.map((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== 5) throw new Error(`STEP7E_CHUNK_ROW_${rowIndex}_INVALID`);
    const [ordinal, sourceItemId, bodyJson, bodyBytes, packetSha256] = row;
    const normalized = {
      ordinal: Number(ordinal),
      sourceItemId: String(sourceItemId || ""),
      bodyJson: String(bodyJson || ""),
      bodyBytes: Number(bodyBytes),
      packetSha256: String(packetSha256 || "")
    };
    if (!Number.isInteger(normalized.ordinal) || normalized.ordinal < 0) throw new Error(`STEP7E_CHUNK_ROW_${rowIndex}_ORDINAL_INVALID`);
    if (!normalized.sourceItemId) throw new Error(`STEP7E_CHUNK_ROW_${rowIndex}_SOURCE_ID_INVALID`);
    if (!normalized.bodyJson) throw new Error(`STEP7E_CHUNK_ROW_${rowIndex}_BODY_INVALID`);
    if (!Number.isInteger(normalized.bodyBytes) || normalized.bodyBytes <= 0) throw new Error(`STEP7E_CHUNK_ROW_${rowIndex}_BYTES_INVALID`);
    if (!/^[0-9a-f]{64}$/.test(normalized.packetSha256)) throw new Error(`STEP7E_CHUNK_ROW_${rowIndex}_PACKET_SHA_INVALID`);
    if (encoder.encode(normalized.bodyJson).byteLength !== normalized.bodyBytes) throw new Error(`STEP7E_CHUNK_ROW_${rowIndex}_BYTE_COUNT_MISMATCH`);
    return normalized;
  });
}

export async function step7eChunkFingerprint(rows) {
  const payload = rows
    .map(row => `${Number(row.ordinal)}\u0000${String(row.sourceItemId ?? row.source_item_id ?? "")}\u0000${String(row.bodyJson ?? row.body_json ?? "")}`)
    .join("\n");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function loadStep7eChunk(index) {
  const descriptor = expectedStep7eChunk(index);
  if (!descriptor) throw new Error("STEP7E_CHUNK_INDEX_INVALID");
  const base64 = step7eChunkBase64(index);
  if (!base64) throw new Error("STEP7E_CHUNK_PAYLOAD_MISSING");
  const rows = normalizeStep7eChunkRows(JSON.parse(await gunzipText(base64)));
  if (rows.length !== descriptor.recipeCount) throw new Error("STEP7E_CHUNK_COUNT_MISMATCH");
  if (rows[0]?.ordinal !== descriptor.firstOrdinal || rows.at(-1)?.ordinal !== descriptor.lastOrdinal) {
    throw new Error("STEP7E_CHUNK_ORDINAL_RANGE_MISMATCH");
  }
  if (rows[0]?.sourceItemId !== descriptor.firstSourceItemId || rows.at(-1)?.sourceItemId !== descriptor.lastSourceItemId) {
    throw new Error("STEP7E_CHUNK_SOURCE_RANGE_MISMATCH");
  }
  const fingerprint = await step7eChunkFingerprint(rows);
  if (fingerprint !== descriptor.chunkSha256) throw new Error("STEP7E_CHUNK_FINGERPRINT_MISMATCH");
  const bodyBytes = rows.reduce((sum, row) => sum + row.bodyBytes, 0);
  if (bodyBytes !== descriptor.bodyBytes) throw new Error("STEP7E_CHUNK_BODY_BYTES_MISMATCH");
  return { descriptor, rows, fingerprint };
}

export async function step7eStoredChunkFingerprint(rows) {
  return step7eChunkFingerprint(rows.map(row => ({
    ordinal: row.ordinal,
    sourceItemId: row.source_item_id,
    bodyJson: row.body_json
  })));
}

export function step7ePilotFingerprint(chunkRows) {
  const hashes = chunkRows.map(row => String(row.chunk_sha256 ?? row.chunkSha256 ?? ""));
  return hashes.join("\n");
}

export async function step7ePilotFingerprintSha256(chunkRows) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(step7ePilotFingerprint(chunkRows)));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export function validateStoredStep7eChunkMetadata(rows) {
  if (!Array.isArray(rows) || rows.length !== STEP7E_EXPECTED_CHUNK_COUNT) {
    return { pass: false, reason: "CHUNK_COUNT_MISMATCH" };
  }
  let totalRecipes = 0;
  let totalBodyBytes = 0;
  for (let index = 0; index < rows.length; index += 1) {
    const stored = rows[index];
    const expected = expectedStep7eChunk(index);
    if (!expected || Number(stored.chunk_index) !== index) return { pass: false, reason: "CHUNK_INDEX_MISMATCH", chunkIndex: index };
    if (Number(stored.first_ordinal) !== expected.firstOrdinal) return { pass: false, reason: "FIRST_ORDINAL_MISMATCH", chunkIndex: index };
    if (Number(stored.recipe_count) !== expected.recipeCount) return { pass: false, reason: "RECIPE_COUNT_MISMATCH", chunkIndex: index };
    if (String(stored.chunk_sha256 || "") !== expected.chunkSha256) return { pass: false, reason: "CHUNK_SHA_MISMATCH", chunkIndex: index };
    if (Number(stored.total_body_bytes) !== expected.bodyBytes) return { pass: false, reason: "BODY_BYTES_MISMATCH", chunkIndex: index };
    if (String(stored.source_commit || "") !== STEP7E_LIVE_MANIFEST.sourceCommit) return { pass: false, reason: "SOURCE_COMMIT_MISMATCH", chunkIndex: index };
    totalRecipes += Number(stored.recipe_count);
    totalBodyBytes += Number(stored.total_body_bytes);
  }
  return {
    pass: totalRecipes === STEP7E_EXPECTED_RECIPE_COUNT && totalBodyBytes === STEP7E_LIVE_MANIFEST.totalBodyBytes,
    reason: totalRecipes === STEP7E_EXPECTED_RECIPE_COUNT && totalBodyBytes === STEP7E_LIVE_MANIFEST.totalBodyBytes ? null : "TOTAL_MISMATCH",
    totalRecipes,
    totalBodyBytes
  };
}

export function publicStep7eManifest() {
  return {
    schemaVersion: STEP7E_LIVE_MANIFEST.schemaVersion,
    sourceCommit: STEP7E_LIVE_MANIFEST.sourceCommit,
    sourceUniverseCount: STEP7E_LIVE_MANIFEST.sourceUniverseCount,
    liveRecipeCount: STEP7E_LIVE_MANIFEST.liveRecipeCount,
    chunkSize: STEP7E_LIVE_MANIFEST.chunkSize,
    chunkCount: STEP7E_LIVE_MANIFEST.chunkCount,
    totalBodyBytes: STEP7E_LIVE_MANIFEST.totalBodyBytes,
    totalCompressedBytes: STEP7E_LIVE_MANIFEST.totalCompressedBytes,
    livePilotFingerprintSha256: STEP7E_LIVE_MANIFEST.livePilotFingerprintSha256,
    boundaries: STEP7E_LIVE_MANIFEST.boundaries
  };
}
