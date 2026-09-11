// Bounded static composition evidence from Japan's official Standard Tables of Food Composition.
// B48 is restricted to exact Nam pla (fish sauce) food 17107. It introduces no household-unit
// conversion and preserves MEXT's available-carbohydrate-by-difference semantic explicitly.

export const MEXT_COMPOSITION_SOURCE_B48 = Object.freeze({
  id: "mext-standard-tables-2023-composition-b48",
  authority: "Ministry of Education, Culture, Sports, Science and Technology (MEXT), Japan",
  dataset: "Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023",
  releaseDate: "2023",
  website: "https://fooddb.mext.go.jp/details/details.pl?ITEM_NO=17_17107_7",
  reusePolicyUrl: "https://www.mext.go.jp/a_menu/syokuhinseibun/index.htm",
  reuseTerms: "Food-composition data may be freely used; MEXT requests source attribution for secondary use including applications.",
  requiredAttribution: "Source: Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023, MEXT.",
  country: "Japan",
  region: "Asia",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1_PROVIDER_EXTENSION",
  evidenceTranche: "B48",
  runtimeFetch: false,
  compositionScope: "EXACT_NAM_PLA_FISH_SAUCE_17107_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF"
});

const fishSauce = Object.freeze({
  canonicalIngredientId: "fish_sauce",
  foodId: "17107",
  foodName: "Nam pla (fish sauce)",
  sourceCategory: "SEASONINGS AND SPICES/Seasoning sauce/Nam pla (fish sauce)",
  foodForm: "NAM_PLA_FISH_SAUCE_READY_TO_USE",
  matchConfidence: "high",
  matchNotes: "MEXT food 17107 is explicitly named Nam pla (fish sauce), directly matching the repository's generic fish-sauce canonical identity for the authored Southeast Asian recipe. B48 does not authorize oyster sauce, soy sauce, fish stock, another fermented seasoning, a household portion, density or volume conversion.",
  per100g: Object.freeze({
    energyKcal: 47,
    proteinG: 9.1,
    carbohydrateG: 5.5,
    fatG: 0.1,
    fibreG: 0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: "ENERC_KCAL", valueType: "Published", method: "Published energy: 47 kcal per 100 g" }),
    proteinG: Object.freeze({ sourceCode: "PROT", valueType: "Published", method: "Published protein: 9.1 g per 100 g" }),
    carbohydrateG: Object.freeze({ sourceCode: "CHOAVLDF-", valueType: "Published calculated field", method: "MEXT available carbohydrate calculated by difference: 5.5 g per 100 g" }),
    fatG: Object.freeze({ sourceCode: "FAT", valueType: "Published", method: "Published lipid: 0.1 g per 100 g" }),
    fibreG: Object.freeze({ sourceCode: "FIBTG", valueType: "Published estimated zero", method: "Published total dietary fibre: (0) g per 100 g" })
  }),
  evidenceState: "MEXT_2023_EXACT_FISH_SAUCE_COMPOSITION_MATCH",
  sourceId: MEXT_COMPOSITION_SOURCE_B48.id,
  evidenceTranche: "B48"
});

export const MEXT_COMPOSITION_DENSITIES_B48 = Object.freeze({ fish_sauce: fishSauce });

export const mextCompositionB48ForIngredient = ingredientId =>
  MEXT_COMPOSITION_DENSITIES_B48[ingredientId] || null;
