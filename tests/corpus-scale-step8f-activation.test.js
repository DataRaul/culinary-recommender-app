import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ALL_RECIPES,
  ACTIVATED_EXTERNAL_RECIPES,
  PUBLIC_EXTERNAL_RECIPES,
  PUBLIC_RUNTIME_RECIPES
} from "../src/data/corpus-v1.js";
import { UNITOOLS_STEP8F_SOURCE } from "../src/data/external/unitools-step8f-v1.js";
import { createRecipeSourceV2 } from "../src/domain/catalog.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";

const frozen = JSON.parse(readFileSync(new URL("../data/generated/step8e/eligible-subset.json", import.meta.url), "utf8"));
const candidate = PUBLIC_RUNTIME_RECIPES.find(recipe => recipe.id === "unitools_tortilla_espanola");
const permissive = normalizeProfile({
  ...DEFAULT_PROFILE,
  maxMinutes: 180,
  skill: 4,
  budget: 4,
  cuisinePreferences: ["Spanish"],
  priorityPacks: [],
  allergens: [],
  excludedIngredientIds: [],
  unavailableIngredientIds: []
});

test("Step 8F activates exactly one reviewed external record without rewriting the 84-record golden corpus", () => {
  assert.equal(ALL_RECIPES.length, 84);
  assert.equal(ALL_RECIPES.some(recipe => recipe.id === "unitools_tortilla_espanola"), false);
  assert.equal(ACTIVATED_EXTERNAL_RECIPES.length, 1);
  assert.equal(PUBLIC_EXTERNAL_RECIPES.length, 9);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 85);
  assert.equal(new Set(PUBLIC_RUNTIME_RECIPES.map(recipe => recipe.id)).size, 85);
  assert.equal(candidate?.id, "unitools_tortilla_espanola");
});

test("Step 8E frozen decision evidence remains immutable while the separate Step 8F copy carries activation authority", () => {
  assert.equal(frozen.runtimeActivationAuthorized, false);
  assert.equal(frozen.publicRuntimeChanged, false);
  assert.equal(frozen.recipes.length, 1);
  assert.equal(frozen.recipes[0].governance.runtimeActivationAuthorized, false);
  assert.equal(candidate.governance.runtimeActivationAuthorized, true);
  assert.equal(candidate.governance.activationGate, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");
  assert.deepEqual(UNITOOLS_STEP8F_SOURCE.activatedRecipeIds, ["unitools_tortilla_espanola"]);
});

test("activated tortilla participates in ordinary ranking, planning and ingredient search", () => {
  const ranked = rankRecipes([candidate], permissive, { mealType: "dinner" });
  assert.deepEqual(ranked.eligible.map(item => item.recipe.id), [candidate.id]);

  const plan = planSlots([candidate], permissive, [{ id: "step8f-live", order: 1, day: "Step8F", mealType: "dinner" }]);
  assert.equal(plan.complete, true);
  assert.equal(plan.items[0].recipe.id, candidate.id);

  const search = searchRecipesByIngredients(PUBLIC_RUNTIME_RECIPES, permissive, { mainIngredientId: "potato", maxMinutes: 180, skill: 4 });
  assert.ok(search.eligible.some(item => item.recipe.id === candidate.id));
});

test("activated tortilla preserves hard safety filters", () => {
  const eggProfile = normalizeProfile({ ...permissive, allergens: ["egg"] });
  assert.match(rankRecipes([candidate], eggProfile, { mealType: "dinner" }).rejected[0].hardReasons.join(" | "), /declared allergen: egg/);

  const veganProfile = normalizeProfile({ ...permissive, dietaryMode: "vegan" });
  assert.match(rankRecipes([candidate], veganProfile, { mealType: "dinner" }).rejected[0].hardReasons.join(" | "), /not vegan/);

  const excluded = normalizeProfile({ ...permissive, excludedIngredientIds: ["potato"] });
  assert.match(rankRecipes([candidate], excluded, { mealType: "dinner" }).rejected[0].hardReasons.join(" | "), /contains excluded ingredient: potato/);
});

test("activated record preserves attribution and the nutrition-authority firewall", () => {
  assert.equal(candidate.provenance.license, "CC-BY-SA-4.0");
  assert.match(candidate.provenance.attribution, /UniTools/);
  assert.equal(candidate.nutrition.estimationState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
  assert.equal(candidate.nutrition.perServing.energyKcal, null);
  assert.equal(candidate.governance.sourceNutritionIgnoredForAuthority, true);
  assert.equal(candidate.governance.sourceDietaryMetadataIgnoredForAuthority, true);
  assert.equal(candidate.governance.sourceScalingMetadataIgnoredForAuthority, true);
});

test("portable RecipeSource V2 preserves the exact activated candidate universe when supplied explicitly", () => {
  const rows = createRecipeSourceV2(PUBLIC_RUNTIME_RECIPES).list();
  assert.deepEqual(rows, PUBLIC_RUNTIME_RECIPES);
  assert.equal(rows.length, 85);
});
