import test from "node:test";
import assert from "node:assert/strict";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

test("B50 temporary diagnostic ranks current missing-density blockers with authored context", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const byIngredient = new Map();
  for (const detail of audit.recipeDetails) {
    const recipe = AUTHORED_RECIPES.find(item => item.id === detail.recipeId);
    for (const blocker of detail.blockers.filter(item => item.reason === "missing_density")) {
      const ingredient = recipe?.ingredients?.find(item => item.canonicalIngredientId === blocker.ingredientId);
      const row = byIngredient.get(blocker.ingredientId) || { ingredientId: blocker.ingredientId, count: 0, uses: [] };
      row.count += 1;
      row.uses.push({
        recipeId: detail.recipeId,
        quantity: ingredient?.quantity ?? null,
        unit: ingredient?.unit ?? null,
        preparation: ingredient?.preparation ?? null
      });
      byIngredient.set(blocker.ingredientId, row);
    }
  }
  const ranked = [...byIngredient.values()]
    .sort((a, b) => b.count - a.count || a.ingredientId.localeCompare(b.ingredientId));
  const payload = {
    missingDensityCount: audit.blockerCounts.missing_density,
    ranked
  };
  assert.fail("B50_RESIDUAL_DIAGNOSTIC=" + JSON.stringify(payload));
});
