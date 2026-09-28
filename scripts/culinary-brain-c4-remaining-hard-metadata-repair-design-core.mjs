export const C4_HARD_METADATA_REPAIR_DESIGN_SCHEMA = "CULINARY_BRAIN_C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_V1";
export const C4_HARD_METADATA_REPAIR_DESIGN_SUMMARY_SCHEMA = "CULINARY_BRAIN_C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_SUMMARY_V1";
export const C4_HARD_METADATA_REPAIR_DESIGN_TERMINAL = "CULINARY_BRAIN_C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_PASS__UNITOOLS_ADAPTER_REUSE_REVIEW_READY";
const ENTRY_TERMINAL = "CULINARY_BRAIN_C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_PASS";
const STEP8E_TERMINAL = "STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS";
const STEP8F_TERMINAL = "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED";

export function validateC4HardMetadataRepairDesignContract(contract) {
  const errors=[];
  if (contract?.schemaVersion !== C4_HARD_METADATA_REPAIR_DESIGN_SCHEMA) errors.push("schemaVersion");
  if (contract?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (contract?.entryTerminal !== ENTRY_TERMINAL) errors.push("entryTerminal");
  if (contract?.expectedPolicyCompleteCandidateCount !== 100) errors.push("candidateCount");
  if (contract?.expectedRuntimeHardMetadataReadyCount !== 0) errors.push("runtimeReadyBaseline");
  if (contract?.expectedReadyExceptDifficultyCount !== 1) errors.push("nearReadyCount");
  if (JSON.stringify(contract?.expectedReadyExceptDifficultyRecipeKeys||[]) !== JSON.stringify(["unitools-world-recipes-v1_1_0::tortilla-espanola"])) errors.push("nearReadyKeys");
  if (contract?.existingPublicCanonicalRecipeId !== "unitools_tortilla_espanola") errors.push("publicCanonicalId");
  if (contract?.existingPublicActivationTerminal !== STEP8F_TERMINAL) errors.push("publicActivationTerminal");
  if (contract?.sourceCohortId !== "unitools-world-recipes-v1_1_0" || contract?.sourceSlug !== "tortilla-espanola") errors.push("sourceIdentity");
  if (!/^[a-f0-9]{40}$/.test(contract?.sourceCommit||"") || !/^[a-f0-9]{40}$/.test(contract?.sourceDataBlobSha||"")) errors.push("sourcePins");
  if (JSON.stringify(contract?.reviewedRuntimeDifficultyMapping||{}) !== JSON.stringify({easy:1,medium:3,hard:4})) errors.push("difficultyMapping");
  if (contract?.designDecision?.firstRepairGate !== "C4_UNITOOLS_DIFFICULTY_ADAPTER_REUSE_REVIEW_V1") errors.push("firstRepairGate");
  if (contract?.targetTerminal !== C4_HARD_METADATA_REPAIR_DESIGN_TERMINAL) errors.push("targetTerminal");
  if (contract?.nextGate !== "C4_UNITOOLS_DIFFICULTY_ADAPTER_REUSE_REVIEW_V1") errors.push("nextGate");
  for (const [key,value] of Object.entries(contract?.authority||{})) if (value !== false) errors.push("authority."+key);
  return [...new Set(errors)].sort();
}

export function buildC4HardMetadataRepairDesign({contract,reconciliation,step8e,step8f}) {
  const contractErrors=validateC4HardMetadataRepairDesignContract(contract);
  if (contractErrors.length) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_CONTRACT_INVALID__"+contractErrors.join(","));
  if (reconciliation?.pass !== true || reconciliation?.terminal !== ENTRY_TERMINAL) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_RECONCILIATION_REQUIRED");
  if (reconciliation?.policyCompleteCandidateCount !== contract.expectedPolicyCompleteCandidateCount) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_CANDIDATE_COUNT_MISMATCH");
  if (reconciliation?.runtimeHardMetadataReadyCount !== 0 || reconciliation?.readyExceptDifficultyCount !== 1) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_BASELINE_CHANGED");
  if (JSON.stringify(reconciliation?.readyExceptDifficultyRecipeKeys||[]) !== JSON.stringify(contract.expectedReadyExceptDifficultyRecipeKeys)) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_NEAR_READY_IDENTITY_CHANGED");

  if (step8e?.pass !== true || step8e?.terminalCandidate !== STEP8E_TERMINAL) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_STEP8E_PASS_REQUIRED");
  if (step8e?.source?.sourceCohortId !== contract.sourceCohortId || step8e?.source?.commit !== contract.sourceCommit || step8e?.source?.dataBlobSha !== contract.sourceDataBlobSha) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_STEP8E_SOURCE_PIN_MISMATCH");
  if (JSON.stringify(step8e?.eligibleSourceSlugs||[]) !== JSON.stringify([contract.sourceSlug])) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_STEP8E_SLUG_MISMATCH");
  if (JSON.stringify(step8e?.canonicalRecipeIds||[]) !== JSON.stringify([contract.existingPublicCanonicalRecipeId])) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_STEP8E_CANONICAL_ID_MISMATCH");

  if (step8f?.pass !== true || step8f?.terminal !== STEP8F_TERMINAL) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_STEP8F_PASS_REQUIRED");
  if (JSON.stringify(step8f?.ownerAuthorization?.scope||[]) !== JSON.stringify([contract.existingPublicCanonicalRecipeId])) throw new Error("C4_HARD_METADATA_REPAIR_DESIGN_STEP8F_SCOPE_MISMATCH");

  return {
    schemaVersion:C4_HARD_METADATA_REPAIR_DESIGN_SUMMARY_SCHEMA,
    date:"2026-09-28",
    pass:true,
    terminal:C4_HARD_METADATA_REPAIR_DESIGN_TERMINAL,
    protectedCorpusVersion:"v8018",
    baseline:{
      policyCompleteCandidateCount:100,
      runtimeHardMetadataReadyCount:0,
      readyExceptDifficultyCount:1,
      readyExceptDifficultyRecipeKeys:[...contract.expectedReadyExceptDifficultyRecipeKeys],
      remainingMultiBlockerCandidateCount:99,
      policyHeldRecipeCount:12
    },
    firstRepair:{
      protectedRecipeKey:contract.expectedReadyExceptDifficultyRecipeKeys[0],
      sourceCohortId:contract.sourceCohortId,
      sourceSlug:contract.sourceSlug,
      sourceCommit:contract.sourceCommit,
      sourceDataBlobSha:contract.sourceDataBlobSha,
      existingPublicCanonicalRecipeId:contract.existingPublicCanonicalRecipeId,
      existingPublicActivationTerminal:contract.existingPublicActivationTerminal,
      reviewedRuntimeDifficultyMapping:{...contract.reviewedRuntimeDifficultyMapping},
      disposition:"REVIEW_EXACT_SOURCE_PIN_EQUIVALENT_ADAPTER_REUSE__NO_AUTOMATIC_PROMOTION"
    },
    duplicateSafety:{
      sameSourceRecordAlreadyPublic:true,
      netNewPublicRecipeExpectedFromFirstRepair:0,
      secondPublicRecipeCreationAuthorized:false,
      requiredOutcomeIfReusePasses:"PROTECTED_READINESS_ALIGNMENT_ONLY_UNLESS_A_DISTINCT_CANONICAL_IDENTITY_IS_SEPARATELY_PROVEN"
    },
    remainingCandidates:{
      count:99,
      disposition:"HOLD_FAIL_CLOSED_PENDING_EXPLICIT_MEAL_ROLE_TIME_AND_DIFFICULTY_AUTHORITY"
    },
    authorityPromoted:false,
    recommendationAdmissionChanged:false,
    publicRuntimeChanged:false,
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedBodiesRewritten:0,
      difficultyAdapterPromoted:false,
      mealRoleInferencePerformed:false,
      timeInferencePerformed:false,
      publicRuntimeWidened:false,
      duplicatePublicRecipeCreated:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:contract.nextGate
  };
}

export function validateC4HardMetadataRepairDesignSummary(summary){
  const errors=[];
  if(summary?.schemaVersion!==C4_HARD_METADATA_REPAIR_DESIGN_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true || summary?.terminal!==C4_HARD_METADATA_REPAIR_DESIGN_TERMINAL) errors.push("terminal");
  if(summary?.baseline?.runtimeHardMetadataReadyCount!==0 || summary?.baseline?.readyExceptDifficultyCount!==1) errors.push("baseline");
  if(summary?.firstRepair?.protectedRecipeKey!=="unitools-world-recipes-v1_1_0::tortilla-espanola") errors.push("firstRepair");
  if(summary?.firstRepair?.existingPublicCanonicalRecipeId!=="unitools_tortilla_espanola") errors.push("publicCanonicalId");
  if(summary?.duplicateSafety?.sameSourceRecordAlreadyPublic!==true || summary?.duplicateSafety?.netNewPublicRecipeExpectedFromFirstRepair!==0) errors.push("duplicateSafety");
  if(summary?.remainingCandidates?.count!==99) errors.push("remainingCount");
  if(summary?.authorityPromoted!==false || summary?.recommendationAdmissionChanged!==false || summary?.publicRuntimeChanged!==false) errors.push("authority");
  if(summary?.nextGate!=="C4_UNITOOLS_DIFFICULTY_ADAPTER_REUSE_REVIEW_V1") errors.push("nextGate");
  return errors;
}
