import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_FROKEN_JENSEN_V8011_CHILD_COUNT,
  STEP8G_FROKEN_JENSEN_V8011_COMPOSED_COUNT,
  STEP8G_FROKEN_JENSEN_V8011_PARENT_COUNT,
  plannedV8011OperationBudget,
  assertV8011PrewriteBoundaries
} from "../scripts/corpus-scale-step8g-froken-jensen-v8011-prewrite-core.mjs";

test("v8011 count contract composes exact Frøken Jensen children over v8010", () => {
  assert.equal(STEP8G_FROKEN_JENSEN_V8011_PARENT_COUNT, 11752);
  assert.equal(STEP8G_FROKEN_JENSEN_V8011_CHILD_COUNT, 1372);
  assert.equal(STEP8G_FROKEN_JENSEN_V8011_COMPOSED_COUNT, 13124);
  assert.equal(STEP8G_FROKEN_JENSEN_V8011_PARENT_COUNT + STEP8G_FROKEN_JENSEN_V8011_CHILD_COUNT, STEP8G_FROKEN_JENSEN_V8011_COMPOSED_COUNT);
});

test("v8011 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const budget = plannedV8011OperationBudget({ maxRowsPerBatch: 10 });
  assert.equal(budget.pass, true);
  assert.equal(budget.maxPlannedD1Subqueries, 16);
  assert.equal(budget.maxAllowedD1Subqueries, 16);
  assert.equal(budget.headroomAssumed, false);
  assert.deepEqual(budget.limitingOperations, ["routeWriteFresh"]);
  assert.equal(budget.operations.boundedHydrationWorstCase, 12);
});

test("v8011 prewrite boundary rejects authority widening", () => {
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
  assert.equal(assertV8011PrewriteBoundaries(safe), true);
  assert.throws(() => assertV8011PrewriteBoundaries({ boundaries: { ...safe.boundaries, thirdShardUsed: true } }), /thirdShardUsed/);
});
