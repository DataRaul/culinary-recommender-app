import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8009_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8009-runtime-descriptor.mjs";
import {
  STEP8G_V8009_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8009_EXPECTED_RECIPE_COUNT,
  STEP8G_V8009_EXPECTED_ROUTE_COUNT,
  expectedStep8GV8009BodyBatchIds,
  expectedStep8GV8009RouteBatchIds,
  materializeStep8GV8009IncomingBodyBatch,
  publicStep8GV8009Summary
} from "../src/server/step8g-v8009-live-runtime.mjs";
import { STEP8G_V8009_MAX_HYDRATED_CANDIDATES, STEP8G_V8009_MAX_HYDRATION_D1_SUBQUERIES } from "../src/server/step8g-v8009-hydration-runtime.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/menon-v8009-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8009 runtime is frozen to the earned Menon prewrite and exact composition", () => {
  const summary = publicStep8GV8009Summary();
  assert.equal(summary.corpusVersion, "v8009");
  assert.equal(summary.parentCorpusVersion, "v8008");
  assert.equal(summary.recipeCount, 752);
  assert.equal(summary.cumulativeRecipeCount, 10923);
  assert.deepEqual(summary.sourceCohortIds, ["ORA_MENON_1801_CUISINIERE_BOURGEOISE_B22019935"]);
  assert.equal(summary.sourceAuthorHandling, "IDENTIFIED_AUTHOR");
  assert.equal(summary.shardCount, 2);
  assert.equal(summary.maxRowsPerBatch, 10);
  assert.equal(summary.maxProtectedD1Subqueries, 16);
  assert.equal(summary.restartSafeResume, true);
  assert.equal(summary.publicRuntimeActivationAuthorized, false);
  assert.equal(summary.recommendationAdmissionAuthorized, false);
  assert.equal(summary.thirdShardAuthorized, false);
  assert.equal(summary.layerManifestSha256, prewrite.layer.manifestSha256);
  assert.equal(summary.populationPlanSha256, prewrite.layer.populationPlanSha256);
  assert.equal(STEP8G_V8009_RUNTIME_DESCRIPTOR.sourceCommit, prewrite.source.commit);
});

test("v8009 freezes 76 body and 76 route batches over the exact two-shard child layout", () => {
  assert.equal(STEP8G_V8009_EXPECTED_RECIPE_COUNT, 752);
  assert.equal(STEP8G_V8009_EXPECTED_ROUTE_COUNT, 10923);
  assert.equal(STEP8G_V8009_EXPECTED_BODY_BATCH_COUNT, 76);
  assert.deepEqual(STEP8G_V8009_RUNTIME_DESCRIPTOR.bodyShardRows, [380, 372]);
  assert.equal(expectedStep8GV8009BodyBatchIds().length, 76);
  assert.equal(expectedStep8GV8009RouteBatchIds().length, 76);
  assert.equal(expectedStep8GV8009BodyBatchIds()[0], "s00-b000000");
  assert.equal(expectedStep8GV8009RouteBatchIds().at(-1), "route-v8009-s01-b000037");
});

test("public-safe descriptor contains fingerprints only, not protected recipe bodies", () => {
  assert.deepEqual(Object.keys(STEP8G_V8009_RUNTIME_DESCRIPTOR), [
    "sourceCommit",
    "layerManifestSha256",
    "populationPlanSha256",
    "bodyHashHexByShard",
    "routeHashHexByShard",
    "bodyShardRows",
    "parentCompositionRouteCount",
    "composedRouteCount"
  ]);
  assert.equal(STEP8G_V8009_RUNTIME_DESCRIPTOR.parentCompositionRouteCount, 10171);
  assert.equal(STEP8G_V8009_RUNTIME_DESCRIPTOR.composedRouteCount, 10923);
  assert.equal(JSON.stringify(STEP8G_V8009_RUNTIME_DESCRIPTOR).includes("rawJson"), false);
});

test("body materialization fails closed on unclassified or structurally invalid source rows", async () => {
  const first = expectedStep8GV8009BodyBatchIds()[0];
  const result = await materializeStep8GV8009IncomingBodyBatch({ batchId: first, sourceEntries: Array(10).fill({ ordinal: 0, sourceOrdinal: 0, rawJson: "{}" }) });
  assert.equal(result.pass, false);
  assert.equal(result.reason, "SOURCE_RECORD_RIGHTS_OR_STRUCTURE_MISMATCH");
});

test("hydration and fresh route writes remain inside the exact free-tier D1 envelope", () => {
  assert.equal(STEP8G_V8009_MAX_HYDRATED_CANDIDATES, 256);
  assert.equal(STEP8G_V8009_MAX_HYDRATION_D1_SUBQUERIES, 10);
  assert.equal(prewrite.layer.operationBudget.operations.nineLayerHydrationCanary, 4);
  assert.equal(prewrite.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries, 16);
  assert.equal(prewrite.layer.operationBudget.headroomAssumed, false);
});

test("live runtime source encodes restart-safe v8008 parent-copy acceptance without widening topology", () => {
  const source = readFileSync(new URL("../src/server/step8g-v8009-live-runtime.mjs", import.meta.url), "utf8");
  assert.match(source, /\[STEP8G_V8009_PARENT_VERSION, STEP8G_V8009_CORPUS_VERSION\]\.includes\(pointer\.activeVersion\)/);
  assert.match(source, /PARENT_ROUTES_IDEMPOTENT_SKIP/);
  assert.match(source, /V8009_ACTIVE_WITHOUT_EXACT_PARENT_ROUTES/);
  assert.match(source, /STEP8G_V8009_EXPECTED_PARENT_ROUTE_COUNT = 10171/);
  assert.doesNotMatch(source, /thirdShardAuthorized:\s*true/);
});
