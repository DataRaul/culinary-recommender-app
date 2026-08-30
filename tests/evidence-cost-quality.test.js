import test from "node:test";
import assert from "node:assert/strict";
import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { NUTRITION_IDENTITY_EVIDENCE, USDA_FOUNDATION_SOURCE } from "../src/data/nutrition-evidence.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { analyzePortfolioCost } from "../src/domain/cost.js";
import { culinaryQualityCoverage, culinaryQualityProfile } from "../src/domain/culinary-quality.js";

test("USDA identity ledger is source-scoped and never masquerades as imported composition", () => {
  assert.equal(USDA_FOUNDATION_SOURCE.dataType, "Foundation");
  assert.equal(USDA_FOUNDATION_SOURCE.state, "SOURCE_VERIFIED_STATIC_IMPORT_NOT_BUNDLED");
  const identifiers = new Set();
  for (const record of Object.values(NUTRITION_IDENTITY_EVIDENCE)) {
    assert.ok(INGREDIENTS[record.canonicalIngredientId]);
    assert.equal(record.sourceId, USDA_FOUNDATION_SOURCE.id);
    assert.equal(record.sourceIdentifierType, "NDB_NUMBER");
    assert.equal(record.state, "IDENTITY_VERIFIED_COMPOSITION_PENDING");
    assert.ok(record.description.length > 8);
    assert.ok(!identifiers.has(record.sourceIdentifier));
    identifiers.add(record.sourceIdentifier);
  }
});

test("public NutritionSource preserves current estimates while exposing evidence coverage honestly", () => {
  const recipe = ALL_RECIPES.find(item => item.id === "med_tuna_white_bean_salad");
  const estimate = publicNutritionSource.estimate(recipe);
  assert.deepEqual(estimate.perServing, recipe.nutrition.perServing);
  assert.equal(estimate.method, recipe.nutrition.estimationState);
  assert.equal(estimate.evidence.compositionImported, false);
  assert.equal(estimate.evidence.coverage.compositionState, "NOT_IMPORTED");
  assert.ok(estimate.evidence.coverage.mappedIngredientIds.includes("tuna"));
  assert.ok(estimate.evidence.coverage.mappedIngredientIds.includes("white_beans"));
});

test("static nutrient-density calculator handles mass deterministically and fails closed on unsupported units", () => {
  const syntheticRecipe = {
    ingredients: [
      { canonicalIngredientId: "chickpeas", quantity: 200, unit: "g" },
      { canonicalIngredientId: "olive_oil", quantity: 1, unit: "tbsp" }
    ],
    serving: { servings: 2 }
  };
  const densities = {
    chickpeas: { energyKcal: 100, proteinG: 10, carbohydrateG: 20, fatG: 2, fibreG: 8 },
    olive_oil: { energyKcal: 900, proteinG: 0, carbohydrateG: 0, fatG: 100, fibreG: 0 }
  };
  const result = calculatePerServingFromDensities(syntheticRecipe, densities);
  assert.equal(result.perServing.energyKcal, 100);
  assert.equal(result.perServing.proteinG, 10);
  assert.equal(result.perServing.fibreG, 8);
  assert.equal(result.complete, false);
  assert.equal(result.calculationState, "PARTIAL_STATIC_CALCULATION");
  assert.deepEqual(result.skipped, [{ ingredientId: "olive_oil", reason: "unsupported_quantity_unit" }]);
});

const makePlanItem = (id, costTier, ingredientIds) => ({
  recipe: {
    id,
    economics: { costTier },
    serving: { servings: 2 },
    ingredients: ingredientIds.map(ingredientId => ({ canonicalIngredientId: ingredientId, required: true }))
  }
});

test("cost intelligence distinguishes premium proteins and exposes reuse/package effects without fake prices", () => {
  const budget = analyzePortfolioCost([
    makePlanItem("budget-a", 1, ["lentils", "rice", "onion", "carrot"]),
    makePlanItem("budget-b", 1, ["chickpeas", "rice", "onion", "canned_tomato"])
  ]);
  const premium = analyzePortfolioCost([
    makePlanItem("premium-a", 4, ["salmon", "avocado", "miso"]),
    makePlanItem("premium-b", 4, ["prawns", "avocado", "sesame_oil"])
  ]);
  assert.ok(premium.tier > budget.tier);
  assert.ok(budget.reuseScore > 0);
  assert.ok(premium.packageBurden > 0);
  assert.ok(!/\d+[.,]\d{2}\s*€|€\s*\d/.test(premium.note));
  assert.equal(analyzePortfolioCost([makePlanItem("x", 2, ["rice", "onion"])]).heuristicVersion, "spain-canary-v1");
});

test("culinary quality normalization covers the full corpus with bounded deterministic dimensions", () => {
  const coverage = culinaryQualityCoverage(ALL_RECIPES);
  assert.equal(coverage.recipeCount, ALL_RECIPES.length);
  assert.equal(coverage.normalizedCount, ALL_RECIPES.length);
  assert.equal(coverage.completeNormalization, true);
  for (const recipe of ALL_RECIPES) {
    const first = culinaryQualityProfile(recipe);
    const second = culinaryQualityProfile(recipe);
    assert.deepEqual(first, second);
    for (const field of ["techniqueDepth", "failureRiskLevel", "difficulty", "equipmentBurden", "learningValue", "novelty", "familiarity", "spiceLevel"]) {
      assert.ok(first[field] >= 1 && first[field] <= 4, `${recipe.id}: ${field}`);
    }
    for (const field of ["activeShare", "explorationScore", "executionLoad"]) assert.ok(first[field] >= 0 && first[field] <= 1, `${recipe.id}: ${field}`);
    assert.ok(first.convenience.score >= 0.25 && first.convenience.score <= 1);
    assert.ok(first.convenience.storageScore >= 0.25 && first.convenience.storageScore <= 1);
  }
});
