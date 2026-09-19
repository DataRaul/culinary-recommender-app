import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8010_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8010-runtime-descriptor.mjs";
import {
  STEP8G_V8010_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8010_EXPECTED_RECIPE_COUNT,
  STEP8G_V8010_EXPECTED_ROUTE_COUNT,
  expectedStep8GV8010BodyBatchIds,
  expectedStep8GV8010RouteBatchIds,
  materializeStep8GV8010IncomingBodyBatch,
  publicStep8GV8010Summary
} from "../src/server/step8g-v8010-live-runtime.mjs";
import { STEP8G_V8010_MAX_HYDRATED_CANDIDATES, STEP8G_V8010_MAX_HYDRATION_D1_SUBQUERIES } from "../src/server/step8g-v8010-hydration-runtime.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/artusi-v8010-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8010 runtime is frozen to the earned Artusi prewrite and exact composition", () => {
  const summary = publicStep8GV8010Summary();
  assert.equal(summary.corpusVersion, "v8010");
  assert.equal(summary.parentCorpusVersion, "v8009");
  assert.equal(summary.recipeCount, 829);
  assert.equal(summary.cumulativeRecipeCount, 11752);
  assert.deepEqual(summary.sourceCohortIds, ["ORA_ARTUSI_1891_SCIENZA_CUCINA_GUTENBERG_59047"]);
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
  assert.equal(STEP8G_V8010_RUNTIME_DESCRIPTOR.sourceCommit, prewrite.source.commit);
});

test("v8010 freezes 83 body and 83 route batches over the exact two-shard child layout", () => {
  assert.equal(STEP8G_V8010_EXPECTED_RECIPE_COUNT, 829);
  assert.equal(STEP8G_V8010_EXPECTED_ROUTE_COUNT, 11752);
  assert.equal(STEP8G_V8010_EXPECTED_BODY_BATCH_COUNT, 83);
  assert.deepEqual(STEP8G_V8010_RUNTIME_DESCRIPTOR.bodyShardRows, [430, 399]);
  assert.equal(expectedStep8GV8010BodyBatchIds().length, 83);
  assert.equal(expectedStep8GV8010RouteBatchIds().length, 83);
  assert.equal(expectedStep8GV8010BodyBatchIds()[0], "s00-b000000");
  assert.equal(expectedStep8GV8010RouteBatchIds().at(-1), "route-v8010-s01-b000039");
});

test("public-safe descriptor contains fingerprints only, not protected recipe bodies", () => {
  assert.deepEqual(Object.keys(STEP8G_V8010_RUNTIME_DESCRIPTOR), [
    "sourceCommit",
    "layerManifestSha256",
    "populationPlanSha256",
    "bodyHashHexByShard",
    "routeHashHexByShard",
    "bodyShardRows",
    "parentCompositionRouteCount",
    "composedRouteCount"
  ]);
  assert.equal(STEP8G_V8010_RUNTIME_DESCRIPTOR.parentCompositionRouteCount, 10923);
  assert.equal(STEP8G_V8010_RUNTIME_DESCRIPTOR.composedRouteCount, 11752);
  assert.equal(JSON.stringify(STEP8G_V8010_RUNTIME_DESCRIPTOR).includes("rawJson"), false);
});

test("body materialization fails closed on unclassified or structurally invalid source rows", async () => {
  const first = expectedStep8GV8010BodyBatchIds()[0];
  const result = await materializeStep8GV8010IncomingBodyBatch({ batchId: first, sourceEntries: Array(10).fill({ ordinal: 0, sourceOrdinal: 0, rawJson: "{}" }) });
  assert.equal(result.pass, false);
  assert.equal(result.reason, "SOURCE_RECORD_RIGHTS_OR_STRUCTURE_MISMATCH");
});

test("hydration and fresh route writes remain inside the exact free-tier D1 envelope", () => {
  assert.equal(STEP8G_V8010_MAX_HYDRATED_CANDIDATES, 256);
  assert.equal(STEP8G_V8010_MAX_HYDRATION_D1_SUBQUERIES, 10);
  assert.equal(prewrite.layer.operationBudget.operations.tenLayerHydrationCanary, 4);
  assert.equal(prewrite.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries, 16);
  assert.equal(prewrite.layer.operationBudget.headroomAssumed, false);
});

test("live runtime source encodes restart-safe v8009 parent-copy acceptance without widening topology", () => {
  const source = readFileSync(new URL("../src/server/step8g-v8010-live-runtime.mjs", import.meta.url), "utf8");
  assert.match(source, /\[STEP8G_V8010_PARENT_VERSION, STEP8G_V8010_CORPUS_VERSION\]\.includes\(pointer\.activeVersion\)/);
  assert.match(source, /PARENT_ROUTES_IDEMPOTENT_SKIP/);
  assert.match(source, /V8010_ACTIVE_WITHOUT_EXACT_PARENT_ROUTES/);
  assert.match(source, /STEP8G_V8010_EXPECTED_PARENT_ROUTE_COUNT = 10923/);
  assert.doesNotMatch(source, /thirdShardAuthorized:\s*true/);
});
