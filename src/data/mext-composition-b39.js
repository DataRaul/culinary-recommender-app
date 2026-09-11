// Bounded static composition evidence from Japan's official Standard Tables of Food Composition.
// B39 is restricted to exact rice vinegar food 17016. It introduces no household-unit
// conversion and preserves MEXT's available-carbohydrate-by-difference semantic explicitly.

export const MEXT_COMPOSITION_SOURCE_B39 = Object.freeze({
  id: "mext-standard-tables-2023-composition-b39",
  authority: "Ministry of Education, Culture, Sports, Science and Technology (MEXT), Japan",
  dataset: "Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023",
  releaseDate: "2023",
  website: "https://fooddb.mext.go.jp/details/details.pl?ITEM_NO=17_17016_7",
  reusePolicyUrl: "https://www.mext.go.jp/a_menu/syokuhinseibun/index.htm",
  reuseTerms: "Food-composition data may be freely used; MEXT requests source attribution for secondary use including applications.",
  requiredAttribution: "Source: Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023, MEXT.",
  country: "Japan",
  region: "Asia",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1_PROVIDER_EXTENSION",
  evidenceTranche: "B39",
  runtimeFetch: false,
  compositionScope: "EXACT_RICE_VINEGAR_17016_ONLY",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF"
});

const riceVinegar = Object.freeze({
  canonicalIngredientId: "rice_vinegar",
  foodId: "17016",
  foodName: "Rice vinegar",
  sourceCategory: "SEASONINGS AND SPICES/Vinegar/rice vinegar",
  foodForm: "RICE_VINEGAR_UNSPECIFIED_BRAND",
  matchConfidence: "high",
  matchNotes: "MEXT food 17016 is explicitly named Rice vinegar. The canonical repository identity is likewise generic rice vinegar, so B39 admits this exact composition identity. No seasoned/sweetened rice vinegar, grain vinegar, wine vinegar, black rice vinegar, household portion, density or volume conversion is inferred.",
  per100g: Object.freeze({
    energyKcal: 46,
    proteinG: 0.2,
    carbohydrateG: 7.4,
    fatG: 0,
    fibreG: 0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: "ENERC_KCAL", valueType: "Published", method: "Published energy: 46 kcal per 100 g" }),
    proteinG: Object.freeze({ sourceCode: "PROT", valueType: "Published", method: "Published protein: 0.2 g per 100 g" }),
    carbohydrateG: Object.freeze({ sourceCode: "CHOAVLDF-", valueType: "Published calculated field", method: "MEXT available carbohydrate calculated by difference: 7.4 g per 100 g" }),
    fatG: Object.freeze({ sourceCode: "FAT", valueType: "Published", method: "Published lipid: 0 g per 100 g" }),
    fibreG: Object.freeze({ sourceCode: "FIBTG", valueType: "Published estimated zero", method: "Published total dietary fibre: (0) g per 100 g" })
  }),
  evidenceState: "MEXT_2023_EXACT_RICE_VINEGAR_COMPOSITION_MATCH",
  sourceId: MEXT_COMPOSITION_SOURCE_B39.id,
  evidenceTranche: "B39"
});

export const MEXT_COMPOSITION_DENSITIES_B39 = Object.freeze({ rice_vinegar: riceVinegar });

export const mextCompositionB39ForIngredient = ingredientId =>
  MEXT_COMPOSITION_DENSITIES_B39[ingredientId] || null;
