// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B36 preserves the source row's narrower smooth, oil-added peanut-butter form at
// medium confidence. It authorizes no household portion or neighboring nut product.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B36 = Object.freeze({
  id: "matvaretabellen-2026-composition-b36",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/peanut-butter/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B36",
  runtimeFetch: false,
  compositionScope: "REVIEWED_SMOOTH_OIL_ADDED_PEANUT_BUTTER_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const peanutButter = Object.freeze({
  canonicalIngredientId: "peanut_butter",
  foodId: "06.559",
  foodName: "Peanut butter",
  scientificName: "Arachis hypogaea L.",
  foodEx2: "Peanut butter (A01BN)",
  foodForm: "SMOOTH_FULLY_HEAT_TREATED_OIL_ADDED_PEANUT_BUTTER",
  matchConfidence: "medium",
  matchNotes: "The official identity is explicitly Peanut butter / FoodEx2 Peanut butter. LanguaL further narrows the row to skin-removed peanut seed product with smooth semisolid consistency, fully heat-treated and fat/oil added. B36 preserves those narrower source qualifiers at medium confidence rather than claiming identical composition for every crunchy, no-added-oil or other peanut-butter formulation. It does not authorize peanuts, other nut butters, peanut sauce or any household-unit conversion.",
  per100g: Object.freeze({
    energyKcal: 621,
    proteinG: 22.8,
    carbohydrateG: 13.1,
    fatG: 51.8,
    fibreG: 5.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "Published", method: "Published energy in 100 g: 2570 kJ / 621 kcal" }),
    proteinG: Object.freeze({ sourceCode: "450c", valueType: "Best estimate", method: "Official food composition table published value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Available carbohydrate calculated from sugar and starch" }),
    fatG: Object.freeze({ sourceCode: "450c", valueType: "Best estimate", method: "Official food composition table published value" }),
    fibreG: Object.freeze({ sourceCode: "450c", valueType: "Best estimate", method: "Official food composition table published value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_REVIEWED_SMOOTH_PEANUT_BUTTER_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B36.id,
  evidenceTranche: "B36"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B36 = Object.freeze({ peanut_butter: peanutButter });

export const matvaretabellenCompositionB36ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B36[ingredientId] || null;
