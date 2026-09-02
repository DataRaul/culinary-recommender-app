// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// This tranche is composition-only and does not alter the separate B6 household-portion contract.
// Only the exact reviewed raw courgette/zucchini food-form match is bundled; no generic squash, pumpkin, cooked-food, or cultivar inference is allowed.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B14 = Object.freeze({
  id: "matvaretabellen-2026-composition-b14",
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
  evidenceTranche: "B14",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const courgette = Object.freeze({
  canonicalIngredientId: "courgette",
  foodId: "06.085",
  foodName: "Squash, zucchini, raw",
  scientificName: "Cucurbita pepo L.",
  foodEx2: "Courgettes (A00JR)",
  foodEx2Facets: Object.freeze(["Raw, no heat treatment (A07HS)"]),
  foodForm: "RAW_WHOLE_COURGETTE_ZUCCHINI",
  matchConfidence: "high",
  matchNotes: "Exact raw courgette/zucchini identity for canonical courgette, whose ontology explicitly includes zucchini as an alias. This row does not authorize generic squash, pumpkin, cooked courgette, or cultivar-specific inference.",
  per100g: Object.freeze({
    energyKcal: 17,
    proteinG: 1.3,
    carbohydrateG: 2.2,
    fatG: 0.1,
    fibreG: 1.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 73 kJ / 17 kcal" }),
    proteinG: Object.freeze({ sourceCode: "420h", valueType: "Mean", method: "National Food Institute - Technical University of Denmark (DTU), Frida version 4.1 (2022)" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "420h", valueType: "Mean", method: "National Food Institute - Technical University of Denmark (DTU), Frida version 4.1 (2022)" }),
    fibreG: Object.freeze({ sourceCode: "420h", valueType: "Best estimate", method: "National Food Institute - Technical University of Denmark (DTU), Frida version 4.1 (2022)" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B14.id,
  evidenceTranche: "B14"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B14 = Object.freeze({
  courgette
});

export const matvaretabellenCompositionB14ForIngredient = ingredientId => MATVARETABELLEN_COMPOSITION_DENSITIES_B14[ingredientId] || null;
