// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B46 is composition-only: no household portion, melting/cooking yield, or neighboring dairy-fat identity is admitted.
// The sole authored butter use is gram-denominated.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B46 = Object.freeze({
  id: "matvaretabellen-2026-composition-b46",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/butter/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B46",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const butter = Object.freeze({
  canonicalIngredientId: "butter",
  foodId: "08.005",
  foodName: "Butter",
  foodEx2: "Butter (A039C)",
  foodForm: "EXACT_BUTTER_SEMISOLID_DAIRY_FAT",
  matchConfidence: "medium",
  matchNotes: "The official food identity is directly Butter / FoodEx2 Butter and matches canonical butter. Medium confidence preserves the source record's Norwegian prepared-product formulation, including vitamin-D fortification and its published sodium/salt profile, rather than generalizing those formulation details to every butter product. The sole authored use is 15 g canonical butter. B46 does not authorize margarine, clarified butter/ghee, butter blends, another dairy fat, household-unit conversion, or cooking/melting yield.",
  per100g: Object.freeze({
    energyKcal: 744,
    proteinG: 1.0,
    carbohydrateG: 0.5,
    fatG: 82.0,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ valueType: "Published", method: "Published energy in 100 g: 3060 kJ / 744 kcal" }),
    proteinG: Object.freeze({ sourceCode: "114a", valueType: "Best estimate", method: "Verified industry data published by the Norwegian Food Composition Table" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "114a", valueType: "Best estimate", method: "Verified industry data published by the Norwegian Food Composition Table" }),
    fibreG: Object.freeze({ sourceCode: "50", valueType: "Logical zero", method: "Estimated as a naturally occurring zero value, not analysed" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B46.id,
  evidenceTranche: "B46"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B46 = Object.freeze({ butter });

export const matvaretabellenCompositionB46ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B46[ingredientId] || null;
