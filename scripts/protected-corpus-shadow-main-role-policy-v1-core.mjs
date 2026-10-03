import { createHash } from "node:crypto";
import { runtimeMealTypesForCanonicalRoles } from "./protected-corpus-shadow-engine-quality-v1-core.mjs";

export const MAIN_ROLE_POLICY_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_MAIN_ROLE_POLICY_V1";
export const MAIN_ROLE_POLICY_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_MAIN_ROLE_POLICY_SUMMARY_V1";
export const MAIN_ROLE_POLICY_TERMINAL="V21_SHADOW_MAIN_ROLE_POLICY_PASS__MEAL_SLOT_QUALITY_READY";

const sha=value=>createHash("sha256").update(String(value)).digest("hex");
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const countBy=values=>{
  const out={};
  for(const v of values) out[v]=(out[v]||0)+1;
  return Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
};

export function applyMainRoleShadowPolicy(recipe){
  if(recipe?.governance?.recommendationState!=="SHADOW_CANDIDATE_ONLY") throw new Error("MAIN_ROLE_POLICY_SHADOW_ONLY");
  const roles=Array.isArray(recipe?.governance?.shadowCanonicalMealRoles) ? recipe.governance.shadowCanonicalMealRoles : [];
  const mealTypes=runtimeMealTypesForCanonicalRoles(roles,{mainToLunchDinnerShadowCandidate:true});
  return {
    ...recipe,
    governance:{
      ...recipe.governance,
      shadowMealRolePolicy:"MAIN_TO_LUNCH_DINNER_SHADOW_CANDIDATE",
      shadowMealRolePolicyLiveAuthority:false
    },
    culinary:{...recipe.culinary,mealTypes}
  };
}

export function classifyPolicyDisposition(recipe){
  const roles=Array.isArray(recipe?.governance?.shadowCanonicalMealRoles) ? recipe.governance.shadowCanonicalMealRoles : [];
  if(!roles.length) return "UNKNOWN_ROLE_HOLD";
  if(roles.includes("MAIN")) return "MAIN_SHADOW_TRANSLATED";
  if(roles.some(v=>["BREAKFAST","SNACK"].includes(v))) return "DIRECT_RUNTIME_ROLE";
  return "KNOWN_NON_TRANSLATED_HOLD";
}

export function validateMainRolePolicySummary(summary,config){
  const errors=[];
  if(config?.schemaVersion!==MAIN_ROLE_POLICY_SCHEMA) errors.push("configSchema");
  if(summary?.schemaVersion!==MAIN_ROLE_POLICY_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true || summary?.terminal!==MAIN_ROLE_POLICY_TERMINAL) errors.push("terminal");
  if(summary?.qualityCohort?.size!==config.qualityCohortSize || summary?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) errors.push("qualityCohort");
  const e=config.expected;
  if(summary?.dispositions?.MAIN_SHADOW_TRANSLATED!==e.candidateTranslatedMainCount) errors.push("mainTranslated");
  if(summary?.dispositions?.DIRECT_RUNTIME_ROLE!==e.directRuntimeRoleCount) errors.push("directRole");
  if(summary?.dispositions?.KNOWN_NON_TRANSLATED_HOLD!==e.knownNonTranslatedHoldCount) errors.push("knownHold");
  if(summary?.dispositions?.UNKNOWN_ROLE_HOLD!==e.unknownRoleHoldCount) errors.push("unknownHold");
  if(summary?.uniqueMealTargetedShadowCandidateCount!==e.uniqueMealTargetedShadowCandidateCount) errors.push("targetedUnique");
  if(!same(summary?.mealTypeEligibleCounts,e.mealTypeEligibleCounts)) errors.push("mealTypeEligibleCounts");
  if(!same(summary?.normalModeEligibleCounts,e.normalModeEligibleCounts)) errors.push("normalMode");
  if(summary?.restrictedProfiles?.vegetarianEligible!==0 || summary?.restrictedProfiles?.eggAllergyEligible!==0) errors.push("restricted");
  if(summary?.plannerProbe?.lunchComplete!==true || summary?.plannerProbe?.dinnerComplete!==true || summary?.plannerProbe?.deterministic!==true) errors.push("planner");
  if(summary?.disposition?.livePolicyAdoptionAuthorized!==false || summary?.disposition?.progressiveLiveExposureAuthorized!==false) errors.push("authority");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","protectedBodiesRewritten"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}

export function cohortDigest(keys){ return sha(JSON.stringify(keys)); }
export { countBy };
