import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  MEAL_SLOT_QUALITY_SUMMARY_SCHEMA,
  MEAL_SLOT_QUALITY_TERMINAL_HELD,
  ingredientJaccard,
  plannerDiversity,
  signalCoverage,
  validateMealSlotQualitySummary
} from "../scripts/protected-corpus-shadow-meal-slot-quality-v1-core.mjs";

const config=JSON.parse(readFileSync(new URL("../config/protected_corpus_shadow_meal_slot_quality_v1.json",import.meta.url),"utf8"));

test("quality gate is evaluation-only and cannot widen live recommendation authority",()=>{
  assert.equal(config.authority.publicRuntimeWideningAuthorized,false);
  assert.equal(config.authority.recommendationAdmissionAuthorized,false);
  assert.equal(config.authority.liveRuntimeMealRoleTranslationAuthorized,false);
  assert.equal(config.authority.liveShadowRankingAuthorized,false);
});

test("available positive-weight coverage measures scorer evidence rather than missing signals as zero",()=>{
  const row={evidence:{scoreNormalization:{totalPositiveWeight:1.2,availablePositiveWeight:0.42}}};
  assert.equal(signalCoverage(row),0.35);
});

test("planner diversity measures canonical ingredient overlap",()=>{
  const a={id:"a",ingredients:[{canonicalIngredientId:"onion"},{canonicalIngredientId:"tomato"}]};
  const b={id:"b",ingredients:[{canonicalIngredientId:"onion"},{canonicalIngredientId:"garlic"}]};
  assert.equal(ingredientJaccard(a,b),1/3);
  const d=plannerDiversity({items:[{recipe:a},{recipe:b}]});
  assert.equal(d.uniqueRecipeCount,2);
  assert.equal(d.averagePairwiseIngredientJaccard,0.333333);
});

test("summary validator allows evaluation PASS while live quality remains explicitly unearned",()=>{
  const mealTypes={};
  const planners={};
  for(const mealType of ["breakfast","dinner","lunch","snack"]){
    mealTypes[mealType]={
      eligibleCount:config.expectedMealTypeEligibleCounts[mealType],
      normalModeEligibleCount:0,
      semanticRoleViolationCount:0,
      nonFiniteScoreCount:0,
      controlDigestA:"a",controlDigestB:"a",weightedDigestA:"b",weightedDigestB:"b",
      controlTopKAverageEvidence:0.6,weightedTopKAverageEvidence:0.7
    };
    planners[mealType]={complete:true,uniqueRecipeCount:7,deterministic:true};
  }
  const summary={
    schemaVersion:MEAL_SLOT_QUALITY_SUMMARY_SCHEMA,pass:true,terminal:MEAL_SLOT_QUALITY_TERMINAL_HELD,
    liveQualityEarned:false,
    qualityCohort:{size:500,digestSha256:config.qualityCohortDigestSha256},
    mealTypes,planners,
    restrictedProfiles:{vegetarianEligibleCount:0,eggAllergyEligibleCount:0},
    lunchDinnerWeekPlanner:{complete:true,uniqueRecipeCount:14,deterministic:true},
    disposition:{liveRecommendationAdmissionAuthorized:false,liveMealRolePolicyAdoptionAuthorized:false},
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
      recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,candidateClassificationPromoted:false,
      dietaryAllergenAuthorityPromoted:false,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
    }
  };
  assert.deepEqual(validateMealSlotQualitySummary(summary,config),[]);
});
