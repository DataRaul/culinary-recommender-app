import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/data/recipes.js";
import { DEFAULT_PROFILE } from "../src/domain/profile.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";

test("salmon plus rice ranks the recipe that uses both first", () => {
  const result = searchRecipesByIngredients(RECIPES, { ...DEFAULT_PROFILE, dietaryMode: "unrestricted", skill: 4, maxMinutes: 60 }, {
    mainIngredientId: "salmon",
    secondaryIngredientIds: ["rice"],
    followProfilePreferences: false,
    skill: 4,
    maxMinutes: 60
  });
  assert.ok(result.eligible.length >= 2);
  assert.equal(result.eligible[0].recipe.id, "east_asian_salmon_cabbage_rice");
  assert.deepEqual(result.eligible[0].secondaryMatches, ["rice"]);
});

test("require-all secondary ingredients acts as an explicit hard search filter", () => {
  const result = searchRecipesByIngredients(RECIPES, { ...DEFAULT_PROFILE, dietaryMode: "unrestricted", skill: 4, maxMinutes: 60 }, {
    mainIngredientId: "salmon",
    secondaryIngredientIds: ["rice"],
    requireAllSecondary: true,
    followProfilePreferences: false,
    skill: 4,
    maxMinutes: 60
  });
  assert.equal(result.eligible.length, 1);
  assert.equal(result.eligible[0].recipe.id, "east_asian_salmon_cabbage_rice");
  assert.ok(result.requiredSecondaryMismatchCount >= 1);
});

test("temporary beginner effort can reject recipes without mutating the saved profile", () => {
  const profile = { ...DEFAULT_PROFILE, dietaryMode: "unrestricted", skill: 4, maxMinutes: 90 };
  const result = searchRecipesByIngredients(RECIPES, profile, {
    mainIngredientId: "salmon",
    followProfilePreferences: false,
    skill: 1,
    maxMinutes: 90
  });
  assert.equal(result.eligible.length, 0);
  assert.ok(result.shortfall.some(item => item.reason === "above selected cooking skill"));
  assert.equal(profile.skill, 4);
});

test("allergen hard constraints remain active in ingredients-first mode", () => {
  const result = searchRecipesByIngredients(RECIPES, { ...DEFAULT_PROFILE, dietaryMode: "unrestricted", allergens: ["fish"], skill: 4, maxMinutes: 90 }, {
    mainIngredientId: "salmon",
    followProfilePreferences: false,
    skill: 4,
    maxMinutes: 90
  });
  assert.equal(result.eligible.length, 0);
  assert.ok(result.shortfall.some(item => item.reason === "declared allergen: fish"));
});

test("search meal context activates only matching scoped priority packs", () => {
  const profile = {
    ...DEFAULT_PROFILE,
    dietaryMode: "unrestricted",
    skill: 4,
    maxMinutes: 90,
    priorityPacks: [
      { id: "meal_prep", scope: "lunch" },
      { id: "culinary_explorer", scope: "dinner" },
      { id: "healthy_convenience", scope: "all" }
    ]
  };
  const result = searchRecipesByIngredients(RECIPES, profile, {
    mainIngredientId: "chickpeas",
    followProfilePreferences: true,
    mealType: "dinner",
    skill: 4,
    maxMinutes: 90
  });
  assert.ok(result.eligible.length > 0);
  const ids = result.eligible[0].activePriorityPacks.map(item => item.id);
  assert.ok(ids.includes("culinary_explorer"));
  assert.ok(ids.includes("healthy_convenience"));
  assert.ok(!ids.includes("meal_prep"));
});

test("ingredients-first neutral lens clears soft priority packs", () => {
  const profile = {
    ...DEFAULT_PROFILE,
    dietaryMode: "unrestricted",
    skill: 4,
    maxMinutes: 90,
    priorityPacks: [{ id: "culinary_explorer", scope: "all" }]
  };
  const result = searchRecipesByIngredients(RECIPES, profile, {
    mainIngredientId: "chickpeas",
    followProfilePreferences: false,
    mealType: "dinner",
    skill: 4,
    maxMinutes: 90
  });
  assert.ok(result.eligible.length > 0);
  assert.deepEqual(result.profile.priorityPacks, []);
  assert.deepEqual(result.eligible[0].activePriorityPacks, []);
});
