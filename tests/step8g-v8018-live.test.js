import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8018_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8018-runtime-descriptor.mjs";
import {
  STEP8G_V8018_CORPUS_VERSION,
  STEP8G_V8018_PARENT_VERSION,
  STEP8G_V8018_EXPECTED_RECIPE_COUNT,
  STEP8G_V8018_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8018_EXPECTED_ROUTE_COUNT,
  STEP8G_V8018_EXPECTED_PARENT_ROUTE_COUNT,
  STEP8G_V8018_MAX_PROTECTED_D1_SUBQUERIES,
  STEP8G_V8018_OPTIMIZED_MAX_REQUEST_D1_SUBQUERIES,
  STEP8G_V8018_ROUTE_STORAGE_MODE,
  publicStep8GV8018Summary,
  expectedStep8GV8018BodyBatchIds,
  expectedStep8GV8018RouteBatchIds,
  readStep8GV8018RouteProgress
} from "../src/server/step8g-v8018-live-runtime.mjs";
import {
  STEP8G_V8018_MAX_HYDRATED_CANDIDATES,
  STEP8G_V8018_MAX_HYDRATION_D1_SUBQUERIES,
  hydrateStep8GV8018ProtectedRecipesBounded
} from "../src/server/step8g-v8018-hydration-runtime.mjs";
import { sha256Hex } from "../src/server/step8b-live.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/atrutel-v8018-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8018 runtime is frozen to the earned Atrutel prewrite", () => {
  const summary = publicStep8GV8018Summary();
  assert.equal(STEP8G_V8018_CORPUS_VERSION,"v8018");
  assert.equal(STEP8G_V8018_PARENT_VERSION,"v8017");
  assert.equal(summary.recipeCount,481);
  assert.equal(summary.cumulativeRecipeCount,19268);
  assert.deepEqual(summary.sourceCohortIds,["ORA_ATRUTEL_1874_EASY_ECONOMICAL_JEWISH_COOKERY_B2807967X"]);
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

test("v8018 exact child and optimized route layout is frozen", () => {
  assert.equal(STEP8G_V8018_EXPECTED_RECIPE_COUNT,481);
  assert.equal(STEP8G_V8018_EXPECTED_BODY_BATCH_COUNT,49);
  assert.equal(STEP8G_V8018_EXPECTED_PARENT_ROUTE_COUNT,18787);
  assert.equal(STEP8G_V8018_EXPECTED_ROUTE_COUNT,19268);
  assert.deepEqual(STEP8G_V8018_RUNTIME_DESCRIPTOR.bodyShardRows,[247,234]);
  assert.equal(STEP8G_V8018_RUNTIME_DESCRIPTOR.parentCompositionRouteCount,18787);
  assert.equal(STEP8G_V8018_RUNTIME_DESCRIPTOR.composedRouteCount,19268);
  assert.equal(expectedStep8GV8018BodyBatchIds().length,49);
  assert.equal(expectedStep8GV8018RouteBatchIds().length,49);
  assert.equal(expectedStep8GV8018BodyBatchIds()[0],"s00-b000000");
  assert.equal(expectedStep8GV8018RouteBatchIds().at(-1),"route-v8018-s01-b000023");
  assert.deepEqual(STEP8G_V8018_RUNTIME_DESCRIPTOR.bodyHashHexByShard.map(x=>x.length/64),[25,24]);
  assert.deepEqual(STEP8G_V8018_RUNTIME_DESCRIPTOR.routeHashHexByShard.map(x=>x.length/64),[25,24]);
});

test("v8018 remains inside the existing two-shard optimized envelope", () => {
  assert.equal(STEP8G_V8018_MAX_PROTECTED_D1_SUBQUERIES,16);
  assert.equal(STEP8G_V8018_MAX_HYDRATED_CANDIDATES,256);
  assert.equal(STEP8G_V8018_MAX_HYDRATION_D1_SUBQUERIES,7);
  assert.equal(STEP8G_V8018_OPTIMIZED_MAX_REQUEST_D1_SUBQUERIES,8);
  assert.equal(STEP8G_V8018_ROUTE_STORAGE_MODE,"V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA");
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries,8);
  assert.equal(prewrite.layer.operationBudget.optimizedTargetHeadroomAssumed,false);
  assert.equal(prewrite.layer.operationBudget.hardFailSafeIsNotSpendableHeadroom,true);
  assert.equal(prewrite.layer.operationBudget.operations.eighteenLayerHydrationCanary,4);
  assert.equal(prewrite.composition.routing.shardCount,2);
  assert.equal(prewrite.composition.routing.parentRouteRowsCopied,0);
});

test("v8018 references parent ancestry and writes no parent copies", () => {
  const source=readFileSync(new URL("../src/server/step8g-v8018-live-runtime.mjs",import.meta.url),"utf8");
  assert.match(source,/STEP8G_V8018_EXPECTED_PARENT_ROUTE_COUNT = 18787/);
  assert.match(source,/PARENT_ROUTES_REFERENCED_FROM_V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA/);
  assert.match(source,/composition_version='v8015'/);
  assert.match(source,/composition_version='v8016' AND corpus_version='v8016'/);
  assert.match(source,/composition_version='v8017' AND corpus_version='v8017'/);
  assert.match(source,/composition_version='v8018' AND corpus_version<>'v8018'/);
  assert.equal(source.includes("SELECT 'v8018',recipe_id,corpus_version"),false);
  assert.match(source,/active_version='v8017'/);
  assert.match(source,/ROLLED_BACK_TO_V8017/);
});

test("v8018 route progress uses three control queries so activation stays within eight total", async () => {
  const prepared=[];
  const controlDb={prepare(sql){prepared.push(sql);return{
    first:async()=>{
      if(sql.includes("base_count")) return {base_count:16510,v8016_delta_count:501,v8017_delta_count:1776};
      if(sql.includes("corpus_version='v8018'")) return {c:481};
      throw new Error("UNEXPECTED_FIRST_QUERY");
    },
    all:async()=>({results:[]})
  }}};
  const result=await readStep8GV8018RouteProgress(controlDb);
  assert.equal(result.d1Subqueries,3);
  assert.equal(result.baseRouteCount,16510);
  assert.equal(result.v8016DeltaRouteCount,501);
  assert.equal(result.v8017DeltaRouteCount,1776);
  assert.equal(result.parentRouteCount,18787);
  assert.equal(result.newRouteCount,481);
  assert.equal(prepared.length,3);
});

test("v8018 API preserves auth, diagnostics and rollback evidence shape", () => {
  const api=readFileSync(new URL("../functions/api/step8g/v8018.js",import.meta.url),"utf8");
  assert.match(api,/STEP8G_V8018_WRITE_BODY_EXCEPTION/);
  assert.match(api,/WRITE_ERROR_UNKNOWN_COMMIT_STATE/);
  assert.match(api,/STEP8G_V8018_FREE_LIMIT_FAIL_CLOSED/);
  assert.match(api,/pointer\.activeVersion === "v8017" && pointer\.previousVersion === "v8018"/);
  assert.equal(api.includes("SESSION_SECRET="),false);
});

test("v8018 hydration resolves base and all delta route layers", async () => {
  const encoder=new TextEncoder();
  const bodies=["v8015","v8016","v8017","v8018"].map(layer=>JSON.stringify({canonicalRecipeId:layer,layer}));
  const hashes=await Promise.all(bodies.map(sha256Hex));
  const routeRows=["v8015","v8016","v8017","v8018"].map((layer,i)=>({recipe_id:layer,corpus_version:layer,shard_number:i%2,source_cohort_id:layer,body_sha256:hashes[i],body_bytes:encoder.encode(bodies[i]).byteLength}));
  const controlDb={prepare(){return{bind(){return{all:async()=>({results:routeRows})}}}}};
  const rowsByShard=[routeRows.filter(r=>r.shard_number===0).map((r)=>({corpus_version:r.corpus_version,recipe_id:r.recipe_id,body_json:bodies[["v8015","v8016","v8017","v8018"].indexOf(r.recipe_id)],body_bytes:r.body_bytes,body_sha256:r.body_sha256,source_cohort_id:r.source_cohort_id})),routeRows.filter(r=>r.shard_number===1).map((r)=>({corpus_version:r.corpus_version,recipe_id:r.recipe_id,body_json:bodies[["v8015","v8016","v8017","v8018"].indexOf(r.recipe_id)],body_bytes:r.body_bytes,body_sha256:r.body_sha256,source_cohort_id:r.source_cohort_id}))];
  const shardDbs=rowsByShard.map(rows=>({prepare(){return{bind(){return{all:async()=>({results:rows})}}}}}));
  const result=await hydrateStep8GV8018ProtectedRecipesBounded(controlDb,shardDbs,["v8015","v8016","v8017","v8018"]);
  assert.equal(result.pass,true);
  assert.equal(result.packets.length,4);
  assert.equal(result.routeQueries,1);
  assert.equal(result.shardQueries,2);
  assert.equal(result.d1Subqueries,3);
});

test("v8018 hydration fails closed on duplicate ancestry routes", async () => {
  const routeRows=[
    {recipe_id:"duplicate",corpus_version:"v8015",shard_number:0,source_cohort_id:"base",body_sha256:"a".repeat(64),body_bytes:1},
    {recipe_id:"duplicate",corpus_version:"v8017",shard_number:0,source_cohort_id:"parent",body_sha256:"a".repeat(64),body_bytes:1}
  ];
  const controlDb={prepare(){return{bind(){return{all:async()=>({results:routeRows})}}}}};
  const result=await hydrateStep8GV8018ProtectedRecipesBounded(controlDb,[],["duplicate"]);
  assert.equal(result.pass,false);
  assert.equal(result.reason,"ROUTE_DUPLICATE_ACROSS_PARENT_AND_DELTA");
});
