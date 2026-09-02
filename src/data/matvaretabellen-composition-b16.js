// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// This tranche is composition-only and does not alter the separate B6/B15 household-portion contracts.
// Only the exact reviewed sesame paste/tahini food identity is bundled; no sesame seed, generic sesame butter,
// sweetened tahini sauce/dressing, or other sesame-product inference is allowed.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B16 = Object.freeze({
  id: "matvaretabellen-2026-composition-b16",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/sesame-paste-tahini/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B16",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const tahini = Object.freeze({
  canonicalIngredientId: "tahini",
  foodId: "06.702",
  foodName: "Sesame paste, tahini",
  foodEx2: "Sesame paste (tahini) (sesamus indicum) (A01BM)",
  foodEx2Facets: Object.freeze(["59 % fat (A075C)"]),
  foodForm: "EXACT_SESAME_PASTE_TAHINI",
  matchConfidence: "high",
  matchNotes: "Exact source identity explicitly names sesame paste/tahini. This resolves the earlier B8 sesame-butter identity deferral without generalizing to generic sesame butter, sesame seed, tahini sauce/dressing, sweetened products, or other sesame preparations.",
  per100g: Object.freeze({
    energyKcal: 626,
    proteinG: 18.5,
    carbohydrateG: 0.8,
    fatG: 58.9,
    fibreG: 9.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 2,582 kJ / 626 kcal" }),
    proteinG: Object.freeze({ sourceCode: "450a", valueType: "Best estimate", method: "Food Standards Agency (2002), McCance and Widdowson's The Composition of Foods, Sixth summary edition" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "450a", valueType: "Best estimate", method: "Food Standards Agency (2002), McCance and Widdowson's The Composition of Foods, Sixth summary edition" }),
    fibreG: Object.freeze({ sourceCode: "460e", valueType: "Best estimate", method: "USDA National Nutrient Database for Standard Reference, Release 25 (2012)" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B16.id,
  evidenceTranche: "B16"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B16 = Object.freeze({
  tahini
});

export const matvaretabellenCompositionB16ForIngredient = ingredientId => MATVARETABELLEN_COMPOSITION_DENSITIES_B16[ingredientId] || null;
