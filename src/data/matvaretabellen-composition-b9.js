// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// This tranche is composition-only and does not alter the separate B6 household-portion contract.
// Only exact reviewed food/form matches are bundled; missing values remain unknown and no generic-rice inference is allowed.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B9 = Object.freeze({
  id: "matvaretabellen-2026-composition-b9",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B9",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const basmatiRice = Object.freeze({
  canonicalIngredientId: "basmati_rice",
  foodId: "05.305",
  foodName: "Rice, Basmati, uncooked",
  scientificName: "Oryza sativa L.",
  foodEx2: "Rice grain, polished (A003D)",
  sourceUrl: "https://www.matvaretabellen.no/en/rice-basmati-uncooked/",
  matchConfidence: "high",
  matchNotes: "Exact basmati identity and uncooked/dried form. Authored recipes quantify basmati rice by dry grams before cooking; generic white-rice records are not substituted.",
  per100g: Object.freeze({
    energyKcal: 354,
    proteinG: 9.2,
    carbohydrateG: 76.8,
    fatG: 1.1,
    fibreG: 0.5
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1505 kJ / 354 kcal" }),
    proteinG: Object.freeze({ sourceCode: "209", valueType: "Average", acquisitionType: "In-house or affiliated laboratory", methodType: "Analytical results", method: "Analytical method" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", acquisitionType: "Value created within host system", methodType: "Summation from constituent components", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "209", valueType: "Average", acquisitionType: "In-house or affiliated laboratory", methodType: "Analytical results", method: "Analytical method" }),
    fibreG: Object.freeze({ sourceCode: "209", valueType: "Average", acquisitionType: "In-house or affiliated laboratory", methodType: "Analytical results", method: "Analytical method" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B9.id,
  evidenceTranche: "B9"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B9 = Object.freeze({
  basmati_rice: basmatiRice
});

export const matvaretabellenCompositionForIngredient = ingredientId => MATVARETABELLEN_COMPOSITION_DENSITIES_B9[ingredientId] || null;
