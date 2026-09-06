import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B26,
  MATVARETABELLEN_COMPOSITION_SOURCE_B26,
  matvaretabellenCompositionB26ForIngredient
} from "../src/data/matvaretabellen-composition-b26.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B26 source is explicit static Matvaretabellen dry uncooked rice-noodle composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B26.id, "matvaretabellen-2026-composition-b26");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B26.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B26.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B26.evidenceTranche, "B26");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B26.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B26.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B26.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B26.license, /NLOD 2\.0/);
});

test("B26 admits exactly official food 05.331 uncooked rice noodles with complete tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B26), ["rice_noodles"]);
  const noodles = matvaretabellenCompositionB26ForIngredient("rice_noodles");
  assert.equal(noodles.foodId, "05.331");
  assert.equal(noodles.foodName, "Noodles, rice, uncooked");
  assert.equal(noodles.foodEx2, "Noodle, rice (A008F)");
  assert.equal(noodles.foodForm, "DRIED_UNCOOKED_RICE_NOODLES");
  assert.equal(noodles.matchConfidence, "high");
  assert.deepEqual(noodles.per100g, {
    energyKcal: 361,
    proteinG: 6,
    carbohydrateG: 82.2,
    fatG: 0.6,
    fibreG: 2
  });
  assert.equal(noodles.fieldEvidence.energyKcal.sourceCode, null);
  assert.equal(noodles.fieldEvidence.proteinG.sourceCode, "460h");
  assert.equal(noodles.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(noodles.fieldEvidence.fatG.sourceCode, "460h");
  assert.equal(noodles.fieldEvidence.fibreG.sourceCode, "460h");
});

test("repository-native rice-noodle uses are direct dry mass before authored cooking or soaking", () => {
  assert.equal(INGREDIENTS.rice_noodles.name, "rice noodles");
  assert.ok(INGREDIENTS.rice_noodles.aliases.includes("fideos de arroz"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "rice_noodles"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "rice_noodles"),
      steps: recipe.instructions.map(step => step.text).join(" ")
    }))
    .sort((a, b) => a.recipeId.localeCompare(b.recipeId));
  assert.deepEqual(rows.map(row => row.recipeId), [
    "se_asian_lime_chicken_rice_noodles",
    "se_asian_mango_tofu_rice_noodle_salad",
    "se_asian_peanut_chickpea_noodles"
  ]);
  assert.deepEqual(rows.map(row => row.ingredient.quantity), [160, 150, 160]);
  assert.ok(rows.every(row => row.ingredient.unit === "g"));
  assert.ok(rows.every(row => row.ingredient.preparation === null));
  assert.ok(rows.every(row => /rice noodles/i.test(row.steps) && /(cook|soak)/i.test(row.steps)));
});

test("B26 uncooked rice-noodle identity does not bleed into cooked rice noodles or neighboring grains/noodles", () => {
  for (const unsupported of ["cooked_rice_noodles", "noodles", "wholewheat_pasta", "rice", "brown_rice", "basmati_rice", "jasmine_rice"]) {
    assert.equal(matvaretabellenCompositionB26ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B26.id, unsupported);
  }
});

test("runtime European-primary policy selects B26 rice-noodle provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["460h"],
    carbohydrateG: ["MI0181"],
    fatG: ["460h"],
    fibreG: ["460h"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("rice_noodles", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B26.id, nutrient);
    assert.equal(selection.sourceIdentifier, "05.331", nutrient);
    assert.equal(selection.evidenceTranche, "B26", nutrient);
    assert.equal(selection.formConfidence, "high", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("rice_noodles", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["rice_noodles"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB26SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B26 composition evidence does not authorize a household portion or cooked-yield conversion", () => {
  const noodles = matvaretabellenCompositionB26ForIngredient("rice_noodles");
  assert.equal(noodles.gramsPerUnit, undefined);
  assert.equal(noodles.units, undefined);
  assert.equal(noodles.sourcePortionId, undefined);
  assert.equal(noodles.ediblePartPercent, undefined);
  assert.equal(noodles.cookedYieldFactor, undefined);
});

test("B26 removes rice-noodle density blockers while preserving independent fail-closed blockers", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  for (const recipeId of [
    "se_asian_lime_chicken_rice_noodles",
    "se_asian_mango_tofu_rice_noodle_salad",
    "se_asian_peanut_chickpea_noodles"
  ]) {
    const detail = audit.recipeDetails.find(row => row.recipeId === recipeId);
    assert.ok(detail, recipeId);
    assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "rice_noodles"), false, recipeId);
  }
  const tofuSalad = audit.recipeDetails.find(row => row.recipeId === "se_asian_mango_tofu_rice_noodle_salad");
  assert.equal(tofuSalad.blockers.some(blocker => blocker.ingredientId === "tofu_firm"), true);
});

test("B26 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "rice_noodles", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    rice_noodles: EUROPEAN_PRIMARY_DENSITIES_V1.rice_noodles,
    synthetic_usda: {
      per100g: { energyKcal: 1, proteinG: 1, carbohydrateG: 1, fatG: 1, fibreG: 1 },
      provenanceByNutrient: {
        carbohydrateG: { semantic: "CARBOHYDRATE_BY_DIFFERENCE_USDA_1005" }
      }
    }
  };
  const result = calculatePerServingFromDensities(recipe, densityMap);
  assert.equal(result.nutrientCoverage.carbohydrateG.semanticCompatibility, false);
  assert.equal(result.nutrientCoverage.carbohydrateG.semanticIssue, "mixed_incompatible_carbohydrate_semantics");
  assert.equal(result.perServing.carbohydrateG, null);
  assert.equal(result.complete, false);
});
