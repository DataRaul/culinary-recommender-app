// Bounded static field-completion evidence from the official Norwegian Food Composition Table 2026.
// This tranche may fill only tracked fields absent from all already-reviewed USDA/Ciqual primary composition candidates.
// It must not displace populated primary fields or alter the separate B6 household-portion contract.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B13 = Object.freeze({
  id: "matvaretabellen-2026-composition-b13",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_FIELD_COMPLETION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_ONLY_WHEN_EXISTING_REVIEWED_PRIMARY_FIELD_IS_MISSING",
  evidenceTranche: "B13",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FIELD_COMPLETION_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const tomato = Object.freeze({
  canonicalIngredientId: "tomato",
  foodId: "06.754",
  foodName: "Tomato, unspecified, raw",
  scientificName: "Lycopersicon esculentum Mill.",
  foodEx2: "Tomatoes (A0DMX)",
  foodEx2Facets: Object.freeze(["Unspecified (A07XD)", "Raw, no heat treatment (A07HS)"]),
  matchConfidence: "high",
  matchNotes: "Exact generic raw tomato record for canonical tomato. The unspecified FoodEx2 facet avoids cultivar inference. B13 is composition-field completion only and does not alter the separate B6 whole-tomato portion evidence.",
  per100g: Object.freeze({
    energyKcal: 12,
    proteinG: 0.4,
    carbohydrateG: 2.1,
    fatG: 0.0,
    fibreG: 1.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 52 kJ / 12 kcal" }),
    proteinG: Object.freeze({ sourceCode: "235", valueType: "Weighted", method: "Norwegian Food Safety Authority nutrient analysis 2024; aggregation of analytical values" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "235", valueType: "Weighted", method: "Norwegian Food Safety Authority nutrient analysis 2024; aggregation of analytical values" }),
    fibreG: Object.freeze({ sourceCode: "235", valueType: "Weighted", method: "Norwegian Food Safety Authority nutrient analysis 2024; aggregation of analytical values" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_FIELD_COMPLETION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B13.id,
  evidenceTranche: "B13"
});

const cherryTomato = Object.freeze({
  canonicalIngredientId: "cherry_tomato",
  foodId: "06.752",
  foodName: "Tomato, small, cherry, imported, raw",
  scientificName: "Solanum lycopersicum var. cerasiforme (Alef.) Fosberg",
  foodEx2: "Cherry tomatoes (A00HY)",
  foodEx2Facets: Object.freeze(["Raw, no heat treatment (A07HS)"]),
  matchConfidence: "high",
  matchNotes: "Exact raw cherry-tomato identity for canonical cherry_tomato. Imported origin is a source-record geographic attribute, not a broader identity inference. B13 is field completion only and does not authorize generic tomato from this row.",
  per100g: Object.freeze({
    energyKcal: 17,
    proteinG: 0.6,
    carbohydrateG: 2.5,
    fatG: 0.2,
    fibreG: 1.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 71 kJ / 17 kcal" }),
    proteinG: Object.freeze({ sourceCode: "20", valueType: "Best estimate", method: "Official food composition table estimated value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "20", valueType: "Best estimate", method: "Official food composition table estimated value" }),
    fibreG: Object.freeze({ sourceCode: "208", valueType: "Average", method: "Nutrient analysis 2001-2002; analytical result" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_FIELD_COMPLETION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B13.id,
  evidenceTranche: "B13"
});

export const MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13 = Object.freeze({
  tomato,
  cherry_tomato: cherryTomato
});

export const matvaretabellenCompositionB13CompletionForIngredient = ingredientId => MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13[ingredientId] || null;
