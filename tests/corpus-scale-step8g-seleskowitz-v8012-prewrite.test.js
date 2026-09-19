import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_SELESKOWITZ_V8012_CHILD_COUNT,
  STEP8G_SELESKOWITZ_V8012_COMPOSED_COUNT,
  STEP8G_SELESKOWITZ_V8012_PARENT_COUNT,
  plannedV8012OperationBudget,
  assertV8012PrewriteBoundaries
} from "../scripts/corpus-scale-step8g-seleskowitz-v8012-prewrite-core.mjs";

test("v8012 count contract composes exact Seleskowitz children over v8011", () => {
  assert.equal(STEP8G_SELESKOWITZ_V8012_PARENT_COUNT,13124);
  assert.equal(STEP8G_SELESKOWITZ_V8012_CHILD_COUNT,1722);
  assert.equal(STEP8G_SELESKOWITZ_V8012_COMPOSED_COUNT,14846);
  assert.equal(STEP8G_SELESKOWITZ_V8012_PARENT_COUNT+STEP8G_SELESKOWITZ_V8012_CHILD_COUNT,STEP8G_SELESKOWITZ_V8012_COMPOSED_COUNT);
});
test("v8012 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const b=plannedV8012OperationBudget({maxRowsPerBatch:10});
  assert.equal(b.pass,true); assert.equal(b.maxPlannedD1Subqueries,16); assert.equal(b.maxAllowedD1Subqueries,16);
  assert.equal(b.headroomAssumed,false); assert.deepEqual(b.limitingOperations,["routeWriteFresh"]);
  assert.equal(b.operations.boundedHydrationWorstCase,13);
});
test("v8012 prewrite boundary rejects authority widening", () => {
 const safe={boundaries:{liveD1WritesPerformed:0,publicRuntimeChanged:false,recommendationAdmissionPerformed:false,thirdShardUsed:false,d1BudgetExpansion:false,billingExpansion:false,nutritionLaneModified:false,youtubeCulinaryStateModified:false,knowledgeCoreWritePerformed:false,culturalAuthenticityAuthorityImported:false}};
 assert.equal(assertV8012PrewriteBoundaries(safe),true);
 assert.throws(()=>assertV8012PrewriteBoundaries({boundaries:{...safe.boundaries,thirdShardUsed:true}}),/thirdShardUsed/);
});
