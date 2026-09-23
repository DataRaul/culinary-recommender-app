const round = value => Number(value.toFixed(6));

export function quantile(values, p) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function supportBand(ratio, bands) {
  if (ratio >= bands.CORE_SIGNAL_MIN) return "CORE_SIGNAL";
  if (ratio >= bands.COMMON_SIGNAL_MIN) return "COMMON_SIGNAL";
  if (ratio >= bands.VARIANT_SIGNAL_MIN) return "VARIANT_SIGNAL";
  return "ISOLATED_SIGNAL";
}

function uniqueByIndependenceGroup(observations) {
  const seen = new Set();
  const out = [];
  for (const observation of observations) {
    const key = observation?.source?.independenceGroup;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(observation);
  }
  return out;
}

function supportRows(observations, field, bands) {
  const counts = new Map();
  for (const observation of observations) {
    for (const value of new Set(observation?.normalized?.[field] || [])) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  const denominator = observations.length || 1;
  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      independentObservationCount: count,
      prevalence: round(count / denominator),
      supportBand: supportBand(count / denominator, bands)
    }))
    .sort((a, b) => b.prevalence - a.prevalence || a.id.localeCompare(b.id));
}

export function quantitativeGroups(observations, { minimumIndependent = 3, maxRobustSpreadRatio = 4 } = {}) {
  const groups = new Map();
  for (const observation of observations) {
    for (const item of observation?.normalized?.quantitative || []) {
      if (![item.lower, item.upper].every(Number.isFinite)) continue;
      const key = [item.roleId, item.basis, item.unit].join("|");
      if (!groups.has(key)) groups.set(key, new Map());
      groups.get(key).set(observation.source.independenceGroup, {
        observationId: observation.observationId,
        lower: Number(item.lower),
        upper: Number(item.upper)
      });
    }
  }

  return [...groups.entries()].map(([key, byIndependence]) => {
    const [roleId, basis, unit] = key.split("|");
    const rows = [...byIndependence.values()];
    const midpoints = rows.map(row => (row.lower + row.upper) / 2);
    const observedRange = {
      lower: round(Math.min(...rows.map(row => row.lower))),
      upper: round(Math.max(...rows.map(row => row.upper)))
    };
    const q25 = quantile(midpoints, 0.25);
    const q50 = quantile(midpoints, 0.5);
    const q75 = quantile(midpoints, 0.75);
    const spreadRatio = q25 > 0 ? q75 / q25 : Number.POSITIVE_INFINITY;
    const stable =
      rows.length >= minimumIndependent &&
      Number.isFinite(spreadRatio) &&
      spreadRatio <= maxRobustSpreadRatio;
    return {
      roleId,
      basis,
      unit,
      independentObservationCount: rows.length,
      observedRange,
      robustCenter: q50 == null ? null : round(q50),
      recommendedRange: stable ? { lower: round(q25), upper: round(q75) } : null,
      robustSpreadRatio: Number.isFinite(spreadRatio) ? round(spreadRatio) : null,
      stableForPilot: stable,
      evidenceIds: rows.map(row => row.observationId).sort()
    };
  }).sort((a, b) =>
    a.roleId.localeCompare(b.roleId) ||
    a.basis.localeCompare(b.basis) ||
    a.unit.localeCompare(b.unit)
  );
}

function variantRows(observations, config) {
  const counts = new Map();
  for (const observation of observations) {
    for (const signal of new Set(observation?.normalized?.variantSignals || [])) {
      counts.set(signal, (counts.get(signal) || 0) + 1);
    }
  }
  return [...counts.entries()].map(([signal, count]) => {
    let state = "CANDIDATE_VARIANT";
    if (count >= config.variantPromotion.establishedIndependentObservations) state = "ESTABLISHED_VARIANT";
    else if (count >= config.variantPromotion.observedIndependentObservations) state = "OBSERVED_VARIANT";
    return { signal, independentObservationCount: count, state };
  }).sort((a, b) => b.independentObservationCount - a.independentObservationCount || a.signal.localeCompare(b.signal));
}

export function synthesizeFamily(allObservations, config, definition) {
  const familyRows = uniqueByIndependenceGroup(allObservations.filter(row => row.familyId === definition.familyId));
  const ingredients = supportRows(familyRows, "ingredientRoles", config.supportBands);
  const techniques = supportRows(familyRows, "techniques", config.supportBands);
  const quantities = quantitativeGroups(familyRows, definition.quantitativePolicy);

  const ingredientById = new Map(ingredients.map(row => [row.id, row]));
  const techniqueById = new Map(techniques.map(row => [row.id, row]));
  const requiredIngredientState = definition.requiredIngredientRoles.map(roleId => ({
    roleId,
    pass: (ingredientById.get(roleId)?.prevalence || 0) >= config.supportBands.CORE_SIGNAL_MIN,
    evidence: ingredientById.get(roleId) || null
  }));
  const requiredTechniqueState = definition.requiredTechniques.map(techniqueId => ({
    techniqueId,
    pass: (techniqueById.get(techniqueId)?.prevalence || 0) >= config.supportBands.CORE_SIGNAL_MIN,
    evidence: techniqueById.get(techniqueId) || null
  }));
  const requiredQuantityState = definition.requiredQuantitativeRoles.map(spec => {
    const candidates = quantities.filter(row =>
      row.roleId === spec.roleId &&
      spec.allowedBases.includes(row.basis) &&
      row.stableForPilot
    );
    const selected = candidates.sort((a, b) =>
      b.independentObservationCount - a.independentObservationCount ||
      a.robustSpreadRatio - b.robustSpreadRatio
    )[0] || null;
    return { roleId: spec.roleId, pass: Boolean(selected), selected };
  });

  const allAttributionReady = familyRows.every(row =>
    row.source.publicAttributionRequirement !== "REQUIRED" ||
    row.source.publicAttributionState === "READY"
  );
  const sourceExpressionPersisted = familyRows.some(row => row.source.sourceExpressionPersisted === true);
  const appAuthoringEligible =
    familyRows.length >= definition.minimumIndependentObservations &&
    requiredIngredientState.every(row => row.pass) &&
    requiredTechniqueState.every(row => row.pass) &&
    requiredQuantityState.every(row => row.pass) &&
    allAttributionReady &&
    !sourceExpressionPersisted;

  const candidateProjection = appAuthoringEligible
    ? definition.projectCandidate({
        requiredQuantityState,
        provenance: familyRows.map(row => row.observationId).sort()
      })
    : null;

  return {
    familyId: definition.familyId,
    independentObservationCount: familyRows.length,
    publisherCount: new Set(familyRows.map(row => row.source.publisherLedgerKey)).size,
    sourceRoleCounts: Object.fromEntries(
      [...familyRows.reduce((map, row) => map.set(row.source.role, (map.get(row.source.role) || 0) + 1), new Map()).entries()]
        .sort(([a], [b]) => a.localeCompare(b))
    ),
    referenceProfile: {
      requiredIngredientRoles: definition.requiredIngredientRoles,
      requiredTechniques: definition.requiredTechniques,
      ingredientSupport: ingredients.filter(row => row.supportBand === "CORE_SIGNAL"),
      techniqueSupport: techniques.filter(row => row.supportBand === "CORE_SIGNAL")
    },
    observedProfile: {
      ingredientSignals: ingredients,
      techniqueSignals: techniques,
      quantitativeRanges: quantities
    },
    variantProfile: variantRows(familyRows, config),
    gate: {
      requiredIngredientState,
      requiredTechniqueState,
      requiredQuantityState,
      allAttributionReady,
      sourceExpressionPersisted,
      appAuthoringEligible,
      terminal: appAuthoringEligible ? "APP_AUTHORING_ELIGIBLE" : "APP_AUTHORING_HOLD"
    },
    candidateAppOwnedRecipeProjection: candidateProjection,
    provenance: familyRows.map(row => ({
      observationId: row.observationId,
      publisher: row.source.publisher,
      sourceRole: row.source.role,
      sourceUrl: row.source.url,
      attributionRequirement: row.source.publicAttributionRequirement,
      attributionState: row.source.publicAttributionState,
      reuseBasis: row.source.reuseBasis
    }))
  };
}
