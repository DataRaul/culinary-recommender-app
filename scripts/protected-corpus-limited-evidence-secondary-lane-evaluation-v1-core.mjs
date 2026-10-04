export const SECONDARY_LANE_EVAL_SCHEMA="CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_EVALUATION_V1";
export const SECONDARY_LANE_EVAL_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_EVALUATION_SUMMARY_V1";
export const SECONDARY_LANE_EVAL_TERMINAL="V21_LIMITED_EVIDENCE_SECONDARY_RECOMMENDATION_LANE_EVALUATION_PASS__RUNTIME_CONTRACT_NEXT";

const MEALS=["breakfast","dinner","lunch","snack"];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function evaluateSecondaryLaneEvidence({policyReview,signalCoverage,mainRole,mealQuality,enrichment,config}){
  if(config?.schemaVersion!==SECONDARY_LANE_EVAL_SCHEMA) throw new Error("SECONDARY_LANE_EVAL_CONFIG_SCHEMA");
  if(policyReview?.terminal!==config.entryTerminal) throw new Error("SECONDARY_LANE_EVAL_ENTRY_TERMINAL");

  for(const item of [policyReview,signalCoverage,mainRole,mealQuality,enrichment]){
    if(item?.protectedCorpusVersion!==config.protectedCorpusVersion) throw new Error("SECONDARY_LANE_EVAL_VERSION_DRIFT");
    if(item?.qualityCohort?.size!==config.qualityCohortSize || item?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) throw new Error("SECONDARY_LANE_EVAL_COHORT_DRIFT");
  }

  if(policyReview?.primaryLane?.runtimeRecipeCount!==config.primaryRuntimeRecipeCount) throw new Error("SECONDARY_LANE_EVAL_PRIMARY_COUNT");
  if(policyReview?.secondaryLane?.candidateCount!==config.expectedSecondaryLaneCandidateCount) throw new Error("SECONDARY_LANE_EVAL_SECONDARY_COUNT");
  if(policyReview?.secondaryLane?.heldCount!==config.expectedHeldCandidateCount) throw new Error("SECONDARY_LANE_EVAL_HELD_COUNT");
  if(mainRole?.uniqueMealTargetedShadowCandidateCount!==config.expectedSecondaryLaneCandidateCount) throw new Error("SECONDARY_LANE_EVAL_MAIN_ROLE_COUNT");
  if(mainRole?.totalMealTargetedHoldCount!==config.expectedHeldCandidateCount) throw new Error("SECONDARY_LANE_EVAL_MAIN_ROLE_HOLD");

  const mealTypes={};
  for(const mealType of MEALS){
    const signal=signalCoverage?.mealTypes?.[mealType];
    const planner=signalCoverage?.planners?.[mealType];
    const qualityPlanner=mealQuality?.planners?.[mealType];
    if(!signal||!planner||!qualityPlanner) throw new Error("SECONDARY_LANE_EVAL_MEAL_MISSING_"+mealType);
    if(mainRole?.mealTypeEligibleCounts?.[mealType]!==config.expectedMealTypeEligibleCounts[mealType]) throw new Error("SECONDARY_LANE_EVAL_ELIGIBLE_"+mealType);
    if(mainRole?.normalModeEligibleCounts?.[mealType]!==0) throw new Error("SECONDARY_LANE_EVAL_NORMAL_LEAK_"+mealType);
    if(signal.adaptedEligibleCount!==config.expectedMealTypeEligibleCounts[mealType]) throw new Error("SECONDARY_LANE_EVAL_ADAPTED_COUNT_"+mealType);
    if(signal.adaptedDigestA!==signal.adaptedDigestB) throw new Error("SECONDARY_LANE_EVAL_RANKING_NONDETERMINISTIC_"+mealType);
    if(Number(signal.adaptedTopKAverageAvailablePositiveWeightCoverage)!==Number(config.expectedSparseEvidenceCoverage)) throw new Error("SECONDARY_LANE_EVAL_COVERAGE_"+mealType);
    if(Number(signal.adaptedUniqueScoreCount)<Number(config.minimumUniqueScoreCount)) throw new Error("SECONDARY_LANE_EVAL_SCORE_COLLAPSE_"+mealType);
    if(planner.complete!==true || planner.deterministic!==true || planner.uniqueRecipeCount!==planner.selectedRecipeCount) throw new Error("SECONDARY_LANE_EVAL_PLANNER_"+mealType);
    if(Number(qualityPlanner.maximumPairwiseIngredientJaccard)>Number(config.maximumPairwiseIngredientJaccard)) throw new Error("SECONDARY_LANE_EVAL_DIVERSITY_"+mealType);
    mealTypes[mealType]={
      eligibleCount:signal.adaptedEligibleCount,
      rankingDeterministic:true,
      uniqueScoreCount:signal.adaptedUniqueScoreCount,
      averageAvailablePositiveWeightCoverage:signal.adaptedTopKAverageAvailablePositiveWeightCoverage,
      plannerComplete:planner.complete,
      plannerDeterministic:planner.deterministic,
      plannerUniqueRecipeCount:planner.uniqueRecipeCount,
      maximumPairwiseIngredientJaccard:qualityPlanner.maximumPairwiseIngredientJaccard
    };
  }

  if(signalCoverage?.restrictedProfiles?.vegetarianEligibleCount!==0 || signalCoverage?.restrictedProfiles?.eggAllergyEligibleCount!==0) throw new Error("SECONDARY_LANE_EVAL_RESTRICTED_LEAK");
  if(mainRole?.restrictedProfiles?.vegetarianEligible!==0 || mainRole?.restrictedProfiles?.eggAllergyEligible!==0) throw new Error("SECONDARY_LANE_EVAL_MAIN_ROLE_RESTRICTED_LEAK");

  const missingSignals=Object.entries(enrichment?.signalAudit||{})
    .filter(([,row])=>row?.safeAdditionalEvidenceAvailable===false)
    .map(([name])=>name)
    .sort();
  const required=[...config.requiredMissingSoftSignals].sort();
  if(!same(missingSignals,required)) throw new Error("SECONDARY_LANE_EVAL_DISCLOSURE_SIGNAL_DRIFT");

  const p=config.evaluationPolicy;
  const policyPass=
    p?.primaryLaneMayChange===false &&
    p?.secondaryCandidatesMayDisplacePrimaryRecipes===false &&
    p?.secondaryCandidatesRankOnlyAgainstSecondaryCandidates===true &&
    p?.limitedMetadataDisclosureRequired===true &&
    p?.unknownSoftSignalsRemainUnknown===true &&
    p?.normalModeEligibilityMustRemainZero===true &&
    p?.restrictedProfileEligibilityMustRemainZero===true &&
    p?.plannerMustBeCompleteDeterministicAndUnique===true &&
    p?.liveAuthority===false;
  if(!policyPass) throw new Error("SECONDARY_LANE_EVAL_POLICY_FAIL");

  return {
    pass:true,
    mealTypes,
    missingSignals,
    secondaryLaneCandidateCount:config.expectedSecondaryLaneCandidateCount,
    heldCandidateCount:config.expectedHeldCandidateCount,
    primaryRuntimeRecipeCount:config.primaryRuntimeRecipeCount
  };
}

export function validateSecondaryLaneSummary(summary,config){
  const errors=[];
  if(config?.schemaVersion!==SECONDARY_LANE_EVAL_SCHEMA) errors.push("configSchema");
  if(summary?.schemaVersion!==SECONDARY_LANE_EVAL_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true || summary?.terminal!==SECONDARY_LANE_EVAL_TERMINAL) errors.push("terminal");
  if(summary?.qualityCohort?.size!==config.qualityCohortSize || summary?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) errors.push("qualityCohort");
  if(summary?.primaryLane?.runtimeRecipeCount!==config.primaryRuntimeRecipeCount || summary?.primaryLane?.changed!==false) errors.push("primaryLane");
  if(summary?.secondaryLane?.candidateCount!==config.expectedSecondaryLaneCandidateCount || summary?.secondaryLane?.heldCount!==config.expectedHeldCandidateCount) errors.push("secondaryLaneCounts");
  if(summary?.secondaryLane?.mayDisplacePrimaryValidatedRecipes!==false || summary?.secondaryLane?.limitedMetadataDisclosureRequired!==true) errors.push("segregation");
  for(const mealType of MEALS){
    const row=summary?.mealTypes?.[mealType];
    if(!row) { errors.push("meal."+mealType); continue; }
    if(row.eligibleCount!==config.expectedMealTypeEligibleCounts[mealType]) errors.push("eligible."+mealType);
    if(row.rankingDeterministic!==true || row.uniqueScoreCount<config.minimumUniqueScoreCount) errors.push("ranking."+mealType);
    if(row.plannerComplete!==true || row.plannerDeterministic!==true) errors.push("planner."+mealType);
    if(row.maximumPairwiseIngredientJaccard>config.maximumPairwiseIngredientJaccard) errors.push("diversity."+mealType);
  }
  if(!same([...(summary?.secondaryLane?.disclosedUnknownSoftSignals||[])].sort(),[...config.requiredMissingSoftSignals].sort())) errors.push("disclosureSignals");
  if(summary?.disposition?.liveRecommendationAdmissionAuthorized!==false || summary?.disposition?.runtimeImplementationAuthorized!==false) errors.push("authority");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","protectedBodiesRewritten"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
