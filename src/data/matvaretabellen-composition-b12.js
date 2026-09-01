// Bounded static field-completion evidence from the official Norwegian Food Composition Table 2026.
// This tranche may fill only tracked fields absent from all already-reviewed USDA/Ciqual primary composition candidates.
// It must not displace populated primary fields or alter the separate B6 household-portion contract.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B12 = Object.freeze({
  id: "matvaretabellen-2026-composition-b12",
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
  evidenceTranche: "B12",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FIELD_COMPLETION_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const oliveOil = Object.freeze({
  canonicalIngredientId: "olive_oil",
  foodId: "08.112",
  foodName: "Oil, olive, Extra Virgin",
  scientificName: "Olea europea L.",
  foodEx2: "Olive oil, virgin or extra-virgin (A036Q)",
  matchConfidence: "high",
  matchNotes: "Exact extra-virgin olive-oil record. EVOO is an explicit canonical olive_oil alias, and the existing Ciqual B5 primary record is also extra virgin. B12 is composition-field completion only and does not change B6 tablespoon conversion semantics.",
  per100g: Object.freeze({
    energyKcal: 889,
    proteinG: 0.0,
    carbohydrateG: 0.0,
    fatG: 98.8,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 889 kcal" }),
    proteinG: Object.freeze({ sourceCode: "50", valueType: "published", method: "Official food composition table value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "210", valueType: "published", method: "Official food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "50", valueType: "published", method: "Official food composition table value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_FIELD_COMPLETION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B12.id,
  evidenceTranche: "B12"
});

export const MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12 = Object.freeze({
  olive_oil: oliveOil
});

export const matvaretabellenCompositionB12CompletionForIngredient = ingredientId => MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12[ingredientId] || null;
