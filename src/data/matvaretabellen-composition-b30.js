// Bounded static field-completion evidence from the official Norwegian Food Composition Table 2026.
// B30 may fill only tracked fields absent from the already-reviewed Ciqual B5 soy-sauce record.
// It must not displace populated Ciqual fields or broaden soy-sauce identity.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B30 = Object.freeze({
  id: "matvaretabellen-2026-composition-b30",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/soy-sauce/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_FIELD_COMPLETION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_ONLY_WHEN_EXISTING_REVIEWED_PRIMARY_FIELD_IS_MISSING",
  evidenceTranche: "B30",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_FIELD_COMPLETION_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const soySauce = Object.freeze({
  canonicalIngredientId: "soy_sauce",
  foodId: "10.126",
  foodName: "Soy sauce",
  scientificName: "Glycine max (L.) Merr.",
  foodEx2: "Soy sauce (A044R)",
  foodForm: "FERMENTED_WHEAT_CONTAINING_LIQUID_SOY_SAUCE",
  matchConfidence: "high",
  matchNotes: "Exact generic soy-sauce identity. The same official food 10.126 already supplies the reviewed B6 tablespoon portion row. Matvaretabellen classifies a liquid fermented soybean condiment with wheat, water and salt added. B30 fills only the Ciqual B5 fat field, which is missing there; it does not replace populated Ciqual energy, protein, available-carbohydrate or fibre fields and does not authorize sweetened/tamari/gluten-free variants.",
  per100g: Object.freeze({
    energyKcal: 84,
    proteinG: 3.0,
    carbohydrateG: 17.9,
    fatG: 0.0,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "Published", method: "Published energy in 100 g: 355 kJ / 84 kcal; retained as non-displacing context only" }),
    proteinG: Object.freeze({ sourceCode: "450c", valueType: "Best estimate", method: "Published tracked field; not eligible to displace populated Ciqual B5 protein" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Available carbohydrate calculated from sugar and starch; not eligible to displace populated Ciqual B5 carbohydrate" }),
    fatG: Object.freeze({ sourceCode: "60a", valueType: "Below limit of detection or quantification", method: "Source-published 0 g fat, estimated as zero where analysed value is below limit of quantification" }),
    fibreG: Object.freeze({ sourceCode: "60a", valueType: "Below limit of detection or quantification", method: "Published tracked field; not eligible to displace populated Ciqual B5 fibre" })
  }),
  eligibleCompletionFields: Object.freeze(["fatG"]),
  evidenceState: "MATVARETABELLEN_2026_EXACT_FIELD_COMPLETION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B30.id,
  evidenceTranche: "B30"
});

export const MATVARETABELLEN_COMPOSITION_COMPLETIONS_B30 = Object.freeze({ soy_sauce: soySauce });

export const matvaretabellenCompositionB30CompletionForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B30[ingredientId] || null;
