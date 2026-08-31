import { RECIPES } from "./recipes.js";
import { EXPANDED_RECIPES } from "./recipes-v1.js";
import { SEARCH_COVERAGE_RECIPES } from "./recipes-v1-search.js";

const existingIds = new Set(RECIPES.map(recipe => recipe.id));
for (const recipe of [...EXPANDED_RECIPES, ...SEARCH_COVERAGE_RECIPES]) {
  if (!existingIds.has(recipe.id)) {
    RECIPES.push(recipe);
    existingIds.add(recipe.id);
  }
}

export const ALL_RECIPES = RECIPES;
export const recipeByIdV1 = id => ALL_RECIPES.find(recipe => recipe.id === id) || null;
