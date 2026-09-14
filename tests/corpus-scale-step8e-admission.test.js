import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8E_CANONICAL_RECIPE_ID,
  STEP8E_DISH_FAMILY_ID,
  buildStep8ERuntimeCandidate
} from "../scripts/corpus-scale-step8e-admission.mjs";

const contract = {
  source: {
    sourceCohortId: "unitools-world-recipes-v1_1_0",
    repository: "farcrak/unitools-recipes",
    commit: "1d09e9548d957dd0375301146a86dddf5e269c1b",
    dataPath: "unitools-recipes-v1.json",
    dataBlobSha: "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed",
    datasetVersion: "1.1.0",
    licenseId: "CC-BY-SA-4.0",
    attributionText: "UniTools — theunitools.com"
  }
};

const tortilla = {
  slug: "tortilla-espanola",
  name: { en: "Spanish tortilla" },
  nativeName: "Tortilla española",
  country: "ES",
  category: "main",
  difficulty: "medium",
  baseServings: 4,
  prepMinutes: 20,
  cookMinutes: 30,
  ingredients: [
    { id: "potato", name: { en: "Potatoes" }, quantity: 600, unit: "g", note: null },
    { id: "onion", name: { en: "Onion" }, quantity: 1, unit: "piece", note: null },
    { id: "eggs", name: { en: "Eggs" }, quantity: 6, unit: "piece", note: null },
    { id: "oil", name: { en: "Olive oil" }, quantity: 400, unit: "ml", note: null },
    { id: "salt", name: { en: "Salt" }, quantity: null, unit: "toTaste", note: null }
  ],
  steps: [{ text: { en: "Cook the reviewed source recipe." } }],
  diets: ["source-metadata-not-authority"],
  nutritionPerServing: { energyKcal: 999 },
  url: "https://example.invalid/tortilla"
};

test("Step 8E prepares exactly the reviewed Spanish-tortilla family variant", () => {
  const recipe = buildStep8ERuntimeCandidate(tortilla, contract);
  assert.equal(recipe.id, STEP8E_CANONICAL_RECIPE_ID);
  assert.equal(recipe.corpusMetadata.dishFamilyId, STEP8E_DISH_FAMILY_ID);
  assert.equal(recipe.culinary.cuisine, "Spanish");
  assert.deepEqual(recipe.culinary.mealTypes, ["lunch", "dinner"]);
  assert.equal(recipe.time.totalMinutes, 50);
  assert.equal(recipe.serving.servings, 4);
  assert.deepEqual(recipe.ingredients.map(item => item.canonicalIngredientId), ["potato", "onion", "eggs", "olive_oil", "salt"]);
});

test("Step 8E hard metadata is project-reviewed and source diet/nutrition/scaling never becomes authority", () => {
  const recipe = buildStep8ERuntimeCandidate(tortilla, contract);
  assert.deepEqual(recipe.dietaryTags, ["vegetarian"]);
  assert.deepEqual(recipe.allergySafety.declaredAllergens, ["egg"]);
  assert.equal(recipe.nutrition.estimationState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
  assert.equal(recipe.nutrition.perServing.energyKcal, null);
  assert.equal(recipe.governance.sourceNutritionIgnoredForAuthority, true);
  assert.equal(recipe.governance.sourceDietaryMetadataIgnoredForAuthority, true);
  assert.equal(recipe.governance.sourceScalingMetadataIgnoredForAuthority, true);
});

test("Step 8E candidate is recommendation-eligible evidence but is not public-runtime activated", () => {
  const recipe = buildStep8ERuntimeCandidate(tortilla, contract);
  assert.equal(recipe.governance.recommendationState, "ELIGIBLE");
  assert.equal(recipe.governance.runtimeActivationAuthorized, false);
  assert.equal(recipe.provenance.license, "CC-BY-SA-4.0");
  assert.equal(recipe.provenance.modifiedFromSource, true);
});

test("Step 8E rejects a candidate when the reviewed allergen derivation or ingredient identity changes", () => {
  const mutated = structuredClone(tortilla);
  mutated.ingredients[2] = { id: "milk", name: { en: "Milk" }, quantity: 100, unit: "ml", note: null };
  assert.throws(() => buildStep8ERuntimeCandidate(mutated, contract), /allergen derivation changed/);
});
