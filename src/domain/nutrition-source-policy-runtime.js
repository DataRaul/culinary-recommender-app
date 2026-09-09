import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B26,
  MATVARETABELLEN_COMPOSITION_SOURCE_B26
} from "../data/matvaretabellen-composition-b26.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B27,
  MATVARETABELLEN_COMPOSITION_SOURCE_B27
} from "../data/matvaretabellen-composition-b27.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B28,
  MATVARETABELLEN_COMPOSITION_SOURCE_B28
} from "../data/matvaretabellen-composition-b28.js";
import {
  CIQUAL_RUNTIME_SOURCE_V1,
  EUROPEAN_PRIMARY_DENSITIES_V1 as BASE_EUROPEAN_PRIMARY_DENSITIES_V1,
  EUROPEAN_PRIMARY_POLICY_V1,
  europeanPrimaryPolicyCoverage as baseEuropeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient as selectBaseEuropeanPrimaryNutrient
} from "./nutrition-source-policy.js";

// Keep post-B25 evidence additions in a small additive runtime registry. The frozen
// historical policy module remains the baseline; every post-B25 standalone tranche
// must be disjoint from it and from other runtime tranches while preserving the same
// per-nutrient semantics.
const POST_B25_TRANCHES = Object.freeze([
  Object.freeze({
    key: "B26",
    countKey: "matvaretabellenB26SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B26,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B26
  }),
  Object.freeze({
    key: "B27",
    countKey: "matvaretabellenB27SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B27,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B27
  }),
  Object.freeze({
    key: "B28",
    countKey: "matvaretabellenB28SelectedCount",
    densities: MATVARETABELLEN_COMPOSITION_DENSITIES_B28,
    source: MATVARETABELLEN_COMPOSITION_SOURCE_B28
  })
]);

const seenIngredientIds = new Set(Object.keys(BASE_EUROPEAN_PRIMARY_DENSITIES_V1));
for (const tranche of POST_B25_TRANCHES) {
  const trancheIds = Object.keys(tranche.densities);
  const overlaps = trancheIds.filter(ingredientId => seenIngredientIds.has(ingredientId));
  if (overlaps.length) {
    throw new Error(`Matvaretabellen ${tranche.key} must remain a bounded no-overlap composition extension: ${overlaps.sort().join(", ")}`);
  }
  for (const ingredientId of trancheIds) seenIngredientIds.add(ingredientId);
}

const MATVARETABELLEN_FIELDS = {
  energyKcal: { field: "energyKcal", semantic: "ENERGY_MATVARETABELLEN_PUBLISHED" },
  proteinG: { field: "proteinG", semantic: "PROTEIN_MATVARETABELLEN" },
  carbohydrateG: { field: "carbohydrateG", semantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO" },
  fatG: { field: "fatG", semantic: "TOTAL_FAT" },
  fibreG: { field: "fibreG", semantic: "DIETARY_FIBRE_MATVARETABELLEN" }
};

const nutrientKeys = Object.keys(MATVARETABELLEN_FIELDS);
const finiteOrNull = value => typeof value === "number" && Number.isFinite(value) ? value : null;

const candidateFromTranche = (tranche, ingredientId, nutrientKey) => {
  const record = tranche.densities[ingredientId];
  const spec = MATVARETABELLEN_FIELDS[nutrientKey];
  if (!record || !spec) return null;
  const value = finiteOrNull(record.per100g?.[spec.field]);
  if (value === null) return null;
  const evidence = record.fieldEvidence?.[nutrientKey] || null;
  return {
    source: "matvaretabellen",
    sourceId: tranche.source.id,
    sourceIdentifier: record.foodId,
    evidenceTranche: record.evidenceTranche,
    value,
    semantic: spec.semantic,
    method: evidence?.method || "MATVARETABELLEN_PUBLISHED_VALUE",
    formConfidence: record.matchConfidence,
    fieldConfidence: null,
    description: record.foodName,
    matchNotes: record.matchNotes,
    scientificName: record.scientificName || null,
    sourceCodes: evidence?.sourceCode ? [evidence.sourceCode] : [],
    selectionReason: "ONLY_REVIEWED_SOURCE_AVAILABLE"
  };
};

const postBaselineCandidate = (ingredientId, nutrientKey) => {
  for (const tranche of POST_B25_TRANCHES) {
    const candidate = candidateFromTranche(tranche, ingredientId, nutrientKey);
    if (candidate) return candidate;
  }
  return null;
};

export const selectEuropeanPrimaryNutrient = (ingredientId, nutrientKey) =>
  selectBaseEuropeanPrimaryNutrient(ingredientId, nutrientKey) || postBaselineCandidate(ingredientId, nutrientKey);

const postBaselineDensityForIngredient = ingredientId => {
  const selections = Object.fromEntries(nutrientKeys.map(key => [key, postBaselineCandidate(ingredientId, key)]));
  if (!nutrientKeys.some(key => selections[key])) return null;
  return {
    per100g: Object.fromEntries(nutrientKeys.map(key => [key, selections[key]?.value ?? null])),
    provenanceByNutrient: Object.fromEntries(nutrientKeys.map(key => [key, selections[key] ? {
      source: selections[key].source,
      sourceId: selections[key].sourceId,
      sourceIdentifier: selections[key].sourceIdentifier,
      evidenceTranche: selections[key].evidenceTranche,
      semantic: selections[key].semantic,
      method: selections[key].method,
      selectionReason: selections[key].selectionReason,
      formConfidence: selections[key].formConfidence,
      fieldConfidence: selections[key].fieldConfidence,
      description: selections[key].description,
      matchNotes: selections[key].matchNotes,
      scientificName: selections[key].scientificName,
      sourceCodes: selections[key].sourceCodes
    } : null]))
  };
};

const postBaselineIngredientIds = POST_B25_TRANCHES.flatMap(tranche => Object.keys(tranche.densities));
const POST_B25_EUROPEAN_PRIMARY_DENSITIES = Object.fromEntries(
  postBaselineIngredientIds
    .map(ingredientId => [ingredientId, postBaselineDensityForIngredient(ingredientId)])
    .filter(([, record]) => record)
);

export const EUROPEAN_PRIMARY_DENSITIES_V1 = Object.freeze({
  ...BASE_EUROPEAN_PRIMARY_DENSITIES_V1,
  ...POST_B25_EUROPEAN_PRIMARY_DENSITIES
});

export const RUNTIME_MATVARETABELLEN_COMPOSITION_SOURCES = Object.freeze(
  POST_B25_TRANCHES.map(tranche => tranche.source)
);

export const europeanPrimaryPolicyCoverage = ingredientIds => {
  const unique = [...new Set((ingredientIds || []).filter(Boolean))];
  const base = baseEuropeanPrimaryPolicyCoverage(unique);
  const postSelections = unique.flatMap(ingredientId => nutrientKeys
    .map(nutrient => ({ ingredientId, nutrient, selection: postBaselineCandidate(ingredientId, nutrient) }))
    .filter(item => item.selection)
    .map(({ ingredientId: id, nutrient, selection }) => ({ ingredientId: id, nutrient, ...selection }))
  );
  const postEvidenceIngredientCount = unique.filter(ingredientId => Object.hasOwn(POST_B25_EUROPEAN_PRIMARY_DENSITIES, ingredientId)).length;
  const trancheCounts = Object.fromEntries(POST_B25_TRANCHES.map(tranche => [
    tranche.countKey,
    postSelections.filter(selection => selection.evidenceTranche === tranche.key).length
  ]));
  return {
    ...base,
    evidenceIngredientCount: base.evidenceIngredientCount + postEvidenceIngredientCount,
    matvaretabellenSelectedCount: base.matvaretabellenSelectedCount + postSelections.length,
    ...trancheCounts,
    selections: [...base.selections, ...postSelections]
  };
};

export { CIQUAL_RUNTIME_SOURCE_V1, EUROPEAN_PRIMARY_POLICY_V1 };
