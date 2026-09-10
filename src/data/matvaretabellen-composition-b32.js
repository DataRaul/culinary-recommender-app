// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B32 is restricted to exact black pepper (Piper nigrum) composition. It does not
// authorize white pepper, other pepper spices, household portions or yield conversions.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B32 = Object.freeze({
  id: "matvaretabellen-2026-composition-b32",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/pepper-black/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B32",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_BLACK_PEPPER_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const blackPepper = Object.freeze({
  canonicalIngredientId: "black_pepper",
  foodId: "12.111",
  foodName: "Pepper, black",
  scientificName: "Piper nigrum L.",
  foodEx2: "Black pepper (A019C)",
  foodForm: "NATURALLY_DRIED_BLACK_PEPPER_FRUIT_SPICE",
  matchConfidence: "high",
  matchNotes: "Exact black-pepper source identity: Piper nigrum L., FoodEx2 Black pepper, fruit used as spice, solid, not heat-treated, water removed and naturally dried. B32 is black-pepper-only evidence. The repository's former `white pepper` alias is deliberately removed rather than allowing black-pepper composition to bleed into a distinct white-pepper product.",
  per100g: Object.freeze({
    energyKcal: 277,
    proteinG: 10.4,
    carbohydrateG: 38.7,
    fatG: 3.3,
    fibreG: 25.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "Published", method: "Published energy in 100 g: 1159 kJ / 277 kcal" }),
    proteinG: Object.freeze({ sourceCode: "460e", valueType: "Best estimate", method: "Official food composition table value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Available carbohydrate calculated from sugar and starch" }),
    fatG: Object.freeze({ sourceCode: "460e", valueType: "Best estimate", method: "Official food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "460e", valueType: "Best estimate", method: "Official food composition table value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_BLACK_PEPPER_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B32.id,
  evidenceTranche: "B32"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B32 = Object.freeze({ black_pepper: blackPepper });

export const matvaretabellenCompositionB32ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B32[ingredientId] || null;
