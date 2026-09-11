// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B45 is composition-only: no cooked yield, portion or household conversion is admitted.
// The sole authored risotto-rice use is gram-denominated before cooking.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B45 = Object.freeze({
  id: "matvaretabellen-2026-composition-b45",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/rice-arborio-risotto-rice-uncooked/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B45",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const risottoRice = Object.freeze({
  canonicalIngredientId: "risotto_rice",
  foodId: "05.384",
  foodName: "Rice, arborio, risotto rice, uncooked",
  scientificName: "Oryza sativa L.",
  foodEx2: "Rice grain (A001D)",
  foodForm: "EXACT_ARBORIO_RISOTTO_RICE_UNCOOKED",
  matchConfidence: "high",
  matchNotes: "The official food name explicitly identifies Arborio / risotto rice and uncooked state. The sole authored canonical risotto_rice use is 170 g before the recipe's incremental cooking step. B45 does not authorize generic rice, jasmine/basmati/sushi rice, cooked risotto rice, cooking yield, or any household-unit conversion.",
  per100g: Object.freeze({
    energyKcal: 378,
    proteinG: 6.4,
    carbohydrateG: 85.1,
    fatG: 1.0,
    fibreG: 1.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ valueType: "Published", method: "Published energy in 100 g: 1604 kJ / 378 kcal" }),
    proteinG: Object.freeze({ sourceCode: "450c", valueType: "Best estimate", method: "Official table source code 450c" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "450c", valueType: "Best estimate", method: "Official table source code 450c" }),
    fibreG: Object.freeze({ sourceCode: "450c", valueType: "Best estimate", method: "Official table source code 450c" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B45.id,
  evidenceTranche: "B45"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B45 = Object.freeze({ risotto_rice: risottoRice });

export const matvaretabellenCompositionB45ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B45[ingredientId] || null;
