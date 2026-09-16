import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_RIGAUD_V8007_CHILD_COUNT,
  STEP8G_RIGAUD_V8007_COMPOSED_COUNT,
  STEP8G_RIGAUD_V8007_MAX_D1_SUBQUERIES,
  STEP8G_RIGAUD_V8007_PARENT_COUNT,
  assertV8007PrewriteBoundaries,
  buildV8006ParentFingerprint,
  plannedV8007OperationBudget
} from "../scripts/corpus-scale-step8g-ora-rigaud-v8007-prewrite-core.mjs";

test("v8007 count contract composes 789 Rigaud children over exact v8006 parent", () => {
  assert.equal(STEP8G_RIGAUD_V8007_PARENT_COUNT, 2906);
  assert.equal(STEP8G_RIGAUD_V8007_CHILD_COUNT, 789);
  assert.equal(STEP8G_RIGAUD_V8007_COMPOSED_COUNT, 3695);
  assert.equal(STEP8G_RIGAUD_V8007_PARENT_COUNT + STEP8G_RIGAUD_V8007_CHILD_COUNT, STEP8G_RIGAUD_V8007_COMPOSED_COUNT);
});

test("10-row route write exactly consumes but does not exceed inherited 16-query ceiling", () => {
  const budget = plannedV8007OperationBudget({ maxRowsPerBatch: 10 });
  assert.equal(budget.pass, true);
  assert.equal(budget.maxPlannedD1Subqueries, 16);
  assert.equal(budget.operations.routeWriteFresh, 16);
  assert.deepEqual(budget.limitingOperations, ["routeWriteFresh"]);
  assert.equal(budget.headroomAssumed, false);
  assert.equal(budget.maxAllowedD1Subqueries, STEP8G_RIGAUD_V8007_MAX_D1_SUBQUERIES);
  for (const value of Object.values(budget.operations)) assert.ok(value <= 16);
});

test("increasing route batch size to 11 fails closed instead of expanding budget", () => {
  const budget = plannedV8007OperationBudget({ maxRowsPerBatch: 11 });
  assert.equal(budget.pass, false);
  assert.equal(budget.operations.routeWriteFresh, 17);
  assert.equal(budget.maxAllowedD1Subqueries, 16);
});

test("seven-layer hydration canary remains below the ceiling", () => {
  const budget = plannedV8007OperationBudget();
  assert.equal(budget.operations.sevenLayerHydrationCanary, 4);
  assert.ok(budget.operations.boundedHydrationWorstCase <= 16);
});

test("v8006 parent fingerprint requires matching live, prewrite and descriptor identity", () => {
  const prewriteEvidence = {
    pass: true,
    composition: { activeCorpusVersion: "v8006", cumulativeRecipeCount: 2906 },
    layer: { manifestSha256: "a".repeat(64), populationPlanSha256: "b".repeat(64) }
  };
  const liveEvidence = {
    pass: true,
    terminal: "STEP_8G_ORA_TURABI_V8006_PROTECTED_POPULATION_PASS",
    finalProtectedActiveVersion: "v8006",
    composedRecipeCount: 2906,
    prewrite: { layerManifestSha256: "a".repeat(64), populationPlanSha256: "b".repeat(64) }
  };
  const runtimeDescriptor = {
    sourceCommit: "c".repeat(40),
    layerManifestSha256: "a".repeat(64),
    populationPlanSha256: "b".repeat(64),
    bodyShardRows: [218, 224],
    parentCompositionRouteCount: 2464,
    composedRouteCount: 2906
  };
  const result = buildV8006ParentFingerprint({ prewriteEvidence, liveEvidence, runtimeDescriptor });
  assert.match(result.sha256, /^[0-9a-f]{64}$/);
  assert.equal(result.material.composedRouteCount, 2906);
  assert.equal(result.material.liveTerminal, liveEvidence.terminal);
});

test("prewrite boundaries reject implicit public, cost, topology or cultural authority", () => {
  const evidence = { boundaries: {
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
  }};
  assert.equal(assertV8007PrewriteBoundaries(evidence), true);
  evidence.boundaries.d1BudgetExpansion = true;
  assert.throws(() => assertV8007PrewriteBoundaries(evidence), /d1BudgetExpansion/);
});
