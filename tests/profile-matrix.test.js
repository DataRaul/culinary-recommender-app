import test from "node:test";
import assert from "node:assert/strict";
import { ALL_RECIPES as RECIPES } from "../src/data/corpus-v1.js";
import { normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";

const skills = [1,2,3,4];
const budgets = [1,2,4];
const times = [20,35,60];
const diets = ["unrestricted","vegetarian","vegan"];
const nutrition = [1,4];
const protein = [1,4];
const cuisines = [[],["Mediterranean"],["Indian"]];
const variety = [1,4];
const mealPrep = [1,4];
const availabilitySets = [[],["feta"],["quinoa"]];
const slots = [{id:"test-lunch",order:1,day:"Monday",mealType:"lunch"},{id:"test-dinner",order:2,day:"Monday",mealType:"dinner"}];

test("representative profile matrix remains deterministic and respects invariants", () => {
  let cases = 0;
  for (const skill of skills) for (const budget of budgets) for (const maxMinutes of times) for (const dietaryMode of diets)
  for (const nutritionPriority of nutrition) for (const proteinEmphasis of protein) for (const cuisinePreferences of cuisines)
  for (const varietyValue of variety) for (const mealPrepValue of mealPrep) for (const unavailableIngredientIds of availabilitySets) {
    const profile = normalizeProfile({ skill, budget, maxMinutes, dietaryMode, nutritionPriority, proteinEmphasis, cuisinePreferences, variety: varietyValue, mealPrep: mealPrepValue, unavailableIngredientIds });
    const a = rankRecipes(RECIPES, profile, { mealType: "dinner" }).eligible.map(item => item.recipe.id);
    const b = rankRecipes(RECIPES, profile, { mealType: "dinner" }).eligible.map(item => item.recipe.id);
    assert.deepEqual(a,b);
    for (const id of a) {
      const recipe = RECIPES.find(item => item.id === id);
      assert.ok(recipe.culinary.difficulty <= skill);
      assert.ok(recipe.time.totalMinutes <= maxMinutes);
      if (dietaryMode !== "unrestricted") assert.ok(recipe.dietaryTags.includes(dietaryMode));
    }
    const plan = planSlots(RECIPES, profile, slots);
    assert.ok(plan.items.length <= slots.length);
    cases++;
  }
  assert.equal(cases, 15552);
});
