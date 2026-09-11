import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B45,
  MATVARETABELLEN_COMPOSITION_SOURCE_B45,
  matvaretabellenCompositionB45ForIngredient
} from "../src/data/matvaretabellen-composition-b45.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import { europeanPrimaryPolicyCoverage, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy-runtime.js";

test("B45 source is explicit static Matvaretabellen exact risotto-rice composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B45.id, "matvaretabellen-2026-composition-b45");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B45.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B45.evidenceTranche, "B45");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B45.runtimeFetch, false);
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B45.license, /NLOD 2\.0/);
});

test("B45 admits exactly food 05.384 Rice, arborio, risotto rice, uncooked", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B45), ["risotto_rice"]);
  const record = matvaretabellenCompositionB45ForIngredient("risotto_rice");
  assert.equal(record.foodId, "05.384");
  assert.equal(record.foodName, "Rice, arborio, risotto rice, uncooked");
  assert.equal(record.scientificName, "Oryza sativa L.");
  assert.equal(record.matchConfidence, "high");
  assert.deepEqual(record.per100g, {
    energyKcal: 378,
    proteinG: 6.4,
    carbohydrateG: 85.1,
    fatG: 1,
    fibreG: 1
  });
});

test("repository-native risotto-rice identity and recipe state match the source", () => {
  assert.equal(INGREDIENTS.risotto_rice.name, "risotto rice");
  assert.ok(INGREDIENTS.risotto_rice.aliases.includes("arborio rice"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "risotto_rice"))
    .map(recipe => ({ recipeId: recipe.id, ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "risotto_rice"), instructions: recipe.instructions.map(step => step.text) }));
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].recipeId, rows[0].ingredient.quantity, rows[0].ingredient.unit], ["italian_mushroom_risotto", 170, "g"]);
  assert.match(rows[0].instructions.join(" "), /add rice/i);
  assert.match(rows[0].instructions.join(" "), /Add hot water in small additions/i);
});

test("B45 does not bleed into neighboring rice identities or cooked state", () => {
  for (const unsupported of ["rice", "jasmine_rice", "basmati_rice", "sushi_rice", "cooked_risotto_rice"]) {
    assert.equal(matvaretabellenCompositionB45ForIngredient(unsupported), null, unsupported);
    assert.notEqual(selectEuropeanPrimaryNutrient(unsupported, "proteinG")?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B45.id, unsupported);
  }
});

test("European-primary runtime selects exact B45 provenance for all tracked nutrients", () => {
  const expectedCodes = { energyKcal: [], proteinG: ["450c"], carbohydrateG: ["MI0181"], fatG: ["450c"], fibreG: ["450c"] };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("risotto_rice", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B45.id, nutrient);
    assert.equal(selection.sourceIdentifier, "05.384", nutrient);
    assert.equal(selection.evidenceTranche, "B45", nutrient);
    assert.deepEqual(selection.sourceCodes, expectedCodes[nutrient], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("risotto_rice", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["risotto_rice"]);
  assert.equal(coverage.matvaretabellenB45SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B45 composition does not authorize cooking yield or household portion", () => {
  const record = matvaretabellenCompositionB45ForIngredient("risotto_rice");
  assert.equal(record.gramsPerUnit, undefined);
  assert.equal(record.units, undefined);
  assert.equal(record.cookedYield, undefined);
});

test("B45 clears the risotto-rice density blocker while independent blockers remain", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const detail = audit.recipeDetails.find(row => row.recipeId === "italian_mushroom_risotto");
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "risotto_rice"), false);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "butter"), true);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "black_pepper"), true);
  assert.equal(detail.authoritative, false);
});
