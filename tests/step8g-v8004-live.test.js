import test from "node:test";
import assert from "node:assert/strict";

import { STEP8G_V8004_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8004-runtime-descriptor.mjs";
import {
  STEP8G_V8004_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8004_EXPECTED_RECIPE_COUNT,
  STEP8G_V8004_EXPECTED_ROUTE_COUNT,
  expectedStep8GV8004BodyBatchIds,
  expectedStep8GV8004RouteBatchIds,
  materializeStep8GV8004IncomingBodyBatch,
  publicStep8GV8004Summary
} from "../src/server/step8g-v8004-live-runtime.mjs";
import { hydrateStep8GV8004ProtectedRecipesBounded } from "../src/server/step8g-v8004-hydration-runtime.mjs";
import { onRequestGet as getV8004 } from "../functions/api/step8g/v8004.js";

const ORIGIN="https://culinary-recommender-app.pages.dev";

test("v8004 freezes 713 Abbott rows and 2355 composed routes on two shards",()=>{
  const summary=publicStep8GV8004Summary();
  assert.equal(summary.recipeCount,STEP8G_V8004_EXPECTED_RECIPE_COUNT);
  assert.equal(summary.cumulativeRecipeCount,STEP8G_V8004_EXPECTED_ROUTE_COUNT);
  assert.equal(summary.bodyBatchCount,STEP8G_V8004_EXPECTED_BODY_BATCH_COUNT);
  assert.equal(summary.newRouteBatchCount,73);
  assert.equal(summary.shardCount,2);
  assert.deepEqual(STEP8G_V8004_RUNTIME_DESCRIPTOR.bodyShardRows,[352,361]);
  assert.equal(expectedStep8GV8004BodyBatchIds().length,73);
  assert.equal(expectedStep8GV8004RouteBatchIds().length,73);
  const bodyHashes=STEP8G_V8004_RUNTIME_DESCRIPTOR.bodyHashHexByShard.map(value=>value.match(/.{64}/g)||[]);
  const routeHashes=STEP8G_V8004_RUNTIME_DESCRIPTOR.routeHashHexByShard.map(value=>value.match(/.{64}/g)||[]);
  assert.deepEqual(bodyHashes.map(list=>list.length),[36,37]);
  assert.deepEqual(routeHashes.map(list=>list.length),[36,37]);
  assert.equal([...bodyHashes.flat(),...routeHashes.flat()].every(value=>/^[0-9a-f]{64}$/.test(value)),true);
  assert.equal(summary.publicRuntimeActivationAuthorized,false);
  assert.equal(summary.recommendationAdmissionAuthorized,false);
  assert.equal(summary.billingExpansionAuthorized,false);
  assert.equal(summary.thirdShardAuthorized,false);
});

test("unknown v8004 body batches fail closed before writes",async()=>{
  const result=await materializeStep8GV8004IncomingBodyBatch({batchId:"not-frozen",sourceEntries:[]});
  assert.equal(result.pass,false);
  assert.equal(result.reason,"UNKNOWN_BODY_BATCH_ID");
});

test("v8004 unauthenticated API requests return 401 before protected shard access",async()=>{
  const explodingDb={prepare(){throw new Error("protected database should not be touched");}};
  const response=await getV8004({request:new Request(`${ORIGIN}/api/step8g/v8004?action=status`),env:{SESSION_SECRET:"0123456789abcdef0123456789abcdef",CULINARY_CONTROL_DB:explodingDb,CULINARY_RECIPE_SHARD_00_DB:explodingDb,CULINARY_RECIPE_SHARD_01_DB:explodingDb}});
  assert.equal(response.status,401);
  const body=await response.json();
  assert.equal(body.error,"UNAUTHORIZED");
  assert.equal(body.protectedDataReturned,false);
  assert.equal(body.shardQueries,0);
});

test("v8004 hydration rejects empty and duplicate IDs before D1 access",async()=>{
  const explodingDb={prepare(){throw new Error("D1 should not be touched");}};
  const empty=await hydrateStep8GV8004ProtectedRecipesBounded(explodingDb,[explodingDb,explodingDb],[]);
  assert.equal(empty.pass,false);assert.equal(empty.reason,"RECIPE_IDS_REQUIRED");
  const dup=await hydrateStep8GV8004ProtectedRecipesBounded(explodingDb,[explodingDb,explodingDb],["x","x"]);
  assert.equal(dup.pass,false);assert.equal(dup.reason,"DUPLICATE_OR_EMPTY_RECIPE_ID");
});
