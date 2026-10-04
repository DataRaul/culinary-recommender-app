export const LIMITED_EVIDENCE_SECONDARY_LANE_MODE = "limited_evidence_secondary";
export const LIMITED_EVIDENCE_SECONDARY_LANE_VALIDATION_STATE = "LIMITED_EVIDENCE_NOT_PRIMARY_VALIDATED";

const MEAL_TYPES = new Set(["breakfast", "dinner", "lunch", "snack"]);
const asArray = value => Array.isArray(value) ? value : [];

function boundedLimit(value, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return maximum;
  return Math.min(maximum, parsed);
}

export function normalizeLimitedEvidenceSecondaryRequest(input, config, { featureEnabled = false } = {}) {
  const request = config?.requestContract || {};
  const profile = input?.profile || {};
  const mealType = String(input?.mealType || "").trim().toLowerCase();
  const explicitMode = input?.mode === request.modeValue;
  const unrestricted = profile.dietaryMode === request.dietaryModeRequired
    && asArray(profile.allergens).length === 0
    && asArray(profile.excludedIngredientIds).length === 0
    && asArray(profile.unavailableIngredientIds).length === 0;
  const supportedMealType = MEAL_TYPES.has(mealType);
  const eligible = featureEnabled && explicitMode && unrestricted && supportedMealType;
  let reason = null;
  if (!featureEnabled) reason = "SECONDARY_FEATURE_DISABLED";
  else if (!explicitMode) reason = "SECONDARY_MODE_NOT_EXPLICITLY_ENABLED";
  else if (!unrestricted) reason = "RESTRICTED_PROFILE_NOT_ELIGIBLE";
  else if (!supportedMealType) reason = "UNSUPPORTED_MEAL_TYPE";
  return {
    featureEnabled: Boolean(featureEnabled),
    explicitMode,
    unrestricted,
    supportedMealType,
    eligible,
    reason,
    mealType,
    limit: boundedLimit(input?.limit, request.maximumSecondaryResults)
  };
}

export function validateLimitedEvidenceRuntimeBundle(bundle, config) {
  const errors = [];
  if (bundle?.schemaVersion !== "CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_BUNDLE_V1") errors.push("schemaVersion");
  if (bundle?.protectedCorpusVersion !== config?.protectedCorpusVersion) errors.push("protectedCorpusVersion");
  if (bundle?.candidateCount !== config?.candidateCount) errors.push("candidateCount");
  if (bundle?.candidateManifestDigestSha256 !== config?.candidateManifestDigestSha256) errors.push("candidateManifestDigestSha256");
  if (!Array.isArray(bundle?.candidates) || bundle.candidates.length !== config?.candidateCount) errors.push("candidates");
  const keys = asArray(bundle?.candidates).map(row => row?.recipeKey);
  if (keys.some(key => typeof key !== "string" || !key)) errors.push("recipeKey");
  if (new Set(keys).size !== keys.length) errors.push("duplicateRecipeKey");
  for (const row of asArray(bundle?.candidates)) {
    if (row?.recipe?.governance?.recommendationState !== "SHADOW_CANDIDATE_ONLY") errors.push("candidateGovernance");
    if (!asArray(row?.recipe?.culinary?.mealTypes).some(mealType => MEAL_TYPES.has(mealType))) errors.push("candidateMealTypes");
  }
  return [...new Set(errors)].sort();
}

function emptyLane(config, state) {
  return {
    enabled: false,
    reason: state.reason,
    label: config.responseContract.requiredLaneLabel,
    disclosure: config.responseContract.requiredDisclosure,
    unknownSoftSignals: [...config.responseContract.requiredUnknownSoftSignals],
    recommendationValidationState: config.responseContract.recommendationValidationState,
    mayDisplacePrimary: false,
    results: [],
    metrics: { d1Subqueries: 0, fullCorpusScans: 0, rowsWritten: 0 }
  };
}

export async function executeLimitedEvidenceSecondaryLane({
  primaryResults = [],
  request,
  featureEnabled = false,
  bundle,
  config,
  rankSecondaryCandidates,
  hydrateTopK
}) {
  const state = normalizeLimitedEvidenceSecondaryRequest(request, config, { featureEnabled });
  if (!state.eligible) return { primary: primaryResults, secondaryLane: emptyLane(config, state) };

  const bundleErrors = validateLimitedEvidenceRuntimeBundle(bundle, config);
  if (bundleErrors.length) throw new Error(`SECONDARY_RUNTIME_BUNDLE_INVALID__${bundleErrors.join(",")}`);
  if (typeof rankSecondaryCandidates !== "function") throw new Error("SECONDARY_RUNTIME_RANKER_REQUIRED");
  if (typeof hydrateTopK !== "function") throw new Error("SECONDARY_RUNTIME_HYDRATOR_REQUIRED");

  const mealCandidates = bundle.candidates.filter(row => asArray(row?.recipe?.culinary?.mealTypes).includes(state.mealType));
  const ranked = await rankSecondaryCandidates(mealCandidates, {
    profile: request.profile,
    mealType: state.mealType,
    mode: "shadow"
  });
  if (!Array.isArray(ranked)) throw new Error("SECONDARY_RUNTIME_RANKER_RESULT");

  const allowed = new Set(mealCandidates.map(row => row.recipeKey));
  const rankedKeys = ranked.map(row => row?.recipeKey);
  if (rankedKeys.some(key => !allowed.has(key))) throw new Error("SECONDARY_RUNTIME_RANKER_SCOPE_LEAK");
  if (new Set(rankedKeys).size !== rankedKeys.length) throw new Error("SECONDARY_RUNTIME_RANKER_DUPLICATE");

  const top = ranked.slice(0, state.limit);
  if (top.length > config.runtimeCostContract.maximumHydratedResults) throw new Error("SECONDARY_RUNTIME_TOP_K_BOUND");
  const hydrated = await hydrateTopK(top.map(row => row.recipeKey));
  const metrics = {
    d1Subqueries: Number(hydrated?.d1Subqueries || 0),
    fullCorpusScans: Number(hydrated?.fullCorpusScans || 0),
    rowsWritten: Number(hydrated?.rowsWritten || 0)
  };
  if (metrics.d1Subqueries > config.runtimeCostContract.maximumD1SubqueriesPerRequest) throw new Error("SECONDARY_RUNTIME_D1_BUDGET");
  if (metrics.fullCorpusScans !== 0) throw new Error("SECONDARY_RUNTIME_FULL_SCAN");
  if (metrics.rowsWritten !== 0) throw new Error("SECONDARY_RUNTIME_WRITE");
  if (!Array.isArray(hydrated?.results)) throw new Error("SECONDARY_RUNTIME_HYDRATION_RESULT");

  const detailByKey = new Map(hydrated.results.map(row => [row?.recipeKey, row]));
  if (detailByKey.size !== top.length) throw new Error("SECONDARY_RUNTIME_HYDRATION_INCOMPLETE");
  const results = top.map(row => {
    const detail = detailByKey.get(row.recipeKey);
    if (!detail) throw new Error("SECONDARY_RUNTIME_HYDRATION_KEY_MISSING");
    if (!detail.sourceProvenance) throw new Error("SECONDARY_RUNTIME_PROVENANCE_REQUIRED");
    return {
      ...row,
      detail,
      recommendationValidationState: config.responseContract.recommendationValidationState,
      unknownSoftSignals: [...config.responseContract.requiredUnknownSoftSignals]
    };
  });

  return {
    primary: primaryResults,
    secondaryLane: {
      enabled: true,
      reason: null,
      label: config.responseContract.requiredLaneLabel,
      disclosure: config.responseContract.requiredDisclosure,
      unknownSoftSignals: [...config.responseContract.requiredUnknownSoftSignals],
      recommendationValidationState: config.responseContract.recommendationValidationState,
      mayDisplacePrimary: false,
      results,
      metrics
    }
  };
}
