// Bounded static field-completion evidence from the official Norwegian Food Composition Table 2026.
// B21 may fill only tracked fields absent from the already-reviewed Ciqual primary salmon record.
// It must not displace populated Ciqual fields, broaden salmon identity, or authorize source portions/yields.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B21 = Object.freeze({
  id: "matvaretabellen-2026-composition-b21",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/salmon-farmed-raw/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_FIELD_COMPLETION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_ONLY_WHEN_EXISTING_REVIEWED_PRIMARY_FIELD_IS_MISSING",
  evidenceTranche: "B21",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FIELD_COMPLETION_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const salmon = Object.freeze({
  canonicalIngredientId: "salmon",
  foodId: "04.220",
  foodName: "Salmon, farmed, raw",
  scientificName: "Salmo salar Linnaeus, 1758",
  foodEx2: "Atlantic salmon (A028P); farmed / cultivated / aquaculture (A07RV)",
  foodForm: "EXACT_FARMED_RAW_ATLANTIC_SALMON_EDIBLE_MEAT",
  matchConfidence: "high",
  matchNotes: "Exact field-completion match to the already-reviewed Ciqual B4 salmon identity: farmed raw Salmo salar. Matvaretabellen classifies skeletal meat without bone or skin, not heat-treated, with farmed/aquaculture production. B21 fills only Ciqual-missing carbohydrate and fibre fields; it does not replace B4 energy, protein or fat and does not authorize wild/ocean, cooked, smoked, salted or other salmon forms.",
  per100g: Object.freeze({
    energyKcal: 223,
    proteinG: 19.9,
    carbohydrateG: 0.0,
    fatG: 15.9,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: "MI0115", valueType: "Published", method: "Published energy in 100 g: 927 kJ / 223 kcal" }),
    proteinG: Object.freeze({ sourceCode: "321f", valueType: "Published", method: "Institute of Marine Research seafood data; tracked but not eligible to displace populated Ciqual B4 protein" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH); source value 0 g" }),
    fatG: Object.freeze({ sourceCode: "321f", valueType: "Published", method: "Institute of Marine Research seafood data; tracked but not eligible to displace populated Ciqual B4 fat" }),
    fibreG: Object.freeze({ sourceCode: "50", valueType: "Logical zero", method: "Estimated as a naturally occurring zero value, not analysed; logical deduction / imputation" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_FIELD_COMPLETION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B21.id,
  evidenceTranche: "B21"
});

export const MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21 = Object.freeze({ salmon });

export const matvaretabellenCompositionB21CompletionForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21[ingredientId] || null;
