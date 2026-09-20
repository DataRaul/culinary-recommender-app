import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8014_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8014-runtime-descriptor.mjs";
import {
  STEP8G_V8014_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8014_EXPECTED_RECIPE_COUNT,
  STEP8G_V8014_EXPECTED_ROUTE_COUNT,
  expectedStep8GV8014BodyBatchIds,
  expectedStep8GV8014RouteBatchIds,
  materializeStep8GV8014IncomingBodyBatch,
  publicStep8GV8014Summary
} from "../src/server/step8g-v8014-live-runtime.mjs";
import { STEP8G_V8014_MAX_HYDRATED_CANDIDATES, STEP8G_V8014_MAX_HYDRATION_D1_SUBQUERIES } from "../src/server/step8g-v8014-hydration-runtime.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/hearn-v8014-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8014 runtime is frozen to the earned Hearn prewrite and exact composition", () => {
  const summary = publicStep8GV8014Summary();
  assert.equal(summary.corpusVersion, "v8014");
  assert.equal(summary.parentCorpusVersion, "v8013");
  assert.equal(summary.recipeCount, 712);
  assert.equal(summary.cumulativeRecipeCount, 16365);
  assert.deepEqual(summary.sourceCohortIds, ["ORA_HEARN_1885_LA_CUISINE_CREOLE_LACUISINECREOLEC00HEAR"]);
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
  assert.equal(STEP8G_V8014_RUNTIME_DESCRIPTOR.sourceCommit, prewrite.source.commit);
});

test("v8014 freezes 72 body and 72 route batches over the exact two-shard child layout", () => {
  assert.equal(STEP8G_V8014_EXPECTED_RECIPE_COUNT, 712);
  assert.equal(STEP8G_V8014_EXPECTED_ROUTE_COUNT, 16365);
  assert.equal(STEP8G_V8014_EXPECTED_BODY_BATCH_COUNT, 72);
  assert.deepEqual(STEP8G_V8014_RUNTIME_DESCRIPTOR.bodyShardRows, [367, 345]);
  assert.equal(expectedStep8GV8014BodyBatchIds().length, 72);
  assert.equal(expectedStep8GV8014RouteBatchIds().length, 72);
  assert.equal(expectedStep8GV8014BodyBatchIds()[0], "s00-b000000");
  assert.equal(expectedStep8GV8014RouteBatchIds().at(-1), "route-v8014-s01-b000034");
});

test("public-safe descriptor contains fingerprints only, not protected recipe bodies", () => {
  assert.deepEqual(Object.keys(STEP8G_V8014_RUNTIME_DESCRIPTOR), [
    "sourceCommit",
    "layerManifestSha256",
    "populationPlanSha256",
    "bodyHashHexByShard",
    "routeHashHexByShard",
    "bodyShardRows",
    "parentCompositionRouteCount",
    "composedRouteCount"
  ]);
  assert.equal(STEP8G_V8014_RUNTIME_DESCRIPTOR.parentCompositionRouteCount, 15653);
  assert.equal(STEP8G_V8014_RUNTIME_DESCRIPTOR.composedRouteCount, 16365);
  assert.equal(JSON.stringify(STEP8G_V8014_RUNTIME_DESCRIPTOR).includes("rawJson"), false);
});

test("body materialization fails closed on unclassified or structurally invalid source rows", async () => {
  const first = expectedStep8GV8014BodyBatchIds()[0];
  const result = await materializeStep8GV8014IncomingBodyBatch({ batchId: first, sourceEntries: Array(10).fill({ ordinal: 0, sourceOrdinal: 0, rawJson: "{}" }) });
  assert.equal(result.pass, false);
  assert.equal(result.reason, "SOURCE_RECORD_RIGHTS_OR_STRUCTURE_MISMATCH");
});

test("hydration and fresh route writes remain inside the exact free-tier D1 envelope", () => {
  assert.equal(STEP8G_V8014_MAX_HYDRATED_CANDIDATES, 256);
  assert.equal(STEP8G_V8014_MAX_HYDRATION_D1_SUBQUERIES, 14);
  assert.equal(prewrite.layer.operationBudget.operations.fourteenLayerHydrationCanary, 4);
  assert.equal(prewrite.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries, 16);
  assert.equal(prewrite.layer.operationBudget.headroomAssumed, false);
});

test("live runtime source encodes restart-safe v8013 parent-copy acceptance without widening topology", () => {
  const source = readFileSync(new URL("../src/server/step8g-v8014-live-runtime.mjs", import.meta.url), "utf8");
  assert.match(source, /\[STEP8G_V8014_PARENT_VERSION, STEP8G_V8014_CORPUS_VERSION\]\.includes\(pointer\.activeVersion\)/);
  assert.match(source, /PARENT_ROUTES_IDEMPOTENT_SKIP/);
  assert.match(source, /V8014_ACTIVE_WITHOUT_EXACT_PARENT_ROUTES/);
  assert.match(source, /STEP8G_V8014_EXPECTED_PARENT_ROUTE_COUNT = 15653/);
  assert.match(source, /PARENT_VERSIONS = \["v8001", "v8002", "v8003", "v8004", "v8005", "v8006", "v8007", "v8008", "v8009", "v8010", "v8011", "v8012", "v8013"\]/);
  assert.doesNotMatch(source, /thirdShardAuthorized:\s*true/);
});


test("owner runner proves all fourteen corpus layers with exact count labels", () => {
  const html = readFileSync(new URL("../step8g-v8014-populate.html", import.meta.url), "utf8");
  const tokens = [
    "v8010=await loadHistoricalCanary(\"cucina-italiana\"",
    "v8011=await loadHistoricalCanary(\"danske-kokken\"",
    "v8012=await loadHistoricalCanary(\"wiener-kueche\"",
    "v8013=await loadHistoricalCanary(\"cuisine-francaise\"",
    "recipeIds:[v8001,v8002,v8003,v8004,v8005,v8006,v8007,v8008,v8009,v8010,v8011,v8012,v8013,v8014]",
    "packets?.length!==14",
    "712-child-bodies",
    "712-child-routes",
    "16,365-route composition",
    "16,365-recipe v8014 composition"
  ];
  for (const token of tokens) assert.equal(html.includes(token), true, `owner runner missing: ${token}`);
  assert.doesNotMatch(html, /exactly thirteen packets/);
});


test("v8014 owner runner preserves opaque 5xx diagnostics and retries only once", () => {
  const html = readFileSync(new URL("../step8g-v8014-populate.html", import.meta.url), "utf8");
  assert.match(html, /NON_JSON_RESPONSE/);
  assert.match(html, /cf-ray/);
  assert.match(html, /bodyPrefix/);
  assert.match(html, /opaque5xx/);
  assert.match(html, /retrying once after opaque server failure/);
  assert.match(html, /allowRetry=true/);
});

test("v8014 API returns structured write-body exception diagnostics", () => {
  const api = readFileSync(new URL("../functions/api/step8g/v8014.js", import.meta.url), "utf8");
  assert.match(api, /STEP8G_V8014_WRITE_BODY_EXCEPTION/);
  assert.match(api, /MATERIALIZE_OR_D1_BODY_WRITE/);
});


test("v8014 owner runner exposes repaired production marker", () => {
  const html = readFileSync(new URL("../step8g-v8014-populate.html", import.meta.url), "utf8");
  assert.match(html, /V8014_WRITE_DIAGNOSTIC_R1/);
});
