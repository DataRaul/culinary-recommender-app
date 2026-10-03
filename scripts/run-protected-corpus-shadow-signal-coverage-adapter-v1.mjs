import { createHash } from "node:crypto";
import { mkdir,readFile,writeFile } from "node:fs/promises";
import { dirname,resolve } from "node:path";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE,normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import { buildShadowEngineCandidates } from "./protected-corpus-shadow-engine-quality-v1-core.mjs";
import { applyMainRoleShadowPolicy } from "./protected-corpus-shadow-main-role-policy-v1-core.mjs";
import { average,plannerDiversity,rankingDigest,signalCoverage } from "./protected-corpus-shadow-meal-slot-quality-v1-core.mjs";
import {
  SIGNAL_COVERAGE_ADAPTER_SUMMARY_SCHEMA,
  SIGNAL_COVERAGE_ADAPTER_TERMINAL_HELD,
  SIGNAL_COVERAGE_ADAPTER_TERMINAL_READY,
  applyShadowSignalCoverageAdapter,
  validateSignalCoverageAdapterSummary
} from "./protected-corpus-shadow-signal-coverage-adapter-v1-core.mjs";

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const [key,...rest]=arg.replace(/^--/,"").split("=");
  return [key,rest.join("=")];
}));
for(const key of ["quality","mapping","nutrition","c2","baselineConfig","qualityConfig","mealQualityConfig","config","output","summary"]) if(!args[key]) throw new Error("SIGNAL_COVERAGE_ADAPTER_ARGUMENT_REQUIRED_"+key);

const [qualityFull,mapping,nutrition,c2Full,baselineConfig,qualityConfig,mealQualityConfig,config]=await Promise.all([
  readFile(resolve(args.quality),"utf8").then(JSON.parse),
  readFile(resolve(args.mapping),"utf8").then(JSON.parse),
  readFile(resolve(args.nutrition),"utf8").then(JSON.parse),
  readFile(resolve(args.c2),"utf8").then(JSON.parse),
  readFile(resolve(args.baselineConfig),"utf8").then(JSON.parse),
  readFile(resolve(args.qualityConfig),"utf8").then(JSON.parse),
  readFile(resolve(args.mealQualityConfig),"utf8").then(JSON.parse),
  readFile(resolve(args.config),"utf8").then(JSON.parse)
]);

if(mealQualityConfig?.result?.terminal!=="V21_SHADOW_MEAL_SLOT_QUALITY_EVALUATION_PASS__LIVE_QUALITY_NOT_EARNED__SIGNAL_ADAPTER_NEXT") throw new Error("SIGNAL_COVERAGE_ADAPTER_ENTRY_TERMINAL");
const keys=qualityFull.qualityCohortRecipeKeys;
const digest=createHash("sha256").update(JSON.stringify(keys)).digest("hex");
if(!Array.isArray(keys)||keys.length!==config.qualityCohortSize||digest!==config.qualityCohortDigestSha256) throw new Error("SIGNAL_COVERAGE_ADAPTER_COHORT_DRIFT");

const overlayMap=new Map((mapping.overlays||[]).map(overlay=>[`${overlay.identity.cohortId}::${overlay.identity.sourceRecordKey}`,overlay]));
const {rows}=buildShadowEngineCandidates({mapping,nutrition,c2Full,baselineConfig,qualityConfig});
const rowMap=new Map(rows.map(row=>[row.recipeKey,row]));

const baselineCohort=[];
const adaptedCohort=[];
let adaptedCount=0;
const sourceScaleCounts={};
for(const recipeKey of keys){
  const row=rowMap.get(recipeKey), overlay=overlayMap.get(recipeKey);
  if(!row||!overlay) throw new Error("SIGNAL_COVERAGE_ADAPTER_JOIN_MISSING_"+recipeKey);
  const baselineRecipe=applyMainRoleShadowPolicy(row.recipe);
  const adaptedRecipe=applyShadowSignalCoverageAdapter(baselineRecipe,overlay,config);
  baselineCohort.push({...row,recipe:baselineRecipe});
  adaptedCohort.push({...row,recipe:adaptedRecipe});
  if(adaptedRecipe.governance.shadowDifficultyAdapted){
    adaptedCount+=1;
    const scale=adaptedRecipe.governance.shadowDifficultySourceScale||"UNKNOWN";
    sourceScaleCounts[scale]=(sourceScaleCounts[scale]||0)+1;
  }
}

const profile=normalizeProfile({...DEFAULT_PROFILE,...qualityConfig.shadowProfile});
const expectedRole={breakfast:"BREAKFAST",dinner:"MAIN",lunch:"MAIN",snack:"SNACK"};
const mealTypes={};
const planners={};
let adapterInvariantPass=true;

function plannerDigest(plan){
  return JSON.stringify({
    complete:plan.complete,
    shortfalls:plan.shortfalls,
    items:plan.items.map(row=>[row.slot.id,row.recipe.id,row.score,row.portfolioScore])
  });
}

for(const mealType of config.mealTypes){
  const baseline=rankRecipes(baselineCohort.map(row=>row.recipe),profile,{mode:"shadow",mealType});
  const adaptedA=rankRecipes(adaptedCohort.map(row=>row.recipe),profile,{mode:"shadow",mealType});
  const adaptedB=rankRecipes(adaptedCohort.map(row=>row.recipe),profile,{mode:"shadow",mealType});
  const normal=rankRecipes(adaptedCohort.map(row=>row.recipe),profile,{mealType});
  const topK=Math.min(mealQualityConfig.rankingEvaluation.topK,adaptedA.eligible.length);
  const baselineTop=baseline.eligible.slice(0,topK);
  const adaptedTop=adaptedA.eligible.slice(0,topK);
  const baselineCoverage=average(baselineTop.map(signalCoverage));
  const adaptedCoverage=average(adaptedTop.map(signalCoverage));
  const semanticRoleViolationCount=adaptedA.eligible.filter(row=>!(row.recipe.governance.shadowCanonicalMealRoles||[]).includes(expectedRole[mealType])).length;
  const digestA=rankingDigest(adaptedA.eligible);
  const digestB=rankingDigest(adaptedB.eligible);
  mealTypes[mealType]={
    baselineEligibleCount:baseline.eligible.length,
    adaptedEligibleCount:adaptedA.eligible.length,
    normalModeEligibleCount:normal.eligible.length,
    semanticRoleViolationCount,
    baselineTopKAverageAvailablePositiveWeightCoverage:baselineCoverage,
    adaptedTopKAverageAvailablePositiveWeightCoverage:adaptedCoverage,
    coverageGain:Number((adaptedCoverage-baselineCoverage).toFixed(6)),
    baselineUniqueScoreCount:new Set(baseline.eligible.map(row=>row.score)).size,
    adaptedUniqueScoreCount:new Set(adaptedA.eligible.map(row=>row.score)).size,
    adaptedDigestA:digestA,
    adaptedDigestB:digestB
  };
  if(normal.eligible.length!==0 || semanticRoleViolationCount!==0 || digestA!==digestB || adaptedA.eligible.length!==baseline.eligible.length) adapterInvariantPass=false;

  const slots=Array.from({length:config.plannerSlotsPerMealType},(_,i)=>({id:`${mealType}-coverage-${i+1}`,order:i+1,day:`Coverage ${i+1}`,mealType}));
  const planA=planSlots(adaptedCohort.map(row=>row.recipe),profile,slots,{mode:"shadow"});
  const planB=planSlots(adaptedCohort.map(row=>row.recipe),profile,slots,{mode:"shadow"});
  planners[mealType]={
    complete:planA.complete,
    deterministic:plannerDigest(planA)===plannerDigest(planB),
    ...plannerDiversity(planA)
  };
}

const vegetarianProfile=normalizeProfile({...profile,dietaryMode:"vegetarian"});
const eggProfile=normalizeProfile({...profile,allergens:["egg"]});
let vegetarianEligibleCount=0, eggAllergyEligibleCount=0;
for(const mealType of config.mealTypes){
  vegetarianEligibleCount+=rankRecipes(adaptedCohort.map(row=>row.recipe),vegetarianProfile,{mode:"shadow",mealType}).eligible.length;
  eggAllergyEligibleCount+=rankRecipes(adaptedCohort.map(row=>row.recipe),eggProfile,{mode:"shadow",mealType}).eligible.length;
}

const coverageGainPass=config.mealTypes.every(mealType=>mealTypes[mealType].coverageGain>=config.minimumCoverageGainRequired);
const difficultyEvidencePass=adaptedCount/config.qualityCohortSize>=config.minimumDifficultyEvidenceShare;
const liveCoveragePass=config.mealTypes.every(mealType=>mealTypes[mealType].adaptedTopKAverageAvailablePositiveWeightCoverage>=config.minimumAverageAvailablePositiveWeightCoverageForLiveReadiness);
const plannerPass=config.mealTypes.every(mealType=>planners[mealType].complete&&planners[mealType].deterministic&&planners[mealType].uniqueRecipeCount===config.plannerSlotsPerMealType);
const safetyPass=adapterInvariantPass&&vegetarianEligibleCount===0&&eggAllergyEligibleCount===0&&PUBLIC_RUNTIME_RECIPES.length===86;
const evaluationPass=coverageGainPass&&difficultyEvidencePass&&plannerPass&&safetyPass;
if(!evaluationPass) throw new Error("SIGNAL_COVERAGE_ADAPTER_EVALUATION_FAIL");

const liveQualityEarned=liveCoveragePass;
const summary={
  schemaVersion:SIGNAL_COVERAGE_ADAPTER_SUMMARY_SCHEMA,
  date:"2026-10-03",
  pass:true,
  terminal:liveQualityEarned?SIGNAL_COVERAGE_ADAPTER_TERMINAL_READY:SIGNAL_COVERAGE_ADAPTER_TERMINAL_HELD,
  protectedCorpusVersion:"v8018",
  currentPublicRuntimeRecipeCount:PUBLIC_RUNTIME_RECIPES.length,
  qualityCohort:{size:keys.length,digestSha256:digest},
  adapterPolicy:config.adapterPolicy,
  difficultyEvidence:{
    adaptedCount,
    adaptedShare:Number((adaptedCount/config.qualityCohortSize).toFixed(6)),
    sourceScaleCounts:Object.fromEntries(Object.entries(sourceScaleCounts).sort(([a],[b])=>a.localeCompare(b)))
  },
  liveQualityEarned,
  readinessCriteria:{
    coverageGainPass,
    difficultyEvidencePass,
    safetyAndModeIsolationPass:safetyPass,
    plannerPass,
    liveCoveragePass,
    minimumCoverageGainRequired:config.minimumCoverageGainRequired,
    minimumAverageAvailablePositiveWeightCoverageForLiveReadiness:config.minimumAverageAvailablePositiveWeightCoverageForLiveReadiness
  },
  mealTypes,
  planners,
  restrictedProfiles:{vegetarianEligibleCount,eggAllergyEligibleCount},
  disposition:{
    evaluationComplete:true,
    liveRecommendationAdmissionAuthorized:false,
    liveDifficultyTranslationAuthorized:false,
    evidenceEnrichmentRequired:!liveQualityEarned
  },
  boundaries:{
    protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,candidateClassificationPromoted:false,
    dietaryAllergenAuthorityPromoted:false,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,
    thirdShardUsed:false,barbecueMutation:false
  },
  nextGate:liveQualityEarned?config.nextGateIfLiveQualityEarned:config.nextGateIfLiveQualityUnearned
};

const errors=validateSignalCoverageAdapterSummary(summary,config);
if(errors.length) throw new Error("SIGNAL_COVERAGE_ADAPTER_SUMMARY_VALIDATION_FAIL__"+errors.join(","));
for(const path of [args.output,args.summary]) await mkdir(dirname(resolve(path)),{recursive:true});
await writeFile(resolve(args.output),JSON.stringify({...summary,adaptedRecipeKeys:keys},null,2)+"\n","utf8");
await writeFile(resolve(args.summary),JSON.stringify(summary,null,2)+"\n","utf8");
process.stdout.write("SIGNAL_COVERAGE_ADAPTER_SUMMARY="+JSON.stringify(summary)+"\n");
