import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/data/recipes.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { planSlots, defaultSlots } from "../src/domain/planner.js";
import { buildGroceryList } from "../src/domain/grocery.js";
import { DEFAULT_PANTRY_STAPLES } from "../src/data/ingredients.js";

test("grocery list aggregates compatible quantities and separates pantry", () => {
  const plan = planSlots(RECIPES, normalizeProfile(DEFAULT_PROFILE), defaultSlots());
  const grocery = buildGroceryList(plan.items, DEFAULT_PANTRY_STAPLES);
  assert.equal(grocery.meals, plan.items.length);
  assert.ok(grocery.entries.length > 0);
  assert.ok(grocery.pantryItems.every(item => DEFAULT_PANTRY_STAPLES.includes(item.ingredientId)));
  assert.ok(grocery.reusedIngredientCount >= 1);
});
