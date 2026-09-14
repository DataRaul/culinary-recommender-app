import { STEP8G_RUNTIME_DESCRIPTOR as runtimeDescriptor } from "../../data/generated/step8g/runtime-descriptor.mjs";
import {
  STEP8B_LIVE_SHARD_SPECS,
  STEP8B_RECEIPT_TABLE,
  STEP8B_RECEIPT_TABLE_SQL,
  STEP8B_RECIPE_TABLE,
  STEP8B_RECIPE_TABLE_SQL,
  sha256Hex
} from "./step8b-live.mjs";

const encoder = new TextEncoder();

export const STEP8G_LIVE_CONTRACT_VERSION = "CORPUS_SCALE_STEP8G_FORKRECIPE_LIVE_V1";
export const STEP8G_CORPUS_VERSION = "v8002";
export const STEP8G_PARENT_VERSION = "v8001";
export const STEP8G_SOURCE_COHORT_ID = "FORKRECIPE_PINNED_STEP7E";
export const STEP8G_EXPECTED_RECIPE_COUNT = 915;
export const STEP8G_EXPECTED_BODY_BATCH_COUNT = 93;
export const STEP8G_EXPECTED_ROUTE_COUNT = 1416;
export const STEP8G_MAX_ROWS_PER_BATCH = 10;
export const STEP8G_MAX_HYDRATED_CANDIDATES = 256;
export const STEP8G_MAX_PROTECTED_D1_SUBQUERIES = 16;
export const STEP8G_POINTER_TABLE = "corpus_protected_active_version";
export const STEP8G_POINTER_SCOPE = "step8d-protected-recipe-corpus";
export const STEP8G_ROUTE_TABLE = "corpus_protected_recipe_routes";
export const STEP8G_ROUTE_RECEIPT_TABLE = "corpus_protected_route_receipts";
export const STEP8G_COMPOSITION_VERSION = "v8002";
export const STEP8G_SOURCE_COMMIT = runtimeDescriptor.sourceCommit;
export const STEP8G_LIVE_SHARD_SPECS = STEP8B_LIVE_SHARD_SPECS;

export const STEP8G_POINTER_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8G_POINTER_TABLE} (
  scope TEXT PRIMARY KEY,
  active_version TEXT NOT NULL,
  previous_version TEXT,
  manifest_sha256 TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export const STEP8G_ROUTE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8G_ROUTE_TABLE} (
  composition_version TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  corpus_version TEXT NOT NULL,
  shard_number INTEGER NOT NULL,
  source_cohort_id TEXT NOT NULL,
  body_sha256 TEXT NOT NULL,
  body_bytes INTEGER NOT NULL,
  PRIMARY KEY (composition_version, recipe_id),
  UNIQUE (composition_version, corpus_version, recipe_id)
)`;

export const STEP8G_ROUTE_RECEIPT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8G_ROUTE_RECEIPT_TABLE} (
  composition_version TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  expected_sha256 TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  verified INTEGER NOT NULL CHECK (verified IN (0, 1)),
  PRIMARY KEY (composition_version, batch_id)
)`;

const SOURCE_RECIPE_KEYS = Object.freeze([
  "repoId", "parentRepoId", "slug", "author", "title", "description", "cuisine", "culture",
  "category", "tags", "difficulty", "activeTime", "totalTime", "ratioSystem", "stars", "forks",
  "contributors", "license", "createdAt", "updatedAt", "flavorRadar", "ingredients", "processNodes",
  "parentSlug", "forkNote", "changes"
]);
const VALID_RATIO_SYSTEMS = new Set(["parts", "weight", "bakers_percentage"]);

const bodyBatches = runtimeDescriptor.bodyShaByShard.flatMap((hashes, shardNumber) => hashes.map((expectedSha256, batchNumber) => {
  const remaining = Number(runtimeDescriptor.bodyShardRows[shardNumber]) - (batchNumber * STEP8G_MAX_ROWS_PER_BATCH);
  return {
    batchId: `s${String(shardNumber).padStart(2, "0")}-b${String(batchNumber).padStart(6, "0")}`,
    shardNumber,
    batchNumber,
    rowCount: Math.min(STEP8G_MAX_ROWS_PER_BATCH, remaining),
    expectedSha256: String(expectedSha256)
  };
}));
const routeBatches = [];
for (const [corpusVersion, shardRows] of [
  [STEP8G_PARENT_VERSION, runtimeDescriptor.parentShardRows],
  [STEP8G_CORPUS_VERSION, runtimeDescriptor.bodyShardRows]
]) {
  for (let shardNumber = 0; shardNumber < shardRows.length; shardNumber += 1) {
    const rowCount = Number(shardRows[shardNumber]);
    const batchCount = Math.ceil(rowCount / STEP8G_MAX_ROWS_PER_BATCH);
    for (let batchNumber = 0; batchNumber < batchCount; batchNumber += 1) {
      routeBatches.push({
        batchId: `route-${corpusVersion}-s${String(shardNumber).padStart(2, "0")}-b${String(batchNumber).padStart(6, "0")}`,
        corpusVersion,
        shardNumber,
        batchNumber,
        rowCount: Math.min(STEP8G_MAX_ROWS_PER_BATCH, rowCount - (batchNumber * STEP8G_MAX_ROWS_PER_BATCH))
      });
    }
  }
}
const bodyBatchById = new Map(bodyBatches.map(batch => [batch.batchId, batch]));
const routeBatchById = new Map(routeBatches.map(batch => [batch.batchId, batch]));

function utf8Bytes(value) {
  return encoder.encode(String(value)).byteLength;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function sanitizeSourceRecord(recipe) {
  const output = {};
  for (const key of SOURCE_RECIPE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(recipe || {}, key)) output[key] = structuredClone(recipe[key]);
  }
  return output;
}

function validateSourceRecord(recipe, fileName) {
  if (!isObject(recipe)) return false;
  const expectedSlug = String(fileName || "").replace(/\.js$/i, "");
  if (!expectedSlug || recipe.slug !== expectedSlug) return false;
  if (!String(recipe.repoId || "").trim() || !String(recipe.author || "").trim() || !String(recipe.title || "").trim()) return false;
  if (recipe.license !== "CC-BY-SA" || !VALID_RATIO_SYSTEMS.has(recipe.ratioSystem)) return false;
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return false;
  if (!Array.isArray(recipe.processNodes) || recipe.processNodes.length === 0) return false;
  return true;
}

async function buildForkRecipeBody(recipe, fileName) {
  if (!validateSourceRecord(recipe, fileName)) throw new Error("SOURCE_RECORD_SCHEMA_MISMATCH");
  const sourcePath = `recipes/${fileName}`;
  const sourceUrl = `https://github.com/futurechef/forkrecipe-recipes/blob/${STEP8G_SOURCE_COMMIT}/${sourcePath}`;
  const packetBase = {
    schemaVersion: "forkrecipe-step7e-source-packet-v1",
    sourceId: STEP8G_SOURCE_COHORT_ID,
    sourceItemId: String(recipe.slug || ""),
    sourceVersionId: STEP8G_SOURCE_COMMIT,
    canonicalRecipeId: `forkrecipe_${String(recipe.slug || "").replace(/-/g, "_")}`,
    sourcePath,
    sourceUrl,
    immutableLocator: sourceUrl,
    rights: {
      sourceRightsVerified: true,
      license: "CC-BY-SA-4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      recordLicenseDeclaration: recipe.license ?? null,
      attribution: `ForkRecipe / ${String(recipe.author || "unknown author")}; pinned source file ${sourcePath}`,
      mediaIncluded: false
    },
    boundaries: {
      sourceNutritionImportedAsAuthority: false,
      dietaryOrAllergenClaimsDerived: false,
      recommendationEligible: false,
      publicRuntimeActivationAuthorized: false,
      automaticAdmissionAuthorized: false,
      ratioValuesPromotedToAbsoluteQuantities: false
    },
    sourceRecord: sanitizeSourceRecord(recipe)
  };
  const canonical = stableStringify(packetBase);
  const packet = {
    ...packetBase,
    packetSha256: await sha256Hex(canonical),
    packetBytes: utf8Bytes(canonical)
  };
  const bodyJson = JSON.stringify(packet);
  return {
    recipeId: packet.canonicalRecipeId,
    bodyJson,
    bodySha256: await sha256Hex(bodyJson),
    bodyBytes: utf8Bytes(bodyJson),
    sourceCohortId: STEP8G_SOURCE_COHORT_ID
  };
}

function bodyDescriptor(entry) {
  return {
    ordinal: Number(entry.ordinal),
    recipeId: String(entry.recipeId),
    bodySha256: String(entry.bodySha256),
    bodyBytes: Number(entry.bodyBytes),
    sourceCohortId: String(entry.sourceCohortId)
  };
}

function routeDescriptor(entry) {
  return {
    recipeId: String(entry.recipeId),
    corpusVersion: String(entry.corpusVersion),
    shardNumber: Number(entry.shardNumber),
    sourceCohortId: String(entry.sourceCohortId),
    bodySha256: String(entry.bodySha256),
    bodyBytes: Number(entry.bodyBytes)
  };
}

export function publicStep8GLiveSummary() {
  return {
    contractVersion: STEP8G_LIVE_CONTRACT_VERSION,
    corpusVersion: STEP8G_CORPUS_VERSION,
    parentCorpusVersion: STEP8G_PARENT_VERSION,
    sourceCohortId: STEP8G_SOURCE_COHORT_ID,
    sourceCommit: STEP8G_SOURCE_COMMIT,
    recipeCount: STEP8G_EXPECTED_RECIPE_COUNT,
    cumulativeRecipeCount: STEP8G_EXPECTED_ROUTE_COUNT,
    bodyBatchCount: bodyBatches.length,
    routeBatchCount: routeBatches.length,
    shardCount: STEP8G_LIVE_SHARD_SPECS.length,
    maxRowsPerBatch: STEP8G_MAX_ROWS_PER_BATCH,
    maxHydratedCandidates: STEP8G_MAX_HYDRATED_CANDIDATES,
    maxProtectedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
    layerManifestSha256: runtimeDescriptor.layerManifestSha256,
    parentManifestSha256: runtimeDescriptor.parentManifestSha256,
    populationPlanSha256: runtimeDescriptor.populationPlanSha256,
    routeIndexSha256: runtimeDescriptor.routeIndexSha256,
    compositionSha256: runtimeDescriptor.compositionSha256,
    publicRuntimeActivationAuthorized: false,
    recommendationAdmissionAuthorized: false,
    billingExpansionAuthorized: false,
    thirdShardAuthorized: false
  };
}

export function publicStep8GBodyBatch(batchId) {
  const batch = bodyBatchById.get(String(batchId || ""));
  if (!batch) return null;
  return {
    batchId: batch.batchId,
    shardNumber: batch.shardNumber,
    batchNumber: batch.batchNumber,
    rowCount: batch.rowCount,
    expectedSha256: batch.expectedSha256
  };
}

export function publicStep8GRouteBatch(batchId) {
  const batch = routeBatchById.get(String(batchId || ""));
  if (!batch) return null;
  return {
    batchId: batch.batchId,
    corpusVersion: batch.corpusVersion,
    shardNumber: batch.shardNumber,
    batchNumber: batch.batchNumber,
    rowCount: batch.rowCount
  };
}

export function expectedStep8GBodyBatchIds() {
  return bodyBatches.map(batch => batch.batchId);
}

export function expectedStep8GRouteBatchIds() {
  return routeBatches.map(batch => batch.batchId);
}

export async function materializeStep8GIncomingBodyBatch(payload = {}) {
  const batchId = String(payload.batchId || "");
  const expectedBatch = bodyBatchById.get(batchId);
  if (!expectedBatch) return { pass: false, reason: "UNKNOWN_BODY_BATCH_ID" };
  if (!Array.isArray(payload.sourceEntries) || payload.sourceEntries.length !== expectedBatch.rowCount) {
    return { pass: false, reason: "BODY_BATCH_ROW_COUNT_MISMATCH" };
  }
  if (payload.sourceEntries.length > STEP8G_MAX_ROWS_PER_BATCH) return { pass: false, reason: "BODY_BATCH_ROW_LIMIT_EXCEEDED" };

  const entries = [];
  const seen = new Set();
  for (const incoming of payload.sourceEntries) {
    const ordinal = Number(incoming?.ordinal);
    if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= STEP8G_EXPECTED_RECIPE_COUNT) {
      return { pass: false, reason: "SOURCE_ORDINAL_INVALID" };
    }
    try {
      const built = await buildForkRecipeBody(incoming?.recipe, incoming?.fileName);
      if (seen.has(built.recipeId)) return { pass: false, reason: "DUPLICATE_SOURCE_RECIPE_ID", recipeId: built.recipeId };
      seen.add(built.recipeId);
      entries.push({ ordinal, ...built });
    } catch (error) {
      return { pass: false, reason: error?.message || "SOURCE_RECORD_REJECTED" };
    }
  }

  const fingerprintCore = {
    shardNumber: expectedBatch.shardNumber,
    batchNumber: expectedBatch.batchNumber,
    entries: entries.map(bodyDescriptor)
  };
  const observedBatchSha = await sha256Hex(JSON.stringify(fingerprintCore));
  if (observedBatchSha !== expectedBatch.expectedSha256) return { pass: false, reason: "BODY_BATCH_FINGERPRINT_MISMATCH" };
  return {
    pass: true,
    batch: {
      ...expectedBatch,
      entries
    }
  };
}

export async function ensureStep8GShardSchema(db) {
  await db.prepare(STEP8B_RECIPE_TABLE_SQL).run();
  await db.prepare(STEP8B_RECEIPT_TABLE_SQL).run();
  return { initialized: true, d1Subqueries: 2 };
}

async function readBodyReceipt(db, batch) {
  const row = await db.prepare(
    `SELECT expected_sha256, row_count, verified FROM ${STEP8B_RECEIPT_TABLE}
     WHERE corpus_version = ? AND batch_id = ? LIMIT 1`
  ).bind(STEP8G_CORPUS_VERSION, batch.batchId).first();
  return { row, d1Subqueries: 1 };
}

async function verifyBodyRows(db, batch) {
  const ids = batch.entries.map(entry => entry.recipeId);
  const placeholders = ids.map(() => "?").join(",");
  const rows = await db.prepare(
    `SELECT ordinal, recipe_id, body_bytes, body_sha256, source_cohort_id FROM ${STEP8B_RECIPE_TABLE}
     WHERE corpus_version = ? AND recipe_id IN (${placeholders})`
  ).bind(STEP8G_CORPUS_VERSION, ...ids).all();
  const byId = new Map((rows?.results || []).map(row => [String(row.recipe_id), row]));
  const pass = byId.size === batch.entries.length && batch.entries.every(entry => {
    const row = byId.get(entry.recipeId);
    return row
      && Number(row.ordinal) === entry.ordinal
      && Number(row.body_bytes) === entry.bodyBytes
      && String(row.body_sha256) === entry.bodySha256
      && String(row.source_cohort_id) === entry.sourceCohortId;
  });
  return { pass, rowCount: byId.size, d1Subqueries: 1 };
}

async function promoteBodyReceipt(db, batch) {
  const result = await db.prepare(
    `UPDATE ${STEP8B_RECEIPT_TABLE} SET verified = 1
     WHERE corpus_version = ? AND batch_id = ? AND expected_sha256 = ? AND row_count = ? AND verified = 0`
  ).bind(STEP8G_CORPUS_VERSION, batch.batchId, batch.expectedSha256, batch.rowCount).run();
  return { pass: Number(result?.meta?.changes ?? 0) === 1, d1Subqueries: 1 };
}

export async function writeStep8GBodyBatch(db, batch) {
  const prior = await readBodyReceipt(db, batch);
  if (prior.row) {
    if (String(prior.row.expected_sha256) !== batch.expectedSha256 || Number(prior.row.row_count) !== batch.rowCount) {
      return { pass: false, status: "BODY_RECEIPT_CONFLICT", d1Subqueries: prior.d1Subqueries };
    }
    const rows = await verifyBodyRows(db, batch);
    if (!rows.pass) return { pass: false, status: "BODY_RECEIPT_ROW_MISMATCH", d1Subqueries: prior.d1Subqueries + rows.d1Subqueries };
    if (Number(prior.row.verified) === 1) {
      return { pass: true, skipped: true, status: "VERIFIED_IDEMPOTENT_SKIP", rowCount: rows.rowCount, d1Subqueries: prior.d1Subqueries + rows.d1Subqueries };
    }
    const promoted = await promoteBodyReceipt(db, batch);
    return {
      pass: promoted.pass,
      recovered: promoted.pass,
      status: promoted.pass ? "RECOVERED_UNKNOWN_COMMIT_AND_VERIFIED" : "BODY_RECEIPT_PROMOTION_FAILED",
      rowCount: rows.rowCount,
      d1Subqueries: prior.d1Subqueries + rows.d1Subqueries + promoted.d1Subqueries
    };
  }
  if (typeof db.batch !== "function") return { pass: false, status: "D1_BATCH_UNAVAILABLE", d1Subqueries: prior.d1Subqueries };

  const statements = batch.entries.map(entry => db.prepare(
    `INSERT OR ABORT INTO ${STEP8B_RECIPE_TABLE}
      (corpus_version, ordinal, recipe_id, body_json, body_bytes, body_sha256, source_cohort_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(STEP8G_CORPUS_VERSION, entry.ordinal, entry.recipeId, entry.bodyJson, entry.bodyBytes, entry.bodySha256, entry.sourceCohortId));
  statements.push(db.prepare(
    `INSERT OR ABORT INTO ${STEP8B_RECEIPT_TABLE}
      (corpus_version, batch_id, expected_sha256, row_count, verified)
     VALUES (?, ?, ?, ?, 0)`
  ).bind(STEP8G_CORPUS_VERSION, batch.batchId, batch.expectedSha256, batch.rowCount));

  try {
    await db.batch(statements);
  } catch {
    return { pass: false, status: "WRITE_ERROR_UNKNOWN_COMMIT_STATE", d1Subqueries: prior.d1Subqueries + statements.length };
  }
  const rows = await verifyBodyRows(db, batch);
  if (!rows.pass) {
    return { pass: false, status: "POST_WRITE_ROW_VERIFICATION_MISMATCH", rowCount: rows.rowCount, d1Subqueries: prior.d1Subqueries + statements.length + rows.d1Subqueries };
  }
  const promoted = await promoteBodyReceipt(db, batch);
  return {
    pass: promoted.pass,
    status: promoted.pass ? "WRITTEN_AND_EXACTLY_VERIFIED" : "BODY_RECEIPT_PROMOTION_FAILED",
    rowCount: rows.rowCount,
    d1Subqueries: prior.d1Subqueries + statements.length + rows.d1Subqueries + promoted.d1Subqueries
  };
}

export async function readStep8GBodyProgress(shardDbs) {
  const completed = [];
  const pending = [];
  const conflicts = [];
  let d1Subqueries = 0;
  for (const spec of STEP8G_LIVE_SHARD_SPECS) {
    const rows = await shardDbs[spec.shardNumber].prepare(
      `SELECT batch_id, expected_sha256, row_count, verified FROM ${STEP8B_RECEIPT_TABLE}
       WHERE corpus_version = ? ORDER BY batch_id`
    ).bind(STEP8G_CORPUS_VERSION).all();
    d1Subqueries += 1;
    for (const row of rows?.results || []) {
      const batchId = String(row.batch_id || "");
      const expected = bodyBatchById.get(batchId);
      if (!expected || expected.shardNumber !== spec.shardNumber
        || String(row.expected_sha256 || "") !== expected.expectedSha256
        || Number(row.row_count || 0) !== expected.rowCount) {
        conflicts.push({ batchId, reason: "BODY_RECEIPT_MISMATCH" });
      } else if (Number(row.verified) === 1) completed.push(batchId);
      else if (Number(row.verified) === 0) pending.push(batchId);
      else conflicts.push({ batchId, reason: "INVALID_BODY_RECEIPT_STATE" });
    }
  }
  const seen = new Set([...completed, ...pending]);
  const missingBatchIds = bodyBatches.map(batch => batch.batchId).filter(id => !seen.has(id));
  const verifiedRowCount = completed.reduce((sum, id) => sum + bodyBatchById.get(id).rowCount, 0);
  return {
    pass: conflicts.length === 0,
    completeVerified: conflicts.length === 0 && pending.length === 0 && missingBatchIds.length === 0
      && completed.length === STEP8G_EXPECTED_BODY_BATCH_COUNT && verifiedRowCount === STEP8G_EXPECTED_RECIPE_COUNT,
    completedBatchIds: completed.sort(),
    pendingVerificationBatchIds: pending.sort(),
    missingBatchIds,
    conflicts,
    verifiedBatchCount: completed.length,
    verifiedRowCount,
    expectedBatchCount: STEP8G_EXPECTED_BODY_BATCH_COUNT,
    expectedRecipeCount: STEP8G_EXPECTED_RECIPE_COUNT,
    fullCorpusScans: 0,
    d1Subqueries
  };
}

export async function initializeStep8GControlSchema(controlDb) {
  await controlDb.prepare(STEP8G_POINTER_TABLE_SQL).run();
  await controlDb.prepare(STEP8G_ROUTE_TABLE_SQL).run();
  await controlDb.prepare(STEP8G_ROUTE_RECEIPT_TABLE_SQL).run();
  return { initialized: true, d1Subqueries: 3 };
}

async function readRouteReceipt(controlDb, batch) {
  const row = await controlDb.prepare(
    `SELECT expected_sha256, row_count, verified FROM ${STEP8G_ROUTE_RECEIPT_TABLE}
     WHERE composition_version = ? AND batch_id = ? LIMIT 1`
  ).bind(STEP8G_COMPOSITION_VERSION, batch.batchId).first();
  return { row, d1Subqueries: 1 };
}

async function verifyExpectedRoutesAgainstBodies(shardDb, batch, entries) {
  const ids = entries.map(entry => entry.recipeId);
  const placeholders = ids.map(() => "?").join(",");
  const rows = await shardDb.prepare(
    `SELECT recipe_id, body_sha256, body_bytes, source_cohort_id FROM ${STEP8B_RECIPE_TABLE}
     WHERE corpus_version = ? AND recipe_id IN (${placeholders})`
  ).bind(batch.corpusVersion, ...ids).all();
  const byId = new Map((rows?.results || []).map(row => [String(row.recipe_id), row]));
  const pass = byId.size === entries.length && entries.every(entry => {
    const row = byId.get(entry.recipeId);
    return row
      && String(row.body_sha256) === entry.bodySha256
      && Number(row.body_bytes) === entry.bodyBytes
      && String(row.source_cohort_id) === entry.sourceCohortId;
  });
  return { pass, d1Subqueries: 1 };
}

async function verifyRouteRows(controlDb, entries) {
  const ids = entries.map(entry => entry.recipeId);
  const placeholders = ids.map(() => "?").join(",");
  const rows = await controlDb.prepare(
    `SELECT recipe_id, corpus_version, shard_number, source_cohort_id, body_sha256, body_bytes
     FROM ${STEP8G_ROUTE_TABLE}
     WHERE composition_version = ? AND recipe_id IN (${placeholders})`
  ).bind(STEP8G_COMPOSITION_VERSION, ...ids).all();
  const byId = new Map((rows?.results || []).map(row => [String(row.recipe_id), row]));
  const pass = byId.size === entries.length && entries.every(entry => {
    const row = byId.get(entry.recipeId);
    return row
      && String(row.corpus_version) === entry.corpusVersion
      && Number(row.shard_number) === entry.shardNumber
      && String(row.source_cohort_id) === entry.sourceCohortId
      && String(row.body_sha256) === entry.bodySha256
      && Number(row.body_bytes) === entry.bodyBytes;
  });
  return { pass, rowCount: byId.size, d1Subqueries: 1 };
}

async function promoteRouteReceipt(controlDb, batch, expectedSha256) {
  const result = await controlDb.prepare(
    `UPDATE ${STEP8G_ROUTE_RECEIPT_TABLE} SET verified = 1
     WHERE composition_version = ? AND batch_id = ? AND expected_sha256 = ? AND row_count = ? AND verified = 0`
  ).bind(STEP8G_COMPOSITION_VERSION, batch.batchId, expectedSha256, batch.rowCount).run();
  return { pass: Number(result?.meta?.changes ?? 0) === 1, d1Subqueries: 1 };
}

export async function writeStep8GRouteBatch(controlDb, shardDbs, payload = {}) {
  const batchId = String(payload.batchId || "");
  const batch = routeBatchById.get(batchId);
  if (!batch) return { pass: false, status: "UNKNOWN_ROUTE_BATCH_ID", d1Subqueries: 0 };
  if (!Array.isArray(payload.entries) || payload.entries.length !== batch.rowCount || payload.entries.length > STEP8G_MAX_ROWS_PER_BATCH) {
    return { pass: false, status: "ROUTE_BATCH_ROW_COUNT_MISMATCH", d1Subqueries: 0 };
  }
  const entries = payload.entries.map(routeDescriptor);
  if (entries.some(entry => !entry.recipeId
    || entry.corpusVersion !== batch.corpusVersion
    || entry.shardNumber !== batch.shardNumber
    || !entry.sourceCohortId
    || !/^[0-9a-f]{64}$/.test(entry.bodySha256)
    || !Number.isInteger(entry.bodyBytes)
    || entry.bodyBytes <= 0)) {
    return { pass: false, status: "ROUTE_BATCH_DESCRIPTOR_INVALID", d1Subqueries: 0 };
  }
  if (new Set(entries.map(entry => entry.recipeId)).size !== entries.length) {
    return { pass: false, status: "ROUTE_BATCH_DUPLICATE_RECIPE_ID", d1Subqueries: 0 };
  }
  const fingerprintCore = {
    compositionVersion: STEP8G_COMPOSITION_VERSION,
    corpusVersion: batch.corpusVersion,
    shardNumber: batch.shardNumber,
    entries
  };
  const observedSha = await sha256Hex(JSON.stringify(fingerprintCore));

  const prior = await readRouteReceipt(controlDb, batch);
  if (prior.row) {
    if (String(prior.row.expected_sha256) !== observedSha || Number(prior.row.row_count) !== batch.rowCount) {
      return { pass: false, status: "ROUTE_RECEIPT_CONFLICT", d1Subqueries: prior.d1Subqueries };
    }
    const routes = await verifyRouteRows(controlDb, entries);
    if (!routes.pass) return { pass: false, status: "ROUTE_RECEIPT_ROW_MISMATCH", d1Subqueries: prior.d1Subqueries + routes.d1Subqueries };
    if (Number(prior.row.verified) === 1) {
      return { pass: true, skipped: true, status: "VERIFIED_IDEMPOTENT_SKIP", rowCount: routes.rowCount, d1Subqueries: prior.d1Subqueries + routes.d1Subqueries };
    }
    const promoted = await promoteRouteReceipt(controlDb, batch, observedSha);
    return {
      pass: promoted.pass,
      recovered: promoted.pass,
      status: promoted.pass ? "RECOVERED_UNKNOWN_COMMIT_AND_VERIFIED" : "ROUTE_RECEIPT_PROMOTION_FAILED",
      rowCount: routes.rowCount,
      d1Subqueries: prior.d1Subqueries + routes.d1Subqueries + promoted.d1Subqueries
    };
  }

  const bodies = await verifyExpectedRoutesAgainstBodies(shardDbs[batch.shardNumber], batch, entries);
  if (!bodies.pass) return { pass: false, status: "ROUTE_SOURCE_BODIES_NOT_EXACTLY_VERIFIED", d1Subqueries: prior.d1Subqueries + bodies.d1Subqueries };
  if (typeof controlDb.batch !== "function") return { pass: false, status: "D1_BATCH_UNAVAILABLE", d1Subqueries: prior.d1Subqueries + bodies.d1Subqueries };

  const statements = entries.map(entry => controlDb.prepare(
    `INSERT OR ABORT INTO ${STEP8G_ROUTE_TABLE}
      (composition_version, recipe_id, corpus_version, shard_number, source_cohort_id, body_sha256, body_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(STEP8G_COMPOSITION_VERSION, entry.recipeId, entry.corpusVersion, entry.shardNumber, entry.sourceCohortId, entry.bodySha256, entry.bodyBytes));
  statements.push(controlDb.prepare(
    `INSERT OR ABORT INTO ${STEP8G_ROUTE_RECEIPT_TABLE}
      (composition_version, batch_id, expected_sha256, row_count, verified)
     VALUES (?, ?, ?, ?, 0)`
  ).bind(STEP8G_COMPOSITION_VERSION, batch.batchId, observedSha, batch.rowCount));

  try {
    await controlDb.batch(statements);
  } catch {
    return { pass: false, status: "WRITE_ERROR_UNKNOWN_COMMIT_STATE", d1Subqueries: prior.d1Subqueries + bodies.d1Subqueries + statements.length };
  }
  const routes = await verifyRouteRows(controlDb, entries);
  if (!routes.pass) {
    return { pass: false, status: "POST_WRITE_ROUTE_VERIFICATION_MISMATCH", d1Subqueries: prior.d1Subqueries + bodies.d1Subqueries + statements.length + routes.d1Subqueries };
  }
  const promoted = await promoteRouteReceipt(controlDb, batch, observedSha);
  return {
    pass: promoted.pass,
    status: promoted.pass ? "WRITTEN_AND_EXACTLY_VERIFIED" : "ROUTE_RECEIPT_PROMOTION_FAILED",
    rowCount: routes.rowCount,
    d1Subqueries: prior.d1Subqueries + bodies.d1Subqueries + statements.length + routes.d1Subqueries + promoted.d1Subqueries
  };
}

export async function readStep8GRouteProgress(controlDb) {
  const rows = await controlDb.prepare(
    `SELECT batch_id, expected_sha256, row_count, verified FROM ${STEP8G_ROUTE_RECEIPT_TABLE}
     WHERE composition_version = ? ORDER BY batch_id`
  ).bind(STEP8G_COMPOSITION_VERSION).all();
  const completed = [];
  const pending = [];
  const conflicts = [];
  for (const row of rows?.results || []) {
    const batchId = String(row.batch_id || "");
    const expected = routeBatchById.get(batchId);
    if (!expected
      || !/^[0-9a-f]{64}$/.test(String(row.expected_sha256 || ""))
      || Number(row.row_count || 0) !== expected.rowCount) {
      conflicts.push({ batchId, reason: "ROUTE_RECEIPT_MISMATCH" });
    } else if (Number(row.verified) === 1) completed.push(batchId);
    else if (Number(row.verified) === 0) pending.push(batchId);
    else conflicts.push({ batchId, reason: "INVALID_ROUTE_RECEIPT_STATE" });
  }
  const seen = new Set([...completed, ...pending]);
  const missingBatchIds = routeBatches.map(batch => batch.batchId).filter(id => !seen.has(id));
  const verifiedRowCount = completed.reduce((sum, id) => sum + routeBatchById.get(id).rowCount, 0);
  return {
    pass: conflicts.length === 0,
    completeVerified: conflicts.length === 0 && pending.length === 0 && missingBatchIds.length === 0
      && completed.length === routeBatches.length && verifiedRowCount === STEP8G_EXPECTED_ROUTE_COUNT,
    completedBatchIds: completed.sort(),
    pendingVerificationBatchIds: pending.sort(),
    missingBatchIds,
    conflicts,
    verifiedBatchCount: completed.length,
    verifiedRowCount,
    expectedBatchCount: routeBatches.length,
    expectedRouteCount: STEP8G_EXPECTED_ROUTE_COUNT,
    fullCorpusScans: 0,
    d1Subqueries: 1
  };
}

export async function readStep8GPointer(controlDb) {
  const row = await controlDb.prepare(
    `SELECT active_version, previous_version, manifest_sha256 FROM ${STEP8G_POINTER_TABLE}
     WHERE scope = ? LIMIT 1`
  ).bind(STEP8G_POINTER_SCOPE).first();
  return {
    activeVersion: row?.active_version ? String(row.active_version) : null,
    previousVersion: row?.previous_version ? String(row.previous_version) : null,
    manifestSha256: row?.manifest_sha256 ? String(row.manifest_sha256) : null,
    d1Subqueries: 1
  };
}

async function switchStep8GPointer(controlDb, activeVersion, previousVersion, manifestSha256) {
  const result = await controlDb.prepare(
    `UPDATE ${STEP8G_POINTER_TABLE}
     SET active_version = ?, previous_version = ?, manifest_sha256 = ?, updated_at = CURRENT_TIMESTAMP
     WHERE scope = ?`
  ).bind(activeVersion, previousVersion, manifestSha256, STEP8G_POINTER_SCOPE).run();
  if (Number(result?.meta?.changes ?? 0) !== 1) return { pass: false, d1Subqueries: 1 };
  const pointer = await readStep8GPointer(controlDb);
  return {
    pass: pointer.activeVersion === activeVersion
      && pointer.previousVersion === previousVersion
      && pointer.manifestSha256 === manifestSha256,
    pointer,
    d1Subqueries: 1 + pointer.d1Subqueries
  };
}

export async function activateStep8GPointer(controlDb) {
  const current = await readStep8GPointer(controlDb);
  if (current.activeVersion === STEP8G_CORPUS_VERSION && current.manifestSha256 === runtimeDescriptor.compositionSha256) {
    return { pass: true, skipped: true, pointer: current, d1Subqueries: current.d1Subqueries };
  }
  const parentDirectlyActive = current.activeVersion === STEP8G_PARENT_VERSION
    && current.manifestSha256 === runtimeDescriptor.parentManifestSha256;
  const parentWasRollbackTarget = current.activeVersion === "step8b-canary-v1"
    && current.previousVersion === STEP8G_PARENT_VERSION
    && current.manifestSha256 === runtimeDescriptor.parentManifestSha256;
  if (!parentDirectlyActive && !parentWasRollbackTarget) {
    return { pass: false, reason: "V8001_PARENT_POINTER_NOT_PROVEN", pointer: current, d1Subqueries: current.d1Subqueries };
  }
  const switched = await switchStep8GPointer(controlDb, STEP8G_CORPUS_VERSION, STEP8G_PARENT_VERSION, runtimeDescriptor.compositionSha256);
  return { ...switched, reason: switched.pass ? "STEP8G_POINTER_ACTIVATED" : "POINTER_SWITCH_FAILED", d1Subqueries: current.d1Subqueries + switched.d1Subqueries };
}

export async function rollbackStep8GPointer(controlDb) {
  const current = await readStep8GPointer(controlDb);
  if (current.activeVersion === STEP8G_PARENT_VERSION && current.previousVersion === STEP8G_CORPUS_VERSION
    && current.manifestSha256 === runtimeDescriptor.parentManifestSha256) {
    return { pass: true, skipped: true, pointer: current, d1Subqueries: current.d1Subqueries };
  }
  if (current.activeVersion !== STEP8G_CORPUS_VERSION || current.previousVersion !== STEP8G_PARENT_VERSION
    || current.manifestSha256 !== runtimeDescriptor.compositionSha256) {
    return { pass: false, reason: "STEP8G_POINTER_NOT_ACTIVE", pointer: current, d1Subqueries: current.d1Subqueries };
  }
  const switched = await switchStep8GPointer(controlDb, STEP8G_PARENT_VERSION, STEP8G_CORPUS_VERSION, runtimeDescriptor.parentManifestSha256);
  return { ...switched, reason: switched.pass ? "STEP8G_POINTER_ROLLED_BACK" : "POINTER_SWITCH_FAILED", d1Subqueries: current.d1Subqueries + switched.d1Subqueries };
}

export async function hydrateStep8GProtectedRecipes(controlDb, shardDbs, recipeIds) {
  if (!Array.isArray(recipeIds) || recipeIds.length === 0) return { pass: false, reason: "RECIPE_IDS_REQUIRED", d1Subqueries: 0, shardQueries: 0 };
  const ids = [...new Set(recipeIds.map(value => String(value || "")).filter(Boolean))];
  if (ids.length !== recipeIds.length) return { pass: false, reason: "DUPLICATE_OR_EMPTY_RECIPE_ID", d1Subqueries: 0, shardQueries: 0 };
  if (ids.length > STEP8G_MAX_HYDRATED_CANDIDATES) return { pass: false, reason: "HYDRATION_CANDIDATE_LIMIT_EXCEEDED", d1Subqueries: 0, shardQueries: 0 };
  const placeholders = ids.map(() => "?").join(",");
  const routeRows = await controlDb.prepare(
    `SELECT r.recipe_id, r.corpus_version, r.shard_number, r.source_cohort_id, r.body_sha256, r.body_bytes
     FROM ${STEP8G_ROUTE_TABLE} r
     JOIN ${STEP8G_POINTER_TABLE} p ON p.scope = ? AND p.active_version = ?
     WHERE r.composition_version = ? AND r.recipe_id IN (${placeholders})`
  ).bind(STEP8G_POINTER_SCOPE, STEP8G_CORPUS_VERSION, STEP8G_COMPOSITION_VERSION, ...ids).all();
  const routes = (routeRows?.results || []).map(row => ({
    recipeId: String(row.recipe_id),
    corpusVersion: String(row.corpus_version),
    shardNumber: Number(row.shard_number),
    sourceCohortId: String(row.source_cohort_id),
    bodySha256: String(row.body_sha256),
    bodyBytes: Number(row.body_bytes)
  }));
  if (routes.length !== ids.length) return { pass: false, reason: "ROUTE_LOOKUP_INCOMPLETE_OR_COMPOSITION_INACTIVE", d1Subqueries: 1, shardQueries: 0 };

  const byShard = new Map();
  for (const route of routes) {
    if (![0, 1].includes(route.shardNumber) || ![STEP8G_PARENT_VERSION, STEP8G_CORPUS_VERSION].includes(route.corpusVersion)) {
      return { pass: false, reason: "ROUTE_METADATA_INVALID", d1Subqueries: 1, shardQueries: 0 };
    }
    if (!byShard.has(route.shardNumber)) byShard.set(route.shardNumber, []);
    byShard.get(route.shardNumber).push(route);
  }

  const bodiesById = new Map();
  let shardQueries = 0;
  for (const [shardNumber, shardRoutes] of byShard) {
    const clauses = [];
    const args = [];
    for (const corpusVersion of [STEP8G_PARENT_VERSION, STEP8G_CORPUS_VERSION]) {
      const subset = shardRoutes.filter(route => route.corpusVersion === corpusVersion);
      if (!subset.length) continue;
      clauses.push(`(corpus_version = ? AND recipe_id IN (${subset.map(() => "?").join(",")}))`);
      args.push(corpusVersion, ...subset.map(route => route.recipeId));
    }
    const rows = await shardDbs[shardNumber].prepare(
      `SELECT corpus_version, recipe_id, body_json, body_bytes, body_sha256, source_cohort_id
       FROM ${STEP8B_RECIPE_TABLE} WHERE ${clauses.join(" OR ")}`
    ).bind(...args).all();
    shardQueries += 1;
    for (const row of rows?.results || []) bodiesById.set(String(row.recipe_id), row);
  }
  const packets = [];
  for (const recipeId of ids) {
    const route = routes.find(candidate => candidate.recipeId === recipeId);
    const row = bodiesById.get(recipeId);
    if (!route || !row
      || String(row.corpus_version) !== route.corpusVersion
      || Number(row.body_bytes) !== route.bodyBytes
      || String(row.body_sha256) !== route.bodySha256
      || String(row.source_cohort_id) !== route.sourceCohortId
      || utf8Bytes(String(row.body_json || "")) !== route.bodyBytes
      || await sha256Hex(String(row.body_json || "")) !== route.bodySha256) {
      return { pass: false, reason: "HYDRATED_BODY_INTEGRITY_MISMATCH", d1Subqueries: 1 + shardQueries, shardQueries };
    }
    packets.push(JSON.parse(String(row.body_json)));
  }
  return { pass: true, packets, d1Subqueries: 1 + shardQueries, shardQueries, fullCorpusScans: 0 };
}
