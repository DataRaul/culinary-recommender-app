import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B51,
  MATVARETABELLEN_COMPOSITION_SOURCE_B51,
  matvaretabellenCompositionB51ForIngredient
} from "../src/data/matvaretabellen-composition-b51.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import { europeanPrimaryPolicyCoverage, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy-runtime.js";

test("B51 source is explicit static Matvaretabellen raw celery-stalk composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B51.id, "matvaretabellen-2026-composition-b51");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B51.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B51.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B51.evidenceTranche, "B51");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B51.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B51.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B51.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B51.license, /NLOD 2\.0/);
});

test("B51 admits exactly official food 06.280 Celery stalk or stem, raw", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B51), ["celery"]);
  const celery = matvaretabellenCompositionB51ForIngredient("celery");
  assert.equal(celery.foodId, "06.280");
  assert.equal(celery.foodName, "Celery stalk or stem, raw");
  assert.equal(celery.scientificName, "Apium graveolens var. dulce (Mill.) Pers.");
  assert.equal(celery.foodEx2, "Celeries (A00RY)");
  assert.equal(celery.foodForm, "EXACT_RAW_CELERY_STALK_OR_STEM");
  assert.equal(celery.matchConfidence, "high");
  assert.equal(celery.sourceEdiblePartPercent, 76);
  assert.deepEqual(celery.per100g, {
    energyKcal: 14,
    proteinG: 1,
    carbohydrateG: 1.3,
    fatG: 0,
    fibreG: 2
  });
  assert.equal(celery.fieldEvidence.proteinG.sourceCode, "237");
  assert.equal(celery.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(celery.fieldEvidence.fatG.sourceCode, "237");
  assert.equal(celery.fieldEvidence.fibreG.sourceCode, "237");
});

test("repository-native celery semantics are one raw diced stalk/stem input before cooking", () => {
  assert.equal(INGREDIENTS.celery.name, "celery");
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "celery"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "celery"),
      instructions: recipe.instructions.map(step => step.text)
    }));
  assert.equal(rows.length, 1);
  assert.deepEqual(
    [rows[0].recipeId, rows[0].ingredient.quantity, rows[0].ingredient.unit, rows[0].ingredient.preparation],
    ["med_pumpkin_white_bean_barley_stew", 1, "piece", "diced"]
  );
  assert.match(rows[0].instructions.join(" "), /Soften onion and celery/i);
});

test("B51 exact raw celery-stalk identity does not bleed into neighboring celery identities or forms", () => {
  for (const unsupported of ["celeriac", "celery_root", "celery_seed", "celery_leaf", "cooked_celery", "frozen_celery"]) {
    assert.equal(matvaretabellenCompositionB51ForIngredient(unsupported), null, unsupported);
    assert.notEqual(selectEuropeanPrimaryNutrient(unsupported, "proteinG")?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B51.id, unsupported);
  }
});

test("European-primary runtime selects exact B51 celery provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["237"],
    carbohydrateG: ["MI0181"],
    fatG: ["237"],
    fibreG: ["237"]
  };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("celery", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B51.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.280", nutrient);
    assert.equal(selection.evidenceTranche, "B51", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, expectedCodes[nutrient], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("celery", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["celery"]);
  assert.equal(coverage.matvaretabellenB51SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B51 composition does not convert the published edible part into piece or yield authority", () => {
  const celery = matvaretabellenCompositionB51ForIngredient("celery");
  assert.equal(celery.sourceEdiblePartPercent, 76);
  assert.equal(celery.gramsPerUnit, undefined);
  assert.equal(celery.units, undefined);
  assert.equal(celery.ediblePartPercent, undefined);
  assert.equal(celery.cookedYield, undefined);
});

test("B51 moves the sole celery blocker from missing density to unsupported piece quantity", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const detail = audit.recipeDetails.find(row => row.recipeId === "med_pumpkin_white_bean_barley_stew");
  assert.ok(detail);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "celery" && blocker.reason === "missing_density"), false);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "celery" && blocker.reason === "unsupported_quantity_unit"), true);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "thyme" && blocker.reason === "missing_density"), true);
  assert.equal(detail.authoritative, false);
});
