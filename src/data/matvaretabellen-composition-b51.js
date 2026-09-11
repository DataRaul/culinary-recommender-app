// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B51 is composition-only. The source's 76% edible-part figure is retained as source metadata only
// and does not authorize a celery-piece mass, edible-yield conversion, or cooked-yield conversion.
// The sole authored celery use is one diced piece that is softened only after ingredient declaration.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B51 = Object.freeze({
  id: "matvaretabellen-2026-composition-b51",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/celery-stalk-or-stem-raw/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B51",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const celery = Object.freeze({
  canonicalIngredientId: "celery",
  foodId: "06.280",
  foodName: "Celery stalk or stem, raw",
  scientificName: "Apium graveolens var. dulce (Mill.) Pers.",
  foodEx2: "Celeries (A00RY)",
  foodForm: "EXACT_RAW_CELERY_STALK_OR_STEM",
  matchConfidence: "high",
  sourceEdiblePartPercent: 76,
  matchNotes: "Exact raw celery stalk/stem identity. Source classification identifies stems/stalks eaten as vegetables and no heat treatment. The sole authored use is one canonical celery piece, diced before the recipe softens celery with onion. B51 supplies composition only: the published 76% edible-part figure is not a grams-per-piece measure and is not used as quantity or yield authority.",
  per100g: Object.freeze({
    energyKcal: 14,
    proteinG: 1.0,
    carbohydrateG: 1.3,
    fatG: 0.0,
    fibreG: 2.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ valueType: "Published", method: "Published energy in 100 g: 57 kJ / 14 kcal" }),
    proteinG: Object.freeze({ sourceCode: "237", valueType: "Published", method: "Official table value; source 237 is Norwegian Food Safety Authority nutrient analysis 2025 vegetables" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "237", valueType: "Published", method: "Official table value; source 237 is Norwegian Food Safety Authority nutrient analysis 2025 vegetables" }),
    fibreG: Object.freeze({ sourceCode: "237", valueType: "Published", method: "Official table value; source 237 is Norwegian Food Safety Authority nutrient analysis 2025 vegetables" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B51.id,
  evidenceTranche: "B51"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B51 = Object.freeze({ celery });

export const matvaretabellenCompositionB51ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B51[ingredientId] || null;
