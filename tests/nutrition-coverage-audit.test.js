import test from "node:test";
import assert from "node:assert/strict";
import { ALL_RECIPES, AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

test("nutrition coverage audit is deterministic and partitions the full recipe universe", () => {
  const first = buildNutritionCoverageAudit(ALL_RECIPES, publicNutritionSource);
  const second = buildNutritionCoverageAudit(ALL_RECIPES, publicNutritionSource);
  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, "nutrition-coverage-audit-v1");
  assert.equal(first.recipeCount, ALL_RECIPES.length);
  assert.equal(first.authoritativeRecipeCount + first.estimateRecipeCount, ALL_RECIPES.length);
  assert.equal(first.authoritativeRecipeIds.length, first.authoritativeRecipeCount);
  assert.equal(first.estimateRecipeIds.length, first.estimateRecipeCount);
  assert.equal(first.recipeDetails.length, ALL_RECIPES.length);
});

test("audit preserves every fail-closed shortfall class rather than treating partial evidence as complete", () => {
  const audit = buildNutritionCoverageAudit(ALL_RECIPES, publicNutritionSource);
  for (const detail of audit.recipeDetails) {
    if (!detail.authoritative) {
      const hasBlocker = detail.blockers.length > 0;
      const hasFieldGap = detail.nutrientFieldGaps.length > 0;
      const hasSemanticIssue = detail.semanticIssues.length > 0;
      const noCompleteCalculation = detail.sourceSelectionState === "NO_COMPLETE_AUTHORITATIVE_RECIPE_CALCULATION";
      assert.ok(hasBlocker || hasFieldGap || hasSemanticIssue || noCompleteCalculation, `${detail.recipeId}: estimate-preserved recipe lacks an inspectable shortfall state`);
    }
  }
  assert.ok(Object.keys(audit.blockerCounts).length > 0, "expected current corpus to expose quantity/density blockers");
  assert.ok(Object.keys(audit.missingNutrientFieldCounts).length > 0, "expected current corpus to expose tracked nutrient field gaps");
});

test("B8 exact small-onion evidence earns the first authored authoritative recipe without weakening other blockers", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.recipeCount, 76);
  assert.equal(audit.authoritativeRecipeCount, 1);
  assert.equal(audit.estimateRecipeCount, 75);
  assert.deepEqual(audit.authoritativeRecipeIds, ["indian_chicken_spinach_curry"]);
  assert.deepEqual(audit.blockerCounts, {
    ambiguous_portion_unit: 20,
    missing_density: 133,
    unsupported_quantity_unit: 7
  });
  assert.deepEqual(audit.semanticIssueCounts, {
    mixed_incompatible_carbohydrate_semantics: 16
  });
});

test("audit is fail-closed when NutritionSource is missing", () => {
  assert.throws(() => buildNutritionCoverageAudit(ALL_RECIPES, null), /nutritionSource\.estimate is required/);
});
