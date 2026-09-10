// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B31 is restricted to the reviewed ricotta identity and preserves the source row's
// narrower cow-whey qualifier. It authorizes no neighboring cheese or portion conversion.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B31 = Object.freeze({
  id: "matvaretabellen-2026-composition-b31",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/cheese-ricotta/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B31",
  runtimeFetch: false,
  compositionScope: "REVIEWED_COW_WHEY_RICOTTA_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const ricotta = Object.freeze({
  canonicalIngredientId: "ricotta",
  foodId: "01.266",
  foodName: "Cheese, Ricotta",
  scientificName: null,
  foodEx2: "Ricotta (A02QL)",
  foodForm: "SEMISOLID_CHILLED_COW_WHEY_RICOTTA",
  matchConfidence: "medium",
  matchNotes: "The official food identity is explicitly Ricotta / FoodEx2 Ricotta. Its LanguaL facets further specify uncured semisolid cheese from cow whey, lactic-acid fermented and chilled. B31 preserves that narrower source qualifier at medium confidence rather than claiming every sheep-, goat- or mixed-milk ricotta has identical composition. It does not authorize cottage cheese, cream cheese, mascarpone, mozzarella, paneer or another fresh-cheese identity.",
  per100g: Object.freeze({
    energyKcal: 125,
    proteinG: 7.5,
    carbohydrateG: 0.8,
    fatG: 10.2,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "Published", method: "Published energy in 100 g: 519 kJ / 125 kcal" }),
    proteinG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Official food composition table value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Available carbohydrate calculated from sugar and starch" }),
    fatG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Official food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "460h", valueType: "Best estimate", method: "Official food composition table value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_REVIEWED_RICOTTA_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B31.id,
  evidenceTranche: "B31"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B31 = Object.freeze({ ricotta });

export const matvaretabellenCompositionB31ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B31[ingredientId] || null;
