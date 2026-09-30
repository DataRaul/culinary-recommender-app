export const RECOMMENDATION_EXPANSION_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_V1";
export const R0_EVIDENCE_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R0_BASELINE_V1";
export const R0_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R0_PASS__FRONTIER_MEASUREMENT_READY";

export function validateProtectedCorpusRecommendationExpansion(contract, evidence, priorP4) {
  const errors = [];
  if (!contract || contract.schemaVersion !== RECOMMENDATION_EXPANSION_SCHEMA) errors.push("schemaVersion");
  if (!["R0_AUTHORIZED_BASELINE_PASS__R1_FRONTIER_MEASUREMENT_READY","R0_PASS__R1_PASS__R2_REPAIR_READY","R0_PASS__R1_PASS__R2_PASS__R3_PASS_WITH_HOLD__NEXT_FRONTIER_READY","R0_PASS__R1_PASS__R2_PASS__R3_HOLD__ITERATION_V2_PASS__NEXT_FRONTIER_V3_READY"].includes(contract?.state)) errors.push("state");
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

  const gates = new Map((contract?.gates || []).map(g => [g.id,g]));
  if (gates.get("R0_AUTHORIZATION_AND_BASELINE")?.state !== "PASS") errors.push("r0");
  const r1 = gates.get("R1_POST_P3_FRONTIER_MEASUREMENT");
  const r1Passed = r1?.state === "PASS";
  const r3Held = contract?.state === "R0_PASS__R1_PASS__R2_PASS__R3_PASS_WITH_HOLD__NEXT_FRONTIER_READY";
  const iterationV2Passed = contract?.state === "R0_PASS__R1_PASS__R2_PASS__R3_HOLD__ITERATION_V2_PASS__NEXT_FRONTIER_V3_READY";
  const expectedSequence = iterationV2Passed
    ? ["R1_NEXT_FRONTIER_ITERATION_V3","R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR","R3_RECOMMENDATION_AND_PLANNER_MACHINE_ACCEPTANCE","R4_OWNER_BOUNDED_ADMISSION","R5_REAL_V8018_POST_ADMISSION_REGRESSION"]
    : r3Held
      ? ["R1_NEXT_FRONTIER_ITERATION_V2","R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR","R3_RECOMMENDATION_AND_PLANNER_MACHINE_ACCEPTANCE","R4_OWNER_BOUNDED_ADMISSION","R5_REAL_V8018_POST_ADMISSION_REGRESSION"]
      : r1Passed
        ? ["R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR","R3_RECOMMENDATION_AND_PLANNER_MACHINE_ACCEPTANCE","R4_OWNER_BOUNDED_ADMISSION","R5_REAL_V8018_POST_ADMISSION_REGRESSION"]
        : ["R1_POST_P3_FRONTIER_MEASUREMENT","R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR","R3_RECOMMENDATION_AND_PLANNER_MACHINE_ACCEPTANCE","R4_OWNER_BOUNDED_ADMISSION","R5_REAL_V8018_POST_ADMISSION_REGRESSION"];
  if (JSON.stringify(contract?.nextExecutionSequence) !== JSON.stringify(expectedSequence)) errors.push("sequence");
  if (!r1Passed && r1?.state !== "READY") errors.push("r1");
  if (r1Passed) {
    if (r1.terminal !== "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R1_FRONTIER_PASS__R2_REPAIR_TRANCHE_READY") errors.push("r1Terminal");
    if (r1.evidence !== "data/generated/protected-corpus-recommendation-expansion-r1-frontier-compact-v1.json") errors.push("r1Evidence");
    if (r1.frozenCandidateRecipeCount !== 10 || r1.frozenCandidateDigestSha256 !== "6dbf598c8a00e07bd0b1bdfae75146d7683487afcc3f0bfc9c0e07ddf938b9c0") errors.push("r1Freeze");
    if (!["READY","IDENTITY_PASS__HARD_SAFETY_POLICY_READY","PASS"].includes(gates.get("R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR")?.state)) errors.push("r2");
  }
  const r2Gate = gates.get("R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR");
  const r3Gate = gates.get("R3_RECOMMENDATION_AND_PLANNER_MACHINE_ACCEPTANCE");
  const r4Gate = gates.get("R4_OWNER_BOUNDED_ADMISSION");
  if (r3Held || iterationV2Passed) {
    if (r2Gate?.state !== "PASS" || r2Gate?.terminal !== "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_HARD_SAFETY_PASS__R3_READY") errors.push("r2Terminal");
    if (r3Gate?.state !== "PASS_WITH_HOLD__NO_R4_CANDIDATE" || r3Gate?.terminal !== "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R3_MACHINE_ACCEPTANCE_PASS__CHIMICHURRI_HELD__NEXT_FRONTIER_READY" || r3Gate?.admissionReadyCandidateCount !== 0) errors.push("r3");
    if (r4Gate?.state !== "BLOCKED__NO_ADMISSION_READY_CANDIDATE" || r4Gate?.admissionAuthorized !== false) errors.push("r4");
  } else if (r4Gate?.state !== "HUMAN_GATED_AFTER_R3") errors.push("r4");
  if (iterationV2Passed) {
    const v2 = contract?.iterationV2 || {};
    if (v2.terminal !== "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V2_PASS__JASHA_MAROO_HELD__NEXT_FRONTIER_V3_READY") errors.push("iterationV2Terminal");
    if (v2.contract !== "config/protected_corpus_recommendation_expansion_iteration_v2.json" || v2.evidence !== "data/generated/protected-corpus-recommendation-expansion-iteration-v2-summary-v1.json") errors.push("iterationV2Evidence");
    if (v2.frozenCandidateRecipeCount !== 10 || v2.frozenCandidateDigestSha256 !== "128ac3e3375ac9dc0e5647c813199eadb9028870ebcabcf808ad2d8f624d56f6") errors.push("iterationV2Freeze");
    if (JSON.stringify(v2.identityReadySourceSlugs) !== JSON.stringify(["jasha-maroo"]) || v2.candidateId !== "unitools_jasha_maroo") errors.push("iterationV2Candidate");
    if (v2.admissionReadyCandidateCount !== 0 || v2.ownerAdmissionGateOpen !== false || v2.nextGate !== "R1_NEXT_FRONTIER_ITERATION_V3") errors.push("iterationV2Gate");
  }

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
