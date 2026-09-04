import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B20,
  MATVARETABELLEN_COMPOSITION_SOURCE_B20,
  matvaretabellenCompositionB20ForIngredient
} from "../src/data/matvaretabellen-composition-b20.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B20 source is explicit static Matvaretabellen standalone raw-cod composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B20.id, "matvaretabellen-2026-composition-b20");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B20.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B20.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B20.evidenceTranche, "B20");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B20.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B20.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B20.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B20.license, /NLOD 2\.0/);
});

test("B20 admits exactly official food 04.327 Cod, unspecified, raw with published tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B20), ["cod"]);
  const cod = matvaretabellenCompositionB20ForIngredient("cod");
  assert.equal(cod.foodId, "04.327");
  assert.equal(cod.foodName, "Cod, unspecified, raw");
  assert.equal(cod.scientificName, "Gadus morhua Linnaeus, 1758");
  assert.equal(cod.foodEx2, "Cod (A02BV)");
  assert.equal(cod.foodForm, "EXACT_GENERIC_RAW_COD_EDIBLE_MEAT");
  assert.deepEqual(cod.per100g, {
    energyKcal: 79,
    proteinG: 17.7,
    carbohydrateG: 0,
    fatG: 0.9,
    fibreG: 0
  });
  assert.equal(cod.fieldEvidence.energyKcal.sourceCode, "MI0115");
  assert.equal(cod.fieldEvidence.proteinG.sourceCode, "701G");
  assert.equal(cod.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(cod.fieldEvidence.fatG.sourceCode, "701G");
  assert.equal(cod.fieldEvidence.fibreG.sourceCode, "50");
  assert.equal(cod.fieldEvidence.fibreG.valueType, "Logical zero");
});

test("repository-native cod semantics establish a raw edible-meat input before cooking", () => {
  assert.equal(INGREDIENTS.cod.name, "cod");
  assert.ok(INGREDIENTS.cod.aliases.includes("cod fillet"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "cod"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "cod"),
      instructions: recipe.instructions.map(step => step.text)
    }));
  assert.equal(rows.length, 1);
  assert.deepEqual(
    [rows[0].recipeId, rows[0].ingredient.quantity, rows[0].ingredient.unit, rows[0].ingredient.preparation],
    ["med_cod_chickpea_tomato_stew", 300, "g", "large pieces"]
  );
  assert.match(rows[0].instructions.join(" "), /Nestle in cod, cook gently until just flaky/i);
});

test("B20 generic raw-cod identity does not bleed into qualified or processed cod neighbors", () => {
  for (const unsupported of [
    "cod_wild",
    "cod_farmed",
    "cod_slices",
    "cod_cooked",
    "cod_salted",
    "cod_dried",
    "cod_breaded",
    "hake"
  ]) {
    assert.equal(matvaretabellenCompositionB20ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B20.id, unsupported);
  }
});

test("European-primary policy selects exact B20 cod provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: "MI0115",
    proteinG: "701G",
    carbohydrateG: "MI0181",
    fatG: "701G",
    fibreG: "50"
  };
  for (const nutrient of Object.keys(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("cod", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B20.id, nutrient);
    assert.equal(selection.sourceIdentifier, "04.327", nutrient);
    assert.equal(selection.evidenceTranche, "B20", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, [expectedCodes[nutrient]], nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("cod", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["cod"]);
  assert.equal(coverage.matvaretabellenB20SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B20 composition evidence does not authorize the source portion or edible-part yield as quantity evidence", () => {
  const cod = matvaretabellenCompositionB20ForIngredient("cod");
  assert.equal(cod.gramsPerUnit, undefined);
  assert.equal(cod.units, undefined);
  assert.equal(cod.sourcePortionId, undefined);
  assert.equal(cod.ediblePartPercent, undefined);
});

test("B20 removes exactly one cod density blocker while preserving the recipe's smoked-paprika blocker", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.authoritativeRecipeCount, 16);
  assert.equal(audit.estimateRecipeCount, 60);
  assert.equal(audit.blockerCounts.missing_density, 89);
  const detail = audit.recipeDetails.find(row => row.recipeId === "med_cod_chickpea_tomato_stew");
  assert.equal(detail.authoritative, false);
  assert.deepEqual(detail.blockers.map(blocker => [blocker.ingredientId, blocker.reason]), [
    ["smoked_paprika", "missing_density"]
  ]);
});

test("B20 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "cod", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    cod: EUROPEAN_PRIMARY_DENSITIES_V1.cod,
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
