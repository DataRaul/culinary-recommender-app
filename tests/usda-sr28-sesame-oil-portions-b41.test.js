import test from "node:test";
import assert from "node:assert/strict";
import {
  USDA_SR28_SESAME_OIL_PORTION_EVIDENCE_B41,
  USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41,
  usdaSr28SesameOilPortionConversionB41
} from "../src/data/usda-sr28-sesame-oil-portions-b41.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1 } from "../src/domain/nutrition-source-policy-runtime.js";

test("B41 is a separate bounded USDA SR28 portion-only source", () => {
  assert.equal(USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.id, "usda-ars-sr28-sesame-oil-portions-b41");
  assert.equal(USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.authority, "U.S. Department of Agriculture, Agricultural Research Service");
  assert.equal(USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.dataset, "USDA National Nutrient Database for Standard Reference, Release 28");
  assert.equal(USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.versionCurrent, "2016-05");
  assert.equal(USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.evidenceTranche, "B41");
  assert.equal(USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.role, "PORTION_EVIDENCE_ONLY");
  assert.equal(USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal(USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.runtimeFetch, false);
});

test("B41 preserves the direct SR28 sesame-oil teaspoon measure", () => {
  const record = USDA_SR28_SESAME_OIL_PORTION_EVIDENCE_B41.sesame_oil;
  assert.equal(record.sourceFoodDescription, "Oil, sesame, salad or cooking");
  assert.equal(record.ndbNumber, "04058");
  assert.deepEqual(record.acceptedUnits, ["tsp"]);
  assert.equal(record.sourceMeasureAmount, 1);
  assert.equal(record.sourceMeasureUnit, "tsp");
  assert.equal(record.sourceMeasureGramWeight, 4.5);
  assert.equal(record.gramsPerUnit, 4.5);
  assert.equal(record.matchConfidence, "medium");
});

test("B41 accepts only canonical sesame-oil teaspoons and does not broaden units or identities", () => {
  assert.equal(usdaSr28SesameOilPortionConversionB41("sesame_oil", "tsp")?.gramsPerUnit, 4.5);
  for (const unsupportedUnit of ["tbsp", "cup", "piece", "g", "teaspoon"]) {
    assert.equal(usdaSr28SesameOilPortionConversionB41("sesame_oil", unsupportedUnit), null, unsupportedUnit);
  }
  for (const unsupportedIdentity of ["olive_oil", "neutral_oil", "sesame_seeds", "tahini", "toasted_sesame_oil"]) {
    assert.equal(usdaSr28SesameOilPortionConversionB41(unsupportedIdentity, "tsp"), null, unsupportedIdentity);
  }
});

test("runtime resolves sesame-oil teaspoon with B41 provenance while composition stays independently selected", () => {
  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "sesame_oil", quantity: 1, unit: "tsp" }],
    serving: { servings: 1 }
  }, EUROPEAN_PRIMARY_DENSITIES_V1);
  assert.equal(result.complete, true);
  assert.equal(result.used[0].grams, 4.5);
  assert.equal(result.used[0].quantityEvidence.sourceId, USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.id);
  assert.equal(result.used[0].quantityEvidence.evidenceTranche, "B41");
  assert.equal(result.used[0].quantityEvidence.gramsPerUnit, 4.5);
  assert.equal(result.used[0].quantityEvidence.ndbNumber, "04058");
  assert.equal(result.used[0].quantityEvidence.matchConfidence, "medium");
  assert.notEqual(result.used[0].provenanceByNutrient.proteinG.sourceId, USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.id);
});

test("B41 clears exactly the five authored sesame-oil teaspoon blockers", () => {
  const recipes = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "sesame_oil"));
  assert.equal(recipes.length, 5);
  assert.deepEqual(recipes.map(recipe => recipe.id), [
    "east_asian_tofu_edamame_rice",
    "east_asian_salmon_cabbage_rice",
    "east_asian_miso_salmon_rice",
    "east_asian_egg_pea_fried_rice",
    "east_asian_chicken_broccoli_noodles"
  ]);
  for (const recipe of recipes) {
    const sesameOil = recipe.ingredients.find(item => item.canonicalIngredientId === "sesame_oil");
    assert.equal(sesameOil.quantity, 1, recipe.id);
    assert.equal(sesameOil.unit, "tsp", recipe.id);
    const calculation = publicNutritionSource.estimate(recipe).evidence.europeanStaticCalculation;
    assert.equal(calculation.skipped.some(item => item.ingredientId === "sesame_oil"), false, recipe.id);
    const used = calculation.used.find(item => item.ingredientId === "sesame_oil");
    assert.equal(used.grams, 4.5, recipe.id);
    assert.equal(used.quantityEvidence.evidenceTranche, "B41", recipe.id);
  }
});

test("B41 unlocks egg-pea fried rice through a complete European-primary calculation without changing carbohydrate semantics", () => {
  const recipe = AUTHORED_RECIPES.find(item => item.id === "east_asian_egg_pea_fried_rice");
  const estimate = publicNutritionSource.estimate(recipe);
  assert.equal(estimate.evidence.europeanStaticCalculation.complete, true);
  assert.equal(estimate.evidence.sourceSelectionState, "EUROPEAN_PRIMARY_COMPLETE");
  assert.equal(estimate.method, "EUROPEAN_PRIMARY_STATIC_CALCULATION_V1");
  assert.equal(estimate.evidence.state, "AUTHORITATIVE_STATIC_RECIPE_CALCULATION_AVAILABLE");
  assert.equal(estimate.evidence.europeanStaticCalculation.nutrientCoverage.carbohydrateG.semanticCompatibility, true);
});

test("B41 does not silently authorize tablespoon or cup despite SR28 publishing those measures", () => {
  for (const unit of ["tbsp", "cup"]) {
    const result = calculatePerServingFromDensities({
      ingredients: [{ canonicalIngredientId: "sesame_oil", quantity: 1, unit }],
      serving: { servings: 1 }
    }, EUROPEAN_PRIMARY_DENSITIES_V1);
    assert.equal(result.complete, false, unit);
    assert.equal(result.skipped[0].reason, "unsupported_quantity_unit", unit);
  }
});
