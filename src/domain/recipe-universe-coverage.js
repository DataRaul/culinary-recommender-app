import { ALL_RECIPES, AUTHORED_RECIPES, EXTERNAL_RECIPES } from "../data/corpus-v1.js";
import { buildDishFamilyIndex, crossSourceDishFamilies } from "../data/dish-families-v1.js";

export const RECIPE_ROLE_TAXONOMY_V1 = Object.freeze([
  "staple_everyday",
  "canonical_classic",
  "regional_traditional",
  "contemporary_modern",
  "genuinely_new_trending",
  "constraint_first",
  "technique_learning"
]);

const countBy = values => Object.fromEntries([...values.reduce((map, value) => {
  const key = value || "unknown";
  map.set(key, (map.get(key) || 0) + 1);
  return map;
}, new Map()).entries()].sort((a, b) => a[0].localeCompare(b[0])));

export function recipeUniverseCoverage() {
  const externalRoleCounts = Object.fromEntries(RECIPE_ROLE_TAXONOMY_V1.map(role => [role, 0]));
  for (const recipe of EXTERNAL_RECIPES) {
    for (const role of recipe.corpusMetadata?.recipeRoles || []) {
      if (Object.hasOwn(externalRoleCounts, role)) externalRoleCounts[role] += 1;
    }
  }

  const dishFamilies = buildDishFamilyIndex(ALL_RECIPES);
  const crossSource = crossSourceDishFamilies(ALL_RECIPES);
  const externalCuisineCounts = countBy(EXTERNAL_RECIPES.map(recipe => recipe.culinary?.cuisine));
  const externalCountryCounts = countBy(EXTERNAL_RECIPES.map(recipe => recipe.geography?.country || recipe.geography?.region || "unknown"));
  const externalMealRoleCounts = countBy(EXTERNAL_RECIPES.flatMap(recipe => recipe.culinary?.mealTypes || []));
  const externalDifficultyCounts = countBy(EXTERNAL_RECIPES.map(recipe => String(recipe.culinary?.difficulty ?? "unknown")));
  const externalDietaryCounts = countBy(EXTERNAL_RECIPES.flatMap(recipe => recipe.dietaryTags || []));
  const externalEquipmentCounts = countBy(EXTERNAL_RECIPES.flatMap(recipe => {
    const equipment = recipe.equipment;
    return Array.isArray(equipment) ? equipment : equipment?.required || [];
  }));

  const timeKnown = EXTERNAL_RECIPES.filter(recipe => Number.isFinite(recipe.time?.totalMinutes)).length;
  const servingKnown = EXTERNAL_RECIPES.filter(recipe => Number.isFinite(recipe.serving?.servings)).length;
  const searchOnly = EXTERNAL_RECIPES.filter(recipe => recipe.governance?.recommendationState === "SEARCH_ONLY");
  const referenceOnly = EXTERNAL_RECIPES.filter(recipe => recipe.governance?.recommendationState === "REFERENCE_ONLY_INCOMPLETE_HARD_METADATA");

  return {
    schemaVersion: "recipe-universe-coverage-v1",
    totalRecipeCount: ALL_RECIPES.length,
    authoredRecipeCount: AUTHORED_RECIPES.length,
    externalRecipeCount: EXTERNAL_RECIPES.length,
    externalSourceCount: new Set(EXTERNAL_RECIPES.map(recipe => recipe.provenance?.sourceName).filter(Boolean)).size,
    externalSearchEligibleCount: searchOnly.length,
    externalReferenceOnlyCount: referenceOnly.length,
    externalSearchEligibleIds: searchOnly.map(recipe => recipe.id).sort(),
    externalReferenceOnlyIds: referenceOnly.map(recipe => recipe.id).sort(),
    exactRevisionPinnedCount: EXTERNAL_RECIPES.filter(recipe => Number.isInteger(recipe.provenance?.sourceRevisionId)).length,
    externalTimeKnownCount: timeKnown,
    externalTimeUnknownCount: EXTERNAL_RECIPES.length - timeKnown,
    externalServingKnownCount: servingKnown,
    externalServingUnknownCount: EXTERNAL_RECIPES.length - servingKnown,
    externalCuisineCounts,
    externalCountryCounts,
    externalMealRoleCounts,
    externalDifficultyCounts,
    externalDietaryCounts,
    externalEquipmentCounts,
    externalRoleCounts,
    missingExternalRoles: RECIPE_ROLE_TAXONOMY_V1.filter(role => externalRoleCounts[role] === 0),
    dishFamilyCount: dishFamilies.size,
    crossSourceDishFamilyCount: crossSource.length,
    crossSourceDishFamilies: crossSource,
    unknownPolicy: "UNKNOWN_IS_EXPLICIT_AND_NEVER_COERCED_TO_ZERO_OR_GUESSED_METADATA",
    nutritionPolicy: "EXTERNAL_RECIPE_TEXT_DOES_NOT_BECOME_AUTHORITATIVE_COMPOSITION",
    runtimePolicy: "EXTERNAL_RECORDS_WITH_COMPLETE_HARD_SEARCH_METADATA_ARE_SEARCH_ONLY_UNTIL_SEPARATELY_PLANNER_GATED"
  };
}
