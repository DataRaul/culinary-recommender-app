// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// This tranche is composition-only and does not alter the separate household-portion contracts.
// Only the exact reviewed Cottage cheese identity is bundled; no neighboring cheese/dairy identity is inferred.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B18 = Object.freeze({
  id: "matvaretabellen-2026-composition-b18",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/cottage-cheese/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B18",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const cottageCheese = Object.freeze({
  canonicalIngredientId: "cottage_cheese",
  foodId: "01.028",
  foodName: "Cottage cheese",
  foodEx2: "Cottage cheese (A02QG)",
  foodForm: "EXACT_COTTAGE_CHEESE",
  matchConfidence: "high",
  matchNotes: "Exact source identity explicitly names cottage cheese without a fat-level qualifier. It does not authorize ricotta, quark, cream cheese, curd cheese, or another dairy identity.",
  per100g: Object.freeze({
    energyKcal: 97,
    proteinG: 13.0,
    carbohydrateG: 1.5,
    fatG: 4.3,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 406 kJ / 97 kcal" }),
    proteinG: Object.freeze({ sourceCode: "114a", valueType: "Best estimate", method: "Data from the industry to the Food Composition Table 2021, unspecified/verified value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "114a", valueType: "Best estimate", method: "Data from the industry to the Food Composition Table 2021, unspecified/verified value" }),
    fibreG: Object.freeze({ sourceCode: "50", valueType: "Logical zero", method: "Estimated as a naturally occurring zero value, not analysed" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B18.id,
  evidenceTranche: "B18"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B18 = Object.freeze({
  cottage_cheese: cottageCheese
});

export const matvaretabellenCompositionB18ForIngredient = ingredientId => MATVARETABELLEN_COMPOSITION_DENSITIES_B18[ingredientId] || null;
