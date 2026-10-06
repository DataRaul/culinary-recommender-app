import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP8G_IDUNS_V8019_CHILD_COUNT,
  STEP8G_IDUNS_V8019_COMPOSED_COUNT,
  STEP8G_IDUNS_V8019_PARENT_COUNT,
  STEP8G_IDUNS_V8019_ROUTE_STORAGE_MODE,
  plannedV8019OperationBudget,
  assertV8019PrewriteBoundaries,
  buildV8018ParentFingerprint
} from "../scripts/corpus-scale-step8g-iduns-v8019-prewrite-core.mjs";

test("v8019 composes all 2,818 Iduns rows over v8018",()=>{
  assert.equal(STEP8G_IDUNS_V8019_PARENT_COUNT,19268);
  assert.equal(STEP8G_IDUNS_V8019_CHILD_COUNT,2818);
  assert.equal(STEP8G_IDUNS_V8019_COMPOSED_COUNT,22086);
  assert.equal(STEP8G_IDUNS_V8019_PARENT_COUNT+STEP8G_IDUNS_V8019_CHILD_COUNT,STEP8G_IDUNS_V8019_COMPOSED_COUNT);
});

test("v8019 preserves optimized <=8 request target on two shards",()=>{
  const b=plannedV8019OperationBudget({maxRowsPerBatch:10});
  assert.equal(b.pass,true);
  assert.equal(b.maxPlannedD1Subqueries,8);
  assert.equal(b.optimizedTargetMaxD1Subqueries,8);
  assert.equal(b.hardFailSafeMaxD1Subqueries,16);
  assert.equal(b.routeStorageMode,"V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA_PLUS_V8019_DELTA");
  assert.equal(b.parentRouteRowsCopied,0);
});

test("v8019 parent fingerprint requires exact live v8018",()=>{
  const prewriteEvidence={
    pass:true,
    composition:{activeCorpusVersion:"v8018",cumulativeRecipeCount:19268},
    layer:{manifestSha256:"m",populationPlanSha256:"p"}
  };
  const liveEvidence={
    pass:true,
    terminal:"STEP_8G_ATRUTEL_V8018_PROTECTED_POPULATION_PASS",
    liveProtectedState:{activeVersion:"v8018",composedRecipeCount:19268},
    ownerTerminal:{
      finalProtectedActiveVersion:"v8018",
      maxObservedD1Subqueries:8,
      routeStorageMode:"V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA",
      parentRouteRowsCopied:0
    }
  };
  const runtimeDescriptor={sourceCommit:"s",layerManifestSha256:"m",populationPlanSha256:"p",bodyShardRows:[247,234],composedRouteCount:19268};
  const r=buildV8018ParentFingerprint({prewriteEvidence,liveEvidence,runtimeDescriptor});
  assert.equal(r.material.activeCorpusVersion,"v8018");
  assert.equal(r.material.composedRecipeCount,19268);
  assert.equal(r.material.parentRouteRowsCopied,0);
  assert.equal(r.sha256.length,64);
});

test("v8019 prewrite rejects route copy or authority widening",()=>{
  const safe={
    composition:{routing:{routeStorageMode:STEP8G_IDUNS_V8019_ROUTE_STORAGE_MODE,parentRouteRowsCopied:0}},
    boundaries:{
      liveD1WritesPerformed:0,
      publicRuntimeChanged:false,
      recommendationAdmissionPerformed:false,
      thirdShardUsed:false,
      d1BudgetExpansion:false,
      billingExpansion:false,
      nutritionLaneModified:false,
      youtubeCulinaryStateModified:false,
      knowledgeCoreWritePerformed:false,
      culturalAuthenticityAuthorityImported:false
    }
  };
  assert.equal(assertV8019PrewriteBoundaries(safe),true);
  assert.throws(()=>assertV8019PrewriteBoundaries({...safe,composition:{routing:{...safe.composition.routing,parentRouteRowsCopied:1}}}),/PARENT_ROUTE_COPY_FORBIDDEN/);
  assert.throws(()=>assertV8019PrewriteBoundaries({...safe,boundaries:{...safe.boundaries,thirdShardUsed:true}}),/thirdShardUsed/);
});
