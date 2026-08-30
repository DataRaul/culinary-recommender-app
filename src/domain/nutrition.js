import { nutritionEvidenceCoverage, nutritionEvidenceForIngredient, USDA_FOUNDATION_SOURCE } from "../data/nutrition-evidence.js";

const supportedMassToGrams = (quantity, unit) => {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) return null;
  if (unit === "g") return quantity;
  if (unit === "kg") return quantity * 1000;
  return null;
};

const nutrientKeys = ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"];

export function calculatePerServingFromDensities(recipe, densityMap = {}) {
  const totals = Object.fromEntries(nutrientKeys.map(key => [key, 0]));
  const used = [];
  const skipped = [];

  for (const ingredient of recipe.ingredients || []) {
    const ingredientId = ingredient.canonicalIngredientId;
    const density = densityMap[ingredientId];
    const grams = supportedMassToGrams(ingredient.quantity, ingredient.unit);
    if (!density || grams === null) {
      skipped.push({ ingredientId, reason: !density ? "missing_density" : "unsupported_quantity_unit" });
      continue;
    }
    const factor = grams / 100;
    for (const key of nutrientKeys) totals[key] += Number(density[key] || 0) * factor;
    used.push({ ingredientId, grams });
  }

  const servings = Math.max(1, Number(recipe.serving?.servings) || 1);
  const perServing = Object.fromEntries(nutrientKeys.map(key => [key, Number((totals[key] / servings).toFixed(2))]));
  return {
    perServing,
    used,
    skipped,
    complete: skipped.length === 0 && used.length > 0,
    calculationState: skipped.length === 0 && used.length > 0 ? "CALCULATED_FROM_STATIC_DENSITIES" : used.length ? "PARTIAL_STATIC_CALCULATION" : "INSUFFICIENT_STATIC_DATA"
  };
}

export const publicNutritionSource = {
  estimate(recipe) {
    const ingredientIds = (recipe.ingredients || []).map(item => item.canonicalIngredientId);
    const coverage = nutritionEvidenceCoverage(ingredientIds);
    const identities = coverage.mappedIngredientIds.map(ingredientId => nutritionEvidenceForIngredient(ingredientId));
    return {
      perServing: { ...(recipe.nutrition?.perServing || {}) },
      method: recipe.nutrition?.estimationState || "INFERRED_ESTIMATE",
      confidence: recipe.nutrition?.confidence || "low",
      provenance: recipe.nutrition?.provenance || "Project-authored estimate.",
      evidence: {
        source: USDA_FOUNDATION_SOURCE,
        coverage,
        identities,
        compositionImported: false,
        state: "IDENTITY_MAPPING_IN_PROGRESS_COMPOSITION_PENDING"
      }
    };
  }
};
