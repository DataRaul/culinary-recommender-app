// Bounded quantity evidence from USDA FoodData Central SR Legacy final release.
// This module is portion-only: it does not import SR Legacy composition into NutritionSource.
export const USDA_SR_LEGACY_PORTION_SOURCE_B8 = Object.freeze({
  id: "usda-fdc-sr-legacy-2018-04-portions-b8",
  name: "USDA FoodData Central — SR Legacy portions",
  dataset: "SR Legacy final release",
  releaseDate: "2018-04",
  archive: "FoodData_Central_sr_legacy_food_csv_2018-04.zip",
  sourceUrl: "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip",
  licence: "CC0-1.0 / U.S. public domain",
  state: "BOUNDED_STATIC_PORTION_EVIDENCE_IMPORTED",
  evidenceTranche: "B8",
  runtimeFetch: false,
  compositionUse: "PROHIBITED_IN_THIS_TRANCHE"
});

export const USDA_SR_LEGACY_PORTION_EVIDENCE_B8 = Object.freeze({
  onion: Object.freeze({
    canonicalIngredientId: "onion",
    fdcId: "170000",
    ndbNumber: "11282",
    description: "Onions, raw",
    portionRowId: "85862",
    amount: 1,
    gramWeight: 70,
    modifier: "small",
    acceptedUnits: Object.freeze(["small"]),
    matchConfidence: "high",
    evidenceState: "USDA_SR_LEGACY_PORTION_MATCH",
    sourceId: USDA_SR_LEGACY_PORTION_SOURCE_B8.id,
    evidenceTranche: "B8",
    reviewNotes: "Exact official SR Legacy row explicitly labels the portion 'small'. No diameter inference, generic-piece substitution, or averaging is used."
  })
});

export function usdaSrLegacyPortionConversion(ingredientId, unit) {
  const record = USDA_SR_LEGACY_PORTION_EVIDENCE_B8[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return {
    gramsPerUnit: record.gramWeight / record.amount,
    sourceUnit: record.modifier,
    modifier: record.modifier,
    fdcId: record.fdcId,
    ndbNumber: record.ndbNumber,
    portionRowId: record.portionRowId,
    evidenceState: record.evidenceState,
    evidenceTranche: record.evidenceTranche
  };
}
