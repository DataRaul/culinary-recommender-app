import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_ARTUSI_V8010_CHILD_COUNT,
  STEP8G_ARTUSI_V8010_COMPOSED_COUNT,
  STEP8G_ARTUSI_V8010_PARENT_COUNT,
  plannedV8010OperationBudget,
  assertV8010PrewriteBoundaries
} from "../scripts/corpus-scale-step8g-artusi-v8010-prewrite-core.mjs";

test("v8010 count contract composes exact Artusi children over v8009", () => {
  assert.equal(STEP8G_ARTUSI_V8010_PARENT_COUNT, 10923);
  assert.equal(STEP8G_ARTUSI_V8010_CHILD_COUNT, 829);
  assert.equal(STEP8G_ARTUSI_V8010_COMPOSED_COUNT, 11752);
  assert.equal(STEP8G_ARTUSI_V8010_PARENT_COUNT + STEP8G_ARTUSI_V8010_CHILD_COUNT, STEP8G_ARTUSI_V8010_COMPOSED_COUNT);
});

test("v8010 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const budget = plannedV8010OperationBudget({ maxRowsPerBatch: 10 });
  assert.equal(budget.pass, true);
  assert.equal(budget.maxPlannedD1Subqueries, 16);
  assert.equal(budget.maxAllowedD1Subqueries, 16);
  assert.equal(budget.headroomAssumed, false);
  assert.deepEqual(budget.limitingOperations, ["routeWriteFresh"]);
  assert.equal(budget.operations.boundedHydrationWorstCase, 11);
});

test("v8010 prewrite boundary rejects authority widening", () => {
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
  assert.equal(assertV8010PrewriteBoundaries(safe), true);
  assert.throws(() => assertV8010PrewriteBoundaries({ boundaries: { ...safe.boundaries, thirdShardUsed: true } }), /thirdShardUsed/);
});
