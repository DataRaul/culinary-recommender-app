import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8008_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8008-runtime-descriptor.mjs";
import {
  STEP8G_V8008_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8008_EXPECTED_RECIPE_COUNT,
  STEP8G_V8008_EXPECTED_ROUTE_COUNT,
  expectedStep8GV8008BodyBatchIds,
  expectedStep8GV8008RouteBatchIds,
  materializeStep8GV8008IncomingBodyBatch,
  publicStep8GV8008Summary
} from "../src/server/step8g-v8008-live-runtime.mjs";
import { STEP8G_V8008_MAX_HYDRATED_CANDIDATES, STEP8G_V8008_MAX_HYDRATION_D1_SUBQUERIES } from "../src/server/step8g-v8008-hydration-runtime.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/cocina-mexicana-v8008-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8008 runtime is frozen to the earned two-source prewrite and exact composition", () => {
  const summary = publicStep8GV8008Summary();
  assert.equal(summary.corpusVersion, "v8008");
  assert.equal(summary.parentCorpusVersion, "v8007");
  assert.equal(summary.recipeCount, 6476);
  assert.equal(summary.cumulativeRecipeCount, 10171);
  assert.deepEqual(summary.sourceCohortIds, [
    "ORA_GALVAN_RIVERA_1845_DICCIONARIO_COCINA_AE3BD2C",
    "ORA_COCINERA_POBLANA_1890_ANONYMOUS_AE3BD2C"
  ]);
  assert.equal(summary.anonymousAuthorHandling, "SOURCE_SPECIFIC_DOCUMENTED_ONLY");
  assert.equal(summary.shardCount, 2);
  assert.equal(summary.maxRowsPerBatch, 10);
  assert.equal(summary.maxProtectedD1Subqueries, 16);
  assert.equal(summary.restartSafeResume, true);
  assert.equal(summary.publicRuntimeActivationAuthorized, false);
  assert.equal(summary.recommendationAdmissionAuthorized, false);
  assert.equal(summary.thirdShardAuthorized, false);
  assert.equal(summary.layerManifestSha256, prewrite.layer.manifestSha256);
  assert.equal(summary.populationPlanSha256, prewrite.layer.populationPlanSha256);
  assert.equal(STEP8G_V8008_RUNTIME_DESCRIPTOR.sourceCommit, prewrite.source.commit);
});

test("v8008 freezes 649 body and 649 route batches over the exact two-shard child layout", () => {
  assert.equal(STEP8G_V8008_EXPECTED_RECIPE_COUNT, 6476);
  assert.equal(STEP8G_V8008_EXPECTED_ROUTE_COUNT, 10171);
  assert.equal(STEP8G_V8008_EXPECTED_BODY_BATCH_COUNT, 649);
  assert.deepEqual(STEP8G_V8008_RUNTIME_DESCRIPTOR.bodyShardRows, [3251, 3225]);
  assert.equal(expectedStep8GV8008BodyBatchIds().length, 649);
  assert.equal(expectedStep8GV8008RouteBatchIds().length, 649);
  assert.equal(expectedStep8GV8008BodyBatchIds()[0], "s00-b000000");
  assert.equal(expectedStep8GV8008RouteBatchIds().at(-1), "route-v8008-s01-b000322");
});

test("public-safe descriptor contains fingerprints only, not protected recipe bodies", () => {
  assert.deepEqual(Object.keys(STEP8G_V8008_RUNTIME_DESCRIPTOR), [
    "sourceCommit",
    "layerManifestSha256",
    "populationPlanSha256",
    "bodyHashHexByShard",
    "routeHashHexByShard",
    "bodyShardRows",
    "parentCompositionRouteCount",
    "composedRouteCount"
  ]);
  assert.equal(STEP8G_V8008_RUNTIME_DESCRIPTOR.parentCompositionRouteCount, 3695);
  assert.equal(STEP8G_V8008_RUNTIME_DESCRIPTOR.composedRouteCount, 10171);
  assert.equal(JSON.stringify(STEP8G_V8008_RUNTIME_DESCRIPTOR).includes("rawJson"), false);
});

test("body materialization fails closed on unclassified or structurally invalid source rows", async () => {
  const first = expectedStep8GV8008BodyBatchIds()[0];
  const result = await materializeStep8GV8008IncomingBodyBatch({ batchId: first, sourceEntries: Array(10).fill({ ordinal: 0, sourceOrdinal: 0, rawJson: "{}" }) });
  assert.equal(result.pass, false);
  assert.equal(result.reason, "SOURCE_RECORD_RIGHTS_OR_STRUCTURE_MISMATCH");
});

test("hydration and fresh route writes remain inside the exact free-tier D1 envelope", () => {
  assert.equal(STEP8G_V8008_MAX_HYDRATED_CANDIDATES, 256);
  assert.equal(STEP8G_V8008_MAX_HYDRATION_D1_SUBQUERIES, 9);
  assert.equal(prewrite.layer.operationBudget.operations.eightLayerHydrationCanary, 4);
  assert.equal(prewrite.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries, 16);
  assert.equal(prewrite.layer.operationBudget.headroomAssumed, false);
});

test("live runtime source encodes restart-safe v8007 parent-copy acceptance without widening topology", () => {
  const source = readFileSync(new URL("../src/server/step8g-v8008-live-runtime.mjs", import.meta.url), "utf8");
  assert.match(source, /\[STEP8G_V8008_PARENT_VERSION, STEP8G_V8008_CORPUS_VERSION\]\.includes\(pointer\.activeVersion\)/);
  assert.match(source, /PARENT_ROUTES_IDEMPOTENT_SKIP/);
  assert.match(source, /V8008_ACTIVE_WITHOUT_EXACT_PARENT_ROUTES/);
  assert.match(source, /STEP8G_V8008_EXPECTED_PARENT_ROUTE_COUNT = 3695/);
  assert.doesNotMatch(source, /thirdShardAuthorized:\s*true/);
});
