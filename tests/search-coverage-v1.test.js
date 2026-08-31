import test from "node:test";
import assert from "node:assert/strict";
import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { SEARCH_COVERAGE_RECIPES } from "../src/data/recipes-v1-search.js";
import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import { buildCorpusCoverage, ingredientSearchCoverage } from "../src/domain/corpus-coverage.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";

test("search-coverage expansion adds structured authored recipes without duplicate IDs", () => {
  assert.equal(SEARCH_COVERAGE_RECIPES.length, 15);
  assert.ok(ALL_RECIPES.length >= 65, `expected at least 65 recipes after coverage expansion, found ${ALL_RECIPES.length}`);
  const ids = ALL_RECIPES.map(recipe => recipe.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const recipe of SEARCH_COVERAGE_RECIPES) {
    assert.equal(recipe.provenance.sourceReference, "data/project-authored-v1-search-coverage");
    assert.ok(recipe.ingredients.length >= 6, `${recipe.id}: too few structured ingredients`);
    assert.ok(recipe.instructions.length >= 3, `${recipe.id}: too few structured instructions`);
    for (const ingredient of recipe.ingredients) {
      assert.ok(INGREDIENTS[ingredient.canonicalIngredientId], `${recipe.id}: missing ontology ingredient ${ingredient.canonicalIngredientId}`);
    }
  }
});

test("pineapple promotion preserves English/Spanish normalization and gives fridge Search real coverage", () => {
  assert.equal(normalizeIngredient("pineapple"), "pineapple");
  assert.equal(normalizeIngredient("Piña"), "pineapple");
  assert.equal(normalizeIngredient("PINA"), "pineapple");
  const coverage = ingredientSearchCoverage(ALL_RECIPES, ["pineapple"]);
  assert.equal(coverage.pineapple.recipeCount, 2);
  assert.deepEqual(coverage.pineapple.recipeIds, [
    "latin_pineapple_black_bean_rice",
    "se_asian_pineapple_tofu_jasmine_rice"
  ]);

  const result = searchRecipesByIngredients(ALL_RECIPES, normalizeProfile({ ...DEFAULT_PROFILE, skill: 4, maxMinutes: 90 }), {
    mainIngredientId: "pineapple",
    followProfilePreferences: false,
    skill: 4,
    maxMinutes: 90
  });
  assert.equal(result.catalogMatchCount, 2);
  assert.equal(result.eligible.length, 2);
});

test("a previously future-only pineapple exclusion remains hard after pineapple recipes arrive", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, skill: 4, maxMinutes: 90, excludedIngredientIds: ["pineapple"] });
  assert.deepEqual(profile.excludedIngredientIds, ["pineapple"]);

  const ranked = rankRecipes(ALL_RECIPES, profile, { mealType: "dinner" });
  const pineappleIds = new Set(["latin_pineapple_black_bean_rice", "se_asian_pineapple_tofu_jasmine_rice"]);
  assert.ok(ranked.eligible.every(item => !pineappleIds.has(item.recipe.id)));
  for (const recipeId of pineappleIds) {
    const rejected = ranked.rejected.find(item => item.recipe.id === recipeId);
    assert.ok(rejected, `${recipeId} should be rejected`);
    assert.ok(rejected.hardReasons.some(reason => reason.includes("contains excluded ingredient: pineapple")));
  }

  const search = searchRecipesByIngredients(ALL_RECIPES, profile, {
    mainIngredientId: "pineapple",
    followProfilePreferences: false,
    skill: 4,
    maxMinutes: 90
  });
  assert.equal(search.catalogMatchCount, 2);
  assert.equal(search.eligible.length, 0);
  assert.equal(search.blocked.length, 2);
  assert.ok(search.shortfall.some(item => item.reason.includes("contains excluded ingredient: pineapple")));
});

test("coverage audit is deterministic and shows intentional breadth across underused search ingredients", () => {
  const targetIngredients = [
    "pineapple", "pinto_beans", "barley", "pumpkin", "rice_noodles", "mango",
    "mushroom", "peas", "basmati_rice", "bulgur", "turkey_mince", "hake"
  ];
  const searchCoverage = ingredientSearchCoverage(ALL_RECIPES, targetIngredients);
  for (const ingredientId of targetIngredients) {
    assert.ok(searchCoverage[ingredientId].recipeCount >= 1, `${ingredientId} lacks recipe/search coverage`);
  }
  assert.ok(searchCoverage.mushroom.recipeCount >= 2);
  assert.ok(searchCoverage.peas.recipeCount >= 2);
  assert.ok(searchCoverage.pinto_beans.recipeCount >= 1);
  assert.ok(searchCoverage.barley.recipeCount >= 1);

  const ingredientIds = Object.keys(INGREDIENTS);
  const first = buildCorpusCoverage(ALL_RECIPES, ingredientIds);
  const second = buildCorpusCoverage(ALL_RECIPES, ingredientIds);
  assert.deepEqual(first, second);
  assert.equal(first.recipeCount, ALL_RECIPES.length);
  // Some canonical entries intentionally exist only for substitutions, pantry and
  // future growth, so this is a broad health check rather than a 100% target.
  assert.ok(first.ingredientCoverageRatio > 0.6, `ingredient coverage ratio unexpectedly low: ${first.ingredientCoverageRatio}`);
  assert.ok(first.highProteinCount > 0);
  assert.ok(first.veganCount > 0);
  assert.ok(first.strongMealPrepCount > 0);
  for (const cuisine of ["Mediterranean","Italian","Spanish","Indian","Southeast Asian","East Asian","Middle Eastern","Latin American","Canarian"]) {
    assert.ok(first.cuisineCounts[cuisine] >= 2, `${cuisine} coverage unexpectedly thin`);
  }
});
