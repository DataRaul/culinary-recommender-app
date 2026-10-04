export const SPARSE_POLICY_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_SPARSE_EVIDENCE_SCORER_POLICY_REVIEW_V1";
export const SPARSE_POLICY_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_SHADOW_SPARSE_EVIDENCE_SCORER_POLICY_REVIEW_SUMMARY_V1";
export const SPARSE_POLICY_TERMINAL="V21_SHADOW_SPARSE_EVIDENCE_SCORER_POLICY_REVIEW_PASS__SEGREGATED_SECONDARY_LANE_EVALUATION_READY";

const MEALS=["breakfast","dinner","lunch","snack"];

function sameNumber(a,b){
  return Number(a)===Number(b);
}

export function evaluateSparseEvidencePolicy({enrichment,signalCoverage,mainRole,mealQuality,config}){
  if(config?.schemaVersion!==SPARSE_POLICY_SCHEMA) throw new Error("SPARSE_POLICY_CONFIG_SCHEMA");
  if(enrichment?.terminal!==config.entryTerminal) throw new Error("SPARSE_POLICY_ENTRY_TERMINAL");

  for(const item of [enrichment,signalCoverage,mainRole,mealQuality]){
    if(item?.protectedCorpusVersion!==config.protectedCorpusVersion) throw new Error("SPARSE_POLICY_VERSION_DRIFT");
    if(item?.qualityCohort?.size!==config.qualityCohortSize || item?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) throw new Error("SPARSE_POLICY_COHORT_DRIFT");
    if(item?.currentPublicRuntimeRecipeCount!==config.currentPublicRuntimeRecipeCount) throw new Error("SPARSE_POLICY_RUNTIME_COUNT_DRIFT");
  }

  if(enrichment.safeAdditionalSignalCount!==0) throw new Error("SPARSE_POLICY_UNEXPECTED_SAFE_ENRICHMENT");
  if(!sameNumber(enrichment.postAuditAverageAvailablePositiveWeightCoverage,config.expectedSparseEvidenceCoverage)) throw new Error("SPARSE_POLICY_COVERAGE_DRIFT");
  if(signalCoverage?.difficultyEvidence?.adaptedCount!==config.qualityCohortSize) throw new Error("SPARSE_POLICY_DIFFICULTY_COVERAGE");
  if(signalCoverage?.restrictedProfiles?.vegetarianEligibleCount!==0 || signalCoverage?.restrictedProfiles?.eggAllergyEligibleCount!==0) throw new Error("SPARSE_POLICY_RESTRICTED_LEAK");
  if(mealQuality?.readinessCriteria?.safetyAndModeIsolationPass!==true || mealQuality?.readinessCriteria?.plannerQualityPass!==true) throw new Error("SPARSE_POLICY_QUALITY_PREREQUISITE");

  if(mainRole?.uniqueMealTargetedShadowCandidateCount!==config.expectedUniqueMealTargetedShadowCandidateCount) throw new Error("SPARSE_POLICY_SECONDARY_COUNT");
  if(mainRole?.totalMealTargetedHoldCount!==config.expectedMealTargetedHoldCount) throw new Error("SPARSE_POLICY_HOLD_COUNT");
  if(mainRole?.restrictedProfiles?.vegetarianEligible!==0 || mainRole?.restrictedProfiles?.eggAllergyEligible!==0) throw new Error("SPARSE_POLICY_MAIN_ROLE_RESTRICTED_LEAK");

  for(const mealType of MEALS){
    if(mainRole?.mealTypeEligibleCounts?.[mealType]!==config.expectedMealTypeEligibleCounts[mealType]) throw new Error("SPARSE_POLICY_MEAL_COUNT_"+mealType);
    if(mainRole?.normalModeEligibleCounts?.[mealType]!==0) throw new Error("SPARSE_POLICY_NORMAL_MODE_LEAK_"+mealType);
    if(!sameNumber(signalCoverage?.mealTypes?.[mealType]?.adaptedTopKAverageAvailablePositiveWeightCoverage,config.expectedSparseEvidenceCoverage)) throw new Error("SPARSE_POLICY_MEAL_COVERAGE_"+mealType);
    if(signalCoverage?.planners?.[mealType]?.complete!==true || signalCoverage?.planners?.[mealType]?.deterministic!==true) throw new Error("SPARSE_POLICY_PLANNER_"+mealType);
  }

  const policy=config.candidatePolicy;
  const policyPass=
    policy?.primaryValidatedLaneRemainsUnchanged===true &&
    sameNumber(policy?.primaryLaneCoverageFloorRemains,config.primaryLaneMinimumCoverageFloor) &&
    policy?.sparseCandidatesMayDisplacePrimaryValidatedRecipes===false &&
    policy?.secondaryLaneMayRankSparseCandidatesAgainstEachOther===true &&
    policy?.secondaryLaneRequiresExplicitLimitedMetadataDisclosure===true &&
    policy?.unknownNutritionMayBeClaimed===false &&
    policy?.unknownBudgetMayBeClaimed===false &&
    policy?.unknownMealPrepMayBeClaimed===false &&
    policy?.unknownNoveltyMayBeClaimed===false &&
    policy?.missingSignalsMayBeDefaultFilled===false &&
    policy?.initialRestrictedProfileEligibilityAuthorized===false &&
    policy?.initialAllergenProfileEligibilityAuthorized===false &&
    policy?.initialIngredientExclusionProfileEligibilityAuthorized===false &&
    policy?.liveAuthority===false;
  if(!policyPass) throw new Error("SPARSE_POLICY_CONTRACT_FAIL");

  return {
    pass:true,
    primaryRuntimeRecipeCount:config.currentPublicRuntimeRecipeCount,
    secondaryLaneCandidateCount:mainRole.uniqueMealTargetedShadowCandidateCount,
    heldCandidateCount:mainRole.totalMealTargetedHoldCount,
    sparseEvidenceCoverage:Number(config.expectedSparseEvidenceCoverage),
    primaryCoverageFloor:Number(config.primaryLaneMinimumCoverageFloor),
    primaryCoverageFloorPreserved:true,
    secondaryLaneSegregationRequired:true,
    limitedMetadataDisclosureRequired:true
  };
}

export function validateSparseEvidencePolicySummary(summary,config){
  const errors=[];
  if(config?.schemaVersion!==SPARSE_POLICY_SCHEMA) errors.push("configSchema");
  if(summary?.schemaVersion!==SPARSE_POLICY_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true) errors.push("pass");
  if(summary?.terminal!==SPARSE_POLICY_TERMINAL) errors.push("terminal");
  if(summary?.qualityCohort?.size!==config.qualityCohortSize || summary?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) errors.push("qualityCohort");
  if(summary?.primaryLane?.runtimeRecipeCount!==config.currentPublicRuntimeRecipeCount) errors.push("primaryCount");
  if(summary?.primaryLane?.minimumCoverageFloor!==config.primaryLaneMinimumCoverageFloor) errors.push("primaryCoverageFloor");
  if(summary?.secondaryLane?.candidateCount!==config.expectedUniqueMealTargetedShadowCandidateCount) errors.push("secondaryCount");
  if(summary?.secondaryLane?.heldCount!==config.expectedMealTargetedHoldCount) errors.push("heldCount");
  if(summary?.secondaryLane?.mayDisplacePrimaryValidatedRecipes!==false) errors.push("primaryDisplacement");
  if(summary?.secondaryLane?.limitedMetadataDisclosureRequired!==true) errors.push("disclosure");
  if(summary?.disposition?.liveRecommendationAdmissionAuthorized!==false || summary?.disposition?.secondaryLaneImplementationAuthorized!==false) errors.push("authority");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","protectedBodiesRewritten"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
