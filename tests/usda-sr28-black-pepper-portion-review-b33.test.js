import test from "node:test";
import assert from "node:assert/strict";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import {
  USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33,
  USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33,
  usdaSr28BlackPepperPortionReviewB33
} from "../src/data/usda-sr28-black-pepper-portion-review-b33.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

test("B33 pins the official USDA SR28 black-pepper identity without importing composition", () => {
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33.authority, "U.S. Department of Agriculture, Agricultural Research Service");
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33.dataset, "USDA National Nutrient Database for Standard Reference, Release 28");
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33.ndbNumber, "02030");
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33.foodName, "Spices, pepper, black");
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33.scientificName, "Piper nigrum");
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33.state, "REVIEWED_AMBIGUOUS_NOT_RUNTIME_ELIGIBLE");
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_SOURCE_B33.runtimeFetch, false);
});

test("B33 preserves both official teaspoon measures instead of choosing a convenient mass", () => {
  assert.deepEqual(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33.candidates, [
    { sourceMeasure: "1 tsp, ground", amount: 1, gramWeight: 2.3, form: "ground" },
    { sourceMeasure: "1 tsp, whole", amount: 1, gramWeight: 2.9, form: "whole" }
  ]);
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33.decision, "HOLD_FORM_AMBIGUITY");
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33.runtimeEligible, false);
});

test("the two authored black-pepper teaspoon uses omit the ground-versus-whole form needed to select a source measure", () => {
  const uses = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "black_pepper"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "black_pepper")
    }));
  assert.deepEqual(uses.map(use => use.recipeId), ["italian_ricotta_spinach_pasta", "italian_mushroom_risotto"]);
  assert.ok(uses.every(use => use.ingredient.quantity === 0.5));
  assert.ok(uses.every(use => use.ingredient.unit === "tsp"));
  assert.ok(uses.every(use => use.ingredient.preparation === null));
});

test("B33 lookup is bounded to canonical black pepper teaspoons and grants no conversion", () => {
  assert.equal(usdaSr28BlackPepperPortionReviewB33("black_pepper", "tsp"), USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33);
  for (const [ingredientId, unit] of [["black_pepper", "tbsp"], ["white_pepper", "tsp"], ["peppercorns", "tsp"], ["salt", "tsp"]]) {
    assert.equal(usdaSr28BlackPepperPortionReviewB33(ingredientId, unit), null, `${ingredientId}|${unit}`);
  }
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33.gramsPerUnit, undefined);
  assert.equal(USDA_SR28_BLACK_PEPPER_PORTION_REVIEW_B33.acceptedUnits, undefined);
});

test("B33 review evidence leaves public runtime fail-closed until form authority exists", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  for (const recipeId of ["italian_ricotta_spinach_pasta", "italian_mushroom_risotto"]) {
    const detail = audit.recipeDetails.find(row => row.recipeId === recipeId);
    assert.ok(detail, recipeId);
    assert.deepEqual(
      detail.blockers.filter(blocker => blocker.ingredientId === "black_pepper"),
      [{ ingredientId: "black_pepper", reason: "unsupported_quantity_unit" }],
      recipeId
    );
    assert.equal(detail.authoritative, false, recipeId);
  }
});
