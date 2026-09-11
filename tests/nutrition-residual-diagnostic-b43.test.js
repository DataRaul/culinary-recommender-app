import test from "node:test";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

test("B43 diagnostic prints residual blocker frequencies without changing authority", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const byReason = {};
  for (const detail of audit.recipeDetails) {
    for (const blocker of detail.blockers) {
      byReason[blocker.reason] ||= {};
      byReason[blocker.reason][blocker.ingredientId] = (byReason[blocker.reason][blocker.ingredientId] || 0) + 1;
    }
  }
  const sorted = Object.fromEntries(Object.entries(byReason).map(([reason, counts]) => [
    reason,
    Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  ]));
  console.log("B43_RESIDUAL_BLOCKERS=" + JSON.stringify(sorted));
});
