import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_BW_V8005_CHILD_COUNT,
  STEP8G_BW_V8005_COMPOSED_COUNT,
  STEP8G_BW_V8005_MAX_D1_SUBQUERIES,
  STEP8G_BW_V8005_PARENT_COUNT,
  assertV8005PrewriteBoundaries,
  buildV8004ParentFingerprint,
  plannedV8005OperationBudget
} from "../scripts/corpus-scale-step8g-ora-bosse-watanna-prewrite-core.mjs";

test("v8005 count contract composes 109 children over exact v8004 parent", () => {
  assert.equal(STEP8G_BW_V8005_PARENT_COUNT, 2355);
  assert.equal(STEP8G_BW_V8005_CHILD_COUNT, 109);
  assert.equal(STEP8G_BW_V8005_COMPOSED_COUNT, 2464);
  assert.equal(STEP8G_BW_V8005_PARENT_COUNT + STEP8G_BW_V8005_CHILD_COUNT, STEP8G_BW_V8005_COMPOSED_COUNT);
});

test("10-row route write exactly consumes but does not exceed the inherited 16-query ceiling", () => {
  const budget = plannedV8005OperationBudget({ maxRowsPerBatch: 10 });
  assert.equal(budget.pass, true);
  assert.equal(budget.maxPlannedD1Subqueries, 16);
  assert.equal(budget.operations.routeWriteFresh, 16);
  assert.deepEqual(budget.limitingOperations, ["routeWriteFresh"]);
  assert.equal(budget.headroomAssumed, false);
  assert.equal(budget.maxAllowedD1Subqueries, STEP8G_BW_V8005_MAX_D1_SUBQUERIES);
  for (const value of Object.values(budget.operations)) assert.ok(value <= 16);
});

test("increasing route batch size to 11 fails closed rather than expanding the D1 budget", () => {
  const budget = plannedV8005OperationBudget({ maxRowsPerBatch: 11 });
  assert.equal(budget.pass, false);
  assert.equal(budget.operations.routeWriteFresh, 17);
  assert.equal(budget.maxAllowedD1Subqueries, 16);
});

test("five-layer hydration canary remains far below the ceiling", () => {
  const budget = plannedV8005OperationBudget();
  assert.equal(budget.operations.fiveLayerHydrationCanary, 4);
  assert.ok(budget.operations.boundedHydrationWorstCase <= 16);
});

test("v8004 parent fingerprint requires matching live, prewrite and descriptor identity", () => {
  const prewriteEvidence = {
    pass: true,
    composition: { activeCorpusVersion: "v8004", cumulativeRecipeCount: 2355 },
    layer: { manifestSha256: "a".repeat(64), populationPlanSha256: "b".repeat(64) }
  };
  const liveEvidence = {
    pass: true,
    terminal: "STEP_8G_ORA_ABBOTT_V8004_PROTECTED_POPULATION_PASS",
    finalProtectedActiveVersion: "v8004",
    composedRecipeCount: 2355
  };
  const runtimeDescriptor = {
    sourceCommit: "c".repeat(40),
    layerManifestSha256: "a".repeat(64),
    populationPlanSha256: "b".repeat(64),
    bodyShardRows: [352, 361],
    parentCompositionRouteCount: 1642,
    composedRouteCount: 2355
  };
  const result = buildV8004ParentFingerprint({ prewriteEvidence, liveEvidence, runtimeDescriptor });
  assert.match(result.sha256, /^[0-9a-f]{64}$/);
  assert.equal(result.material.composedRouteCount, 2355);
  assert.equal(result.material.liveTerminal, liveEvidence.terminal);
});

test("prewrite boundaries reject any implicit public, cost, topology or cultural authority", () => {
  const evidence = {
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
  assert.equal(assertV8005PrewriteBoundaries(evidence), true);
  evidence.boundaries.d1BudgetExpansion = true;
  assert.throws(() => assertV8005PrewriteBoundaries(evidence), /d1BudgetExpansion/);
});
