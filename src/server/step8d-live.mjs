import plan from "../../data/generated/step8d/population-plan-descriptors.json" with { type: "json" };
import manifest from "../../data/generated/step8d/manifest.json" with { type: "json" };

import {
  STEP8B_LIVE_CORPUS_VERSION,
  STEP8B_LIVE_SHARD_SPECS,
  STEP8B_RECEIPT_TABLE,
  STEP8B_RECEIPT_TABLE_SQL,
  STEP8B_RECIPE_TABLE,
  STEP8B_RECIPE_TABLE_SQL,
  sha256Hex
} from "./step8b-live.mjs";
import { validateStep8DProtectedPacket } from "../shared/step8d-packet.mjs";

const encoder = new TextEncoder();

export const STEP8D_LIVE_CONTRACT_VERSION = "CORPUS_SCALE_STEP8D_LIVE_POPULATION_V1";
export const STEP8D_CORPUS_VERSION = "v8001";
export const STEP8D_SOURCE_COHORT_ID = "unitools-world-recipes-v1_1_0";
export const STEP8D_LIVE_SHARD_SPECS = STEP8B_LIVE_SHARD_SPECS;
export const STEP8D_POINTER_TABLE = "corpus_protected_active_version";
export const STEP8D_POINTER_SCOPE = "step8d-protected-recipe-corpus";
export const STEP8D_POINTER_BASELINE_VERSION = STEP8B_LIVE_CORPUS_VERSION;
export const STEP8D_EXPECTED_RECIPE_COUNT = 501;
export const STEP8D_EXPECTED_BATCH_COUNT = 51;
export const STEP8D_MAX_ROWS_PER_BATCH = 10;
export const STEP8D_MAX_PROTECTED_D1_SUBQUERIES = 16;

export const STEP8D_POINTER_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8D_POINTER_TABLE} (
  scope TEXT PRIMARY KEY,
  active_version TEXT NOT NULL,
  previous_version TEXT,
  manifest_sha256 TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const expectedBatches = plan.batches.map(batch => ({
  batchId: String(batch.batchId),
  shardNumber: Number(batch.shardNumber),
  batchNumber: Number(batch.batchNumber),
  rowCount: Number(batch.rowCount),
  totalBodyBytes: Number(batch.totalBodyBytes),
  expectedSha256: String(batch.expectedSha256),
  entries: batch.entries.map(entry => ({
    ordinal: Number(entry.ordinal),
    recipeId: String(entry.recipeId),
    bodySha256: String(entry.bodySha256),
    bodyBytes: Number(entry.bodyBytes),
    sourceCohortId: String(entry.sourceCohortId)
  }))
}));

const batchById = new Map(expectedBatches.map(batch => [batch.batchId, batch]));
const expectedBatchIdsByShard = STEP8D_LIVE_SHARD_SPECS.map(spec => expectedBatches
  .filter(batch => batch.shardNumber === spec.shardNumber)
  .map(batch => batch.batchId));
const crossShardCanaries = STEP8D_LIVE_SHARD_SPECS.map(spec => {
  const batch = expectedBatches.find(candidate => candidate.shardNumber === spec.shardNumber);
  return { shardNumber: spec.shardNumber, ...batch.entries[0] };
});

function utf8Bytes(value) {
  return encoder.encode(String(value)).byteLength;
}

function descriptorForIncoming(entry) {
  return {
    ordinal: Number(entry.ordinal),
    recipeId: String(entry.recipeId || ""),
    bodySha256: String(entry.bodySha256 || ""),
    bodyBytes: Number(entry.bodyBytes),
    sourceCohortId: String(entry.sourceCohortId || "")
  };
}

function publicBatch(batch) {
  return {
    batchId: batch.batchId,
    shardNumber: batch.shardNumber,
    batchNumber: batch.batchNumber,
    rowCount: batch.rowCount,
    totalBodyBytes: batch.totalBodyBytes,
    expectedSha256: batch.expectedSha256,
    entries: batch.entries
  };
}

export function publicStep8DPlanSummary() {
  return {
    contractVersion: STEP8D_LIVE_CONTRACT_VERSION,
    corpusVersion: STEP8D_CORPUS_VERSION,
    sourceCohortId: STEP8D_SOURCE_COHORT_ID,
    recipeCount: STEP8D_EXPECTED_RECIPE_COUNT,
    batchCount: STEP8D_EXPECTED_BATCH_COUNT,
    shardCount: STEP8D_LIVE_SHARD_SPECS.length,
    maxRowsPerBatch: STEP8D_MAX_ROWS_PER_BATCH,
    maxProtectedD1Subqueries: STEP8D_MAX_PROTECTED_D1_SUBQUERIES,
    manifestSha256: manifest.manifestSha256,
    step8APopulationManifestSha256: plan.manifestSha256,
    populationPlanSha256: plan.populationPlanSha256,
    shardRows: manifest.routing.descriptors.map(descriptor => ({
      shardNumber: Number(descriptor.shardNumber),
      rowCount: Number(descriptor.rowCount),
      totalBodyBytes: Number(descriptor.totalBodyBytes),
      entriesSha256: String(descriptor.entriesSha256)
    })),
    batches: expectedBatches.map(publicBatch)
  };
}

export async function validateStep8DIncomingBatch(payload = {}) {
  const batchId = String(payload.batchId || "");
  const expected = batchById.get(batchId);
  if (!expected) return { pass: false, reason: "UNKNOWN_BATCH_ID" };
  if (!Array.isArray(payload.entries) || payload.entries.length !== expected.rowCount) {
    return { pass: false, reason: "BATCH_ROW_COUNT_MISMATCH" };
  }
  if (payload.entries.length > STEP8D_MAX_ROWS_PER_BATCH) return { pass: false, reason: "BATCH_ROW_LIMIT_EXCEEDED" };

  const validatedEntries = [];
  for (const incoming of payload.entries) {
    if (typeof incoming?.bodyJson !== "string") return { pass: false, reason: "BODY_JSON_REQUIRED" };
    const descriptor = descriptorForIncoming(incoming);
    const observedBytes = utf8Bytes(incoming.bodyJson);
    const observedSha256 = await sha256Hex(incoming.bodyJson);
    if (descriptor.bodyBytes !== observedBytes || descriptor.bodySha256 !== observedSha256) {
      return { pass: false, reason: "BODY_DESCRIPTOR_MISMATCH", recipeId: descriptor.recipeId };
    }
    let packet;
    try {
      packet = JSON.parse(incoming.bodyJson);
      validateStep8DProtectedPacket(packet);
    } catch {
      return { pass: false, reason: "PROTECTED_PACKET_SCHEMA_MISMATCH", recipeId: descriptor.recipeId };
    }
    if (
      packet.identity?.recipeId !== descriptor.recipeId
      || Number(packet.identity?.sourceOrdinal) !== descriptor.ordinal
      || packet.provenance?.sourceCohortId !== descriptor.sourceCohortId
    ) {
      return { pass: false, reason: "PACKET_IDENTITY_MISMATCH", recipeId: descriptor.recipeId };
    }
    validatedEntries.push({ ...descriptor, bodyJson: incoming.bodyJson });
  }

  const descriptorEntries = validatedEntries.map(descriptorForIncoming);
  const fingerprintCore = {
    shardNumber: expected.shardNumber,
    batchNumber: expected.batchNumber,
    entries: descriptorEntries
  };
  const observedBatchSha256 = await sha256Hex(JSON.stringify(fingerprintCore));
  if (observedBatchSha256 !== expected.expectedSha256) {
    return { pass: false, reason: "BATCH_FINGERPRINT_MISMATCH" };
  }
  if (descriptorEntries.reduce((sum, entry) => sum + entry.bodyBytes, 0) !== expected.totalBodyBytes) {
    return { pass: false, reason: "BATCH_BODY_BYTES_MISMATCH" };
  }

  return {
    pass: true,
    batch: {
      ...expected,
      entries: validatedEntries
    }
  };
}

export async function ensureStep8DShardSchema(db) {
  await db.prepare(STEP8B_RECIPE_TABLE_SQL).run();
  await db.prepare(STEP8B_RECEIPT_TABLE_SQL).run();
  return { initialized: true, d1Subqueries: 2 };
}

export async function readStep8DReceipt(db, expectedBatch) {
  const row = await db.prepare(
    `SELECT expected_sha256, row_count, verified
     FROM ${STEP8B_RECEIPT_TABLE}
     WHERE corpus_version = ? AND batch_id = ?
     LIMIT 1`
  ).bind(STEP8D_CORPUS_VERSION, expectedBatch.batchId).first();
  if (!row) return { status: "ABSENT", d1Subqueries: 1 };
  if (String(row.expected_sha256) !== expectedBatch.expectedSha256 || Number(row.row_count) !== expectedBatch.rowCount) {
    return { status: "CONFLICT_FAIL_CLOSED", d1Subqueries: 1 };
  }
  if (Number(row.verified) === 1) return { status: "VERIFIED", d1Subqueries: 1 };
  if (Number(row.verified) === 0) return { status: "PENDING_VERIFICATION", d1Subqueries: 1 };
  return { status: "CONFLICT_FAIL_CLOSED", d1Subqueries: 1 };
}

export async function verifyStep8DBatchRows(db, batch) {
  const placeholders = batch.entries.map(() => "?").join(", ");
  const rows = await db.prepare(
    `SELECT ordinal, recipe_id, body_sha256, body_bytes, source_cohort_id
     FROM ${STEP8B_RECIPE_TABLE}
     WHERE corpus_version = ? AND recipe_id IN (${placeholders})`
  ).bind(STEP8D_CORPUS_VERSION, ...batch.entries.map(entry => entry.recipeId)).all();
  const actual = new Map((rows?.results || []).map(row => [String(row.recipe_id), row]));
  const mismatch = batch.entries.find(entry => {
    const row = actual.get(entry.recipeId);
    return !row
      || Number(row.ordinal) !== entry.ordinal
      || String(row.body_sha256) !== entry.bodySha256
      || Number(row.body_bytes) !== entry.bodyBytes
      || String(row.source_cohort_id) !== entry.sourceCohortId;
  });
  return {
    pass: !mismatch && actual.size === batch.rowCount,
    rowCount: actual.size,
    d1Subqueries: 1
  };
}

async function promoteStep8DReceipt(db, batch) {
  const result = await db.prepare(
    `UPDATE ${STEP8B_RECEIPT_TABLE}
     SET verified = 1
     WHERE corpus_version = ? AND batch_id = ?
       AND expected_sha256 = ? AND row_count = ? AND verified = 0`
  ).bind(
    STEP8D_CORPUS_VERSION,
    batch.batchId,
    batch.expectedSha256,
    batch.rowCount
  ).run();
  return { pass: Number(result?.meta?.changes ?? 0) === 1, d1Subqueries: 1 };
}

export async function writeStep8DBatch(db, batch) {
  const prior = await readStep8DReceipt(db, batch);
  if (prior.status === "CONFLICT_FAIL_CLOSED") {
    return { pass: false, skipped: false, status: prior.status, d1Subqueries: prior.d1Subqueries };
  }
  if (prior.status === "VERIFIED") {
    const rows = await verifyStep8DBatchRows(db, batch);
    return {
      pass: rows.pass,
      skipped: rows.pass,
      status: rows.pass ? "VERIFIED_IDEMPOTENT_SKIP" : "VERIFIED_RECEIPT_ROW_MISMATCH_FAIL_CLOSED",
      rowCount: rows.rowCount,
      d1Subqueries: prior.d1Subqueries + rows.d1Subqueries
    };
  }
  if (prior.status === "PENDING_VERIFICATION") {
    const rows = await verifyStep8DBatchRows(db, batch);
    if (!rows.pass) {
      return {
        pass: false,
        skipped: false,
        status: "PENDING_RECEIPT_ROW_MISMATCH_FAIL_CLOSED",
        rowCount: rows.rowCount,
        d1Subqueries: prior.d1Subqueries + rows.d1Subqueries
      };
    }
    const promoted = await promoteStep8DReceipt(db, batch);
    return {
      pass: promoted.pass,
      skipped: false,
      recovered: promoted.pass,
      status: promoted.pass ? "RECOVERED_UNKNOWN_COMMIT_AND_VERIFIED" : "RECEIPT_PROMOTION_FAILED",
      rowCount: rows.rowCount,
      d1Subqueries: prior.d1Subqueries + rows.d1Subqueries + promoted.d1Subqueries
    };
  }
  if (typeof db.batch !== "function") {
    return { pass: false, skipped: false, status: "D1_BATCH_UNAVAILABLE", d1Subqueries: prior.d1Subqueries };
  }

  const statements = batch.entries.map(entry => db.prepare(
    `INSERT OR ABORT INTO ${STEP8B_RECIPE_TABLE}
      (corpus_version, ordinal, recipe_id, body_json, body_bytes, body_sha256, source_cohort_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    STEP8D_CORPUS_VERSION,
    entry.ordinal,
    entry.recipeId,
    entry.bodyJson,
    entry.bodyBytes,
    entry.bodySha256,
    entry.sourceCohortId
  ));
  statements.push(db.prepare(
    `INSERT OR ABORT INTO ${STEP8B_RECEIPT_TABLE}
      (corpus_version, batch_id, expected_sha256, row_count, verified)
     VALUES (?, ?, ?, ?, 0)`
  ).bind(
    STEP8D_CORPUS_VERSION,
    batch.batchId,
    batch.expectedSha256,
    batch.rowCount
  ));

  try {
    await db.batch(statements);
  } catch {
    return {
      pass: false,
      skipped: false,
      status: "WRITE_ERROR_UNKNOWN_COMMIT_STATE",
      d1Subqueries: prior.d1Subqueries + statements.length
    };
  }

  const rows = await verifyStep8DBatchRows(db, batch);
  if (!rows.pass) {
    return {
      pass: false,
      skipped: false,
      status: "POST_WRITE_ROW_VERIFICATION_MISMATCH",
      rowCount: rows.rowCount,
      d1Subqueries: prior.d1Subqueries + statements.length + rows.d1Subqueries
    };
  }
  const promoted = await promoteStep8DReceipt(db, batch);
  return {
    pass: promoted.pass,
    skipped: false,
    status: promoted.pass ? "WRITTEN_AND_EXACTLY_VERIFIED" : "RECEIPT_PROMOTION_FAILED",
    rowCount: rows.rowCount,
    d1Subqueries: prior.d1Subqueries + statements.length + rows.d1Subqueries + promoted.d1Subqueries
  };
}

export async function readStep8DProgress(shardDbs) {
  const completedBatchIds = [];
  const pendingVerificationBatchIds = [];
  const conflicts = [];
  const observed = [];
  let d1Subqueries = 0;

  for (const spec of STEP8D_LIVE_SHARD_SPECS) {
    const rows = await shardDbs[spec.shardNumber].prepare(
      `SELECT batch_id, expected_sha256, row_count, verified
       FROM ${STEP8B_RECEIPT_TABLE}
       WHERE corpus_version = ?
       ORDER BY batch_id`
    ).bind(STEP8D_CORPUS_VERSION).all();
    d1Subqueries += 1;
    for (const row of rows?.results || []) {
      const batchId = String(row.batch_id || "");
      const expected = batchById.get(batchId);
      const item = {
        batchId,
        shardNumber: spec.shardNumber,
        expectedSha256: String(row.expected_sha256 || ""),
        rowCount: Number(row.row_count || 0),
        verified: Number(row.verified || 0)
      };
      observed.push(item);
      if (!expected || expected.shardNumber !== spec.shardNumber) {
        conflicts.push({ batchId, reason: "UNKNOWN_OR_WRONG_SHARD_RECEIPT" });
        continue;
      }
      if (item.expectedSha256 !== expected.expectedSha256 || item.rowCount !== expected.rowCount) {
        conflicts.push({ batchId, reason: "RECEIPT_FINGERPRINT_OR_COUNT_MISMATCH" });
        continue;
      }
      if (item.verified === 1) completedBatchIds.push(batchId);
      else if (item.verified === 0) pendingVerificationBatchIds.push(batchId);
      else conflicts.push({ batchId, reason: "INVALID_RECEIPT_VERIFIED_STATE" });
    }
  }

  const completed = new Set(completedBatchIds);
  const pendingReceiptIds = new Set(pendingVerificationBatchIds);
  const missingBatchIds = expectedBatches
    .map(batch => batch.batchId)
    .filter(batchId => !completed.has(batchId) && !pendingReceiptIds.has(batchId));
  const verifiedRowCount = completedBatchIds.reduce((sum, batchId) => sum + batchById.get(batchId).rowCount, 0);
  const completeVerified = conflicts.length === 0
    && pendingVerificationBatchIds.length === 0
    && missingBatchIds.length === 0
    && completedBatchIds.length === STEP8D_EXPECTED_BATCH_COUNT
    && verifiedRowCount === STEP8D_EXPECTED_RECIPE_COUNT;

  return {
    pass: conflicts.length === 0,
    completeVerified,
    completedBatchIds: completedBatchIds.sort(),
    pendingVerificationBatchIds: pendingVerificationBatchIds.sort(),
    missingBatchIds,
    conflicts,
    verifiedBatchCount: completedBatchIds.length,
    verifiedRowCount,
    expectedBatchCount: STEP8D_EXPECTED_BATCH_COUNT,
    expectedRecipeCount: STEP8D_EXPECTED_RECIPE_COUNT,
    observedReceiptCount: observed.length,
    fullCorpusScans: 0,
    d1Subqueries
  };
}

export async function readStep8DCrossShard(shardDbs) {
  const rows = [];
  let d1Subqueries = 0;
  for (const expected of crossShardCanaries) {
    const row = await shardDbs[expected.shardNumber].prepare(
      `SELECT recipe_id, body_sha256, body_bytes, source_cohort_id
       FROM ${STEP8B_RECIPE_TABLE}
       WHERE corpus_version = ? AND recipe_id = ?
       LIMIT 1`
    ).bind(STEP8D_CORPUS_VERSION, expected.recipeId).first();
    d1Subqueries += 1;
    if (
      !row
      || String(row.recipe_id) !== expected.recipeId
      || String(row.body_sha256) !== expected.bodySha256
      || Number(row.body_bytes) !== expected.bodyBytes
      || String(row.source_cohort_id) !== expected.sourceCohortId
    ) {
      return { pass: false, rows, d1Subqueries };
    }
    rows.push({
      shardNumber: expected.shardNumber,
      recipeId: expected.recipeId,
      bodySha256: expected.bodySha256,
      bodyBytes: expected.bodyBytes
    });
  }
  return { pass: rows.length === STEP8D_LIVE_SHARD_SPECS.length, rows, d1Subqueries };
}

export async function initializeStep8DPointer(controlDb) {
  await controlDb.prepare(STEP8D_POINTER_TABLE_SQL).run();
  await controlDb.prepare(
    `INSERT OR IGNORE INTO ${STEP8D_POINTER_TABLE}
      (scope, active_version, previous_version, manifest_sha256)
     VALUES (?, ?, NULL, NULL)`
  ).bind(STEP8D_POINTER_SCOPE, STEP8D_POINTER_BASELINE_VERSION).run();
  return { initialized: true, d1Subqueries: 2 };
}

export async function readStep8DPointer(controlDb) {
  const row = await controlDb.prepare(
    `SELECT active_version, previous_version, manifest_sha256
     FROM ${STEP8D_POINTER_TABLE}
     WHERE scope = ?
     LIMIT 1`
  ).bind(STEP8D_POINTER_SCOPE).first();
  return {
    activeVersion: row?.active_version ? String(row.active_version) : null,
    previousVersion: row?.previous_version ? String(row.previous_version) : null,
    manifestSha256: row?.manifest_sha256 ? String(row.manifest_sha256) : null,
    d1Subqueries: 1
  };
}

async function switchStep8DPointer(controlDb, activeVersion, previousVersion, manifestSha256) {
  const result = await controlDb.prepare(
    `UPDATE ${STEP8D_POINTER_TABLE}
     SET active_version = ?, previous_version = ?, manifest_sha256 = ?, updated_at = CURRENT_TIMESTAMP
     WHERE scope = ?`
  ).bind(activeVersion, previousVersion, manifestSha256, STEP8D_POINTER_SCOPE).run();
  const changes = Number(result?.meta?.changes ?? 0);
  if (changes !== 1) return { pass: false, d1Subqueries: 1 };
  const pointer = await readStep8DPointer(controlDb);
  return {
    pass: pointer.activeVersion === activeVersion
      && pointer.previousVersion === previousVersion
      && pointer.manifestSha256 === manifestSha256,
    pointer,
    d1Subqueries: 1 + pointer.d1Subqueries
  };
}

export async function activateStep8DPointer(controlDb) {
  const current = await readStep8DPointer(controlDb);
  if (current.activeVersion === STEP8D_CORPUS_VERSION && current.manifestSha256 === manifest.manifestSha256) {
    return { pass: true, skipped: true, pointer: current, d1Subqueries: current.d1Subqueries };
  }
  if (current.activeVersion !== STEP8D_POINTER_BASELINE_VERSION) {
    return { pass: false, reason: "BASELINE_POINTER_NOT_ACTIVE", pointer: current, d1Subqueries: current.d1Subqueries };
  }
  const switched = await switchStep8DPointer(
    controlDb,
    STEP8D_CORPUS_VERSION,
    STEP8D_POINTER_BASELINE_VERSION,
    manifest.manifestSha256
  );
  return { ...switched, reason: switched.pass ? "STEP8D_POINTER_ACTIVATED" : "POINTER_SWITCH_FAILED", d1Subqueries: current.d1Subqueries + switched.d1Subqueries };
}

export async function rollbackStep8DPointer(controlDb) {
  const current = await readStep8DPointer(controlDb);
  if (current.activeVersion === STEP8D_POINTER_BASELINE_VERSION && current.previousVersion === STEP8D_CORPUS_VERSION) {
    return { pass: true, skipped: true, pointer: current, d1Subqueries: current.d1Subqueries };
  }
  if (current.activeVersion !== STEP8D_CORPUS_VERSION || current.previousVersion !== STEP8D_POINTER_BASELINE_VERSION) {
    return { pass: false, reason: "STEP8D_POINTER_NOT_ACTIVE", pointer: current, d1Subqueries: current.d1Subqueries };
  }
  const switched = await switchStep8DPointer(
    controlDb,
    STEP8D_POINTER_BASELINE_VERSION,
    STEP8D_CORPUS_VERSION,
    manifest.manifestSha256
  );
  return { ...switched, reason: switched.pass ? "STEP8D_POINTER_ROLLED_BACK" : "POINTER_SWITCH_FAILED", d1Subqueries: current.d1Subqueries + switched.d1Subqueries };
}

export function expectedStep8DBatch(batchId) {
  const batch = batchById.get(String(batchId || ""));
  return batch ? publicBatch(batch) : null;
}
