// Bounded static field-completion evidence from the official Norwegian Food Composition Table 2026.
// This tranche may fill only tracked fields that are absent from the already-reviewed primary composition record.
// It must not displace populated Ciqual/USDA fields, broaden canonical identity, or alter the separate B6 portion contract.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B10 = Object.freeze({
  id: "matvaretabellen-2026-composition-b10",
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
  evidenceTranche: "B10",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FIELD_COMPLETION_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const lemon = Object.freeze({
  canonicalIngredientId: "lemon",
  foodId: "06.550",
  foodName: "Lemon, raw",
  scientificName: "Citrus limon (L.) Burm.f.",
  foodEx2: "Lemons (A01BY)",
  sourceUrl: "https://www.matvaretabellen.no/en/lemon-raw/",
  matchConfidence: "high",
  matchNotes: "Direct raw edible lemon with peel/core/pits removed. This is the same official food row already accepted for the separate B6 lemon-piece conversion; B10 uses composition only and does not change portion semantics.",
  per100g: Object.freeze({
    energyKcal: 23,
    proteinG: 1.1,
    carbohydrateG: 2.5,
    fatG: 0.3,
    fibreG: 3.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 95 kJ / 23 kcal" }),
    proteinG: Object.freeze({ sourceCode: "460e", valueType: "Best estimate", method: "Food composition table value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "460e", valueType: "Best estimate", method: "Food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "460e", valueType: "Best estimate", method: "Food composition table value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_FIELD_COMPLETION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B10.id,
  evidenceTranche: "B10"
});

export const MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10 = Object.freeze({
  lemon
});

export const matvaretabellenCompositionCompletionForIngredient = ingredientId => MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10[ingredientId] || null;
