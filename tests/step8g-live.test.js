import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_CORPUS_VERSION,
  STEP8G_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_EXPECTED_RECIPE_COUNT,
  STEP8G_EXPECTED_ROUTE_COUNT,
  STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
  activateStep8GPointer,
  expectedStep8GBodyBatchIds,
  expectedStep8GRouteBatchIds,
  materializeStep8GIncomingBodyBatch,
  publicStep8GLiveSummary,
  rollbackStep8GPointer,
  writeStep8GRouteBatch
} from "../src/server/step8g-live-runtime.mjs";
import {
  STEP8G_BODY_LOOKUP_IDS_PER_QUERY,
  STEP8G_D1_MAX_BOUND_PARAMETERS,
  STEP8G_MAX_HYDRATION_D1_SUBQUERIES,
  STEP8G_ROUTE_LOOKUP_IDS_PER_QUERY,
  hydrateStep8GProtectedRecipesBounded,
  step8gHydrationQueryBudget
} from "../src/server/step8g-hydration-runtime.mjs";
import { sha256Hex } from "../src/server/step8b-live.mjs";
import { onRequestGet as getStep8g } from "../functions/api/step8g/populate.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";

class HydrationControlD1 {
  constructor(routes, { activeVersion = "v8002" } = {}) {
    this.routes = new Map(routes.map(route => [route.recipeId, { ...route }]));
    this.activeVersion = activeVersion;
    this.bindCounts = [];
  }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) {
        args = values;
        db.bindCounts.push(values.length);
        if (values.length > STEP8G_D1_MAX_BOUND_PARAMETERS) throw new Error(`too many D1 binds: ${values.length}`);
        return this;
      },
      async all() {
        if (!sql.includes("FROM corpus_protected_recipe_routes")) throw new Error(`Unhandled control all SQL: ${sql}`);
        if (db.activeVersion !== args[1]) return { results: [] };
        const results = args.slice(3).map(id => db.routes.get(id)).filter(Boolean).map(route => ({
          recipe_id: route.recipeId,
          corpus_version: route.corpusVersion,
          shard_number: route.shardNumber,
          source_cohort_id: route.sourceCohortId,
          body_sha256: route.bodySha256,
          body_bytes: route.bodyBytes
        }));
        return { results };
      }
    };
  }
}

class HydrationShardD1 {
  constructor(rows) {
    this.rows = new Map(rows.map(row => [row.recipeId, { ...row }]));
    this.bindCounts = [];
  }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) {
        args = values;
        db.bindCounts.push(values.length);
        if (values.length > STEP8G_D1_MAX_BOUND_PARAMETERS) throw new Error(`too many D1 binds: ${values.length}`);
        return this;
      },
      async all() {
        if (!sql.includes("FROM corpus_recipe_bodies")) throw new Error(`Unhandled shard all SQL: ${sql}`);
        const ids = args.filter(value => typeof value === "string" && !["v8001", "v8002"].includes(value));
        const results = ids.map(id => db.rows.get(id)).filter(Boolean).map(row => ({
          corpus_version: row.corpusVersion,
          recipe_id: row.recipeId,
          body_json: row.bodyJson,
          body_bytes: row.bodyBytes,
          body_sha256: row.bodySha256,
          source_cohort_id: row.sourceCohortId
        }));
        return { results };
      }
    };
  }
}

class RouteShardD1 {
  constructor(rows) {
    this.rows = new Map(rows.map(row => [row.recipeId, { ...row }]));
  }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async all() {
        if (!sql.includes("FROM corpus_recipe_bodies")) throw new Error(`Unhandled route shard SQL: ${sql}`);
        const ids = args.slice(1);
        return {
          results: ids.map(id => db.rows.get(id)).filter(Boolean).map(row => ({
            recipe_id: row.recipeId,
            body_sha256: row.bodySha256,
            body_bytes: row.bodyBytes,
            source_cohort_id: row.sourceCohortId
          }))
        };
      }
    };
  }
}

class RouteControlD1 {
  constructor() {
    this.routes = new Map();
    this.receipts = new Map();
    this.writeStatements = 0;
  }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      sql,
      bind(...values) { args = values; return this; },
      async first() {
        if (sql.includes("FROM corpus_protected_route_receipts")) return db.receipts.get(args[1]) || null;
        throw new Error(`Unhandled route control first SQL: ${sql}`);
      },
      async all() {
        if (sql.includes("FROM corpus_protected_recipe_routes")) {
          const ids = args.slice(1);
          return {
            results: ids.map(id => db.routes.get(id)).filter(Boolean).map(route => ({
              recipe_id: route.recipeId,
              corpus_version: route.corpusVersion,
              shard_number: route.shardNumber,
              source_cohort_id: route.sourceCohortId,
              body_sha256: route.bodySha256,
              body_bytes: route.bodyBytes
            }))
          };
        }
        throw new Error(`Unhandled route control all SQL: ${sql}`);
      },
      async run() {
        if (sql.includes("INSERT OR ABORT INTO corpus_protected_recipe_routes")) {
          const recipeId = args[1];
          if (db.routes.has(recipeId)) throw new Error("duplicate route");
          db.routes.set(recipeId, {
            recipeId,
            corpusVersion: args[2],
            shardNumber: args[3],
            sourceCohortId: args[4],
            bodySha256: args[5],
            bodyBytes: args[6]
          });
          db.writeStatements += 1;
          return { meta: { changes: 1 } };
        }
        if (sql.includes("INSERT OR ABORT INTO corpus_protected_route_receipts")) {
          db.receipts.set(args[1], {
            expected_sha256: args[2],
            row_count: args[3],
            verified: 0
          });
          db.writeStatements += 1;
          return { meta: { changes: 1 } };
        }
        if (sql.includes("UPDATE corpus_protected_route_receipts") && sql.includes("SET verified = 1")) {
          const receipt = db.receipts.get(args[1]);
          if (!receipt || receipt.expected_sha256 !== args[2] || receipt.row_count !== args[3] || receipt.verified !== 0) {
            return { meta: { changes: 0 } };
          }
          receipt.verified = 1;
          db.writeStatements += 1;
          return { meta: { changes: 1 } };
        }
        throw new Error(`Unhandled route control run SQL: ${sql}`);
      }
    };
  }

  async batch(statements) {
    const output = [];
    for (const statement of statements) output.push(await statement.run());
    return output;
  }
}

class PointerControlD1 {
  constructor(pointer) {
    this.pointer = { ...pointer };
  }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() {
        if (sql.includes("FROM corpus_protected_active_version")) {
          return {
            active_version: db.pointer.activeVersion,
            previous_version: db.pointer.previousVersion,
            manifest_sha256: db.pointer.manifestSha256
          };
        }
        throw new Error(`Unhandled pointer first SQL: ${sql}`);
      },
      async run() {
        if (sql.includes("UPDATE corpus_protected_active_version")) {
          db.pointer = { activeVersion: args[0], previousVersion: args[1], manifestSha256: args[2] };
          return { meta: { changes: 1 } };
        }
        throw new Error(`Unhandled pointer run SQL: ${sql}`);
      }
    };
  }
}

function routeEntry(index, shardNumber = 0, corpusVersion = "v8002") {
  return {
    recipeId: `route_test_${String(index).padStart(3, "0")}`,
    corpusVersion,
    shardNumber,
    sourceCohortId: corpusVersion === "v8001" ? "unitools-world-recipes-v1_1_0" : "FORKRECIPE_PINNED_STEP7E",
    bodySha256: String(index % 10).repeat(64),
    bodyBytes: 100 + index
  };
}

test("Step 8G runtime freezes 915 child rows, 1416 composed routes, and the existing two-shard topology", () => {
  const summary = publicStep8GLiveSummary();
  assert.equal(summary.recipeCount, STEP8G_EXPECTED_RECIPE_COUNT);
  assert.equal(summary.cumulativeRecipeCount, STEP8G_EXPECTED_ROUTE_COUNT);
  assert.equal(summary.bodyBatchCount, STEP8G_EXPECTED_BODY_BATCH_COUNT);
  assert.equal(summary.shardCount, 2);
  assert.equal(expectedStep8GBodyBatchIds().length, 93);
  assert.equal(expectedStep8GRouteBatchIds().length, 144);
  assert.equal(summary.publicRuntimeActivationAuthorized, false);
  assert.equal(summary.recommendationAdmissionAuthorized, false);
  assert.equal(summary.billingExpansionAuthorized, false);
  assert.equal(summary.thirdShardAuthorized, false);
});

test("unknown body batches fail closed before source materialization or D1 writes", async () => {
  const result = await materializeStep8GIncomingBodyBatch({ batchId: "not-frozen", sourceEntries: [] });
  assert.equal(result.pass, false);
  assert.equal(result.reason, "UNKNOWN_BODY_BATCH_ID");
});

test("Step 8G unauthenticated API requests return 401 before protected shard access", async () => {
  const explodingDb = { prepare() { throw new Error("protected database should not be touched"); } };
  const response = await getStep8g({
    request: new Request(`${ORIGIN}/api/step8g/populate?action=status`),
    env: {
      SESSION_SECRET: "0123456789abcdef0123456789abcdef",
      CULINARY_CONTROL_DB: explodingDb,
      CULINARY_RECIPE_SHARD_00_DB: explodingDb,
      CULINARY_RECIPE_SHARD_01_DB: explodingDb
    }
  });
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error, "UNAUTHORIZED");
  assert.equal(body.protectedDataReturned, false);
  assert.equal(body.shardQueries, 0);
});

test("fresh 10-row route writes consume at most 15 internal D1 subqueries and replay is write-free", async () => {
  const entries = Array.from({ length: 10 }, (_, index) => routeEntry(index));
  const shardRows = entries.map(entry => ({ ...entry }));
  const shards = [new RouteShardD1(shardRows), new RouteShardD1([])];
  const control = new RouteControlD1();
  const payload = { action: "write-route", batchId: "route-v8002-s00-b000000", entries };

  const first = await writeStep8GRouteBatch(control, shards, payload);
  assert.equal(first.pass, true);
  assert.equal(first.status, "WRITTEN_AND_EXACTLY_VERIFIED");
  assert.equal(first.d1Subqueries, 15);
  assert.equal(1 + first.d1Subqueries, STEP8G_MAX_PROTECTED_D1_SUBQUERIES);
  const writes = control.writeStatements;

  const replay = await writeStep8GRouteBatch(control, shards, payload);
  assert.equal(replay.pass, true);
  assert.equal(replay.skipped, true);
  assert.equal(replay.status, "VERIFIED_IDEMPOTENT_SKIP");
  assert.equal(control.writeStatements, writes);
  assert.equal(replay.d1Subqueries, 2);
});

test("256-candidate hydration obeys both D1's 100-bind ceiling and the protected-query budget", async () => {
  const routes = [];
  const shardRows = [[], []];
  for (let index = 0; index < 256; index += 1) {
    const shardNumber = index === 0 ? 0 : 1;
    const recipeId = `hydrate_${String(index).padStart(3, "0")}`;
    const bodyJson = JSON.stringify({ id: recipeId });
    const bodySha256 = await sha256Hex(bodyJson);
    const route = {
      recipeId,
      corpusVersion: "v8002",
      shardNumber,
      sourceCohortId: "FORKRECIPE_PINNED_STEP7E",
      bodySha256,
      bodyBytes: new TextEncoder().encode(bodyJson).byteLength
    };
    routes.push(route);
    shardRows[shardNumber].push({ ...route, bodyJson });
  }

  const control = new HydrationControlD1(routes);
  const shards = [new HydrationShardD1(shardRows[0]), new HydrationShardD1(shardRows[1])];
  const hydrated = await hydrateStep8GProtectedRecipesBounded(control, shards, routes.map(route => route.recipeId));
  assert.equal(hydrated.pass, true);
  assert.equal(hydrated.packets.length, 256);
  assert.equal(hydrated.routeQueries, 3);
  assert.equal(hydrated.shardQueries, 4);
  assert.equal(1 + hydrated.d1Subqueries, STEP8G_MAX_HYDRATION_D1_SUBQUERIES);
  assert.ok(1 + hydrated.d1Subqueries <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES);
  assert.ok(Math.max(...control.bindCounts) <= STEP8G_D1_MAX_BOUND_PARAMETERS);
  assert.ok(Math.max(...shards.flatMap(shard => shard.bindCounts)) <= STEP8G_D1_MAX_BOUND_PARAMETERS);
  assert.equal(3 + STEP8G_ROUTE_LOOKUP_IDS_PER_QUERY, STEP8G_D1_MAX_BOUND_PARAMETERS);
  assert.equal(2 + STEP8G_BODY_LOOKUP_IDS_PER_QUERY, STEP8G_D1_MAX_BOUND_PARAMETERS);

  const budget = step8gHydrationQueryBudget(256, [1, 255]);
  assert.equal(budget.d1Subqueries, 8);
});

test("rollback state prevents protected Step 8G hydration from returning rows", async () => {
  const bodyJson = JSON.stringify({ id: "rolled_back" });
  const bodySha256 = await sha256Hex(bodyJson);
  const route = {
    recipeId: "rolled_back",
    corpusVersion: "v8002",
    shardNumber: 0,
    sourceCohortId: "FORKRECIPE_PINNED_STEP7E",
    bodySha256,
    bodyBytes: new TextEncoder().encode(bodyJson).byteLength
  };
  const control = new HydrationControlD1([route], { activeVersion: "v8001" });
  const result = await hydrateStep8GProtectedRecipesBounded(control, [new HydrationShardD1([{ ...route, bodyJson }]), new HydrationShardD1([])], [route.recipeId]);
  assert.equal(result.pass, false);
  assert.equal(result.reason, "ROUTE_LOOKUP_INCOMPLETE_OR_COMPOSITION_INACTIVE");
  assert.equal(result.shardQueries, 0);
});

test("Step 8G pointer can activate from the proven Step 8D rollback state and roll back non-destructively", async () => {
  const summary = publicStep8GLiveSummary();
  const control = new PointerControlD1({
    activeVersion: "step8b-canary-v1",
    previousVersion: "v8001",
    manifestSha256: summary.parentManifestSha256
  });
  const activated = await activateStep8GPointer(control);
  assert.equal(activated.pass, true);
  assert.equal(control.pointer.activeVersion, STEP8G_CORPUS_VERSION);
  assert.equal(control.pointer.previousVersion, "v8001");
  assert.equal(control.pointer.manifestSha256, summary.compositionSha256);

  const rolledBack = await rollbackStep8GPointer(control);
  assert.equal(rolledBack.pass, true);
  assert.equal(control.pointer.activeVersion, "v8001");
  assert.equal(control.pointer.previousVersion, STEP8G_CORPUS_VERSION);
  assert.equal(control.pointer.manifestSha256, summary.parentManifestSha256);
});
