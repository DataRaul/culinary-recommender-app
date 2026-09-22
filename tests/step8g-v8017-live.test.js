import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { STEP8G_V8017_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8017-runtime-descriptor.mjs";
import {
  STEP8G_V8017_CORPUS_VERSION,
  STEP8G_V8017_PARENT_VERSION,
  STEP8G_V8017_EXPECTED_RECIPE_COUNT,
  STEP8G_V8017_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8017_EXPECTED_ROUTE_COUNT,
  STEP8G_V8017_EXPECTED_PARENT_ROUTE_COUNT,
  STEP8G_V8017_MAX_PROTECTED_D1_SUBQUERIES,
  STEP8G_V8017_OPTIMIZED_MAX_REQUEST_D1_SUBQUERIES,
  STEP8G_V8017_ROUTE_STORAGE_MODE,
  publicStep8GV8017Summary,
  expectedStep8GV8017BodyBatchIds,
  expectedStep8GV8017RouteBatchIds,
  readStep8GV8017RouteProgress
} from "../src/server/step8g-v8017-live-runtime.mjs";
import {
  STEP8G_V8017_MAX_HYDRATED_CANDIDATES,
  STEP8G_V8017_MAX_HYDRATION_D1_SUBQUERIES,
  hydrateStep8GV8017ProtectedRecipesBounded
} from "../src/server/step8g-v8017-hydration-runtime.mjs";
import { sha256Hex } from "../src/server/step8b-live.mjs";

const prewrite = JSON.parse(readFileSync(new URL("../data/generated/step8g/fannie-farmer-v8017-prewrite-evidence.json", import.meta.url), "utf8"));

test("v8017 runtime is frozen to the earned Fannie Farmer prewrite", () => {
  const summary = publicStep8GV8017Summary();
  assert.equal(STEP8G_V8017_CORPUS_VERSION,"v8017");
  assert.equal(STEP8G_V8017_PARENT_VERSION,"v8016");
  assert.equal(summary.recipeCount,1776);
  assert.equal(summary.cumulativeRecipeCount,18787);
  assert.deepEqual(summary.sourceCohortIds,["ORA_FANNIE_FARMER_BOSTON_COOKING_SCHOOL_GUTENBERG_65061"]);
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

test("v8017 exact child and optimized route layout is frozen", () => {
  assert.equal(STEP8G_V8017_EXPECTED_RECIPE_COUNT,1776);
  assert.equal(STEP8G_V8017_EXPECTED_BODY_BATCH_COUNT,178);
  assert.equal(STEP8G_V8017_EXPECTED_PARENT_ROUTE_COUNT,17011);
  assert.equal(STEP8G_V8017_EXPECTED_ROUTE_COUNT,18787);
  assert.deepEqual(STEP8G_V8017_RUNTIME_DESCRIPTOR.bodyShardRows,[880,896]);
  assert.equal(STEP8G_V8017_RUNTIME_DESCRIPTOR.parentCompositionRouteCount,17011);
  assert.equal(STEP8G_V8017_RUNTIME_DESCRIPTOR.composedRouteCount,18787);
  assert.equal(expectedStep8GV8017BodyBatchIds().length,178);
  assert.equal(expectedStep8GV8017RouteBatchIds().length,178);
  assert.equal(expectedStep8GV8017BodyBatchIds()[0],"s00-b000000");
  assert.equal(expectedStep8GV8017RouteBatchIds().at(-1),"route-v8017-s01-b000089");
});

test("v8017 remains inside the existing two-shard optimized envelope", () => {
  assert.equal(STEP8G_V8017_MAX_PROTECTED_D1_SUBQUERIES,16);
  assert.equal(STEP8G_V8017_MAX_HYDRATED_CANDIDATES,256);
  assert.equal(STEP8G_V8017_MAX_HYDRATION_D1_SUBQUERIES,7);
  assert.equal(STEP8G_V8017_OPTIMIZED_MAX_REQUEST_D1_SUBQUERIES,8);
  assert.equal(STEP8G_V8017_ROUTE_STORAGE_MODE,"V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA");
  assert.equal(prewrite.layer.operationBudget.maxPlannedD1Subqueries,8);
  assert.equal(prewrite.layer.operationBudget.optimizedTargetHeadroomAssumed,false);
  assert.equal(prewrite.layer.operationBudget.hardFailSafeIsNotSpendableHeadroom,true);
  assert.equal(prewrite.layer.operationBudget.operations.seventeenLayerHydrationCanary,4);
  assert.equal(prewrite.composition.routing.shardCount,2);
  assert.equal(prewrite.composition.routing.parentRouteRowsCopied,0);
});

test("v8017 references v8015 base plus v8016 delta and writes no parent copies", () => {
  const source=readFileSync(new URL("../src/server/step8g-v8017-live-runtime.mjs",import.meta.url),"utf8");
  assert.match(source,/STEP8G_V8017_EXPECTED_PARENT_ROUTE_COUNT = 17011/);
  assert.match(source,/PARENT_ROUTES_REFERENCED_FROM_V8015_BASE_PLUS_V8016_DELTA/);
  assert.match(source,/composition_version='v8015'/);
  assert.match(source,/composition_version='v8016' AND corpus_version='v8016'/);
  assert.match(source,/composition_version='v8017' AND corpus_version<>'v8017'/);
  assert.equal(source.includes("SELECT 'v8017',recipe_id,corpus_version"),false);
  assert.equal(source.includes("PARENT_ROUTES_COPIED_AND_VERIFIED"),false);
  assert.match(source,/active_version='v8016'/);
  assert.match(source,/ROLLED_BACK_TO_V8016/);
});



test("v8017 route progress uses three control queries so activation stays within eight total", async () => {
  const prepared = [];
  const controlDb = {
    prepare(sql) {
      prepared.push(sql);
      return {
        first: async () => {
          if (sql.includes("base_count")) return { base_count: 16510, parent_delta_count: 501 };
          if (sql.includes("corpus_version='v8017'")) return { c: 1776 };
          throw new Error("UNEXPECTED_FIRST_QUERY");
        },
        all: async () => ({ results: [] })
      };
    }
  };
  const result = await readStep8GV8017RouteProgress(controlDb);
  assert.equal(result.d1Subqueries,3);
  assert.equal(result.baseRouteCount,16510);
  assert.equal(result.parentDeltaRouteCount,501);
  assert.equal(result.parentRouteCount,17011);
  assert.equal(result.newRouteCount,1776);
  assert.equal(prepared.length,3);
  assert.match(prepared[0],/SUM\(CASE WHEN composition_version='v8015'/);
  assert.match(prepared[0],/parent_delta_count/);
});

test("v8017 API preserves auth, diagnostics and rollback evidence shape", () => {
  const api=readFileSync(new URL("../functions/api/step8g/v8017.js",import.meta.url),"utf8");
  assert.match(api,/STEP8G_V8017_WRITE_BODY_EXCEPTION/);
  assert.match(api,/WRITE_ERROR_UNKNOWN_COMMIT_STATE/);
  assert.match(api,/STEP8G_V8017_FREE_LIMIT_FAIL_CLOSED/);
  assert.match(api,/pointer\.activeVersion === "v8016" && pointer\.previousVersion === "v8017"/);
  assert.equal(api.includes("SESSION_SECRET="),false);
});

test("v8017 hydration resolves base, parent delta and child delta routes", async () => {
  const encoder=new TextEncoder();
  const bodies=[
    JSON.stringify({canonicalRecipeId:"base",layer:"v8015"}),
    JSON.stringify({canonicalRecipeId:"parent-delta",layer:"v8016"}),
    JSON.stringify({canonicalRecipeId:"child-delta",layer:"v8017"})
  ];
  const hashes=await Promise.all(bodies.map(sha256Hex));
  const routeRows=[
    {recipe_id:"base",corpus_version:"v8015",shard_number:0,source_cohort_id:"base",body_sha256:hashes[0],body_bytes:encoder.encode(bodies[0]).byteLength},
    {recipe_id:"parent-delta",corpus_version:"v8016",shard_number:1,source_cohort_id:"parent",body_sha256:hashes[1],body_bytes:encoder.encode(bodies[1]).byteLength},
    {recipe_id:"child-delta",corpus_version:"v8017",shard_number:0,source_cohort_id:"child",body_sha256:hashes[2],body_bytes:encoder.encode(bodies[2]).byteLength}
  ];
  const controlDb={prepare(){return{bind(){return{all:async()=>({results:routeRows})}}}}};
  const rowsByShard=[
    [
      {corpus_version:"v8015",recipe_id:"base",body_json:bodies[0],body_bytes:encoder.encode(bodies[0]).byteLength,body_sha256:hashes[0],source_cohort_id:"base"},
      {corpus_version:"v8017",recipe_id:"child-delta",body_json:bodies[2],body_bytes:encoder.encode(bodies[2]).byteLength,body_sha256:hashes[2],source_cohort_id:"child"}
    ],
    [
      {corpus_version:"v8016",recipe_id:"parent-delta",body_json:bodies[1],body_bytes:encoder.encode(bodies[1]).byteLength,body_sha256:hashes[1],source_cohort_id:"parent"}
    ]
  ];
  const shardDbs=rowsByShard.map(rows=>({prepare(){return{bind(){return{all:async()=>({results:rows})}}}}}));
  const result=await hydrateStep8GV8017ProtectedRecipesBounded(controlDb,shardDbs,["base","parent-delta","child-delta"]);
  assert.equal(result.pass,true);
  assert.equal(result.packets.length,3);
  assert.equal(result.routeQueries,1);
  assert.equal(result.shardQueries,2);
  assert.equal(result.d1Subqueries,3);
});

test("v8017 hydration fails closed on duplicate ancestry routes", async () => {
  const routeRows=[
    {recipe_id:"duplicate",corpus_version:"v8015",shard_number:0,source_cohort_id:"base",body_sha256:"a".repeat(64),body_bytes:1},
    {recipe_id:"duplicate",corpus_version:"v8016",shard_number:0,source_cohort_id:"parent",body_sha256:"a".repeat(64),body_bytes:1}
  ];
  const controlDb={prepare(){return{bind(){return{all:async()=>({results:routeRows})}}}}};
  const result=await hydrateStep8GV8017ProtectedRecipesBounded(controlDb,[],["duplicate"]);
  assert.equal(result.pass,false);
  assert.equal(result.reason,"ROUTE_DUPLICATE_ACROSS_PARENT_AND_DELTA");
});
