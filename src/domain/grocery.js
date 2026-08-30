import { ingredientById } from "../data/ingredients.js";

const compatibleKey = item => `${item.canonicalIngredientId}|${item.unit || ""}`;

export function buildGroceryList(planItems, pantryStapleIds = []) {
  const pantry = new Set(pantryStapleIds);
  const grouped = new Map();
  const optional = [];
  const substitutions = [];
  const recipeUsage = new Map();

  for (const planItem of planItems) {
    const adaptationMap = new Map((planItem.availability?.adaptations || []).map(item => [item.from, item]));
    for (const ingredient of planItem.recipe.ingredients) {
      const adaptation = adaptationMap.get(ingredient.canonicalIngredientId);
      const ingredientId = adaptation?.to || ingredient.canonicalIngredientId;
      if (adaptation) substitutions.push({ recipeId: planItem.recipe.id, ...adaptation });
      recipeUsage.set(ingredientId, (recipeUsage.get(ingredientId) || 0) + 1);
      const normalized = { ...ingredient, canonicalIngredientId: ingredientId };
      if (!ingredient.required) { optional.push(normalized); continue; }
      const key = compatibleKey(normalized);
      const existing = grouped.get(key) || { ingredientId, quantity: 0, unit: normalized.unit, uses: 0, pantry: pantry.has(ingredientId) };
      if (typeof normalized.quantity === "number") existing.quantity += normalized.quantity;
      existing.uses += 1;
      grouped.set(key, existing);
    }
  }

  const entries = [...grouped.values()].map(item => ({ ...item, name: ingredientById(item.ingredientId)?.name || item.ingredientId }))
    .sort((a, b) => Number(a.pantry) - Number(b.pantry) || a.name.localeCompare(b.name));
  const shopping = entries.filter(item => !item.pantry);
  const pantryItems = entries.filter(item => item.pantry);
  const reusedIngredientCount = [...recipeUsage.values()].filter(count => count > 1).length;
  const portions = planItems.reduce((sum, item) => sum + item.recipe.serving.servings, 0);
  return { entries, shopping, pantryItems, optional, substitutions, meals: planItems.length, portions, reusedIngredientCount };
}
