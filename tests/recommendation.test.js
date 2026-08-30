import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/data/recipes.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";

const target = normalizeProfile({ ...DEFAULT_PROFILE, dietaryMode: "vegetarian", maxMinutes: 35, skill: 2, budget: 2, proteinEmphasis: 4, cuisinePreferences: ["Mediterranean"], variety: 3 });

test("ranking is deterministic with stable tie-breaking", () => {
  const a = rankRecipes(RECIPES, target, { mealType: "dinner" }).eligible.map(item => [item.recipe.id, item.score]);
  const b = rankRecipes(RECIPES, target, { mealType: "dinner" }).eligible.map(item => [item.recipe.id, item.score]);
  assert.deepEqual(a, b);
  assert.ok(a.length >= 5);
});

test("hard dietary mode never intentionally leaks meat/fish recipes", () => {
  const ranked = rankRecipes(RECIPES, target, { mealType: "dinner" });
  assert.ok(ranked.eligible.every(item => item.recipe.dietaryTags.includes("vegetarian")));
});

test("allergens are hard constraints", () => {
  const profile = normalizeProfile({ ...target, allergens: ["milk"] });
  const ranked = rankRecipes(RECIPES, profile, { mealType: "dinner" });
  assert.ok(ranked.eligible.every(item => !item.recipe.allergySafety.declaredAllergens.includes("milk")));
});

test("time and skill caps are hard constraints", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, maxMinutes: 25, skill: 1 });
  const ranked = rankRecipes(RECIPES, profile, { mealType: "lunch" });
  assert.ok(ranked.eligible.every(item => item.recipe.time.totalMinutes <= 25 && item.recipe.culinary.difficulty <= 1));
});
