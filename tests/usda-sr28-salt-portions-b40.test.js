import test from "node:test";
import assert from "node:assert/strict";
import {
  USDA_SR28_SALT_PORTION_EVIDENCE_B40,
  USDA_SR28_SALT_PORTION_SOURCE_B40,
  usdaSr28SaltPortionConversionB40
} from "../src/data/usda-sr28-salt-portions-b40.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1 } from "../src/domain/nutrition-source-policy-runtime.js";

test("B40 is a separate bounded USDA SR28 portion-only source", () => {
  assert.equal(USDA_SR28_SALT_PORTION_SOURCE_B40.id, "usda-ars-sr28-salt-portions-b40");
  assert.equal(USDA_SR28_SALT_PORTION_SOURCE_B40.authority, "U.S. Department of Agriculture, Agricultural Research Service");
  assert.equal(USDA_SR28_SALT_PORTION_SOURCE_B40.dataset, "USDA National Nutrient Database for Standard Reference, Release 28");
  assert.equal(USDA_SR28_SALT_PORTION_SOURCE_B40.versionCurrent, "2016-05");
  assert.equal(USDA_SR28_SALT_PORTION_SOURCE_B40.evidenceTranche, "B40");
  assert.equal(USDA_SR28_SALT_PORTION_SOURCE_B40.role, "PORTION_EVIDENCE_ONLY");
  assert.equal(USDA_SR28_SALT_PORTION_SOURCE_B40.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal(USDA_SR28_SALT_PORTION_SOURCE_B40.runtimeFetch, false);
});

test("B40 preserves the direct SR28 Salt, table teaspoon measure", () => {
  const record = USDA_SR28_SALT_PORTION_EVIDENCE_B40.salt;
  assert.equal(record.sourceFoodDescription, "Salt, table");
  assert.equal(record.ndbNumber, "02047");
  assert.deepEqual(record.acceptedUnits, ["tsp"]);
  assert.equal(record.sourceMeasureAmount, 1);
  assert.equal(record.sourceMeasureUnit, "tsp");
  assert.equal(record.sourceMeasureGramWeight, 6);
  assert.equal(record.gramsPerUnit, 6);
  assert.equal(record.matchConfidence, "medium");
});

test("B40 accepts only canonical salt teaspoons and does not broaden units or identities", () => {
  assert.equal(usdaSr28SaltPortionConversionB40("salt", "tsp")?.gramsPerUnit, 6);
  for (const unsupportedUnit of ["tbsp", "cup", "piece", "g", "teaspoon"]) {
    assert.equal(usdaSr28SaltPortionConversionB40("salt", unsupportedUnit), null, unsupportedUnit);
  }
  for (const unsupportedIdentity of ["sea_salt", "iodized_salt", "mineral_salt", "herbal_salt", "smoked_salt"]) {
    assert.equal(usdaSr28SaltPortionConversionB40(unsupportedIdentity, "tsp"), null, unsupportedIdentity);
  }
});

test("runtime resolves salt teaspoon with B40 provenance while composition remains B28", () => {
  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "salt", quantity: 0.5, unit: "tsp" }],
    serving: { servings: 1 }
  }, EUROPEAN_PRIMARY_DENSITIES_V1);
  assert.equal(result.complete, true);
  assert.equal(result.used[0].grams, 3);
  assert.equal(result.used[0].quantityEvidence.sourceId, USDA_SR28_SALT_PORTION_SOURCE_B40.id);
  assert.equal(result.used[0].quantityEvidence.evidenceTranche, "B40");
  assert.equal(result.used[0].quantityEvidence.gramsPerUnit, 6);
  assert.equal(result.used[0].quantityEvidence.ndbNumber, "02047");
  assert.equal(result.used[0].quantityEvidence.matchConfidence, "medium");
  assert.equal(result.used[0].provenanceByNutrient.proteinG.evidenceTranche, "B28");
});

test("B40 clears only the authored salt teaspoon quantity blocker", () => {
  const recipes = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "salt"));
  assert.equal(recipes.length, 1);
  const recipe = recipes[0];
  assert.equal(recipe.id, "spanish_potato_onion_tortilla");
  const salt = recipe.ingredients.find(item => item.canonicalIngredientId === "salt");
  assert.equal(salt.quantity, 0.5);
  assert.equal(salt.unit, "tsp");

  const calculation = publicNutritionSource.estimate(recipe).evidence.europeanStaticCalculation;
  assert.equal(calculation.skipped.some(item => item.ingredientId === "salt"), false);
  const used = calculation.used.find(item => item.ingredientId === "salt");
  assert.equal(used.grams, 3);
  assert.equal(used.quantityEvidence.evidenceTranche, "B40");
});

test("B40 is exposed as portion evidence but never as composition authority", () => {
  const estimate = publicNutritionSource.estimate({
    ingredients: [{ canonicalIngredientId: "salt", quantity: 0.5, unit: "tsp" }],
    serving: { servings: 1 },
    nutrition: { perServing: { energyKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0, fibreG: 0 }, estimationState: "INFERRED_ESTIMATE", confidence: "low" }
  });
  assert.ok(estimate.evidence.portionSources.some(source => source.id === USDA_SR28_SALT_PORTION_SOURCE_B40.id));
  assert.equal(estimate.evidence.sources.some(source => source.id === USDA_SR28_SALT_PORTION_SOURCE_B40.id), false);
  assert.equal(estimate.evidence.compositionSources.some(source => source.id === USDA_SR28_SALT_PORTION_SOURCE_B40.id), false);
});
