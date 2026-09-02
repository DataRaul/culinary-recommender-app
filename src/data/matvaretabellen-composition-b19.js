// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B19 is composition-only: household portions published on the source row are deliberately not admitted.
// Repository-authored bulgur gram quantities are weighed before the instructions hydrate/cook the bulgur.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B19 = Object.freeze({
  id: "matvaretabellen-2026-composition-b19",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/bulgur-uncooked/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B19",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FOOD_RECORDS_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const bulgur = Object.freeze({
  canonicalIngredientId: "bulgur",
  foodId: "05.233",
  foodName: "Bulgur, uncooked",
  scientificName: "Triticum aestivum L.",
  foodEx2: "Bulgur (A004G)",
  foodForm: "EXACT_UNCOOKED_BULGUR",
  matchConfidence: "high",
  matchNotes: "Exact source identity is uncooked bulgur. All three authored bulgur quantities are grams and each recipe hydrates/cooks the declared bulgur afterward, establishing pre-cooking input form. This does not authorize cooked bulgur or neighboring wheat/grain identities.",
  per100g: Object.freeze({
    energyKcal: 288,
    proteinG: 11.8,
    carbohydrateG: 50.9,
    fatG: 1.9,
    fibreG: 10.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: "MI0115", valueType: "Published", method: "Published energy in 100 g: 1215.4 kJ / 288 kcal" }),
    proteinG: Object.freeze({ sourceCode: "420f", valueType: "Weighted", method: "Food composition table; analytical results; method not known" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "611a", valueType: "Weighted", method: "Independent laboratory; analytical results; analytical method" }),
    fibreG: Object.freeze({ sourceCode: "611a", valueType: "Weighted", method: "Independent laboratory; analytical results; analytical method" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B19.id,
  evidenceTranche: "B19"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B19 = Object.freeze({ bulgur });

export const matvaretabellenCompositionB19ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B19[ingredientId] || null;
