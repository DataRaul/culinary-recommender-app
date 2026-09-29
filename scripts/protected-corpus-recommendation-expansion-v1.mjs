export const RECOMMENDATION_EXPANSION_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_V1";
export const R0_EVIDENCE_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R0_BASELINE_V1";
export const R0_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R0_PASS__FRONTIER_MEASUREMENT_READY";

export function validateProtectedCorpusRecommendationExpansion(contract, evidence, priorP4) {
  const errors = [];
  if (!contract || contract.schemaVersion !== RECOMMENDATION_EXPANSION_SCHEMA) errors.push("schemaVersion");
  if (contract?.state !== "R0_AUTHORIZED_BASELINE_PASS__R1_FRONTIER_MEASUREMENT_READY") errors.push("state");
  if (contract?.objective !== "PROGRESSIVELY_EARN_MORE_PROTECTED_RECOMMENDATION_CANDIDATES_WITH_EXPLICIT_BOUNDED_ADMISSION") errors.push("objective");

  const entry = contract?.entryEvidence || {};
  if (entry.priorProgrammeTerminal !== "PROTECTED_CORPUS_P4_OWNER_LIVE_PRODUCT_ACCEPTANCE_PASS") errors.push("priorTerminal");
  if (entry.activeVersion !== "v8018" || entry.protectedRecipeCount !== 19268) errors.push("protectedBaseline");
  if (entry.publicRuntimeRecipeCount !== 86 || entry.publicExternalRecipeCount !== 10 || entry.activatedProtectedOriginCount !== 1) errors.push("publicBaseline");
  if (entry.currentPostP3IdentityReadyRecipeCount !== 113 || entry.currentPostP3UnresolvedIdentityRecipeCount !== 19155) errors.push("identityBaseline");

  const auth = contract?.ownerAuthorization || {};
  if (auth.successorProgrammeAuthorized !== true || auth.candidateDiscoveryAuthorized !== true || auth.exactIdentityRepairCandidateWorkAuthorized !== true || auth.hardDietaryAllergenCandidateReviewAuthorized !== true || auth.deterministicRecommendationPlannerEvaluationAuthorized !== true) errors.push("programmeAuthorization");
  if (auth.runtimeActivationRequiresSeparateOwnerAuthorization !== true || auth.maxRecipesPerOwnerActivationGate !== 1 || auth.automaticRecommendationAdmissionAuthorized !== false) errors.push("admissionGate");

  const frontier = contract?.frontierPolicy || {};
  if (frontier.primaryCohort !== "unitools-world-recipes-v1_1_0" || frontier.candidateEvaluationTrancheMaxRecipes !== 10) errors.push("frontier");
  for (const key of ["conflictsFailClosed","ambiguousIngredientIdentityFailsClosed","sourceDifficultyRequiresReviewedRuntimeMapping","mealRoleRequiresReviewedAuthority"]) {
    if (frontier[key] !== true) errors.push("frontier."+key);
  }
  if (frontier.sourceNutritionPromotionAuthorized !== false || frontier.sourceDietaryClaimPromotionAuthorized !== false) errors.push("sourceAuthority");

  const authority = contract?.authority || {};
  if (authority.candidateRepairAndEvaluationAuthorized !== true) errors.push("candidateAuthority");
  for (const key of ["publicRuntimeWideningAuthorized","automaticRecommendationAdmissionAuthorized","protectedD1ReadForOfflineProgrammeAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","newProtectedSourceIngestionAuthorized","thirdShardAuthorized","paidInfrastructureAuthorized","knowledgeCoreWriteAuthorized","barbecueMutationAuthorized"]) {
    if (authority[key] !== false) errors.push("authority."+key);
  }

  const expectedSequence = ["R1_POST_P3_FRONTIER_MEASUREMENT","R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR","R3_RECOMMENDATION_AND_PLANNER_MACHINE_ACCEPTANCE","R4_OWNER_BOUNDED_ADMISSION","R5_REAL_V8018_POST_ADMISSION_REGRESSION"];
  if (JSON.stringify(contract?.nextExecutionSequence) !== JSON.stringify(expectedSequence)) errors.push("sequence");
  const gates = new Map((contract?.gates || []).map(g => [g.id,g]));
  if (gates.get("R0_AUTHORIZATION_AND_BASELINE")?.state !== "PASS") errors.push("r0");
  if (gates.get("R1_POST_P3_FRONTIER_MEASUREMENT")?.state !== "READY") errors.push("r1");
  if (gates.get("R4_OWNER_BOUNDED_ADMISSION")?.state !== "HUMAN_GATED_AFTER_R3") errors.push("r4");

  if (!evidence || evidence.schemaVersion !== R0_EVIDENCE_SCHEMA || evidence.pass !== true || evidence.terminal !== R0_TERMINAL) errors.push("r0Evidence");
  if (evidence?.ownerProgrammeAuthorizationRecorded !== true || evidence?.nextGate !== "R1_POST_P3_FRONTIER_MEASUREMENT") errors.push("r0EvidenceGate");
  if (evidence?.protectedCorpusVersion !== "v8018" || evidence?.protectedRecipeCount !== 19268 || evidence?.publicRuntimeRecipeCount !== 86 || evidence?.activatedProtectedOriginCount !== 1) errors.push("r0EvidenceBaseline");
  for (const [key,value] of Object.entries(evidence?.boundaries || {})) {
    if (typeof value === "boolean" && value !== false) errors.push("evidenceBoundary."+key);
    if (typeof value === "number" && value !== 0) errors.push("evidenceBoundary."+key);
  }

  if (!priorP4 || priorP4.terminal !== "PROTECTED_CORPUS_P4_OWNER_LIVE_PRODUCT_ACCEPTANCE_PASS" || priorP4.pass !== true) errors.push("priorP4");
  if (priorP4.activeVersion !== "v8018" || priorP4.indexedRecipeCount !== 19268 || priorP4.ftsRecipeCount !== 19268 || priorP4.structuralPartialCount !== 3) errors.push("priorP4Corpus");
  if (priorP4.publicRuntimeRecipeCount !== 86 || priorP4.activatedProtectedOriginCount !== 1 || priorP4.protectedD1Writes !== 0 || priorP4.recommendationAdmissionChanged !== false || priorP4.barbecueMutation !== false) errors.push("priorP4Firewall");

  return [...new Set(errors)].sort();
}

export function summarizeProtectedCorpusRecommendationExpansion(contract, evidence, priorP4) {
  const errors = validateProtectedCorpusRecommendationExpansion(contract, evidence, priorP4);
  if (errors.length) return { pass:false, errors };
  return {
    pass:true,
    terminal:evidence.terminal,
    protectedCorpusVersion:evidence.protectedCorpusVersion,
    protectedRecipeCount:evidence.protectedRecipeCount,
    publicRuntimeRecipeCount:evidence.publicRuntimeRecipeCount,
    activatedProtectedOriginCount:evidence.activatedProtectedOriginCount,
    nextExecutionSequence:contract.nextExecutionSequence
  };
}
