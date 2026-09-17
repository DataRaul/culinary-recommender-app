const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const quantile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] == null ? sorted[base] : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
};
const unique = values => [...new Set(values.filter(Boolean))];

export function validatePrototypeObservation(observation) {
  const errors = [];
  if (!observation || typeof observation !== "object") return { pass: false, errors: ["observation must be an object"] };
  for (const key of ["observationId", "familyCandidate"]) {
    if (typeof observation[key] !== "string" || !observation[key].trim()) errors.push(`missing ${key}`);
  }
  if (!observation.source || typeof observation.source !== "object") errors.push("missing source");
  if (!Number.isFinite(observation.servings) || observation.servings <= 0) errors.push("servings must be positive");
  if (!Array.isArray(observation.ingredients) || !observation.ingredients.length) errors.push("ingredients must be non-empty");
  if (!Array.isArray(observation.techniques)) errors.push("techniques must be an array");
  for (const [index, ingredient] of (observation.ingredients || []).entries()) {
    if (typeof ingredient.ingredientId !== "string" || !ingredient.ingredientId) errors.push(`ingredient[${index}] missing ingredientId`);
    if (typeof ingredient.role !== "string" || !ingredient.role) errors.push(`ingredient[${index}] missing role`);
    if (ingredient.quantity != null && !Number.isFinite(ingredient.quantity)) errors.push(`ingredient[${index}] quantity must be numeric or null`);
    if (ingredient.quantity != null && (typeof ingredient.unit !== "string" || !ingredient.unit)) errors.push(`ingredient[${index}] quantity requires unit`);
  }
  return { pass: errors.length === 0, errors };
}

export function normalizePrototypeObservation(observation, definition) {
  const check = validatePrototypeObservation(observation);
  if (!check.pass) throw new Error(`${observation?.observationId || "observation"}: ${check.errors.join("; ")}`);
  const principalId = definition.principalIngredientId;
  const principal = observation.ingredients.find(item => item.ingredientId === principalId && Number.isFinite(item.quantity));
  const ingredients = observation.ingredients.map(item => {
    const normalized = { ...item };
    if (Number.isFinite(item.quantity)) {
      normalized.perServing = round(item.quantity / observation.servings);
      if (principal && principal.quantity > 0 && item.unit === principal.unit) {
        normalized.per100Principal = round((item.quantity / principal.quantity) * 100);
      } else {
        normalized.per100Principal = null;
      }
    } else {
      normalized.perServing = null;
      normalized.per100Principal = null;
    }
    return normalized;
  });
  return {
    observationId: observation.observationId,
    familyCandidate: observation.familyCandidate,
    source: { ...observation.source },
    servings: observation.servings,
    ingredients,
    techniques: unique(observation.techniques),
    times: { ...(observation.times || {}) },
    temperatures: { ...(observation.temperatures || {}) },
    equipment: unique(observation.equipment || []),
    identityState: observation.identityState || "SAME_FAMILY",
    variantKey: observation.variantKey || null
  };
}

function bandFor(prevalence) {
  if (prevalence >= 0.70) return "CORE_SIGNAL";
  if (prevalence >= 0.40) return "COMMON_SIGNAL";
  if (prevalence >= 0.20) return "VARIANT_SIGNAL";
  return "ISOLATED_SIGNAL";
}

function variantState(count, authoritative = false) {
  if (authoritative || count >= 3) return "ESTABLISHED_VARIANT";
  if (count >= 2) return "OBSERVED_VARIANT";
  return "CANDIDATE_VARIANT";
}

function rangeFrom(values) {
  const usable = values.filter(Number.isFinite);
  if (!usable.length) return null;
  return { min: round(Math.min(...usable)), max: round(Math.max(...usable)), median: round(median(usable)) };
}

function recommendedRange(values) {
  const usable = values.filter(Number.isFinite);
  if (!usable.length) return null;
  if (usable.length < 3) return rangeFrom(usable);
  return { min: round(quantile(usable, 0.25)), max: round(quantile(usable, 0.75)), median: round(median(usable)) };
}

function ingredientEvidence(observations, ingredientId, field) {
  return observations.flatMap(obs => {
    const match = obs.ingredients.find(item => item.ingredientId === ingredientId);
    return match && Number.isFinite(match[field]) ? [{ value: match[field], evidenceId: obs.observationId }] : [];
  });
}

export function synthesizeRecipeFamilyP0(rawObservations, definition) {
  if (!definition || typeof definition !== "object") throw new Error("family definition required");
  const familyId = definition.familyId;
  const candidates = rawObservations.filter(item => item.familyCandidate === familyId);
  const independence = new Map();
  for (const raw of candidates) {
    const normalized = normalizePrototypeObservation(raw, definition);
    const key = normalized.source.independenceGroup || normalized.observationId;
    if (!independence.has(key)) independence.set(key, normalized);
  }
  const observations = [...independence.values()];
  const referenceObservations = observations.filter(obs => obs.source.role === "REFERENCE_EVIDENCE");
  const practicalObservations = observations.filter(obs => ["STRUCTURE_EVIDENCE", "VARIANT_EVIDENCE", "REUSABLE_CONTENT"].includes(obs.source.role));
  const validationObservations = observations.filter(obs => obs.source.role === "VALIDATION_ONLY");

  const allIngredientIds = unique(practicalObservations.flatMap(obs => obs.ingredients.map(item => item.ingredientId)));
  const ingredientSignals = allIngredientIds.map(ingredientId => {
    const supporting = practicalObservations.filter(obs => obs.ingredients.some(item => item.ingredientId === ingredientId));
    const prevalence = practicalObservations.length ? supporting.length / practicalObservations.length : 0;
    const perServing = ingredientEvidence(practicalObservations, ingredientId, "perServing");
    const per100Principal = ingredientEvidence(practicalObservations, ingredientId, "per100Principal");
    return {
      ingredientId,
      independentObservationCount: supporting.length,
      prevalence: round(prevalence),
      supportBand: bandFor(prevalence),
      observedRange: {
        perServing: rangeFrom(perServing.map(item => item.value)),
        per100Principal: rangeFrom(per100Principal.map(item => item.value))
      },
      recommendedRange: {
        perServing: recommendedRange(perServing.map(item => item.value)),
        per100Principal: recommendedRange(per100Principal.map(item => item.value))
      },
      evidenceIds: supporting.map(obs => obs.observationId)
    };
  });

  const referenceProfile = {
    identityClaims: [...(definition.referenceProfile?.identityClaims || [])],
    requiredIngredientRoles: [...(definition.referenceProfile?.requiredIngredientRoles || [])],
    requiredTechniques: [...(definition.referenceProfile?.requiredTechniques || [])],
    evidenceIds: referenceObservations.map(obs => obs.observationId),
    note: "Reference identity is defined by reference evidence/definition and is not inferred from observed prevalence."
  };

  const variantsByKey = new Map();
  for (const obs of practicalObservations.filter(item => item.variantKey)) {
    const current = variantsByKey.get(obs.variantKey) || [];
    current.push(obs);
    variantsByKey.set(obs.variantKey, current);
  }
  const variants = [...variantsByKey.entries()].map(([variantKey, group]) => ({
    variantKey,
    independentObservationCount: group.length,
    state: variantState(group.length, false),
    evidenceIds: group.map(item => item.observationId)
  }));

  const techniqueCounts = new Map();
  for (const obs of practicalObservations) for (const technique of obs.techniques) techniqueCounts.set(technique, (techniqueCounts.get(technique) || 0) + 1);
  const techniqueSignals = [...techniqueCounts.entries()].map(([technique, count]) => ({
    technique,
    independentObservationCount: count,
    prevalence: round(practicalObservations.length ? count / practicalObservations.length : 0),
    supportBand: bandFor(practicalObservations.length ? count / practicalObservations.length : 0)
  }));

  const requiredIngredientIds = definition.requiredIngredientIds || [];
  const missingRequiredIngredientEvidence = requiredIngredientIds.filter(id => {
    const signal = ingredientSignals.find(item => item.ingredientId === id);
    return !signal || !signal.recommendedRange.perServing;
  });
  const missingRequiredTechniques = (definition.referenceProfile?.requiredTechniques || []).filter(technique => {
    const signal = techniqueSignals.find(item => item.technique === technique);
    return !signal || signal.independentObservationCount < Math.min(2, practicalObservations.length);
  });
  const timeResolved = practicalObservations.some(obs => Number.isFinite(obs.times?.totalMinutes));
  const equipmentResolved = practicalObservations.some(obs => obs.equipment.length > 0);
  const independentPracticalMinimum = definition.independentPracticalMinimum || 3;

  const gateChecks = {
    IDENTITY_COHERENT: referenceObservations.length > 0 && referenceProfile.identityClaims.length > 0,
    REQUIRED_INGREDIENT_ROLES_HAVE_USABLE_RANGES: missingRequiredIngredientEvidence.length === 0,
    TECHNIQUE_SEQUENCE_COHERENT: missingRequiredTechniques.length === 0,
    MATERIAL_TIME_TEMPERATURE_EQUIPMENT_RESOLVED: timeResolved && equipmentResolved,
    ALLERGEN_DIETARY_FAIL_CLOSED: Boolean(definition.projection?.allergySafety) && Array.isArray(definition.projection?.dietaryTags),
    PERSONALIZATION_INSIDE_EXPLICIT_BOUNDARIES: Array.isArray(definition.allowedAdaptations),
    MATERIAL_SYNTHESIZED_CLAIMS_HAVE_PROVENANCE: ingredientSignals.every(signal => signal.evidenceIds.length > 0),
    PROJECT_OWNED_INSTRUCTIONS_CAN_BE_AUTHORED_WITHOUT_COPYING_SOURCE_EXPRESSION: Array.isArray(definition.projection?.instructions) && definition.projection.instructions.length > 0,
    INDEPENDENT_PRACTICAL_MINIMUM: practicalObservations.length >= independentPracticalMinimum
  };
  const appAuthoringEligible = Object.values(gateChecks).every(Boolean);

  const candidateRecipe = appAuthoringEligible ? buildCandidateRecipe(definition, ingredientSignals, practicalObservations) : null;
  const validationContradictions = [];
  for (const validation of validationObservations) {
    for (const ingredientId of requiredIngredientIds) {
      if (!validation.ingredients.some(item => item.ingredientId === ingredientId)) {
        validationContradictions.push({ observationId: validation.observationId, type: "REQUIRED_INGREDIENT_ABSENT", ingredientId });
      }
    }
  }

  return {
    familyId,
    independentObservationCount: observations.length,
    independentPracticalObservationCount: practicalObservations.length,
    referenceProfile,
    observedProfile: { ingredientSignals, techniqueSignals },
    recommendedProfile: { ingredientSignals: ingredientSignals.map(({ ingredientId, recommendedRange, evidenceIds }) => ({ ingredientId, recommendedRange, evidenceIds })) },
    variants,
    provenance: {
      observationIds: observations.map(obs => obs.observationId),
      referenceEvidenceIds: referenceObservations.map(obs => obs.observationId),
      practicalEvidenceIds: practicalObservations.map(obs => obs.observationId),
      validationEvidenceIds: validationObservations.map(obs => obs.observationId),
      protectedSourceExpressionPersisted: observations.some(obs => obs.source.sourceExpressionPersisted === true)
    },
    validationReport: {
      contradictionCount: validationContradictions.length,
      contradictions: validationContradictions,
      unresolvedFacts: [...missingRequiredIngredientEvidence.map(ingredientId => `missing usable range: ${ingredientId}`), ...missingRequiredTechniques.map(technique => `missing technique support: ${technique}`)]
    },
    appAuthoringGate: { pass: appAuthoringEligible, checks: gateChecks },
    candidateRecipe
  };
}

function buildCandidateRecipe(definition, ingredientSignals, practicalObservations) {
  const projection = definition.projection;
  const ingredients = (definition.requiredIngredientIds || []).map(ingredientId => {
    const signal = ingredientSignals.find(item => item.ingredientId === ingredientId);
    const quantity = signal?.recommendedRange?.perServing?.median ?? signal?.observedRange?.perServing?.median ?? null;
    const exemplar = practicalObservations.flatMap(obs => obs.ingredients).find(item => item.ingredientId === ingredientId);
    return {
      canonicalIngredientId: ingredientId,
      originalText: `${quantity ?? ""} ${exemplar?.unit || ""} ${ingredientId}`.trim(),
      normalizedIngredient: ingredientId,
      quantity,
      unit: exemplar?.unit || null,
      required: true,
      preparation: null,
      substitutionGroup: ingredientId
    };
  });
  const totalMinutes = median(practicalObservations.map(obs => obs.times?.totalMinutes).filter(Number.isFinite)) ?? projection.time.totalMinutes;
  return {
    id: `p0_${definition.familyId}_candidate`,
    identity: { canonicalTitle: projection.title, alternateTitle: null, language: "en" },
    provenance: {
      source: "Culinary Recommender Recipe Family Synthesis P0",
      sourceReference: `recipe-family-synthesis-p0/${definition.familyId}`,
      license: "PROJECT_AUTHORED_UNLICENSED",
      attributionRequirement: "None for project-authored expression; factual synthesis provenance remains in the P0 report.",
      originalAdaptedStatus: "project_authored_synthesis_candidate",
      ingestionVersion: "p0.1"
    },
    governance: { prototypeOnly: true, publicActivationAuthorized: false },
    culinary: { ...projection.culinary },
    time: { ...projection.time, totalMinutes: round(totalMinutes) },
    ingredients,
    instructions: projection.instructions.map((text, index) => ({ order: index + 1, stage: `Step ${index + 1}`, text, techniqueNote: null })),
    equipment: { required: [...projection.equipment], optional: [], substitutable: [] },
    serving: { servings: 1, scalable: true, minimumSensibleBatch: 1 },
    nutrition: { perServing: { ...projection.nutrition }, provenance: "Prototype estimate only; Nutrition authority not widened.", estimationState: "INFERRED_ESTIMATE", confidence: "low" },
    dietaryTags: [...projection.dietaryTags],
    allergySafety: { ...projection.allergySafety },
    economics: { costTier: projection.costTier, ingredientCostAssumptions: "Prototype heuristic only.", approximatePerServingTier: projection.costTier, confidence: "low" },
    convenience: { ...projection.convenience },
    discovery: { ...projection.discovery },
    geography: { likelySpainAvailability: "high", likelyCanaryAvailability: "high", hardToFindIngredientFlags: [], substitutionCandidates: [] },
    mainProtein: projection.mainProtein || null
  };
}
