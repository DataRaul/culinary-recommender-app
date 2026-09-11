import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B36,
  MATVARETABELLEN_COMPOSITION_SOURCE_B36,
  matvaretabellenCompositionB36ForIngredient
} from "../src/data/matvaretabellen-composition-b36.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import {
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";
import { selectEuropeanPrimaryNutrient as selectBaseEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B36 source is explicit static Matvaretabellen reviewed peanut-butter composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B36.id, "matvaretabellen-2026-composition-b36");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B36.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B36.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B36.evidenceTranche, "B36");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B36.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B36.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B36.license, /NLOD 2\.0/);
});

test("B36 admits exactly official food 06.559 Peanut butter with narrower source qualifiers", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B36), ["peanut_butter"]);
  const peanutButter = matvaretabellenCompositionB36ForIngredient("peanut_butter");
  assert.equal(peanutButter.foodId, "06.559");
  assert.equal(peanutButter.foodName, "Peanut butter");
  assert.equal(peanutButter.scientificName, "Arachis hypogaea L.");
  assert.equal(peanutButter.foodEx2, "Peanut butter (A01BN)");
  assert.equal(peanutButter.foodForm, "SMOOTH_FULLY_HEAT_TREATED_OIL_ADDED_PEANUT_BUTTER");
  assert.equal(peanutButter.matchConfidence, "medium");
  assert.deepEqual(peanutButter.per100g, {
    energyKcal: 621,
    proteinG: 22.8,
    carbohydrateG: 13.1,
    fatG: 51.8,
    fibreG: 5
  });
  assert.equal(peanutButter.fieldEvidence.proteinG.sourceCode, "450c");
  assert.equal(peanutButter.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(peanutButter.fieldEvidence.fatG.sourceCode, "450c");
  assert.equal(peanutButter.fieldEvidence.fibreG.sourceCode, "450c");
});

test("B36 preserves generic canonical peanut-butter identity without bleeding into neighboring nut foods", () => {
  assert.equal(INGREDIENTS.peanut_butter.name, "peanut butter");
  assert.equal(normalizeIngredient("peanut butter"), "peanut_butter");
  assert.equal(normalizeIngredient("crema de cacahuete"), "peanut_butter");
  assert.equal(selectBaseEuropeanPrimaryNutrient("peanut_butter", "proteinG"), null);

  for (const unsupported of ["peanuts", "tahini", "almonds", "cashews"]) {
    assert.equal(matvaretabellenCompositionB36ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B36.id, unsupported);
  }
});

test("runtime European-primary policy selects B36 provenance while preserving medium form confidence", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["450c"],
    carbohydrateG: ["MI0181"],
    fatG: ["450c"],
    fibreG: ["450c"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("peanut_butter", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B36.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.559", nutrient);
    assert.equal(selection.evidenceTranche, "B36", nutrient);
    assert.equal(selection.formConfidence, "medium", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("peanut_butter", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["peanut_butter"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB36SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B36 composition evidence grants no tablespoon mass or other quantity authority", () => {
  const peanutButter = matvaretabellenCompositionB36ForIngredient("peanut_butter");
  assert.equal(peanutButter.gramsPerUnit, undefined);
  assert.equal(peanutButter.units, undefined);
  assert.equal(peanutButter.sourcePortionId, undefined);
  assert.equal(peanutButter.ediblePartPercent, undefined);
  assert.equal(peanutButter.cookedYieldFactor, undefined);
});

test("B36 historical tranche stays composition-only after later portion evidence is added", () => {
  const uses = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "peanut_butter"))
    .map(recipe => recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "peanut_butter"));

  assert.equal(uses.length, 2);
  assert.ok(uses.every(ingredient => ingredient.unit === "tbsp"));
  assert.ok(uses.every(ingredient => ingredient.quantity === 2));

  const peanutButter = matvaretabellenCompositionB36ForIngredient("peanut_butter");
  assert.equal(peanutButter.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B36.id);
  assert.equal(peanutButter.gramsPerUnit, undefined);
  assert.equal(peanutButter.sourcePortionId, undefined);
});
