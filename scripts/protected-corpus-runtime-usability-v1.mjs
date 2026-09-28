export const PROTECTED_CORPUS_RUNTIME_USABILITY_SCHEMA = "CULINARY_PROTECTED_CORPUS_RUNTIME_USABILITY_V1";

export function validateProtectedCorpusRuntimeUsability(config, evidence = {}) {
  const errors = [];
  if (!config || typeof config !== "object") return ["config must be an object"];
  if (config.schemaVersion !== PROTECTED_CORPUS_RUNTIME_USABILITY_SCHEMA) errors.push("unexpected schemaVersion");
  if (config.objective !== "MAKE_V8018_19268_PROTECTED_RECIPES_USER_USABLE_WITH_MEASURED_PROGRESSIVE_CAPABILITY") errors.push("unexpected objective");
  const facts = config.currentFacts || {};
  const normalization = evidence.normalization || {};
  const nutrition = evidence.nutrition || {};
  const recommendation = evidence.recommendation || {};

  if (facts.protectedCorpusVersion !== "v8018") errors.push("protected corpus version must remain v8018");
  if (facts.protectedRecipeCount !== 19268) errors.push("protected recipe count must remain 19268");
  if (normalization.observedRecipeCount !== facts.protectedRecipeCount) errors.push("normalization recipe count mismatch");
  if (normalization.structural?.titleKnownCount !== facts.titleKnownCount) errors.push("title coverage mismatch");
  if (normalization.structural?.structurallyParseableCount !== facts.structurallyParseableCount) errors.push("structural parse coverage mismatch");

  const applicability = nutrition.protectedCorpusApplicability || {};
  if (applicability.ingredientOccurrences !== facts.ingredientOccurrenceCount) errors.push("ingredient occurrence count mismatch");
  if (applicability.resolvedIngredientOccurrences !== facts.exactCanonicalIngredientMatches) errors.push("exact ingredient match count mismatch");
  if (applicability.recipesWithAllIngredientIdentitiesResolved !== facts.allIngredientIdentityReadyRecipes) errors.push("all-ingredient-ready recipe count mismatch");
  if (applicability.unitoolsCurrentEngine?.authoritativeCurrentEngineCount !== facts.directCurrentNutritionEngineAuthoritativeRecipes) errors.push("protected nutrition authority mismatch");

  const protectedRecommendation = recommendation.protectedCorpus || {};
  if (protectedRecommendation.automaticRecommendationReadyCount !== facts.protectedAutomaticRecommendationReadyCount) errors.push("protected recommendation-ready count mismatch");
  if (protectedRecommendation.reviewedDietaryAuthorityCount !== facts.reviewedDietaryAuthorityCount) errors.push("protected dietary-authority count mismatch");

  if (facts.maxObservedD1SubqueriesPerRequest > facts.hardMaxD1SubqueriesPerRequest) errors.push("observed D1 subqueries exceed hard limit");
  if (facts.scaleRequiredProofCount < 100000 || facts.scaleStressProofCount < facts.scaleRequiredProofCount) errors.push("scale proof envelope regressed");

  const priority = config.ownerPriority || {};
  if (priority.finishD5SafeAdapterPrototypeFirst !== true) errors.push("D5 safe adapter prototype must finish first");
  if (priority.deferD5BehaviorAfterPrototype !== true) errors.push("D5 behavior must defer after prototype");
  if (priority.d5SafeAdapterPrototypeState !== "PASS") errors.push("D5 safe adapter prototype must be closed PASS before P1");
  if (priority.d5BehaviorDisposition !== "DEFERRED") errors.push("D5 behavior disposition must be DEFERRED before P1");
  if (priority.successorPrincipalLane !== "PROTECTED_CORPUS_RUNTIME_USABILITY_V1") errors.push("protected corpus usability must be successor principal lane");
  if (priority.barbecueLaneRemainsIndependent !== true) errors.push("Barbecue lane must remain independent");

  const authority = config.authority || {};
  for (const key of [
    "protectedBodyRewriteAuthorized",
    "newProtectedSourceIngestionAuthorized",
    "publicRuntimeWideningAuthorized",
    "automaticRecommendationAdmissionAuthorized",
    "thirdShardAuthorized",
    "paidInfrastructureAuthorized",
    "knowledgeCoreWriteAuthorized",
    "barbecueMutationAuthorized"
  ]) {
    if (authority[key] !== false) errors.push(`authority.${key} must remain false`);
  }
  if (authority.privateBrowseSearchImplementationAuthorizedAfterD5Prototype !== true) errors.push("private browse/search successor implementation must be authorized after D5 prototype");

  const sequence = config.nextExecutionSequence || [];
  const brain = config.brainCalibration || {};
  if (brain.id !== "CULINARY_BRAIN_CORPUS_CALIBRATION_V1") errors.push("Culinary Brain calibration contract is required");
  if (brain.browseSearchBlocksOnBrain !== false) errors.push("browse/search must not block on Brain calibration");
  if (brain.startsWith !== "P2_METADATA_USABILITY_MEASUREMENT") errors.push("Brain calibration must start with P2 metadata usability");
  if (brain.goldenCalibrationRecipeCount !== 85) errors.push("Brain calibration golden set must remain 85");
  if (brain.initialProtectedPilotTarget !== 500) errors.push("Brain calibration protected pilot target must remain 500");
  if (brain.fullCorpusRecipeCount !== 19268) errors.push("Brain calibration full corpus count must remain 19268");
  if (brain.liveRuntimeDependencyAuthorized !== false) errors.push("live Brain runtime dependency must remain unauthorized");
  if (brain.disagreementOutcome !== "UNKNOWN_AMBIGUOUS_OR_REVIEW") errors.push("Brain disagreement must fail closed to unknown/ambiguous/review");

  const p1Gate = (config.gates || []).find(gate => gate.id === "P1_PRIVATE_BROWSE_SEARCH_CANARY");
  const p1Passed = p1Gate?.state === "PASS"
    && p1Gate?.liveOwnerCanary === "PROTECTED_CORPUS_P1_LIVE_OWNER_CANARY_PASS";
  const p2Gate = (config.gates || []).find(gate => gate.id === "P2_METADATA_USABILITY_MEASUREMENT");
  const p2Passed = p1Passed && p2Gate?.state === "PASS"
    && p2Gate?.liveAlignmentState === "PASS"
    && p2Gate?.liveAlignmentTerminal === "PROTECTED_CORPUS_P2_LIVE_ALIGNMENT_PASS";
  const c1 = brain.c1Evaluation || {};
  const c1Passed = p2Passed
    && c1.terminal === "CULINARY_BRAIN_C1_PASS_WITH_REFERENCE_COVERAGE_LIMIT__C2_CANDIDATE_ONLY_READY"
    && c1.entireFrozen500Evaluated === true
    && c1.c2AuthorizedScope === "CANDIDATE_ONLY__ABSTENTION_DEFAULT";
  const c2 = brain.c2Classification || {};
  const c2Passed = c1Passed
    && c2.terminal === "CULINARY_BRAIN_C2_FULL_V8018_CANDIDATE_CLASSIFICATION_PASS"
    && c2.evidence === "data/generated/culinary-brain-c2-candidate-classification-summary-v1.json"
    && c2.recipeCount === 19268
    && c2.uniqueRecipeKeyCount === 19268
    && /^[a-f0-9]{64}$/.test(c2.fullClassificationDigestSha256 || "")
    && c2.candidateOnly === true
    && c2.abstentionDefault === true
    && c2.knownReferenceOverrideAttempts === 0
    && c2.highConfidenceCells === 0
    && c2.hardAuthorityViolations === 0;
  const c3 = brain.c3Calibration || {};
  const c3Passed = c2Passed
    && ["C3_PASS__C4_READY","C4_FAILURE_MATRIX_PASS__HARD_AUTHORITY_REPAIR_READY","C4_POLICY_REVIEW_PASS__RECIPE_RECONCILIATION_READY","C4_RECONCILIATION_PASS__HARD_METADATA_REPAIR_DESIGN_READY","C4_BOUNDED_PASS__P3_CONTRACT_READY","C4_BOUNDED_PASS__P3_PREACTIVATION_READY","C4_BOUNDED_PASS__P3_BOUNDED_ACTIVATION_PASS__P4_READY"].includes(brain.state)
    && c3.terminal === "CULINARY_BRAIN_C3_PRIOR_CALIBRATION_PASS__NO_NEW_RUNTIME_PRIOR_PROMOTION__C4_READY"
    && c3.evidence === "data/generated/culinary-brain-c3-prior-calibration-summary-v1.json"
    && c3.publicRuntimeRecipeCount === 85
    && c3.profileCaseCount === 12
    && /^[a-f0-9]{64}$/.test(c3.matrixDigestSha256 || "")
    && c3.deterministicMismatchCount === 0
    && c3.hardConstraintViolations === 0
    && c3.promotedPriorCount === 0
    && c3.scorerDisposition === "CURRENT_DETERMINISTIC_SCORER_RETAINED_UNCHANGED"
    && c3.c2CandidatesPromoted === false;
  const c4 = brain.c4FailureMatrix || config.c4FailureMatrix || {};
  const c4MatrixPassed = c3Passed
    && c4.terminal === "CULINARY_BRAIN_C4_FAILURE_MATRIX_PASS__112_IDENTITY_READY_REPAIR_COHORT_FROZEN"
    && c4.evidence === "data/generated/culinary-brain-c4-real-v8018-failure-matrix-summary-v1.json"
    && c4.recipeCount === 19268
    && c4.identityReadyRepairCohortCount === 112
    && /^[a-f0-9]{64}$/.test(c4.identityReadyRepairCohortDigestSha256 || "")
    && c4.unresolvedIdentityRecipeCount === 19156
    && c4.hardDietaryAllergenAuthorityState === "UNIVERSAL_HARD_BLOCKER"
    && c4.automaticRecommendationReadyCount === 0;
  const c4Evidence = brain.c4HardAuthorityEvidence || config.c4HardAuthorityEvidence || {};
  const c4EvidencePassed = c4MatrixPassed
    && c4Evidence.terminal === "CULINARY_BRAIN_C4_HARD_AUTHORITY_EVIDENCE_AUDIT_PASS__POLICY_REVIEW_READY"
    && c4Evidence.evidence === "data/generated/culinary-brain-c4-hard-authority-evidence-summary-v1.json"
    && c4Evidence.repairCohortCount === 112
    && c4Evidence.distinctCanonicalIngredientCount === 49
    && c4Evidence.hardAuthorityEarnedCount === 0;
  const c4Policy = brain.c4PolicyReview || config.c4PolicyReview || {};
  const c4PolicyPassed = c4EvidencePassed
    && c4Policy.terminal === "CULINARY_BRAIN_C4_HARD_AUTHORITY_POLICY_REVIEW_PASS__100_POLICY_COMPLETE_CANDIDATES__RECONCILIATION_READY"
    && c4Policy.evidence === "data/generated/culinary-brain-c4-hard-authority-policy-review-summary-v1.json"
    && c4Policy.reviewedIngredientPolicyCount === 49
    && c4Policy.policyCompleteIngredientCount === 45
    && JSON.stringify(c4Policy.heldPolicyIngredientIds || []) === JSON.stringify(["bread","curry_powder","noodles","pasta"])
    && c4Policy.policyCompleteRecipeCandidateCount === 100
    && c4Policy.policyHeldRecipeCount === 12
    && c4Policy.recommendationAuthorityPromoted === false;
  const c4Reconciliation = brain.c4RecipeReconciliation || config.c4RecipeReconciliation || {};
  const c4ReconciliationPassed = c4PolicyPassed
    && c4Reconciliation.terminal === "CULINARY_BRAIN_C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_PASS"
    && c4Reconciliation.evidence === "data/generated/culinary-brain-c4-hard-authority-recipe-reconciliation-summary-v1.json"
    && c4Reconciliation.policyCompleteCandidateCount === 100
    && c4Reconciliation.mealRoleAuthorityReadyCount === 1
    && c4Reconciliation.sourceDifficultyEvidencePresentCount === 1
    && c4Reconciliation.runtimeDifficultyReadyCount === 0
    && c4Reconciliation.totalMinutesAuthorityReadyCount === 1
    && c4Reconciliation.readyExceptDifficultyCount === 1
    && JSON.stringify(c4Reconciliation.readyExceptDifficultyRecipeKeys || []) === JSON.stringify(["unitools-world-recipes-v1_1_0::tortilla-espanola"])
    && c4Reconciliation.runtimeHardMetadataReadyCount === 0
    && c4Reconciliation.recommendationAdmissionChanged === false
    && c4Reconciliation.nextGate === "C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_V1";
  const c4Closeout=brain.c4Closeout||{};
  const c4CloseoutPassed=c4ReconciliationPassed
    && c4Closeout.terminal==="CULINARY_BRAIN_C4_BOUNDED_FAILURE_REPAIR_PASS__ONE_DISTINCT_P3_CANDIDATE_READY"
    && c4Closeout.evidence==="data/generated/culinary-brain-c4-closeout-summary-v1.json"
    && c4Closeout.distinctCandidateCount===1
    && c4Closeout.protectedRecommendationAdmissionCount===0
    && c4Closeout.nextGate==="C4_TAPIOCA_BOUNDED_P3_ADMISSION_CONTRACT_V1";
  const p3Preactivation=config.p3TapiocaPreactivation||{};
  const p3PreactivationPassed=c4CloseoutPassed
    && p3Preactivation.terminal==="CULINARY_BRAIN_C4_TAPIOCA_BOUNDED_P3_CONTRACT_PASS__PREACTIVATION_READY"
    && p3Preactivation.evidence==="data/generated/culinary-brain-c4-tapioca-bounded-p3-admission-summary-v1.json"
    && p3Preactivation.candidateId==="unitools_pao_de_queijo"
    && p3Preactivation.protectedSourceKey==="unitools-world-recipes-v1_1_0::pao-de-queijo"
    && p3Preactivation.publicRuntimeRecipeCount===85
    && p3Preactivation.newPublicRuntimeRecipeCount===0
    && p3Preactivation.runtimeActivationAuthorized===false
    && p3Preactivation.ownerActivationAuthorizationRequired===true
    && p3Preactivation.nextGate==="C4_TAPIOCA_P3_OWNER_ACTIVATION_AUTHORIZATION";
  const p3Activation=config.p3TapiocaActivation||{};
  const p3ActivationPassed=p3PreactivationPassed
    && p3Activation.terminal==="CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_PASS__P4_READY"
    && p3Activation.evidence==="data/generated/culinary-brain-p3-tapioca-bounded-activation-summary-v1.json"
    && p3Activation.candidateId==="unitools_pao_de_queijo"
    && p3Activation.protectedSourceKey==="unitools-world-recipes-v1_1_0::pao-de-queijo"
    && p3Activation.ownerActivationAuthorized===true
    && p3Activation.publicRuntimeRecipeCountBefore===85
    && p3Activation.publicRuntimeRecipeCountAfter===86
    && p3Activation.publicExternalRecipeCountAfter===10
    && p3Activation.activatedRecipeCount===1
    && p3Activation.exactCanonicalIngredientIdentity==="tapioca_starch"
    && p3Activation.automaticRecommendationAdmissionAuthorized===false
    && p3Activation.furtherProtectedRecipeAdmissionAuthorized===false
    && p3Activation.nextGate==="PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE";
  const expected = p3ActivationPassed
    ? [
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : p3PreactivationPassed
    ? [
        "C4_TAPIOCA_P3_OWNER_ACTIVATION_AUTHORIZATION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : c4CloseoutPassed
    ? [
        "C4_TAPIOCA_BOUNDED_P3_ADMISSION_CONTRACT_V1",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : c4ReconciliationPassed
    ? [
        "CULINARY_BRAIN_C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_V1",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : c4PolicyPassed
    ? [
        "CULINARY_BRAIN_C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_V1",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : c4MatrixPassed
    ? [
        "CULINARY_BRAIN_C4_HARD_AUTHORITY_REPAIR_TRANCHE_V1",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : c3Passed
    ? [
        "CULINARY_BRAIN_C4_REAL_V8018_FAILURE_REPAIR_LOOP",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : c2Passed
    ? [
        "CULINARY_BRAIN_C3_DETERMINISTIC_RECOMMENDATION_PRIOR_CALIBRATION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : c1Passed
      ? [
        "CULINARY_BRAIN_C2_FROZEN_FULL_V8018_CANDIDATE_CLASSIFICATION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
        "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
      ]
    : p2Passed
      ? [
          "CULINARY_BRAIN_C1_EVALUATION",
          "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
          "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
        ]
      : p1Passed
        ? [
            "CULINARY_BRAIN_CORPUS_CALIBRATION_C0_C1_PARALLEL_WITH_P2",
            "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
            "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
          ]
        : [
            "PROTECTED_CORPUS_RUNTIME_USABILITY_P1_PRIVATE_BROWSE_SEARCH_CANARY",
            "CULINARY_BRAIN_CORPUS_CALIBRATION_C0_C1_PARALLEL_WITH_P2",
            "PROTECTED_CORPUS_RUNTIME_USABILITY_P3_PROGRESSIVE_RECOMMENDATION_ADMISSION",
            "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE"
          ];
  if (JSON.stringify(sequence) !== JSON.stringify(expected)) errors.push("unexpected execution sequence");
  if (p2Passed) {
    if (p2Gate.liveAlignmentEvidence !== "data/generated/protected-corpus-p2-live-alignment-v1.json") errors.push("P2 terminal evidence reference mismatch");
  }
  if (c1Passed) {
    if (c1.evidence !== "data/generated/culinary-brain-c1-combined-closeout-v1.json") errors.push("C1 terminal evidence reference mismatch");
    if (c1.independentHistoricalSemanticGeneralizationDemonstrated !== false) errors.push("C1 historical semantic limitation must remain explicit");
  }
  if (p3ActivationPassed) {
    const p3Gate=(config.gates||[]).find(gate=>gate.id==="P3_PROGRESSIVE_RECOMMENDATION_ADMISSION");
    const p4Gate=(config.gates||[]).find(gate=>gate.id==="P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE");
    if (p3Gate?.state!=="BOUNDED_ACTIVATION_PASS__ONE_RECIPE_ADMITTED") errors.push("P3 bounded activation terminal mismatch");
    if (p4Gate?.state!=="READY") errors.push("P4 must be ready after bounded P3 activation");
  } else if (p3PreactivationPassed) {
    const p3Gate=(config.gates||[]).find(gate=>gate.id==="P3_PROGRESSIVE_RECOMMENDATION_ADMISSION");
    if (p3Gate?.state!=="PREACTIVATION_CONTRACT_PASS__OWNER_AUTHORIZATION_REQUIRED") errors.push("P3 preactivation must remain owner-gated");
  } else if (c4CloseoutPassed) {
    const p3Gate=(config.gates||[]).find(gate=>gate.id==="P3_PROGRESSIVE_RECOMMENDATION_ADMISSION");
    if (p3Gate?.state!=="READY_FOR_BOUNDED_CONTRACT__NOT_ADMITTED") errors.push("P3 requires bounded contract before admission");
  } else if (c4ReconciliationPassed) {
    const p3Gate = (config.gates || []).find(gate => gate.id === "P3_PROGRESSIVE_RECOMMENDATION_ADMISSION");
    if (p3Gate?.state !== "BLOCKED_ON_C4_REMAINING_HARD_METADATA") errors.push("P3 must remain blocked on C4 remaining hard metadata after reconciliation");
  } else if (c4PolicyPassed) {
    const p3Gate = (config.gates || []).find(gate => gate.id === "P3_PROGRESSIVE_RECOMMENDATION_ADMISSION");
    if (p3Gate?.state !== "BLOCKED_ON_C4_RECIPE_RECONCILIATION_AND_HARD_METADATA") errors.push("P3 must remain blocked on C4 recipe reconciliation and hard metadata");
  } else if (c4MatrixPassed) {
    const p3Gate = (config.gates || []).find(gate => gate.id === "P3_PROGRESSIVE_RECOMMENDATION_ADMISSION");
    if (p3Gate?.state !== "BLOCKED_ON_C4_HARD_AUTHORITY_REPAIR_AND_HARD_METADATA") errors.push("P3 must remain blocked on C4 hard-authority repair and hard metadata");
  } else if (c3Passed) {
    const p3Gate = (config.gates || []).find(gate => gate.id === "P3_PROGRESSIVE_RECOMMENDATION_ADMISSION");
    if (p3Gate?.state !== "BLOCKED_ON_C4_AND_HARD_METADATA") errors.push("P3 must remain blocked on C4 and hard metadata after C3");
  } else if (c2Passed) {
    const p3Gate = (config.gates || []).find(gate => gate.id === "P3_PROGRESSIVE_RECOMMENDATION_ADMISSION");
    if (p3Gate?.state !== "BLOCKED_ON_C3_AND_HARD_METADATA") errors.push("P3 must remain blocked on C3 and hard metadata after C2");
  }
  if (p1Passed) {
    const terminal = p1Gate.terminalEvidence || {};
    if (terminal.activeVersion !== "v8018"
      || terminal.indexedRecipeCount !== 19268
      || terminal.ftsRecipeCount !== 19268
      || terminal.structuralPartialCount !== 3) errors.push("P1 terminal corpus evidence mismatch");
    if (terminal.maxObservedD1Subqueries > 8) errors.push("P1 terminal D1 target exceeded");
    if (terminal.fullCorpusScans !== 0) errors.push("P1 terminal full corpus scan detected");
    if (terminal.publicRuntimeChanged !== false || terminal.recommendationAdmissionChanged !== false) errors.push("P1 terminal authority firewall changed");
  }
  return errors;
}

export function summarizeProtectedCorpusRuntimeUsability(config, evidence) {
  const errors = validateProtectedCorpusRuntimeUsability(config, evidence);
  if (errors.length) return { pass: false, errors };
  return {
    pass: true,
    terminal: "PROTECTED_CORPUS_RUNTIME_USABILITY_P0_EVIDENCE_AUDIT_PASS",
    protectedCorpusVersion: config.currentFacts.protectedCorpusVersion,
    protectedRecipeCount: config.currentFacts.protectedRecipeCount,
    structurallyParseableCount: config.currentFacts.structurallyParseableCount,
    allIngredientIdentityReadyRecipes: config.currentFacts.allIngredientIdentityReadyRecipes,
    protectedAutomaticRecommendationReadyCount: config.currentFacts.protectedAutomaticRecommendationReadyCount,
    nextExecutionSequence: config.nextExecutionSequence
  };
}
