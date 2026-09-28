export const C4_P3_DUPLICATE_SAFE_SCHEMA="CULINARY_BRAIN_C4_BOUNDED_P3_DUPLICATE_SAFE_ADMISSION_CONTRACT_V1";
export const C4_P3_DUPLICATE_SAFE_SUMMARY_SCHEMA="CULINARY_BRAIN_C4_BOUNDED_P3_DUPLICATE_SAFE_ADMISSION_SUMMARY_V1";
export const C4_P3_DUPLICATE_SAFE_TERMINAL="CULINARY_BRAIN_C4_BOUNDED_P3_DUPLICATE_SAFE_ADMISSION_PASS__EXISTING_CANONICAL_ALIGNMENT_ONLY";
const ENTRY_TERMINAL="CULINARY_BRAIN_C4_UNITOOLS_DIFFICULTY_ADAPTER_REUSE_REVIEW_PASS__ONE_PROTECTED_HARD_METADATA_READY";
const STEP8F_TERMINAL="STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED";

export function validateC4P3DuplicateSafeContract(contract){
  const errors=[];
  if(contract?.schemaVersion!==C4_P3_DUPLICATE_SAFE_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!==ENTRY_TERMINAL) errors.push("entryTerminal");
  if(contract?.protectedRecipeKey!=="unitools-world-recipes-v1_1_0::tortilla-espanola") errors.push("protectedRecipeKey");
  if(contract?.existingPublicCanonicalRecipeId!=="unitools_tortilla_espanola") errors.push("canonicalId");
  if(contract?.expectedProtectedHardMetadataReadyCount!==1) errors.push("readyCount");
  if(contract?.expectedNetNewPublicRecipeCount!==0) errors.push("netNewCount");
  if(contract?.duplicateDisposition!=="ALIGN_TO_EXISTING_PUBLIC_CANONICAL_IDENTITY__DO_NOT_CREATE_SECOND_RUNTIME_RECIPE") errors.push("duplicateDisposition");
  for(const [key,value] of Object.entries(contract?.authority||{})) if(value!==false) errors.push("authority."+key);
  if(contract?.targetTerminal!==C4_P3_DUPLICATE_SAFE_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGate!=="C4_NEXT_REPAIR_COHORT_DESIGN_V1") errors.push("nextGate");
  return [...new Set(errors)].sort();
}

export function buildC4P3DuplicateSafeAdmission({contract,reuseReview,step8f}){
  const errors=validateC4P3DuplicateSafeContract(contract);
  if(errors.length) throw new Error("C4_P3_DUPLICATE_SAFE_CONTRACT_INVALID__"+errors.join(","));
  if(reuseReview?.pass!==true||reuseReview?.terminal!==ENTRY_TERMINAL) throw new Error("C4_P3_DUPLICATE_SAFE_REUSE_REVIEW_REQUIRED");
  if(reuseReview?.readiness?.newProtectedRuntimeHardMetadataReadyCount!==contract.expectedProtectedHardMetadataReadyCount) throw new Error("C4_P3_DUPLICATE_SAFE_READY_COUNT_MISMATCH");
  if(reuseReview?.protectedRecipeKey!==contract.protectedRecipeKey) throw new Error("C4_P3_DUPLICATE_SAFE_PROTECTED_KEY_MISMATCH");
  if(reuseReview?.readiness?.existingPublicCanonicalRecipeId!==contract.existingPublicCanonicalRecipeId) throw new Error("C4_P3_DUPLICATE_SAFE_CANONICAL_ID_MISMATCH");
  if(reuseReview?.readiness?.sameCanonicalSourceRecordAlreadyPublic!==true||reuseReview?.readiness?.netNewPublicRecipeCount!==0) throw new Error("C4_P3_DUPLICATE_SAFE_REUSE_DUPLICATE_EVIDENCE_REQUIRED");
  if(step8f?.pass!==true||step8f?.terminal!==STEP8F_TERMINAL||step8f?.candidate?.canonicalRecipeId!==contract.existingPublicCanonicalRecipeId||step8f?.publicRuntime?.recipeCountAfter!==85) throw new Error("C4_P3_DUPLICATE_SAFE_STEP8F_BASELINE_REQUIRED");

  return {
    schemaVersion:C4_P3_DUPLICATE_SAFE_SUMMARY_SCHEMA,
    date:"2026-09-28",
    pass:true,
    terminal:C4_P3_DUPLICATE_SAFE_TERMINAL,
    protectedCorpusVersion:"v8018",
    protectedReadiness:{
      hardMetadataReadyCount:1,
      recipeKeys:[contract.protectedRecipeKey]
    },
    canonicalAlignment:{
      protectedRecipeKey:contract.protectedRecipeKey,
      publicCanonicalRecipeId:contract.existingPublicCanonicalRecipeId,
      disposition:contract.duplicateDisposition,
      existingPublicRuntimeRecipeCount:85,
      netNewPublicRecipeCount:0,
      publicRuntimeRecipeCountAfter:85,
      duplicateRuntimeRecordCreated:false
    },
    p3:{
      newlyAdmittedRuntimeRecipeCount:0,
      existingCanonicalAlignmentCount:1,
      remainingPolicyCompleteBlockedCount:99,
      policyHeldCount:12,
      progressiveProtectedRecommendationStillRequiresDistinctReadyCandidates:true
    },
    recommendationAdmissionChanged:false,
    publicRuntimeChanged:false,
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedBodiesRewritten:0,
      duplicateRuntimeRecipeCreated:false,
      publicRuntimeWidened:false,
      nutritionAuthorityPromoted:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:contract.nextGate
  };
}

export function validateC4P3DuplicateSafeSummary(summary){
  const errors=[];
  if(summary?.schemaVersion!==C4_P3_DUPLICATE_SAFE_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true||summary?.terminal!==C4_P3_DUPLICATE_SAFE_TERMINAL) errors.push("terminal");
  if(summary?.protectedReadiness?.hardMetadataReadyCount!==1) errors.push("readyCount");
  if(summary?.canonicalAlignment?.existingPublicRuntimeRecipeCount!==85||summary?.canonicalAlignment?.publicRuntimeRecipeCountAfter!==85) errors.push("runtimeCount");
  if(summary?.canonicalAlignment?.netNewPublicRecipeCount!==0||summary?.canonicalAlignment?.duplicateRuntimeRecordCreated!==false) errors.push("duplicateSafety");
  if(summary?.p3?.newlyAdmittedRuntimeRecipeCount!==0||summary?.p3?.existingCanonicalAlignmentCount!==1||summary?.p3?.remainingPolicyCompleteBlockedCount!==99) errors.push("p3");
  if(summary?.recommendationAdmissionChanged!==false||summary?.publicRuntimeChanged!==false) errors.push("authority");
  if(summary?.nextGate!=="C4_NEXT_REPAIR_COHORT_DESIGN_V1") errors.push("nextGate");
  return errors;
}
