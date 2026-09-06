// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B24 is composition-only and does not authorize a household portion or edible-yield conversion.
// The reviewed source identity is explicitly Feta but carries a narrower goat-milk qualifier; that qualifier is retained in provenance and never generalized to other cheeses.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B24 = Object.freeze({
  id: "matvaretabellen-2026-composition-b24",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/cheese-goat-milk-feta/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B24",
  runtimeFetch: false,
  compositionScope: "REVIEWED_FETA_PRODUCT_IDENTITY_WITH_NARROWER_MILK_SPECIES_QUALIFIER",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const feta = Object.freeze({
  canonicalIngredientId: "feta",
  foodId: "01.188",
  foodName: "Cheese, goat milk, Feta",
  foodEx2: "Cheese, feta (A02RC)",
  foodForm: "FETA_WITH_GOAT_MILK_QUALIFIER",
  matchConfidence: "medium",
  matchNotes: "The official record is explicitly classified as Cheese, feta (FoodEx2 A02RC), but its product name additionally specifies goat milk while canonical feta does not encode milk species. B24 therefore preserves medium form confidence and the narrower qualifier in provenance. It does not authorize other cheese identities, claim that all feta has identical composition, or infer sheep/cow-milk feta values.",
  per100g: Object.freeze({
    energyKcal: 260,
    proteinG: 18.1,
    carbohydrateG: 0.2,
    fatG: 20.8,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1,081 kJ / 260 kcal" }),
    proteinG: Object.freeze({ sourceCode: "620", valueType: "published", method: "DTU dairy-products study source cited by the official Food Composition Table" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "620", valueType: "published", method: "DTU dairy-products study source cited by the official Food Composition Table" }),
    fibreG: Object.freeze({ sourceCode: "50", valueType: "Logical zero", method: "Estimated as a naturally occurring zero value, not analysed" })
  }),
  evidenceState: "MATVARETABELLEN_2026_REVIEWED_FETA_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B24.id,
  evidenceTranche: "B24"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B24 = Object.freeze({ feta });

export const matvaretabellenCompositionB24ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B24[ingredientId] || null;
