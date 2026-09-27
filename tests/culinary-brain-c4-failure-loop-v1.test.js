import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildC4FailureMatrix, C4_TERMINAL, validateC4Contract, validateC4Summary } from "../scripts/culinary-brain-c4-failure-loop-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c4_real_v8018_failure_loop_v1.json","utf8"));

function fixture() {
  const diagnostics=[];
  const overlays=[];
  const c2Rows=[];
  for (let i=0;i<19268;i++) {
    const cohortId=i<10000 ? "A" : "B";
    const sourceRecordKey="r"+String(i).padStart(5,"0");
    diagnostics.push({cohortId,sourceSystem:"TEST",sourceRecordKey,ingredientOccurrenceCount:1,allIngredientIdentitiesResolved:i<112,quantityModel:"TEST"});
    overlays.push({identity:{cohortId,sourceRecordKey}});
    c2Rows.push({recipeKey:cohortId+"::"+sourceRecordKey,dishCategory:{disposition:"ABSTAIN"},mealRole:{disposition:"ABSTAIN"}});
  }
  const digest="a".repeat(64);
  return {
    nutritionFull:{protectedCorpusVersion:"v8018",observedRecipeCount:19268,protectedCorpusRecipeDiagnostics:diagnostics},
    mappingFull:{protectedCorpusVersion:"v8018",observedRecipeCount:19268,overlays,structuralExceptions:[
      {cohortId:"A",sourceRecordKey:"r00000"},{cohortId:"A",sourceRecordKey:"r00001"},{cohortId:"A",sourceRecordKey:"r00002"}
    ]},
    c2Full:{protectedCorpusVersion:"v8018",recipeCount:19268,digestSha256:digest,rows:c2Rows},
    c3Summary:{pass:true,terminal:contract.entryTerminal,c2DigestSha256:digest,calibration:{matrixDigestSha256:"b".repeat(64)}},
    readinessSummary:{protectedCorpusVersion:"v8018",protectedCorpus:{recipeCount:19268,automaticRecommendationReadyCount:0,reviewedDietaryAuthorityCount:0,directCurrentEngineAuthoritativeNutritionCount:0}}
  };
}

test("C4 contract is exact and grants no mutation authority",()=>{
  assert.deepEqual(validateC4Contract(contract),[]);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
});

test("C4 freezes exactly 112 identity-ready recipes and classifies upstream blockers",()=>{
  const {summary,full}=buildC4FailureMatrix({contract,...fixture()});
  assert.deepEqual(validateC4Summary(summary),[]);
  assert.equal(summary.terminal,C4_TERMINAL);
  assert.equal(summary.repairCohort.recipeCount,112);
  assert.equal(full.repairCohort.keys.length,112);
  assert.equal(summary.failureMatrix.identityNormalization.affectedRecipeCount,19156);
  assert.equal(summary.failureMatrix.hardDietaryAllergenAuthority.affectedRecipeCount,19268);
  assert.equal(summary.failureMatrix.rankingPlanner.defectCount,0);
});

test("C4 fails closed when the real identity-ready count drifts",()=>{
  const fx=fixture();
  fx.nutritionFull.protectedCorpusRecipeDiagnostics[112].allIngredientIdentitiesResolved=true;
  assert.throws(()=>buildC4FailureMatrix({contract,...fx}),/C4_IDENTITY_READY_COUNT_MISMATCH_113/);
});

test("C4 fails closed when C2 digest does not match C3 input",()=>{
  const fx=fixture();
  fx.c3Summary.c2DigestSha256="c".repeat(64);
  assert.throws(()=>buildC4FailureMatrix({contract,...fx}),/C4_C2_DIGEST_MISMATCH/);
});
