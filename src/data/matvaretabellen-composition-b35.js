// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B35 is restricted to exact generic miso paste composition. It does not authorize
// a tablespoon mass, another household portion, or a neighboring fermented-soy identity.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B35 = Object.freeze({
  id: "matvaretabellen-2026-composition-b35",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/miso/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B35",
  runtimeFetch: false,
  compositionScope: "EXACT_REVIEWED_GENERIC_MISO_PASTE_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const miso = Object.freeze({
  canonicalIngredientId: "miso",
  foodId: "10.138",
  foodName: "Miso",
  scientificName: null,
  foodEx2: "Legumes based dishes (A03VM); fermentation (A0CQZ)",
  foodForm: "FERMENTED_SALTED_SOY_MISO_PASTE_SEMISOLID",
  matchConfidence: "high",
  matchNotes: "Exact generic miso-paste identity. The canonical ingredient is `miso paste` with alias `miso`; the official source is named Miso and classifies it as a soybean condiment, semisolid with smooth consistency, salted and preserved by fermentation. B35 does not broaden this composition to soy sauce, fermented soybean products generally, a named miso subtype, or any household-unit conversion.",
  per100g: Object.freeze({
    energyKcal: 182,
    proteinG: 17.2,
    carbohydrateG: 1.5,
    fatG: 10.5,
    fibreG: 7.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "Published", method: "Published energy in 100 g: 758 kJ / 182 kcal" }),
    proteinG: Object.freeze({ sourceCode: "500a", valueType: "Best estimate", method: "Official food composition table published value" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Available carbohydrate calculated from sugar and starch" }),
    fatG: Object.freeze({ sourceCode: "500a", valueType: "Best estimate", method: "Official food composition table published value" }),
    fibreG: Object.freeze({ sourceCode: "500a", valueType: "Best estimate", method: "Official food composition table published value" })
  }),
  evidenceState: "MATVARETABELLEN_2026_EXACT_GENERIC_MISO_PASTE_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B35.id,
  evidenceTranche: "B35"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B35 = Object.freeze({ miso });

export const matvaretabellenCompositionB35ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B35[ingredientId] || null;
