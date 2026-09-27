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
    && brain.state === "C1_PASS_WITH_REFERENCE_COVERAGE_LIMIT__C2_CANDIDATE_ONLY_READY"
    && c1.terminal === "CULINARY_BRAIN_C1_PASS_WITH_REFERENCE_COVERAGE_LIMIT__C2_CANDIDATE_ONLY_READY"
    && c1.entireFrozen500Evaluated === true
    && c1.c2AuthorizedScope === "CANDIDATE_ONLY__ABSTENTION_DEFAULT";
  const expected = c1Passed
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
