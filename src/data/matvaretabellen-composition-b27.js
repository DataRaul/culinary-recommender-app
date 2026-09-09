// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B27 is composition-only and does not authorize a household portion or cooked-yield conversion.
// The reviewed identity is jasmine rice, uncooked, and must not be applied to cooked, generic or other named rice forms.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B27 = Object.freeze({
  id: "matvaretabellen-2026-composition-b27",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/rice-jasmin-uncooked/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B27",
  runtimeFetch: false,
  compositionScope: "REVIEWED_DRY_UNCOOKED_JASMINE_RICE",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const jasmineRice = Object.freeze({
  canonicalIngredientId: "jasmine_rice",
  foodId: "05.306",
  foodName: "Rice, Jasmin, uncooked",
  scientificName: "Oryza sativa L.",
  foodEx2: "Rice grain, polished (A003D)",
  foodForm: "DRY_UNCOOKED_POLISHED_JASMINE_RICE",
  matchConfidence: "high",
  matchNotes: "The official food identity is Jasmin rice, uncooked. LanguaL classifies the record as rice seed with skin and germ removed, not heat-treated, water removed and dehydrated/dried. The authored jasmine_rice input is direct gram mass and is cooked only after declaration, so the source preparation state matches without a cooked-yield conversion.",
  per100g: Object.freeze({
    energyKcal: 355,
    proteinG: 7.5,
    carbohydrateG: 79.6,
    fatG: 0.7,
    fibreG: 0.0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 1,507 kJ / 355 kcal" }),
    proteinG: Object.freeze({ sourceCode: "209", valueType: "Average", method: "Norwegian Food Control Authority and Directorate of Health and Social Affairs nutrient analysis 2002-2003" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "209", valueType: "Average", method: "Norwegian Food Control Authority and Directorate of Health and Social Affairs nutrient analysis 2002-2003" }),
    fibreG: Object.freeze({ sourceCode: "60a", valueType: "Estimated zero below limit of quantification", method: "Official Food Composition Table published dietary-fibre zero below limit of quantification" })
  }),
  evidenceState: "MATVARETABELLEN_2026_REVIEWED_DRY_UNCOOKED_JASMINE_RICE_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B27.id,
  evidenceTranche: "B27"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B27 = Object.freeze({ jasmine_rice: jasmineRice });

export const matvaretabellenCompositionB27ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B27[ingredientId] || null;
