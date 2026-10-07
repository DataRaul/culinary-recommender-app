import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sha256Hex } from "../src/server/step8b-live.mjs";
import { STEP8G_V8019_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8019-runtime-descriptor.mjs";
import {
  STEP8G_V8019_CORPUS_VERSION, STEP8G_V8019_PARENT_VERSION,
  STEP8G_V8019_EXPECTED_RECIPE_COUNT, STEP8G_V8019_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8019_EXPECTED_ROUTE_COUNT, STEP8G_V8019_EXPECTED_PARENT_ROUTE_COUNT,
  STEP8G_V8019_MAX_PROTECTED_D1_SUBQUERIES, STEP8G_V8019_OPTIMIZED_MAX_REQUEST_D1_SUBQUERIES,
  STEP8G_V8019_ROUTE_STORAGE_MODE, publicStep8GV8019Summary,
  expectedStep8GV8019BodyBatchIds, expectedStep8GV8019RouteBatchIds,
  readStep8GV8019RouteProgress
} from "../src/server/step8g-v8019-live-runtime.mjs";
import {
  STEP8G_V8019_MAX_HYDRATED_CANDIDATES, STEP8G_V8019_MAX_HYDRATION_D1_SUBQUERIES,
  hydrateStep8GV8019ProtectedRecipesBounded
} from "../src/server/step8g-v8019-hydration-runtime.mjs";

test("v8019 runtime is frozen to full Iduns acquisition target", () => {
  const summary=publicStep8GV8019Summary();
  assert.equal(STEP8G_V8019_CORPUS_VERSION,"v8019");
  assert.equal(STEP8G_V8019_PARENT_VERSION,"v8018");
  assert.equal(summary.recipeCount,2818);
  assert.equal(summary.cumulativeRecipeCount,22086);
  assert.deepEqual(summary.sourceCohortIds,["ORA_IDUNS_1911_FIRST_EDITION_ARKIVKOPIA_RUNEBERG"]);
  assert.equal(summary.sourceAuthorHandling,"IDENTIFIED_AUTHOR");
  assert.equal(summary.publicRuntimeActivationAuthorized,false);
  assert.equal(summary.recommendationAdmissionAuthorized,false);
  assert.equal(summary.parentRouteRowsCopied,0);
});
test("v8019 descriptor and batch universe are exact", () => {
  assert.equal(STEP8G_V8019_EXPECTED_RECIPE_COUNT,2818);
  assert.equal(STEP8G_V8019_EXPECTED_BODY_BATCH_COUNT,283);
  assert.equal(STEP8G_V8019_EXPECTED_PARENT_ROUTE_COUNT,19268);
  assert.equal(STEP8G_V8019_EXPECTED_ROUTE_COUNT,22086);
  assert.deepEqual(STEP8G_V8019_RUNTIME_DESCRIPTOR.bodyShardRows,[1363,1455]);
  assert.equal(STEP8G_V8019_RUNTIME_DESCRIPTOR.parentCompositionRouteCount,19268);
  assert.equal(STEP8G_V8019_RUNTIME_DESCRIPTOR.composedRouteCount,22086);
  assert.equal(expectedStep8GV8019BodyBatchIds().length,283);
  assert.equal(expectedStep8GV8019RouteBatchIds().length,283);
  assert.equal(expectedStep8GV8019BodyBatchIds()[0],"s00-b000000");
  assert.equal(expectedStep8GV8019RouteBatchIds().at(-1),"route-v8019-s01-b000145");
  assert.deepEqual(STEP8G_V8019_RUNTIME_DESCRIPTOR.bodyHashHexByShard.map(x=>x.length/64),[137,146]);
  assert.deepEqual(STEP8G_V8019_RUNTIME_DESCRIPTOR.routeHashHexByShard.map(x=>x.length/64),[137,146]);
});
test("v8019 stays on existing free two-shard envelope", () => {
  assert.equal(STEP8G_V8019_MAX_PROTECTED_D1_SUBQUERIES,16);
  assert.equal(STEP8G_V8019_MAX_HYDRATED_CANDIDATES,256);
  assert.equal(STEP8G_V8019_MAX_HYDRATION_D1_SUBQUERIES,7);
  assert.equal(STEP8G_V8019_OPTIMIZED_MAX_REQUEST_D1_SUBQUERIES,8);
  assert.equal(STEP8G_V8019_ROUTE_STORAGE_MODE,"V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA_PLUS_V8019_DELTA");
});
test("v8019 parent ancestry includes v8018 with zero copy", () => {
  const source=readFileSync(new URL("../src/server/step8g-v8019-live-runtime.mjs",import.meta.url),"utf8");
  assert.match(source,/v8018_delta_count/);
  assert.match(source,/v8018DeltaCount !== 481/);
  assert.match(source,/PARENT_ROUTES_REFERENCED_FROM_V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA/);
  assert.match(source,/composition_version='v8019' AND corpus_version<>'v8019'/);
  assert.equal(source.includes("SELECT 'v8019',recipe_id,corpus_version"),false);
  assert.match(source,/active_version='v8018'/);
  assert.match(source,/ROLLED_BACK_TO_V8018/);
});
test("v8019 route progress remains three control queries", async () => {
  const controlDb={prepare(sql){return{first:async()=>{
    if(sql.includes("base_count")) return {base_count:16510,v8016_delta_count:501,v8017_delta_count:1776,v8018_delta_count:481};
    if(sql.includes("corpus_version='v8019'")) return {c:2818};
    return {};
  },all:async()=>({results:[]})}}};
  const result=await readStep8GV8019RouteProgress(controlDb);
  assert.equal(result.d1Subqueries,3);
  assert.equal(result.parentRouteCount,19268);
  assert.equal(result.v8018DeltaRouteCount,481);
  assert.equal(result.newRouteCount,2818);
});
test("v8019 API preserves auth and rollback evidence", () => {
  const api=readFileSync(new URL("../functions/api/step8g/v8019.js",import.meta.url),"utf8");
  assert.match(api,/STEP8G_V8019_WRITE_BODY_EXCEPTION/);
  assert.match(api,/STEP8G_V8019_FREE_LIMIT_FAIL_CLOSED/);
  assert.match(api,/pointer\.activeVersion === "v8018" && pointer\.previousVersion === "v8019"/);
  assert.match(api,/currentSessionAccount/);
});
test("v8019 hydration resolves v8015 through v8019", async () => {
  const versions=["v8015","v8016","v8017","v8018","v8019"];
  const bodies=Object.fromEntries(versions.map(layer=>[layer,JSON.stringify({canonicalRecipeId:layer,layer})]));
  const hashes=Object.fromEntries(await Promise.all(versions.map(async layer=>[layer,await sha256Hex(bodies[layer])])));
  const encoder=new TextEncoder();
  const routeRows=versions.map((layer,i)=>({recipe_id:layer,corpus_version:layer,shard_number:i%2,source_cohort_id:layer,body_sha256:hashes[layer],body_bytes:encoder.encode(bodies[layer]).byteLength}));
  const controlDb={prepare(){return{bind(){return{all:async()=>({results:routeRows})}}}}};
  const shardDbs=[0,1].map(shard=>({prepare(){return{bind(){return{all:async()=>({results:routeRows.filter(r=>r.shard_number===shard).map(r=>({corpus_version:r.corpus_version,recipe_id:r.recipe_id,body_json:bodies[r.recipe_id],body_bytes:r.body_bytes,body_sha256:r.body_sha256,source_cohort_id:r.source_cohort_id}))})}}}}}));
  const result=await hydrateStep8GV8019ProtectedRecipesBounded(controlDb,shardDbs,versions);
  assert.equal(result.pass,true);
  assert.deepEqual(result.packets.map(p=>p.canonicalRecipeId),versions);
  assert.equal(result.routeQueries,1);
  assert.ok(result.d1Subqueries<=7);
});
test("v8019 source IDs preserve immutable source ordinal", () => {
  const source=readFileSync(new URL("../src/server/step8g-v8019-live-runtime.mjs",import.meta.url),"utf8");
  const verifier=readFileSync(new URL("../scripts/verify-step8g-v8019-live-payloads.mjs",import.meta.url),"utf8");
  assert.match(source,/String\(sourceOrdinal\)\.padStart\(4,"0"\)/);
  assert.match(verifier,/String\(sourceOrdinal\)\.padStart\(4,"0"\)/);
});
