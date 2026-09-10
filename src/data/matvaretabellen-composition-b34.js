// Bounded static field-completion evidence from the official Norwegian Food Composition Table 2026.
// B34 fills only tracked fields absent from the existing reviewed primary records for
// spring onion and mango. It does not displace populated USDA/Ciqual fields or grant
// any new household-unit, edible-yield, cooked-yield or neighboring-identity authority.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B34 = Object.freeze({
  id: "matvaretabellen-2026-composition-b34",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  websites: Object.freeze([
    "https://www.matvaretabellen.no/en/scallion-spring-onion-raw/",
    "https://www.matvaretabellen.no/en/mango-raw/"
  ]),
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_FIELD_COMPLETION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_ONLY_WHEN_EXISTING_REVIEWED_PRIMARY_FIELD_IS_MISSING",
  evidenceTranche: "B34",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FIELD_COMPLETION_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const springOnion = Object.freeze({
  canonicalIngredientId: "spring_onion",
  foodId: "06.113",
  foodName: "Scallion, spring onion, raw",
  scientificName: "Allium cepa L.",
  foodEx2: "Spring onions (A00HH)",
  foodForm: "RAW_WHOLE_SPRING_ONION_MOST_PLANT_PARTS",
  matchConfidence: "high",
  matchNotes: "Exact reviewed spring-onion/scallion raw identity. Food 06.113 is the same official source identity already accepted by B6 for the separate 19 g piece portion. The frozen USDA Foundation spring_onion record supplies protein and fibre but leaves energy, carbohydrate and fat unpublished; B34 fills only those three missing tracked fields and does not displace the populated USDA fields.",
  per100g: Object.freeze({
    energyKcal: 23,
    proteinG: 1.8,
    carbohydrateG: 2.3,
    fatG: 0.2,
    fibreG: 3.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "Published", method: "Published energy in 100 g: 98 kJ / 23 kcal" }),
    proteinG: Object.freeze({ sourceCode: "460g", valueType: "Best estimate", method: "Published tracked field; context only, not eligible to displace populated USDA protein" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Available carbohydrate calculated from sugar and starch" }),
    fatG: Object.freeze({ sourceCode: "460g", valueType: "Best estimate", method: "Official food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "460g", valueType: "Best estimate", method: "Published tracked field; context only, not eligible to displace populated USDA fibre" })
  }),
  eligibleCompletionFields: Object.freeze(["energyKcal", "carbohydrateG", "fatG"]),
  evidenceState: "MATVARETABELLEN_2026_EXACT_FIELD_COMPLETION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B34.id,
  evidenceTranche: "B34"
});

const mango = Object.freeze({
  canonicalIngredientId: "mango",
  foodId: "06.542",
  foodName: "Mango, raw",
  scientificName: "Mangifera indica L.",
  foodEx2: "Mangoes (A01LF)",
  foodForm: "RAW_PEELED_PITTED_MANGO",
  matchConfidence: "high",
  matchNotes: "Exact raw edible mango identity matching the reviewed Ciqual B4 mango form: peel and pit removed, Mangifera indica. B34 fills only the missing Ciqual fat field and does not replace populated Ciqual energy, protein, available-carbohydrate or fibre fields. The separate B6 mango piece conversion remains independently governed.",
  per100g: Object.freeze({
    energyKcal: 50,
    proteinG: 0.2,
    carbohydrateG: 10.6,
    fatG: 0.3,
    fibreG: 2.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "Published", method: "Published energy in 100 g: 211 kJ / 50 kcal; context only" }),
    proteinG: Object.freeze({ sourceCode: "618", valueType: "Best estimate", method: "Published tracked field; context only" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Available carbohydrate calculated from sugar and starch; context only" }),
    fatG: Object.freeze({ sourceCode: "610", valueType: "Best estimate", method: "Official food composition table value" }),
    fibreG: Object.freeze({ sourceCode: "420i", valueType: "Best estimate", method: "Published tracked field; context only" })
  }),
  eligibleCompletionFields: Object.freeze(["fatG"]),
  evidenceState: "MATVARETABELLEN_2026_EXACT_FIELD_COMPLETION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B34.id,
  evidenceTranche: "B34"
});

export const MATVARETABELLEN_COMPOSITION_COMPLETIONS_B34 = Object.freeze({
  spring_onion: springOnion,
  mango
});

export const matvaretabellenCompositionB34CompletionForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B34[ingredientId] || null;
