import test from "node:test";
import assert from "node:assert/strict";

import { RecipeSource } from "../src/core/contracts.js";
import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  PortableJsonRecipeSourceV2,
  createRecipeSourceV2,
  publicRecipeSource,
  recipeSourceV1
} from "../src/domain/catalog.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { allWeekSlots, defaultSlots, planSlots } from "../src/domain/planner.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";

const profiles = [
  normalizeProfile(DEFAULT_PROFILE),
  normalizeProfile({
    ...DEFAULT_PROFILE,
    dietaryMode: "vegetarian",
    maxMinutes: 45,
    skill: 2,
    cuisinePreferences: ["Mediterranean"],
    priorityPacks: []
  }),
  normalizeProfile({
    ...DEFAULT_PROFILE,
    dietaryMode: "vegan",
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    priorityPacks: []
  }),
  normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    allergens: ["sesame"],
    priorityPacks: []
  }),
  normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    excludedIngredientIds: ["aubergine"],
    priorityPacks: []
  }),
  normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 60,
    skill: 3,
    budget: 3,
    cuisinePreferences: ["Spanish"],
    unavailableIngredientIds: ["feta"],
    priorityPacks: [{ id: "culinary_explorer", scope: "dinner" }]
  }),
  normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 20,
    skill: 1,
    budget: 1,
    cuisinePreferences: ["Indian"],
    nutritionPriority: 4,
    proteinEmphasis: 4,
    priorityPacks: [{ id: "weeknight_fast", scope: "all" }]
  })
];

const queryCases = [
  { mainIngredientId: "aubergine", maxMinutes: 180, skill: 4 },
  { mainIngredientId: "bread", maxMinutes: 180, skill: 4 },
  { mainIngredientId: "chickpeas", secondaryIngredientIds: ["tomato", "lemon"], maxMinutes: 180, skill: 4 },
  { mainIngredientId: "tofu_firm", secondaryIngredientIds: ["cabbage"], requireAllSecondary: true, maxMinutes: 60, skill: 4 },
  { mainIngredientId: null }
];

function sources() {
  return {
    v1: recipeSourceV1,
    v2: createRecipeSourceV2()
  };
}

test("RecipeSource V2 preserves the stable RecipeSource interface while V1 remains the public default", () => {
  const { v1, v2 } = sources();
  assert.ok(v1 instanceof RecipeSource);
  assert.ok(v2 instanceof RecipeSource);
  assert.ok(v2 instanceof PortableJsonRecipeSourceV2);
  assert.equal(publicRecipeSource, recipeSourceV1);
  assert.notEqual(publicRecipeSource, v2);
});

test("RecipeSource V2 reproduces all 84 reviewed records exactly and in stable order", () => {
  const { v1, v2 } = sources();
  const v1Rows = v1.list();
  const v2Rows = v2.list();

  assert.equal(v1Rows.length, 84);
  assert.equal(v2Rows.length, 84);
  assert.deepEqual(v2Rows.map(recipe => recipe.id), v1Rows.map(recipe => recipe.id));
  assert.deepEqual(v2Rows, v1Rows);

  for (const recipe of v1Rows) {
    assert.deepEqual(v2.getById(recipe.id), v1.getById(recipe.id), recipe.id);
  }
  assert.equal(v1.getById("missing-recipe"), null);
  assert.equal(v2.getById("missing-recipe"), null);
});

test("RecipeSource V2 returns defensive JSON copies", () => {
  const v2 = createRecipeSourceV2();
  const first = v2.list()[0];
  const originalTitle = first.identity.canonicalTitle;
  first.identity.canonicalTitle = "mutated title";
  first.ingredients[0].canonicalIngredientId = "mutated_ingredient";

  const again = v2.getById(first.id);
  assert.equal(again.identity.canonicalTitle, originalTitle);
  assert.notEqual(again.ingredients[0].canonicalIngredientId, "mutated_ingredient");

  const getCopy = v2.getById(first.id);
  getCopy.identity.canonicalTitle = "second mutation";
  assert.equal(v2.getById(first.id).identity.canonicalTitle, originalTitle);
});

test("RecipeSource V2 fails closed on invalid or duplicate recipe identities", () => {
  assert.throws(() => new PortableJsonRecipeSourceV2({}), /requires an array/);
  assert.throws(() => new PortableJsonRecipeSourceV2([{ identity: {} }]), /non-empty string id/);
  assert.throws(
    () => new PortableJsonRecipeSourceV2([{ id: "duplicate" }, { id: "duplicate" }]),
    /duplicate recipe id: duplicate/
  );
});

test("V1 and V2 preserve ranking eligibility, hard reasons, scores and explanations across bounded profile contexts", () => {
  const { v1, v2 } = sources();
  const v1Rows = v1.list();
  const v2Rows = v2.list();
  const contexts = [
    { mealType: "lunch" },
    { mealType: "dinner" },
    { mealType: "lunch", mode: "search" },
    { mealType: "dinner", mode: "search" }
  ];

  for (const profile of profiles) {
    for (const context of contexts) {
      assert.deepEqual(rankRecipes(v2Rows, profile, context), rankRecipes(v1Rows, profile, context));
    }
  }
});

test("V1 and V2 preserve deterministic planner results for default and full-week slot sets", () => {
  const { v1, v2 } = sources();
  const v1Rows = v1.list();
  const v2Rows = v2.list();

  for (const profile of profiles.slice(0, 4)) {
    assert.deepEqual(planSlots(v2Rows, profile, defaultSlots()), planSlots(v1Rows, profile, defaultSlots()));
    assert.deepEqual(planSlots(v2Rows, profile, allWeekSlots()), planSlots(v1Rows, profile, allWeekSlots()));
  }
});

test("V1 and V2 preserve ingredient-search eligibility, blocked reasons and ordering", () => {
  const { v1, v2 } = sources();
  const v1Rows = v1.list();
  const v2Rows = v2.list();

  for (const profile of profiles.slice(0, 5)) {
    for (const query of queryCases) {
      assert.deepEqual(
        searchRecipesByIngredients(v2Rows, profile, query),
        searchRecipesByIngredients(v1Rows, profile, query)
      );
    }
  }
});

test("RecipeSource V2 compatibility fixture stays bound to the reviewed golden corpus", () => {
  const v2 = createRecipeSourceV2(ALL_RECIPES);
  assert.deepEqual(v2.list().map(recipe => recipe.id), ALL_RECIPES.map(recipe => recipe.id));
  assert.equal(new Set(v2.list().map(recipe => recipe.id)).size, ALL_RECIPES.length);
  assert.equal(ALL_RECIPES.length, 84);
});
