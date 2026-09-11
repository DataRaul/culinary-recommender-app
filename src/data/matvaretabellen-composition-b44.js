// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B44 is composition-only: the source edible-part value and any serving/portion information are not quantity authority.
// The sole authored canonical pasta use is gram-denominated and cooked only after the ingredient is declared.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B44 = Object.freeze({
  id: "matvaretabellen-2026-composition-b44",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/pasta-plain-uncooked/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B44",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const pasta = Object.freeze({
  canonicalIngredientId: "pasta",
  foodId: "05.016",
  foodName: "Pasta, plain, uncooked",
  foodEx2: "Dried pasta (A007L)",
  foodForm: "EXACT_PLAIN_DRIED_UNCOOKED_DURUM_WHEAT_PASTA",
  matchConfidence: "high",
  matchNotes: "The source is generic plain dried uncooked durum-wheat pasta under FoodEx2 Dried pasta. Canonical pasta is a gluten-containing wheat pasta identity with spaghetti and penne aliases, and the sole authored use is 170 g declared before a later instruction to cook it. This does not authorize fresh pasta, whole-grain pasta, filled pasta, gluten-free pasta, cooked pasta, cooking yield, or any household-unit conversion.",
  per100g: Object.freeze({
    energyKcal: 347,
    proteinG: 11.9,
    carbohydrateG: 69.8,
    fatG: 1.3,
    fibreG: 4.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ valueType: "Published", method: "Published energy in 100 g: 1471 kJ / 347 kcal" }),
    proteinG: Object.freeze({ sourceCode: "204", valueType: "Published source value", method: "Official table source code 204" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "204", valueType: "Published source value", method: "Official table source code 204" }),
    fibreG: Object.freeze({ sourceCode: "204", valueType: "Published source value", method: "Official table source code 204" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B44.id,
  evidenceTranche: "B44"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B44 = Object.freeze({ pasta });

export const matvaretabellenCompositionB44ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B44[ingredientId] || null;
