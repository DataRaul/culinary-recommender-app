import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_KENNEY_HERBERT_V8016_CHILD_COUNT,
  STEP8G_KENNEY_HERBERT_V8016_COMPOSED_COUNT,
  STEP8G_KENNEY_HERBERT_V8016_PARENT_COUNT,
  plannedV8016OperationBudget,
  assertV8016PrewriteBoundaries,
  buildV8015ParentFingerprint
} from "../scripts/corpus-scale-step8g-kenney-herbert-v8016-prewrite-core.mjs";

test("v8016 count contract composes exact Kenney-Herbert children over v8015", () => {
  assert.equal(STEP8G_KENNEY_HERBERT_V8016_PARENT_COUNT,16510);
  assert.equal(STEP8G_KENNEY_HERBERT_V8016_CHILD_COUNT,501);
  assert.equal(STEP8G_KENNEY_HERBERT_V8016_COMPOSED_COUNT,17011);
  assert.equal(STEP8G_KENNEY_HERBERT_V8016_PARENT_COUNT+STEP8G_KENNEY_HERBERT_V8016_CHILD_COUNT,STEP8G_KENNEY_HERBERT_V8016_COMPOSED_COUNT);
});

test("v8016 planned fresh writes preserve exact 16-query ceiling with no assumed headroom", () => {
  const b=plannedV8016OperationBudget({maxRowsPerBatch:10});
  assert.equal(b.pass,true);
  assert.equal(b.maxPlannedD1Subqueries,16);
  assert.equal(b.maxAllowedD1Subqueries,16);
  assert.equal(b.headroomAssumed,false);
  assert.deepEqual(b.limitingOperations.sort(),["boundedHydrationWorstCase","routeWriteFresh"].sort());
  assert.equal(b.operations.boundedHydrationWorstCase,16);
  assert.equal(b.operations.sixteenLayerHydrationCanary,4);
});

test("v8016 parent fingerprint requires exact live v8015 and frozen v8015 prewrite/descriptor", () => {
  const prewriteEvidence={pass:true,composition:{activeCorpusVersion:"v8015",cumulativeRecipeCount:16510},layer:{manifestSha256:"m",populationPlanSha256:"p"}};
  const liveEvidence={terminal:"STEP_8G_CHAN_V8015_PROTECTED_POPULATION_PASS",finalProtectedActiveVersion:"v8015",composedRecipeCount:16510};
  const runtimeDescriptor={sourceCommit:"s",layerManifestSha256:"m",populationPlanSha256:"p",bodyShardRows:[69,76],parentCompositionRouteCount:16365,composedRouteCount:16510};
  const r=buildV8015ParentFingerprint({prewriteEvidence,liveEvidence,runtimeDescriptor});
  assert.equal(r.material.activeCorpusVersion,"v8015");
  assert.equal(r.material.composedRecipeCount,16510);
  assert.equal(typeof r.sha256,"string");
  assert.equal(r.sha256.length,64);
});

test("v8016 prewrite boundary rejects authority widening", () => {
 const safe={boundaries:{liveD1WritesPerformed:0,publicRuntimeChanged:false,recommendationAdmissionPerformed:false,thirdShardUsed:false,d1BudgetExpansion:false,billingExpansion:false,nutritionLaneModified:false,youtubeCulinaryStateModified:false,knowledgeCoreWritePerformed:false,culturalAuthenticityAuthorityImported:false}};
 assert.equal(assertV8016PrewriteBoundaries(safe),true);
 assert.throws(()=>assertV8016PrewriteBoundaries({boundaries:{...safe.boundaries,thirdShardUsed:true}}),/thirdShardUsed/);
});
