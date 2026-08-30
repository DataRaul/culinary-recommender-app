import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/data/recipes.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { ingredientMatchesPermanentExclusion, resolvePermanentExclusion } from "../src/domain/exclusions.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";

test("known, family-wide and future permanent exclusions normalize deterministically", () => {
  const coconut = resolvePermanentExclusion("coconut");
  assert.equal(coconut.id, "coconut");
  assert.equal(coconut.familyWide, true);
  assert.equal(coconut.futureOnly, false);
  assert.equal(resolvePermanentExclusion("coco").id, "coconut");
  assert.equal(resolvePermanentExclusion("leche de coco").id, "coconut_milk");
  assert.equal(ingredientMatchesPermanentExclusion("coconut_milk", "coconut"), true);
  const pineapple = resolvePermanentExclusion("pineapple");
  assert.equal(pineapple.id, "pineapple");
  assert.equal(pineapple.futureOnly, true);
  assert.equal(resolvePermanentExclusion("Piña").id, "pineapple");
});

test("family-wide permanent exclusions are hard filters, not substitution requests", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, skill: 4, maxMinutes: 90, excludedIngredientIds: ["coconut"] });
  const ranked = rankRecipes(RECIPES, profile, { mealType: "dinner" });
  assert.ok(ranked.eligible.every(item => !item.recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "coconut_milk")));
  const blocked = ranked.rejected.find(item => item.recipe.id === "indian_tempeh_coconut_curry");
  assert.ok(blocked);
  assert.ok(blocked.hardReasons.some(reason => reason.includes("contains excluded ingredient: coconut_milk")));
});

test("ingredient search also honors family-wide permanent exclusions", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, skill: 4, maxMinutes: 90, excludedIngredientIds: ["coconut"] });
  const result = searchRecipesByIngredients(RECIPES, profile, {
    mainIngredientId: "tempeh",
    followProfilePreferences: false,
    skill: 4,
    maxMinutes: 90
  });
  assert.ok(result.catalogMatchCount >= 1);
  assert.ok(result.eligible.every(item => !item.recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "coconut_milk")));
  assert.ok(result.shortfall.some(item => item.reason.includes("contains excluded ingredient: coconut_milk")));
});
