import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import {
  SHADOW_ENGINE_SUMMARY_SCHEMA,
  SHADOW_ENGINE_TERMINAL,
  adaptProtectedShadowRecipe,
  validateShadowEngineSummary,
  weightedShadowRanking
} from "../scripts/protected-corpus-shadow-engine-quality-v1-core.mjs";

const config=JSON.parse(readFileSync(new URL("../config/protected_corpus_shadow_engine_quality_v1.json",import.meta.url),"utf8"));

function overlay(){
  return {
    identity:{layer:"v8001",cohortId:"unitools-world-recipes-v1_1_0",sourceSystem:"UNITOOLS",sourceRecordKey:"shadow-breakfast"},
    canonical:{
      geography:{country:{state:"EXACT_SOURCE_NORMALIZATION",value:"ES"},region:{state:"UNKNOWN",value:null}},
      culinary:{
        mealRoles:{state:"REVIEWED_MAPPING",value:["BREAKFAST"]},
        dishCategory:{state:"REVIEWED_MAPPING",value:"EGG_DISH"},
        difficulty:{state:"EXACT_SOURCE_NORMALIZATION",value:{scale:"LABEL_EASY_MEDIUM_HARD",label:"EASY"}}
      },
      time:{totalMinutes:{state:"EXACT_SOURCE_NORMALIZATION",value:25}},
      serving:{servings:{state:"EXACT_SOURCE_NORMALIZATION",value:2}}
    }
  };
}
function diag(){
  return {
    cohortId:"unitools-world-recipes-v1_1_0",
    sourceRecordKey:"shadow-breakfast",
    identityRows:[
      {raw:"eggs",candidate:"eggs",canonicalIngredientId:"eggs",state:"EXACT_ALIAS_MATCH"},
      {raw:"mystery",candidate:"mystery",canonicalIngredientId:null,state:"UNRESOLVED"}
    ]
  };
}

test("V21 quality contract freezes a substantial evidence-rich pool without authorizing admission",()=>{
  assert.equal(config.expectedNewUnrestrictedShadowCandidateCount,7714);
  assert.equal(config.expectedEvidenceRichPoolCount,539);
  assert.equal(config.firstQualityCohortSize,500);
  assert.equal(config.evidenceRichThreshold,0.6);
  assert.equal(config.authority.publicRuntimeWideningAuthorized,false);
  assert.equal(config.authority.recommendationAdmissionAuthorized,false);
});

test("shadow adapter carries known evidence but does not invent missing soft authority",()=>{
  const recipe=adaptProtectedShadowRecipe({overlay:overlay(),diag:diag(),evidenceScore:0.64});
  assert.equal(recipe.governance.recommendationState,"SHADOW_CANDIDATE_ONLY");
  assert.equal(recipe.governance.runtimeActivationAuthorized,false);
  assert.deepEqual(recipe.culinary.mealTypes,["breakfast"]);
  assert.equal(recipe.culinary.difficulty,undefined);
  assert.equal(recipe.time.totalMinutes,25);
  assert.equal(recipe.serving.servings,2);
  assert.deepEqual(recipe.dietaryTags,[]);
  assert.deepEqual(recipe.allergySafety.declaredAllergens,["egg"]);
  assert.equal(recipe.ingredients[0].canonicalIngredientId,"eggs");
  assert.match(recipe.ingredients[1].canonicalIngredientId,/^shadow_unresolved_/);
  assert.equal(recipe.economics.costTier,undefined);
});

test("real engine admits shadow candidates only in unrestricted explicit shadow mode",()=>{
  const recipe=adaptProtectedShadowRecipe({overlay:overlay(),diag:diag(),evidenceScore:0.64});
  const broad=normalizeProfile({...DEFAULT_PROFILE,dietaryMode:"unrestricted",allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[],maxMinutes:180,skill:4,budget:4,cuisinePreferences:[],priorityPacks:[]});
  const normal=rankRecipes([recipe],broad,{});
  const shadow=rankRecipes([recipe],broad,{mode:"shadow"});
  const vegetarian=rankRecipes([recipe],normalizeProfile({...broad,dietaryMode:"vegetarian"}),{mode:"shadow"});
  const egg=rankRecipes([recipe],normalizeProfile({...broad,allergens:["egg"]}),{mode:"shadow"});
  assert.equal(normal.eligible.length,0);
  assert.equal(shadow.eligible.length,1);
  assert.equal(vegetarian.eligible.length,0);
  assert.equal(egg.eligible.length,0);
  assert.match(normal.rejected[0].reasons.join(" "),/shadow candidate requires unrestricted/);
});

test("planner propagates explicit shadow mode without changing normal planner semantics",()=>{
  const recipe=adaptProtectedShadowRecipe({overlay:overlay(),diag:diag(),evidenceScore:0.64});
  const profile=normalizeProfile({...DEFAULT_PROFILE,dietaryMode:"unrestricted",allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[],maxMinutes:180,skill:4,budget:4,cuisinePreferences:[],priorityPacks:[]});
  const slots=[{id:"b1",order:1,day:"Probe",mealType:"breakfast"}];
  const normal=planSlots([recipe],profile,slots);
  const shadow=planSlots([recipe],profile,slots,{mode:"shadow"});
  assert.equal(normal.complete,false);
  assert.equal(shadow.complete,true);
  assert.equal(shadow.items[0].recipe.id,recipe.id);
});

test("offline evidence weighting demotes sparse candidates without modifying engine score",()=>{
  const a=adaptProtectedShadowRecipe({overlay:overlay(),diag:diag(),evidenceScore:0.8});
  const b=adaptProtectedShadowRecipe({overlay:{...overlay(),identity:{...overlay().identity,sourceRecordKey:"sparse"}},diag:{...diag(),sourceRecordKey:"sparse"},evidenceScore:0.04});
  const weighted=weightedShadowRanking([{recipe:b,score:0.9},{recipe:a,score:0.7}]);
  assert.equal(weighted[0].recipe.id,a.id);
  assert.equal(weighted[0].score,0.7);
  assert.equal(weighted[0].weightedShadowScore,0.56);
  assert.equal(weighted[1].weightedShadowScore,0.036);
});

test("summary validator enforces safety, determinism and the first-500 evidence floor",()=>{
  const summary={
    schemaVersion:SHADOW_ENGINE_SUMMARY_SCHEMA,
    pass:true,
    terminal:SHADOW_ENGINE_TERMINAL,
    candidateCount:7714,
    evidenceRichPoolCount:539,
    control:{nonFiniteEligibleScoreCount:0,top100AverageEvidence:0.5},
    comparison:{top100AverageEvidence:0.7},
    qualityCohort:{size:500,minimumEvidenceScore:0.6},
    safety:{eligibleOutsideShadowMode:0,vegetarianEligibleInShadowMode:0,eggAllergyEligibleInShadowMode:0},
    determinism:{controlDigestA:"a",controlDigestB:"a",comparisonDigestA:"b",comparisonDigestB:"b"},
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,
      publicRuntimeChanged:false,recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,
      candidateClassificationPromoted:false,dietaryAllergenAuthorityPromoted:false,
      knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
    }
  };
  assert.deepEqual(validateShadowEngineSummary(summary,config),[]);
});
