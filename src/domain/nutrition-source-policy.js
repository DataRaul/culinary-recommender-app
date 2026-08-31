import { CIQUAL_2025_SOURCE, CIQUAL_DENSITIES_B4 } from "../data/ciqual-nutrients-b4.js";
import {
  USDA_FOUNDATION_DENSITIES,
  USDA_FOUNDATION_SOURCE,
  nutritionEvidenceForIngredient
} from "../data/nutrition-evidence.js";

const CIQUAL_CANONICAL_ALIASES = {
  egg: "eggs",
  mushrooms: "mushroom",
  yogurt: "greek_yogurt"
};

export const CIQUAL_CANONICAL_DENSITIES = Object.fromEntries(
  Object.entries(CIQUAL_DENSITIES_B4).map(([id, record]) => [CIQUAL_CANONICAL_ALIASES[id] || id, record])
);

export const EUROPEAN_PRIMARY_POLICY_V1 = {
  id: "european-primary-v1",
  context: "CANARY_ISLANDS_SPAIN_EUROPE",
  principle: "Prefer reviewed European composition when food-form match is equally good or better and constituent evidence is sufficient; otherwise retain the stronger available source.",
  geographyTieBreak: "EUROPEAN_SOURCE_WINS_EQUAL_FORM_MATCH_WHEN_CIQUAL_FIELD_CONFIDENCE_IS_A_B_OR_C",
  dConfidenceRule: "CIQUAL_D_DOES_NOT_DISPLACE_AVAILABLE_USDA_BUT_MAY_BE_USED_WHEN_IT_IS_THE_ONLY_REVIEWED_SOURCE",
  carbohydrateRule: "USDA_CARBOHYDRATE_BY_DIFFERENCE_AND_CIQUAL_CHOAVL_ARE_DISTINCT_SEMANTICS_AND_MUST_NOT_BE_SUMMED_IN_ONE_AUTHORITATIVE_RECIPE_TOTAL",
  averaging: "PROHIBITED",
  regulatoryEvidence: "SEPARATE_FROM_COMPOSITION",
  medicalPersonalization: "PROHIBITED"
};

const formRank = confidence => ({ high: 3, medium: 2, low: 1 }[confidence] || 0);
const ciqualFieldGoodEnoughToDisplace = confidence => ["A", "B", "C"].includes(confidence);

const USDA_FIELDS = {
  energyKcal: { field: "energyKcal", semantic: "ENERGY_ATWATER_FOUNDATION", method: "USDA_FOUNDATION_ATWATER" },
  proteinG: { field: "proteinG", semantic: "PROTEIN_USDA_FOUNDATION", method: "USDA_FOUNDATION" },
  carbohydrateG: { field: "carbohydrateG", semantic: "CARBOHYDRATE_BY_DIFFERENCE_USDA_1005", method: "USDA_1005_BY_DIFFERENCE" },
  fatG: { field: "fatG", semantic: "TOTAL_FAT", method: "USDA_FOUNDATION" },
  fibreG: { field: "fibreG", semantic: "DIETARY_FIBRE_USDA_1079", method: "USDA_1079" }
};

const CIQUAL_FIELDS = {
  energyKcal: { field: "energyEu1169Kcal", confidenceField: "energyEu1169Kcal", semantic: "ENERGY_EU_1169_2011", method: "CIQUAL_EU_1169_2011" },
  proteinG: { field: "proteinJonesG", confidenceField: "proteinJonesG", semantic: "PROTEIN_CIQUAL_JONES", method: "CIQUAL_JONES" },
  carbohydrateG: { field: "carbohydrateAvailableG", confidenceField: "carbohydrateAvailableG", semantic: "AVAILABLE_CARBOHYDRATE_CIQUAL_CHOAVL", method: "CIQUAL_CHOAVL" },
  fatG: { field: "fatG", confidenceField: "fatG", semantic: "TOTAL_FAT", method: "CIQUAL" },
  fibreG: { field: "fibreG", confidenceField: "fibreG", semantic: "DIETARY_FIBRE_CIQUAL", method: "CIQUAL" }
};

const finiteOrNull = value => typeof value === "number" && Number.isFinite(value) ? value : null;

const sourceCandidate = (ingredientId, nutrientKey, source) => {
  if (source === "ciqual") {
    const record = CIQUAL_CANONICAL_DENSITIES[ingredientId];
    if (!record) return null;
    const spec = CIQUAL_FIELDS[nutrientKey];
    const value = finiteOrNull(record.per100g?.[spec.field]);
    if (value === null) return null;
    const fieldConfidence = record.confidenceCodes?.[spec.confidenceField] || null;
    return {
      source: "ciqual",
      sourceId: CIQUAL_2025_SOURCE.id,
      sourceIdentifier: record.alimCode,
      value,
      semantic: spec.semantic,
      method: spec.method,
      formConfidence: record.matchConfidence,
      fieldConfidence,
      description: record.nameEn,
      matchNotes: record.matchNotes,
      scientificName: record.scientificName || null,
      sourceCodes: record.sourceCodes || []
    };
  }

  const record = USDA_FOUNDATION_DENSITIES[ingredientId];
  if (!record) return null;
  const spec = USDA_FIELDS[nutrientKey];
  const value = finiteOrNull(record.per100g?.[spec.field]);
  if (value === null) return null;
  const identity = nutritionEvidenceForIngredient(ingredientId);
  return {
    source: "usda",
    sourceId: USDA_FOUNDATION_SOURCE.id,
    sourceIdentifier: record.fdcId,
    value,
    semantic: spec.semantic,
    method: spec.method,
    formConfidence: identity?.matchConfidence || "medium",
    fieldConfidence: null,
    description: record.description,
    matchNotes: identity?.notes || null,
    scientificName: null,
    sourceCodes: []
  };
};

export const selectEuropeanPrimaryNutrient = (ingredientId, nutrientKey) => {
  const usda = sourceCandidate(ingredientId, nutrientKey, "usda");
  const ciqual = sourceCandidate(ingredientId, nutrientKey, "ciqual");
  if (!usda && !ciqual) return null;
  if (!usda) return { ...ciqual, selectionReason: "ONLY_REVIEWED_SOURCE_AVAILABLE" };
  if (!ciqual) return { ...usda, selectionReason: "ONLY_REVIEWED_SOURCE_AVAILABLE" };

  const ciqualFormRank = formRank(ciqual.formConfidence);
  const usdaFormRank = formRank(usda.formConfidence);
  if (ciqualFormRank > usdaFormRank && ciqualFieldGoodEnoughToDisplace(ciqual.fieldConfidence)) {
    return { ...ciqual, selectionReason: "EUROPEAN_FORM_MATCH_STRONGER" };
  }
  if (ciqualFormRank === usdaFormRank && ciqualFieldGoodEnoughToDisplace(ciqual.fieldConfidence)) {
    return { ...ciqual, selectionReason: "EUROPEAN_GEOGRAPHY_TIE_BREAK" };
  }
  return {
    ...usda,
    selectionReason: ciqualFormRank < usdaFormRank
      ? "USDA_FORM_MATCH_STRONGER"
      : ciqual.fieldConfidence === "D"
        ? "CIQUAL_D_CONFIDENCE_DOES_NOT_DISPLACE_USDA"
        : "USDA_RETAINED_BY_CONSERVATIVE_POLICY"
  };
};

export const europeanPrimaryDensityForIngredient = ingredientId => {
  const nutrientKeys = ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"];
  const selections = Object.fromEntries(nutrientKeys.map(key => [key, selectEuropeanPrimaryNutrient(ingredientId, key)]));
  if (!nutrientKeys.some(key => selections[key])) return null;
  return {
    per100g: Object.fromEntries(nutrientKeys.map(key => [key, selections[key]?.value ?? null])),
    provenanceByNutrient: Object.fromEntries(nutrientKeys.map(key => [key, selections[key] ? {
      source: selections[key].source,
      sourceId: selections[key].sourceId,
      sourceIdentifier: selections[key].sourceIdentifier,
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

export const EUROPEAN_PRIMARY_DENSITIES_V1 = Object.fromEntries(
  [...new Set([...Object.keys(USDA_FOUNDATION_DENSITIES), ...Object.keys(CIQUAL_CANONICAL_DENSITIES)])]
    .map(ingredientId => [ingredientId, europeanPrimaryDensityForIngredient(ingredientId)])
    .filter(([, record]) => record)
);

export const europeanPrimaryPolicyCoverage = ingredientIds => {
  const unique = [...new Set((ingredientIds || []).filter(Boolean))];
  const records = unique.map(ingredientId => ({ ingredientId, record: EUROPEAN_PRIMARY_DENSITIES_V1[ingredientId] || null }));
  const selections = records.flatMap(({ ingredientId, record }) => Object.entries(record?.provenanceByNutrient || {})
    .filter(([, provenance]) => provenance)
    .map(([nutrient, provenance]) => ({ ingredientId, nutrient, ...provenance })));
  return {
    policy: EUROPEAN_PRIMARY_POLICY_V1,
    ingredientCount: unique.length,
    evidenceIngredientCount: records.filter(item => item.record).length,
    ciqualSelectedCount: selections.filter(item => item.source === "ciqual").length,
    usdaSelectedCount: selections.filter(item => item.source === "usda").length,
    selections
  };
};
