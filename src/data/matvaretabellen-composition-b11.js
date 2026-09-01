// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// This tranche is composition-only and does not alter the separate B6 household-portion contract.
// Only exact reviewed food/form matches are bundled; no generic spice, seed, lentil, cooked-food, or family inference is allowed.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B11 = Object.freeze({
  id: "matvaretabellen-2026-composition-b11",
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
  evidenceTranche: "B11",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const cumin = Object.freeze({
  canonicalIngredientId: "cumin",
  foodId: "06.266",
  foodName: "Cumin seeds, ground",
  scientificName: "Cuminum cyminum L.",
  foodEx2: "Cumin seed (A018E)",
  foodForm: "GROUND",
  matchConfidence: "high",
  matchNotes: "Exact ground-cumin form for canonical cumin. This row does not authorize a separate whole-cumin-seed identity or generic spice-family inference.",
  per100g: Object.freeze({
    energyKcal: 428,
    proteinG: 17.8,
    carbohydrateG: 33.7,
    fatG: 22.3,
    fibreG: 11.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1785 kJ / 428 kcal" }),
    proteinG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Food composition table value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Food composition table value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B11.id,
  evidenceTranche: "B11"
});

const turmeric = Object.freeze({
  canonicalIngredientId: "turmeric",
  foodId: "06.153",
  foodName: "Turmeric, ground",
  scientificName: "Curcuma longa L.",
  foodEx2: "Turmeric roots (A01AC)",
  processingFacet: "GRINDING_MILLING_CRUSHING",
  foodForm: "GROUND",
  matchConfidence: "high",
  matchNotes: "Exact ground-turmeric form for canonical turmeric. The processing facet explicitly identifies grinding/milling/crushing; no whole-root or generic spice-family inference is allowed.",
  per100g: Object.freeze({
    energyKcal: 291,
    proteinG: 9.7,
    carbohydrateG: 44.4,
    fatG: 3.3,
    fibreG: 23.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1221 kJ / 291 kcal" }),
    proteinG: Object.freeze({ sourceCode: "460f", valueType: "Best estimate", method: "Food composition table value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "460f", valueType: "Best estimate", method: "Food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "460f", valueType: "Best estimate", method: "Food composition table value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B11.id,
  evidenceTranche: "B11"
});

const redLentils = Object.freeze({
  canonicalIngredientId: "red_lentils",
  foodId: "06.184",
  foodName: "Lentils, red, uncooked",
  foodEx2: "Lentils (dry) (A013Q)",
  colourFacet: "Red (A0F2S)",
  foodForm: "DRY_UNCOOKED",
  matchConfidence: "high",
  matchNotes: "Exact red, dry, uncooked lentil form for canonical red_lentils, including the authored red-split-lentils alias. This row does not authorize generic lentils, cooked lentils, or canned lentils.",
  per100g: Object.freeze({
    energyKcal: 274,
    proteinG: 22.5,
    carbohydrateG: 31.9,
    fatG: 2.2,
    fibreG: 19.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1154 kJ / 274 kcal" }),
    proteinG: Object.freeze({ sourceCode: "616", valueType: "Best estimate", method: "Food composition table value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "460g", valueType: "Best estimate", method: "Food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "420i", valueType: "Best estimate", method: "Food composition table value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B11.id,
  evidenceTranche: "B11"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B11 = Object.freeze({
  cumin,
  turmeric,
  red_lentils: redLentils
});

export const matvaretabellenCompositionB11ForIngredient = ingredientId => MATVARETABELLEN_COMPOSITION_DENSITIES_B11[ingredientId] || null;
