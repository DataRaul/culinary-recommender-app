import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_HEARN_V8014_CHILD_COUNT,
  STEP8G_HEARN_V8014_COMPOSED_COUNT,
  STEP8G_HEARN_V8014_PARENT_COUNT,
  plannedV8014OperationBudget,
  assertV8014PrewriteBoundaries
} from "../scripts/corpus-scale-step8g-hearn-v8014-prewrite-core.mjs";

test("v8014 count contract composes exact Hearn children over v8013", () => {
  assert.equal(STEP8G_HEARN_V8014_PARENT_COUNT,15653);
  assert.equal(STEP8G_HEARN_V8014_CHILD_COUNT,712);
  assert.equal(STEP8G_HEARN_V8014_COMPOSED_COUNT,16365);
  assert.equal(STEP8G_HEARN_V8014_PARENT_COUNT+STEP8G_HEARN_V8014_CHILD_COUNT,STEP8G_HEARN_V8014_COMPOSED_COUNT);
});
test("v8014 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const b=plannedV8014OperationBudget({maxRowsPerBatch:10});
  assert.equal(b.pass,true); assert.equal(b.maxPlannedD1Subqueries,16); assert.equal(b.maxAllowedD1Subqueries,16);
  assert.equal(b.headroomAssumed,false); assert.deepEqual(b.limitingOperations,["routeWriteFresh"]);
  assert.equal(b.operations.boundedHydrationWorstCase,15);
});
test("v8014 prewrite boundary rejects authority widening", () => {
 const safe={boundaries:{liveD1WritesPerformed:0,publicRuntimeChanged:false,recommendationAdmissionPerformed:false,thirdShardUsed:false,d1BudgetExpansion:false,billingExpansion:false,nutritionLaneModified:false,youtubeCulinaryStateModified:false,knowledgeCoreWritePerformed:false,culturalAuthenticityAuthorityImported:false}};
 assert.equal(assertV8014PrewriteBoundaries(safe),true);
 assert.throws(()=>assertV8014PrewriteBoundaries({boundaries:{...safe.boundaries,thirdShardUsed:true}}),/thirdShardUsed/);
});
