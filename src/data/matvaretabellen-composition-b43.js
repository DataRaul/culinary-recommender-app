// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B43 is composition-only: the source edible-part percentage and any portion/yield are not quantity authority.
// The sole authored kale use is gram-denominated raw chopped kale that is cooked only after declaration.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B43 = Object.freeze({
  id: "matvaretabellen-2026-composition-b43",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/kale-raw/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B43",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const kale = Object.freeze({
  canonicalIngredientId: "kale",
  foodId: "06.035",
  foodName: "Kale, raw",
  scientificName: "Brassica oleracea L. convar. acephala (DC.) Alef. var. sabellica L.",
  foodEx2: "Curly kales (A00GM)",
  foodForm: "EXACT_RAW_KALE_LEAF",
  matchConfidence: "high",
  matchNotes: "Exact raw kale identity. FoodEx2 classifies Curly kales and the process facet is raw/no heat treatment; LanguaL identifies kale leaf with no heat treatment. The sole authored use is 150 g kale, chopped, added to the stew only after the other ingredients have simmered. This does not authorize frozen, steamed or otherwise cooked kale, the published edible-part percentage, or any household-unit conversion.",
  per100g: Object.freeze({
    energyKcal: 36,
    proteinG: 3.3,
    carbohydrateG: 2.2,
    fatG: 0.7,
    fibreG: 4.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ valueType: "Published", method: "Published energy in 100 g: 150 kJ / 36 kcal" }),
    proteinG: Object.freeze({ sourceCode: "400c", valueType: "Best estimate", method: "Official table value; source 400c is Swedish National Food Agency food database version 2013.01.10" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "400c", valueType: "Best estimate", method: "Official table value; source 400c is Swedish National Food Agency food database version 2013.01.10" }),
    fibreG: Object.freeze({ sourceCode: "400c", valueType: "Best estimate", method: "Official table value; source 400c is Swedish National Food Agency food database version 2013.01.10" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B43.id,
  evidenceTranche: "B43"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B43 = Object.freeze({ kale });

export const matvaretabellenCompositionB43ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B43[ingredientId] || null;
