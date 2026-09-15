import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_V8003_EXPECTED_BODY_BATCH_COUNT,
  STEP8G_V8003_EXPECTED_RECIPE_COUNT,
  STEP8G_V8003_EXPECTED_ROUTE_COUNT,
  expectedStep8GV8003BodyBatchIds,
  expectedStep8GV8003RouteBatchIds,
  materializeStep8GV8003IncomingBodyBatch,
  publicStep8GV8003Summary
} from "../src/server/step8g-v8003-live-runtime.mjs";
import { hydrateStep8GV8003ProtectedRecipesBounded } from "../src/server/step8g-v8003-hydration-runtime.mjs";
import { onRequestGet as getV8003 } from "../functions/api/step8g/v8003.js";

const ORIGIN="https://culinary-recommender-app.pages.dev";

test("v8003 runtime freezes 226 child rows and 1642 composed routes on two shards",()=>{
  const summary=publicStep8GV8003Summary();
  assert.equal(summary.recipeCount,STEP8G_V8003_EXPECTED_RECIPE_COUNT);
  assert.equal(summary.cumulativeRecipeCount,STEP8G_V8003_EXPECTED_ROUTE_COUNT);
  assert.equal(summary.bodyBatchCount,STEP8G_V8003_EXPECTED_BODY_BATCH_COUNT);
  assert.equal(summary.newRouteBatchCount,23);
  assert.equal(summary.shardCount,2);
  assert.equal(expectedStep8GV8003BodyBatchIds().length,23);
  assert.equal(expectedStep8GV8003RouteBatchIds().length,23);
  assert.equal(summary.publicRuntimeActivationAuthorized,false);
  assert.equal(summary.recommendationAdmissionAuthorized,false);
  assert.equal(summary.billingExpansionAuthorized,false);
  assert.equal(summary.thirdShardAuthorized,false);
});

test("unknown v8003 body batches fail closed before writes",async()=>{
  const result=await materializeStep8GV8003IncomingBodyBatch({batchId:"not-frozen",sourceEntries:[]});
  assert.equal(result.pass,false);
  assert.equal(result.reason,"UNKNOWN_BODY_BATCH_ID");
});

test("v8003 unauthenticated API requests return 401 before protected shard access",async()=>{
  const explodingDb={prepare(){throw new Error("protected database should not be touched");}};
  const response=await getV8003({request:new Request(`${ORIGIN}/api/step8g/v8003?action=status`),env:{SESSION_SECRET:"0123456789abcdef0123456789abcdef",CULINARY_CONTROL_DB:explodingDb,CULINARY_RECIPE_SHARD_00_DB:explodingDb,CULINARY_RECIPE_SHARD_01_DB:explodingDb}});
  assert.equal(response.status,401);
  const body=await response.json();
  assert.equal(body.error,"UNAUTHORIZED");
  assert.equal(body.protectedDataReturned,false);
  assert.equal(body.shardQueries,0);
});

test("v8003 hydration rejects empty and duplicate IDs before D1 access",async()=>{
  const explodingDb={prepare(){throw new Error("D1 should not be touched");}};
  const empty=await hydrateStep8GV8003ProtectedRecipesBounded(explodingDb,[explodingDb,explodingDb],[]);
  assert.equal(empty.pass,false);assert.equal(empty.reason,"RECIPE_IDS_REQUIRED");
  const dup=await hydrateStep8GV8003ProtectedRecipesBounded(explodingDb,[explodingDb,explodingDb],["x","x"]);
  assert.equal(dup.pass,false);assert.equal(dup.reason,"DUPLICATE_OR_EMPTY_RECIPE_ID");
});
