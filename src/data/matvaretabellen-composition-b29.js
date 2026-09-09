// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B29 is composition-only and does not authorize a tortilla-piece weight or household conversion.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B29 = Object.freeze({
  id: "matvaretabellen-2026-composition-b29",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/tortilla-wheat-flour/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B29",
  runtimeFetch: false,
  compositionScope: "REVIEWED_INDUSTRIALLY_PREPARED_WHEAT_FLOUR_TORTILLA",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const tortilla = Object.freeze({
  canonicalIngredientId: "tortilla",
  foodId: "05.381",
  foodName: "Tortilla, wheat flour",
  scientificName: null,
  foodEx2: "Tortilla (A006V)",
  foodEx2IngredientFacet: "Wheat flour (A003X)",
  foodForm: "FULLY_HEAT_TREATED_GRIDDED_WHEAT_FLOUR_TORTILLA",
  matchConfidence: "high",
  matchNotes: "The canonical tortilla identity is explicitly a gluten-containing tortilla wrap with flour-tortilla and tortilla-de-trigo aliases. The official record is a wheat-flour Tortilla FoodEx2 identity, fully heat-treated and griddled. B29 does not generalize this record into corn_tortilla or another flatbread identity and does not infer a piece weight.",
  per100g: Object.freeze({
    energyKcal: 260,
    proteinG: 8.5,
    carbohydrateG: 44.8,
    fatG: 4.8,
    fibreG: 2.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1,097 kJ / 260 kcal" }),
    proteinG: Object.freeze({ sourceCode: "220a", valueType: "Weighted", method: "Norwegian Food Safety Authority nutrient analysis 2013-2014, Tex-mex products" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "220a", valueType: "Weighted", method: "Norwegian Food Safety Authority nutrient analysis 2013-2014, Tex-mex products" }),
    fibreG: Object.freeze({ sourceCode: "220a", valueType: "Weighted", method: "Norwegian Food Safety Authority nutrient analysis 2013-2014, Tex-mex products" })
  }),
  evidenceState: "MATVARETABELLEN_2026_REVIEWED_WHEAT_TORTILLA_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B29.id,
  evidenceTranche: "B29"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B29 = Object.freeze({ tortilla });

export const matvaretabellenCompositionB29ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B29[ingredientId] || null;
