import { RECIPES } from "./data/recipes.js";
import { EXTERNAL_RECIPES } from "./data/corpus-v1.js";

const existingIds = new Set(RECIPES.map(recipe => recipe.id));
for (const recipe of EXTERNAL_RECIPES) {
  if (existingIds.has(recipe.id)) continue;
  RECIPES.push(recipe);
  existingIds.add(recipe.id);
}

export const RUNTIME_RECIPE_COUNT = RECIPES.length;
