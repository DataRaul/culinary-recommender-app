import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import { buildR3Summary, validateR3Contract } from "../scripts/protected-corpus-recommendation-expansion-r3-machine-acceptance-core.mjs";

const read = path => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const contract = read("config/protected_corpus_recommendation_expansion_r3_machine_acceptance_v1.json");
const r2 = read("data/generated/protected-corpus-recommendation-expansion-r2-hard-safety-summary-v1.json");
const artifact = read("data/generated/protected-corpus-recommendation-expansion-r3-chimichurri-candidate-v1.json");
const summary = read("data/generated/protected-corpus-recommendation-expansion-r3-machine-acceptance-summary-v1.json");
const candidate = artifact.recipe;
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

test("R3 contract carries R2 hard-safety evidence but opens no runtime authority", () => {
  assert.deepEqual(validateR3Contract(contract, r2), []);
  assert.equal(contract.authority.runtimeActivationAuthorized, false);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized, false);
  assert.equal(contract.authority.automaticRecommendationAdmissionAuthorized, false);
  assert.equal(contract.authority.ownerAdmissionGateOpen, false);
  assert.equal(summary.admissionReadyCandidateCount, 0);
  assert.equal(summary.ownerAdmissionGateOpen, false);
});

test("chimichurri is candidate-only and held on meal role plus contradictory time authority", () => {
  assert.equal(candidate.id, "unitools_chimichurri");
  assert.deepEqual(candidate.culinary.mealTypes, []);
  assert.equal(candidate.culinary.mealRoleState, "HOLD_NON_STANDALONE_SAUCE");
  assert.equal(candidate.culinary.difficulty, 1);
  assert.equal(candidate.time.totalMinutes, null);
  assert.equal(candidate.time.sourceDeclaredTotalMinutes, 15);
  assert.equal(candidate.time.sourceInstructionMinuteSum, 20);
  assert.equal(candidate.time.sourceInstructionContainsTwoHourStand, true);
  assert.deepEqual(candidate.governance.holdReasons, ["MEAL_ROLE_AUTHORITY_MISSING", "SOURCE_TIME_CONTRADICTION"]);
});

test("recommendation and planner acceptance passes by deterministic abstention", () => {
  for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
    const ranked = rankRecipes([candidate], permissive, { mealType });
    assert.equal(ranked.eligible.length, 0);
    assert.match(ranked.rejected[0].hardReasons.join(" | "), /external recipe lacks source-backed hard recommendation metadata/);
    const plan = planSlots([candidate], permissive, [{ id: "r3-" + mealType, order: 1, day: "R3", mealType }]);
    assert.equal(plan.complete, false);
    assert.equal(plan.items.length, 0);
    assert.equal(plan.shortfalls.length, 1);
  }
});

test("public runtime and nutrition authority remain unchanged", () => {
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 86);
  assert.equal(PUBLIC_RUNTIME_RECIPES.some(recipe => recipe.id === candidate.id), false);
  assert.equal(candidate.nutrition.estimationState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
  assert.ok(Object.values(candidate.nutrition.perServing).every(value => value === null));
  assert.deepEqual(candidate.dietaryTags, ["unrestricted", "vegetarian", "vegan"]);
  assert.deepEqual(candidate.allergySafety.declaredAllergens, []);
});

test("exact pinned R3 result is reproducible when source checkout is present", { skip: !existsSync(".tmp/unitools/unitools-recipes-v1.json") }, () => {
  const dataset = JSON.parse(readFileSync(".tmp/unitools/unitools-recipes-v1.json", "utf8"));
  assert.deepEqual(buildR3Summary({ contract, r2, dataset, candidateArtifact: artifact }), summary);
});
