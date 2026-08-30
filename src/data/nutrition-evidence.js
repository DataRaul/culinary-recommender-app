export const USDA_FOUNDATION_SOURCE = {
  id: "usda-fdc-foundation-2026-04",
  name: "USDA FoodData Central — Foundation Foods",
  releaseDate: "2026-04-30",
  releaseVersion: "15.0",
  dataType: "Foundation",
  licence: "CC0-1.0 / U.S. public domain",
  homepage: "https://fdc.nal.usda.gov/",
  downloadPage: "https://fdc.nal.usda.gov/download-datasets/",
  state: "SOURCE_VERIFIED_STATIC_IMPORT_NOT_BUNDLED",
  note: "Foundation Foods is suitable for a future static composition extract. Runtime API access is not required by the public app."
};

const evidence = (canonicalIngredientId, ndbNumber, description, matchConfidence = "high", notes = null) => ({
  canonicalIngredientId,
  sourceId: USDA_FOUNDATION_SOURCE.id,
  sourceIdentifier: String(ndbNumber),
  sourceIdentifierType: "NDB_NUMBER",
  description,
  dataType: "Foundation",
  matchConfidence,
  state: "IDENTITY_VERIFIED_COMPOSITION_PENDING",
  notes
});

// Identity matches are intentionally separate from nutrient-density records.
// A verified source identity must never be interpreted as if composition values
// have already been imported into the public bundle.
export const NUTRITION_IDENTITY_EVIDENCE = {
  chicken_breast: evidence("chicken_breast", 100304, "Chicken, breast, boneless, skinless, raw"),
  black_beans: evidence("black_beans", 100314, "Beans, black, canned, sodium added, drained and rinsed", "high", "Matches the common canned/drained form used by the authored corpus."),
  white_beans: evidence("white_beans", 100316, "Beans, cannellini, canned, sodium added, drained and rinsed", "high", "Canonical white-bean recipes currently use a canned/drained assumption."),
  pinto_beans: evidence("pinto_beans", 100321, "Beans, pinto, canned, sodium added, drained and rinsed", "high", "Matches the common canned/drained form used by the authored corpus."),
  kidney_beans: evidence("kidney_beans", 100318, "Beans, kidney, dark red, canned, sodium added, sugar added, drained and rinsed", "medium", "Family/form match; authored recipes do not currently specify dark-red versus light-red variety."),
  green_beans: evidence("green_beans", 11052, "Beans, snap, green, raw"),
  avocado: evidence("avocado", 100348, "Avocado, Hass, peeled, raw", "high", "Hass is a specific commercial variety; retain the variety distinction in any future density import."),
  banana: evidence("banana", 9040, "Bananas, ripe and slightly ripe, raw", "medium", "Ripeness materially affects composition; use this mapping only when the authored ingredient is a typical ripe banana."),
  tuna: evidence("tuna", 15121, "Fish, tuna, light, canned in water, drained solids", "high", "Matches the pantry-oriented canned tuna assumption."),
  cashews: evidence("cashews", 12087, "Nuts, cashew nuts, raw"),
  almonds: evidence("almonds", 12061, "Nuts, almonds, whole, raw"),
  walnuts: evidence("walnuts", 12155, "Nuts, walnuts, English, halves, raw"),
  pumpkin_seeds: evidence("pumpkin_seeds", 12014, "Seeds, pumpkin seeds (pepitas), raw"),
  sunflower_seeds: evidence("sunflower_seeds", 12036, "Seeds, sunflower seed, kernel, raw")
};

export const nutritionEvidenceForIngredient = ingredientId => NUTRITION_IDENTITY_EVIDENCE[ingredientId] || null;

export const nutritionEvidenceCoverage = ingredientIds => {
  const unique = [...new Set((ingredientIds || []).filter(Boolean))];
  const mapped = unique.filter(id => NUTRITION_IDENTITY_EVIDENCE[id]);
  const unmapped = unique.filter(id => !NUTRITION_IDENTITY_EVIDENCE[id]);
  return {
    totalCanonicalIngredients: unique.length,
    mappedIngredientIds: mapped,
    unmappedIngredientIds: unmapped,
    mappedCount: mapped.length,
    unmappedCount: unmapped.length,
    coverageRatio: unique.length ? Number((mapped.length / unique.length).toFixed(4)) : 0,
    compositionState: "NOT_IMPORTED"
  };
};
