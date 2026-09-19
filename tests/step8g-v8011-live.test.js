import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8011_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8011-runtime-descriptor.mjs";
import {
  STEP8G_V8011_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8011_EXPECTED_RECIPE_COUNT,
  STEP8G_V8011_EXPECTED_ROUTE_COUNT,
  expectedStep8GV8011BodyBatchIds,
  expectedStep8GV8011RouteBatchIds,
  materializeStep8GV8011IncomingBodyBatch,
  publicStep8GV8011Summary
} from "../src/server/step8g-v8011-live-runtime.mjs";
import { STEP8G_V8011_MAX_HYDRATED_CANDIDATES, STEP8G_V8011_MAX_HYDRATION_D1_SUBQUERIES } from "../src/server/step8g-v8011-hydration-runtime.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/froken-jensen-v8011-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8011 runtime is frozen to the earned Frøken Jensen prewrite and exact composition", () => {
  const summary = publicStep8GV8011Summary();
  assert.equal(summary.corpusVersion, "v8011");
  assert.equal(summary.parentCorpusVersion, "v8010");
  assert.equal(summary.recipeCount, 1372);
  assert.equal(summary.cumulativeRecipeCount, 13124);
  assert.deepEqual(summary.sourceCohortIds, ["ORA_FROKEN_JENSEN_1921_KOGEBOG_23RD_FRKENJENSENSKO00JENS"]);
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
  assert.equal(STEP8G_V8011_RUNTIME_DESCRIPTOR.sourceCommit, prewrite.source.commit);
});

test("v8011 freezes 139 body and 139 route batches over the exact two-shard child layout", () => {
  assert.equal(STEP8G_V8011_EXPECTED_RECIPE_COUNT, 1372);
  assert.equal(STEP8G_V8011_EXPECTED_ROUTE_COUNT, 13124);
  assert.equal(STEP8G_V8011_EXPECTED_BODY_BATCH_COUNT, 139);
  assert.deepEqual(STEP8G_V8011_RUNTIME_DESCRIPTOR.bodyShardRows, [651, 721]);
  assert.equal(expectedStep8GV8011BodyBatchIds().length, 139);
  assert.equal(expectedStep8GV8011RouteBatchIds().length, 139);
  assert.equal(expectedStep8GV8011BodyBatchIds()[0], "s00-b000000");
  assert.equal(expectedStep8GV8011RouteBatchIds().at(-1), "route-v8011-s01-b000072");
});

test("public-safe descriptor contains fingerprints only, not protected recipe bodies", () => {
  assert.deepEqual(Object.keys(STEP8G_V8011_RUNTIME_DESCRIPTOR), [
    "sourceCommit",
    "layerManifestSha256",
    "populationPlanSha256",
    "bodyHashHexByShard",
    "routeHashHexByShard",
    "bodyShardRows",
    "parentCompositionRouteCount",
    "composedRouteCount"
  ]);
  assert.equal(STEP8G_V8011_RUNTIME_DESCRIPTOR.parentCompositionRouteCount, 11752);
  assert.equal(STEP8G_V8011_RUNTIME_DESCRIPTOR.composedRouteCount, 13124);
  assert.equal(JSON.stringify(STEP8G_V8011_RUNTIME_DESCRIPTOR).includes("rawJson"), false);
});

test("body materialization fails closed on unclassified or structurally invalid source rows", async () => {
  const first = expectedStep8GV8011BodyBatchIds()[0];
  const result = await materializeStep8GV8011IncomingBodyBatch({ batchId: first, sourceEntries: Array(10).fill({ ordinal: 0, sourceOrdinal: 0, rawJson: "{}" }) });
  assert.equal(result.pass, false);
  assert.equal(result.reason, "SOURCE_RECORD_RIGHTS_OR_STRUCTURE_MISMATCH");
});

test("hydration and fresh route writes remain inside the exact free-tier D1 envelope", () => {
  assert.equal(STEP8G_V8011_MAX_HYDRATED_CANDIDATES, 256);
  assert.equal(STEP8G_V8011_MAX_HYDRATION_D1_SUBQUERIES, 11);
  assert.equal(prewrite.layer.operationBudget.operations.elevenLayerHydrationCanary, 4);
  assert.equal(prewrite.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries, 16);
  assert.equal(prewrite.layer.operationBudget.headroomAssumed, false);
});

test("live runtime source encodes restart-safe v8010 parent-copy acceptance without widening topology", () => {
  const source = readFileSync(new URL("../src/server/step8g-v8011-live-runtime.mjs", import.meta.url), "utf8");
  assert.match(source, /\[STEP8G_V8011_PARENT_VERSION, STEP8G_V8011_CORPUS_VERSION\]\.includes\(pointer\.activeVersion\)/);
  assert.match(source, /PARENT_ROUTES_IDEMPOTENT_SKIP/);
  assert.match(source, /V8011_ACTIVE_WITHOUT_EXACT_PARENT_ROUTES/);
  assert.match(source, /STEP8G_V8011_EXPECTED_PARENT_ROUTE_COUNT = 11752/);
  assert.doesNotMatch(source, /thirdShardAuthorized:\s*true/);
});
