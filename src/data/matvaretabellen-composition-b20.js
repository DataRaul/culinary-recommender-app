// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B20 is composition-only: the source row's household portion and edible-part yield are deliberately not admitted as quantity evidence.
// The sole authored cod quantity is edible cod meat in grams and is cooked only after the ingredient is declared.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B20 = Object.freeze({
  id: "matvaretabellen-2026-composition-b20",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/cod-unspecified-raw/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B20",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const cod = Object.freeze({
  canonicalIngredientId: "cod",
  foodId: "04.327",
  foodName: "Cod, unspecified, raw",
  scientificName: "Gadus morhua Linnaeus, 1758",
  foodEx2: "Cod (A02BV)",
  foodForm: "EXACT_GENERIC_RAW_COD_EDIBLE_MEAT",
  matchConfidence: "high",
  matchNotes: "Exact generic raw cod identity. FoodEx2 marks the generic term unspecified; LanguaL classifies the edible food as cod skeletal meat without bone or skin, not heat-treated. Canonical cod explicitly includes cod fillet as an alias, and the sole authored use is 300 g in large pieces that are cooked only after declaration. This does not authorize wild/farmed qualifiers, cod slices, cooked, salted, dried, breaded or other processed cod identities.",
  per100g: Object.freeze({
    energyKcal: 79,
    proteinG: 17.7,
    carbohydrateG: 0.0,
    fatG: 0.9,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: "MI0115", valueType: "Published", method: "Published energy in 100 g: 335 kJ / 79 kcal" }),
    proteinG: Object.freeze({ sourceCode: "701G", valueType: "Weighted", method: "Value created within host system; aggregation of contributing values; analytical method" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "701G", valueType: "Weighted", method: "Value created within host system; aggregation of contributing values; analytical method" }),
    fibreG: Object.freeze({ sourceCode: "50", valueType: "Logical zero", method: "Estimated as a naturally occurring zero value, not analysed; logical deduction / imputation" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B20.id,
  evidenceTranche: "B20"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B20 = Object.freeze({ cod });

export const matvaretabellenCompositionB20ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B20[ingredientId] || null;
