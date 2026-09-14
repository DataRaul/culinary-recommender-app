import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { createRecipeSourceV2 } from "../src/domain/catalog.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";

const frozen = JSON.parse(readFileSync(new URL("../data/generated/step8e/eligible-subset.json", import.meta.url), "utf8"));
const candidate = {
  ...frozen.recipes[0],
  mainProtein: frozen.recipes[0].mainProtein ?? null,
  discovery: { flavourProfile: [], ...(frozen.recipes[0].discovery || {}) }
};
const candidateUniverse = Object.freeze([...ALL_RECIPES, candidate]);
const permissive = normalizeProfile({
  ...DEFAULT_PROFILE,
  maxMinutes: 180,
  skill: 4,
  budget: 4,
  cuisinePreferences: [],
  priorityPacks: [],
  allergens: [],
  excludedIngredientIds: [],
  unavailableIngredientIds: []
});

test("Step 8F decision input is exact and public runtime remains unchanged before human authorization", () => {
  assert.equal(frozen.schemaVersion, "CORPUS_SCALE_STEP8E_ELIGIBLE_SUBSET_V1");
  assert.equal(frozen.runtimeActivationAuthorized, false);
  assert.equal(frozen.publicRuntimeChanged, false);
  assert.equal(frozen.recipes.length, 1);
  assert.equal(candidate.id, "unitools_tortilla_espanola");
  assert.equal(ALL_RECIPES.length, 84);
  assert.equal(ALL_RECIPES.some(recipe => recipe.id === candidate.id), false);
});

test("Step 8F candidate passes ordinary recommendation and planner semantics only under compatible hard constraints", () => {
  const ranked = rankRecipes([candidate], permissive, { mealType: "dinner" });
  assert.deepEqual(ranked.eligible.map(item => item.recipe.id), [candidate.id]);
  assert.equal(ranked.rejected.length, 0);

  const plan = planSlots([candidate], permissive, [{ id: "test-dinner", order: 1, day: "Test", mealType: "dinner" }]);
  assert.equal(plan.complete, true);
  assert.equal(plan.items[0].recipe.id, candidate.id);

  const eggProfile = normalizeProfile({ ...permissive, allergens: ["egg"] });
  assert.match(rankRecipes([candidate], eggProfile, { mealType: "dinner" }).rejected[0].hardReasons.join(" | "), /declared allergen: egg/);

  const veganProfile = normalizeProfile({ ...permissive, dietaryMode: "vegan" });
  assert.match(rankRecipes([candidate], veganProfile, { mealType: "dinner" }).rejected[0].hardReasons.join(" | "), /not vegan/);

  const exclusionProfile = normalizeProfile({ ...permissive, excludedIngredientIds: ["potato"] });
  assert.match(rankRecipes([candidate], exclusionProfile, { mealType: "dinner" }).rejected[0].hardReasons.join(" | "), /contains excluded ingredient: potato/);

  const timeProfile = normalizeProfile({ ...permissive, maxMinutes: 45 });
  assert.match(rankRecipes([candidate], timeProfile, { mealType: "dinner" }).rejected[0].hardReasons.join(" | "), /over 45-minute limit/);

  const skillProfile = normalizeProfile({ ...permissive, skill: 2 });
  assert.match(rankRecipes([candidate], skillProfile, { mealType: "dinner" }).rejected[0].hardReasons.join(" | "), /above selected cooking skill/);
});

test("Step 8F candidate obeys ingredient-search hard filters and can be found by canonical potato identity", () => {
  const result = searchRecipesByIngredients(candidateUniverse, permissive, { mainIngredientId: "potato", maxMinutes: 180, skill: 4 });
  assert.ok(result.eligible.some(item => item.recipe.id === candidate.id));

  const eggProfile = normalizeProfile({ ...permissive, allergens: ["egg"] });
  const blocked = searchRecipesByIngredients(candidateUniverse, eggProfile, { mainIngredientId: "potato", maxMinutes: 180, skill: 4 });
  const row = blocked.blocked.find(item => item.recipe.id === candidate.id);
  assert.ok(row);
  assert.match(row.hardReasons.join(" | "), /declared allergen: egg/);
});

test("Step 8F candidate preserves V1/direct versus RecipeSource V2 behavior before any cut-over", () => {
  const v2 = createRecipeSourceV2(candidateUniverse).list();
  assert.deepEqual(v2, candidateUniverse);

  const profiles = [
    permissive,
    normalizeProfile({ ...permissive, dietaryMode: "vegetarian", maxMinutes: 60, skill: 3, cuisinePreferences: ["Spanish"] }),
    normalizeProfile({ ...permissive, allergens: ["egg"] }),
    normalizeProfile({ ...permissive, excludedIngredientIds: ["potato"] })
  ];
  for (const profile of profiles) {
    for (const mealType of ["lunch", "dinner"]) {
      assert.deepEqual(rankRecipes(v2, profile, { mealType }), rankRecipes(candidateUniverse, profile, { mealType }));
    }
    const slot = [{ id: "decision-input", order: 1, day: "Decision", mealType: "dinner" }];
    assert.deepEqual(planSlots(v2, profile, slot), planSlots(candidateUniverse, profile, slot));
    assert.deepEqual(
      searchRecipesByIngredients(v2, profile, { mainIngredientId: "potato", maxMinutes: 180, skill: 4 }),
      searchRecipesByIngredients(candidateUniverse, profile, { mainIngredientId: "potato", maxMinutes: 180, skill: 4 })
    );
  }
});

test("Step 8F decision input preserves attribution and nutrition firewall", () => {
  assert.equal(candidate.provenance.license, "CC-BY-SA-4.0");
  assert.match(candidate.provenance.attribution, /UniTools/);
  assert.equal(candidate.provenance.modifiedFromSource, true);
  assert.equal(candidate.nutrition.estimationState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
  assert.equal(candidate.nutrition.perServing.energyKcal, null);
  assert.equal(candidate.governance.sourceNutritionIgnoredForAuthority, true);
  assert.equal(candidate.governance.runtimeActivationAuthorized, false);
});
