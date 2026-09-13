import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { createSessionToken } from "../src/server/auth-core.mjs";
import {
  STEP8B_BASELINE_VERSION,
  STEP8B_LIVE_CORPUS_VERSION,
  buildStep8BLiveFixture,
  step8bShardForRecipeId
} from "../src/server/step8b-live.mjs";
import {
  buildStep8APopulationPlan
} from "../scripts/corpus-scale-step8a-core.mjs";
import {
  buildStep8BMachineCanaryPlan
} from "../scripts/corpus-scale-step8b-core.mjs";
import { recipeDatabaseShardForId } from "../scripts/corpus-scale-step7a-core.mjs";
import {
  onRequestGet as getStep8bCanary,
  onRequestPost as postStep8bCanary
} from "../functions/api/step8b/canary.js";

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
      get args() { return args; },
      bind(...values) { args = values; return this; },
      async first() {
        db.queryCount += 1;
        if (sql.startsWith("SELECT account_id") && sql.includes("FROM invited_accounts")) {
          return db.account.account_id === args[0] ? db.account : null;
        }
        if (sql.includes("FROM step8b_canary_active_version")) {
          if (!db.pointer || args[0] !== "recipe-corpus-canary") return null;
          return {
            active_version: db.pointer.activeVersion,
            previous_version: db.pointer.previousVersion
          };
        }
        throw new Error(`Unhandled control first SQL: ${sql}`);
      },
      async run() {
        db.queryCount += 1;
        if (sql.includes("CREATE TABLE IF NOT EXISTS step8b_canary_active_version")) {
          return { meta: { changes: 0 } };
        }
        if (sql.includes("INSERT OR IGNORE INTO step8b_canary_active_version")) {
          if (!db.pointer) {
            db.pointer = { activeVersion: args[1], previousVersion: null };
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }
        if (sql.includes("UPDATE step8b_canary_active_version")) {
          if (!db.pointer || args[2] !== "recipe-corpus-canary") return { meta: { changes: 0 } };
          db.pointer = { activeVersion: args[0], previousVersion: args[1] };
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
    this.schemaStatements = 0;
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
          const results = args.slice(1)
            .map(id => db.rows.get(db.key(version, id)))
            .filter(Boolean);
          return { results, meta: { rows_read: results.length, rows_written: 0 } };
        }
        throw new Error(`Unhandled shard all SQL: ${sql}`);
      },
      async run() {
        db.queryCount += 1;
        if (sql.includes("CREATE TABLE IF NOT EXISTS corpus_recipe_bodies") || sql.includes("CREATE TABLE IF NOT EXISTS corpus_population_receipts")) {
          db.schemaStatements += 1;
          return { meta: { changes: 0 } };
        }
        if (sql.includes("INSERT OR ABORT INTO corpus_recipe_bodies")) {
          const key = db.key(args[0], args[2]);
          if (db.rows.has(key)) throw new Error("duplicate recipe row");
          db.writeStatements += 1;
          db.rows.set(key, {
            corpus_version: args[0],
            ordinal: args[1],
            recipe_id: args[2],
            body_json: args[3],
            body_bytes: args[4],
            body_sha256: args[5],
            source_cohort_id: args[6]
          });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("INSERT OR ABORT INTO corpus_population_receipts")) {
          const key = db.key(args[0], args[1]);
          if (db.receipts.has(key)) throw new Error("duplicate receipt");
          db.writeStatements += 1;
          db.receipts.set(key, {
            expected_sha256: args[2],
            row_count: args[3],
            verified: 1
          });
          return { meta: { changes: 1 } };
        }
        throw new Error(`Unhandled shard run SQL: ${sql}`);
      }
    };
  }

  async batch(statements) {
    const rowSnapshot = new Map(this.rows);
    const receiptSnapshot = new Map(this.receipts);
    const writesBefore = this.writeStatements;
    const queriesBefore = this.queryCount;
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    } catch (error) {
      this.rows = rowSnapshot;
      this.receipts = receiptSnapshot;
      this.writeStatements = writesBefore;
      this.queryCount = queriesBefore + statements.length;
      throw error;
    }
  }
}

function env() {
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

async function request(controlDb, path, { method = "GET", body = null } = {}) {
  const headers = { cookie: await sessionCookie(controlDb) };
  if (body != null) headers["content-type"] = "application/json";
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body)
  });
}

async function get(runtimeEnv, path) {
  return getStep8bCanary({ request: await request(runtimeEnv.CULINARY_CONTROL_DB, path), env: runtimeEnv });
}

async function post(runtimeEnv, action) {
  return postStep8bCanary({
    request: await request(runtimeEnv.CULINARY_CONTROL_DB, "/api/step8b/canary", { method: "POST", body: { action } }),
    env: runtimeEnv
  });
}

function machinePlan() {
  const sourceCohorts = [{
    id: "reviewed-runtime-oracle",
    sourceName: "Culinary Recommender reviewed runtime corpus",
    sourceVersion: "step8b-golden-oracle-v1",
    admissionState: "PASS_ALREADY_ESTABLISHED",
    protectedPopulationAllowed: true,
    publicRuntimeActivationAuthorized: false,
    evidenceRefs: ["docs/CORPUS_SCALE_STEP7D_PROTECTED_84_CANARY.md"]
  }];
  const entries = ALL_RECIPES.map((recipe, ordinal) => {
    const body = JSON.stringify(recipe);
    return {
      ordinal,
      recipeId: recipe.id,
      bodySha256: createHash("sha256").update(body).digest("hex"),
      bodyBytes: Buffer.byteLength(body, "utf8"),
      sourceCohortId: sourceCohorts[0].id
    };
  });
  return buildStep8BMachineCanaryPlan(buildStep8APopulationPlan({
    corpusVersion: "v0001",
    sourceCohorts,
    entries
  }), { maxRowsPerShard: 2 });
}

test("runtime Step 8B fixture reuses the frozen router and exact bounded machine selection", async () => {
  for (const recipe of ALL_RECIPES) {
    assert.equal(step8bShardForRecipeId(recipe.id), recipeDatabaseShardForId(recipe.id, 2));
  }
  const live = await buildStep8BLiveFixture();
  const machine = machinePlan();
  assert.equal(live.shardBatches.length, 2);
  assert.deepEqual(
    live.shardBatches.map(batch => batch.entries.map(entry => entry.recipeId)),
    machine.shardBatches.map(batch => batch.entries.map(entry => entry.recipeId))
  );
  assert.deepEqual(
    live.shardBatches.map(batch => batch.expectedSha256),
    machine.shardBatches.map(batch => batch.expectedSha256)
  );
});

test("unauthenticated Step 8B requests are denied before either recipe shard is touched", async () => {
  const runtimeEnv = env();
  const response = await getStep8bCanary({
    request: new Request(`${ORIGIN}/api/step8b/canary?action=bindings`),
    env: runtimeEnv
  });
  assert.equal(response.status, 401);
  assert.equal(runtimeEnv.CULINARY_RECIPE_SHARD_00_DB.queryCount, 0);
  assert.equal(runtimeEnv.CULINARY_RECIPE_SHARD_01_DB.queryCount, 0);
  const body = await response.json();
  assert.equal(body.shardQueries, 0);
});

test("Free-limit simulation fails closed after auth but before recipe-shard access", async () => {
  const runtimeEnv = env();
  const response = await get(runtimeEnv, "/api/step8b/canary?simulate=free-limit");
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, "STEP8B_FREE_LIMIT_FAIL_CLOSED");
  assert.equal(body.metrics.shardQueries, 0);
  assert.equal(runtimeEnv.CULINARY_RECIPE_SHARD_00_DB.queryCount, 0);
  assert.equal(runtimeEnv.CULINARY_RECIPE_SHARD_01_DB.queryCount, 0);
});

test("missing second binding fails closed and does not touch the available shard", async () => {
  const runtimeEnv = env();
  delete runtimeEnv.CULINARY_RECIPE_SHARD_01_DB;
  const response = await get(runtimeEnv, "/api/step8b/canary?action=bindings");
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, "STEP8B_BINDINGS_NOT_CONFIGURED");
  assert.deepEqual(body.missingBindings, ["CULINARY_RECIPE_SHARD_01_DB"]);
  assert.equal(runtimeEnv.CULINARY_RECIPE_SHARD_00_DB.queryCount, 0);
});

test("full Step 8B live sequence proves binding, partial recovery, idempotency, bounded cross-shard read and rollback", async () => {
  const runtimeEnv = env();
  const observed = [];

  let response = await get(runtimeEnv, "/api/step8b/canary?action=bindings");
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.boundShardBindings, 2);
  observed.push(body.metrics.d1Subqueries);

  response = await post(runtimeEnv, "initialize");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.deepEqual(body.shardResults, [
    { shardNumber: 0, initialized: true },
    { shardNumber: 1, initialized: true }
  ]);
  observed.push(body.metrics.d1Subqueries);

  response = await post(runtimeEnv, "partial");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.secondShardTouched, false);
  assert.equal(body.firstShard.status, "WRITTEN_AND_VERIFIED");
  assert.equal(runtimeEnv.CULINARY_RECIPE_SHARD_01_DB.writeStatements, 0);
  observed.push(body.metrics.d1Subqueries);

  response = await post(runtimeEnv, "resume");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.partialFailureRecoveryPass, true);
  assert.equal(body.firstShard.status, "VERIFIED_IDEMPOTENT_SKIP");
  assert.equal(body.secondShard.status, "WRITTEN_AND_VERIFIED");
  observed.push(body.metrics.d1Subqueries);

  const writesBeforeReplay = [
    runtimeEnv.CULINARY_RECIPE_SHARD_00_DB.writeStatements,
    runtimeEnv.CULINARY_RECIPE_SHARD_01_DB.writeStatements
  ];
  response = await post(runtimeEnv, "replay");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.idempotentWritePass, true);
  assert.deepEqual([
    runtimeEnv.CULINARY_RECIPE_SHARD_00_DB.writeStatements,
    runtimeEnv.CULINARY_RECIPE_SHARD_01_DB.writeStatements
  ], writesBeforeReplay);
  observed.push(body.metrics.d1Subqueries);

  response = await get(runtimeEnv, "/api/step8b/canary?action=read");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.authenticatedCrossShardReadPass, true);
  assert.equal(body.touchedShards, 2);
  assert.equal(body.fullCorpusScans, 0);
  observed.push(body.metrics.d1Subqueries);

  response = await post(runtimeEnv, "activate");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.pointer.activeVersion, STEP8B_LIVE_CORPUS_VERSION);
  assert.equal(body.normalPublicRecommendationRuntimeChanged, false);
  observed.push(body.metrics.d1Subqueries);

  response = await post(runtimeEnv, "rollback");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.rollbackPass, true);
  assert.equal(body.destructiveDeletePerformed, false);
  assert.equal(body.canaryRowsRetained, true);
  assert.equal(body.pointer.activeVersion, STEP8B_BASELINE_VERSION);
  assert.equal(body.pointer.previousVersion, STEP8B_LIVE_CORPUS_VERSION);
  observed.push(body.metrics.d1Subqueries);

  response = await get(runtimeEnv, "/api/step8b/canary?action=evidence");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.boundShardBindings, 2);
  assert.equal(body.authenticatedCrossShardReadPass, true);
  assert.equal(body.rollbackPass, true);
  assert.equal(body.fullCorpusScans, 0);
  assert.equal(body.normalPublicRecommendationRuntimeChanged, false);
  observed.push(body.metrics.d1Subqueries);

  assert.ok(Math.max(...observed) <= 16, `observed Step 8B D1 subqueries exceeded budget: ${observed.join(",")}`);
});
