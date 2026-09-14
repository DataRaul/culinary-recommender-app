import test from "node:test";
import assert from "node:assert/strict";

import plan from "../data/generated/step8d/population-plan-descriptors.json" with { type: "json" };
import { createSessionToken } from "../src/server/auth-core.mjs";
import {
  STEP8D_CORPUS_VERSION,
  STEP8D_EXPECTED_BATCH_COUNT,
  STEP8D_EXPECTED_RECIPE_COUNT,
  STEP8D_MAX_PROTECTED_D1_SUBQUERIES,
  activateStep8DPointer,
  initializeStep8DPointer,
  readStep8DCrossShard,
  readStep8DProgress,
  rollbackStep8DPointer,
  validateStep8DIncomingBatch,
  writeStep8DBatch
} from "../src/server/step8d-live.mjs";
import {
  onRequestGet as getStep8d,
  onRequestPost as postStep8d
} from "../functions/api/step8d/populate.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";
const SECRET = "0123456789abcdef0123456789abcdef";

function account() {
  return {
    account_id: "owner-account",
    email: "owner@gmail.com",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: 1
  };
}

class FakeControlD1 {
  constructor() {
    this.account = account();
    this.pointer = null;
    this.queryCount = 0;
  }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      sql,
      bind(...values) { args = values; return this; },
      async first() {
        db.queryCount += 1;
        if (sql.startsWith("SELECT account_id") && sql.includes("FROM invited_accounts")) {
          return db.account.account_id === args[0] ? db.account : null;
        }
        if (sql.includes("FROM corpus_protected_active_version")) {
          if (!db.pointer || args[0] !== "step8d-protected-recipe-corpus") return null;
          return {
            active_version: db.pointer.activeVersion,
            previous_version: db.pointer.previousVersion,
            manifest_sha256: db.pointer.manifestSha256
          };
        }
        throw new Error(`Unhandled control first SQL: ${sql}`);
      },
      async run() {
        db.queryCount += 1;
        if (sql.includes("CREATE TABLE IF NOT EXISTS corpus_protected_active_version")) return { meta: { changes: 0 } };
        if (sql.includes("INSERT OR IGNORE INTO corpus_protected_active_version")) {
          if (!db.pointer) {
            db.pointer = { activeVersion: args[1], previousVersion: null, manifestSha256: null };
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }
        if (sql.includes("UPDATE corpus_protected_active_version")) {
          if (!db.pointer || args[3] !== "step8d-protected-recipe-corpus") return { meta: { changes: 0 } };
          db.pointer = { activeVersion: args[0], previousVersion: args[1], manifestSha256: args[2] };
          return { meta: { changes: 1 } };
        }
        throw new Error(`Unhandled control run SQL: ${sql}`);
      }
    };
  }
}

class FakeShardD1 {
  constructor(name) {
    this.name = name;
    this.rows = new Map();
    this.receipts = new Map();
    this.queryCount = 0;
    this.writeStatements = 0;
    this.throwAfterCommitOnce = false;
  }

  key(version, id) { return `${version}|${id}`; }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      sql,
      get args() { return args; },
      bind(...values) { args = values; return this; },
      async first() {
        db.queryCount += 1;
        if (sql.includes("SELECT 1 AS ok")) return { ok: 1 };
        if (sql.includes("FROM corpus_population_receipts")) {
          return db.receipts.get(db.key(args[0], args[1])) || null;
        }
        if (sql.includes("FROM corpus_recipe_bodies") && sql.includes("recipe_id = ?")) {
          return db.rows.get(db.key(args[0], args[1])) || null;
        }
        throw new Error(`Unhandled shard first SQL: ${sql}`);
      },
      async all() {
        db.queryCount += 1;
        if (sql.includes("FROM corpus_recipe_bodies") && sql.includes("recipe_id IN")) {
          const version = args[0];
          const results = args.slice(1).map(id => db.rows.get(db.key(version, id))).filter(Boolean);
          return { results };
        }
        if (sql.includes("FROM corpus_population_receipts") && !sql.includes("batch_id = ?")) {
          const version = args[0];
          const results = [...db.receipts.entries()]
            .filter(([key]) => key.startsWith(`${version}|`))
            .map(([, row]) => ({ ...row }))
            .sort((a, b) => a.batch_id.localeCompare(b.batch_id));
          return { results };
        }
        throw new Error(`Unhandled shard all SQL: ${sql}`);
      },
      async run() {
        db.queryCount += 1;
        if (sql.includes("CREATE TABLE IF NOT EXISTS corpus_recipe_bodies") || sql.includes("CREATE TABLE IF NOT EXISTS corpus_population_receipts")) {
          return { meta: { changes: 0 } };
        }
        if (sql.includes("INSERT OR ABORT INTO corpus_recipe_bodies")) {
          const key = db.key(args[0], args[2]);
          if (db.rows.has(key)) throw new Error("duplicate recipe row");
          db.writeStatements += 1;
          db.rows.set(key, {
            corpus_version: args[0], ordinal: args[1], recipe_id: args[2], body_json: args[3],
            body_bytes: args[4], body_sha256: args[5], source_cohort_id: args[6]
          });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("INSERT OR ABORT INTO corpus_population_receipts")) {
          const key = db.key(args[0], args[1]);
          if (db.receipts.has(key)) throw new Error("duplicate receipt");
          db.writeStatements += 1;
          db.receipts.set(key, {
            batch_id: args[1], expected_sha256: args[2], row_count: args[3], verified: 0
          });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("UPDATE corpus_population_receipts") && sql.includes("SET verified = 1")) {
          const key = db.key(args[0], args[1]);
          const receipt = db.receipts.get(key);
          if (!receipt
            || receipt.expected_sha256 !== args[2]
            || receipt.row_count !== args[3]
            || receipt.verified !== 0) return { meta: { changes: 0 } };
          db.writeStatements += 1;
          receipt.verified = 1;
          return { meta: { changes: 1 } };
        }
        throw new Error(`Unhandled shard run SQL: ${sql}`);
      }
    };
  }

  async batch(statements) {
    const rowSnapshot = new Map(this.rows);
    const receiptSnapshot = new Map([...this.receipts].map(([key, value]) => [key, { ...value }]));
    const writesBefore = this.writeStatements;
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      if (this.throwAfterCommitOnce) {
        this.throwAfterCommitOnce = false;
        throw Object.assign(new Error("simulated transport failure after commit"), { afterCommit: true });
      }
      return results;
    } catch (error) {
      if (!error.afterCommit) {
        this.rows = rowSnapshot;
        this.receipts = receiptSnapshot;
        this.writeStatements = writesBefore;
      }
      throw error;
    }
  }
}

function runtimeEnv() {
  return {
    SESSION_SECRET: SECRET,
    CULINARY_CONTROL_DB: new FakeControlD1(),
    CULINARY_RECIPE_SHARD_00_DB: new FakeShardD1("culinary-recipes-00"),
    CULINARY_RECIPE_SHARD_01_DB: new FakeShardD1("culinary-recipes-01")
  };
}

async function sessionCookie(controlDb) {
  const now = Math.floor(Date.now() / 1000);
  const token = await createSessionToken({
    accountId: controlDb.account.account_id,
    sessionVersion: controlDb.account.session_version,
    nowEpochSeconds: now,
    ttlSeconds: 3600
  }, SECRET);
  return `__Host-culinary_session=${token}`;
}

async function authenticatedRequest(env, path, { method = "GET", body = null } = {}) {
  const headers = { cookie: await sessionCookie(env.CULINARY_CONTROL_DB) };
  if (body != null) headers["content-type"] = "application/json";
  return new Request(`${ORIGIN}${path}`, { method, headers, body: body == null ? undefined : JSON.stringify(body) });
}

function syntheticBatch() {
  return {
    batchId: "synthetic-batch",
    shardNumber: 0,
    batchNumber: 0,
    rowCount: 2,
    expectedSha256: "a".repeat(64),
    entries: [
      { ordinal: 0, recipeId: "synthetic:a", bodyJson: "{\"a\":1}", bodyBytes: 7, bodySha256: "b".repeat(64), sourceCohortId: "synthetic" },
      { ordinal: 1, recipeId: "synthetic:b", bodyJson: "{\"b\":2}", bodyBytes: 7, bodySha256: "c".repeat(64), sourceCohortId: "synthetic" }
    ]
  };
}

test("Step 8D unauthenticated requests fail before either protected shard is touched", async () => {
  const env = runtimeEnv();
  const response = await getStep8d({ request: new Request(`${ORIGIN}/api/step8d/populate?action=progress`), env });
  assert.equal(response.status, 401);
  assert.equal(env.CULINARY_RECIPE_SHARD_00_DB.queryCount, 0);
  assert.equal(env.CULINARY_RECIPE_SHARD_01_DB.queryCount, 0);
  const body = await response.json();
  assert.equal(body.shardQueries, 0);
});

test("Step 8D Free-limit simulation fails closed after auth but before shard reads", async () => {
  const env = runtimeEnv();
  const request = await authenticatedRequest(env, "/api/step8d/populate?simulate=free-limit");
  const response = await getStep8d({ request, env });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, "STEP8D_FREE_LIMIT_FAIL_CLOSED");
  assert.equal(body.metrics.shardQueries, 0);
  assert.equal(env.CULINARY_RECIPE_SHARD_00_DB.queryCount, 0);
  assert.equal(env.CULINARY_RECIPE_SHARD_01_DB.queryCount, 0);
});

test("unknown or mutated incoming batches are rejected before live writes", async () => {
  const unknown = await validateStep8DIncomingBatch({ batchId: "not-frozen", entries: [] });
  assert.equal(unknown.pass, false);
  assert.equal(unknown.reason, "UNKNOWN_BATCH_ID");

  const expected = plan.batches[0];
  const mutated = await validateStep8DIncomingBatch({
    batchId: expected.batchId,
    entries: expected.entries.map(entry => ({ ...entry, bodyJson: "{}" }))
  });
  assert.equal(mutated.pass, false);
  assert.equal(mutated.reason, "BODY_DESCRIPTOR_MISMATCH");
});

test("fresh write stores receipt unverified, verifies exact rows, then promotes it; replay is read-only", async () => {
  const db = new FakeShardD1("synthetic");
  const batch = syntheticBatch();
  const first = await writeStep8DBatch(db, batch);
  assert.equal(first.pass, true);
  assert.equal(first.status, "WRITTEN_AND_EXACTLY_VERIFIED");
  assert.equal(db.receipts.get(db.key(STEP8D_CORPUS_VERSION, batch.batchId)).verified, 1);
  const writes = db.writeStatements;

  const replay = await writeStep8DBatch(db, batch);
  assert.equal(replay.pass, true);
  assert.equal(replay.skipped, true);
  assert.equal(replay.status, "VERIFIED_IDEMPOTENT_SKIP");
  assert.equal(db.writeStatements, writes);
  assert.ok(first.d1Subqueries + 1 <= STEP8D_MAX_PROTECTED_D1_SUBQUERIES);
});

test("unknown commit state resumes from the unverified receipt and promotes only after exact row verification", async () => {
  const db = new FakeShardD1("synthetic");
  const batch = syntheticBatch();
  db.throwAfterCommitOnce = true;
  const uncertain = await writeStep8DBatch(db, batch);
  assert.equal(uncertain.pass, false);
  assert.equal(uncertain.status, "WRITE_ERROR_UNKNOWN_COMMIT_STATE");
  assert.equal(db.receipts.get(db.key(STEP8D_CORPUS_VERSION, batch.batchId)).verified, 0);

  const recovered = await writeStep8DBatch(db, batch);
  assert.equal(recovered.pass, true);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.status, "RECOVERED_UNKNOWN_COMMIT_AND_VERIFIED");
  assert.equal(db.receipts.get(db.key(STEP8D_CORPUS_VERSION, batch.batchId)).verified, 1);
});

test("receipt-only progress can prove all 51 frozen batches and 501 rows without recipe-body scans", async () => {
  const shards = [new FakeShardD1("s0"), new FakeShardD1("s1")];
  for (const batch of plan.batches) {
    shards[batch.shardNumber].receipts.set(shards[batch.shardNumber].key(STEP8D_CORPUS_VERSION, batch.batchId), {
      batch_id: batch.batchId,
      expected_sha256: batch.expectedSha256,
      row_count: batch.rowCount,
      verified: 1
    });
  }
  const progress = await readStep8DProgress(shards);
  assert.equal(progress.pass, true);
  assert.equal(progress.completeVerified, true);
  assert.equal(progress.verifiedBatchCount, STEP8D_EXPECTED_BATCH_COUNT);
  assert.equal(progress.verifiedRowCount, STEP8D_EXPECTED_RECIPE_COUNT);
  assert.equal(progress.fullCorpusScans, 0);
  assert.equal(progress.d1Subqueries, 2);
});

test("bounded cross-shard evidence reads one frozen canary row per shard", async () => {
  const shards = [new FakeShardD1("s0"), new FakeShardD1("s1")];
  for (const shardNumber of [0, 1]) {
    const batch = plan.batches.find(candidate => candidate.shardNumber === shardNumber);
    const entry = batch.entries[0];
    shards[shardNumber].rows.set(shards[shardNumber].key(STEP8D_CORPUS_VERSION, entry.recipeId), {
      recipe_id: entry.recipeId,
      body_sha256: entry.bodySha256,
      body_bytes: entry.bodyBytes,
      source_cohort_id: entry.sourceCohortId
    });
  }
  const read = await readStep8DCrossShard(shards);
  assert.equal(read.pass, true);
  assert.equal(read.rows.length, 2);
  assert.equal(read.d1Subqueries, 2);
});

test("protected pointer activation and rollback never delete populated rows or touch public runtime state", async () => {
  const control = new FakeControlD1();
  const initialized = await initializeStep8DPointer(control);
  assert.equal(initialized.initialized, true);
  const activated = await activateStep8DPointer(control);
  assert.equal(activated.pass, true);
  assert.equal(control.pointer.activeVersion, STEP8D_CORPUS_VERSION);
  const rolledBack = await rollbackStep8DPointer(control);
  assert.equal(rolledBack.pass, true);
  assert.equal(control.pointer.activeVersion, "step8b-canary-v1");
  assert.equal(control.pointer.previousVersion, STEP8D_CORPUS_VERSION);
});

test("Step 8D API exposes bounded status and rejects activation before complete receipts", async () => {
  const env = runtimeEnv();
  let request = await authenticatedRequest(env, "/api/step8d/populate?action=status");
  let response = await getStep8d({ request, env });
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.plan.recipeCount, 501);
  assert.equal(body.plan.batchCount, 51);
  assert.equal(body.plan.shardCount, 2);
  assert.equal(body.metrics.shardQueries, 0);

  request = await authenticatedRequest(env, "/api/step8d/populate", { method: "POST", body: { action: "initialize" } });
  response = await postStep8d({ request, env });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.protectedPointerInitialized, true);
  assert.ok(body.metrics.d1Subqueries <= 16);

  request = await authenticatedRequest(env, "/api/step8d/populate", { method: "POST", body: { action: "activate" } });
  response = await postStep8d({ request, env });
  assert.equal(response.status, 409);
  body = await response.json();
  assert.equal(body.error, "STEP8D_POPULATION_NOT_EXACTLY_VERIFIED");
  assert.equal(env.CULINARY_CONTROL_DB.pointer.activeVersion, "step8b-canary-v1");
});
