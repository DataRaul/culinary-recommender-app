import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B46,
  MATVARETABELLEN_COMPOSITION_SOURCE_B46,
  matvaretabellenCompositionB46ForIngredient
} from "../src/data/matvaretabellen-composition-b46.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import { europeanPrimaryPolicyCoverage, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy-runtime.js";

test("B46 source is explicit static Matvaretabellen exact butter composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B46.id, "matvaretabellen-2026-composition-b46");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B46.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B46.evidenceTranche, "B46");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B46.runtimeFetch, false);
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B46.license, /NLOD 2\.0/);
});

test("B46 admits exactly food 08.005 Butter", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B46), ["butter"]);
  const record = matvaretabellenCompositionB46ForIngredient("butter");
  assert.equal(record.foodId, "08.005");
  assert.equal(record.foodName, "Butter");
  assert.equal(record.foodEx2, "Butter (A039C)");
  assert.equal(record.matchConfidence, "medium");
  assert.deepEqual(record.per100g, {
    energyKcal: 744,
    proteinG: 1,
    carbohydrateG: 0.5,
    fatG: 82,
    fibreG: 0
  });
});

test("repository-native butter identity has exactly one gram-denominated authored use", () => {
  assert.equal(INGREDIENTS.butter.name, "butter");
  assert.ok(INGREDIENTS.butter.aliases.includes("mantequilla"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "butter"))
    .map(recipe => ({ recipeId: recipe.id, ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "butter") }));
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].recipeId, rows[0].ingredient.quantity, rows[0].ingredient.unit], ["italian_mushroom_risotto", 15, "g"]);
});

test("B46 does not bleed into neighboring dairy-fat identities", () => {
  for (const unsupported of ["margarine", "ghee", "clarified_butter", "butter_blend", "cream", "olive_oil"]) {
    assert.equal(matvaretabellenCompositionB46ForIngredient(unsupported), null, unsupported);
    assert.notEqual(selectEuropeanPrimaryNutrient(unsupported, "proteinG")?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B46.id, unsupported);
  }
});

test("European-primary runtime selects exact B46 provenance for all tracked nutrients", () => {
  const expectedCodes = { energyKcal: [], proteinG: ["114a"], carbohydrateG: ["MI0181"], fatG: ["114a"], fibreG: ["50"] };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("butter", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B46.id, nutrient);
    assert.equal(selection.sourceIdentifier, "08.005", nutrient);
    assert.equal(selection.evidenceTranche, "B46", nutrient);
    assert.deepEqual(selection.sourceCodes, expectedCodes[nutrient], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("butter", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["butter"]);
  assert.equal(coverage.matvaretabellenB46SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B46 composition does not authorize household portion or cooking yield", () => {
  const record = matvaretabellenCompositionB46ForIngredient("butter");
  assert.equal(record.gramsPerUnit, undefined);
  assert.equal(record.units, undefined);
  assert.equal(record.cookedYield, undefined);
});

test("B46 clears the butter density blocker while the independent black-pepper quantity gate remains", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const detail = audit.recipeDetails.find(row => row.recipeId === "italian_mushroom_risotto");
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "butter"), false);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "black_pepper"), true);
  assert.equal(detail.authoritative, false);
});
