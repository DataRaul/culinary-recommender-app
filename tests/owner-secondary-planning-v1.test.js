import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import {
  OWNER_SECONDARY_PLAN_SOURCE,
  applyOwnerSecondaryFallbacks,
  chooseOwnerSecondarySwapCandidate,
  ownerSecondaryCandidateFits,
  ownerSecondaryPlanningEligibility,
  ownerSecondaryRuntimeDifficulty,
  ownerSecondarySourceTotalMinutes
} from "../src/domain/owner-secondary-planning-v1.js";

const permissive = normalizeProfile({
  ...DEFAULT_PROFILE,
  dietaryMode:"unrestricted",
  allergens:[],
  excludedIngredientIds:[],
  unavailableIngredientIds:[],
  skill:2,
  maxMinutes:60
});

const candidate = (id, prep=10, cook=20) => ({
  protectedRecipeId:id,
  title:id,
  prepMinutes:prep,
  cookMinutes:cook,
  sourceDifficulty:"easy",
  ingredients:["1 ingredient"],
  methodSteps:[{text:"Cook it.",minutes:null}],
  directions:["Cook it."],
  sourceProvenance:{sourceCohortId:"unitools-world-recipes-v1_1_0"},
  recommendationValidationState:"LIMITED_EVIDENCE_NOT_PRIMARY_VALIDATED"
});

test("V22 owner secondary planning eligibility fails closed on hard-profile uncertainty", () => {
  assert.equal(ownerSecondaryPlanningEligibility(permissive).eligible,true);
  assert.equal(ownerSecondaryPlanningEligibility({...permissive,dietaryMode:"vegetarian"}).eligible,false);
  assert.equal(ownerSecondaryPlanningEligibility({...permissive,allergens:["egg"]}).eligible,false);
  assert.equal(ownerSecondaryPlanningEligibility({...permissive,excludedIngredientIds:["egg"]}).eligible,false);
  assert.equal(ownerSecondaryPlanningEligibility({...permissive,unavailableIngredientIds:["egg"]}).eligible,false);
});

test("V22 uses reviewed source difficulty and source-backed time, failing closed on unknown hard evidence", () => {
  assert.equal(ownerSecondaryRuntimeDifficulty(candidate("easy")),1);
  assert.equal(ownerSecondaryRuntimeDifficulty({...candidate("medium"),sourceDifficulty:"medium"}),3);
  assert.equal(ownerSecondarySourceTotalMinutes(candidate("ok")),30);
  assert.equal(ownerSecondaryCandidateFits(candidate("ok"),permissive),true);
  assert.equal(ownerSecondaryCandidateFits({...candidate("harder"),sourceDifficulty:"medium"},permissive),false);
  assert.equal(ownerSecondaryCandidateFits(candidate("slow",40,30),permissive),false);
  assert.equal(ownerSecondaryCandidateFits(candidate("unknown-time",null,20),permissive),false);
  assert.equal(ownerSecondaryCandidateFits({...candidate("unknown-difficulty"),sourceDifficulty:null},permissive),false);
});

test("V22 fills only primary shortfalls and keeps secondary items structurally separate", () => {
  const primaryItem={recipe:{id:"primary-1"},slot:{id:"mon-lunch",order:1,day:"Monday",mealType:"lunch"}};
  const primaryPlan={
    items:[primaryItem],
    shortfalls:[
      {slot:{id:"tue-lunch",order:2,day:"Tuesday",mealType:"lunch"},causes:[{reason:"primary exhausted",count:1}]},
      {slot:{id:"wed-dinner",order:3,day:"Wednesday",mealType:"dinner"},causes:[{reason:"primary exhausted",count:1}]}
    ],
    complete:false
  };
  const result=applyOwnerSecondaryFallbacks(primaryPlan,{
    lunch:[candidate("unitools:lunch-a")],
    dinner:[candidate("unitools:dinner-a")]
  },permissive);
  assert.equal(result.items.length,1);
  assert.equal(result.items[0],primaryItem);
  assert.equal(result.secondaryItems.length,2);
  assert.equal(result.shortfalls.length,0);
  assert.equal(result.complete,true);
  assert.deepEqual(result.secondaryItems.map(row=>row.planSource),[OWNER_SECONDARY_PLAN_SOURCE,OWNER_SECONDARY_PLAN_SOURCE]);
});

test("V22 never reuses a protected fallback candidate and preserves unresolved shortfalls", () => {
  const primaryPlan={
    items:[],
    shortfalls:[
      {slot:{id:"a",order:1,day:"A",mealType:"lunch"},causes:[]},
      {slot:{id:"b",order:2,day:"B",mealType:"lunch"},causes:[]}
    ],
    complete:false
  };
  const shared=candidate("unitools:shared");
  const result=applyOwnerSecondaryFallbacks(primaryPlan,{lunch:[shared]},permissive);
  assert.equal(result.secondaryItems.length,1);
  assert.equal(result.shortfalls.length,1);
  assert.equal(result.complete,false);
  assert.equal(chooseOwnerSecondarySwapCandidate([shared,candidate("unitools:next")],permissive,["unitools:shared"]).protectedRecipeId,"unitools:next");
});

test("V22 contract keeps public and aggregation authority unchanged", () => {
  const contract=JSON.parse(readFileSync(new URL("../config/v22_owner_secondary_planning_fallback_v1.json",import.meta.url),"utf8"));
  assert.equal(contract.primaryRuntimeRecipeCount,86);
  assert.equal(contract.secondaryCandidateUniverseCount,271);
  assert.equal(contract.behavior.primaryFirst,true);
  assert.equal(contract.behavior.aggregateGroceriesExcludeSecondary,true);
  assert.equal(contract.behavior.aggregateCostExcludeSecondary,true);
  assert.equal(contract.behavior.aggregateNutritionExcludeSecondary,true);
  assert.equal(contract.authority.publicPrimaryRecommendationWideningAuthorized,false);
  assert.equal(contract.authority.barbecueMutationAuthorized,false);
});
