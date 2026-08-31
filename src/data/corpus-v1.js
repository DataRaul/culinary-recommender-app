import { RECIPES } from "./recipes.js";
import { EXPANDED_RECIPES } from "./recipes-v1.js";
import { SEARCH_COVERAGE_RECIPES } from "./recipes-v1-search.js";
import { WIKIBOOKS_GATE_F_RECIPES } from "./external/wikibooks-gate-f-v1.js";

const existingIds = new Set(RECIPES.map(recipe => recipe.id));
for (const recipe of [...EXPANDED_RECIPES, ...SEARCH_COVERAGE_RECIPES]) {
  if (!existingIds.has(recipe.id)) {
    RECIPES.push(recipe);
    existingIds.add(recipe.id);
  }
}

// Snapshot the authored lane before any browser runtime adapter appends external records
// to the legacy RECIPES array. This keeps authored baselines and public status counts
// stable even though the accepted shell still consumes RECIPES directly.
export const AUTHORED_RECIPES = Object.freeze([...RECIPES]);
export const EXTERNAL_RECIPES = Object.freeze(WIKIBOOKS_GATE_F_RECIPES.map(recipe => ({
  ...recipe,
  mainProtein: recipe.mainProtein ?? null,
  discovery: {
    flavourProfile: [],
    ...(recipe.discovery || {})
  },
  governance: {
    ...(recipe.governance || {}),
    recommendationState: recipe.governance?.recommendationState === "ELIGIBLE"
      ? "SEARCH_ONLY"
      : recipe.governance?.recommendationState
  }
})));

const universeIds = new Set(AUTHORED_RECIPES.map(recipe => recipe.id));
const externalWithoutIdCollisions = EXTERNAL_RECIPES.filter(recipe => {
  if (universeIds.has(recipe.id)) return false;
  universeIds.add(recipe.id);
  return true;
});

export const ALL_RECIPES = Object.freeze([...AUTHORED_RECIPES, ...externalWithoutIdCollisions]);
export const recipeByIdV1 = id => ALL_RECIPES.find(recipe => recipe.id === id) || null;