import test from "node:test";
import assert from "node:assert/strict";
import {
  USDA_SR28_PEANUT_BUTTER_PORTION_EVIDENCE_B37,
  USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37,
  USDA_SR28_PEANUT_BUTTER_VARIANTS_B37,
  usdaSr28PeanutButterPortionConversionB37
} from "../src/data/usda-sr28-peanut-butter-portions-b37.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1 } from "../src/domain/nutrition-source-policy-runtime.js";

test("B37 is a separate bounded USDA SR28 portion-only source", () => {
  assert.equal(USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.id, "usda-ars-sr28-peanut-butter-portions-b37");
  assert.equal(USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.authority, "U.S. Department of Agriculture, Agricultural Research Service");
  assert.equal(USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.dataset, "USDA National Nutrient Database for Standard Reference, Release 28");
  assert.equal(USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.evidenceTranche, "B37");
  assert.equal(USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.role, "PORTION_EVIDENCE_ONLY");
  assert.equal(USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal(USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.runtimeFetch, false);
});

test("B37 preserves the four reviewed SR28 texture/salt variants and their identical household measure", () => {
  assert.deepEqual(USDA_SR28_PEANUT_BUTTER_VARIANTS_B37.map(item => item.ndbNumber), ["16097", "16397", "16098", "16398"]);
  assert.deepEqual(USDA_SR28_PEANUT_BUTTER_VARIANTS_B37.map(item => item.description), [
    "Peanut butter, chunk style, with salt",
    "Peanut butter, chunk style, without salt",
    "Peanut butter, smooth style, with salt",
    "Peanut butter, smooth style, without salt"
  ]);
  for (const variant of USDA_SR28_PEANUT_BUTTER_VARIANTS_B37) {
    assert.equal(variant.measureAmount, 2, variant.ndbNumber);
    assert.equal(variant.measureUnit, "tbsp", variant.ndbNumber);
    assert.equal(variant.gramWeight, 32, variant.ndbNumber);
  }

  const record = USDA_SR28_PEANUT_BUTTER_PORTION_EVIDENCE_B37.peanut_butter;
  assert.equal(record.gramsPerUnit, 16);
  assert.equal(record.sourceMeasureAmount, 2);
  assert.equal(record.sourceMeasureGramWeight, 32);
  assert.equal(record.reviewedVariantCount, 4);
  assert.deepEqual(record.reviewedNdbNumbers, ["16097", "16397", "16098", "16398"]);
  assert.equal(record.matchConfidence, "high");
});

test("B37 accepts only canonical peanut_butter tablespoons and does not broaden units or identities", () => {
  assert.equal(usdaSr28PeanutButterPortionConversionB37("peanut_butter", "tbsp")?.gramsPerUnit, 16);
  for (const unsupportedUnit of ["tsp", "tablespoon", "cup", "piece", "g"]) {
    assert.equal(usdaSr28PeanutButterPortionConversionB37("peanut_butter", unsupportedUnit), null, unsupportedUnit);
  }
  for (const unsupportedIdentity of ["peanuts", "tahini", "almonds", "cashews", "peanut_sauce"]) {
    assert.equal(usdaSr28PeanutButterPortionConversionB37(unsupportedIdentity, "tbsp"), null, unsupportedIdentity);
  }
});

test("runtime resolves peanut-butter tablespoons with B37 provenance while composition remains separately selected", () => {
  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "peanut_butter", quantity: 2, unit: "tbsp" }],
    serving: { servings: 1 }
  }, EUROPEAN_PRIMARY_DENSITIES_V1);
  assert.equal(result.complete, true);
  assert.equal(result.used[0].grams, 32);
  assert.equal(result.used[0].quantityEvidence.sourceId, USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.id);
  assert.equal(result.used[0].quantityEvidence.evidenceTranche, "B37");
  assert.equal(result.used[0].quantityEvidence.gramsPerUnit, 16);
  assert.equal(result.used[0].quantityEvidence.sourceMeasureAmount, 2);
  assert.equal(result.used[0].quantityEvidence.sourceMeasureGramWeight, 32);
  assert.deepEqual(result.used[0].quantityEvidence.reviewedNdbNumbers, ["16097", "16397", "16098", "16398"]);
  assert.equal(result.used[0].provenanceByNutrient.proteinG.evidenceTranche, "B36");
});

test("B37 clears only the peanut-butter quantity blocker from both authored tablespoon uses", () => {
  const uses = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "peanut_butter"));
  assert.equal(uses.length, 2);
  for (const recipe of uses) {
    const peanutButter = recipe.ingredients.find(item => item.canonicalIngredientId === "peanut_butter");
    assert.equal(peanutButter.quantity, 2, recipe.id);
    assert.equal(peanutButter.unit, "tbsp", recipe.id);
    const estimate = publicNutritionSource.estimate(recipe);
    const calculation = estimate.evidence.europeanStaticCalculation;
    assert.equal(calculation.skipped.some(item => item.ingredientId === "peanut_butter"), false, recipe.id);
    const used = calculation.used.find(item => item.ingredientId === "peanut_butter");
    assert.equal(used.grams, 32, recipe.id);
    assert.equal(used.quantityEvidence.evidenceTranche, "B37", recipe.id);
  }
});

test("B37 does not silently authorize cup or teaspoon conversion despite SR28 reporting a cup measure", () => {
  for (const unit of ["cup", "tsp"]) {
    const result = calculatePerServingFromDensities({
      ingredients: [{ canonicalIngredientId: "peanut_butter", quantity: 1, unit }],
      serving: { servings: 1 }
    }, EUROPEAN_PRIMARY_DENSITIES_V1);
    assert.equal(result.complete, false, unit);
    assert.equal(result.skipped[0].reason, "unsupported_quantity_unit", unit);
  }
});
