import { normalizeProfile } from "./profile.js";
import { evaluateRecipe, explainShortfall } from "./recommendation.js";

const unique = values => [...new Set((values || []).filter(Boolean))];

export function buildSearchProfile(rawProfile, options = {}) {
  const saved = normalizeProfile(rawProfile);
  const profile = options.followProfilePreferences === false
    ? normalizeProfile({
        ...saved,
        budget: 4,
        nutritionPriority: 1,
        speed: 1,
        cuisinePreferences: [],
        proteinEmphasis: 1,
        mealPrep: 1,
        priorityPacks: []
      })
    : saved;

  if (options.maxMinutes != null) profile.maxMinutes = Number(options.maxMinutes);
  if (options.skill != null) profile.skill = Number(options.skill);
  if (options.variety != null) profile.variety = Number(options.variety);
  return normalizeProfile(profile);
}

export function searchRecipesByIngredients(recipes, rawProfile, query = {}) {
  const mainIngredientId = query.mainIngredientId || null;
  const secondaryIngredientIds = unique(query.secondaryIngredientIds);
  if (!mainIngredientId) {
    return {
      eligible: [], blocked: [], catalogMatchCount: 0,
      requiredSecondaryMismatchCount: 0,
      shortfall: [], error: "MAIN_INGREDIENT_REQUIRED"
    };
  }

  const profile = buildSearchProfile(rawProfile, query);
  const catalogMatches = recipes.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === mainIngredientId));
  const eligible = [];
  const blocked = [];
  let requiredSecondaryMismatchCount = 0;

  for (const recipe of catalogMatches) {
    const ids = new Set(recipe.ingredients.map(item => item.canonicalIngredientId));
    const secondaryMatches = secondaryIngredientIds.filter(id => ids.has(id));
    const missingSecondary = secondaryIngredientIds.filter(id => !ids.has(id));

    if (query.requireAllSecondary && missingSecondary.length) {
      requiredSecondaryMismatchCount += 1;
      continue;
    }

    const evaluation = evaluateRecipe(recipe, profile, { mealType: query.mealType || null });
    const ingredientCoverage = secondaryIngredientIds.length
      ? secondaryMatches.length / secondaryIngredientIds.length
      : 1;
    const item = {
      ...evaluation,
      mainIngredientId,
      secondaryMatches,
      missingSecondary,
      ingredientCoverage: Number(ingredientCoverage.toFixed(6)),
      searchScore: evaluation.eligible
        ? Number((evaluation.score + ingredientCoverage * 0.25).toFixed(6))
        : -Infinity
    };
    (evaluation.eligible ? eligible : blocked).push(item);
  }

  eligible.sort((a, b) =>
    b.secondaryMatches.length - a.secondaryMatches.length ||
    b.searchScore - a.searchScore ||
    a.recipe.id.localeCompare(b.recipe.id)
  );
  blocked.sort((a, b) => a.recipe.id.localeCompare(b.recipe.id));

  return {
    eligible,
    blocked,
    catalogMatchCount: catalogMatches.length,
    requiredSecondaryMismatchCount,
    shortfall: explainShortfall(blocked),
    profile,
    mealType: query.mealType || null,
    error: null
  };
}
