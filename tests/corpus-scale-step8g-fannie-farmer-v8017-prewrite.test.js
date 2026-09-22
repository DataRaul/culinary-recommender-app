import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_FANNIE_FARMER_V8017_CHILD_COUNT,
  STEP8G_FANNIE_FARMER_V8017_COMPOSED_COUNT,
  STEP8G_FANNIE_FARMER_V8017_PARENT_COUNT,
  STEP8G_FANNIE_FARMER_V8017_ROUTE_STORAGE_MODE,
  plannedV8017OperationBudget,
  assertV8017PrewriteBoundaries,
  buildV8016ParentFingerprint
} from "../scripts/corpus-scale-step8g-fannie-farmer-v8017-prewrite-core.mjs";

test("v8017 count contract composes exact Fannie Farmer children over v8016", () => {
  assert.equal(STEP8G_FANNIE_FARMER_V8017_PARENT_COUNT,17011);
  assert.equal(STEP8G_FANNIE_FARMER_V8017_CHILD_COUNT,1776);
  assert.equal(STEP8G_FANNIE_FARMER_V8017_COMPOSED_COUNT,18787);
  assert.equal(STEP8G_FANNIE_FARMER_V8017_PARENT_COUNT+STEP8G_FANNIE_FARMER_V8017_CHILD_COUNT,STEP8G_FANNIE_FARMER_V8017_COMPOSED_COUNT);
});

test("v8017 planned requests preserve optimized <=8 target and hard 16 fail-safe", () => {
  const b=plannedV8017OperationBudget({maxRowsPerBatch:10});
  assert.equal(b.pass,true);
  assert.equal(b.maxPlannedD1Subqueries,8);
  assert.equal(b.optimizedTargetMaxD1Subqueries,8);
  assert.equal(b.hardFailSafeMaxD1Subqueries,16);
  assert.equal(b.optimizedTargetHeadroomAssumed,false);
  assert.equal(b.hardFailSafeIsNotSpendableHeadroom,true);
  assert.equal(b.routeStorageMode,STEP8G_FANNIE_FARMER_V8017_ROUTE_STORAGE_MODE);
  assert.equal(b.parentRouteRowsCopied,0);
  assert.ok(b.limitingOperations.includes("boundedHydrationWorstCase"));
});

test("v8017 parent fingerprint requires exact optimized live v8016", () => {
  const prewriteEvidence={
    pass:true,
    composition:{activeCorpusVersion:"v8016",cumulativeRecipeCount:17011},
    layer:{manifestSha256:"m",populationPlanSha256:"p"}
  };
  const liveEvidence={
    pass:true,
    terminal:"STEP_8G_KENNEY_HERBERT_V8016_PROTECTED_POPULATION_PASS",
    liveProtectedState:{activeVersion:"v8016",composedRecipeCount:17011},
    ownerTerminal:{finalProtectedActiveVersion:"v8016",maxObservedD1Subqueries:8},
    optimizedApiStatusProof:{plan:{routeStorageMode:"PARENT_V8015_REFERENCE_PLUS_V8016_DELTA",parentRouteRowsCopied:0}}
  };
  const runtimeDescriptor={sourceCommit:"s",layerManifestSha256:"m",populationPlanSha256:"p",bodyShardRows:[259,242],composedRouteCount:17011};
  const optimizationEvidence={schema:"CULINARY_STEP8G_V8016_D1_COST_OPTIMIZATION_V1",optimized:{routeStorageMode:"PARENT_V8015_REFERENCE_PLUS_V8016_DELTA",parentRouteRowsCopied:0,optimizedMaxRequestD1Subqueries:8}};
  const r=buildV8016ParentFingerprint({prewriteEvidence,liveEvidence,runtimeDescriptor,optimizationEvidence});
  assert.equal(r.material.activeCorpusVersion,"v8016");
  assert.equal(r.material.composedRecipeCount,17011);
  assert.equal(r.material.parentRouteRowsCopied,0);
  assert.equal(r.material.optimizedMaxRequestD1Subqueries,8);
  assert.equal(r.sha256.length,64);
});

test("v8017 prewrite rejects route copy or authority widening", () => {
  const safe={
    composition:{routing:{routeStorageMode:STEP8G_FANNIE_FARMER_V8017_ROUTE_STORAGE_MODE,parentRouteRowsCopied:0}},
    boundaries:{liveD1WritesPerformed:0,publicRuntimeChanged:false,recommendationAdmissionPerformed:false,thirdShardUsed:false,d1BudgetExpansion:false,billingExpansion:false,nutritionLaneModified:false,youtubeCulinaryStateModified:false,knowledgeCoreWritePerformed:false,culturalAuthenticityAuthorityImported:false}
  };
  assert.equal(assertV8017PrewriteBoundaries(safe),true);
  assert.throws(()=>assertV8017PrewriteBoundaries({...safe,composition:{routing:{...safe.composition.routing,parentRouteRowsCopied:1}}}),/PARENT_ROUTE_COPY_FORBIDDEN/);
  assert.throws(()=>assertV8017PrewriteBoundaries({...safe,boundaries:{...safe.boundaries,thirdShardUsed:true}}),/thirdShardUsed/);
});
