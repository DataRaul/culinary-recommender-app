import test from "node:test";
import assert from "node:assert/strict";
import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import {
  NUTRITION_IDENTITY_EVIDENCE,
  USDA_FOUNDATION_DENSITIES,
  USDA_FOUNDATION_SOURCE
} from "../src/data/nutrition-evidence.js";
import { USDA_FOUNDATION_COMPOSITION_SOURCE, USDA_FOUNDATION_DENSITIES_V1 } from "../src/data/usda-foundation-nutrients-v1.js";
import { USDA_FOUNDATION_DENSITIES_B3 } from "../src/data/usda-foundation-nutrients-b3.js";
import {
  USDA_FOUNDATION_PORTION_EVIDENCE_V1,
  USDA_FOUNDATION_PORTION_SOURCE
} from "../src/data/usda-foundation-portions-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { analyzePortfolioCost } from "../src/domain/cost.js";
import { culinaryQualityCoverage, culinaryQualityProfile } from "../src/domain/culinary-quality.js";

test("USDA Foundation ledger binds canonical identities to the bounded April 2026 static extract", () => {
  assert.equal(USDA_FOUNDATION_SOURCE.dataType, "Foundation");
  assert.equal(USDA_FOUNDATION_SOURCE.state, "BOUNDED_STATIC_COMPOSITION_BUNDLED");
  assert.equal(USDA_FOUNDATION_COMPOSITION_SOURCE.releaseVersion, "15.0");
  assert.equal(USDA_FOUNDATION_COMPOSITION_SOURCE.releaseDate, "2026-04-30");
  assert.equal(Object.keys(USDA_FOUNDATION_DENSITIES_V1).length, 14);
  assert.equal(USDA_FOUNDATION_DENSITIES_V1.chicken_breast.fdcId, "2646170");
  assert.equal(USDA_FOUNDATION_DENSITIES_V1.black_beans.fdcId, "2644285");
  assert.equal(USDA_FOUNDATION_DENSITIES_V1.avocado.fdcId, "2710824");
  assert.equal(USDA_FOUNDATION_DENSITIES_V1.cashews.fdcId, "2515374");
  assert.equal(USDA_FOUNDATION_DENSITIES_V1.banana.nutrientIds.energyKcal, "2048");
  assert.equal(USDA_FOUNDATION_DENSITIES_V1.chicken_breast.per100g.fibreG, null);
  assert.ok(USDA_FOUNDATION_DENSITIES_V1.banana.per100g.fibreG > 0);

  const identifiers = new Set();
  for (const record of Object.values(NUTRITION_IDENTITY_EVIDENCE)) {
    assert.ok(INGREDIENTS[record.canonicalIngredientId]);
    assert.equal(record.sourceId, USDA_FOUNDATION_SOURCE.id);
    assert.equal(record.sourceIdentifierType, "NDB_NUMBER");
    assert.ok(record.fdcId);
    assert.ok(record.state.startsWith("STATIC_COMPOSITION_IMPORTED_"));
    assert.ok(record.description.length > 8);
    assert.ok(!identifiers.has(record.sourceIdentifier));
    identifiers.add(record.sourceIdentifier);
  }
});

test("B3 expands reviewed Foundation composition without pretending incomplete fields are known", () => {
  assert.equal(Object.keys(USDA_FOUNDATION_DENSITIES_B3).length, 15);
  assert.equal(Object.keys(USDA_FOUNDATION_DENSITIES).length, 29);
  assert.equal(USDA_FOUNDATION_DENSITIES_B3.broccoli.fdcId, "747447");
  assert.equal(USDA_FOUNDATION_DENSITIES_B3.eggs.fdcId, "748967");
  assert.equal(USDA_FOUNDATION_DENSITIES_B3.pineapple.fdcId, "2346398");
  assert.equal(USDA_FOUNDATION_DENSITIES_B3.canned_tomato.fdcId, "2685581");
  assert.equal(USDA_FOUNDATION_DENSITIES_B3.cucumber.per100g.fibreG, null);
  assert.equal(USDA_FOUNDATION_DENSITIES_B3.spring_onion.per100g.energyKcal, null);
  assert.equal(NUTRITION_IDENTITY_EVIDENCE.cucumber.compositionState, "STATIC_COMPOSITION_IMPORTED_PARTIAL");
  assert.equal(NUTRITION_IDENTITY_EVIDENCE.spring_onion.compositionState, "STATIC_COMPOSITION_IMPORTED_PARTIAL");
  assert.equal(NUTRITION_IDENTITY_EVIDENCE.broccoli.compositionState, "STATIC_COMPOSITION_IMPORTED_COMPLETE_FOR_TRACKED_FIELDS");
});

test("B3 household weights stay evidence-only when canonical recipe semantics are not specific enough", () => {
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.broccoli[0].gramWeight, 76);
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.broccoli[0].modifier, "chopped");
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.eggs[0].gramWeight, 50.3);
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.eggs[0].dataPoints, 526);
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.onion[0].gramWeight, 143);
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.red_onion[0].gramWeight, 197);

  const genericEggRecipe = {
    ingredients: [{ canonicalIngredientId: "eggs", quantity: 2, unit: "pieces" }],
    serving: { servings: 1 }
  };
  const result = calculatePerServingFromDensities(genericEggRecipe, USDA_FOUNDATION_DENSITIES);
  assert.equal(result.complete, false);
  assert.equal(result.skipped[0].reason, "unsupported_quantity_unit");
});

test("B3 complete mass records can participate in deterministic static calculations", () => {
  const syntheticRecipe = {
    ingredients: [
      { canonicalIngredientId: "broccoli", quantity: 200, unit: "g" },
      { canonicalIngredientId: "rice", quantity: 100, unit: "g" },
      { canonicalIngredientId: "canned_tomato", quantity: 100, unit: "g" }
    ],
    serving: { servings: 2 }
  };
  const result = calculatePerServingFromDensities(syntheticRecipe, USDA_FOUNDATION_DENSITIES);
  assert.equal(result.complete, true);
  assert.deepEqual(result.perServing, {
    energyKcal: 233,
    proteinG: 7.7,
    carbohydrateG: 50,
    fatG: 1.1,
    fibreG: 3.4
  });
});

test("public NutritionSource preserves project estimate when USDA recipe coverage is partial", () => {
  const recipe = ALL_RECIPES.find(item => item.id === "med_tuna_white_bean_salad");
  const estimate = publicNutritionSource.estimate(recipe);
  assert.deepEqual(estimate.perServing, recipe.nutrition.perServing);
  assert.equal(estimate.method, recipe.nutrition.estimationState);
  assert.equal(estimate.evidence.compositionImported, true);
  assert.equal(estimate.evidence.portionEvidenceImported, true);
  assert.equal(estimate.evidence.coverage.compositionState, "BOUNDED_STATIC_COMPOSITION_AVAILABLE");
  assert.ok(estimate.evidence.coverage.mappedIngredientIds.includes("tuna"));
  assert.ok(estimate.evidence.coverage.mappedIngredientIds.includes("white_beans"));
  assert.equal(estimate.evidence.staticCalculation.complete, false);
  assert.equal(estimate.evidence.state, "PARTIAL_STATIC_EVIDENCE_ESTIMATE_PRESERVED");
});

test("static nutrient calculator never treats an unsupported unit as a complete recipe", () => {
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
  assert.equal(result.perServing.energyKcal, null);
  assert.equal(result.perServing.proteinG, null);
  assert.equal(result.knownContributionPerServing.energyKcal, 100);
  assert.equal(result.knownContributionPerServing.proteinG, 10);
  assert.equal(result.knownContributionPerServing.fibreG, 8);
  assert.equal(result.complete, false);
  assert.equal(result.calculationState, "PARTIAL_STATIC_CALCULATION");
  assert.deepEqual(result.skipped, [{ ingredientId: "olive_oil", reason: "unsupported_quantity_unit" }]);
});

test("USDA Foundation portion evidence supports canonical banana pieces without generic guessing", () => {
  assert.equal(USDA_FOUNDATION_PORTION_SOURCE.releaseVersion, "15.0");
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.banana[0].gramWeight, 115);
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.banana[0].modifier, "Peeled");
  assert.equal(USDA_FOUNDATION_PORTION_EVIDENCE_V1.banana[0].dataPoints, 102);

  const bananaRecipe = {
    ingredients: [{ canonicalIngredientId: "banana", quantity: 2, unit: "pieces" }],
    serving: { servings: 2 }
  };
  const result = calculatePerServingFromDensities(bananaRecipe, USDA_FOUNDATION_DENSITIES_V1);
  assert.equal(result.complete, true);
  assert.deepEqual(result.perServing, {
    energyKcal: 101,
    proteinG: 0.9,
    carbohydrateG: 26.5,
    fatG: 0.3,
    fibreG: 2
  });
  assert.equal(result.used[0].grams, 230);
  assert.equal(result.used[0].quantityEvidence.state, "USDA_FOUNDATION_PORTION_MATCH");
  assert.equal(result.used[0].quantityEvidence.gramsPerUnit, 115);
});

test("ambiguous USDA tuna can weights fail closed instead of choosing a convenient number", () => {
  assert.deepEqual(USDA_FOUNDATION_PORTION_EVIDENCE_V1.tuna.map(item => item.gramWeight), [107, 142]);
  const tunaRecipe = {
    ingredients: [{ canonicalIngredientId: "tuna", quantity: 1, unit: "can" }],
    serving: { servings: 1 }
  };
  const result = calculatePerServingFromDensities(tunaRecipe, USDA_FOUNDATION_DENSITIES_V1);
  assert.equal(result.complete, false);
  assert.equal(result.calculationState, "INSUFFICIENT_STATIC_DATA");
  assert.equal(result.skipped[0].reason, "ambiguous_portion_unit");
  assert.deepEqual(result.skipped[0].quantityEvidence.candidateGramWeights, [107, 142]);
});

test("missing USDA nutrient fields remain null while other tracked fields can be complete", () => {
  const chicken = {
    ingredients: [{ canonicalIngredientId: "chicken_breast", quantity: 100, unit: "g" }],
    serving: { servings: 1 }
  };
  const result = calculatePerServingFromDensities(chicken, USDA_FOUNDATION_DENSITIES_V1);
  assert.equal(result.perServing.energyKcal, 112);
  assert.equal(result.perServing.proteinG, 22.5);
  assert.equal(result.perServing.carbohydrateG, 0);
  assert.equal(result.perServing.fatG, 1.9);
  assert.equal(result.perServing.fibreG, null);
  assert.equal(result.nutrientCoverage.fibreG.complete, false);
  assert.equal(result.complete, false);
});

test("complete mass-only USDA coverage produces a deterministic authoritative calculation", () => {
  const syntheticRecipe = {
    ingredients: [
      { canonicalIngredientId: "banana", quantity: 100, unit: "g" },
      { canonicalIngredientId: "cashews", quantity: 100, unit: "g" }
    ],
    serving: { servings: 2 },
    nutrition: { perServing: { energyKcal: 999 }, estimationState: "INFERRED_ESTIMATE", confidence: "low" }
  };
  const result = calculatePerServingFromDensities(syntheticRecipe, USDA_FOUNDATION_DENSITIES_V1);
  assert.equal(result.complete, true);
  assert.deepEqual(result.perServing, { energyKcal: 311, proteinG: 9.1, carbohydrateG: 29.6, fatG: 19.6, fibreG: 2.9 });
  const estimate = publicNutritionSource.estimate(syntheticRecipe);
  assert.equal(estimate.method, "USDA_FDC_FOUNDATION_STATIC_CALCULATION");
  assert.equal(estimate.confidence, "medium");
  assert.deepEqual(estimate.perServing, result.perServing);
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
