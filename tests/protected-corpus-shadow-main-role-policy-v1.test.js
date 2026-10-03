import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  MAIN_ROLE_POLICY_SUMMARY_SCHEMA,
  MAIN_ROLE_POLICY_TERMINAL,
  applyMainRoleShadowPolicy,
  classifyPolicyDisposition,
  validateMainRolePolicySummary
} from "../scripts/protected-corpus-shadow-main-role-policy-v1-core.mjs";

const config=JSON.parse(readFileSync(new URL("../config/protected_corpus_shadow_main_role_policy_v1.json",import.meta.url),"utf8"));

const recipe=roles=>({
  id:"shadow_fixture",
  governance:{
    recommendationState:"SHADOW_CANDIDATE_ONLY",
    runtimeActivationAuthorized:false,
    shadowCanonicalMealRoles:roles,
    shadowMealRolePolicy:"DIRECT_ONLY"
  },
  culinary:{mealTypes:roles.includes("BREAKFAST")?["breakfast"]:roles.includes("SNACK")?["snack"]:[]}
});

test("MAIN becomes lunch and dinner only under explicit shadow candidate policy",()=>{
  const main=applyMainRoleShadowPolicy(recipe(["MAIN"]));
  assert.deepEqual(main.culinary.mealTypes,["dinner","lunch"]);
  assert.equal(main.governance.shadowMealRolePolicy,"MAIN_TO_LUNCH_DINNER_SHADOW_CANDIDATE");
  assert.equal(main.governance.shadowMealRolePolicyLiveAuthority,false);
  assert.equal(classifyPolicyDisposition(main),"MAIN_SHADOW_TRANSLATED");
});

test("direct breakfast/snack semantics remain direct and dessert stays held",()=>{
  assert.deepEqual(applyMainRoleShadowPolicy(recipe(["BREAKFAST"])).culinary.mealTypes,["breakfast"]);
  assert.deepEqual(applyMainRoleShadowPolicy(recipe(["SNACK"])).culinary.mealTypes,["snack"]);
  assert.deepEqual(applyMainRoleShadowPolicy(recipe(["DESSERT"])).culinary.mealTypes,[]);
  assert.equal(classifyPolicyDisposition(applyMainRoleShadowPolicy(recipe(["DESSERT"]))),"KNOWN_NON_TRANSLATED_HOLD");
});

test("summary validator keeps the candidate policy shadow-only",()=>{
  const summary={
    schemaVersion:MAIN_ROLE_POLICY_SUMMARY_SCHEMA,pass:true,terminal:MAIN_ROLE_POLICY_TERMINAL,
    qualityCohort:{size:500,digestSha256:config.qualityCohortDigestSha256},
    dispositions:{MAIN_SHADOW_TRANSLATED:207,DIRECT_RUNTIME_ROLE:64,KNOWN_NON_TRANSLATED_HOLD:149,UNKNOWN_ROLE_HOLD:80},
    uniqueMealTargetedShadowCandidateCount:271,
    mealTypeEligibleCounts:{breakfast:22,dinner:207,lunch:207,snack:42},
    normalModeEligibleCounts:{breakfast:0,dinner:0,lunch:0,snack:0},
    restrictedProfiles:{vegetarianEligible:0,eggAllergyEligible:0},
    plannerProbe:{lunchComplete:true,dinnerComplete:true,deterministic:true},
    disposition:{livePolicyAdoptionAuthorized:false,progressiveLiveExposureAuthorized:false},
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
      recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,candidateClassificationPromoted:false,
      dietaryAllergenAuthorityPromoted:false,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
    }
  };
  assert.deepEqual(validateMainRolePolicySummary(summary,config),[]);
});
