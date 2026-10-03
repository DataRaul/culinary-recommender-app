import { createHash } from "node:crypto";

export const MEAL_SLOT_QUALITY_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_MEAL_SLOT_QUALITY_V1";
export const MEAL_SLOT_QUALITY_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_MEAL_SLOT_QUALITY_SUMMARY_V1";
export const MEAL_SLOT_QUALITY_TERMINAL_READY="V21_SHADOW_MEAL_SLOT_QUALITY_EVALUATION_PASS__LIVE_QUALITY_CANDIDATE_READY";
export const MEAL_SLOT_QUALITY_TERMINAL_HELD="V21_SHADOW_MEAL_SLOT_QUALITY_EVALUATION_PASS__LIVE_QUALITY_NOT_EARNED__SIGNAL_ADAPTER_NEXT";

const sha=value=>createHash("sha256").update(String(value)).digest("hex");

export function rankingDigest(rows,scoreKey="score"){
  return sha(JSON.stringify(rows.map(row=>[row.recipe.id,Number(row[scoreKey])])));
}

export function signalCoverage(row){
  const n=row?.evidence?.scoreNormalization;
  const total=Number(n?.totalPositiveWeight);
  const available=Number(n?.availablePositiveWeight);
  if(!Number.isFinite(total)||total<=0||!Number.isFinite(available)||available<0) return 0;
  return Number((available/total).toFixed(6));
}

export function average(values){
  if(!values.length) return 0;
  return Number((values.reduce((sum,value)=>sum+Number(value||0),0)/values.length).toFixed(6));
}

export function averageEvidence(rows){
  return average(rows.map(row=>Number(row.recipe?.governance?.shadowEvidenceScore||row.evidenceScore||0)));
}

function ingredientSet(recipe){
  return new Set((recipe?.ingredients||[]).map(row=>row.canonicalIngredientId).filter(Boolean));
}

export function ingredientJaccard(a,b){
  const left=ingredientSet(a), right=ingredientSet(b);
  const union=new Set([...left,...right]);
  if(!union.size) return 0;
  let intersection=0;
  for(const id of left) if(right.has(id)) intersection+=1;
  return Number((intersection/union.size).toFixed(6));
}

export function plannerDiversity(plan){
  const recipes=(plan?.items||[]).map(row=>row.recipe);
  const pairs=[];
  for(let i=0;i<recipes.length;i++) for(let j=i+1;j<recipes.length;j++) pairs.push(ingredientJaccard(recipes[i],recipes[j]));
  return {
    selectedRecipeCount:recipes.length,
    uniqueRecipeCount:new Set(recipes.map(row=>row.id)).size,
    averagePairwiseIngredientJaccard:average(pairs),
    maximumPairwiseIngredientJaccard:pairs.length?Math.max(...pairs):0
  };
}

export function validateMealSlotQualitySummary(summary,config){
  const errors=[];
  if(config?.schemaVersion!==MEAL_SLOT_QUALITY_SCHEMA) errors.push("configSchema");
  if(summary?.schemaVersion!==MEAL_SLOT_QUALITY_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true) errors.push("pass");
  const expectedTerminal=summary?.liveQualityEarned?MEAL_SLOT_QUALITY_TERMINAL_READY:MEAL_SLOT_QUALITY_TERMINAL_HELD;
  if(summary?.terminal!==expectedTerminal) errors.push("terminal");
  if(summary?.qualityCohort?.size!==config.qualityCohortSize || summary?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) errors.push("qualityCohort");
  for(const mealType of ["breakfast","dinner","lunch","snack"]){
    const slot=summary?.mealTypes?.[mealType];
    if(!slot) { errors.push("mealType."+mealType); continue; }
    if(slot.eligibleCount!==config.expectedMealTypeEligibleCounts[mealType]) errors.push("eligible."+mealType);
    if(slot.normalModeEligibleCount!==0) errors.push("normalLeak."+mealType);
    if(slot.semanticRoleViolationCount!==config.rankingEvaluation.requireSemanticRoleViolations) errors.push("semantic."+mealType);
    if(slot.nonFiniteScoreCount!==0) errors.push("nonFinite."+mealType);
    if(slot.controlDigestA!==slot.controlDigestB || slot.weightedDigestA!==slot.weightedDigestB) errors.push("determinism."+mealType);
    if(config.rankingEvaluation.requireEvidenceWeightedTopKAverageEvidenceNotWorseThanControl && slot.weightedTopKAverageEvidence<slot.controlTopKAverageEvidence) errors.push("evidence."+mealType);
    const planner=summary?.planners?.[mealType];
    if(config.plannerEvaluation.requireComplete && planner?.complete!==true) errors.push("plannerComplete."+mealType);
    if(config.plannerEvaluation.requireUniqueRecipes && planner?.uniqueRecipeCount!==config.plannerEvaluation.slotsPerMealType) errors.push("plannerUnique."+mealType);
    if(config.plannerEvaluation.requireDeterministic && planner?.deterministic!==true) errors.push("plannerDeterminism."+mealType);
  }
  if(summary?.restrictedProfiles?.vegetarianEligibleCount!==0 || summary?.restrictedProfiles?.eggAllergyEligibleCount!==0) errors.push("restrictedLeak");
  if(summary?.lunchDinnerWeekPlanner?.complete!==true || summary?.lunchDinnerWeekPlanner?.uniqueRecipeCount!==config.plannerEvaluation.lunchDinnerWeekSlots || summary?.lunchDinnerWeekPlanner?.deterministic!==true) errors.push("weekPlanner");
  if(summary?.disposition?.liveRecommendationAdmissionAuthorized!==false || summary?.disposition?.liveMealRolePolicyAdoptionAuthorized!==false) errors.push("authority");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","protectedBodiesRewritten"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
