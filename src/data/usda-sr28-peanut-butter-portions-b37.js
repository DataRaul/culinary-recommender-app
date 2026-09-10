// Bounded household-portion evidence from the official USDA SR28 food-group report.
// B37 is portion-only: it does not import SR28 composition into NutritionSource.
// The tablespoon conversion is admitted only because all four reviewed peanut-butter
// texture/salt variants publish the same 32 g per 2 tbsp household measure.

export const USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37 = Object.freeze({
  id: "usda-ars-sr28-peanut-butter-portions-b37",
  authority: "U.S. Department of Agriculture, Agricultural Research Service",
  dataset: "USDA National Nutrient Database for Standard Reference, Release 28",
  versionCurrent: "2016-05",
  reportEdition: "2015",
  reportUrl: "https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg16.pdf",
  archiveUrl: "https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/methods-and-application-of-food-composition-laboratory/mafcl-site-pages/sr11-sr28/",
  licence: "U.S. federal government public-domain data",
  state: "BOUNDED_STATIC_REVIEWED_PORTION_EVIDENCE",
  role: "PORTION_EVIDENCE_ONLY",
  evidenceTranche: "B37",
  runtimeFetch: false,
  compositionUse: "PROHIBITED_IN_THIS_TRANCHE"
});

export const USDA_SR28_PEANUT_BUTTER_VARIANTS_B37 = Object.freeze([
  Object.freeze({ ndbNumber: "16097", description: "Peanut butter, chunk style, with salt", measureAmount: 2, measureUnit: "tbsp", gramWeight: 32 }),
  Object.freeze({ ndbNumber: "16397", description: "Peanut butter, chunk style, without salt", measureAmount: 2, measureUnit: "tbsp", gramWeight: 32 }),
  Object.freeze({ ndbNumber: "16098", description: "Peanut butter, smooth style, with salt", measureAmount: 2, measureUnit: "tbsp", gramWeight: 32 }),
  Object.freeze({ ndbNumber: "16398", description: "Peanut butter, smooth style, without salt", measureAmount: 2, measureUnit: "tbsp", gramWeight: 32 })
]);

const gramsPerTablespoon = 16;

export const USDA_SR28_PEANUT_BUTTER_PORTION_EVIDENCE_B37 = Object.freeze({
  peanut_butter: Object.freeze({
    canonicalIngredientId: "peanut_butter",
    acceptedUnits: Object.freeze(["tbsp"]),
    gramsPerUnit: gramsPerTablespoon,
    sourceMeasureAmount: 2,
    sourceMeasureGramWeight: 32,
    sourceUnit: "tbsp",
    reviewedNdbNumbers: Object.freeze(USDA_SR28_PEANUT_BUTTER_VARIANTS_B37.map(item => item.ndbNumber)),
    reviewedVariantCount: USDA_SR28_PEANUT_BUTTER_VARIANTS_B37.length,
    matchConfidence: "high",
    evidenceState: "USDA_SR28_PEANUT_BUTTER_TABLESPOON_VARIANT_CONSENSUS",
    sourceId: USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.id,
    evidenceTranche: "B37",
    reviewNotes: "All four reviewed SR28 peanut-butter variants spanning chunk/smooth texture and with/without salt publish Measure 1 = 32 g: 2 tbsp. The conversion is therefore 16 g/tbsp. No cup conversion, composition value, neighboring nut-butter identity, teaspoon conversion, or unreviewed formulation claim is admitted."
  })
});

export function usdaSr28PeanutButterPortionConversionB37(ingredientId, unit) {
  const record = USDA_SR28_PEANUT_BUTTER_PORTION_EVIDENCE_B37[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return {
    gramsPerUnit: record.gramsPerUnit,
    sourceUnit: record.sourceUnit,
    sourceMeasureAmount: record.sourceMeasureAmount,
    sourceMeasureGramWeight: record.sourceMeasureGramWeight,
    reviewedNdbNumbers: [...record.reviewedNdbNumbers],
    reviewedVariantCount: record.reviewedVariantCount,
    matchConfidence: record.matchConfidence,
    evidenceState: record.evidenceState,
    evidenceTranche: record.evidenceTranche
  };
}
