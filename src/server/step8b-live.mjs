import { ALL_RECIPES } from "../data/corpus-v1.js";

const encoder = new TextEncoder();

export const STEP8B_LIVE_CONTRACT_VERSION = "CORPUS_SCALE_STEP8B_LIVE_CANARY_V1";
export const STEP8B_LIVE_CORPUS_VERSION = "step8b-canary-v1";
export const STEP8B_BASELINE_VERSION = "step7e-public-runtime-baseline";
export const STEP8B_SOURCE_COHORT_ID = "reviewed-runtime-oracle";
export const STEP8B_CANARY_ROWS_PER_SHARD = 2;
export const STEP8B_RECIPE_TABLE = "corpus_recipe_bodies";
export const STEP8B_RECEIPT_TABLE = "corpus_population_receipts";
export const STEP8B_POINTER_TABLE = "step8b_canary_active_version";
export const STEP8B_POINTER_SCOPE = "recipe-corpus-canary";

export const STEP8B_LIVE_SHARD_SPECS = Object.freeze([
  Object.freeze({
    shardNumber: 0,
    databaseName: "culinary-recipes-00",
    bindingName: "CULINARY_RECIPE_SHARD_00_DB"
  }),
  Object.freeze({
    shardNumber: 1,
    databaseName: "culinary-recipes-01",
    bindingName: "CULINARY_RECIPE_SHARD_01_DB"
  })
]);

export const STEP8B_RECIPE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8B_RECIPE_TABLE} (
  corpus_version TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  recipe_id TEXT NOT NULL,
  body_json TEXT NOT NULL,
  body_bytes INTEGER NOT NULL,
  body_sha256 TEXT NOT NULL,
  source_cohort_id TEXT NOT NULL,
  PRIMARY KEY (corpus_version, ordinal),
  UNIQUE (corpus_version, recipe_id)
)`;

export const STEP8B_RECEIPT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8B_RECEIPT_TABLE} (
  corpus_version TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  expected_sha256 TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  verified INTEGER NOT NULL CHECK (verified IN (0, 1)),
  PRIMARY KEY (corpus_version, batch_id)
)`;

export const STEP8B_POINTER_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8B_POINTER_TABLE} (
  scope TEXT PRIMARY KEY,
  active_version TEXT NOT NULL,
  previous_version TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

function hashString32(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function step8bShardForRecipeId(recipeId) {
  return hashString32(String(recipeId)) % STEP8B_LIVE_SHARD_SPECS.length;
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(String(value)));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function utf8Bytes(value) {
  return encoder.encode(String(value)).byteLength;
}

export function selectStep8BLiveRecipes(recipes = ALL_RECIPES) {
  const selected = STEP8B_LIVE_SHARD_SPECS.map(() => []);
  for (let ordinal = 0; ordinal < recipes.length; ordinal += 1) {
    const recipe = recipes[ordinal];
    if (!recipe?.id) continue;
    const shardNumber = step8bShardForRecipeId(recipe.id);
    if (selected[shardNumber].length >= STEP8B_CANARY_ROWS_PER_SHARD) continue;
    selected[shardNumber].push({ ordinal, recipe });
    if (selected.every(rows => rows.length === STEP8B_CANARY_ROWS_PER_SHARD)) break;
  }
  if (!selected.every(rows => rows.length === STEP8B_CANARY_ROWS_PER_SHARD)) {
    throw new Error("Step 8B runtime corpus cannot populate the exact two-shard canary fixture");
  }
  return selected;
}

export async function buildStep8BLiveFixture(recipes = ALL_RECIPES) {
  const selected = selectStep8BLiveRecipes(recipes);
  const shardBatches = [];

  for (const spec of STEP8B_LIVE_SHARD_SPECS) {
    const entries = [];
    for (const { ordinal, recipe } of selected[spec.shardNumber]) {
      const bodyJson = JSON.stringify(recipe);
      entries.push({
        ordinal,
        recipeId: String(recipe.id),
        bodyJson,
        bodyBytes: utf8Bytes(bodyJson),
        bodySha256: await sha256Hex(bodyJson),
        sourceCohortId: STEP8B_SOURCE_COHORT_ID
      });
    }

    const descriptorEntries = entries.map(entry => ({
      ordinal: entry.ordinal,
      recipeId: entry.recipeId,
      bodySha256: entry.bodySha256,
      bodyBytes: entry.bodyBytes,
      sourceCohortId: entry.sourceCohortId
    }));
    const fingerprintCore = {
      shardNumber: spec.shardNumber,
      databaseName: spec.databaseName,
      bindingName: spec.bindingName,
      entries: descriptorEntries
    };

    shardBatches.push({
      batchId: `step8b-s${String(spec.shardNumber).padStart(2, "0")}-canary-000000`,
      shardNumber: spec.shardNumber,
      databaseName: spec.databaseName,
      bindingName: spec.bindingName,
      rowCount: entries.length,
      plannedStatements: entries.length + 1,
      expectedSha256: await sha256Hex(JSON.stringify(fingerprintCore)),
      entries
    });
  }

  return {
    contractVersion: STEP8B_LIVE_CONTRACT_VERSION,
    corpusVersion: STEP8B_LIVE_CORPUS_VERSION,
    shardCount: STEP8B_LIVE_SHARD_SPECS.length,
    rowsPerShard: STEP8B_CANARY_ROWS_PER_SHARD,
    shardBatches
  };
}

export function publicStep8BLiveFixture(fixture) {
  return {
    contractVersion: fixture.contractVersion,
    corpusVersion: fixture.corpusVersion,
    shardCount: fixture.shardCount,
    rowsPerShard: fixture.rowsPerShard,
    shardBatches: fixture.shardBatches.map(batch => ({
      batchId: batch.batchId,
      shardNumber: batch.shardNumber,
      databaseName: batch.databaseName,
      bindingName: batch.bindingName,
      rowCount: batch.rowCount,
      plannedStatements: batch.plannedStatements,
      expectedSha256: batch.expectedSha256,
      recipeIds: batch.entries.map(entry => entry.recipeId)
    }))
  };
}

export async function ensureStep8BShardSchema(db) {
  await db.prepare(STEP8B_RECIPE_TABLE_SQL).run();
  await db.prepare(STEP8B_RECEIPT_TABLE_SQL).run();
  return { initialized: true, d1Subqueries: 2 };
}

export async function readStep8BReceipt(db, batch) {
  const row = await db.prepare(
    `SELECT expected_sha256, row_count, verified
     FROM ${STEP8B_RECEIPT_TABLE}
     WHERE corpus_version = ? AND batch_id = ?
     LIMIT 1`
  ).bind(STEP8B_LIVE_CORPUS_VERSION, batch.batchId).first();

  if (!row) return { status: "ABSENT_VERIFIED", d1Subqueries: 1 };
  if (
    Number(row.verified) === 1
    && String(row.expected_sha256) === batch.expectedSha256
    && Number(row.row_count) === batch.rowCount
  ) {
    return { status: "VERIFIED", d1Subqueries: 1 };
  }
  return {
    status: "CONFLICT_FAIL_CLOSED",
    d1Subqueries: 1,
    stored: {
      expectedSha256: String(row.expected_sha256 || ""),
      rowCount: Number(row.row_count || 0),
      verified: Number(row.verified || 0)
    }
  };
}

export async function verifyStep8BBatch(db, batch) {
  const receipt = await readStep8BReceipt(db, batch);
  if (receipt.status !== "VERIFIED") {
    return { pass: false, reason: "RECEIPT_NOT_VERIFIED", receipt, d1Subqueries: receipt.d1Subqueries };
  }

  const placeholders = batch.entries.map(() => "?").join(", ");
  const rows = await db.prepare(
    `SELECT recipe_id, body_sha256, body_bytes
     FROM ${STEP8B_RECIPE_TABLE}
     WHERE corpus_version = ? AND recipe_id IN (${placeholders})`
  ).bind(STEP8B_LIVE_CORPUS_VERSION, ...batch.entries.map(entry => entry.recipeId)).all();
  const actual = new Map((rows?.results || []).map(row => [String(row.recipe_id), row]));
  const mismatch = batch.entries.find(entry => {
    const row = actual.get(entry.recipeId);
    return !row
      || String(row.body_sha256) !== entry.bodySha256
      || Number(row.body_bytes) !== entry.bodyBytes;
  });
  if (mismatch || actual.size !== batch.rowCount) {
    return {
      pass: false,
      reason: "ROW_VERIFICATION_MISMATCH",
      d1Subqueries: receipt.d1Subqueries + 1
    };
  }
  return {
    pass: true,
    rowCount: actual.size,
    d1Subqueries: receipt.d1Subqueries + 1
  };
}

export async function writeStep8BBatch(db, batch) {
  const prior = await readStep8BReceipt(db, batch);
  if (prior.status === "VERIFIED") {
    return {
      pass: true,
      skipped: true,
      status: "VERIFIED_IDEMPOTENT_SKIP",
      d1Subqueries: prior.d1Subqueries
    };
  }
  if (prior.status !== "ABSENT_VERIFIED") {
    return {
      pass: false,
      skipped: false,
      status: "CONFLICT_FAIL_CLOSED",
      d1Subqueries: prior.d1Subqueries
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
    STEP8B_LIVE_CORPUS_VERSION,
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
     VALUES (?, ?, ?, ?, 1)`
  ).bind(
    STEP8B_LIVE_CORPUS_VERSION,
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

  const verified = await verifyStep8BBatch(db, batch);
  return {
    pass: verified.pass,
    skipped: false,
    status: verified.pass ? "WRITTEN_AND_VERIFIED" : verified.reason,
    rowCount: verified.rowCount || 0,
    d1Subqueries: prior.d1Subqueries + statements.length + verified.d1Subqueries
  };
}

export async function auditStep8BReceipts(shardDbs, fixture) {
  const receipts = [];
  let d1Subqueries = 0;
  for (const batch of fixture.shardBatches) {
    const receipt = await readStep8BReceipt(shardDbs[batch.shardNumber], batch);
    d1Subqueries += receipt.d1Subqueries;
    receipts.push({ shardNumber: batch.shardNumber, batchId: batch.batchId, status: receipt.status });
  }
  return {
    pass: receipts.every(receipt => receipt.status === "VERIFIED"),
    receipts,
    d1Subqueries
  };
}

export async function readStep8BCrossShard(shardDbs, fixture) {
  const rows = [];
  let d1Subqueries = 0;
  for (const batch of fixture.shardBatches) {
    const expected = batch.entries[0];
    const row = await shardDbs[batch.shardNumber].prepare(
      `SELECT recipe_id, body_sha256, body_bytes
       FROM ${STEP8B_RECIPE_TABLE}
       WHERE corpus_version = ? AND recipe_id = ?
       LIMIT 1`
    ).bind(STEP8B_LIVE_CORPUS_VERSION, expected.recipeId).first();
    d1Subqueries += 1;
    if (
      !row
      || String(row.recipe_id) !== expected.recipeId
      || String(row.body_sha256) !== expected.bodySha256
      || Number(row.body_bytes) !== expected.bodyBytes
    ) {
      return { pass: false, rows, d1Subqueries };
    }
    rows.push({
      shardNumber: batch.shardNumber,
      recipeId: expected.recipeId,
      bodySha256: expected.bodySha256,
      bodyBytes: expected.bodyBytes
    });
  }
  return { pass: rows.length === STEP8B_LIVE_SHARD_SPECS.length, rows, d1Subqueries };
}

export async function initializeStep8BPointer(controlDb) {
  await controlDb.prepare(STEP8B_POINTER_TABLE_SQL).run();
  await controlDb.prepare(
    `INSERT OR IGNORE INTO ${STEP8B_POINTER_TABLE}
      (scope, active_version, previous_version)
     VALUES (?, ?, NULL)`
  ).bind(STEP8B_POINTER_SCOPE, STEP8B_BASELINE_VERSION).run();
  return { initialized: true, d1Subqueries: 2 };
}

export async function readStep8BPointer(controlDb) {
  const row = await controlDb.prepare(
    `SELECT active_version, previous_version
     FROM ${STEP8B_POINTER_TABLE}
     WHERE scope = ?
     LIMIT 1`
  ).bind(STEP8B_POINTER_SCOPE).first();
  return {
    activeVersion: row?.active_version ? String(row.active_version) : null,
    previousVersion: row?.previous_version ? String(row.previous_version) : null,
    d1Subqueries: 1
  };
}

async function switchStep8BPointer(controlDb, activeVersion, previousVersion) {
  const result = await controlDb.prepare(
    `UPDATE ${STEP8B_POINTER_TABLE}
     SET active_version = ?, previous_version = ?, updated_at = CURRENT_TIMESTAMP
     WHERE scope = ?`
  ).bind(activeVersion, previousVersion, STEP8B_POINTER_SCOPE).run();
  const changes = Number(result?.meta?.changes ?? 1);
  if (changes !== 1) return { pass: false, d1Subqueries: 1 };
  const pointer = await readStep8BPointer(controlDb);
  return {
    pass: pointer.activeVersion === activeVersion && pointer.previousVersion === previousVersion,
    pointer,
    d1Subqueries: 1 + pointer.d1Subqueries
  };
}

export async function activateStep8BCanaryPointer(controlDb) {
  const current = await readStep8BPointer(controlDb);
  if (current.activeVersion !== STEP8B_BASELINE_VERSION) {
    return { pass: false, reason: "BASELINE_POINTER_NOT_ACTIVE", current, d1Subqueries: current.d1Subqueries };
  }
  const switched = await switchStep8BPointer(controlDb, STEP8B_LIVE_CORPUS_VERSION, STEP8B_BASELINE_VERSION);
  return {
    ...switched,
    reason: switched.pass ? "CANARY_POINTER_ACTIVATED" : "POINTER_SWITCH_FAILED",
    d1Subqueries: current.d1Subqueries + switched.d1Subqueries
  };
}

export async function rollbackStep8BCanaryPointer(controlDb) {
  const current = await readStep8BPointer(controlDb);
  if (current.activeVersion !== STEP8B_LIVE_CORPUS_VERSION) {
    return { pass: false, reason: "CANARY_POINTER_NOT_ACTIVE", current, d1Subqueries: current.d1Subqueries };
  }
  const switched = await switchStep8BPointer(controlDb, STEP8B_BASELINE_VERSION, STEP8B_LIVE_CORPUS_VERSION);
  return {
    ...switched,
    reason: switched.pass ? "ROLLBACK_POINTER_SWITCH_VERIFIED" : "ROLLBACK_POINTER_SWITCH_FAILED",
    d1Subqueries: current.d1Subqueries + switched.d1Subqueries
  };
}
