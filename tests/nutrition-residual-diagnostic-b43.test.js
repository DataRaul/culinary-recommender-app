import test from "node:test";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

const REVIEW_CANDIDATES = new Set([
  "noodles", "beef_mince", "corn_tortilla", "sweetcorn", "thyme",
  "bread", "butter", "celery", "chicken_thigh", "chilli", "chilli_flakes",
  "coconut_milk", "fish_sauce", "kale", "oregano", "pasta", "risotto_rice",
  "sardines", "sesame_seeds", "tempeh"
]);

test("B43 diagnostic prints residual blocker frequencies and recipe-unlock leverage without changing authority", () => {
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

  const leverage = audit.recipeDetails
    .filter(detail => detail.blockers.some(blocker => blocker.reason === "missing_density" && REVIEW_CANDIDATES.has(blocker.ingredientId)))
    .map(detail => ({
      recipeId: detail.recipeId,
      targetDensityBlockers: detail.blockers
        .filter(blocker => blocker.reason === "missing_density" && REVIEW_CANDIDATES.has(blocker.ingredientId))
        .map(blocker => blocker.ingredientId),
      allBlockers: detail.blockers.map(blocker => `${blocker.reason}:${blocker.ingredientId}`),
      nutrientFieldGaps: detail.nutrientFieldGaps,
      semanticIssues: detail.semanticIssues,
      sourceSelectionState: detail.sourceSelectionState
    }));

  console.log("B43_RESIDUAL_BLOCKERS=" + JSON.stringify(sorted));
  console.log("B43_CANDIDATE_LEVERAGE=" + JSON.stringify(leverage));
});
