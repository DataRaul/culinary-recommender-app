import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/data/recipes.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { planSlots, defaultSlots, swapSlot } from "../src/domain/planner.js";

const profile = normalizeProfile({ ...DEFAULT_PROFILE, dietaryMode: "vegetarian", maxMinutes: 35, skill: 2, budget: 2, proteinEmphasis: 4, variety: 3, cuisinePreferences: ["Mediterranean"], mealPrep: 3 });

test("target success scenario fills 2 lunches and 3 dinners without duplicates", () => {
  const plan = planSlots(RECIPES, profile, defaultSlots());
  assert.equal(plan.items.length, 5);
  assert.equal(new Set(plan.items.map(item => item.recipe.id)).size, 5);
  assert.equal(plan.shortfalls.length, 0);
});

test("portfolio avoids single-protein collapse when alternatives exist", () => {
  const plan = planSlots(RECIPES, profile, defaultSlots());
  assert.ok(new Set(plan.items.map(item => item.recipe.mainProtein)).size >= 2);
});

test("swap changes one dish while retaining all other slots", () => {
  const plan = planSlots(RECIPES, profile, defaultSlots());
  const first = plan.items[0];
  const swapped = swapSlot(RECIPES, profile, plan, first.slot.id);
  assert.equal(swapped.items.length, plan.items.length);
  assert.notEqual(swapped.items.find(item => item.slot.id === first.slot.id).recipe.id, first.recipe.id);
  const retained = plan.items.slice(1).map(item => item.recipe.id).sort();
  const retainedAfter = swapped.items.filter(item => item.slot.id !== first.slot.id).map(item => item.recipe.id).sort();
  assert.deepEqual(retainedAfter, retained);
});
