import test from "node:test";
import assert from "node:assert/strict";
import { publicNutritionSource, calculatePerServingFromDensities } from "../src/domain/nutrition.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  EUROPEAN_PRIMARY_POLICY_V1,
  selectEuropeanPrimaryNutrient,
  europeanPrimaryPolicyCoverage
} from "../src/domain/nutrition-source-policy.js";

test("European-primary policy is explicit, bounded and non-averaging", () => {
  assert.equal(EUROPEAN_PRIMARY_POLICY_V1.context, "CANARY_ISLANDS_SPAIN_EUROPE");
  assert.equal(EUROPEAN_PRIMARY_POLICY_V1.averaging, "PROHIBITED");
  assert.match(EUROPEAN_PRIMARY_POLICY_V1.carbohydrateRule, /MUST_NOT_BE_SUMMED/);
});

test("European source wins only where food-form and constituent evidence justify it", () => {
  const onionEnergy = selectEuropeanPrimaryNutrient("onion", "energyKcal");
  const onionProtein = selectEuropeanPrimaryNutrient("onion", "proteinG");
  const onionCarbohydrate = selectEuropeanPrimaryNutrient("onion", "carbohydrateG");
  assert.equal(onionEnergy.source, "usda");
  assert.equal(onionEnergy.selectionReason, "CIQUAL_D_CONFIDENCE_DOES_NOT_DISPLACE_USDA");
  assert.equal(onionProtein.source, "ciqual");
  assert.equal(onionProtein.selectionReason, "EUROPEAN_FORM_MATCH_STRONGER");
  assert.equal(onionCarbohydrate.source, "ciqual");
  assert.equal(onionCarbohydrate.semantic, "AVAILABLE_CARBOHYDRATE_CIQUAL_CHOAVL");
});

test("stronger USDA form remains primary instead of losing to geography", () => {
  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fatG"]) {
    const selection = selectEuropeanPrimaryNutrient("tuna", nutrient);
    assert.equal(selection.source, "usda", nutrient);
    assert.equal(selection.selectionReason, "USDA_FORM_MATCH_STRONGER", nutrient);
  }
  const fibre = selectEuropeanPrimaryNutrient("tuna", "fibreG");
  assert.equal(fibre.source, "ciqual");
  assert.equal(fibre.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE");
});

test("Ciqual-only reviewed foods become usable European primary evidence without fabricating USDA", () => {
  const salmon = EUROPEAN_PRIMARY_DENSITIES_V1.salmon;
  assert.equal(salmon.provenanceByNutrient.proteinG.source, "ciqual");
  assert.equal(salmon.provenanceByNutrient.fatG.source, "ciqual");
  assert.equal(salmon.per100g.carbohydrateG, null);
  assert.equal(salmon.per100g.fibreG, null);

  const milkRecipe = {
    ingredients: [{ canonicalIngredientId: "milk", quantity: 100, unit: "g" }],
    serving: { servings: 1 },
    nutrition: { perServing: { energyKcal: 999 }, estimationState: "INFERRED_ESTIMATE", confidence: "low" }
  };
  const estimate = publicNutritionSource.estimate(milkRecipe);
  assert.equal(estimate.method, "EUROPEAN_PRIMARY_STATIC_CALCULATION_V1");
  assert.deepEqual(estimate.perServing, { energyKcal: 48, proteinG: 3.5, carbohydrateG: 5, fatG: 1.6, fibreG: 0 });
  assert.equal(estimate.evidence.sourcePolicy.id, "european-primary-v1");
  assert.ok(estimate.evidence.staticCalculation.used[0].provenanceByNutrient.proteinG.source === "ciqual");
});

test("incompatible USDA and Ciqual carbohydrate semantics fail closed at recipe level", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "broccoli", quantity: 100, unit: "g" },
      { canonicalIngredientId: "cashews", quantity: 100, unit: "g" }
    ],
    serving: { servings: 2 }
  };
  const result = calculatePerServingFromDensities(recipe, EUROPEAN_PRIMARY_DENSITIES_V1);
  assert.equal(result.nutrientCoverage.carbohydrateG.coveredIngredients, 2);
  assert.equal(result.nutrientCoverage.carbohydrateG.complete, false);
  assert.equal(result.nutrientCoverage.carbohydrateG.semanticCompatibility, false);
  assert.equal(result.nutrientCoverage.carbohydrateG.semanticIssue, "mixed_incompatible_carbohydrate_semantics");
  assert.equal(result.perServing.carbohydrateG, null);
  assert.equal(result.complete, false);
});

test("USDA remains authoritative when it is the only reviewed source", () => {
  const cashew = EUROPEAN_PRIMARY_DENSITIES_V1.cashews;
  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"]) {
    assert.equal(cashew.provenanceByNutrient[nutrient].source, "usda", nutrient);
  }
  const recipe = {
    ingredients: [{ canonicalIngredientId: "cashews", quantity: 100, unit: "g" }],
    serving: { servings: 1 },
    nutrition: { perServing: { energyKcal: 999 }, estimationState: "INFERRED_ESTIMATE", confidence: "low" }
  };
  const estimate = publicNutritionSource.estimate(recipe);
  assert.equal(estimate.method, "EUROPEAN_PRIMARY_STATIC_CALCULATION_V1");
  assert.deepEqual(estimate.perServing, { energyKcal: 533, proteinG: 17.4, carbohydrateG: 36.3, fatG: 38.9, fibreG: 4.1 });
});

test("policy coverage preserves per-nutrient source decisions deterministically", () => {
  const first = europeanPrimaryPolicyCoverage(["onion", "tuna", "salmon", "cashews", "onion"]);
  const second = europeanPrimaryPolicyCoverage(["onion", "tuna", "salmon", "cashews", "onion"]);
  assert.deepEqual(first, second);
  assert.equal(first.ingredientCount, 4);
  assert.ok(first.ciqualSelectedCount > 0);
  assert.ok(first.usdaSelectedCount > 0);
});
