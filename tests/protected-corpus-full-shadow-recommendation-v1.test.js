import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  SHADOW_TERMINAL,
  buildFullShadowBaseline,
  evaluateShadowRow,
  validateShadowContract,
  validateShadowSummary
} from "../scripts/protected-corpus-full-shadow-recommendation-v1-core.mjs";

const config=JSON.parse(readFileSync(new URL("../config/protected_corpus_full_shadow_recommendation_v1.json",import.meta.url),"utf8"));

function unknown(value=null) { return {state:"UNKNOWN",value}; }
function exact(value) { return {state:"EXACT_SOURCE_NORMALIZATION",value}; }

function overlay(i,{cohortId="C",sourceRecordKey=`r-${i}`,breakfast=false,signal=true}={}) {
  return {
    identity:{layer:"v8018",cohortId,sourceSystem:"TEST",sourceRecordKey},
    sourceHints:{},
    canonical:{
      geography:{country:signal ? exact("X") : unknown(),region:unknown()},
      culinary:{
        tradition:unknown(),
        dishCategory:signal ? exact("SOUP") : unknown(),
        mealRoles:breakfast ? exact(["BREAKFAST"]) : unknown([]),
        techniqueFamilies:unknown([]),
        difficulty:signal ? exact({scale:"NUMERIC_1_5",level:2}) : unknown()
      },
      time:{prepMinutes:unknown(),cookMinutes:unknown(),totalMinutes:signal ? exact(30) : unknown()},
      serving:{servings:signal ? exact(4) : unknown()},
      dietary:{reviewedTags:unknown([])}
    }
  };
}

function c2For(o,{dish=null,meal=null}={}) {
  const key=`${o.identity.cohortId}::${o.identity.sourceRecordKey}`;
  return {
    recipeKey:key,
    dishCategory:{disposition:dish ? "REVIEW":"ABSTAIN",candidateValue:dish},
    mealRole:{disposition:meal ? "REVIEW":"ABSTAIN",candidateValue:meal}
  };
}

function diagFor(o,resolved=false) {
  return {
    cohortId:o.identity.cohortId,
    sourceRecordKey:o.identity.sourceRecordKey,
    allIngredientIdentitiesResolved:resolved
  };
}

test("V21 shadow contract separates searchable availability from recommendation authority",()=>{
  assert.deepEqual(validateShadowContract(config),[]);
  assert.equal(config.searchAvailability.expectedSearchableRecipeCount,19268);
  assert.equal(config.searchAvailability.notRecommendationValidatedRecipesRemainSearchable,true);
  assert.equal(config.hardSafetyPolicy.unrestrictedNoAllergenNoExclusionMayEnterShadowWithoutReviewedDietaryAuthority,true);
  assert.equal(config.hardSafetyPolicy.unknownOrAmbiguousSafetyEvidenceDisposition,"HOLD_FAIL_CLOSED");
  assert.equal(config.acceptance.publicRuntimeMutationAllowed,false);
  assert.equal(config.acceptance.recommendationAdmissionMutationAllowed,false);
});

test("unrestricted candidate-only soft evidence may enter shadow but restricted profiles stay fail-closed",()=>{
  const o=overlay(1,{signal:false});
  const c2=c2For(o,{dish:"SOUP",meal:"BREAKFAST"});
  const diag=diagFor(o,false);
  const broad=config.profileCases.find(x=>x.id==="UNRESTRICTED_BROAD");
  const breakfast=config.profileCases.find(x=>x.id==="UNRESTRICTED_BREAKFAST");
  const vegetarian=config.profileCases.find(x=>x.id==="VEGETARIAN_BROAD");
  const egg=config.profileCases.find(x=>x.id==="EGG_ALLERGY_BROAD");

  assert.equal(evaluateShadowRow({overlay:o,c2,diag,structuralException:false,profileCase:broad,config,validated:null}).state,"SHADOW_EVALUABLE_UNRESTRICTED");
  assert.equal(evaluateShadowRow({overlay:o,c2,diag,structuralException:false,profileCase:breakfast,config,validated:null}).state,"SHADOW_EVALUABLE_UNRESTRICTED");
  assert.equal(evaluateShadowRow({overlay:o,c2,diag,structuralException:false,profileCase:vegetarian,config,validated:null}).state,"HOLD_REVIEWED_DIETARY_AUTHORITY_REQUIRED");
  assert.equal(evaluateShadowRow({overlay:o,c2,diag,structuralException:false,profileCase:egg,config,validated:null}).state,"HOLD_REVIEWED_ALLERGEN_AUTHORITY_REQUIRED");
});

test("structural exceptions remain searchable but cannot enter shadow recommendation",()=>{
  const o=overlay(2);
  const result=evaluateShadowRow({
    overlay:o,c2:c2For(o),diag:diagFor(o,true),structuralException:true,
    profileCase:config.profileCases[0],config,validated:null
  });
  assert.equal(result.state,"HOLD_STRUCTURAL_EXCEPTION");
  assert.equal(result.shadowEvaluable,false);
});

test("already validated protected source preserves its explicit hard-safety behavior",()=>{
  const o=overlay(3,{cohortId:"unitools-world-recipes-v1_1_0",sourceRecordKey:"pao-de-queijo"});
  const validated=config.validatedProtectedSources[0];
  const broad=evaluateShadowRow({overlay:o,c2:c2For(o),diag:diagFor(o,true),structuralException:false,profileCase:config.profileCases[0],config,validated});
  const egg=evaluateShadowRow({overlay:o,c2:c2For(o),diag:diagFor(o,true),structuralException:false,profileCase:config.profileCases.find(x=>x.id==="EGG_ALLERGY_BROAD"),config,validated});
  assert.equal(broad.state,"ALREADY_RECOMMENDATION_VALIDATED");
  assert.equal(egg.state,"REJECT_VALIDATED_DECLARED_ALLERGEN");
});

test("full synthetic 19,268-row baseline is deterministic, stratified and has zero hard-safety leakage",()=>{
  const overlays=[], diagnostics=[], c2Rows=[];
  for (let i=0;i<19268;i++) {
    const isPao=i===0;
    const o=overlay(i,{
      cohortId:isPao ? "unitools-world-recipes-v1_1_0" : "COHORT_"+String(i%19).padStart(2,"0"),
      sourceRecordKey:isPao ? "pao-de-queijo" : `recipe-${i}`,
      breakfast:i%17===0,
      signal:i%5!==0
    });
    overlays.push(o);
    diagnostics.push(diagFor(o,i%11===0));
    c2Rows.push(c2For(o,{dish:i%5===0 ? "SOUP":null,meal:i%17===0 ? "BREAKFAST":null}));
  }
  const mapping={
    protectedCorpusVersion:"v8018",
    observedRecipeCount:19268,
    overlays,
    structuralExceptions:[
      {cohortId:overlays[10].identity.cohortId,sourceRecordKey:overlays[10].identity.sourceRecordKey},
      {cohortId:overlays[20].identity.cohortId,sourceRecordKey:overlays[20].identity.sourceRecordKey},
      {cohortId:overlays[30].identity.cohortId,sourceRecordKey:overlays[30].identity.sourceRecordKey}
    ]
  };
  const nutrition={protectedCorpusRecipeDiagnostics:diagnostics};
  const c2Full={protectedCorpusVersion:"v8018",rows:c2Rows};
  const runtime=config.profileCases.map(p=>({profileCaseId:p.id,runtimeRecipeCount:86,eligibleCount:1,rejectedCount:85,topRecipeIds:[],topShortfallReasons:[]}));
  const first=buildFullShadowBaseline({mapping,nutrition,c2Full,config,currentRuntimeBaselines:runtime});
  const second=buildFullShadowBaseline({mapping,nutrition,c2Full,config,currentRuntimeBaselines:runtime});
  assert.equal(first.summary.terminal,SHADOW_TERMINAL);
  assert.equal(first.summary.searchableRecipeCount,19268);
  assert.equal(first.summary.structuralExceptionCount,3);
  assert.equal(first.summary.deterministicSample.size,500);
  assert.equal(first.summary.deterministicSample.digestSha256,second.summary.deterministicSample.digestSha256);
  assert.ok(Object.keys(first.summary.deterministicSample.cohortCounts).length>=19);
  assert.equal(first.summary.profiles.VEGETARIAN_BROAD.hardSafetyViolationCount,0);
  assert.equal(first.summary.profiles.EGG_ALLERGY_BROAD.hardSafetyViolationCount,0);
  assert.ok(first.summary.profiles.UNRESTRICTED_BROAD.shadowEvaluableCount>1000);
  assert.deepEqual(validateShadowSummary(first.summary),[]);
});
