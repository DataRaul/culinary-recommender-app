const PRACTICAL_ROLES = new Set(['STRUCTURE_EVIDENCE', 'VARIANT_EVIDENCE', 'REUSABLE_CONTENT']);

const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const unique = values => [...new Set(values.filter(Boolean))];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantile(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const fraction = position - base;
  const next = sorted[base + 1];
  return next == null ? sorted[base] : sorted[base] + fraction * (next - sorted[base]);
}

function rangeFrom(values) {
  const usable = values.filter(Number.isFinite);
  if (!usable.length) return null;
  return {
    min: round(Math.min(...usable)),
    max: round(Math.max(...usable)),
    median: round(median(usable))
  };
}

function recommendedRange(values) {
  const usable = values.filter(Number.isFinite);
  if (!usable.length) return null;
  if (usable.length < 3) return rangeFrom(usable);
  return {
    min: round(quantile(usable, 0.25)),
    max: round(quantile(usable, 0.75)),
    median: round(median(usable))
  };
}

function bandFor(prevalence) {
  if (prevalence >= 0.70) return 'CORE_SIGNAL';
  if (prevalence >= 0.40) return 'COMMON_SIGNAL';
  if (prevalence >= 0.20) return 'VARIANT_SIGNAL';
  return 'ISOLATED_SIGNAL';
}

function variantState(count, authoritative = false) {
  if (authoritative || count >= 3) return 'ESTABLISHED_VARIANT';
  if (count >= 2) return 'OBSERVED_VARIANT';
  return 'CANDIDATE_VARIANT';
}

export function validatePrototypeObservation(observation) {
  const errors = [];
  if (!observation || typeof observation !== 'object') {
    return { pass: false, errors: ['observation must be an object'] };
  }
  for (const key of ['observationId', 'familyCandidate']) {
    if (typeof observation[key] !== 'string' || !observation[key].trim()) errors.push(`missing ${key}`);
  }
  if (!observation.source || typeof observation.source !== 'object') errors.push('missing source');
  if (!Array.isArray(observation.ingredients) || !observation.ingredients.length) errors.push('ingredients must be non-empty');
  if (!Array.isArray(observation.techniques)) errors.push('techniques must be an array');

  if (PRACTICAL_ROLES.has(observation.source?.role)) {
    if (!Number.isFinite(observation.servings) || observation.servings <= 0) {
      errors.push('practical observation servings must be positive');
    }
  } else if (observation.servings != null && (!Number.isFinite(observation.servings) || observation.servings <= 0)) {
    errors.push('servings must be positive when supplied');
  }

  for (const [index, ingredient] of (observation.ingredients || []).entries()) {
    if (typeof ingredient.ingredientId !== 'string' || !ingredient.ingredientId) errors.push(`ingredient[${index}] missing ingredientId`);
    if (typeof ingredient.role !== 'string' || !ingredient.role) errors.push(`ingredient[${index}] missing role`);
    if (ingredient.quantity != null && !Number.isFinite(ingredient.quantity)) errors.push(`ingredient[${index}] quantity must be numeric or null`);
    if (ingredient.quantity != null && (typeof ingredient.unit !== 'string' || !ingredient.unit)) errors.push(`ingredient[${index}] quantity requires unit`);
  }

  return { pass: errors.length === 0, errors };
}

export function normalizePrototypeObservation(observation, definition) {
  const check = validatePrototypeObservation(observation);
  if (!check.pass) throw new Error(`${observation?.observationId || 'observation'}: ${check.errors.join('; ')}`);

  const servings = Number.isFinite(observation.servings) ? observation.servings : null;
  const principalId = definition.principalIngredientId;
  const principal = observation.ingredients.find(item => item.ingredientId === principalId && Number.isFinite(item.quantity));
  const ingredients = observation.ingredients.map(item => {
    const normalized = { ...item };
    if (Number.isFinite(item.quantity) && servings) {
      normalized.perServing = round(item.quantity / servings);
    } else {
      normalized.perServing = null;
    }
    if (Number.isFinite(item.quantity) && principal?.quantity > 0 && item.unit === principal.unit) {
      normalized.per100Principal = round((item.quantity / principal.quantity) * 100);
    } else {
      normalized.per100Principal = null;
    }
    return normalized;
  });

  return {
    observationId: observation.observationId,
    familyCandidate: observation.familyCandidate,
    source: { ...observation.source },
    servings,
    ingredients,
    techniques: unique(observation.techniques),
    times: { ...(observation.times || {}) },
    temperatures: { ...(observation.temperatures || {}) },
    equipment: unique(observation.equipment || []),
    identityState: observation.identityState || 'SAME_FAMILY',
    variantKey: observation.variantKey || null,
    structuredNotes: { ...(observation.structuredNotes || {}) }
  };
}

function ingredientSignal(practicalObservations, ingredientId) {
  const supporting = practicalObservations.filter(obs => obs.ingredients.some(item => item.ingredientId === ingredientId));
  const prevalence = practicalObservations.length ? supporting.length / practicalObservations.length : 0;
  const valuesByUnit = new Map();
  const ratioValues = [];

  for (const obs of supporting) {
    const ingredient = obs.ingredients.find(item => item.ingredientId === ingredientId);
    if (Number.isFinite(ingredient?.perServing) && ingredient.unit) {
      const values = valuesByUnit.get(ingredient.unit) || [];
      values.push({ value: ingredient.perServing, evidenceId: obs.observationId });
      valuesByUnit.set(ingredient.unit, values);
    }
    if (Number.isFinite(ingredient?.per100Principal)) {
      ratioValues.push({ value: ingredient.per100Principal, evidenceId: obs.observationId });
    }
  }

  const canonicalUnits = [...valuesByUnit.keys()];
  const unitConflict = canonicalUnits.length > 1;
  const unit = canonicalUnits.length === 1 ? canonicalUnits[0] : null;
  const unitValues = unit ? valuesByUnit.get(unit) : [];
  const rangesByUnit = Object.fromEntries([...valuesByUnit.entries()].map(([key, values]) => [key, {
    observedRange: rangeFrom(values.map(item => item.value)),
    recommendedRange: recommendedRange(values.map(item => item.value)),
    evidenceIds: values.map(item => item.evidenceId)
  }]));

  return {
    ingredientId,
    independentObservationCount: supporting.length,
    prevalence: round(prevalence),
    supportBand: bandFor(prevalence),
    unit,
    unitConflict,
    observedRange: {
      perServing: unitConflict ? null : rangeFrom(unitValues.map(item => item.value)),
      per100Principal: rangeFrom(ratioValues.map(item => item.value))
    },
    recommendedRange: {
      perServing: unitConflict ? null : recommendedRange(unitValues.map(item => item.value)),
      per100Principal: recommendedRange(ratioValues.map(item => item.value))
    },
    rangesByUnit,
    evidenceIds: supporting.map(obs => obs.observationId)
  };
}

function collectAttributionRequirements(observations) {
  return observations
    .filter(obs => obs.source.publicAttributionRequirement === 'REQUIRED')
    .map(obs => ({
      observationId: obs.observationId,
      publisher: obs.source.publisher,
      url: obs.source.url,
      state: obs.source.publicAttributionState,
      label: obs.source.attributionLabel || null,
      licenseOrBasis: obs.source.attributionLicenseOrBasis || null
    }));
}

export function synthesizeRecipeFamilyP0(rawObservations, definition) {
  if (!definition || typeof definition !== 'object') throw new Error('family definition required');
  const familyId = definition.familyId;
  const candidates = rawObservations.filter(item => item.familyCandidate === familyId);

  const independence = new Map();
  for (const raw of candidates) {
    const normalized = normalizePrototypeObservation(raw, definition);
    const key = normalized.source.independenceGroup || normalized.observationId;
    if (!independence.has(key)) independence.set(key, normalized);
  }

  const observations = [...independence.values()];
  const referenceObservations = observations.filter(obs => obs.source.role === 'REFERENCE_EVIDENCE');
  const practicalObservations = observations.filter(obs => PRACTICAL_ROLES.has(obs.source.role));
  const validationObservations = observations.filter(obs => obs.source.role === 'VALIDATION_ONLY');

  const allIngredientIds = unique(practicalObservations.flatMap(obs => obs.ingredients.map(item => item.ingredientId)));
  const ingredientSignals = allIngredientIds.map(ingredientId => ingredientSignal(practicalObservations, ingredientId));

  const referenceProfile = {
    identityClaims: [...(definition.referenceProfile?.identityClaims || [])],
    scopeLimits: [...(definition.referenceProfile?.scopeLimits || [])],
    requiredIngredientRoles: [...(definition.referenceProfile?.requiredIngredientRoles || [])],
    requiredTechniques: [...(definition.referenceProfile?.requiredTechniques || [])],
    evidenceIds: referenceObservations.map(obs => obs.observationId),
    note: 'Reference identity is defined by reference evidence/definition and is not inferred from observed prevalence.'
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
    state: variantState(group.length, Boolean(definition.authoritativeVariantKeys?.includes(variantKey))),
    evidenceIds: group.map(item => item.observationId)
  }));

  const techniqueCounts = new Map();
  for (const obs of practicalObservations) {
    for (const technique of obs.techniques) techniqueCounts.set(technique, (techniqueCounts.get(technique) || 0) + 1);
  }
  const techniqueSignals = [...techniqueCounts.entries()].map(([technique, count]) => {
    const prevalence = practicalObservations.length ? count / practicalObservations.length : 0;
    return {
      technique,
      independentObservationCount: count,
      prevalence: round(prevalence),
      supportBand: bandFor(prevalence)
    };
  });

  const requiredIngredientIds = definition.requiredIngredientIds || [];
  const missingRequiredIngredientEvidence = requiredIngredientIds.filter(id => {
    const signal = ingredientSignals.find(item => item.ingredientId === id);
    return !signal || signal.unitConflict || !signal.recommendedRange.perServing;
  });
  const missingRequiredTechniques = (definition.referenceProfile?.requiredTechniques || []).filter(technique => {
    const signal = techniqueSignals.find(item => item.technique === technique);
    return !signal || signal.independentObservationCount < Math.min(2, practicalObservations.length);
  });

  const independentPracticalMinimum = definition.independentPracticalMinimum || 3;
  const timeResolved = practicalObservations.some(obs => Number.isFinite(obs.times?.totalMinutes));
  const equipmentResolved = practicalObservations.some(obs => obs.equipment.length > 0);
  const attributionRequirements = collectAttributionRequirements(observations);
  const attributionReady = attributionRequirements.every(item => item.state === 'READY' && item.label && item.licenseOrBasis);
  const protectedSourceExpressionPersisted = observations.some(obs => obs.source.sourceExpressionPersisted === true && obs.source.reuseBasis === 'STANDARD_COPYRIGHT');

  const gateChecks = {
    IDENTITY_COHERENT: referenceObservations.length > 0 && referenceProfile.identityClaims.length > 0,
    REQUIRED_INGREDIENT_ROLES_HAVE_USABLE_RANGES: missingRequiredIngredientEvidence.length === 0,
    TECHNIQUE_SEQUENCE_COHERENT: missingRequiredTechniques.length === 0,
    MATERIAL_TIME_TEMPERATURE_EQUIPMENT_RESOLVED: timeResolved && equipmentResolved,
    ALLERGEN_DIETARY_FAIL_CLOSED: Boolean(definition.projection?.allergySafety) && Array.isArray(definition.projection?.dietaryTags),
    PERSONALIZATION_INSIDE_EXPLICIT_BOUNDARIES: Array.isArray(definition.allowedAdaptations),
    MATERIAL_SYNTHESIZED_CLAIMS_HAVE_PROVENANCE: ingredientSignals.every(signal => signal.evidenceIds.length > 0),
    PROJECT_OWNED_INSTRUCTIONS_CAN_BE_AUTHORED_WITHOUT_COPYING_SOURCE_EXPRESSION: Array.isArray(definition.projection?.instructions) && definition.projection.instructions.length > 0 && !protectedSourceExpressionPersisted,
    INDEPENDENT_PRACTICAL_MINIMUM: practicalObservations.length >= independentPracticalMinimum,
    ATTRIBUTION_REQUIREMENTS_READY: attributionReady
  };
  const appAuthoringEligible = Object.values(gateChecks).every(Boolean);

  const validationContradictions = [];
  for (const validation of validationObservations) {
    for (const ingredientId of requiredIngredientIds) {
      if (!validation.ingredients.some(item => item.ingredientId === ingredientId)) {
        validationContradictions.push({ observationId: validation.observationId, type: 'REQUIRED_INGREDIENT_ABSENT', ingredientId });
      }
    }
  }

  const candidateRecipe = appAuthoringEligible
    ? buildCandidateRecipe(definition, ingredientSignals, practicalObservations, attributionRequirements)
    : null;

  return {
    familyId,
    independentObservationCount: observations.length,
    independentPracticalObservationCount: practicalObservations.length,
    referenceProfile,
    observedProfile: { ingredientSignals, techniqueSignals },
    recommendedProfile: {
      ingredientSignals: ingredientSignals.map(({ ingredientId, unit, unitConflict, recommendedRange, evidenceIds }) => ({
        ingredientId,
        unit,
        unitConflict,
        recommendedRange,
        evidenceIds
      }))
    },
    variants,
    provenance: {
      observationIds: observations.map(obs => obs.observationId),
      referenceEvidenceIds: referenceObservations.map(obs => obs.observationId),
      practicalEvidenceIds: practicalObservations.map(obs => obs.observationId),
      validationEvidenceIds: validationObservations.map(obs => obs.observationId),
      protectedSourceExpressionPersisted
    },
    attributionRequirements,
    expressionIndependence: {
      pass: !protectedSourceExpressionPersisted,
      protectedStandardCopyrightExpressionPersisted: protectedSourceExpressionPersisted
    },
    validationReport: {
      contradictionCount: validationContradictions.length,
      contradictions: validationContradictions,
      unresolvedFacts: [
        ...missingRequiredIngredientEvidence.map(ingredientId => `missing usable single-unit range: ${ingredientId}`),
        ...missingRequiredTechniques.map(technique => `missing technique support: ${technique}`)
      ]
    },
    appAuthoringGate: { pass: appAuthoringEligible, checks: gateChecks },
    candidateRecipe
  };
}

function buildCandidateRecipe(definition, ingredientSignals, practicalObservations, attributionRequirements) {
  const projection = definition.projection;
  const ingredients = (definition.requiredIngredientIds || []).map(ingredientId => {
    const signal = ingredientSignals.find(item => item.ingredientId === ingredientId);
    const quantity = signal?.recommendedRange?.perServing?.median ?? signal?.observedRange?.perServing?.median ?? null;
    return {
      canonicalIngredientId: ingredientId,
      normalizedIngredient: ingredientId,
      quantity,
      unit: signal?.unit || null,
      required: true,
      preparation: null,
      substitutionGroup: ingredientId
    };
  });
  const totalMinutes = median(practicalObservations.map(obs => obs.times?.totalMinutes).filter(Number.isFinite)) ?? projection.time.totalMinutes;

  return {
    id: `p0_${definition.familyId}_candidate`,
    identity: { canonicalTitle: projection.title, alternateTitle: null, language: 'en' },
    provenance: {
      source: 'Culinary Recommender Recipe Family Synthesis P0',
      sourceReference: `recipe-family-synthesis-p0/${definition.familyId}`,
      expressionOwnership: 'PROJECT_AUTHORED',
      originalAdaptedStatus: 'project_authored_synthesis_candidate',
      ingestionVersion: 'p0.3',
      evidenceAttributionRequirements: attributionRequirements.map(item => ({ ...item }))
    },
    governance: {
      prototypeOnly: true,
      appAuthoringEligible: true,
      publicActivationAuthorized: false,
      uiLegalConformancePassed: false
    },
    culinary: { ...projection.culinary },
    time: { ...projection.time, totalMinutes: round(totalMinutes) },
    ingredients,
    instructions: projection.instructions.map((text, index) => ({
      order: index + 1,
      stage: `Step ${index + 1}`,
      text,
      techniqueNote: null
    })),
    equipment: { required: [...projection.equipment], optional: [], substitutable: [] },
    serving: { servings: 1, scalable: true, minimumSensibleBatch: 1 },
    nutrition: {
      perServing: { ...projection.nutrition },
      provenance: 'Prototype estimate only; Nutrition authority not widened.',
      estimationState: 'INFERRED_ESTIMATE',
      confidence: 'low'
    },
    dietaryTags: [...projection.dietaryTags],
    allergySafety: { ...projection.allergySafety },
    economics: {
      costTier: projection.costTier,
      ingredientCostAssumptions: 'Prototype heuristic only.',
      approximatePerServingTier: projection.costTier,
      confidence: 'low'
    },
    convenience: { ...projection.convenience },
    discovery: { ...projection.discovery },
    geography: {
      likelySpainAvailability: 'high',
      likelyCanaryAvailability: 'high',
      hardToFindIngredientFlags: [],
      substitutionCandidates: []
    },
    mainProtein: projection.mainProtein || null
  };
}
