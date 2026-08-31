import { RECIPES } from "./data/recipes.js";
import "./data/corpus-v1.js";
import { WIKIBOOKS_GATE_F_RECIPES } from "./data/external/wikibooks-gate-f-v1.js";

const existingIds = new Set(RECIPES.map(recipe => recipe.id));
for (const recipe of WIKIBOOKS_GATE_F_RECIPES) {
  if (existingIds.has(recipe.id)) continue;
  RECIPES.push(recipe);
  existingIds.add(recipe.id);
}

export const RUNTIME_RECIPE_COUNT = RECIPES.length;
