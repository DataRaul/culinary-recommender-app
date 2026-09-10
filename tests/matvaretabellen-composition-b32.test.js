import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B32,
  MATVARETABELLEN_COMPOSITION_SOURCE_B32,
  matvaretabellenCompositionB32ForIngredient
} from "../src/data/matvaretabellen-composition-b32.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B32 source is explicit static Matvaretabellen reviewed black-pepper composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B32.id, "matvaretabellen-2026-composition-b32");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B32.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B32.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B32.evidenceTranche, "B32");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B32.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B32.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B32.license, /NLOD 2\.0/);
});

test("B32 admits exactly official food 12.111 black pepper", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B32), ["black_pepper"]);
  const pepper = matvaretabellenCompositionB32ForIngredient("black_pepper");
  assert.equal(pepper.foodId, "12.111");
  assert.equal(pepper.foodName, "Pepper, black");
  assert.equal(pepper.scientificName, "Piper nigrum L.");
  assert.equal(pepper.foodEx2, "Black pepper (A019C)");
  assert.equal(pepper.matchConfidence, "high");
  assert.deepEqual(pepper.per100g, {
    energyKcal: 277,
    proteinG: 10.4,
    carbohydrateG: 38.7,
    fatG: 3.3,
    fibreG: 25
  });
  assert.equal(pepper.fieldEvidence.proteinG.sourceCode, "460e");
  assert.equal(pepper.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(pepper.fieldEvidence.fatG.sourceCode, "460e");
  assert.equal(pepper.fieldEvidence.fibreG.sourceCode, "460e");
});

test("black-pepper ontology no longer aliases distinct white pepper", () => {
  assert.equal(INGREDIENTS.black_pepper.name, "black pepper");
  assert.equal(INGREDIENTS.black_pepper.aliases.includes("white pepper"), false);
  assert.equal(normalizeIngredient("black pepper"), "black_pepper");
  assert.equal(normalizeIngredient("peppercorns"), "black_pepper");
  assert.equal(normalizeIngredient("white pepper"), null);
});

test("B32 black-pepper identity does not bleed into neighboring pepper products", () => {
  for (const unsupported of ["white_pepper", "green_peppercorn", "pink_peppercorn", "chilli", "smoked_paprika"]) {
    assert.equal(matvaretabellenCompositionB32ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B32.id, unsupported);
  }
});

test("runtime European-primary policy selects B32 provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["460e"],
    carbohydrateG: ["MI0181"],
    fatG: ["460e"],
    fibreG: ["460e"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("black_pepper", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B32.id, nutrient);
    assert.equal(selection.sourceIdentifier, "12.111", nutrient);
    assert.equal(selection.evidenceTranche, "B32", nutrient);
    assert.equal(selection.formConfidence, "high", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("black_pepper", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["black_pepper"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB32SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B32 composition evidence does not authorize teaspoon mass or another quantity conversion", () => {
  const pepper = matvaretabellenCompositionB32ForIngredient("black_pepper");
  assert.equal(pepper.gramsPerUnit, undefined);
  assert.equal(pepper.units, undefined);
  assert.equal(pepper.sourcePortionId, undefined);
  assert.equal(pepper.ediblePartPercent, undefined);
  assert.equal(pepper.cookedYieldFactor, undefined);
});

test("B32 moves the two authored black-pepper uses from missing-density to unsupported teaspoon quantity", () => {
  const uses = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "black_pepper"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "black_pepper")
    }));
  assert.equal(uses.length, 2);
  assert.ok(uses.every(use => use.ingredient.unit === "tsp"));

  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  for (const use of uses) {
    const detail = audit.recipeDetails.find(row => row.recipeId === use.recipeId);
    const pepperBlockers = detail.blockers.filter(blocker => blocker.ingredientId === "black_pepper");
    assert.deepEqual(pepperBlockers, [{ ingredientId: "black_pepper", reason: "unsupported_quantity_unit" }], use.recipeId);
    assert.equal(detail.authoritative, false, use.recipeId);
  }
});
