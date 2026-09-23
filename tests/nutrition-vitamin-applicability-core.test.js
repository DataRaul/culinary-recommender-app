import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanIngredientIdentityCandidate,
  exactIdentityAudit,
  prepareUnitoolsNutritionCandidate,
  detectTrackedNutrientKeys,
  classifyVitaminMineralCapability
} from "../scripts/nutrition-vitamin-applicability-core.mjs";

test("ingredient cleaning removes explicit amount/unit but does not fuzzy-map qualifiers", () => {
  assert.equal(cleanIngredientIdentityCandidate("- 200 g potatoes"), "potatoes");
  assert.equal(cleanIngredientIdentityCandidate("- 1 onion, chopped"), "onion");
  assert.equal(cleanIngredientIdentityCandidate("- 1 large onion"), "large onion");
});

test("exact identity audit uses only existing canonical aliases", () => {
  const audit = exactIdentityAudit(["potatoes", "onion", "mystery root"]);
  assert.equal(audit.occurrenceCount, 3);
  assert.equal(audit.resolvedOccurrenceCount, 2);
  assert.equal(audit.unresolvedOccurrenceCount, 1);
  assert.equal(audit.allResolved, false);
});

test("unitools nutrition candidate requires exact identities quantities units and servings", () => {
  const ready = prepareUnitoolsNutritionCandidate({
    slug: "x",
    baseServings: 2,
    ingredients: [
      { name: { en: "potatoes" }, quantity: 400, unit: "g" },
      { name: { en: "onion" }, quantity: 1, unit: "piece" }
    ]
  });
  assert.equal(ready.ready, true);
  assert.equal(ready.recipe.ingredients.length, 2);

  const blocked = prepareUnitoolsNutritionCandidate({
    slug: "y",
    baseServings: 2,
    ingredients: [{ name: { en: "mystery root" }, quantity: 1, unit: "piece" }]
  });
  assert.equal(blocked.ready, false);
  assert.equal(blocked.blockers[0].reason, "IDENTITY_UNRESOLVED");
});

test("tracked nutrient declaration separates current macros from vitamins/minerals", () => {
  const keys = detectTrackedNutrientKeys('const nutrientKeys = ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"];');
  assert.deepEqual(keys, ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"]);
  const capability = classifyVitaminMineralCapability(keys);
  assert.equal(capability.vitaminMineralSchemaReady, false);
  assert.equal(capability.state, "SCHEMA_NOT_IMPLEMENTED");
});
