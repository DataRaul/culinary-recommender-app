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

export const AUTHORED_RECIPES = RECIPES;
export const EXTERNAL_RECIPES = WIKIBOOKS_GATE_F_RECIPES;

const universeIds = new Set(AUTHORED_RECIPES.map(recipe => recipe.id));
const externalWithoutIdCollisions = EXTERNAL_RECIPES.filter(recipe => {
  if (universeIds.has(recipe.id)) return false;
  universeIds.add(recipe.id);
  return true;
});

export const ALL_RECIPES = Object.freeze([...AUTHORED_RECIPES, ...externalWithoutIdCollisions]);
export const recipeByIdV1 = id => ALL_RECIPES.find(recipe => recipe.id === id) || null;
