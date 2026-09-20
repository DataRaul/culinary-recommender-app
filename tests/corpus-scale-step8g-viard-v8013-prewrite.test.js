import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_VIARD_V8013_CHILD_COUNT,
  STEP8G_VIARD_V8013_COMPOSED_COUNT,
  STEP8G_VIARD_V8013_PARENT_COUNT,
  plannedV8013OperationBudget,
  assertV8013PrewriteBoundaries
} from "../scripts/corpus-scale-step8g-viard-v8013-prewrite-core.mjs";

test("v8013 count contract composes exact Viard children over v8012", () => {
  assert.equal(STEP8G_VIARD_V8013_PARENT_COUNT,14846);
  assert.equal(STEP8G_VIARD_V8013_CHILD_COUNT,807);
  assert.equal(STEP8G_VIARD_V8013_COMPOSED_COUNT,15653);
  assert.equal(STEP8G_VIARD_V8013_PARENT_COUNT+STEP8G_VIARD_V8013_CHILD_COUNT,STEP8G_VIARD_V8013_COMPOSED_COUNT);
});
test("v8013 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const b=plannedV8013OperationBudget({maxRowsPerBatch:10});
  assert.equal(b.pass,true); assert.equal(b.maxPlannedD1Subqueries,16); assert.equal(b.maxAllowedD1Subqueries,16);
  assert.equal(b.headroomAssumed,false); assert.deepEqual(b.limitingOperations,["routeWriteFresh"]);
  assert.equal(b.operations.boundedHydrationWorstCase,14);
});
test("v8013 prewrite boundary rejects authority widening", () => {
 const safe={boundaries:{liveD1WritesPerformed:0,publicRuntimeChanged:false,recommendationAdmissionPerformed:false,thirdShardUsed:false,d1BudgetExpansion:false,billingExpansion:false,nutritionLaneModified:false,youtubeCulinaryStateModified:false,knowledgeCoreWritePerformed:false,culturalAuthenticityAuthorityImported:false}};
 assert.equal(assertV8013PrewriteBoundaries(safe),true);
 assert.throws(()=>assertV8013PrewriteBoundaries({boundaries:{...safe.boundaries,thirdShardUsed:true}}),/thirdShardUsed/);
});
