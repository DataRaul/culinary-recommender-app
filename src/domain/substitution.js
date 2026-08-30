import { SUBSTITUTIONS } from "../data/substitutions.js";
import { ingredientById } from "../data/ingredients.js";
import { isIngredientPermanentlyExcluded } from "./exclusions.js";

const conflicts = (ingredient, profile) => {
  if (!ingredient) return true;
  if (isIngredientPermanentlyExcluded(ingredient.id, profile.excludedIngredientIds)) return true;
  if (profile.unavailableIngredientIds?.includes(ingredient.id)) return true;
  return ingredient.allergens.some(allergen => profile.allergens?.includes(allergen));
};

export function suggestSubstitutions(ingredientId, profile = {}) {
  return (SUBSTITUTIONS[ingredientId] || [])
    .map(option => ({ ...option, ingredient: ingredientById(option.ingredientId) }))
    .filter(option => option.ingredient && !conflicts(option.ingredient, profile));
}

export function resolveAvailability(recipe, profile = {}) {
  const unavailable = new Set(profile.unavailableIngredientIds || []);
  const adaptations = [];
  const unresolved = [];
  for (const ingredient of recipe.ingredients) {
    const id = ingredient.canonicalIngredientId;
    if (!unavailable.has(id)) continue;
    const replacement = suggestSubstitutions(id, profile)[0];
    if (replacement) adaptations.push({ from: id, to: replacement.ingredientId, type: replacement.type, note: replacement.note });
    else if (ingredient.required) unresolved.push(id);
  }
  return { adaptations, unresolved, substitutionBurden: adaptations.length + unresolved.length * 3 };
}
