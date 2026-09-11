// Bounded household-portion evidence from the official USDA SR28 fats/oils report.
// B41 is portion-only: it does not import SR28 composition into NutritionSource.
// The source directly publishes Oil, sesame, salad or cooking (NDB 04058), Measure 3 = 4.5 g: 1 tsp.

export const USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41 = Object.freeze({
  id: "usda-ars-sr28-sesame-oil-portions-b41",
  authority: "U.S. Department of Agriculture, Agricultural Research Service",
  dataset: "USDA National Nutrient Database for Standard Reference, Release 28",
  versionCurrent: "2016-05",
  reportEdition: "2015",
  reportUrl: "https://www.ars.usda.gov/SP2UserFiles/Place/80400525/Data/SR/SR28/reports/sr28fg04.pdf",
  archiveUrl: "https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/methods-and-application-of-food-composition-laboratory/mafcl-site-pages/sr11-sr28/",
  licence: "U.S. federal government public-domain data",
  state: "BOUNDED_STATIC_REVIEWED_PORTION_EVIDENCE",
  role: "PORTION_EVIDENCE_ONLY",
  evidenceTranche: "B41",
  runtimeFetch: false,
  compositionUse: "PROHIBITED_IN_THIS_TRANCHE"
});

export const USDA_SR28_SESAME_OIL_PORTION_EVIDENCE_B41 = Object.freeze({
  sesame_oil: Object.freeze({
    canonicalIngredientId: "sesame_oil",
    sourceFoodDescription: "Oil, sesame, salad or cooking",
    ndbNumber: "04058",
    acceptedUnits: Object.freeze(["tsp"]),
    gramsPerUnit: 4.5,
    sourceMeasureAmount: 1,
    sourceMeasureUnit: "tsp",
    sourceMeasureGramWeight: 4.5,
    matchConfidence: "medium",
    evidenceState: "USDA_SR28_SESAME_OIL_TEASPOON_DIRECT",
    sourceId: USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.id,
    evidenceTranche: "B41",
    reviewNotes: "SR28 directly publishes Oil, sesame, salad or cooking (NDB 04058), Measure 3 = 4.5 g: 1 tsp. Canonical sesame_oil is generic, so the source's salad-or-cooking qualifier is preserved at medium confidence rather than treated as a universal formulation claim. B41 admits only the authored teaspoon unit and imports no SR28 composition or neighboring-oil identity."
  })
});

export function usdaSr28SesameOilPortionConversionB41(ingredientId, unit) {
  const record = USDA_SR28_SESAME_OIL_PORTION_EVIDENCE_B41[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return {
    gramsPerUnit: record.gramsPerUnit,
    sourceMeasureAmount: record.sourceMeasureAmount,
    sourceMeasureUnit: record.sourceMeasureUnit,
    sourceMeasureGramWeight: record.sourceMeasureGramWeight,
    sourceFoodDescription: record.sourceFoodDescription,
    ndbNumber: record.ndbNumber,
    matchConfidence: record.matchConfidence,
    evidenceState: record.evidenceState,
    evidenceTranche: record.evidenceTranche
  };
}
