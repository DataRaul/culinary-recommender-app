import { RECIPES } from "./recipes.js";
import { EXPANDED_RECIPES } from "./recipes-v1.js";
import { SEARCH_COVERAGE_RECIPES } from "./recipes-v1-search.js";
import { WIKIBOOKS_GATE_F_RECIPES } from "./external/wikibooks-gate-f-v1.js";
import { UNITOOLS_STEP8F_RECIPES } from "./external/unitools-step8f-v1.js";

const existingIds = new Set(RECIPES.map(recipe => recipe.id));
for (const recipe of [...EXPANDED_RECIPES, ...SEARCH_COVERAGE_RECIPES]) {
  if (!existingIds.has(recipe.id)) {
    RECIPES.push(recipe);
    existingIds.add(recipe.id);
  }
}

// Snapshot the authored lane before any browser runtime adapter appends external records.
export const AUTHORED_RECIPES = Object.freeze([...RECIPES]);

// Gate F's eight Wikibooks records remain the immutable 84-record golden-corpus extension.
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

const goldenUniverseIds = new Set(AUTHORED_RECIPES.map(recipe => recipe.id));
const externalWithoutIdCollisions = EXTERNAL_RECIPES.filter(recipe => {
  if (goldenUniverseIds.has(recipe.id)) return false;
  goldenUniverseIds.add(recipe.id);
  return true;
});

// Historical benchmark/oracle corpus. Preserve its reviewed pre-activation behavior even
// when a later explicitly authorized public-runtime safety correction changes authored data.
const HISTORICAL_AUTHORED_RECIPES = Object.freeze(AUTHORED_RECIPES.map(recipe => {
  if (recipe.id !== "med_pumpkin_white_bean_barley_stew") return recipe;
  return Object.freeze({
    ...recipe,
    allergySafety: Object.freeze({
      ...recipe.allergySafety,
      declaredAllergens: Object.freeze(
        (recipe.allergySafety?.declaredAllergens || []).filter(allergen => allergen !== "celery")
      )
    })
  });
}));
export const ALL_RECIPES = Object.freeze([...HISTORICAL_AUTHORED_RECIPES, ...externalWithoutIdCollisions]);
export const recipeByIdV1 = id => ALL_RECIPES.find(recipe => recipe.id === id) || null;

// Step 8F adds only the explicitly approved recommendation-eligible UniTools record.
// The public runtime is built from current authored records, not the frozen historical oracle.
export const CURRENT_PUBLIC_BASE_RECIPES = Object.freeze([...AUTHORED_RECIPES, ...externalWithoutIdCollisions]);
const publicIds = new Set(CURRENT_PUBLIC_BASE_RECIPES.map(recipe => recipe.id));
export const ACTIVATED_EXTERNAL_RECIPES = Object.freeze(UNITOOLS_STEP8F_RECIPES.filter(recipe => {
  if (publicIds.has(recipe.id)) return false;
  publicIds.add(recipe.id);
  return true;
}));
export const PUBLIC_EXTERNAL_RECIPES = Object.freeze([...EXTERNAL_RECIPES, ...ACTIVATED_EXTERNAL_RECIPES]);
export const PUBLIC_RUNTIME_RECIPES = Object.freeze([...CURRENT_PUBLIC_BASE_RECIPES, ...ACTIVATED_EXTERNAL_RECIPES]);
export const publicRecipeById = id => PUBLIC_RUNTIME_RECIPES.find(recipe => recipe.id === id) || null;
