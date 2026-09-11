// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B47 is composition-only. The sole authored tempeh use is gram-denominated, so no
// household-unit, edible-yield or cooked-yield authority is introduced.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B47 = Object.freeze({
  id: "matvaretabellen-2026-composition-b47",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/tempeh-soy-bean-product/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B47",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const tempeh = Object.freeze({
  canonicalIngredientId: "tempeh",
  foodId: "06.685",
  foodName: "Tempeh soy bean product",
  foodEx2: "Fermented soyabean-based meat imitates (A16RC)",
  foodForm: "EXACT_TEMPEH_SOYBEAN_PRODUCT",
  matchConfidence: "high",
  matchNotes: "The official source food is explicitly named Tempeh soy bean product and directly matches canonical tempeh. The sole authored use is 280 g canonical tempeh with no narrower smoked, flavoured, cooked or other product-state qualifier. B47 does not authorize tofu, textured soy protein, smoked tempeh, another fermented-soy product, household-unit conversion or cooked-yield conversion.",
  per100g: Object.freeze({
    energyKcal: 209,
    proteinG: 20.3,
    carbohydrateG: 5.5,
    fatG: 10.8,
    fibreG: 4.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ valueType: "Published", method: "Published energy in 100 g: 873 kJ / 209 kcal" }),
    proteinG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Food composition table value; source 460h references USDA FoodData Central 2019" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Food composition table value; source 460h references USDA FoodData Central 2019" }),
    fibreG: Object.freeze({ sourceCode: "450d", valueType: "Best estimate", method: "Food composition table value; source 450d references the FDNC extended dataset" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B47.id,
  evidenceTranche: "B47"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B47 = Object.freeze({ tempeh });

export const matvaretabellenCompositionB47ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B47[ingredientId] || null;
