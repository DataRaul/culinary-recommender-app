import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8016_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8016-runtime-descriptor.mjs";
import {
  STEP8G_V8016_CORPUS_VERSION,
  STEP8G_V8016_PARENT_VERSION,
  STEP8G_V8016_EXPECTED_RECIPE_COUNT,
  STEP8G_V8016_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8016_EXPECTED_ROUTE_COUNT,
  STEP8G_V8016_EXPECTED_PARENT_ROUTE_COUNT,
  STEP8G_V8016_MAX_PROTECTED_D1_SUBQUERIES,
  STEP8G_V8016_OPTIMIZED_MAX_REQUEST_D1_SUBQUERIES,
  STEP8G_V8016_ROUTE_STORAGE_MODE,
  publicStep8GV8016Summary,
  expectedStep8GV8016BodyBatchIds,
  expectedStep8GV8016RouteBatchIds
} from "../src/server/step8g-v8016-live-runtime.mjs";
import {
  STEP8G_V8016_MAX_HYDRATED_CANDIDATES,
  STEP8G_V8016_MAX_HYDRATION_D1_SUBQUERIES
} from "../src/server/step8g-v8016-hydration-runtime.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/kenney-herbert-v8016-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8016 runtime is frozen to the earned Kenney-Herbert prewrite", () => {
  const summary=publicStep8GV8016Summary();
  assert.equal(STEP8G_V8016_CORPUS_VERSION,"v8016");
  assert.equal(STEP8G_V8016_PARENT_VERSION,"v8015");
  assert.equal(summary.corpusVersion,"v8016");
  assert.equal(summary.parentCorpusVersion,"v8015");
  assert.equal(summary.recipeCount,501);
  assert.equal(summary.cumulativeRecipeCount,17011);
  assert.deepEqual(summary.sourceCohortIds,["ORA_KENNEY_HERBERT_1885_CULINARY_JOTTINGS_CULINARYJOTTINGS00KENN"]);
  assert.equal(summary.sourceAuthorHandling,"IDENTIFIED_AUTHOR");
  assert.equal(summary.restartSafeResume,true);
  assert.equal(summary.publicRuntimeActivationAuthorized,false);
  assert.equal(summary.recommendationAdmissionAuthorized,false);
  assert.equal(summary.thirdShardAuthorized,false);
  assert.equal(summary.billingExpansionAuthorized,false);
  assert.equal(summary.culturalAuthenticityAuthorityImported,false);
  assert.equal(summary.layerManifestSha256,prewrite.layer.manifestSha256);
  assert.equal(summary.populationPlanSha256,prewrite.layer.populationPlanSha256);
});

test("v8016 exact child and route layout is frozen", () => {
  assert.equal(STEP8G_V8016_EXPECTED_RECIPE_COUNT,501);
  assert.equal(STEP8G_V8016_EXPECTED_BODY_BATCH_COUNT,51);
  assert.equal(STEP8G_V8016_EXPECTED_PARENT_ROUTE_COUNT,16510);
  assert.equal(STEP8G_V8016_EXPECTED_ROUTE_COUNT,17011);
  assert.deepEqual(STEP8G_V8016_RUNTIME_DESCRIPTOR.bodyShardRows,[259,242]);
  assert.equal(STEP8G_V8016_RUNTIME_DESCRIPTOR.parentCompositionRouteCount,16510);
  assert.equal(STEP8G_V8016_RUNTIME_DESCRIPTOR.composedRouteCount,17011);
  assert.equal(expectedStep8GV8016BodyBatchIds().length,51);
  assert.equal(expectedStep8GV8016RouteBatchIds().length,51);
  assert.equal(expectedStep8GV8016BodyBatchIds()[0],"s00-b000000");
  assert.equal(expectedStep8GV8016RouteBatchIds().at(-1),"route-v8016-s01-b000024");
});

test("v8016 remains inside the two-shard and 16-query envelope", () => {
  assert.equal(STEP8G_V8016_MAX_PROTECTED_D1_SUBQUERIES,16);
  assert.equal(STEP8G_V8016_MAX_HYDRATED_CANDIDATES,256);
  assert.equal(STEP8G_V8016_MAX_HYDRATION_D1_SUBQUERIES,7);
  assert.equal(STEP8G_V8016_OPTIMIZED_MAX_REQUEST_D1_SUBQUERIES,8);
  assert.equal(STEP8G_V8016_ROUTE_STORAGE_MODE,"PARENT_V8015_REFERENCE_PLUS_V8016_DELTA");
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries,16);
  assert.equal(prewrite.layer.operationBudget.headroomAssumed,false);
  assert.equal(prewrite.layer.operationBudget.operations.sixteenLayerHydrationCanary,4);
  assert.equal(prewrite.composition.routing.shardCount,2);
});

test("v8016 runtime preserves exact v8015 parent and all historical layers", () => {
  const source=readFileSync(new URL("../src/server/step8g-v8016-live-runtime.mjs",import.meta.url),"utf8");
  assert.match(source,/STEP8G_V8016_EXPECTED_PARENT_ROUTE_COUNT = 16510/);
  assert.match(source,/PARENT_ROUTES_REFERENCED_FROM_V8015/);
  assert.match(source,/composition_version='v8015'/);
  assert.equal(source.includes("SELECT 'v8016',recipe_id,corpus_version"),false);
  assert.equal(source.includes("PARENT_ROUTES_COPIED_AND_VERIFIED"),false);
  assert.match(source,/valueSql = batch\.entries\.map/);
  assert.match(source,/valueSql = entries\.map/);
  assert.match(source,/active_version='v8015'/);
  assert.match(source,/ROLLED_BACK_TO_V8015/);
});

test("owner runner proves all sixteen layers and exact terminal contract", () => {
  const html=readFileSync(new URL("../step8g-v8016-populate.html",import.meta.url),"utf8");
  const required=[
    "EXPECTED_CHILD=501",
    "EXPECTED_PARENT=16510",
    "EXPECTED_COMPOSED=17011",
    "EXPECTED_BATCHES=51",
    "STEP8G_V8016_FREE_LIMIT_FAIL_CLOSED",
    'v8015=await loadHistoricalCanary("chinese-kitchen"',
    "recipeIds:[v8001,v8002,v8003,v8004,v8005,v8006,v8007,v8008,v8009,v8010,v8011,v8012,v8013,v8014,v8015,v8016]",
    "packets?.length!==16",
    "501-child-bodies",
    "501-child-routes",
    "16510-parent-routes-referenced-zero-copy",
    "sixteen-layer-hydration",
    "rollback-v8015",
    "STEP_8G_KENNEY_HERBERT_V8016_PROTECTED_POPULATION_PASS",
    "sixteenLayerHydrationPass:true",
    "17,011-recipe v8016 composition",
    "maxAllowedD1Subqueries:16",
    "optimizedMaxRequestD1Subqueries:8",
    "parentRouteRowsCopied:0",
    "PARENT_V8015_REFERENCE_PLUS_V8016_DELTA",
    "d1BudgetHeadroomAssumed:false",
    "/api/auth/session"
  ];
  for(const token of required) assert.equal(html.includes(token),true,token);
  assert.equal(html.includes("SESSION_SECRET="),false);
});

test("v8016 API preserves structured write diagnostics", () => {
  const api=readFileSync(new URL("../functions/api/step8g/v8016.js",import.meta.url),"utf8");
  assert.match(api,/STEP8G_V8016_WRITE_BODY_EXCEPTION/);
  assert.match(api,/WRITE_ERROR_UNKNOWN_COMMIT_STATE/);
  assert.match(api,/STEP8G_V8016_FREE_LIMIT_FAIL_CLOSED/);
});
