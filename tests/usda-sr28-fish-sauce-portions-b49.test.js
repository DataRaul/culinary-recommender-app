import test from "node:test";
import assert from "node:assert/strict";
import {
  USDA_SR28_FISH_SAUCE_PORTIONS_B49,
  USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49,
  usdaSr28FishSaucePortionConversionB49
} from "../src/data/usda-sr28-fish-sauce-portions-b49.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1 } from "../src/domain/nutrition-source-policy-runtime.js";
import { MEXT_COMPOSITION_SOURCE_B48 } from "../src/data/mext-composition-b48.js";

test("B49 is a separate bounded USDA SR28 portion-only source", () => {
  assert.equal(USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.id, "usda-sr28-fish-sauce-portions-b49");
  assert.equal(USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.authority, "U.S. Department of Agriculture, Agricultural Research Service");
  assert.equal(USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.dataset, "USDA National Nutrient Database for Standard Reference, Release 28");
  assert.equal(USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.releaseDate, "2015-09");
  assert.equal(USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.evidenceTranche, "B49");
  assert.equal(USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.compositionImported, false);
  assert.equal(USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.runtimeFetch, false);
});

test("B49 preserves the direct SR28 ready-to-serve fish-sauce tablespoon measure", () => {
  assert.deepEqual(Object.keys(USDA_SR28_FISH_SAUCE_PORTIONS_B49), ["fish_sauce"]);
  const record = USDA_SR28_FISH_SAUCE_PORTIONS_B49.fish_sauce;
  assert.equal(record.sourceFoodDescription, "Sauce, fish, ready-to-serve");
  assert.equal(record.ndbNumber, "06179");
  assert.deepEqual(record.acceptedUnits, ["tbsp"]);
  assert.equal(record.sourceMeasureAmount, 1);
  assert.equal(record.sourceMeasureUnit, "tbsp");
  assert.equal(record.sourceMeasureGramWeight, 18);
  assert.equal(record.gramsPerUnit, 18);
  assert.equal(record.matchConfidence, "high");
});

test("B49 accepts only canonical fish-sauce tablespoons and does not broaden units or identities", () => {
  assert.equal(usdaSr28FishSaucePortionConversionB49("fish_sauce", "tbsp")?.gramsPerUnit, 18);
  for (const unsupportedUnit of ["tsp", "cup", "piece", "g", "tablespoon"]) {
    assert.equal(usdaSr28FishSaucePortionConversionB49("fish_sauce", unsupportedUnit), null, unsupportedUnit);
  }
  for (const unsupportedIdentity of ["soy_sauce", "oyster_sauce", "fish_stock", "sardines", "sesame_oil"]) {
    assert.equal(usdaSr28FishSaucePortionConversionB49(unsupportedIdentity, "tbsp"), null, unsupportedIdentity);
  }
});

test("runtime resolves fish-sauce tablespoon with B49 provenance while composition remains B48 MEXT", () => {
  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "fish_sauce", quantity: 1, unit: "tbsp" }],
    serving: { servings: 1 }
  }, EUROPEAN_PRIMARY_DENSITIES_V1);
  assert.equal(result.complete, true);
  assert.equal(result.used[0].grams, 18);
  assert.equal(result.used[0].quantityEvidence.sourceId, USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.id);
  assert.equal(result.used[0].quantityEvidence.evidenceTranche, "B49");
  assert.equal(result.used[0].quantityEvidence.ndbNumber, "06179");
  assert.equal(result.used[0].quantityEvidence.matchConfidence, "high");
  assert.equal(result.used[0].provenanceByNutrient.proteinG.sourceId, MEXT_COMPOSITION_SOURCE_B48.id);
  assert.notEqual(result.used[0].provenanceByNutrient.proteinG.sourceId, USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.id);
});

test("B48+B49 clear the sole authored fish-sauce blocker without broadening the recipe", () => {
  const recipes = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "fish_sauce"));
  assert.equal(recipes.length, 1);
  assert.equal(recipes[0].id, "se_asian_lime_chicken_rice_noodles");
  const ingredient = recipes[0].ingredients.find(item => item.canonicalIngredientId === "fish_sauce");
  assert.equal(ingredient.quantity, 1);
  assert.equal(ingredient.unit, "tbsp");
  const calculation = publicNutritionSource.estimate(recipes[0]).evidence.europeanStaticCalculation;
  assert.equal(calculation.skipped.some(item => item.ingredientId === "fish_sauce"), false);
  const used = calculation.used.find(item => item.ingredientId === "fish_sauce");
  assert.equal(used.grams, 18);
  assert.equal(used.quantityEvidence.evidenceTranche, "B49");
  assert.equal(used.provenanceByNutrient.carbohydrateG.evidenceTranche, "B48");
  assert.equal(calculation.skipped.some(item => item.ingredientId === "lime" && item.reason === "ambiguous_portion_unit"), true);
  assert.equal(calculation.complete, false);
});
