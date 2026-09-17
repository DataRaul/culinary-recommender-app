import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_COCINA_MEXICANA_V8008_CHILD_COUNT,
  STEP8G_COCINA_MEXICANA_V8008_COMPOSED_COUNT,
  STEP8G_COCINA_MEXICANA_V8008_PARENT_COUNT,
  plannedV8008OperationBudget,
  assertV8008PrewriteBoundaries
} from "../scripts/corpus-scale-step8g-cocina-mexicana-v8008-prewrite-core.mjs";

test("v8008 count contract composes exact cocina-mexicana children over v8007", () => {
  assert.equal(STEP8G_COCINA_MEXICANA_V8008_PARENT_COUNT, 3695);
  assert.equal(STEP8G_COCINA_MEXICANA_V8008_CHILD_COUNT, 6476);
  assert.equal(STEP8G_COCINA_MEXICANA_V8008_COMPOSED_COUNT, 10171);
  assert.equal(STEP8G_COCINA_MEXICANA_V8008_PARENT_COUNT + STEP8G_COCINA_MEXICANA_V8008_CHILD_COUNT, STEP8G_COCINA_MEXICANA_V8008_COMPOSED_COUNT);
});

test("v8008 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const budget = plannedV8008OperationBudget({ maxRowsPerBatch: 10 });
  assert.equal(budget.pass, true);
  assert.equal(budget.maxPlannedD1Subqueries, 16);
  assert.equal(budget.maxAllowedD1Subqueries, 16);
  assert.equal(budget.headroomAssumed, false);
  assert.deepEqual(budget.limitingOperations, ["routeWriteFresh"]);
});

test("v8008 prewrite boundary rejects authority widening", () => {
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
  assert.equal(assertV8008PrewriteBoundaries(safe), true);
  assert.throws(() => assertV8008PrewriteBoundaries({ boundaries: { ...safe.boundaries, thirdShardUsed: true } }), /thirdShardUsed/);
});
