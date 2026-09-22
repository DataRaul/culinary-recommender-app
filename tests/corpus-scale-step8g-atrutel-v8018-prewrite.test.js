import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_ATRUTEL_V8018_CHILD_COUNT,
  STEP8G_ATRUTEL_V8018_COMPOSED_COUNT,
  STEP8G_ATRUTEL_V8018_PARENT_COUNT,
  STEP8G_ATRUTEL_V8018_ROUTE_STORAGE_MODE,
  plannedV8018OperationBudget,
  assertV8018PrewriteBoundaries,
  buildV8017ParentFingerprint
} from "../scripts/corpus-scale-step8g-atrutel-v8018-prewrite-core.mjs";

test("v8018 count contract composes exact Atrutel children over v8017",()=>{
  assert.equal(STEP8G_ATRUTEL_V8018_PARENT_COUNT,18787);
  assert.equal(STEP8G_ATRUTEL_V8018_CHILD_COUNT,481);
  assert.equal(STEP8G_ATRUTEL_V8018_COMPOSED_COUNT,19268);
  assert.equal(STEP8G_ATRUTEL_V8018_PARENT_COUNT+STEP8G_ATRUTEL_V8018_CHILD_COUNT,STEP8G_ATRUTEL_V8018_COMPOSED_COUNT);
});

test("v8018 planned requests preserve optimized <=8 target and hard 16 fail-safe",()=>{
  const b=plannedV8018OperationBudget({maxRowsPerBatch:10});
  assert.equal(b.pass,true);
  assert.equal(b.maxPlannedD1Subqueries,8);
  assert.equal(b.optimizedTargetMaxD1Subqueries,8);
  assert.equal(b.hardFailSafeMaxD1Subqueries,16);
  assert.equal(b.optimizedTargetHeadroomAssumed,false);
  assert.equal(b.hardFailSafeIsNotSpendableHeadroom,true);
  assert.equal(b.routeStorageMode,STEP8G_ATRUTEL_V8018_ROUTE_STORAGE_MODE);
  assert.equal(b.parentRouteRowsCopied,0);
  assert.ok(b.limitingOperations.includes("boundedHydrationWorstCase"));
});

test("v8018 parent fingerprint requires exact optimized live v8017",()=>{
  const prewriteEvidence={
    pass:true,
    composition:{activeCorpusVersion:"v8017",cumulativeRecipeCount:18787},
    layer:{manifestSha256:"m",populationPlanSha256:"p"}
  };
  const liveEvidence={
    pass:true,
    terminal:"STEP_8G_FANNIE_FARMER_V8017_PROTECTED_POPULATION_PASS",
    liveProtectedState:{activeVersion:"v8017",composedRecipeCount:18787},
    ownerTerminal:{finalProtectedActiveVersion:"v8017",maxObservedD1Subqueries:8,routeStorageMode:"V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA",parentRouteRowsCopied:0}
  };
  const runtimeDescriptor={sourceCommit:"s",layerManifestSha256:"m",populationPlanSha256:"p",bodyShardRows:[880,896],composedRouteCount:18787};
  const r=buildV8017ParentFingerprint({prewriteEvidence,liveEvidence,runtimeDescriptor});
  assert.equal(r.material.activeCorpusVersion,"v8017");
  assert.equal(r.material.composedRecipeCount,18787);
  assert.equal(r.material.parentRouteRowsCopied,0);
  assert.equal(r.material.optimizedMaxRequestD1Subqueries,8);
  assert.equal(r.sha256.length,64);
});

test("v8018 prewrite rejects route copy or authority widening",()=>{
  const safe={
    composition:{routing:{routeStorageMode:STEP8G_ATRUTEL_V8018_ROUTE_STORAGE_MODE,parentRouteRowsCopied:0}},
    boundaries:{liveD1WritesPerformed:0,publicRuntimeChanged:false,recommendationAdmissionPerformed:false,thirdShardUsed:false,d1BudgetExpansion:false,billingExpansion:false,nutritionLaneModified:false,youtubeCulinaryStateModified:false,knowledgeCoreWritePerformed:false,culturalAuthenticityAuthorityImported:false}
  };
  assert.equal(assertV8018PrewriteBoundaries(safe),true);
  assert.throws(()=>assertV8018PrewriteBoundaries({...safe,composition:{routing:{...safe.composition.routing,parentRouteRowsCopied:1}}}),/PARENT_ROUTE_COPY_FORBIDDEN/);
  assert.throws(()=>assertV8018PrewriteBoundaries({...safe,boundaries:{...safe.boundaries,thirdShardUsed:true}}),/thirdShardUsed/);
});
