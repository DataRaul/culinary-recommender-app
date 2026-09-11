// Bounded household-portion evidence from the pinned USDA FoodData Central
// Foundation Foods Version 15.0 / 2026-04-30 extract already reviewed in B3.
// B42 is a later conversion-policy review only: it does not modify B3 history or
// import any new composition. The exact source row is Onions, red, raw
// (FDC 790577 / NDB 100252), 1 Onion, Edible = 197 g.

export const USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42 = Object.freeze({
  id: "usda-fdc-foundation-2026-04-red-onion-portions-b42",
  authority: "U.S. Department of Agriculture, Agricultural Research Service",
  dataset: "USDA FoodData Central — Foundation Foods",
  releaseDate: "2026-04-30",
  releaseVersion: "15.0",
  archive: "FoodData_Central_foundation_food_csv_2026-04-30.zip",
  sourceUrl: "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip",
  licence: "CC0-1.0 / U.S. public domain",
  state: "BOUNDED_STATIC_REVIEWED_PORTION_EVIDENCE",
  role: "PORTION_EVIDENCE_ONLY",
  evidenceTranche: "B42",
  runtimeFetch: false,
  compositionUse: "PROHIBITED_IN_THIS_TRANCHE"
});

export const USDA_FOUNDATION_RED_ONION_PORTION_EVIDENCE_B42 = Object.freeze({
  red_onion: Object.freeze({
    canonicalIngredientId: "red_onion",
    fdcId: "790577",
    ndbNumber: "100252",
    sourceFoodDescription: "Onions, red, raw",
    acceptedUnits: Object.freeze(["piece", "pieces"]),
    gramsPerUnit: 197,
    sourceMeasureAmount: 1,
    sourceMeasureUnit: "Onion",
    sourceModifier: "Edible",
    sourceMeasureGramWeight: 197,
    dataPoints: 30,
    minYearAcquired: 2019,
    matchConfidence: "medium",
    evidenceState: "USDA_FOUNDATION_RED_ONION_PIECE_DIRECT_B42",
    sourceId: USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.id,
    evidenceTranche: "B42",
    reviewNotes: "The pinned Foundation row is exact red onion, raw, and directly publishes one edible Onion = 197 g. Canonical red_onion is also exact red onion and authored 'piece' is unqualified by size; the source measure is likewise unqualified by size, so B42 does not choose among competing size labels. Medium confidence preserves natural piece-weight variability. This promotion follows the later B6 policy precedent that a direct unqualified source piece can serve an unqualified authored piece while explicit size labels remain separate."
  })
});

export function usdaFoundationRedOnionPortionConversionB42(ingredientId, unit) {
  const record = USDA_FOUNDATION_RED_ONION_PORTION_EVIDENCE_B42[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return {
    gramsPerUnit: record.gramsPerUnit,
    sourceMeasureAmount: record.sourceMeasureAmount,
    sourceMeasureUnit: record.sourceMeasureUnit,
    sourceModifier: record.sourceModifier,
    sourceMeasureGramWeight: record.sourceMeasureGramWeight,
    sourceFoodDescription: record.sourceFoodDescription,
    fdcId: record.fdcId,
    ndbNumber: record.ndbNumber,
    dataPoints: record.dataPoints,
    minYearAcquired: record.minYearAcquired,
    matchConfidence: record.matchConfidence,
    evidenceState: record.evidenceState,
    evidenceTranche: record.evidenceTranche
  };
}
