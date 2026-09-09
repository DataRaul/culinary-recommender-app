// Bounded static composition evidence from the official Norwegian Food Composition Table 2026.
// B28 is composition-only and does not authorize a household portion or density conversion.
// The reviewed source identity is finely ground table salt; the narrower source qualifier is preserved.

export const MATVARETABELLEN_COMPOSITION_SOURCE_B28 = Object.freeze({
  id: "matvaretabellen-2026-composition-b28",
  authority: "Norwegian Food Safety Authority (Mattilsynet)",
  dataset: "Norwegian Food Composition Table 2026",
  releaseDate: "2026-01",
  apiUrl: "https://www.matvaretabellen.no/api/en/foods.json",
  website: "https://www.matvaretabellen.no/en/salt-table/",
  license: "NLOD 2.0 / Norsk lisens for offentlige data",
  requiredAttribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no",
  country: "Norway",
  region: "Europe",
  state: "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE",
  runtimePolicy: "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1",
  evidenceTranche: "B28",
  runtimeFetch: false,
  compositionScope: "REVIEWED_FINELY_GROUND_TABLE_SALT",
  carbohydrateSemantic: "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO"
});

const salt = Object.freeze({
  canonicalIngredientId: "salt",
  foodId: "12.022",
  foodName: "Salt, table",
  scientificName: null,
  foodEx2: "Salt (A042P)",
  foodForm: "FINELY_GROUND_DRY_TABLE_SALT",
  matchConfidence: "medium",
  matchNotes: "The canonical ingredient is generic culinary salt while the official record is the narrower table-salt identity. LanguaL identifies sodium chloride, finely ground, not heat-treated, water removed and dehydrated/dried. B28 preserves that narrower qualifier and does not generalize the record into mineral, herbal, iodized or other salt identities.",
  per100g: Object.freeze({
    energyKcal: 0,
    proteinG: 0,
    carbohydrateG: 0,
    fatG: 0,
    fibreG: 0
  }),
  fieldEvidence: Object.freeze({
    energyKcal: Object.freeze({ sourceCode: null, valueType: "published", method: "Published energy in 100 g: 0 kJ / 0 kcal" }),
    proteinG: Object.freeze({ sourceCode: "400c", valueType: "Best estimate", method: "Swedish National Food Agency food database source retained by Matvaretabellen" }),
    carbohydrateG: Object.freeze({ sourceCode: "MI0181", valueType: "Best estimate", method: "Carbohydrate, available calculated from sugar and starch (CHO = SUGAR + STARCH)" }),
    fatG: Object.freeze({ sourceCode: "50", valueType: "Logical zero", method: "Official Food Composition Table estimated naturally occurring zero" }),
    fibreG: Object.freeze({ sourceCode: "50", valueType: "Logical zero", method: "Official Food Composition Table estimated naturally occurring zero" })
  }),
  evidenceState: "MATVARETABELLEN_2026_REVIEWED_TABLE_SALT_COMPOSITION_MATCH",
  sourceId: MATVARETABELLEN_COMPOSITION_SOURCE_B28.id,
  evidenceTranche: "B28"
});

export const MATVARETABELLEN_COMPOSITION_DENSITIES_B28 = Object.freeze({ salt });

export const matvaretabellenCompositionB28ForIngredient = ingredientId =>
  MATVARETABELLEN_COMPOSITION_DENSITIES_B28[ingredientId] || null;
