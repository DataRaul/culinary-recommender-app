import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B19,
  MATVARETABELLEN_COMPOSITION_SOURCE_B19,
  matvaretabellenCompositionB19ForIngredient
} from "../src/data/matvaretabellen-composition-b19.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B19 source is explicit static Matvaretabellen standalone uncooked-bulgur composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B19.id, "matvaretabellen-2026-composition-b19");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B19.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B19.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B19.evidenceTranche, "B19");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B19.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B19.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B19.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B19.license, /NLOD 2\.0/);
});

test("B19 admits exactly official food 05.233 Bulgur, uncooked with published tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B19), ["bulgur"]);
  const bulgur = matvaretabellenCompositionB19ForIngredient("bulgur");
  assert.equal(bulgur.foodId, "05.233");
  assert.equal(bulgur.foodName, "Bulgur, uncooked");
  assert.equal(bulgur.scientificName, "Triticum aestivum L.");
  assert.equal(bulgur.foodEx2, "Bulgur (A004G)");
  assert.equal(bulgur.foodForm, "EXACT_UNCOOKED_BULGUR");
  assert.deepEqual(bulgur.per100g, {
    energyKcal: 288,
    proteinG: 11.8,
    carbohydrateG: 50.9,
    fatG: 1.9,
    fibreG: 10
  });
  assert.equal(bulgur.fieldEvidence.energyKcal.sourceCode, "MI0115");
  assert.equal(bulgur.fieldEvidence.proteinG.sourceCode, "420f");
  assert.equal(bulgur.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(bulgur.fieldEvidence.fatG.sourceCode, "611a");
  assert.equal(bulgur.fieldEvidence.fibreG.sourceCode, "611a");
});

test("repository-authored bulgur grams are pre-hydration or pre-cooking inputs", () => {
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "bulgur"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "bulgur"),
      firstInstruction: recipe.instructions[0]?.text
    }));
  assert.deepEqual(rows.map(row => [row.recipeId, row.ingredient.quantity, row.ingredient.unit]), [
    ["middle_eastern_bulgur_chickpea_salad", 150, "g"],
    ["middle_eastern_lentil_bulgur_herb_bowl", 130, "g"],
    ["middle_eastern_turkey_bulgur_pepper_bowl", 140, "g"]
  ]);
  for (const row of rows) assert.equal(row.ingredient.preparation, null, row.recipeId);
  assert.match(rows[0].firstInstruction, /Cover bulgur with hot water and rest until tender/i);
  assert.match(rows[1].firstInstruction, /bulgur until fluffy/i);
  assert.match(rows[2].firstInstruction, /Cook bulgur until tender/i);
});

test("B19 exact uncooked-bulgur identity does not bleed into cooked bulgur or neighboring grains", () => {
  for (const unsupported of ["cooked_bulgur", "couscous", "cracked_wheat", "wheat"]) {
    assert.equal(matvaretabellenCompositionB19ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "carbohydrateG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B19.id, unsupported);
  }
});

test("European-primary policy selects exact B19 bulgur provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: "MI0115",
    proteinG: "420f",
    carbohydrateG: "MI0181",
    fatG: "611a",
    fibreG: "611a"
  };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("bulgur", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B19.id, nutrient);
    assert.equal(selection.sourceIdentifier, "05.233", nutrient);
    assert.equal(selection.evidenceTranche, "B19", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, [expectedCodes[nutrient]], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("bulgur", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["bulgur"]);
  assert.equal(coverage.matvaretabellenB19SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B19 composition evidence does not authorize source household portions", () => {
  const bulgur = matvaretabellenCompositionB19ForIngredient("bulgur");
  assert.equal(bulgur.gramsPerUnit, undefined);
  assert.equal(bulgur.units, undefined);
  assert.equal(bulgur.sourcePortionId, undefined);
});

test("B19 removes exactly three bulgur density blockers while preserving all residual blockers", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.authoritativeRecipeCount, 15);
  assert.equal(audit.estimateRecipeCount, 61);
  assert.equal(audit.blockerCounts.missing_density, 94);
  const expected = {
    middle_eastern_bulgur_chickpea_salad: [["mint", "missing_density"]],
    middle_eastern_lentil_bulgur_herb_bowl: [["lentils", "missing_density"], ["mint", "missing_density"]],
    middle_eastern_turkey_bulgur_pepper_bowl: [["turkey_mince", "missing_density"]]
  };
  for (const [recipeId, blockers] of Object.entries(expected)) {
    const detail = audit.recipeDetails.find(row => row.recipeId === recipeId);
    assert.equal(detail.authoritative, false, recipeId);
    assert.deepEqual(detail.blockers.map(blocker => [blocker.ingredientId, blocker.reason]), blockers, recipeId);
    assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "bulgur"), false, recipeId);
  }
});

test("B19 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "bulgur", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    bulgur: EUROPEAN_PRIMARY_DENSITIES_V1.bulgur,
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
