import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { evaluateRecipe } from "../src/domain/recommendation.js";
import { summarizePublicReadiness } from "../scripts/recommendation-readiness-core.mjs";

const activation = JSON.parse(readFileSync(new URL("../data/generated/culinary-brain-p3-tapioca-bounded-activation-summary-v1.json", import.meta.url), "utf8"));

test("current readiness guard reconciles the authorized 86-recipe runtime without rewriting frozen V1 evidence", () => {
  assert.equal(activation.terminal, "CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_PASS__P4_READY");
  assert.equal(activation.candidateId, "unitools_pao_de_queijo");
  assert.equal(activation.publicRuntimeRecipeCountBefore, 85);
  assert.equal(activation.publicRuntimeRecipeCountAfter, 86);

  const profile = normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    nutritionPriority: 1,
    proteinEmphasis: 1,
    priorityPacks: [],
    dietaryMode: "unrestricted",
    allergens: [],
    excludedIngredientIds: [],
    unavailableIngredientIds: []
  });
  const evaluations = new Map(PUBLIC_RUNTIME_RECIPES.map(recipe => [
    recipe.id,
    evaluateRecipe(recipe, profile, {})
  ]));
  const current = summarizePublicReadiness(PUBLIC_RUNTIME_RECIPES, evaluations);

  assert.equal(current.recipeCount, 86);
  assert.equal(current.recommendationEligibleStateCount, 78);
  assert.equal(current.evaluatorEligibleCount, 78);
  assert.equal(current.hardMetadataReadyRecommendationEligibleCount, 78);
  assert.equal(current.unknownNutritionRecommendationEligibleCount, 2);
  assert.equal(current.unknownNutritionSafeCount, 2);
  assert.equal(current.unknownNutritionZeroCoercionCount, 0);
  assert.deepEqual(current.unknownNutritionRecommendationEligibleIds, [
    "unitools_pao_de_queijo",
    "unitools_tortilla_espanola"
  ]);
});
