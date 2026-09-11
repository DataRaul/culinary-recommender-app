import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B47,
  MATVARETABELLEN_COMPOSITION_SOURCE_B47,
  matvaretabellenCompositionB47ForIngredient
} from "../src/data/matvaretabellen-composition-b47.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import { europeanPrimaryPolicyCoverage, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy-runtime.js";

test("B47 source is explicit static Matvaretabellen exact tempeh composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B47.id, "matvaretabellen-2026-composition-b47");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B47.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B47.evidenceTranche, "B47");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B47.runtimeFetch, false);
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B47.license, /NLOD 2\.0/);
});

test("B47 admits exactly food 06.685 Tempeh soy bean product", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B47), ["tempeh"]);
  const record = matvaretabellenCompositionB47ForIngredient("tempeh");
  assert.equal(record.foodId, "06.685");
  assert.equal(record.foodName, "Tempeh soy bean product");
  assert.equal(record.foodEx2, "Fermented soyabean-based meat imitates (A16RC)");
  assert.equal(record.matchConfidence, "high");
  assert.deepEqual(record.per100g, {
    energyKcal: 209,
    proteinG: 20.3,
    carbohydrateG: 5.5,
    fatG: 10.8,
    fibreG: 4
  });
});

test("repository-native tempeh identity has exactly one unqualified gram-denominated authored use", () => {
  assert.equal(INGREDIENTS.tempeh.name, "tempeh");
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "tempeh"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "tempeh")
    }));
  assert.equal(rows.length, 1);
  assert.deepEqual(
    [rows[0].recipeId, rows[0].ingredient.quantity, rows[0].ingredient.unit, rows[0].ingredient.preparation],
    ["indian_tempeh_coconut_curry", 280, "g", null]
  );
});

test("B47 exact tempeh evidence does not bleed into neighboring soy identities or qualified tempeh forms", () => {
  for (const unsupported of ["tofu_firm", "tofu", "soy_protein", "smoked_tempeh", "cooked_tempeh", "miso"]) {
    assert.equal(matvaretabellenCompositionB47ForIngredient(unsupported), null, unsupported);
    assert.notEqual(selectEuropeanPrimaryNutrient(unsupported, "proteinG")?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B47.id, unsupported);
  }
});

test("European-primary runtime selects exact B47 provenance for all tracked nutrients", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["460h"],
    carbohydrateG: ["MI0181"],
    fatG: ["460h"],
    fibreG: ["450d"]
  };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("tempeh", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B47.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.685", nutrient);
    assert.equal(selection.evidenceTranche, "B47", nutrient);
    assert.deepEqual(selection.sourceCodes, expectedCodes[nutrient], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("tempeh", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["tempeh"]);
  assert.equal(coverage.matvaretabellenB47SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B47 composition does not authorize household portion or cooked yield", () => {
  const record = matvaretabellenCompositionB47ForIngredient("tempeh");
  assert.equal(record.gramsPerUnit, undefined);
  assert.equal(record.units, undefined);
  assert.equal(record.cookedYield, undefined);
});

test("B47 clears the tempeh density blocker while independent coconut-milk evidence remains unresolved", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const detail = audit.recipeDetails.find(row => row.recipeId === "indian_tempeh_coconut_curry");
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "tempeh"), false);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "coconut_milk"), true);
  assert.equal(detail.authoritative, false);
});
