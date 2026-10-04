export const SECONDARY_RUNTIME_CONTRACT_SCHEMA="CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_CONTRACT_V1";
export const SECONDARY_RUNTIME_CONTRACT_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_CONTRACT_SUMMARY_V1";
export const SECONDARY_RUNTIME_CONTRACT_TERMINAL="V21_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_CONTRACT_PASS__BOUNDED_IMPLEMENTATION_NEXT";

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function validateRuntimeContract(contract,evaluation){
  const errors=[];
  if(contract?.schemaVersion!==SECONDARY_RUNTIME_CONTRACT_SCHEMA) errors.push("schemaVersion");
  if(evaluation?.terminal!==contract?.entryTerminal) errors.push("entryTerminal");
  if(evaluation?.protectedCorpusVersion!==contract?.protectedCorpusVersion) errors.push("protectedCorpusVersion");
  if(evaluation?.primaryLane?.runtimeRecipeCount!==contract?.primaryRuntimeRecipeCount) errors.push("primaryRuntimeRecipeCount");
  if(evaluation?.secondaryLane?.candidateCount!==contract?.secondaryLaneCandidateCount) errors.push("secondaryLaneCandidateCount");
  if(evaluation?.secondaryLane?.heldCount!==contract?.heldCandidateCount) errors.push("heldCandidateCount");

  const request=contract?.requestContract||{};
  if(request.surface!=="AUTHENTICATED_OWNER_ONLY") errors.push("ownerOnly");
  if(request.activationMode!=="EXPLICIT_OPT_IN"||request.defaultEnabled!==false) errors.push("explicitOptIn");
  if(request.modeValue!=="limited_evidence_secondary") errors.push("modeValue");
  if(request.dietaryModeRequired!=="unrestricted") errors.push("dietaryMode");
  if(request.allergensRequiredEmpty!==true||request.excludedIngredientIdsRequiredEmpty!==true||request.unavailableIngredientIdsRequiredEmpty!==true) errors.push("restrictedProfileGate");
  if(!Number.isInteger(request.maximumSecondaryResults)||request.maximumSecondaryResults<1||request.maximumSecondaryResults>20) errors.push("maxResults");
  if(request.automaticFallbackFromPrimary!==false) errors.push("automaticFallback");

  const response=contract?.responseContract||{};
  if(response.primaryAndSecondarySeparated!==true||response.secondaryMayDisplacePrimary!==false||response.secondaryMayBeMergedIntoPrimaryRanking!==false) errors.push("rankingSeparation");
  if(typeof response.requiredLaneLabel!=="string"||!response.requiredLaneLabel.trim()) errors.push("laneLabel");
  if(typeof response.requiredDisclosure!=="string"||!response.requiredDisclosure.trim()) errors.push("disclosure");
  const expectedUnknown=[...(evaluation?.secondaryLane?.disclosedUnknownSoftSignals||[])].sort();
  const actualUnknown=[...(response.requiredUnknownSoftSignals||[])].sort();
  if(!same(actualUnknown,expectedUnknown)) errors.push("unknownSignals");
  if(response.unknownValuesMayBeDisplayedAsKnown!==false) errors.push("unknownDisplay");
  if(response.sourceProvenanceMustRemainVisible!==true||response.recommendationValidationStateMustRemainVisible!==true) errors.push("visibility");

  const candidate=contract?.candidateContract||{};
  if(candidate.candidateUniverse!=="EXACT_FROZEN_271_MEAL_TARGETABLE_COHORT") errors.push("candidateUniverse");
  if(candidate.candidateManifestMustBeImmutableForV1!==true) errors.push("immutableManifest");
  if(candidate.mainToLunchDinnerStatus!=="PRODUCT_SLOT_HYPOTHESIS_NOT_SOURCE_FACT") errors.push("mainRoleSemantics");
  if(candidate.dessertBeverageSideUnknownRemainHeld!==true) errors.push("heldRoles");
  if(candidate.restrictedProfileEligibility!==false||candidate.allergenProfileEligibility!==false||candidate.ingredientExclusionProfileEligibility!==false) errors.push("restrictedCandidateEligibility");

  const cost=contract?.runtimeCostContract||{};
  if(cost.readOnly!==true||cost.protectedD1WritesAllowed!==0||cost.fullCorpusScansAllowed!==0) errors.push("readOnly");
  if(!Number.isInteger(cost.maximumD1SubqueriesPerRequest)||cost.maximumD1SubqueriesPerRequest<1||cost.maximumD1SubqueriesPerRequest>8) errors.push("d1Bound");
  if(cost.thirdShardAllowed!==false||cost.paidInfrastructureAllowed!==false||cost.topKHydrationOnly!==true) errors.push("costBoundary");

  const rollback=contract?.rollbackContract||{};
  if(rollback.singleFeatureFlagDisableRequired!==true||rollback.disableMustRestoreCurrentPrimaryOnlyBehavior!==true||rollback.primary86MustRemainByteForByteBehaviorallyIndependent!==true||rollback.noDataMigrationRequiredToRollback!==true) errors.push("rollback");

  const authority=contract?.authority||{};
  for(const key of ["runtimeImplementationAuthorized","ownerCanaryActivationAuthorized","publicRuntimeWideningAuthorized","recommendationAdmissionAuthorized","candidateManifestWriteAuthorized","protectedD1ReadsAuthorizedForThisContractPackage","protectedD1WritesAuthorized","knowledgeCoreWriteAuthorized","paidModelOrApiAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]){
    if(authority[key]!==false) errors.push("authority."+key);
  }
  return errors;
}

export function normalizeSecondaryRequest(input,contract){
  const request=contract?.requestContract||{};
  const profile=input?.profile||{};
  const enabled=input?.mode===request.modeValue;
  const eligible=enabled
    && profile.dietaryMode===request.dietaryModeRequired
    && Array.isArray(profile.allergens)&&profile.allergens.length===0
    && Array.isArray(profile.excludedIngredientIds)&&profile.excludedIngredientIds.length===0
    && Array.isArray(profile.unavailableIngredientIds)&&profile.unavailableIngredientIds.length===0;
  const requestedLimit=Number(input?.limit);
  const limit=Number.isInteger(requestedLimit)&&requestedLimit>0
    ? Math.min(request.maximumSecondaryResults,requestedLimit)
    : request.maximumSecondaryResults;
  return {
    enabled,
    eligible,
    limit,
    reason: eligible?null:enabled?"RESTRICTED_PROFILE_NOT_ELIGIBLE":"SECONDARY_MODE_NOT_EXPLICITLY_ENABLED"
  };
}

export function buildSecondaryLaneEnvelope({primary=[],secondary=[],requestState,contract}){
  if(!requestState?.eligible && secondary.length) throw new Error("SECONDARY_RUNTIME_RESPONSE_LEAK");
  if(secondary.length>contract.requestContract.maximumSecondaryResults) throw new Error("SECONDARY_RUNTIME_RESULT_BOUND");
  return {
    primary,
    secondaryLane:{
      enabled:Boolean(requestState?.eligible),
      label:contract.responseContract.requiredLaneLabel,
      disclosure:contract.responseContract.requiredDisclosure,
      unknownSoftSignals:[...contract.responseContract.requiredUnknownSoftSignals],
      results:requestState?.eligible?secondary:[],
      mayDisplacePrimary:false
    }
  };
}

export function validateRuntimeContractSummary(summary,contract){
  const errors=[];
  if(summary?.schemaVersion!==SECONDARY_RUNTIME_CONTRACT_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true||summary?.terminal!==SECONDARY_RUNTIME_CONTRACT_TERMINAL) errors.push("terminal");
  if(summary?.primaryRuntimeRecipeCount!==contract?.primaryRuntimeRecipeCount) errors.push("primaryCount");
  if(summary?.secondaryLaneCandidateCount!==contract?.secondaryLaneCandidateCount) errors.push("secondaryCount");
  if(summary?.heldCandidateCount!==contract?.heldCandidateCount) errors.push("heldCount");
  if(summary?.contractChecks?.ownerOnlyExplicitOptIn!==true) errors.push("ownerOnly");
  if(summary?.contractChecks?.rankingSeparation!==true) errors.push("rankingSeparation");
  if(summary?.contractChecks?.restrictedProfilesFailClosed!==true) errors.push("restrictedProfiles");
  if(summary?.contractChecks?.boundedReadOnlyCost!==true) errors.push("cost");
  if(summary?.contractChecks?.singleFlagRollback!==true) errors.push("rollback");
  if(summary?.disposition?.runtimeImplementationAuthorized!==false||summary?.disposition?.ownerCanaryActivationAuthorized!==false) errors.push("authority");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","fullCorpusScans"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
