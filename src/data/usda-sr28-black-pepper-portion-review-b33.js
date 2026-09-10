// Bounded review evidence from the official USDA National Nutrient Database
// for Standard Reference, Release 28 (2015). B33 records the exact competing
// teaspoon measures for black pepper and deliberately grants no runtime
// conversion because the authored canonical uses do not specify ground vs whole.

export const USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33 = Object.freeze({
  id: "usda-sr28-black-pepper-portion-review-b33",
  authority: "U.S. Department of Agriculture, Agricultural Research Service",
  dataset: "USDA National Nutrient Database for Standard Reference, Release 28",
  releaseDate: "2015-09",
  sourceUrl: "https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg02.pdf",
  ndbNumber: "02030",
  foodName: "Spices, pepper, black",
  scientificName: "Piper nigrum",
  license: "U.S. public domain",
  state: "REVIEWED_AMBIGUOUS_NOT_RUNTIME_ELIGIBLE",
  evidenceTranche: "B33",
  runtimeFetch: false,
  compositionUse: "PROHIBITED_IN_THIS_TRANCHE",
  quantityAuthority: "WITHHELD_UNTIL_AUTHORED_FORM_IS_EXPLICIT"
});

export const USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33 = Object.freeze({
  canonicalIngredientId: "black_pepper",
  ndbNumber: "02030",
  foodName: "Spices, pepper, black",
  acceptedInputUnit: "tsp",
  candidates: Object.freeze([
    Object.freeze({ sourceMeasure: "1 tsp, ground", amount: 1, gramWeight: 2.3, form: "ground" }),
    Object.freeze({ sourceMeasure: "1 tsp, whole", amount: 1, gramWeight: 2.9, form: "whole" })
  ]),
  decision: "HOLD_FORM_AMBIGUITY",
  runtimeEligible: false,
  reason: "The official source publishes two different one-teaspoon masses for the same black-pepper identity: 2.3 g ground and 2.9 g whole. Current authored black_pepper teaspoon inputs do not encode ground/whole form, so selecting either mass would manufacture form precision.",
  evidenceTranche: "B33"
});

export function usdaSr28BlackPepperPortionReviewB33(ingredientId, unit) {
  if (ingredientId !== "black_pepper" || String(unit || "").toLowerCase() !== "tsp") return null;
  return USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33;
}
