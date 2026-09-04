// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B23 is composition-only: the source row's edible-part yield is deliberately not admitted as quantity evidence.
// Canonical pumpkin is generic; this tranche does not authorize cultivar/species-specific or processed pumpkin forms.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B23 = Object.freeze({
  id: "matvaretabellen-2026-composition-b23",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/pumpkin-raw/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B23",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const pumpkin = Object.freeze({
  canonicalIngredientId: "pumpkin",
  foodId: "06.033",
  foodName: "Pumpkin, raw",
  scientificName: "Cucurbita pepo L.",
  foodEx2: "Pumpkins (A00KH)",
  foodForm: "EXACT_GENERIC_RAW_PUMPKIN_EDIBLE_FLESH",
  matchConfidence: "high",
  matchNotes: "Exact source identity Pumpkin, raw under FoodEx2 Pumpkins with raw/no-heat processing and peel, core and seed removed. Canonical pumpkin is generic and both authored uses are gram-denominated small-cube ingredients. This does not authorize butternut, Hokkaido or another cultivar/species-specific pumpkin record, cooked, roasted, canned or puree forms, the source edible-part yield, or any household-unit conversion.",
  per100g: Object.freeze({
    energyKcal: 40,
    proteinG: 1.0,
    carbohydrateG: 7.3,
    fatG: 0.2,
    fibreG: 3.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ valueType: "Published", method: "Published energy in 100 g: 169 kJ / 40 kcal" }),
    proteinG: Object.freeze({ sourceCode: "420h", valueType: "Weighted", method: "Official source weighted value; source 420h is DTU Frida version 4.1 (2022)" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "420h", valueType: "Weighted", method: "Official source weighted value; source 420h is DTU Frida version 4.1 (2022)" }),
    fibreG: Object.freeze({ sourceCode: "420h", valueType: "Weighted", method: "Official source weighted value; source 420h is DTU Frida version 4.1 (2022)" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B23.id,
  evidenceTranche: "B23"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B23 = Object.freeze({ pumpkin });

export const matvaretabellenCompositionB23ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B23[ingredientId] || null;
