import test from "node:test";
import assert from "node:assert/strict";
import {
  AFCD_COMPOSITION_DENSITIES_B50,
  AFCD_COMPOSITION_SOURCE_B50,
  afcdCompositionB50ForIngredient
} from "../src/data/afcd-composition-b50.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import { europeanPrimaryPolicyCoverage, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy-runtime.js";

test("B50 source is explicit static FSANZ AFCD Release 3 firm-tofu composition evidence", () => {
  assert.equal(AFCD_COMPOSITION_SOURCE_B50.id, "afcd-release-3-composition-b50");
  assert.equal(AFCD_COMPOSITION_SOURCE_B50.authority, "Food Standards Australia New Zealand (FSANZ)");
  assert.equal(AFCD_COMPOSITION_SOURCE_B50.evidenceTranche, "B50");
  assert.equal(AFCD_COMPOSITION_SOURCE_B50.runtimeFetch, false);
  assert.match(AFCD_COMPOSITION_SOURCE_B50.license, /Attribution-ShareAlike 3\.0 Australia/);
  assert.match(AFCD_COMPOSITION_SOURCE_B50.limitationStatement, /Australian data/);
});

test("B50 admits exactly AFCD food F009176 firm tofu as purchased", () => {
  assert.deepEqual(Object.keys(AFCD_COMPOSITION_DENSITIES_B50), ["tofu_firm"]);
  const record = afcdCompositionB50ForIngredient("tofu_firm");
  assert.equal(record.foodId, "F009176");
  assert.equal(record.foodName, "Tofu (soy bean curd), firm, as purchased");
  assert.equal(record.foodForm, "EXACT_FIRM_TOFU_AS_PURCHASED");
  assert.equal(record.derivation, "Analysed");
  assert.equal(record.matchConfidence, "high");
  assert.deepEqual(record.per100g, {
    energyKcal: 129.3,
    proteinG: 12.8,
    carbohydrateG: 0,
    fatG: 8.3,
    fibreG: 1
  });
  assert.equal(record.fieldEvidence.energyKcal.publishedValue, "543 kJ/100 g");
  assert.match(record.fieldEvidence.energyKcal.method, /543 \/ 4\.2/);
});

test("repository canonical firm-tofu identity has exactly six direct-mass as-purchased authored uses", () => {
  assert.equal(INGREDIENTS.tofu_firm.name, "firm tofu");
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "tofu_firm"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "tofu_firm")
    }))
    .sort((a, b) => a.recipeId.localeCompare(b.recipeId));
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.map(row => [row.recipeId, row.ingredient.quantity, row.ingredient.unit, row.ingredient.preparation]), [
    ["east_asian_tofu_edamame_rice", 300, "g", "cubed"],
    ["east_asian_tofu_miso_broccoli_rice", 300, "g", "cubed"],
    ["se_asian_mango_tofu_rice_noodle_salad", 280, "g", "cubed"],
    ["se_asian_peanut_tofu_noodles", 280, "g", "cubed"],
    ["se_asian_pineapple_tofu_jasmine_rice", 300, "g", "cubed"],
    ["se_asian_tofu_mango_rice_bowl", 300, "g", "cubed"]
  ]);
});

test("B50 exact firm-tofu evidence does not bleed into neighboring soy identities or tofu forms", () => {
  for (const unsupported of ["tofu", "tofu_silken", "tofu_soft", "smoked_tofu", "cooked_tofu", "tofu_skin", "tempeh", "miso"]) {
    assert.equal(afcdCompositionB50ForIngredient(unsupported), null, unsupported);
    assert.notEqual(selectEuropeanPrimaryNutrient(unsupported, "proteinG")?.sourceId, AFCD_COMPOSITION_SOURCE_B50.id, unsupported);
  }
});

test("runtime selects B50 AFCD provenance for all tracked firm-tofu nutrients", () => {
  const expectedCodes = {
    energyKcal: ["ENERGY_WITH_DIETARY_FIBRE"],
    proteinG: ["PROTEIN"],
    carbohydrateG: ["AVAILABLE_CARBOHYDRATE_WITHOUT_SUGAR_ALCOHOLS"],
    fatG: ["FAT_TOTAL"],
    fibreG: ["DIETARY_FIBRE"]
  };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("tofu_firm", nutrient);
    assert.equal(selection.source, "afcd", nutrient);
    assert.equal(selection.sourceId, AFCD_COMPOSITION_SOURCE_B50.id, nutrient);
    assert.equal(selection.sourceIdentifier, "F009176", nutrient);
    assert.equal(selection.evidenceTranche, "B50", nutrient);
    assert.deepEqual(selection.sourceCodes, expectedCodes[nutrient], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("tofu_firm", "energyKcal").semantic, "ENERGY_AFCD_KJ_CONVERTED");
  assert.equal(selectEuropeanPrimaryNutrient("tofu_firm", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_AFCD_WITHOUT_SUGAR_ALCOHOLS");
  const coverage = europeanPrimaryPolicyCoverage(["tofu_firm"]);
  assert.equal(coverage.afcdB50SelectedCount, 5);
  assert.equal(coverage.afcdSelectedCount, 5);
  assert.equal(coverage.mextSelectedCount, 0);
});

test("B50 composition authorizes no household portion, edible yield or cooked yield", () => {
  const record = afcdCompositionB50ForIngredient("tofu_firm");
  assert.equal(record.gramsPerUnit, undefined);
  assert.equal(record.units, undefined);
  assert.equal(record.edibleYield, undefined);
  assert.equal(record.cookedYield, undefined);
});

test("B50 clears exactly the six authored firm-tofu density blockers without forcing recipe authority", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const tofuRecipeIds = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "tofu_firm"))
    .map(recipe => recipe.id);
  assert.equal(tofuRecipeIds.length, 6);
  for (const recipeId of tofuRecipeIds) {
    const detail = audit.recipeDetails.find(row => row.recipeId === recipeId);
    assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "tofu_firm"), false, recipeId);
    assert.equal(detail.authoritative, false, `${recipeId} must remain fail-closed on independent evidence gaps`);
  }
});
