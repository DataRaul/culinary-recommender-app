import test from "node:test";
import assert from "node:assert/strict";

import { STEP8G_V8006_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8006-runtime-descriptor.mjs";
import {
  STEP8G_V8006_CORPUS_VERSION,
  STEP8G_V8006_PARENT_VERSION,
  STEP8G_V8006_EXPECTED_RECIPE_COUNT,
  STEP8G_V8006_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8006_EXPECTED_ROUTE_COUNT,
  STEP8G_V8006_EXPECTED_PARENT_ROUTE_COUNT,
  STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES,
  expectedStep8GV8006BodyBatchIds,
  expectedStep8GV8006RouteBatchIds,
  materializeStep8GV8006IncomingBodyBatch,
  publicStep8GV8006Summary
} from "../src/server/step8g-v8006-live-runtime.mjs";
import {
  STEP8G_V8006_MAX_HYDRATED_CANDIDATES,
  STEP8G_V8006_LOOKUP_IDS_PER_QUERY,
  STEP8G_V8006_MAX_HYDRATION_D1_SUBQUERIES
} from "../src/server/step8g-v8006-hydration-runtime.mjs";

test("v8006 frozen live contract matches earned prewrite", () => {
  const summary=publicStep8GV8006Summary();
  assert.equal(STEP8G_V8006_CORPUS_VERSION,"v8006");
  assert.equal(STEP8G_V8006_PARENT_VERSION,"v8005");
  assert.equal(STEP8G_V8006_EXPECTED_RECIPE_COUNT,442);
  assert.equal(STEP8G_V8006_EXPECTED_PARENT_ROUTE_COUNT,2464);
  assert.equal(STEP8G_V8006_EXPECTED_ROUTE_COUNT,2906);
  assert.equal(STEP8G_V8006_EXPECTED_BODY_BATCH_COUNT,45);
  assert.equal(summary.recipeCount,442);
  assert.equal(summary.cumulativeRecipeCount,2906);
  assert.equal(summary.bodyBatchCount,45);
  assert.equal(summary.newRouteBatchCount,45);
  assert.equal(summary.shardCount,2);
  assert.equal(summary.maxRowsPerBatch,10);
  assert.equal(summary.maxProtectedD1Subqueries,16);
  assert.equal(summary.layerManifestSha256,"3ac76c7f8f107eaf811167e8245582e30204715d7b45a83eade26ae418f765db");
  assert.equal(summary.populationPlanSha256,"b6dd9020fb6221a72c245feb2dd94d9b5ebe8bb758bd25ee508c9031fe5b59a0");
  assert.equal(summary.publicRuntimeActivationAuthorized,false);
  assert.equal(summary.recommendationAdmissionAuthorized,false);
  assert.equal(summary.billingExpansionAuthorized,false);
  assert.equal(summary.thirdShardAuthorized,false);
  assert.equal(summary.culturalAuthenticityAuthorityImported,false);
});

test("v8006 frozen body and route layouts remain exactly 22 + 23 batches", () => {
  const bodyHashes=STEP8G_V8006_RUNTIME_DESCRIPTOR.bodyHashHexByShard.map(value=>value.match(/.{64}/g)||[]);
  const routeHashes=STEP8G_V8006_RUNTIME_DESCRIPTOR.routeHashHexByShard.map(value=>value.match(/.{64}/g)||[]);
  assert.deepEqual(STEP8G_V8006_RUNTIME_DESCRIPTOR.bodyShardRows,[218,224]);
  assert.deepEqual(bodyHashes.map(list=>list.length),[22,23]);
  assert.deepEqual(routeHashes.map(list=>list.length),[22,23]);
  assert.equal(expectedStep8GV8006BodyBatchIds().length,45);
  assert.equal(expectedStep8GV8006RouteBatchIds().length,45);
  assert.equal([...bodyHashes.flat(),...routeHashes.flat()].every(value=>/^[0-9a-f]{64}$/.test(value)),true);
});

test("v8006 malformed or unfrozen source input fails closed before a write", async () => {
  const first=expectedStep8GV8006BodyBatchIds()[0];
  const invalid=await materializeStep8GV8006IncomingBodyBatch({batchId:first,sourceEntries:Array.from({length:10},(_,ordinal)=>({ordinal,rawJson:"{}"}))});
  assert.equal(invalid.pass,false);
  assert.equal(invalid.reason,"SOURCE_RECORD_RIGHTS_OR_STRUCTURE_MISMATCH");
  const unknown=await materializeStep8GV8006IncomingBodyBatch({batchId:"unknown",sourceEntries:[]});
  assert.deepEqual(unknown,{pass:false,reason:"UNKNOWN_BODY_BATCH_ID"});
});

test("six-layer bounded hydration preserves the existing free-limit envelope", () => {
  assert.equal(STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES,16);
  assert.equal(STEP8G_V8006_MAX_HYDRATED_CANDIDATES,256);
  assert.equal(STEP8G_V8006_LOOKUP_IDS_PER_QUERY,97);
  assert.equal(STEP8G_V8006_MAX_HYDRATION_D1_SUBQUERIES,9);
});
