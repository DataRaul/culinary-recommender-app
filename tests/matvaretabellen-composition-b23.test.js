import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B23,
  MATVARETABELLEN_COMPOSITION_SOURCE_B23,
  matvaretabellenCompositionB23ForIngredient
} from "../src/data/matvaretabellen-composition-b23.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B23 source is explicit static Matvaretabellen standalone raw-pumpkin composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B23.id, "matvaretabellen-2026-composition-b23");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B23.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B23.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B23.evidenceTranche, "B23");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B23.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B23.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B23.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B23.license, /NLOD 2\.0/);
});

test("B23 admits exactly official food 06.033 Pumpkin, raw with reviewed tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B23), ["pumpkin"]);
  const pumpkin = matvaretabellenCompositionB23ForIngredient("pumpkin");
  assert.equal(pumpkin.foodId, "06.033");
  assert.equal(pumpkin.foodName, "Pumpkin, raw");
  assert.equal(pumpkin.scientificName, "Cucurbita pepo L.");
  assert.equal(pumpkin.foodEx2, "Pumpkins (A00KH)");
  assert.equal(pumpkin.foodForm, "EXACT_GENERIC_RAW_PUMPKIN_EDIBLE_FLESH");
  assert.deepEqual(pumpkin.per100g, {
    energyKcal: 40,
    proteinG: 1,
    carbohydrateG: 7.3,
    fatG: 0.2,
    fibreG: 3
  });
  assert.equal(pumpkin.fieldEvidence.energyKcal.sourceCode, undefined);
  assert.equal(pumpkin.fieldEvidence.proteinG.sourceCode, "420h");
  assert.equal(pumpkin.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(pumpkin.fieldEvidence.fatG.sourceCode, "420h");
  assert.equal(pumpkin.fieldEvidence.fibreG.sourceCode, "420h");
});

test("repository-native pumpkin semantics establish generic gram-denominated raw inputs", () => {
  assert.equal(INGREDIENTS.pumpkin.name, "pumpkin");
  assert.ok(INGREDIENTS.pumpkin.aliases.includes("calabaza"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "pumpkin"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "pumpkin")
    }));
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.recipeId).sort(), [
    "indian_pumpkin_red_lentil_dal",
    "med_pumpkin_white_bean_barley_stew"
  ]);
  assert.ok(rows.every(row => row.ingredient.unit === "g"));
  assert.ok(rows.every(row => row.ingredient.preparation === "small cubes"));
  assert.ok(rows.every(row => Number.isFinite(row.ingredient.quantity) && row.ingredient.quantity > 0));
});

test("B23 generic raw-pumpkin identity does not bleed into cultivar-specific or processed neighbors", () => {
  for (const unsupported of [
    "pumpkin_butternut",
    "butternut_squash",
    "pumpkin_hokkaido",
    "hokkaido_pumpkin",
    "pumpkin_puree",
    "cooked_pumpkin",
    "courgette"
  ]) {
    assert.equal(matvaretabellenCompositionB23ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B23.id, unsupported);
  }
});

test("European-primary policy selects exact B23 pumpkin provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["420h"],
    carbohydrateG: ["MI0181"],
    fatG: ["420h"],
    fibreG: ["420h"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("pumpkin", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B23.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.033", nutrient);
    assert.equal(selection.evidenceTranche, "B23", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("pumpkin", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["pumpkin"]);
  assert.equal(coverage.matvaretabellenB23SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B23 composition evidence does not authorize the source edible-part yield or a household portion", () => {
  const pumpkin = matvaretabellenCompositionB23ForIngredient("pumpkin");
  assert.equal(pumpkin.gramsPerUnit, undefined);
  assert.equal(pumpkin.units, undefined);
  assert.equal(pumpkin.sourcePortionId, undefined);
  assert.equal(pumpkin.ediblePartPercent, undefined);
});

test("B23 removes exactly two pumpkin density blockers while preserving independent blockers", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.authoritativeRecipeCount, 16);
  assert.equal(audit.estimateRecipeCount, 60);
  assert.equal(audit.blockerCounts.missing_density, 89);

  const dal = audit.recipeDetails.find(row => row.recipeId === "indian_pumpkin_red_lentil_dal");
  assert.equal(dal.authoritative, false);
  assert.ok(!dal.blockers.some(blocker => blocker.ingredientId === "pumpkin"));
  assert.ok(dal.blockers.some(blocker => blocker.ingredientId === "garam_masala"));

  const stew = audit.recipeDetails.find(row => row.recipeId === "med_pumpkin_white_bean_barley_stew");
  assert.equal(stew.authoritative, false);
  assert.ok(!stew.blockers.some(blocker => blocker.ingredientId === "pumpkin"));
});

test("B23 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "pumpkin", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    pumpkin: EUROPEAN_PRIMARY_DENSITIES_V1.pumpkin,
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
