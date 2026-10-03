export const SIGNAL_COVERAGE_ADAPTER_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_SIGNAL_COVERAGE_ADAPTER_V1";
export const SIGNAL_COVERAGE_ADAPTER_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_SIGNAL_COVERAGE_ADAPTER_SUMMARY_V1";
export const SIGNAL_COVERAGE_ADAPTER_TERMINAL_READY="V21_SHADOW_SIGNAL_COVERAGE_ADAPTER_PASS__LIVE_QUALITY_CANDIDATE_READY";
export const SIGNAL_COVERAGE_ADAPTER_TERMINAL_HELD="V21_SHADOW_SIGNAL_COVERAGE_ADAPTER_PASS__LIVE_QUALITY_STILL_HELD__EVIDENCE_ENRICHMENT_NEXT";

const KNOWN=new Set(["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING"]);

export function shadowRuntimeDifficulty(node,policy){
  if(!KNOWN.has(node?.state)) return undefined;
  const value=node?.value;
  if(value?.scale==="NUMERIC_1_5"){
    const mapped=policy?.numeric1To5Mapping?.[String(value.level)];
    return Number.isInteger(mapped) && mapped>=1 && mapped<=4 ? mapped : undefined;
  }
  if(value?.scale==="LABEL_EASY_MEDIUM_HARD"){
    const mapped=policy?.labelMapping?.[String(value.label||"").toUpperCase()];
    return Number.isInteger(mapped) && mapped>=1 && mapped<=4 ? mapped : undefined;
  }
  return undefined;
}

export function applyShadowSignalCoverageAdapter(recipe,overlay,config){
  if(recipe?.governance?.recommendationState!=="SHADOW_CANDIDATE_ONLY") throw new Error("SIGNAL_COVERAGE_ADAPTER_SHADOW_ONLY");
  const difficultyNode=overlay?.canonical?.culinary?.difficulty;
  const difficulty=shadowRuntimeDifficulty(difficultyNode,config.adapterPolicy);
  return {
    ...recipe,
    culinary:{
      ...recipe.culinary,
      difficulty
    },
    governance:{
      ...recipe.governance,
      shadowSignalCoverageAdapter:config.adapterPolicy.id,
      shadowDifficultyPolicyLiveAuthority:false,
      shadowDifficultyAdapted:Number.isInteger(difficulty),
      shadowDifficultySourceState:difficultyNode?.state||"UNKNOWN",
      shadowDifficultySourceScale:difficultyNode?.value?.scale||null
    }
  };
}

export function validateSignalCoverageAdapterSummary(summary,config){
  const errors=[];
  if(config?.schemaVersion!==SIGNAL_COVERAGE_ADAPTER_SCHEMA) errors.push("configSchema");
  if(summary?.schemaVersion!==SIGNAL_COVERAGE_ADAPTER_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true) errors.push("pass");
  const terminal=summary?.liveQualityEarned?SIGNAL_COVERAGE_ADAPTER_TERMINAL_READY:SIGNAL_COVERAGE_ADAPTER_TERMINAL_HELD;
  if(summary?.terminal!==terminal) errors.push("terminal");
  if(summary?.qualityCohort?.size!==config.qualityCohortSize || summary?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) errors.push("qualityCohort");
  if(summary?.difficultyEvidence?.adaptedCount/config.qualityCohortSize<config.minimumDifficultyEvidenceShare) errors.push("difficultyEvidenceShare");
  for(const mealType of config.mealTypes){
    const row=summary?.mealTypes?.[mealType];
    if(!row){ errors.push("mealType."+mealType); continue; }
    if(row.normalModeEligibleCount!==0) errors.push("normalLeak."+mealType);
    if(row.semanticRoleViolationCount!==0) errors.push("semanticRole."+mealType);
    if(row.adaptedEligibleCount!==row.baselineEligibleCount) errors.push("eligibleDrift."+mealType);
    if(row.adaptedTopKAverageAvailablePositiveWeightCoverage<=row.baselineTopKAverageAvailablePositiveWeightCoverage) errors.push("coverageNoGain."+mealType);
    if(row.coverageGain<config.minimumCoverageGainRequired) errors.push("coverageGain."+mealType);
    if(row.adaptedDigestA!==row.adaptedDigestB) errors.push("determinism."+mealType);
    const planner=summary?.planners?.[mealType];
    if(planner?.complete!==true || planner?.deterministic!==true || planner?.uniqueRecipeCount!==config.plannerSlotsPerMealType) errors.push("planner."+mealType);
  }
  if(summary?.restrictedProfiles?.vegetarianEligibleCount!==0 || summary?.restrictedProfiles?.eggAllergyEligibleCount!==0) errors.push("restrictedLeak");
  if(summary?.disposition?.liveRecommendationAdmissionAuthorized!==false || summary?.disposition?.liveDifficultyTranslationAuthorized!==false) errors.push("authority");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","protectedBodiesRewritten"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
