import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B43,
  MATVARETABELLEN_COMPOSITION_SOURCE_B43,
  matvaretabellenCompositionB43ForIngredient
} from "../src/data/matvaretabellen-composition-b43.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B43 source is explicit static Matvaretabellen standalone raw-kale composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B43.id, "matvaretabellen-2026-composition-b43");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B43.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B43.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B43.evidenceTranche, "B43");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B43.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B43.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B43.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B43.license, /NLOD 2\.0/);
});

test("B43 admits exactly official food 06.035 Kale, raw with published tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B43), ["kale"]);
  const kale = matvaretabellenCompositionB43ForIngredient("kale");
  assert.equal(kale.foodId, "06.035");
  assert.equal(kale.foodName, "Kale, raw");
  assert.equal(kale.foodEx2, "Curly kales (A00GM)");
  assert.equal(kale.foodForm, "EXACT_RAW_KALE_LEAF");
  assert.equal(kale.matchConfidence, "high");
  assert.deepEqual(kale.per100g, {
    energyKcal: 36,
    proteinG: 3.3,
    carbohydrateG: 2.2,
    fatG: 0.7,
    fibreG: 4
  });
  assert.equal(kale.fieldEvidence.proteinG.sourceCode, "400c");
  assert.equal(kale.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(kale.fieldEvidence.fatG.sourceCode, "400c");
  assert.equal(kale.fieldEvidence.fibreG.sourceCode, "400c");
});

test("repository-native kale semantics establish raw chopped input before cooking", () => {
  assert.equal(INGREDIENTS.kale.name, "kale");
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "kale"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "kale"),
      instructions: recipe.instructions.map(step => step.text)
    }));
  assert.equal(rows.length, 1);
  assert.deepEqual(
    [rows[0].recipeId, rows[0].ingredient.quantity, rows[0].ingredient.unit, rows[0].ingredient.preparation],
    ["med_white_bean_kale_stew", 150, "g", "chopped"]
  );
  assert.match(rows[0].instructions.join(" "), /Add kale and cook until tender/i);
});

test("B43 raw-kale identity does not bleed into neighboring or processed kale forms", () => {
  for (const unsupported of ["kale_frozen", "kale_steamed", "kale_cooked", "spinach", "cabbage"]) {
    assert.equal(matvaretabellenCompositionB43ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B43.id, unsupported);
  }
});

test("European-primary runtime selects exact B43 kale provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["400c"],
    carbohydrateG: ["MI0181"],
    fatG: ["400c"],
    fibreG: ["400c"]
  };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("kale", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B43.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.035", nutrient);
    assert.equal(selection.evidenceTranche, "B43", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, expectedCodes[nutrient], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("kale", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["kale"]);
  assert.equal(coverage.matvaretabellenB43SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B43 composition evidence does not authorize edible yield or household quantity", () => {
  const kale = matvaretabellenCompositionB43ForIngredient("kale");
  assert.equal(kale.gramsPerUnit, undefined);
  assert.equal(kale.units, undefined);
  assert.equal(kale.ediblePartPercent, undefined);
});

test("B43 clears only the authored kale density blocker while independent recipe gates remain fail-closed", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const detail = audit.recipeDetails.find(row => row.recipeId === "med_white_bean_kale_stew");
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "kale"), false);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "smoked_paprika"), true);
  assert.equal(detail.authoritative, false);
});
