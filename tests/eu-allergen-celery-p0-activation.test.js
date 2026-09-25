import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { INGREDIENTS } from "../src/data/ingredients.js";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { SUBSTITUTIONS } from "../src/data/substitutions.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { suggestSubstitutions } from "../src/domain/substitution.js";

const activation = JSON.parse(
  await readFile(new URL("../config/eu_allergen_celery_p0_activation.json", import.meta.url), "utf8")
);

test("celery P0 activation is exactly owner-authorized and bounded", () => {
  assert.equal(activation.id, "EU_ALLERGEN_CELERY_P0_ACTIVATION");
  assert.equal(activation.authorization.authorized, true);
  assert.equal(activation.authorization.scopeExact, true);
  assert.deepEqual(activation.implementation.newRuntimeAllergenTokens, ["celery"]);
  assert.deepEqual(activation.implementation.canonicalIngredientIdsChanged, ["celery"]);
  assert.deepEqual(activation.implementation.publicRecipeIdsChanged, ["med_pumpkin_white_bean_barley_stew"]);
  assert.deepEqual(activation.explicitlyDeferred, ["mustard", "lupin", "molluscs", "sulphur dioxide / sulphites"]);
  assert.equal(activation.hardBoundaries.protectedD1Reads, 0);
  assert.equal(activation.hardBoundaries.protectedD1Writes, 0);
  assert.equal(activation.hardBoundaries.protectedRecipeBodyAccess, 0);
  assert.equal(activation.hardBoundaries.knowledgeCoreWrites, 0);
  assert.equal(activation.hardBoundaries.barbecueMutations, 0);
  assert.equal(activation.hardBoundaries.paidInfrastructureOrApiChanges, 0);
  assert.equal(activation.hardBoundaries.broaderRecommendationOrRankingChanges, 0);
});

test("canonical celery is tagged and the known public recipe declares it", () => {
  assert.deepEqual(INGREDIENTS.celery.allergens, ["celery"]);
  const recipe = PUBLIC_RUNTIME_RECIPES.find(item => item.id === "med_pumpkin_white_bean_barley_stew");
  assert.ok(recipe);
  assert.ok(recipe.ingredients.some(item => item.canonicalIngredientId === "celery"));
  assert.ok(recipe.allergySafety.declaredAllergens.includes("celery"));
});

test("every public runtime recipe declares the allergen union implied by canonical ingredients", () => {
  const violations = [];
  for (const recipe of PUBLIC_RUNTIME_RECIPES) {
    const implied = new Set(
      recipe.ingredients.flatMap(item => INGREDIENTS[item.canonicalIngredientId]?.allergens || [])
    );
    const declared = new Set(recipe.allergySafety?.declaredAllergens || []);
    const missing = [...implied].filter(allergen => !declared.has(allergen)).sort();
    if (missing.length) violations.push({ recipeId: recipe.id, missing });
  }
  assert.deepEqual(violations, []);
});

test("celery is a hard pre-score rejection for the known celery recipe", () => {
  const recipe = PUBLIC_RUNTIME_RECIPES.find(item => item.id === "med_pumpkin_white_bean_barley_stew");
  const profile = normalizeProfile({
    ...DEFAULT_PROFILE,
    allergens: ["celery"],
    dietaryMode: "unrestricted",
    maxMinutes: 180,
    skill: 4
  });
  const ranked = rankRecipes([recipe], profile, { mealType: "dinner" });
  assert.equal(ranked.eligible.length, 0);
  assert.equal(ranked.rejected.length, 1);
  assert.equal(ranked.rejected[0].score, -Infinity);
  assert.ok(ranked.rejected[0].hardReasons.includes("declared allergen: celery"));
});

test("substitution filtering cannot reintroduce celery", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, allergens: ["celery"] });
  const probeId = "__eu_celery_p0_probe__";
  SUBSTITUTIONS[probeId] = [
    { ingredientId: "celery", type: "functional_substitute", note: "Safety regression probe only." }
  ];
  try {
    assert.deepEqual(suggestSubstitutions(probeId, profile), []);
  } finally {
    delete SUBSTITUTIONS[probeId];
  }
});

test("profile normalization preserves celery and future well-formed allergen tokens", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, allergens: ["celery", "future_token", "celery"] });
  assert.deepEqual(profile.allergens, ["celery", "future_token"]);
});
