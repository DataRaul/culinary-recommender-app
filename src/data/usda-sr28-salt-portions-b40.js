// Bounded household-portion evidence from the official USDA SR28 spices/herbs report.
// B40 is portion-only: it does not import SR28 composition into NutritionSource.
// The source directly publishes Salt, table (NDB 02047), Measure 1 = 6.0 g: 1 tsp.

export const USDA_SR28_SALT_PORTION_SOURCE_B40 = Object.freeze({
  id: "usda-ars-sr28-salt-portions-b40",
  authority: "U.S. Department of Agriculture, Agricultural Research Service",
  dataset: "USDA National Nutrient Database for Standard Reference, Release 28",
  versionCurrent: "2016-05",
  reportEdition: "2015",
  reportUrl: "https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg02.pdf",
  archiveUrl: "https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/methods-and-application-of-food-composition-laboratory/mafcl-site-pages/sr11-sr28/",
  licence: "U.S. federal government public-domain data",
  state: "BOUNDED_STATIC_REVIEWED_PORTION_EVIDENCE",
  role: "PORTION_EVIDENCE_ONLY",
  evidenceTranche: "B40",
  runtimeFetch: false,
  compositionUse: "PROHIBITED_IN_THIS_TRANCHE"
});

export const USDA_SR28_SALT_PORTION_EVIDENCE_B40 = Object.freeze({
  salt: Object.freeze({
    canonicalIngredientId: "salt",
    sourceFoodDescription: "Salt, table",
    ndbNumber: "02047",
    acceptedUnits: Object.freeze(["tsp"]),
    gramsPerUnit: 6,
    sourceMeasureAmount: 1,
    sourceMeasureUnit: "tsp",
    sourceMeasureGramWeight: 6,
    matchConfidence: "medium",
    evidenceState: "USDA_SR28_TABLE_SALT_TEASPOON_DIRECT",
    sourceId: USDA_SR28_SALT_PORTION_SOURCE_B40.id,
    evidenceTranche: "B40",
    reviewNotes: "SR28 directly publishes Salt, table (NDB 02047), Measure 1 = 6.0 g: 1 tsp. Canonical salt remains broader than table salt, so confidence is medium and the narrower source form is preserved. B40 authorizes only the authored teaspoon use; it does not generalize to sea/mineral/herbal salt, tablespoon/cup arithmetic, or SR28 composition."
  })
});

export function usdaSr28SaltPortionConversionB40(ingredientId, unit) {
  const record = USDA_SR28_SALT_PORTION_EVIDENCE_B40[ingredientId];
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
