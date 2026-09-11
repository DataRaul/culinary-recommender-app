// Bounded household-portion evidence from USDA National Nutrient Database for Standard Reference, Release 28.
// B49 is portion-only. It uses the exact ready-to-serve fish-sauce row and imports no SR28 composition.

export const USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49 = Object.freeze({
  id: "usda-sr28-fish-sauce-portions-b49",
  authority: "U.S. Department of Agriculture, Agricultural Research Service",
  dataset: "USDA National Nutrient Database for Standard Reference, Release 28",
  releaseDate: "2015-09",
  officialArchiveUrl: "https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/methods-and-application-of-food-composition-laboratory/mafcl-site-pages/sr11-sr28/",
  reportUrl: "https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg06.pdf",
  state: "BOUNDED_STATIC_PORTION_EVIDENCE_BUNDLED",
  evidenceTranche: "B49",
  runtimeFetch: false,
  compositionImported: false,
  notes: "Only NDB 06179 Sauce, fish, ready-to-serve Measure 1 = 18 g: 1 tbsp is admitted. No SR28 nutrient composition or neighboring sauce identity is imported."
});

const fishSauceTablespoon = Object.freeze({
  canonicalIngredientId: "fish_sauce",
  ndbNumber: "06179",
  sourceFoodDescription: "Sauce, fish, ready-to-serve",
  sourceMeasureAmount: 1,
  sourceMeasureUnit: "tbsp",
  sourceMeasureGramWeight: 18,
  gramsPerUnit: 18,
  acceptedUnits: Object.freeze(["tbsp"]),
  matchConfidence: "high",
  matchNotes: "Direct ready-to-serve fish-sauce identity and direct tablespoon household measure. No teaspoon/cup arithmetic and no neighboring sauce identity is inferred.",
  evidenceState: "USDA_SR28_EXACT_FISH_SAUCE_TABLESPOON_MATCH",
  sourceId: USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.id,
  evidenceTranche: "B49"
});

export const USDA_SR28_FISH_SAUCE_PORTIONS_B49 = Object.freeze({ fish_sauce: fishSauceTablespoon });

export function usdaSr28FishSaucePortionConversionB49(ingredientId, unit) {
  const record = USDA_SR28_FISH_SAUCE_PORTIONS_B49[ingredientId];
  if (!record || !record.acceptedUnits.includes(String(unit || "").toLowerCase())) return null;
  return record;
}
