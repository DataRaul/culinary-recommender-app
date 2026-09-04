// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B22 is composition-only: the source row's edible-part yield is deliberately not admitted as quantity evidence.
// Canonical mint is a generic fresh herb identity; this tranche does not authorize species/cultivar-specific or processed mint forms.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B22 = Object.freeze({
  id: "matvaretabellen-2026-composition-b22",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/mint-raw/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B22",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const mint = Object.freeze({
  canonicalIngredientId: "mint",
  foodId: "06.259",
  foodName: "Mint, raw",
  scientificName: "Mentha L.",
  foodEx2: "Mints (A00XZ)",
  foodForm: "EXACT_GENERIC_RAW_MINT_AROMATIC_LEAVES",
  matchConfidence: "high",
  matchNotes: "Exact generic raw mint identity at the source's genus-level Mentha L. / FoodEx2 Mints classification, with aromatic-herb leaves and other minor plant parts. Canonical mint is likewise generic and the authored uses are gram-denominated fresh-herb ingredients. This does not authorize peppermint or spearmint species/cultivars, dried mint, mint tea, extract, oil, sauce, confectionery, or any edible-part/household-unit conversion.",
  per100g: Object.freeze({
    energyKcal: 58,
    proteinG: 3.5,
    carbohydrateG: 5.3,
    fatG: 0.8,
    fibreG: 7.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ valueType: "Published", method: "Published energy in 100 g: 240 kJ / 58 kcal" }),
    proteinG: Object.freeze({ sourceCode: "430c", valueType: "Best estimate", method: "Official source value marked best estimate / imputed from food-composition data" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "430c", valueType: "Best estimate", method: "Official source value marked best estimate / imputed from food-composition data" }),
    fibreG: Object.freeze({ sourceCode: "430c", valueType: "Best estimate", method: "Official source value marked best estimate / imputed from food-composition data" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B22.id,
  evidenceTranche: "B22"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B22 = Object.freeze({ mint });

export const matvaretabellenCompositionB22ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B22[ingredientId] || null;
