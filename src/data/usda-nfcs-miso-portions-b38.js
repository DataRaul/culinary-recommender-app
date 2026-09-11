// Bounded household-portion evidence from the official USDA 1977-78 Nationwide Food Consumption Survey coding manual.
// B38 is portion-only: it does not import historical composition into NutritionSource.
// The source directly publishes Soybean product: Miso, 1 tablespoon = 17 g edible portion.

export const USDA_NFCS_MISO_PORTION_SOURCE_B38 = Object.freeze({
  id: "usda-nfcs-1977-78-miso-portions-b38",
  authority: "U.S. Department of Agriculture",
  dataset: "Nationwide Food Consumption Survey 1977-78",
  report: "Coding Manual to Handle Data from Nationwide Survey of Individuals, Spring 1977-78",
  reportNumber: "CFE Admin. Report No. 352",
  surveyVintage: "1977-78",
  reportUrl: "https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/7778/cfe_admin_rep_352.pdf",
  licence: "U.S. federal government public-domain data",
  state: "BOUNDED_STATIC_REVIEWED_PORTION_EVIDENCE",
  role: "PORTION_EVIDENCE_ONLY",
  evidenceTranche: "B38",
  runtimeFetch: false,
  compositionUse: "PROHIBITED_IN_THIS_TRANCHE"
});

export const USDA_NFCS_MISO_PORTION_EVIDENCE_B38 = Object.freeze({
  miso: Object.freeze({
    canonicalIngredientId: "miso",
    sourceFoodDescription: "Soybean product: Miso",
    sourceFoodCode: "414-2011",
    acceptedUnits: Object.freeze(["tbsp"]),
    gramsPerUnit: 17,
    sourceMeasureAmount: 1,
    sourceMeasureUnit: "tablespoon",
    sourceMeasureGramWeight: 17,
    ediblePortionBasis: true,
    matchConfidence: "medium",
    evidenceState: "USDA_NFCS_1977_78_MISO_TABLESPOON_EXACT",
    sourceId: USDA_NFCS_MISO_PORTION_SOURCE_B38.id,
    evidenceTranche: "B38",
    reviewNotes: "The USDA coding manual directly lists Soybean product: Miso (food code 414-2011), 1 tablespoon = 17 g edible portion. The evidence is historical, so confidence remains medium. It is not generalized to miso sauce, another miso subtype, teaspoon/cup arithmetic, or composition."
  })
});

export function usdaNfcsMisoPortionConversionB38(ingredientId, unit) {
  const record = USDA_NFCS_MISO_PORTION_EVIDENCE_B38[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return {
    gramsPerUnit: record.gramsPerUnit,
    sourceMeasureAmount: record.sourceMeasureAmount,
    sourceMeasureUnit: record.sourceMeasureUnit,
    sourceMeasureGramWeight: record.sourceMeasureGramWeight,
    sourceFoodDescription: record.sourceFoodDescription,
    sourceFoodCode: record.sourceFoodCode,
    ediblePortionBasis: record.ediblePortionBasis,
    matchConfidence: record.matchConfidence,
    evidenceState: record.evidenceState,
    evidenceTranche: record.evidenceTranche
  };
}
