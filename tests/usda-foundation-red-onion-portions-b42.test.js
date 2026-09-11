import test from "node:test";
import assert from "node:assert/strict";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import {
  USDA_FOUNDATION_PORTION_CONVERSIONS_V1,
  USDA_FOUNDATION_PORTION_SOURCE,
  usdaFoundationPortionConversion
} from "../src/data/usda-foundation-portions-v1.js";
import {
  USDA_FOUNDATION_RED_ONION_PORTION_EVIDENCE_B42,
  USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42,
  usdaFoundationRedOnionPortionConversionB42
} from "../src/data/usda-foundation-red-onion-portions-b42.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";

test("B42 is a bounded policy review of the already-pinned USDA Foundation portion source", () => {
  assert.equal(USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.authority, "U.S. Department of Agriculture, Agricultural Research Service");
  assert.equal(USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.dataset, "USDA FoodData Central — Foundation Foods");
  assert.equal(USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.releaseVersion, "15.0");
  assert.equal(USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.releaseDate, "2026-04-30");
  assert.equal(USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.evidenceTranche, "B42");
  assert.equal(USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.runtimeFetch, false);
  assert.equal(USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal(USDA_FOUNDATION_RED_ONION_PORTION_SOURCE_B42.underlyingPortionSourceId, USDA_FOUNDATION_PORTION_SOURCE.id);
});

test("B42 preserves the exact Foundation raw-red-onion edible Onion row", () => {
  const record = USDA_FOUNDATION_RED_ONION_PORTION_EVIDENCE_B42.red_onion;
  assert.equal(record.fdcId, "790577");
  assert.equal(record.ndbNumber, "100252");
  assert.equal(record.sourceFoodDescription, "Onions, red, raw");
  assert.deepEqual(record.acceptedUnits, ["piece", "pieces"]);
  assert.equal(record.sourceMeasureAmount, 1);
  assert.equal(record.sourceMeasureUnit, "Onion");
  assert.equal(record.sourceModifier, "Edible");
  assert.equal(record.sourceMeasureGramWeight, 197);
  assert.equal(record.gramsPerUnit, 197);
  assert.equal(record.dataPoints, 30);
  assert.equal(record.matchConfidence, "medium");
  assert.equal(record.sourceId, USDA_FOUNDATION_PORTION_SOURCE.id);
});

test("B42 promotes red-onion piece conversion without rewriting the frozen B3 conversion table", () => {
  assert.equal(USDA_FOUNDATION_PORTION_CONVERSIONS_V1.red_onion, undefined);
  assert.equal(usdaFoundationRedOnionPortionConversionB42("red_onion", "piece")?.gramsPerUnit, 197);
  assert.equal(usdaFoundationPortionConversion("red_onion", "piece")?.gramsPerUnit, 197);
  assert.equal(usdaFoundationPortionConversion("red_onion", "pieces")?.gramsPerUnit, 197);
});

test("B42 does not bleed red-onion evidence into neighboring identities or unsupported units", () => {
  for (const identity of ["onion", "spring_onion", "garlic", "shallot"]) {
    assert.equal(usdaFoundationRedOnionPortionConversionB42(identity, "piece"), null, identity);
  }
  for (const unit of ["small", "large", "cup", "tbsp", "g"]) {
    assert.equal(usdaFoundationRedOnionPortionConversionB42("red_onion", unit), null, unit);
  }
  assert.equal(usdaFoundationPortionConversion("onion", "piece"), null);
});

test("runtime resolves exact red-onion authored fractions with Foundation source provenance", () => {
  const syntheticDensity = {
    red_onion: { energyKcal: 40, proteinG: 1, carbohydrateG: 9, fatG: 0.1, fibreG: 1.5 }
  };
  for (const [quantity, expectedGrams] of [[0.25, 49.25], [0.5, 98.5]]) {
    const result = calculatePerServingFromDensities({
      ingredients: [{ canonicalIngredientId: "red_onion", quantity, unit: "piece" }],
      serving: { servings: 1 }
    }, syntheticDensity);
    assert.equal(result.complete, true, String(quantity));
    assert.equal(result.used[0].grams, expectedGrams, String(quantity));
    assert.equal(result.used[0].quantityEvidence.state, "USDA_FOUNDATION_RED_ONION_PIECE_DIRECT_B42", String(quantity));
    assert.equal(result.used[0].quantityEvidence.sourceId, USDA_FOUNDATION_PORTION_SOURCE.id, String(quantity));
    assert.equal(result.used[0].quantityEvidence.fdcId, "790577", String(quantity));
    assert.equal(result.used[0].quantityEvidence.sourceUnit, "Onion", String(quantity));
    assert.equal(result.used[0].quantityEvidence.modifier, "Edible", String(quantity));
  }
});

test("B42 clears exactly the two authored red-onion piece quantity blockers", () => {
  const recipes = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "red_onion"));
  assert.deepEqual(recipes.map(recipe => recipe.id), [
    "canarian_sardine_potato_bowl",
    "med_tuna_white_bean_salad"
  ]);
  assert.deepEqual(recipes.map(recipe => recipe.ingredients.find(item => item.canonicalIngredientId === "red_onion")?.quantity), [0.5, 0.25]);
  for (const recipe of recipes) {
    const calculation = publicNutritionSource.estimate(recipe).evidence.europeanStaticCalculation;
    assert.equal(calculation.skipped.some(item => item.ingredientId === "red_onion"), false, recipe.id);
    const used = calculation.used.find(item => item.ingredientId === "red_onion");
    assert.ok(used, recipe.id);
    assert.equal(used.quantityEvidence.state, "USDA_FOUNDATION_RED_ONION_PIECE_DIRECT_B42", recipe.id);
  }
});
