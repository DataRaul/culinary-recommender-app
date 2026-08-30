import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/data/recipes.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { resolvePermanentExclusion } from "../src/domain/exclusions.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";

test("known and future permanent exclusions normalize deterministically", () => {
  assert.equal(resolvePermanentExclusion("coconut").id, "coconut_milk");
  assert.equal(resolvePermanentExclusion("leche de coco").id, "coconut_milk");
  const pineapple = resolvePermanentExclusion("pineapple");
  assert.equal(pineapple.id, "pineapple");
  assert.equal(pineapple.futureOnly, true);
  assert.equal(resolvePermanentExclusion("Piña").id, "pineapple");
});

test("permanent exclusions are hard filters, not substitution requests", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, skill: 4, maxMinutes: 90, excludedIngredientIds: ["coconut_milk"] });
  const ranked = rankRecipes(RECIPES, profile, { mealType: "dinner" });
  assert.ok(ranked.eligible.every(item => !item.recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "coconut_milk")));
  const blocked = ranked.rejected.find(item => item.recipe.id === "indian_tempeh_coconut_curry");
  assert.ok(blocked);
  assert.ok(blocked.hardReasons.some(reason => reason.includes("contains excluded ingredient: coconut_milk")));
});

test("ingredient search also honors permanent exclusions", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, skill: 4, maxMinutes: 90, excludedIngredientIds: ["coconut_milk"] });
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
