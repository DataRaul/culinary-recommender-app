import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_MENON_V8009_CHILD_COUNT,
  STEP8G_MENON_V8009_COMPOSED_COUNT,
  STEP8G_MENON_V8009_PARENT_COUNT,
  plannedV8009OperationBudget,
  assertV8009PrewriteBoundaries
} from "../scripts/corpus-scale-step8g-menon-v8009-prewrite-core.mjs";

test("v8009 count contract composes exact Menon children over v8008", () => {
  assert.equal(STEP8G_MENON_V8009_PARENT_COUNT, 10171);
  assert.equal(STEP8G_MENON_V8009_CHILD_COUNT, 752);
  assert.equal(STEP8G_MENON_V8009_COMPOSED_COUNT, 10923);
  assert.equal(STEP8G_MENON_V8009_PARENT_COUNT + STEP8G_MENON_V8009_CHILD_COUNT, STEP8G_MENON_V8009_COMPOSED_COUNT);
});

test("v8009 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const budget = plannedV8009OperationBudget({ maxRowsPerBatch: 10 });
  assert.equal(budget.pass, true);
  assert.equal(budget.maxPlannedD1Subqueries, 16);
  assert.equal(budget.maxAllowedD1Subqueries, 16);
  assert.equal(budget.headroomAssumed, false);
  assert.deepEqual(budget.limitingOperations, ["routeWriteFresh"]);
});

test("v8009 prewrite boundary rejects authority widening", () => {
  const safe = {
    boundaries: {
      liveD1WritesPerformed: 0,
      publicRuntimeChanged: false,
      recommendationAdmissionPerformed: false,
      thirdShardUsed: false,
      d1BudgetExpansion: false,
      billingExpansion: false,
      nutritionLaneModified: false,
      youtubeCulinaryStateModified: false,
      knowledgeCoreWritePerformed: false,
      culturalAuthenticityAuthorityImported: false
    }
  };
  assert.equal(assertV8009PrewriteBoundaries(safe), true);
  assert.throws(() => assertV8009PrewriteBoundaries({ boundaries: { ...safe.boundaries, thirdShardUsed: true } }), /thirdShardUsed/);
});
