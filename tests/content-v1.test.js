import test from "node:test";
import assert from "node:assert/strict";
import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import { SUBSTITUTIONS } from "../src/data/substitutions.js";
import { ingredientMatchesPermanentExclusion, resolvePermanentExclusion } from "../src/domain/exclusions.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { suggestSubstitutions } from "../src/domain/substitution.js";

test("V1 corpus materially expands authored recipe coverage without duplicate IDs", () => {
  assert.ok(ALL_RECIPES.length >= 50, `expected at least 50 recipes, found ${ALL_RECIPES.length}`);
  const ids = ALL_RECIPES.map(recipe => recipe.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("spanish_potato_onion_tortilla"));
  assert.ok(ids.includes("east_asian_miso_salmon_rice"));
  assert.ok(ids.includes("middle_eastern_mujaddara"));
  assert.ok(ids.includes("latin_quinoa_corn_black_bean_salad"));
});

test("every V1 recipe ingredient resolves through the canonical ontology", () => {
  for (const recipe of ALL_RECIPES) {
    for (const ingredient of recipe.ingredients) {
      assert.ok(INGREDIENTS[ingredient.canonicalIngredientId], `${recipe.id}: missing ${ingredient.canonicalIngredientId}`);
    }
  }
});

test("expanded English and Spanish aliases normalize deterministically", () => {
  assert.equal(normalizeIngredient("arroz basmati"), "basmati_rice");
  assert.equal(normalizeIngredient("Fideos de arroz"), "rice_noodles");
  assert.equal(normalizeIngredient("MERLUZA"), "hake");
  assert.equal(normalizeIngredient("champiñones"), "mushroom");
  assert.equal(normalizeIngredient("crema de coco"), "coconut_cream");
});

test("family exclusions generalize across encoded ingredient forms", () => {
  assert.equal(resolvePermanentExclusion("rice").familyWide, true);
  assert.equal(ingredientMatchesPermanentExclusion("brown_rice", "rice"), true);
  assert.equal(ingredientMatchesPermanentExclusion("basmati_rice", "rice"), true);
  assert.equal(ingredientMatchesPermanentExclusion("rice_noodles", "rice"), true);
  assert.equal(ingredientMatchesPermanentExclusion("coconut_milk", "coconut"), true);
  assert.equal(ingredientMatchesPermanentExclusion("coconut_cream", "coconut"), true);
  assert.equal(ingredientMatchesPermanentExclusion("desiccated_coconut", "coconut"), true);
  assert.equal(resolvePermanentExclusion("seafood").familyWide, true);
  assert.equal(ingredientMatchesPermanentExclusion("salmon", "seafood"), true);
  assert.equal(ingredientMatchesPermanentExclusion("prawns", "seafood"), true);
  assert.equal(resolvePermanentExclusion("tree nut").id, "tree_nut");
  assert.equal(ingredientMatchesPermanentExclusion("almonds", "tree_nut"), true);
  assert.equal(ingredientMatchesPermanentExclusion("cashews", "tree_nut"), true);
});

test("substitution graph references only known ingredients and exposes quality classes", () => {
  const types = new Set();
  for (const [sourceId, options] of Object.entries(SUBSTITUTIONS)) {
    assert.ok(INGREDIENTS[sourceId], `unknown substitution source ${sourceId}`);
    for (const option of options) {
      assert.ok(INGREDIENTS[option.ingredientId], `${sourceId}: unknown target ${option.ingredientId}`);
      assert.ok(option.note?.length > 10);
      types.add(option.type);
    }
  }
  for (const type of ["close_substitute","functional_substitute","flavour_direction","texture_substitute","dietary_substitute","emergency_approximation"]) {
    assert.ok(types.has(type), `missing substitution quality class ${type}`);
  }
});

test("allergen and permanent-exclusion safety still overrides substitutions", () => {
  const milkAllergy = normalizeProfile({ ...DEFAULT_PROFILE, allergens: ["milk"], excludedIngredientIds: [] });
  const coconutOptions = suggestSubstitutions("coconut_milk", milkAllergy);
  assert.ok(coconutOptions.every(option => !option.ingredient.allergens.includes("milk")));

  const coconutExcluded = normalizeProfile({ ...DEFAULT_PROFILE, excludedIngredientIds: ["coconut"] });
  const coconutExcludedOptions = suggestSubstitutions("coconut_milk", coconutExcluded);
  assert.ok(coconutExcludedOptions.every(option => !ingredientMatchesPermanentExclusion(option.ingredientId, "coconut")));
});

test("full-corpus ranking remains stable and hard constraints still fail closed", () => {
  const profile = normalizeProfile({
    ...DEFAULT_PROFILE,
    skill: 2,
    maxMinutes: 35,
    dietaryMode: "vegetarian",
    allergens: ["peanut"],
    excludedIngredientIds: ["coconut"],
    cuisinePreferences: ["Indian", "Mediterranean"]
  });
  const first = rankRecipes(ALL_RECIPES, profile, { mealType: "dinner" });
  const second = rankRecipes(ALL_RECIPES, profile, { mealType: "dinner" });
  assert.deepEqual(first.eligible.map(item => item.recipe.id), second.eligible.map(item => item.recipe.id));
  for (const item of first.eligible) {
    assert.ok(item.recipe.culinary.difficulty <= 2);
    assert.ok(item.recipe.time.totalMinutes <= 35);
    assert.ok(item.recipe.dietaryTags.includes("vegetarian"));
    assert.ok(item.recipe.ingredients.every(ingredient => !ingredientMatchesPermanentExclusion(ingredient.canonicalIngredientId, "coconut")));
    assert.ok(!item.recipe.allergySafety.declaredAllergens.includes("peanut"));
  }
});
