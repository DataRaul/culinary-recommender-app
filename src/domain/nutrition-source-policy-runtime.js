import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B26,
  MATVARETABELLEN_COMPOSITION_SOURCE_B26
} from "../data/matvaretabellen-composition-b26.js";
import {
  CIQUAL_RUNTIME_SOURCE_V1,
  EUROPEAN_PRIMARY_DENSITIES_V1 as BASE_EUROPEAN_PRIMARY_DENSITIES_V1,
  EUROPEAN_PRIMARY_POLICY_V1,
  europeanPrimaryPolicyCoverage as baseEuropeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient as selectBaseEuropeanPrimaryNutrient
} from "./nutrition-source-policy.js";

// Keep post-B25 evidence additions in a small additive runtime registry. The frozen
// historical policy module remains the baseline; every post-B25 standalone tranche
// must be disjoint from it and must preserve the same per-nutrient semantics.
const b26Ids = Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B26);
const overlappingB26Ids = b26Ids.filter(ingredientId =>
  Object.hasOwn(BASE_EUROPEAN_PRIMARY_DENSITIES_V1, ingredientId)
);
if (overlappingB26Ids.length) {
  throw new Error(`Matvaretabellen B26 must remain a bounded no-overlap composition extension: ${overlappingB26Ids.sort().join(", ")}`);
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

const b26Candidate = (ingredientId, nutrientKey) => {
  const record = MATVARETABELLEN_COMPOSITION_DENSITIES_B26[ingredientId];
  const spec = MATVARETABELLEN_FIELDS[nutrientKey];
  if (!record || !spec) return null;
  const value = finiteOrNull(record.per100g?.[spec.field]);
  if (value === null) return null;
  const evidence = record.fieldEvidence?.[nutrientKey] || null;
  return {
    source: "matvaretabellen",
    sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B26.id,
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

export const selectEuropeanPrimaryNutrient = (ingredientId, nutrientKey) =>
  selectBaseEuropeanPrimaryNutrient(ingredientId, nutrientKey) || b26Candidate(ingredientId, nutrientKey);

const b26DensityForIngredient = ingredientId => {
  const selections = Object.fromEntries(nutrientKeys.map(key => [key, b26Candidate(ingredientId, key)]));
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

const B26_EUROPEAN_PRIMARY_DENSITIES = Object.fromEntries(
  b26Ids
    .map(ingredientId => [ingredientId, b26DensityForIngredient(ingredientId)])
    .filter(([, record]) => record)
);

export const EUROPEAN_PRIMARY_DENSITIES_V1 = Object.freeze({
  ...BASE_EUROPEAN_PRIMARY_DENSITIES_V1,
  ...B26_EUROPEAN_PRIMARY_DENSITIES
});

export const europeanPrimaryPolicyCoverage = ingredientIds => {
  const unique = [...new Set((ingredientIds || []).filter(Boolean))];
  const base = baseEuropeanPrimaryPolicyCoverage(unique);
  const b26Selections = unique.flatMap(ingredientId => nutrientKeys
    .map(nutrient => ({ ingredientId, nutrient, selection: b26Candidate(ingredientId, nutrient) }))
    .filter(item => item.selection)
    .map(({ ingredientId: id, nutrient, selection }) => ({ ingredientId: id, nutrient, ...selection }))
  );
  const b26EvidenceIngredientCount = unique.filter(ingredientId => Object.hasOwn(B26_EUROPEAN_PRIMARY_DENSITIES, ingredientId)).length;
  return {
    ...base,
    evidenceIngredientCount: base.evidenceIngredientCount + b26EvidenceIngredientCount,
    matvaretabellenSelectedCount: base.matvaretabellenSelectedCount + b26Selections.length,
    matvaretabellenB26SelectedCount: b26Selections.length,
    selections: [...base.selections, ...b26Selections]
  };
};

export { CIQUAL_RUNTIME_SOURCE_V1, EUROPEAN_PRIMARY_POLICY_V1 };
