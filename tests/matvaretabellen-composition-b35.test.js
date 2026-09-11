import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B35,
  MATVARETABELLEN_COMPOSITION_SOURCE_B35,
  matvaretabellenCompositionB35ForIngredient
} from "../src/data/matvaretabellen-composition-b35.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import {
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";
import { selectEuropeanPrimaryNutrient as selectBaseEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B35 source is explicit static Matvaretabellen reviewed miso composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B35.id, "matvaretabellen-2026-composition-b35");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B35.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B35.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B35.evidenceTranche, "B35");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B35.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B35.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B35.license, /NLOD 2\.0/);
});

test("B35 admits exactly official food 10.138 Miso", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B35), ["miso"]);
  const miso = matvaretabellenCompositionB35ForIngredient("miso");
  assert.equal(miso.foodId, "10.138");
  assert.equal(miso.foodName, "Miso");
  assert.equal(miso.matchConfidence, "high");
  assert.deepEqual(miso.per100g, {
    energyKcal: 182,
    proteinG: 17.2,
    carbohydrateG: 1.5,
    fatG: 10.5,
    fibreG: 7
  });
  assert.equal(miso.fieldEvidence.proteinG.sourceCode, "500a");
  assert.equal(miso.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(miso.fieldEvidence.fatG.sourceCode, "500a");
  assert.equal(miso.fieldEvidence.fibreG.sourceCode, "500a");
});

test("B35 source identity matches canonical generic miso paste without broadening neighboring soy foods", () => {
  assert.equal(INGREDIENTS.miso.name, "miso paste");
  assert.equal(normalizeIngredient("miso"), "miso");
  assert.equal(normalizeIngredient("miso paste"), "miso");
  assert.equal(selectBaseEuropeanPrimaryNutrient("miso", "proteinG"), null);

  for (const unsupported of ["soy_sauce", "edamame", "tofu_firm", "tempeh"]) {
    assert.equal(matvaretabellenCompositionB35ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B35.id, unsupported);
  }
});

test("runtime European-primary policy selects B35 provenance for every tracked miso nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["500a"],
    carbohydrateG: ["MI0181"],
    fatG: ["500a"],
    fibreG: ["500a"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("miso", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B35.id, nutrient);
    assert.equal(selection.sourceIdentifier, "10.138", nutrient);
    assert.equal(selection.evidenceTranche, "B35", nutrient);
    assert.equal(selection.formConfidence, "high", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("miso", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["miso"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB35SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B35 composition evidence does not authorize tablespoon mass or another quantity conversion", () => {
  const miso = matvaretabellenCompositionB35ForIngredient("miso");
  assert.equal(miso.gramsPerUnit, undefined);
  assert.equal(miso.units, undefined);
  assert.equal(miso.sourcePortionId, undefined);
  assert.equal(miso.ediblePartPercent, undefined);
  assert.equal(miso.cookedYieldFactor, undefined);
});

test("B35 historical tranche stays composition-only after later portion evidence is added", () => {
  const uses = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "miso"))
    .map(recipe => recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "miso"));

  assert.equal(uses.length, 3);
  assert.ok(uses.every(ingredient => ingredient.unit === "tbsp"));
  assert.ok(uses.every(ingredient => ingredient.quantity === 1.5));

  const miso = matvaretabellenCompositionB35ForIngredient("miso");
  assert.equal(miso.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B35.id);
  assert.equal(miso.gramsPerUnit, undefined);
  assert.equal(miso.sourcePortionId, undefined);
});
