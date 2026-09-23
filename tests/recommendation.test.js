import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/data/recipes.js";
import { ACTIVATED_EXTERNAL_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { evaluateRecipe, rankRecipes } from "../src/domain/recommendation.js";

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


test("unknown nutrition remains explicit and is not numerically coerced to zero", () => {
  const recipe = ACTIVATED_EXTERNAL_RECIPES.find(item => item.id === "unitools_tortilla_espanola");
  assert.ok(recipe);
  const profile = normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    nutritionPriority: 1,
    proteinEmphasis: 1,
    priorityPacks: []
  });
  const evaluated = evaluateRecipe(recipe, profile);
  assert.equal(evaluated.eligible, true);
  assert.equal(evaluated.components.nutrition, null);
  assert.equal(evaluated.components.protein, null);
  assert.deepEqual(evaluated.evidence.unavailableSoftSignals, ["nutrition", "protein"]);
  assert.equal(evaluated.evidence.nutritionState, "PARTIAL_OR_UNKNOWN");
  assert.ok(Number.isFinite(evaluated.score));
  assert.ok(evaluated.evidence.scoreNormalization.positiveWeightScale > 1);
});

test("unknown nutrition is distinct from explicit numeric zero", () => {
  const recipe = ACTIVATED_EXTERNAL_RECIPES.find(item => item.id === "unitools_tortilla_espanola");
  const profile = normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    nutritionPriority: 1,
    proteinEmphasis: 1,
    priorityPacks: []
  });
  const unknown = evaluateRecipe(recipe, profile);
  const explicitZero = evaluateRecipe({
    ...recipe,
    nutrition: {
      ...recipe.nutrition,
      perServing: {
        energyKcal: 0,
        proteinG: 0,
        carbohydrateG: 0,
        fatG: 0,
        fibreG: 0
      }
    }
  }, profile);
  assert.notEqual(unknown.score, explicitZero.score);
  assert.equal(explicitZero.components.nutrition, 0);
  assert.equal(explicitZero.components.protein, 0);
  assert.deepEqual(explicitZero.evidence.unavailableSoftSignals, []);
});


test("fully available recommendation evidence keeps the original positive weight scale", () => {
  const recipe = RECIPES.find(item =>
    Number.isFinite(item?.nutrition?.perServing?.proteinG) &&
    Number.isFinite(item?.nutrition?.perServing?.fibreG)
  );
  assert.ok(recipe);
  const profile = normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    priorityPacks: []
  });
  const evaluated = evaluateRecipe(recipe, profile);
  assert.equal(evaluated.eligible, true);
  assert.equal(evaluated.evidence.scoreNormalization.positiveWeightScale, 1);
  assert.deepEqual(evaluated.evidence.unavailableSoftSignals, []);
});

test("priority packs skip unavailable nutrition signals rather than imputing them", () => {
  const recipe = ACTIVATED_EXTERNAL_RECIPES.find(item => item.id === "unitools_tortilla_espanola");
  const profile = normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    priorityPacks: [
      { id: "healthy_convenience", scope: "all" },
      { id: "high_protein_convenience", scope: "all" }
    ]
  });
  const evaluated = evaluateRecipe(recipe, profile);
  assert.equal(evaluated.eligible, true);
  assert.deepEqual(evaluated.evidence.unavailablePrioritySignals, ["nutrition", "protein"]);
});
