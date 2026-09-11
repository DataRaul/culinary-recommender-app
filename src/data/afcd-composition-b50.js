// Bounded static composition evidence from the Australian Food Composition Database (AFCD), Release 3.
// B50 is composition-only. All six authored firm-tofu uses are gram-denominated as-purchased
// tofu inputs that are cut/cubed before authored cooking steps, so no household-unit or yield
// authority is introduced.

export const AFCD_COMPOSITION_SOURCE_B50 = Object.freeze({
  id: "afcd-release-3-composition-b50",
  authority: "Food Standards Australia New Zealand (FSANZ)",
  dataset: "Australian Food Composition Database, Release 3",
  releaseDate: "2025-12-23",
  website: "https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/search/food/F009176",
  foodGroupPage: "https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/search/food-groups/15/67",
  nutrientDefinitions: "https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/search/nutrients",
  licenseUrl: "https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement",
  license: "FSANZ Data User Licence Agreement based on Creative Commons Attribution-ShareAlike 3.0 Australia",
  requiredAttribution: "Australian Food Composition Database, Release 3. Food Standards Australia New Zealand (FSANZ).",
  limitationStatement: "Based on Australian data; Australian data may not be appropriate for use in other countries.",
  country: "Australia",
  region: "Oceania",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B50",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_AFCD_WITHOUT_SUGAR_ALCOHOLS"
});

const firmTofu = Object.freeze({
  canonicalIngredientId: "tofu_firm",
  foodId: "F009176",
  foodName: "Tofu (soy bean curd), firm, as purchased",
  foodGroup: "Meat substitutes",
  foodForm: "EXACT_FIRM_TOFU_AS_PURCHASED",
  derivation: "Analysed",
  matchConfidence: "high",
  matchNotes: "AFCD Release 3 explicitly identifies F009176 as firm tofu, as purchased. The source description covers commercially prepared soy-bean extract set to a firm texture using glucono-delta lactone and nigari (magnesium chloride) or calcium salts, resolving the earlier coagulant-specific-source mismatch. Repository canonical tofu_firm is explicitly firm tofu, and all six authored uses are direct gram inputs subsequently cubed before cooking. B50 does not authorize silken/soft tofu, smoked/flavoured tofu, cooked tofu, tofu skin, another soy product, household-unit conversion or cooked-yield conversion.",
  per100g: Object.freeze({
    energyKcal: 129.3,
    proteinG: 12.8,
    carbohydrateG: 0,
    fatG: 8.3,
    fibreG: 1.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({
      sourceCode: "ENERGY_WITH_DIETARY_FIBRE",
      valueType: "Converted from published AFCD energy",
      publishedValue: "543 kJ/100 g",
      method: "AFCD publishes 543 kJ/100 g energy with dietary fibre; converted deterministically using AFCD's stated approximation 1 kcal = 4.2 kJ (543 / 4.2 = 129.2857..., stored as 129.3 kcal)."
    }),
    proteinG: Object.freeze({ sourceCode: "PROTEIN", valueType: "Published", method: "AFCD Release 3 published value" }),
    carbohydrateG: Object.freeze({ sourceCode: "AVAILABLE_CARBOHYDRATE_WITHOUT_SUGAR_ALCOHOLS", valueType: "Published", method: "AFCD Release 3 available carbohydrate without sugar alcohols" }),
    fatG: Object.freeze({ sourceCode: "FAT_TOTAL", valueType: "Published", method: "AFCD Release 3 published total fat" }),
    fibreG: Object.freeze({ sourceCode: "DIETARY_FIBRE", valueType: "Published", method: "AFCD Release 3 published dietary fibre" })
  }),
  evidenceState: "AFCD_RELEASE_3_EXACT_FIRM_TOFU_COMPOSITION_MATCH",
  sourceId: AFCD_COMPOSITION_SOURCE_B50.id,
  evidenceTranche: "B50"
});

export const AFCD_COMPOSITION_DENSITIES_B50 = Object.freeze({ tofu_firm: firmTofu });

export const afcdCompositionB50ForIngredient = ingredientId =>
  AFCD_COMPOSITION_DENSITIES_B50[ingredientId] || null;
