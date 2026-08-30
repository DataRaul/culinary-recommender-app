import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/data/recipes.js";
import { activePriorityPacks, MAX_PRIORITY_PACKS, normalizeProfile } from "../src/domain/profile.js";
import { evaluateRecipe } from "../src/domain/recommendation.js";

test("priority packs are composable, unique, scoped and capped at three", () => {
  const profile = normalizeProfile({
    priorityPacks: [
      { id: "meal_prep", scope: "lunch" },
      { id: "culinary_explorer", scope: "dinner" },
      { id: "high_protein_convenience", scope: "all" },
      { id: "weeknight_fast", scope: "dinner" },
      { id: "meal_prep", scope: "all" }
    ]
  });
  assert.equal(profile.priorityPacks.length, MAX_PRIORITY_PACKS);
  assert.deepEqual(profile.priorityPacks.map(item => item.id), ["meal_prep", "culinary_explorer", "high_protein_convenience"]);
  assert.deepEqual(activePriorityPacks(profile, "lunch").map(item => item.id), ["meal_prep", "high_protein_convenience"]);
  assert.deepEqual(activePriorityPacks(profile, "dinner").map(item => item.id), ["culinary_explorer", "high_protein_convenience"]);
});

test("legacy single presets migrate to the closest composable priority pack", () => {
  const profile = normalizeProfile({ preset: "meal_prep_worker" });
  assert.deepEqual(profile.priorityPacks, [{ id: "meal_prep", scope: "all" }]);
  assert.equal(profile.preset, null);
});

test("meal-scoped packs influence only their intended meal context", () => {
  const recipe = RECIPES.find(item => item.id === "med_lentil_feta_salad");
  assert.ok(recipe);
  const profile = normalizeProfile({
    dietaryMode: "unrestricted",
    skill: 4,
    maxMinutes: 90,
    priorityPacks: [
      { id: "meal_prep", scope: "lunch" },
      { id: "culinary_explorer", scope: "dinner" }
    ]
  });
  const lunch = evaluateRecipe(recipe, profile, { mealType: "lunch" });
  const dinner = evaluateRecipe(recipe, profile, { mealType: "dinner" });
  assert.deepEqual(lunch.activePriorityPacks.map(item => item.id), ["meal_prep"]);
  assert.deepEqual(dinner.activePriorityPacks.map(item => item.id), ["culinary_explorer"]);
  assert.ok(lunch.priorityPackBonus > 0);
  assert.ok(dinner.priorityPackBonus > 0);
});
