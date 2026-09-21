import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_CHAN_V8015_CHILD_COUNT,
  STEP8G_CHAN_V8015_COMPOSED_COUNT,
  STEP8G_CHAN_V8015_PARENT_COUNT,
  plannedV8015OperationBudget,
  assertV8015PrewriteBoundaries
} from "../scripts/corpus-scale-step8g-chan-v8015-prewrite-core.mjs";

test("v8015 count contract composes exact Chan children over v8014", () => {
  assert.equal(STEP8G_CHAN_V8015_PARENT_COUNT,16365);
  assert.equal(STEP8G_CHAN_V8015_CHILD_COUNT,145);
  assert.equal(STEP8G_CHAN_V8015_COMPOSED_COUNT,16510);
  assert.equal(STEP8G_CHAN_V8015_PARENT_COUNT+STEP8G_CHAN_V8015_CHILD_COUNT,STEP8G_CHAN_V8015_COMPOSED_COUNT);
});
test("v8015 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const b=plannedV8015OperationBudget({maxRowsPerBatch:10});
  assert.equal(b.pass,true); assert.equal(b.maxPlannedD1Subqueries,16); assert.equal(b.maxAllowedD1Subqueries,16);
  assert.equal(b.headroomAssumed,false);
  assert.deepEqual(b.limitingOperations.sort(),["boundedHydrationWorstCase","routeWriteFresh"].sort());
  assert.equal(b.operations.boundedHydrationWorstCase,16);
});
test("v8015 prewrite boundary rejects authority widening", () => {
 const safe={boundaries:{liveD1WritesPerformed:0,publicRuntimeChanged:false,recommendationAdmissionPerformed:false,thirdShardUsed:false,d1BudgetExpansion:false,billingExpansion:false,nutritionLaneModified:false,youtubeCulinaryStateModified:false,knowledgeCoreWritePerformed:false,culturalAuthenticityAuthorityImported:false}};
 assert.equal(assertV8015PrewriteBoundaries(safe),true);
 assert.throws(()=>assertV8015PrewriteBoundaries({boundaries:{...safe.boundaries,thirdShardUsed:true}}),/thirdShardUsed/);
});
