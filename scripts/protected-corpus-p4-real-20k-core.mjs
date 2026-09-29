export const P4_SCHEMA_VERSION = "CULINARY_PROTECTED_CORPUS_P4_REAL_20K_PRODUCT_ACCEPTANCE_V1";
export const P4_TERMINAL = "PROTECTED_CORPUS_P4_MACHINE_BASELINE_PASS__OWNER_LIVE_ACCEPTANCE_REQUIRED";
export const P4_NEXT_GATE = "PROTECTED_CORPUS_P4_OWNER_LIVE_PRODUCT_ACCEPTANCE";

export function validateP4Contract(contract) {
  const errors = [];
  if (contract?.schemaVersion !== P4_SCHEMA_VERSION) errors.push("schemaVersion");
  if (contract?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (contract?.expectedProtectedRecipeCount !== 19268) errors.push("expectedProtectedRecipeCount");
  if (contract?.expectedIndexedRecipeCount !== 19268) errors.push("expectedIndexedRecipeCount");
  if (contract?.expectedFtsRecipeCount !== 19268) errors.push("expectedFtsRecipeCount");
  if (contract?.expectedStructuralPartialCount !== 3) errors.push("expectedStructuralPartialCount");
  if (contract?.expectedFrozenSampleRecipeCount !== 500) errors.push("expectedFrozenSampleRecipeCount");
  if (contract?.expectedPublicRuntimeRecipeCount !== 86) errors.push("expectedPublicRuntimeRecipeCount");
  if (contract?.expectedPublicExternalRecipeCount !== 10) errors.push("expectedPublicExternalRecipeCount");
  if (contract?.expectedP1Terminal !== "PROTECTED_CORPUS_P1_LIVE_OWNER_CANARY_PASS") errors.push("expectedP1Terminal");
  if (contract?.expectedP2Terminal !== "PROTECTED_CORPUS_P2_LIVE_ALIGNMENT_PASS") errors.push("expectedP2Terminal");
  if (contract?.expectedC4Terminal !== "CULINARY_BRAIN_C4_FAILURE_MATRIX_PASS__112_IDENTITY_READY_REPAIR_COHORT_FROZEN") errors.push("expectedC4Terminal");
  if (contract?.expectedP3Terminal !== "CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_PASS__P4_READY") errors.push("expectedP3Terminal");
  if (contract?.targetD1SubqueriesPerRequest !== 8 || contract?.hardMaxD1SubqueriesPerRequest !== 16) errors.push("d1Budget");
  if (contract?.scaleRequiredProofCount !== 170000 || contract?.scaleStressProofCount !== 250000) errors.push("scaleProof");
  if (!Array.isArray(contract?.failureClasses) || contract.failureClasses.length !== 7 || new Set(contract.failureClasses).size !== 7) errors.push("failureClasses");
  if (contract?.machineAcceptance?.reconstructExactV8018FromPinnedSources !== true) errors.push("machineAcceptance.reconstructExactV8018FromPinnedSources");
  if (contract?.machineAcceptance?.requireCommittedC4SummaryReproducible !== true) errors.push("machineAcceptance.requireCommittedC4SummaryReproducible");
  if (contract?.machineAcceptance?.reuseTerminalP1P2LiveEvidence !== true) errors.push("machineAcceptance.reuseTerminalP1P2LiveEvidence");
  if (contract?.machineAcceptance?.requireCurrentP3RuntimeRegression !== true) errors.push("machineAcceptance.requireCurrentP3RuntimeRegression");
  if (contract?.machineAcceptance?.requirePullRequestBrowserRegression !== true) errors.push("machineAcceptance.requirePullRequestBrowserRegression");
  if (contract?.machineAcceptance?.protectedD1ReadsAuthorized !== false || contract?.machineAcceptance?.protectedD1WritesAuthorized !== false) errors.push("machineAcceptance.d1Authority");
  if (contract?.liveAcceptance?.required !== true || contract?.liveAcceptance?.ownerAuthenticationRequired !== true || contract?.liveAcceptance?.mustNotWriteProtectedD1 !== true) errors.push("liveAcceptance");
  if (!Array.isArray(contract?.liveAcceptance?.requiredMetrics) || contract.liveAcceptance.requiredMetrics.length !== 10) errors.push("liveAcceptance.requiredMetrics");
  for (const [key, value] of Object.entries(contract?.authority || {})) if (value !== false) errors.push("authority." + key);
  if (contract?.targetTerminal !== P4_TERMINAL) errors.push("targetTerminal");
  if (contract?.nextGate !== P4_NEXT_GATE) errors.push("nextGate");
  return errors;
}

export function buildP4MachineBaseline({
  contract,
  p1,
  p2,
  c4,
  p3,
  publicRuntimeRecipeCount,
  publicExternalRecipeCount,
  p3CandidatePresent
}) {
  const contractErrors = validateP4Contract(contract);
  if (contractErrors.length) throw new Error("P4_CONTRACT_INVALID__" + contractErrors.join(","));

  if (p1?.terminal !== contract.expectedP1Terminal
    || p1?.activeVersion !== "v8018"
    || p1?.indexedRecipeCount !== contract.expectedIndexedRecipeCount
    || p1?.ftsRecipeCount !== contract.expectedFtsRecipeCount
    || p1?.structuralPartialCount !== contract.expectedStructuralPartialCount
    || p1?.browsePass !== true
    || p1?.searchPass !== true
    || p1?.detailShard0Pass !== true
    || p1?.detailShard1Pass !== true
    || p1?.sourceProvenancePass !== true
    || p1?.fullCorpusScans !== 0
    || Number(p1?.maxObservedD1Subqueries) > contract.targetD1SubqueriesPerRequest) {
    throw new Error("P4_P1_TERMINAL_EVIDENCE_MISMATCH");
  }

  if (p2?.terminal !== contract.expectedP2Terminal
    || p2?.pass !== true
    || p2?.activeVersion !== "v8018"
    || p2?.indexedRecipeCount !== contract.expectedIndexedRecipeCount
    || p2?.ftsRecipeCount !== contract.expectedFtsRecipeCount
    || p2?.structuralPartialCount !== contract.expectedStructuralPartialCount
    || p2?.frozenSampleRecipeCount !== contract.expectedFrozenSampleRecipeCount
    || p2?.matchedFrozenRecipeCount !== contract.expectedFrozenSampleRecipeCount
    || p2?.sourceProvenanceCount !== contract.expectedFrozenSampleRecipeCount
    || p2?.rowsWritten !== 0
    || p2?.fullCorpusScans !== 0
    || Number(p2?.maxObservedD1Subqueries) > contract.targetD1SubqueriesPerRequest) {
    throw new Error("P4_P2_TERMINAL_EVIDENCE_MISMATCH");
  }

  if (c4?.terminal !== contract.expectedC4Terminal
    || c4?.pass !== true
    || c4?.protectedCorpusVersion !== "v8018"
    || c4?.recipeCount !== contract.expectedProtectedRecipeCount
    || c4?.repairCohort?.recipeCount !== 112
    || c4?.failureMatrix?.identityNormalization?.affectedRecipeCount !== 19156
    || c4?.failureMatrix?.hardDietaryAllergenAuthority?.reviewedDietaryAuthorityCount !== 0
    || c4?.failureMatrix?.abstention?.state !== "PASS_FAIL_CLOSED"
    || c4?.structuralExceptionCount !== contract.expectedStructuralPartialCount) {
    throw new Error("P4_C4_REAL_V8018_BASELINE_MISMATCH");
  }

  if (p3?.terminal !== contract.expectedP3Terminal
    || p3?.pass !== true
    || p3?.protectedCorpusVersion !== "v8018"
    || p3?.publicRuntime?.recipeCountAfter !== contract.expectedPublicRuntimeRecipeCount
    || p3?.publicRuntime?.publicExternalCountAfter !== contract.expectedPublicExternalRecipeCount
    || p3?.publicRuntime?.activatedCandidateCount !== 1
    || p3?.boundaries?.automaticRecommendationAdmissionAuthorized !== false
    || p3?.boundaries?.furtherProtectedRecipeAdmissionAuthorized !== false) {
    throw new Error("P4_P3_TERMINAL_EVIDENCE_MISMATCH");
  }

  if (publicRuntimeRecipeCount !== contract.expectedPublicRuntimeRecipeCount
    || publicExternalRecipeCount !== contract.expectedPublicExternalRecipeCount
    || p3CandidatePresent !== true) {
    throw new Error("P4_CURRENT_PUBLIC_RUNTIME_MISMATCH");
  }

  const maxObservedD1Subqueries = Math.max(Number(p1.maxObservedD1Subqueries || 0), Number(p2.maxObservedD1Subqueries || 0));

  return {
    schemaVersion: "CULINARY_PROTECTED_CORPUS_P4_MACHINE_BASELINE_SUMMARY_V1",
    date: "2026-09-29",
    pass: true,
    machinePass: true,
    terminal: P4_TERMINAL,
    protectedCorpusVersion: "v8018",
    realCorpus: {
      recipeCount: 19268,
      indexedRecipeCount: p1.indexedRecipeCount,
      ftsRecipeCount: p1.ftsRecipeCount,
      structuralPartialCount: p1.structuralPartialCount,
      exactSourceReconstructionRecipeCount: c4.recipeCount,
      identityReadyRepairCohortCount: c4.repairCohort.recipeCount,
      unresolvedIngredientIdentityRecipeCount: c4.failureMatrix.identityNormalization.affectedRecipeCount,
      frozenSampleRecipeCount: p2.frozenSampleRecipeCount,
      matchedFrozenRecipeCount: p2.matchedFrozenRecipeCount,
      frozenSampleProvenanceCount: p2.sourceProvenanceCount
    },
    currentRuntime: {
      publicRuntimeRecipeCount,
      publicExternalRecipeCount,
      p3CandidateId: p3.candidateId,
      p3CandidatePresent
    },
    regressionMatrix: {
      runtimeRetrieval: {
        state: "PASS_INHERITED_LIVE_P1_P2",
        browsePass: p1.browsePass,
        searchPass: p1.searchPass,
        crossShardHydrationPass: p1.detailShard0Pass && p1.detailShard1Pass,
        maxObservedD1Subqueries,
        fullCorpusScans: Math.max(Number(p1.fullCorpusScans || 0), Number(p2.fullCorpusScans || 0))
      },
      metadataNormalization: {
        state: "PASS_WITH_EXPLICIT_LIMITATIONS",
        structuralPartialCount: p1.structuralPartialCount,
        unresolvedIngredientIdentityRecipeCount: c4.failureMatrix.identityNormalization.affectedRecipeCount,
        identityReadyRecipeCount: c4.failureMatrix.identityNormalization.identityReadyRecipeCount
      },
      hardSafetyEligibility: {
        state: "PASS_FAIL_CLOSED",
        reviewedDietaryAuthorityCount: c4.failureMatrix.hardDietaryAllergenAuthority.reviewedDietaryAuthorityCount,
        broaderAutomaticRecommendationAdmission: false
      },
      recommendationPlannerCompatibility: {
        state: "PASS_BOUNDED_P3_ONE_CANDIDATE",
        activatedCandidateCount: p3.publicRuntime.activatedCandidateCount,
        candidateId: p3.candidateId,
        broaderProtectedAdmission: false
      },
      performanceCost: {
        state: "MACHINE_BASELINE_PASS__LIVE_LATENCY_BYTES_MEMORY_REQUIRED",
        targetD1SubqueriesPerRequest: contract.targetD1SubqueriesPerRequest,
        hardMaxD1SubqueriesPerRequest: contract.hardMaxD1SubqueriesPerRequest,
        maxObservedD1Subqueries,
        protectedD1RowsWrittenThisGate: 0
      },
      rightsProvenance: {
        state: "PASS",
        p1SourceProvenancePass: p1.sourceProvenancePass,
        p2FrozenSampleProvenanceCount: p2.sourceProvenanceCount,
        p3License: p3.provenance.license,
        p3SourceNutritionImported: p3.provenance.sourceNutritionImported
      },
      browserUx: {
        state: "PR_BROWSER_REGRESSION_REQUIRED__OWNER_LIVE_PRODUCT_PROBE_PENDING",
        pullRequestBrowserRegressionRequired: true,
        ownerLiveProductProbeRequired: true
      }
    },
    syntheticHeadroom: {
      requiredProofCount: contract.scaleRequiredProofCount,
      stressProofCount: contract.scaleStressProofCount,
      role: "REGRESSION_AND_HEADROOM_ONLY",
      realV8018PrimaryProductCorpus: true
    },
    liveAcceptance: {
      required: true,
      state: "OWNER_AUTHENTICATED_PRODUCT_PROBE_REQUIRED",
      requiredMetrics: contract.liveAcceptance.requiredMetrics
    },
    boundaries: {
      protectedD1ReadsThisGate: 0,
      protectedD1WritesThisGate: 0,
      protectedBodyReadsThisGate: 0,
      protectedBodyRewritesThisGate: 0,
      publicRuntimeChangedThisGate: false,
      recommendationAdmissionChangedThisGate: false,
      automaticRecommendationAdmissionAuthorized: false,
      knowledgeCoreWrites: 0,
      paidInfrastructureUsed: false,
      thirdShardUsed: false,
      barbecueMutation: false
    },
    nextGate: P4_NEXT_GATE
  };
}

export function validateP4Summary(summary) {
  const errors = [];
  if (summary?.schemaVersion !== "CULINARY_PROTECTED_CORPUS_P4_MACHINE_BASELINE_SUMMARY_V1") errors.push("schemaVersion");
  if (summary?.pass !== true || summary?.machinePass !== true || summary?.terminal !== P4_TERMINAL) errors.push("terminal");
  if (summary?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (summary?.realCorpus?.recipeCount !== 19268
    || summary?.realCorpus?.indexedRecipeCount !== 19268
    || summary?.realCorpus?.ftsRecipeCount !== 19268
    || summary?.realCorpus?.structuralPartialCount !== 3
    || summary?.realCorpus?.exactSourceReconstructionRecipeCount !== 19268) errors.push("realCorpus");
  if (summary?.currentRuntime?.publicRuntimeRecipeCount !== 86
    || summary?.currentRuntime?.publicExternalRecipeCount !== 10
    || summary?.currentRuntime?.p3CandidateId !== "unitools_pao_de_queijo"
    || summary?.currentRuntime?.p3CandidatePresent !== true) errors.push("currentRuntime");
  if (summary?.regressionMatrix?.runtimeRetrieval?.maxObservedD1Subqueries > 8
    || summary?.regressionMatrix?.runtimeRetrieval?.fullCorpusScans !== 0) errors.push("runtimeRetrieval");
  if (summary?.regressionMatrix?.hardSafetyEligibility?.broaderAutomaticRecommendationAdmission !== false) errors.push("hardSafetyEligibility");
  if (summary?.regressionMatrix?.recommendationPlannerCompatibility?.activatedCandidateCount !== 1
    || summary?.regressionMatrix?.recommendationPlannerCompatibility?.broaderProtectedAdmission !== false) errors.push("recommendationPlannerCompatibility");
  if (summary?.liveAcceptance?.required !== true
    || summary?.liveAcceptance?.state !== "OWNER_AUTHENTICATED_PRODUCT_PROBE_REQUIRED"
    || !Array.isArray(summary?.liveAcceptance?.requiredMetrics)
    || summary.liveAcceptance.requiredMetrics.length !== 10) errors.push("liveAcceptance");
  const boundaries = summary?.boundaries || {};
  for (const key of ["protectedD1ReadsThisGate","protectedD1WritesThisGate","protectedBodyReadsThisGate","protectedBodyRewritesThisGate","knowledgeCoreWrites"]) {
    if (boundaries[key] !== 0) errors.push("boundaries." + key);
  }
  for (const key of ["publicRuntimeChangedThisGate","recommendationAdmissionChangedThisGate","automaticRecommendationAdmissionAuthorized","paidInfrastructureUsed","thirdShardUsed","barbecueMutation"]) {
    if (boundaries[key] !== false) errors.push("boundaries." + key);
  }
  if (summary?.nextGate !== P4_NEXT_GATE) errors.push("nextGate");
  return errors;
}
