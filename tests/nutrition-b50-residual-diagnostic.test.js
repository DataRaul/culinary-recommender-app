import test from "node:test";
import assert from "node:assert/strict";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

test("B50 temporary diagnostic ranks current missing-density blockers", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const counts = new Map();
  for (const detail of audit.recipeDetails) {
    for (const blocker of detail.blockers.filter(item => item.reason === "missing_density")) {
      counts.set(blocker.ingredientId, (counts.get(blocker.ingredientId) || 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const total = ranked.reduce((sum, [, count]) => sum + count, 0);
  assert.equal(total, audit.blockerCounts.missing_density);
  assert.fail(`B50=${ranked.map(([id, count]) => `${id}:${count}`).join(",")}`);
});
