import { USDA_FOUNDATION_COMPOSITION_SOURCE, USDA_FOUNDATION_DENSITIES_V1 } from "./usda-foundation-nutrients-v1.js";
import { USDA_FOUNDATION_DENSITIES_B3 } from "./usda-foundation-nutrients-b3.js";

export const USDA_FOUNDATION_SOURCE = {
  id: "usda-fdc-foundation-2026-04",
  name: "USDA FoodData Central — Foundation Foods",
  releaseDate: "2026-04-30",
  releaseVersion: "15.0",
  dataType: "Foundation",
  licence: "CC0-1.0 / U.S. public domain",
  homepage: "https://fdc.nal.usda.gov/",
  downloadPage: "https://fdc.nal.usda.gov/download-datasets/",
  staticCompositionSourceId: USDA_FOUNDATION_COMPOSITION_SOURCE.id,
  state: "BOUNDED_STATIC_COMPOSITION_BUNDLED",
  note: "Reviewed bounded Foundation nutrient densities are bundled as static public data. Runtime API access is not required by the public app."
};

export const USDA_FOUNDATION_DENSITIES = {
  ...USDA_FOUNDATION_DENSITIES_V1,
  ...USDA_FOUNDATION_DENSITIES_B3
};

const trackedKeys = ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"];

const evidence = (canonicalIngredientId, ndbNumber, description, matchConfidence = "high", notes = null) => {
  const composition = USDA_FOUNDATION_DENSITIES[canonicalIngredientId] || null;
  const availableNutrients = composition ? trackedKeys.filter(key => composition.per100g[key] !== null && composition.per100g[key] !== undefined) : [];
  const missingTrackedNutrients = composition ? trackedKeys.filter(key => composition.per100g[key] === null || composition.per100g[key] === undefined) : trackedKeys;
  const compositionState = !composition
    ? "NOT_IMPORTED"
    : missingTrackedNutrients.length
      ? "STATIC_COMPOSITION_IMPORTED_PARTIAL"
      : "STATIC_COMPOSITION_IMPORTED_COMPLETE_FOR_TRACKED_FIELDS";
  return {
    canonicalIngredientId,
    sourceId: USDA_FOUNDATION_SOURCE.id,
    sourceIdentifier: String(ndbNumber),
    sourceIdentifierType: "NDB_NUMBER",
    fdcId: composition?.fdcId || null,
    description,
    dataType: "Foundation",
    matchConfidence,
    state: compositionState,
    compositionState,
    availableNutrients,
    missingTrackedNutrients,
    notes
  };
};

export const NUTRITION_IDENTITY_EVIDENCE = {
  chicken_breast: evidence("chicken_breast", 100304, "Chicken, breast, boneless, skinless, raw"),
  black_beans: evidence("black_beans", 100314, "Beans, black, canned, sodium added, drained and rinsed", "high", "Matches the common canned/drained form used by the authored corpus."),
  white_beans: evidence("white_beans", 100316, "Beans, cannellini, canned, sodium added, drained and rinsed", "high", "Canonical white-bean recipes currently use a canned/drained assumption."),
  pinto_beans: evidence("pinto_beans", 100321, "Beans, pinto, canned, sodium added, drained and rinsed", "high", "Matches the common canned/drained form used by the authored corpus."),
  kidney_beans: evidence("kidney_beans", 100318, "Beans, kidney, dark red, canned, sodium added, sugar added, drained and rinsed", "medium", "Family/form match; authored recipes do not currently specify dark-red versus light-red variety."),
  green_beans: evidence("green_beans", 11052, "Beans, snap, green, raw"),
  avocado: evidence("avocado", 100348, "Avocado, Hass, peeled, raw", "high", "Hass is a specific commercial variety; retain the variety distinction when interpreting the density record."),
  banana: evidence("banana", 9040, "Bananas, ripe and slightly ripe, raw", "medium", "Ripeness materially affects composition; use this mapping only when the authored ingredient is a typical ripe banana."),
  tuna: evidence("tuna", 15121, "Fish, tuna, light, canned in water, drained solids", "high", "Matches the pantry-oriented canned tuna assumption."),
  cashews: evidence("cashews", 12087, "Nuts, cashew nuts, raw"),
  almonds: evidence("almonds", 12061, "Nuts, almonds, whole, raw"),
  walnuts: evidence("walnuts", 12155, "Nuts, walnuts, English, halves, raw"),
  pumpkin_seeds: evidence("pumpkin_seeds", 12014, "Seeds, pumpkin seeds (pepitas), raw"),
  sunflower_seeds: evidence("sunflower_seeds", 12036, "Seeds, sunflower seed, kernel, raw"),

  broccoli: evidence("broccoli", 11090, "Broccoli, raw"),
  eggs: evidence("eggs", 1123, "Eggs, Grade A, Large, egg whole", "medium", "Canonical eggs do not encode size/grade, so composition is useful but the USDA large-egg household weight is not automatically applied."),
  red_onion: evidence("red_onion", 100252, "Onions, red, raw"),
  onion: evidence("onion", 100253, "Onions, yellow, raw", "medium", "Canonical onion is generic; yellow onion is retained as an explicit variety-qualified Foundation match."),
  garlic: evidence("garlic", 11215, "Garlic, raw"),
  mushroom: evidence("mushroom", 11260, "Mushrooms, white button", "medium", "Canonical mushroom is broader than white button; this match is not generalized to named mushroom varieties."),
  carrot: evidence("carrot", 11124, "Carrots, mature, raw", "medium", "The Foundation record is mature raw carrot rather than baby/frozen carrot."),
  pineapple: evidence("pineapple", 9266, "Pineapple, raw"),
  cucumber: evidence("cucumber", 11205, "Cucumber, with peel, raw", "medium", "The selected Foundation record explicitly includes peel and does not publish fibre in the tracked extract."),
  rice: evidence("rice", 20444, "Rice, white, long grain, unenriched, raw", "medium", "Canonical rice is generic; this record must not be presented as brown, basmati, jasmine or cooked rice."),
  cauliflower: evidence("cauliflower", 11135, "Cauliflower, raw"),
  aubergine: evidence("aubergine", 11209, "Eggplant, raw"),
  tomato_paste: evidence("tomato_paste", 11546, "Tomato, paste, canned, without salt added", "high", "Specific canned no-salt-added form; sodium assumptions remain outside this tracked macronutrient tranche."),
  canned_tomato: evidence("canned_tomato", 11693, "Tomatoes, crushed, canned", "medium", "Canonical canned tomato can cover several cut styles; this composition is specifically crushed canned tomato."),
  spring_onion: evidence("spring_onion", 100391, "Green onion, (scallion), bulb and greens, root removed, raw", "high", "Selected Foundation record publishes only a subset of tracked nutrients, so it remains partial by design.")
};

export const nutritionEvidenceForIngredient = ingredientId => NUTRITION_IDENTITY_EVIDENCE[ingredientId] || null;

export const nutritionEvidenceCoverage = ingredientIds => {
  const unique = [...new Set((ingredientIds || []).filter(Boolean))];
  const mapped = unique.filter(id => NUTRITION_IDENTITY_EVIDENCE[id]);
  const unmapped = unique.filter(id => !NUTRITION_IDENTITY_EVIDENCE[id]);
  const compositionMapped = mapped.filter(id => USDA_FOUNDATION_DENSITIES[id]);
  const completeTracked = compositionMapped.filter(id => NUTRITION_IDENTITY_EVIDENCE[id].compositionState === "STATIC_COMPOSITION_IMPORTED_COMPLETE_FOR_TRACKED_FIELDS");
  const partialTracked = compositionMapped.filter(id => NUTRITION_IDENTITY_EVIDENCE[id].compositionState === "STATIC_COMPOSITION_IMPORTED_PARTIAL");
  return {
    totalCanonicalIngredients: unique.length,
    mappedIngredientIds: mapped,
    unmappedIngredientIds: unmapped,
    mappedCount: mapped.length,
    unmappedCount: unmapped.length,
    coverageRatio: unique.length ? Number((mapped.length / unique.length).toFixed(4)) : 0,
    compositionMappedIngredientIds: compositionMapped,
    compositionMappedCount: compositionMapped.length,
    completeTrackedIngredientIds: completeTracked,
    partialTrackedIngredientIds: partialTracked,
    compositionState: compositionMapped.length ? "BOUNDED_STATIC_COMPOSITION_AVAILABLE" : "NOT_IMPORTED"
  };
};
