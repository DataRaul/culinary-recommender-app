import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  C1_FREEZE_SEED,
  metadataProfile,
  selectCohortSample,
  freezeC1Sample,
  summarizeC1Freeze,
  stableHash
} from "../scripts/culinary-brain-c1-freeze-core.mjs";

const candidate=(cohortId,i,{exception=false,ready=false,band="KNOWN_SOME",dish="UNKNOWN",meal="UNKNOWN"}={})=>({
  recipeId:`${cohortId.toLowerCase()}_${String(i).padStart(4,"0")}`,
  cohortId,
  layer:"vtest",
  sourceSystem:"TEST",
  sourceRecordKey:String(i),
  ingredientIdentityReadiness:ready?"ALL_IDENTITIES_RESOLVED":"IDENTITY_GAPS_PRESENT",
  metadataBand:band,
  metadataKnownCount:band==="KNOWN_NONE"?0:2,
  metadataAmbiguousCount:0,
  metadataUnknownCount:10,
  dishCategory:dish,
  mealRoles:meal,
  sourceContext:"HISTORICAL_SOURCE",
  structuralBoundary:exception?"STRUCTURAL_EXCEPTION":"STRUCTURAL_PARSEABLE",
  stratum:[ready?"ALL_IDENTITIES_RESOLVED":"IDENTITY_GAPS_PRESENT",band,dish,meal,exception?"STRUCTURAL_EXCEPTION":"STRUCTURAL_PARSEABLE"].join("|")
});

test("metadataProfile preserves explicit unknown rather than inventing metadata",()=>{
  const overlay={canonical:{culinary:{dishCategory:{state:"UNKNOWN",value:null},mealRoles:{state:"UNKNOWN",value:[]}},geography:{country:{state:"UNKNOWN"},region:{state:"UNKNOWN"}}}};
  const p=metadataProfile(overlay);
  assert.equal(p.metadataBand,"KNOWN_NONE");
  assert.equal(p.dishCategory,"UNKNOWN");
  assert.equal(p.mealRoles,"UNKNOWN");
});

test("cohort selection is deterministic, stratum-aware, and force-includes structural exceptions",()=>{
  const rows=[];
  for(let i=0;i<30;i++) rows.push(candidate("A",i,{exception:i<2,ready:i%3===0,band:i%2?"KNOWN_SOME":"KNOWN_NONE",dish:i%4===0?"SOUP":"UNKNOWN",meal:i%5===0?"MAIN":"UNKNOWN"}));
  const a=selectCohortSample(rows,12,{seed:C1_FREEZE_SEED});
  const b=selectCohortSample([...rows].reverse(),12,{seed:C1_FREEZE_SEED});
  assert.deepEqual(a.map(x=>x.recipeId),b.map(x=>x.recipeId));
  assert.equal(a.filter(x=>x.structuralBoundary==="STRUCTURAL_EXCEPTION").length,2);
  assert.ok(new Set(a.map(x=>x.stratum)).size>1);
});

test("500 freeze enforces exact quota and uniqueness",()=>{
  const rows=[];
  for(let i=0;i<300;i++) rows.push(candidate("A",i,{exception:i<3,ready:i%7===0}));
  for(let i=0;i<300;i++) rows.push(candidate("B",i,{ready:i%11===0}));
  const allocations=[
    {cohortId:"A",universeCount:300,quota:250},
    {cohortId:"B",universeCount:300,quota:250}
  ];
  const frozen=freezeC1Sample(rows,allocations);
  const summary=summarizeC1Freeze(frozen.selected,allocations,frozen.digest);
  assert.equal(summary.selectedRecipeCount,500);
  assert.equal(summary.uniqueRecipeIdCount,500);
  assert.equal(summary.structuralExceptionCount,3);
  assert.equal(summary.cohortCounts.A,250);
  assert.equal(summary.cohortCounts.B,250);
  assert.match(summary.sampleDigestSha256,/^[0-9a-f]{64}$/);
});


test("committed exact C1 freeze is immutable, quota-exact, and authority-safe",()=>{
  const evidence=JSON.parse(readFileSync("data/generated/culinary-brain-c1-exact-sample-freeze-v1.json","utf8"));
  const prep=JSON.parse(readFileSync("data/generated/culinary-quota-gap-parallel-prep-v1.json","utf8"));
  const config=JSON.parse(readFileSync("config/culinary_brain_corpus_calibration_v1.json","utf8"));
  assert.equal(evidence.terminal,"CULINARY_BRAIN_C1_EXACT_500_SAMPLE_FROZEN");
  assert.equal(evidence.recipeIds.length,500);
  assert.equal(new Set(evidence.recipeIds).size,500);
  assert.equal(evidence.summary.sampleDigestSha256,stableHash(JSON.stringify(evidence.recipeIds)));
  assert.equal(evidence.summary.sampleDigestSha256,"5d30214e9c0d4127d9c1ce62cff428a1c0621258051d9adecb8a4340ce983408");
  assert.equal(evidence.summary.structuralExceptionCount,3);
  for(const id of ["cc0_sgauthier_eggs","cc0_sgauthier_peanut_butter","cc0_sgauthier_spices_during_pregnancy"]) assert.ok(evidence.recipeIds.includes(id));
  for(const allocation of prep.c1SourceCohortQuotaPlan.allocations) assert.equal(evidence.summary.cohortCounts[allocation.cohortId],allocation.quota);
  assert.equal(config.postP1Execution.c1ExactSampleFreeze.exactProtectedRecipeIdsSelected,true);
  assert.equal(config.postP1Execution.c1ExactSampleFreeze.sampleDigestSha256,evidence.summary.sampleDigestSha256);
  assert.deepEqual(evidence.boundaries,{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesPersistedOrExported:0,
    publicRuntimeChanged:false,recommendationBehaviorChanged:false,recommendationAuthorityWidened:false,
    knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardAuthorized:false,barbecueMutation:false
  });
});
