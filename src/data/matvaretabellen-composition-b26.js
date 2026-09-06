// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B26 is composition-only and does not authorize a household portion or cooked-yield conversion.
// The reviewed identity is dried/uncooked rice noodles and must not be applied to cooked rice noodles or wheat noodles.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B26 = Object.freeze({
  id: "matvaretabellen-2026-composition-b26",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/noodles-rice-uncooked/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B26",
  runtimeFetch: false,
  compositionScope: "REVIEWED_DRY_UNCOOKED_RICE_NOODLES",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const riceNoodles = Object.freeze({
  canonicalIngredientId: "rice_noodles",
  foodId: "05.331",
  foodName: "Noodles, rice, uncooked",
  scientificName: null,
  foodEx2: "Noodle, rice (A008F)",
  foodForm: "DRIED_UNCOOKED_RICE_NOODLES",
  matchConfidence: "high",
  matchNotes: "The official identity is rice noodles, uncooked. LanguaL classifies the source as rice, water removed, dehydrated/dried. All authored rice_noodles quantities are direct gram inputs and are cooked or soaked only after declaration, so the source preparation state matches without a yield conversion.",
  per100g: Object.freeze({
    energyKcal: 361,
    proteinG: 6.0,
    carbohydrateG: 82.2,
    fatG: 0.6,
    fibreG: 2.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1,532 kJ / 361 kcal" }),
    proteinG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Official Food Composition Table published value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Official Food Composition Table published value" }),
    fibreG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Official Food Composition Table published dietary-fibre value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_REVIEWED_DRY_UNCOOKED_RICE_NOODLES_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B26.id,
  evidenceTranche: "B26"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B26 = Object.freeze({ rice_noodles: riceNoodles });

export const matvaretabellenCompositionB26ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B26[ingredientId] || null;
