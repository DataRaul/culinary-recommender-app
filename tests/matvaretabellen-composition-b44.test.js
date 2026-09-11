import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B44,
  MATVARETABELLEN_COMPOSITION_SOURCE_B44,
  matvaretabellenCompositionB44ForIngredient
} from "../src/data/matvaretabellen-composition-b44.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B44 source is explicit static Matvaretabellen standalone plain dried-pasta composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B44.id, "matvaretabellen-2026-composition-b44");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B44.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B44.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B44.evidenceTranche, "B44");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B44.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B44.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B44.license, /NLOD 2\.0/);
});

test("B44 admits exactly official food 05.016 Pasta, plain, uncooked", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B44), ["pasta"]);
  const pasta = matvaretabellenCompositionB44ForIngredient("pasta");
  assert.equal(pasta.foodId, "05.016");
  assert.equal(pasta.foodName, "Pasta, plain, uncooked");
  assert.equal(pasta.foodEx2, "Dried pasta (A007L)");
  assert.equal(pasta.foodForm, "EXACT_PLAIN_DRIED_UNCOOKED_DURUM_WHEAT_PASTA");
  assert.equal(pasta.matchConfidence, "high");
  assert.deepEqual(pasta.per100g, {
    energyKcal: 347,
    proteinG: 11.9,
    carbohydrateG: 69.8,
    fatG: 1.3,
    fibreG: 4
  });
});

test("repository-native pasta semantics establish an uncooked gram input before cooking", () => {
  assert.equal(INGREDIENTS.pasta.name, "pasta");
  assert.ok(INGREDIENTS.pasta.aliases.includes("spaghetti"));
  assert.ok(INGREDIENTS.pasta.aliases.includes("penne"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "pasta"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "pasta"),
      instructions: recipe.instructions.map(step => step.text)
    }));
  assert.equal(rows.length, 1);
  assert.deepEqual(
    [rows[0].recipeId, rows[0].ingredient.quantity, rows[0].ingredient.unit, rows[0].ingredient.preparation],
    ["italian_ricotta_spinach_pasta", 170, "g", null]
  );
  assert.match(rows[0].instructions.join(" "), /Cook pasta/i);
});

test("B44 does not bleed into fresh, wholegrain, filled, gluten-free or cooked pasta identities", () => {
  for (const unsupported of ["fresh_pasta", "wholewheat_pasta", "ravioli", "gluten_free_pasta", "cooked_pasta", "orzo", "noodles"]) {
    assert.equal(matvaretabellenCompositionB44ForIngredient(unsupported), null, unsupported);
    assert.notEqual(selectEuropeanPrimaryNutrient(unsupported, "proteinG")?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B44.id, unsupported);
  }
});

test("European-primary runtime selects exact B44 pasta provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["204"],
    carbohydrateG: ["MI0181"],
    fatG: ["204"],
    fibreG: ["204"]
  };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("pasta", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B44.id, nutrient);
    assert.equal(selection.sourceIdentifier, "05.016", nutrient);
    assert.equal(selection.evidenceTranche, "B44", nutrient);
    assert.deepEqual(selection.sourceCodes, expectedCodes[nutrient], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("pasta", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["pasta"]);
  assert.equal(coverage.matvaretabellenB44SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B44 composition does not authorize cooking yield or household portion", () => {
  const pasta = matvaretabellenCompositionB44ForIngredient("pasta");
  assert.equal(pasta.gramsPerUnit, undefined);
  assert.equal(pasta.units, undefined);
  assert.equal(pasta.cookedYield, undefined);
});

test("B44 clears only the authored pasta density blocker while independent gates remain fail-closed", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const detail = audit.recipeDetails.find(row => row.recipeId === "italian_ricotta_spinach_pasta");
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "pasta"), false);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "black_pepper"), true);
  assert.equal(detail.authoritative, false);
});
