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

  const applicability = nutrition.protectedApplicability || {};
  if (applicability.ingredientOccurrences !== facts.ingredientOccurrenceCount) errors.push("ingredient occurrence count mismatch");
  if (applicability.exactCanonicalIngredientMatches !== facts.exactCanonicalIngredientMatches) errors.push("exact ingredient match count mismatch");
  if (applicability.allIngredientIdentityReadyRecipes !== facts.allIngredientIdentityReadyRecipes) errors.push("all-ingredient-ready recipe count mismatch");
  if (applicability.directCurrentEngineAuthoritativeRecipes !== facts.directCurrentNutritionEngineAuthoritativeRecipes) errors.push("protected nutrition authority mismatch");

  if (recommendation.protectedAutomaticRecommendationReadyCount !== facts.protectedAutomaticRecommendationReadyCount) errors.push("protected recommendation-ready count mismatch");
  if (recommendation.protectedReviewedDietaryAuthorityCount !== facts.reviewedDietaryAuthorityCount) errors.push("protected dietary-authority count mismatch");

  if (facts.maxObservedD1SubqueriesPerRequest > facts.hardMaxD1SubqueriesPerRequest) errors.push("observed D1 subqueries exceed hard limit");
  if (facts.scaleRequiredProofCount < 100000 || facts.scaleStressProofCount < facts.scaleRequiredProofCount) errors.push("scale proof envelope regressed");

  const priority = config.ownerPriority || {};
  if (priority.finishD5SafeAdapterPrototypeFirst !== true) errors.push("D5 safe adapter prototype must finish first");
  if (priority.deferD5BehaviorAfterPrototype !== true) errors.push("D5 behavior must defer after prototype");
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
  const expected = [
    "D5_FITNESS_INTEGRATION_P0_ADAPTER_PROTOTYPE",
    "D5_BEHAVIOR_WORK_DEFER",
    "PROTECTED_CORPUS_RUNTIME_USABILITY_P1_PRIVATE_BROWSE_SEARCH_CANARY"
  ];
  if (JSON.stringify(sequence) !== JSON.stringify(expected)) errors.push("unexpected execution sequence");
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
