import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  P3_ACTIVATED_EXTERNAL_RECIPES,
  PUBLIC_EXTERNAL_RECIPES,
  PUBLIC_RUNTIME_RECIPES
} from "../src/data/corpus-v1.js";
import { ingredientById, normalizeIngredient } from "../src/data/ingredients.js";
import { createRecipeSourceV2 } from "../src/domain/catalog.js";
import { inspectExternalRecipeProvenance } from "../src/domain/public-attribution.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";
import { validateP3ActivationContract } from "../scripts/culinary-brain-p3-tapioca-bounded-activation-core.mjs";

const read = path => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const contract = read("config/culinary_brain_p3_tapioca_bounded_activation_v1.json");
const summary = read("data/generated/culinary-brain-p3-tapioca-bounded-activation-summary-v1.json");
const frozenCandidate = read("data/generated/culinary-brain-c4-tapioca-p3-candidate-v1.json");
const candidate = PUBLIC_RUNTIME_RECIPES.find(recipe => recipe.id === "unitools_pao_de_queijo");
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

test("P3 activation contract is exactly owner-authorized and does not authorize wider admission", () => {
  assert.deepEqual(validateP3ActivationContract(contract), []);
  assert.equal(contract.authority.ownerActivationAuthorized, true);
  assert.equal(contract.authority.runtimeActivationAuthorized, true);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized, true);
  assert.equal(contract.authority.exactCandidateRecommendationAdmissionAuthorized, true);
  assert.equal(contract.authority.automaticRecommendationAdmissionAuthorized, false);
  assert.equal(contract.authority.furtherProtectedRecipeAdmissionAuthorized, false);
  assert.equal(contract.authority.barbecueMutationAuthorized, false);
  assert.equal(summary.terminal, "CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_PASS__P4_READY");
});

test("P3 activates exactly one additional reviewed external recipe", () => {
  assert.equal(P3_ACTIVATED_EXTERNAL_RECIPES.length, 1);
  assert.equal(PUBLIC_EXTERNAL_RECIPES.length, 10);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 86);
  assert.equal(new Set(PUBLIC_RUNTIME_RECIPES.map(recipe => recipe.id)).size, 86);
  assert.equal(candidate?.id, "unitools_pao_de_queijo");
  assert.equal(candidate.governance.runtimeActivationAuthorized, true);
  assert.equal(candidate.governance.candidateSemanticsOnly, false);
  assert.equal(candidate.governance.recommendationState, "ELIGIBLE");
  assert.equal(frozenCandidate.candidateOnly, true);
  assert.equal(frozenCandidate.recipe.governance.runtimeActivationAuthorized, false);
});

test("tapioca starch identity is exact and does not widen a generic tapioca alias", () => {
  const ingredient = ingredientById("tapioca_starch");
  assert.equal(ingredient?.name, "tapioca starch");
  assert.deepEqual(ingredient?.aliases, []);
  assert.deepEqual(ingredient?.allergens, []);
  assert.equal(normalizeIngredient("tapioca starch"), "tapioca_starch");
  assert.equal(normalizeIngredient("Tapioca starch"), "tapioca_starch");
  assert.equal(normalizeIngredient("tapioca"), null);
});

test("activated pão de queijo participates in reviewed breakfast and snack recommendation and planning", () => {
  for (const mealType of ["breakfast", "snack"]) {
    assert.deepEqual(rankRecipes([candidate], permissive, { mealType }).eligible.map(item => item.recipe.id), [candidate.id]);
  }
  for (const mealType of ["lunch", "dinner"]) {
    assert.match(rankRecipes([candidate], permissive, { mealType }).rejected[0].hardReasons.join(" | "), new RegExp("not tagged for " + mealType));
  }
  const plan = planSlots([candidate], permissive, [{ id: "p3-live-breakfast", order: 1, day: "P3", mealType: "breakfast" }]);
  assert.equal(plan.complete, true);
  assert.equal(plan.items[0].recipe.id, candidate.id);
});

test("activated candidate preserves allergen, dietary, ingredient, time and skill hard filters", () => {
  for (const allergen of ["egg", "milk"]) {
    const profile = normalizeProfile({ ...permissive, allergens: [allergen] });
    assert.match(rankRecipes([candidate], profile, { mealType: "breakfast" }).rejected[0].hardReasons.join(" | "), new RegExp("declared allergen: " + allergen));
  }
  for (const dietaryMode of ["vegetarian", "vegan"]) {
    const profile = normalizeProfile({ ...permissive, dietaryMode });
    assert.match(rankRecipes([candidate], profile, { mealType: "breakfast" }).rejected[0].hardReasons.join(" | "), new RegExp("not " + dietaryMode));
  }
  assert.match(rankRecipes([candidate], normalizeProfile({ ...permissive, excludedIngredientIds: ["tapioca_starch"] }), { mealType: "breakfast" }).rejected[0].hardReasons.join(" | "), /contains excluded ingredient: tapioca_starch/);
  assert.match(rankRecipes([candidate], normalizeProfile({ ...permissive, unavailableIngredientIds: ["tapioca_starch"] }), { mealType: "breakfast" }).rejected[0].hardReasons.join(" | "), /unavailable without supported substitute: tapioca_starch/);
  assert.match(rankRecipes([candidate], normalizeProfile({ ...permissive, maxMinutes: 45 }), { mealType: "breakfast" }).rejected[0].hardReasons.join(" | "), /over 45-minute limit/);
  assert.match(rankRecipes([candidate], normalizeProfile({ ...permissive, skill: 2 }), { mealType: "breakfast" }).rejected[0].hardReasons.join(" | "), /above selected cooking skill/);
});

test("activated candidate is visible in ingredient search and portable RecipeSource V2", () => {
  const result = searchRecipesByIngredients(PUBLIC_RUNTIME_RECIPES, permissive, {
    mainIngredientId: "tapioca_starch",
    mealType: "breakfast",
    maxMinutes: 180,
    skill: 4
  });
  assert.ok(result.eligible.some(item => item.recipe.id === candidate.id));
  const v2 = createRecipeSourceV2(PUBLIC_RUNTIME_RECIPES).list();
  assert.equal(v2.length, 86);
  assert.deepEqual(v2, PUBLIC_RUNTIME_RECIPES);
});

test("activated candidate preserves public attribution and nutrition firewall", () => {
  const attribution = inspectExternalRecipeProvenance(candidate.provenance);
  assert.equal(attribution.allowed, true);
  assert.equal(candidate.provenance.license, "CC-BY-SA-4.0");
  assert.match(candidate.provenance.attribution, /UniTools/);
  assert.equal(candidate.nutrition.estimationState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
  assert.equal(candidate.nutrition.perServing.energyKcal, null);
  assert.equal(candidate.governance.sourceNutritionIgnoredForAuthority, true);
  assert.deepEqual(candidate.dietaryTags, ["unrestricted"]);
  assert.deepEqual(candidate.allergySafety.declaredAllergens, ["egg", "milk"]);
});
