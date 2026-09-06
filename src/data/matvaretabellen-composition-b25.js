// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B25 is composition-only and does not authorize a household portion or edible-yield conversion.
// The reviewed identity is uncooked barley; FoodEx2 further qualifies the grain as pearled, so that narrower qualifier is preserved rather than generalized to all barley forms.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B25 = Object.freeze({
  id: "matvaretabellen-2026-composition-b25",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/barley-uncooked/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B25",
  runtimeFetch: false,
  compositionScope: "REVIEWED_UNCOOKED_BARLEY_WITH_PEARLED_FOODEX2_QUALIFIER",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const barley = Object.freeze({
  canonicalIngredientId: "barley",
  foodId: "05.001",
  foodName: "Barley, uncooked",
  scientificName: "Hordeum vulgare L.",
  foodEx2: "Barley grain, pearled (A002K)",
  foodForm: "UNCOOKED_BARLEY_GRAIN_WITH_PEARLED_FOODEX2_QUALIFIER",
  matchConfidence: "medium",
  matchNotes: "The official record is explicitly Barley, uncooked and is classified as barley grain, pearled (FoodEx2 A002K). Authored barley quantities are direct gram quantities introduced uncooked and then simmered, so the preparation state matches. Canonical barley does not encode pearling, therefore B25 preserves medium form confidence and the narrower FoodEx2 qualifier rather than claiming all barley varieties share identical composition.",
  per100g: Object.freeze({
    energyKcal: 327,
    proteinG: 8.6,
    carbohydrateG: 65.4,
    fatG: 1.1,
    fibreG: 11.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1,384 kJ / 327 kcal" }),
    proteinG: Object.freeze({ sourceCode: "305", valueType: "Best estimate", method: "Official Food Composition Table published value; independent-laboratory acquisition" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "305", valueType: "Best estimate", method: "Official Food Composition Table published value; independent-laboratory acquisition" }),
    fibreG: Object.freeze({ sourceCode: "400e", valueType: "Best estimate", method: "Official Food Composition Table published dietary-fibre value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_REVIEWED_UNCOOKED_BARLEY_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B25.id,
  evidenceTranche: "B25"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B25 = Object.freeze({ barley });

export const matvaretabellenCompositionB25ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B25[ingredientId] || null;
