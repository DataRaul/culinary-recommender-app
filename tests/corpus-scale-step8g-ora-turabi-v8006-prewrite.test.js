import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_TURABI_V8006_CHILD_COUNT,
  STEP8G_TURABI_V8006_COMPOSED_COUNT,
  STEP8G_TURABI_V8006_MAX_D1_SUBQUERIES,
  STEP8G_TURABI_V8006_PARENT_COUNT,
  assertV8006PrewriteBoundaries,
  buildV8005ParentFingerprint,
  plannedV8006OperationBudget
} from "../scripts/corpus-scale-step8g-ora-turabi-v8006-prewrite-core.mjs";

test("v8006 count contract composes 442 Turabi children over exact v8005 parent", () => {
  assert.equal(STEP8G_TURABI_V8006_PARENT_COUNT, 2464);
  assert.equal(STEP8G_TURABI_V8006_CHILD_COUNT, 442);
  assert.equal(STEP8G_TURABI_V8006_COMPOSED_COUNT, 2906);
  assert.equal(STEP8G_TURABI_V8006_PARENT_COUNT + STEP8G_TURABI_V8006_CHILD_COUNT, STEP8G_TURABI_V8006_COMPOSED_COUNT);
});

test("10-row route write exactly consumes but does not exceed inherited 16-query ceiling", () => {
  const budget = plannedV8006OperationBudget({ maxRowsPerBatch: 10 });
  assert.equal(budget.pass, true);
  assert.equal(budget.maxPlannedD1Subqueries, 16);
  assert.equal(budget.operations.routeWriteFresh, 16);
  assert.deepEqual(budget.limitingOperations, ["routeWriteFresh"]);
  assert.equal(budget.headroomAssumed, false);
  assert.equal(budget.maxAllowedD1Subqueries, STEP8G_TURABI_V8006_MAX_D1_SUBQUERIES);
  for (const value of Object.values(budget.operations)) assert.ok(value <= 16);
});

test("increasing route batch size to 11 fails closed instead of expanding budget", () => {
  const budget = plannedV8006OperationBudget({ maxRowsPerBatch: 11 });
  assert.equal(budget.pass, false);
  assert.equal(budget.operations.routeWriteFresh, 17);
  assert.equal(budget.maxAllowedD1Subqueries, 16);
});

test("six-layer hydration canary remains below the ceiling", () => {
  const budget = plannedV8006OperationBudget();
  assert.equal(budget.operations.sixLayerHydrationCanary, 4);
  assert.ok(budget.operations.boundedHydrationWorstCase <= 16);
});

test("v8005 parent fingerprint requires matching live, prewrite and descriptor identity", () => {
  const prewriteEvidence = {
    pass: true,
    composition: { activeCorpusVersion: "v8005", cumulativeRecipeCount: 2464 },
    layer: { manifestSha256: "a".repeat(64), populationPlanSha256: "b".repeat(64) }
  };
  const liveEvidence = {
    pass: true,
    terminal: "STEP_8G_ORA_BOSSE_WATANNA_V8005_PROTECTED_POPULATION_PASS",
    finalProtectedActiveVersion: "v8005",
    composedRecipeCount: 2464,
    prewrite: { layerManifestSha256: "a".repeat(64), populationPlanSha256: "b".repeat(64) }
  };
  const runtimeDescriptor = {
    sourceCommit: "c".repeat(40),
    layerManifestSha256: "a".repeat(64),
    populationPlanSha256: "b".repeat(64),
    bodyShardRows: [61, 48],
    parentCompositionRouteCount: 2355,
    composedRouteCount: 2464
  };
  const result = buildV8005ParentFingerprint({ prewriteEvidence, liveEvidence, runtimeDescriptor });
  assert.match(result.sha256, /^[0-9a-f]{64}$/);
  assert.equal(result.material.composedRouteCount, 2464);
  assert.equal(result.material.liveTerminal, liveEvidence.terminal);
});

test("prewrite boundaries reject implicit public, cost, topology or cultural authority", () => {
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
  assert.equal(assertV8006PrewriteBoundaries(evidence), true);
  evidence.boundaries.d1BudgetExpansion = true;
  assert.throws(() => assertV8006PrewriteBoundaries(evidence), /d1BudgetExpansion/);
});
