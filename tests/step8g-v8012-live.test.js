import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8012_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8012-runtime-descriptor.mjs";
import {
  STEP8G_V8012_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8012_EXPECTED_RECIPE_COUNT,
  STEP8G_V8012_EXPECTED_ROUTE_COUNT,
  expectedStep8GV8012BodyBatchIds,
  expectedStep8GV8012RouteBatchIds,
  materializeStep8GV8012IncomingBodyBatch,
  publicStep8GV8012Summary
} from "../src/server/step8g-v8012-live-runtime.mjs";
import { STEP8G_V8012_MAX_HYDRATED_CANDIDATES, STEP8G_V8012_MAX_HYDRATION_D1_SUBQUERIES } from "../src/server/step8g-v8012-hydration-runtime.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/seleskowitz-v8012-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8012 runtime is frozen to the earned Seleskowitz prewrite and exact composition", () => {
  const summary = publicStep8GV8012Summary();
  assert.equal(summary.corpusVersion, "v8012");
  assert.equal(summary.parentCorpusVersion, "v8011");
  assert.equal(summary.recipeCount, 1722);
  assert.equal(summary.cumulativeRecipeCount, 14846);
  assert.deepEqual(summary.sourceCohortIds, ["ORA_SELESKOWITZ_1883_WIENER_KOCHBUCH_BUB_GB_OP8YAQAAMAAJ"]);
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
  assert.equal(STEP8G_V8012_RUNTIME_DESCRIPTOR.sourceCommit, prewrite.source.commit);
});

test("v8012 freezes 174 body and 174 route batches over the exact two-shard child layout", () => {
  assert.equal(STEP8G_V8012_EXPECTED_RECIPE_COUNT, 1722);
  assert.equal(STEP8G_V8012_EXPECTED_ROUTE_COUNT, 14846);
  assert.equal(STEP8G_V8012_EXPECTED_BODY_BATCH_COUNT, 174);
  assert.deepEqual(STEP8G_V8012_RUNTIME_DESCRIPTOR.bodyShardRows, [841, 881]);
  assert.equal(expectedStep8GV8012BodyBatchIds().length, 174);
  assert.equal(expectedStep8GV8012RouteBatchIds().length, 174);
  assert.equal(expectedStep8GV8012BodyBatchIds()[0], "s00-b000000");
  assert.equal(expectedStep8GV8012RouteBatchIds().at(-1), "route-v8012-s01-b000088");
});

test("public-safe descriptor contains fingerprints only, not protected recipe bodies", () => {
  assert.deepEqual(Object.keys(STEP8G_V8012_RUNTIME_DESCRIPTOR), [
    "sourceCommit",
    "layerManifestSha256",
    "populationPlanSha256",
    "bodyHashHexByShard",
    "routeHashHexByShard",
    "bodyShardRows",
    "parentCompositionRouteCount",
    "composedRouteCount"
  ]);
  assert.equal(STEP8G_V8012_RUNTIME_DESCRIPTOR.parentCompositionRouteCount, 13124);
  assert.equal(STEP8G_V8012_RUNTIME_DESCRIPTOR.composedRouteCount, 14846);
  assert.equal(JSON.stringify(STEP8G_V8012_RUNTIME_DESCRIPTOR).includes("rawJson"), false);
});

test("body materialization fails closed on unclassified or structurally invalid source rows", async () => {
  const first = expectedStep8GV8012BodyBatchIds()[0];
  const result = await materializeStep8GV8012IncomingBodyBatch({ batchId: first, sourceEntries: Array(10).fill({ ordinal: 0, sourceOrdinal: 0, rawJson: "{}" }) });
  assert.equal(result.pass, false);
  assert.equal(result.reason, "SOURCE_RECORD_RIGHTS_OR_STRUCTURE_MISMATCH");
});

test("hydration and fresh route writes remain inside the exact free-tier D1 envelope", () => {
  assert.equal(STEP8G_V8012_MAX_HYDRATED_CANDIDATES, 256);
  assert.equal(STEP8G_V8012_MAX_HYDRATION_D1_SUBQUERIES, 12);
  assert.equal(prewrite.layer.operationBudget.operations.twelveLayerHydrationCanary, 4);
  assert.equal(prewrite.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries, 16);
  assert.equal(prewrite.layer.operationBudget.headroomAssumed, false);
});

test("live runtime source encodes restart-safe v8011 parent-copy acceptance without widening topology", () => {
  const source = readFileSync(new URL("../src/server/step8g-v8012-live-runtime.mjs", import.meta.url), "utf8");
  assert.match(source, /\[STEP8G_V8012_PARENT_VERSION, STEP8G_V8012_CORPUS_VERSION\]\.includes\(pointer\.activeVersion\)/);
  assert.match(source, /PARENT_ROUTES_IDEMPOTENT_SKIP/);
  assert.match(source, /V8012_ACTIVE_WITHOUT_EXACT_PARENT_ROUTES/);
  assert.match(source, /STEP8G_V8012_EXPECTED_PARENT_ROUTE_COUNT = 13124/);
  assert.match(source, /PARENT_VERSIONS = \["v8001", "v8002", "v8003", "v8004", "v8005", "v8006", "v8007", "v8008", "v8009", "v8010", "v8011"\]/);
  assert.doesNotMatch(source, /thirdShardAuthorized:\s*true/);
});


test("owner runner proves all twelve corpus layers with exact count labels", () => {
  const html = readFileSync(new URL("../step8g-v8012-populate.html", import.meta.url), "utf8");
  for (const token of ["v8010=await loadHistoricalCanary(\"cucina-italiana\"","v8011=await loadHistoricalCanary(\"danske-kokken\"","recipeIds:[v8001,v8002,v8003,v8004,v8005,v8006,v8007,v8008,v8009,v8010,v8011,v8012]","packets?.length!==12","1,722-child-bodies","1,722-child-routes","14,846-route composition","14,846-recipe v8012 composition"]) assert.match(html, new RegExp(token.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(html, /exactly eleven packets/);
});
