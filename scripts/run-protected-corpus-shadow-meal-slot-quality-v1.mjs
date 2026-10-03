import { mkdir,readFile,writeFile } from "node:fs/promises";
import { dirname,resolve } from "node:path";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE,normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { allWeekSlots,planSlots } from "../src/domain/planner.js";
import { buildShadowEngineCandidates,weightedShadowRanking } from "./protected-corpus-shadow-engine-quality-v1-core.mjs";
import { applyMainRoleShadowPolicy } from "./protected-corpus-shadow-main-role-policy-v1-core.mjs";
import {
  MEAL_SLOT_QUALITY_SUMMARY_SCHEMA,
  MEAL_SLOT_QUALITY_TERMINAL_HELD,
  MEAL_SLOT_QUALITY_TERMINAL_READY,
  average,
  averageEvidence,
  plannerDiversity,
  rankingDigest,
  signalCoverage,
  validateMealSlotQualitySummary
} from "./protected-corpus-shadow-meal-slot-quality-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["quality","mapping","nutrition","c2","baselineConfig","qualityConfig","config","output","summary"]) if(!args[key]) throw new Error("MEAL_SLOT_QUALITY_ARGUMENT_REQUIRED_"+key);

const [qualityFull,mapping,nutrition,c2Full,baselineConfig,qualityConfig,config]=await Promise.all([
  readFile(resolve(args.quality),"utf8").then(JSON.parse),
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.c2),"utf8").then(JSON.parse),
  readFile(resolve(args.baselineConfig),"utf8").then(JSON.parse),
  readFile(resolve(args.qualityConfig),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse)
]);

if(qualityFull?.terminal!=="V21_SHADOW_ENGINE_QUALITY_PASS__FIRST_500_RELEVANCE_ACCEPTANCE_READY") throw new Error("MEAL_SLOT_QUALITY_ENTRY_QUALITY_TERMINAL");
const keys=qualityFull.qualityCohortRecipeKeys;
const digest=(await import("node:crypto")).createHash("sha256").update(JSON.stringify(keys)).digest("hex");
if(!Array.isArray(keys)||keys.length!==config.qualityCohortSize||digest!==config.qualityCohortDigestSha256) throw new Error("MEAL_SLOT_QUALITY_COHORT_DRIFT");

const {rows}=buildShadowEngineCandidates({mapping,nutrition,c2Full,baselineConfig,qualityConfig});
const rowMap=new Map(rows.map(row=>[row.recipeKey,row]));
const cohort=keys.map(recipeKey=>{
  const row=rowMap.get(recipeKey);
  if(!row) throw new Error("MEAL_SLOT_QUALITY_ROW_MISSING_"+recipeKey);
  return {...row,recipe:applyMainRoleShadowPolicy(row.recipe)};
});
const profile=normalizeProfile({...DEFAULT_PROFILE,...qualityConfig.shadowProfile});
const mealTypes=["breakfast","dinner","lunch","snack"];
const expectedRole={breakfast:"BREAKFAST",dinner:"MAIN",lunch:"MAIN",snack:"SNACK"};

function plannerDigest(plan){
  return JSON.stringify({complete:plan.complete,shortfalls:plan.shortfalls,items:plan.items.map(row=>[row.slot.id,row.recipe.id,row.score,row.portfolioScore])});
}
function categoryFor(row){
  const key=row.recipe.governance.shadowRecipeKey;
  const overlay=(mapping.overlays||[]).find(item=>`${item.identity.cohortId}::${item.identity.sourceRecordKey}`===key);
  const node=overlay?.canonical?.culinary?.dishCategory;
  return ["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING"].includes(node?.state) ? String(node.value) : "UNKNOWN";
}
function counts(values){
  const out={};
  for(const value of values) out[value]=(out[value]||0)+1;
  return Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
}

const mealSummaries={};
const planners={};
let rankingInvariantPass=true;
for(const mealType of mealTypes){
  const controlA=rankRecipes(cohort.map(row=>row.recipe),profile,{mode:"shadow",mealType});
  const controlB=rankRecipes(cohort.map(row=>row.recipe),profile,{mode:"shadow",mealType});
  const weightedA=weightedShadowRanking(controlA.eligible);
  const weightedB=weightedShadowRanking(controlB.eligible);
  const normal=rankRecipes(cohort.map(row=>row.recipe),profile,{mealType});
  const topK=Math.min(config.rankingEvaluation.topK,controlA.eligible.length);
  const controlTop=controlA.eligible.slice(0,topK);
  const weightedTop=weightedA.slice(0,topK);
  const semanticRoleViolationCount=controlA.eligible.filter(row=>!(row.recipe.governance.shadowCanonicalMealRoles||[]).includes(expectedRole[mealType])).length;
  const controlDigestA=rankingDigest(controlA.eligible);
  const controlDigestB=rankingDigest(controlB.eligible);
  const weightedDigestA=rankingDigest(weightedA,"weightedShadowScore");
  const weightedDigestB=rankingDigest(weightedB,"weightedShadowScore");
  const scores=controlA.eligible.map(row=>row.score);
  mealSummaries[mealType]={
    eligibleCount:controlA.eligible.length,
    rejectedCount:controlA.rejected.length,
    normalModeEligibleCount:normal.eligible.length,
    semanticRoleViolationCount,
    nonFiniteScoreCount:scores.filter(value=>!Number.isFinite(value)).length,
    uniqueControlScoreCount:new Set(scores).size,
    controlScoreSpread:scores.length?Number((Math.max(...scores)-Math.min(...scores)).toFixed(6)):0,
    controlDigestA,controlDigestB,weightedDigestA,weightedDigestB,
    controlTopKAverageEvidence:averageEvidence(controlTop),
    weightedTopKAverageEvidence:averageEvidence(weightedTop),
    controlTopKAverageAvailablePositiveWeightCoverage:average(controlTop.map(signalCoverage)),
    weightedTopKAverageAvailablePositiveWeightCoverage:average(weightedTop.map(signalCoverage)),
    weightedTopKCanonicalDishCategoryCounts:counts(weightedTop.map(categoryFor))
  };
  if(controlDigestA!==controlDigestB||weightedDigestA!==weightedDigestB||semanticRoleViolationCount!==0||normal.eligible.length!==0) rankingInvariantPass=false;

  const slots=Array.from({length:config.plannerEvaluation.slotsPerMealType},(_,i)=>({id:`${mealType}-quality-${i+1}`,order:i+1,day:`Quality ${i+1}`,mealType}));
  const planA=planSlots(cohort.map(row=>row.recipe),profile,slots,{mode:"shadow"});
  const planB=planSlots(cohort.map(row=>row.recipe),profile,slots,{mode:"shadow"});
  planners[mealType]={
    complete:planA.complete,
    deterministic:plannerDigest(planA)===plannerDigest(planB),
    ...plannerDiversity(planA)
  };
}

const vegetarianProfile=normalizeProfile({...profile,dietaryMode:"vegetarian"});
const eggProfile=normalizeProfile({...profile,allergens:["egg"]});
let vegetarianEligibleCount=0, eggAllergyEligibleCount=0;
for(const mealType of mealTypes){
  vegetarianEligibleCount+=rankRecipes(cohort.map(row=>row.recipe),vegetarianProfile,{mode:"shadow",mealType}).eligible.length;
  eggAllergyEligibleCount+=rankRecipes(cohort.map(row=>row.recipe),eggProfile,{mode:"shadow",mealType}).eligible.length;
}

const weekSlots=allWeekSlots();
if(weekSlots.length!==config.plannerEvaluation.lunchDinnerWeekSlots) throw new Error("MEAL_SLOT_QUALITY_WEEK_SLOT_COUNT_DRIFT");
const weekA=planSlots(cohort.map(row=>row.recipe),profile,weekSlots,{mode:"shadow"});
const weekB=planSlots(cohort.map(row=>row.recipe),profile,weekSlots,{mode:"shadow"});
const weekDiversity=plannerDiversity(weekA);
const lunchDinnerWeekPlanner={complete:weekA.complete,deterministic:plannerDigest(weekA)===plannerDigest(weekB),...weekDiversity};

const minCoverage=config.rankingEvaluation.minimumAverageAvailablePositiveWeightCoverageForLiveReadiness;
const maxJaccard=config.plannerEvaluation.maximumPairwiseIngredientJaccardForLiveReadiness;
const evidenceWeightingPass=mealTypes.every(mealType=>mealSummaries[mealType].weightedTopKAverageEvidence>=mealSummaries[mealType].controlTopKAverageEvidence);
const signalCoveragePass=mealTypes.every(mealType=>mealSummaries[mealType].weightedTopKAverageAvailablePositiveWeightCoverage>=minCoverage);
const plannerQualityPass=mealTypes.every(mealType=>planners[mealType].complete&&planners[mealType].deterministic&&planners[mealType].uniqueRecipeCount===config.plannerEvaluation.slotsPerMealType&&planners[mealType].maximumPairwiseIngredientJaccard<=maxJaccard)
  && lunchDinnerWeekPlanner.complete&&lunchDinnerWeekPlanner.deterministic&&lunchDinnerWeekPlanner.uniqueRecipeCount===config.plannerEvaluation.lunchDinnerWeekSlots&&lunchDinnerWeekPlanner.maximumPairwiseIngredientJaccard<=maxJaccard;
const countPass=mealTypes.every(mealType=>mealSummaries[mealType].eligibleCount===config.expectedMealTypeEligibleCounts[mealType]);
const safetyPass=rankingInvariantPass&&vegetarianEligibleCount===0&&eggAllergyEligibleCount===0&&PUBLIC_RUNTIME_RECIPES.length===86;
const liveQualityEarned=countPass&&safetyPass&&evidenceWeightingPass&&signalCoveragePass&&plannerQualityPass;

const summary={
  schemaVersion:MEAL_SLOT_QUALITY_SUMMARY_SCHEMA,
  date:"2026-10-03",
  pass:true,
  terminal:liveQualityEarned?MEAL_SLOT_QUALITY_TERMINAL_READY:MEAL_SLOT_QUALITY_TERMINAL_HELD,
  protectedCorpusVersion:"v8018",
  currentPublicRuntimeRecipeCount:PUBLIC_RUNTIME_RECIPES.length,
  qualityCohort:{size:keys.length,digestSha256:digest},
  liveQualityEarned,
  readinessCriteria:{
    eligibleCountsPass:countPass,
    safetyAndModeIsolationPass:safetyPass,
    evidenceWeightedRankingPass:evidenceWeightingPass,
    signalCoveragePass,
    plannerQualityPass,
    minimumAverageAvailablePositiveWeightCoverageRequired:minCoverage,
    maximumPairwiseIngredientJaccardAllowed:maxJaccard
  },
  mealTypes:mealSummaries,
  planners,
  lunchDinnerWeekPlanner,
  restrictedProfiles:{vegetarianEligibleCount,eggAllergyEligibleCount},
  disposition:{
    evaluationComplete:true,
    liveRecommendationAdmissionAuthorized:false,
    liveMealRolePolicyAdoptionAuthorized:false,
    signalCoverageAdapterRequired:!liveQualityEarned
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,candidateClassificationPromoted:false,
    dietaryAllergenAuthorityPromoted:false,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,
    thirdShardUsed:false,barbecueMutation:false
  },
  nextGate:liveQualityEarned?config.nextGateIfLiveQualityEarned:config.nextGateIfLiveQualityUnearned
};

const errors=validateMealSlotQualitySummary(summary,config);
if(errors.length) throw new Error("MEAL_SLOT_QUALITY_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify({...summary,mealTargetedRecipeKeys:cohort.filter(row=>row.recipe.culinary.mealTypes.length).map(row=>row.recipeKey)},null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("MEAL_SLOT_QUALITY_SUMMARY="+JSON.stringify(summary)+"\n");
