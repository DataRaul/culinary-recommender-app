import { readFile,writeFile,mkdir } from "node:fs/promises";
import { dirname,resolve } from "node:path";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import { buildShadowEngineCandidates } from "./protected-corpus-shadow-engine-quality-v1-core.mjs";
import {
  MAIN_ROLE_POLICY_SUMMARY_SCHEMA,
  MAIN_ROLE_POLICY_TERMINAL,
  applyMainRoleShadowPolicy,
  classifyPolicyDisposition,
  cohortDigest,
  countBy,
  validateMainRolePolicySummary
} from "./protected-corpus-shadow-main-role-policy-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["quality","mapping","nutrition","c2","baselineConfig","qualityConfig","policyConfig","output","summary"]) if(!args[key]) throw new Error("MAIN_ROLE_POLICY_ARGUMENT_REQUIRED_"+key);

const [qualityFull,mapping,nutrition,c2Full,baselineConfig,qualityConfig,config]=await Promise.all([
  readFile(resolve(args.quality),"utf8").then(JSON.parse),
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.c2),"utf8").then(JSON.parse),
  readFile(resolve(args.baselineConfig),"utf8").then(JSON.parse),
  readFile(resolve(args.qualityConfig),"utf8").then(JSON.parse),
  readFile(resolve(args.policyConfig),"utf8").then(JSON.parse)
]);

if(qualityFull?.terminal!=="V21_SHADOW_ENGINE_QUALITY_PASS__FIRST_500_RELEVANCE_ACCEPTANCE_READY") throw new Error("MAIN_ROLE_POLICY_ENTRY_TERMINAL");
const keys=qualityFull.qualityCohortRecipeKeys;
if(!Array.isArray(keys)||keys.length!==config.qualityCohortSize||cohortDigest(keys)!==config.qualityCohortDigestSha256) throw new Error("MAIN_ROLE_POLICY_COHORT_DRIFT");

const {rows}=buildShadowEngineCandidates({mapping,nutrition,c2Full,baselineConfig,qualityConfig});
const rowMap=new Map(rows.map(row=>[row.recipeKey,row]));
const cohort=keys.map(key=>{
  const row=rowMap.get(key);
  if(!row) throw new Error("MAIN_ROLE_POLICY_ROW_MISSING_"+key);
  return {...row,recipe:applyMainRoleShadowPolicy(row.recipe)};
});

const dispositions=countBy(cohort.map(row=>classifyPolicyDisposition(row.recipe)));
const targeted=cohort.filter(row=>["MAIN_SHADOW_TRANSLATED","DIRECT_RUNTIME_ROLE"].includes(classifyPolicyDisposition(row.recipe)));
const profile=normalizeProfile({...DEFAULT_PROFILE,maxMinutes:180,skill:4,budget:4,cuisinePreferences:[],priorityPacks:[],dietaryMode:"unrestricted",allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[]});
const mealTypes=["breakfast","dinner","lunch","snack"];
const mealTypeEligibleCounts={};
const normalModeEligibleCounts={};
for(const mealType of mealTypes){
  mealTypeEligibleCounts[mealType]=rankRecipes(cohort.map(row=>row.recipe),profile,{mode:"shadow",mealType}).eligible.length;
  normalModeEligibleCounts[mealType]=rankRecipes(cohort.map(row=>row.recipe),profile,{mealType}).eligible.length;
}
const vegetarian=rankRecipes(cohort.map(row=>row.recipe),normalizeProfile({...profile,dietaryMode:"vegetarian"}),{mode:"shadow",mealType:"dinner"});
const egg=rankRecipes(cohort.map(row=>row.recipe),normalizeProfile({...profile,allergens:["egg"]}),{mode:"shadow",mealType:"dinner"});

const slots=(prefix,mealType,count)=>Array.from({length:count},(_,i)=>({id:`${prefix}-${i+1}`,order:i+1,day:`Policy ${i+1}`,mealType}));
const lunchSlots=slots("lunch","lunch",config.plannerProbe.lunchSlots);
const dinnerSlots=slots("dinner","dinner",config.plannerProbe.dinnerSlots);
const lunchA=planSlots(cohort.map(row=>row.recipe),profile,lunchSlots,{mode:"shadow"});
const lunchB=planSlots(cohort.map(row=>row.recipe),profile,lunchSlots,{mode:"shadow"});
const dinnerA=planSlots(cohort.map(row=>row.recipe),profile,dinnerSlots,{mode:"shadow"});
const dinnerB=planSlots(cohort.map(row=>row.recipe),profile,dinnerSlots,{mode:"shadow"});
const plannerDigest=p=>JSON.stringify({items:p.items.map(row=>[row.slot.id,row.recipe.id,row.score,row.portfolioScore]),shortfalls:p.shortfalls,complete:p.complete});

const summary={
  schemaVersion:MAIN_ROLE_POLICY_SUMMARY_SCHEMA,
  date:"2026-10-03",
  pass:true,
  terminal:MAIN_ROLE_POLICY_TERMINAL,
  protectedCorpusVersion:"v8018",
  currentPublicRuntimeRecipeCount:PUBLIC_RUNTIME_RECIPES.length,
  qualityCohort:{size:keys.length,digestSha256:cohortDigest(keys)},
  policy:{
    id:config.candidatePolicy.id,
    semanticStatus:config.candidatePolicy.semanticStatus,
    liveAuthority:false
  },
  dispositions,
  uniqueMealTargetedShadowCandidateCount:targeted.length,
  totalMealTargetedHoldCount:(dispositions.KNOWN_NON_TRANSLATED_HOLD||0)+(dispositions.UNKNOWN_ROLE_HOLD||0),
  mealTypeEligibleCounts,
  normalModeEligibleCounts,
  restrictedProfiles:{vegetarianEligible:vegetarian.eligible.length,eggAllergyEligible:egg.eligible.length},
  plannerProbe:{
    lunchComplete:lunchA.complete,
    dinnerComplete:dinnerA.complete,
    lunchSelectedCount:lunchA.items.length,
    dinnerSelectedCount:dinnerA.items.length,
    deterministic:plannerDigest(lunchA)===plannerDigest(lunchB)&&plannerDigest(dinnerA)===plannerDigest(dinnerB)
  },
  disposition:{
    shadowPolicyEvaluationPass:true,
    livePolicyAdoptionAuthorized:false,
    progressiveLiveExposureAuthorized:false,
    dessertBeverageSideTranslationAuthorized:false
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,candidateClassificationPromoted:false,
    dietaryAllergenAuthorityPromoted:false,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,
    thirdShardUsed:false,barbecueMutation:false
  },
  nextGate:config.nextGateOnPass
};

const errors=validateMainRolePolicySummary(summary,config);
if(PUBLIC_RUNTIME_RECIPES.length!==86) errors.push("publicRuntimeCount");
if(summary.totalMealTargetedHoldCount!==config.expected.totalMealTargetedHoldCount) errors.push("holdCount");
if(errors.length){
  summary.pass=false;
  summary.terminal="V21_SHADOW_MAIN_ROLE_POLICY_FAIL";
  summary.nextGate="REPAIR_V21_SHADOW_MAIN_ROLE_POLICY";
  throw new Error("MAIN_ROLE_POLICY_VALIDATION_FAIL__"+errors.join(","));
}

for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify({...summary,mealTargetedRecipeKeys:targeted.map(row=>row.recipeKey)},null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("MAIN_ROLE_POLICY_SUMMARY="+JSON.stringify(summary)+"\n");
