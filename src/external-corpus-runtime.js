import { RECIPES } from "./data/recipes.js";
import { AUTHORED_RECIPES, EXTERNAL_RECIPES } from "./data/corpus-v1.js";

const existingIds = new Set(RECIPES.map(recipe => recipe.id));
for (const recipe of EXTERNAL_RECIPES) {
  if (existingIds.has(recipe.id)) continue;
  RECIPES.push(recipe);
  existingIds.add(recipe.id);
}

export const RUNTIME_RECIPE_COUNT = RECIPES.length;
export const RUNTIME_RECIPE_STATUS = `${RUNTIME_RECIPE_COUNT} recipes · ${AUTHORED_RECIPES.length} curated + ${EXTERNAL_RECIPES.length} open external · deterministic`;

const statusPill = document.querySelector("#statusPill");
const syncStatus = () => {
  if (statusPill && statusPill.textContent !== RUNTIME_RECIPE_STATUS) statusPill.textContent = RUNTIME_RECIPE_STATUS;
};
if (statusPill) {
  new MutationObserver(syncStatus).observe(statusPill, { childList: true, characterData: true, subtree: true });
  queueMicrotask(syncStatus);
}
