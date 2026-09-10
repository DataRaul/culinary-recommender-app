import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B31,
  MATVARETABELLEN_COMPOSITION_SOURCE_B31,
  matvaretabellenCompositionB31ForIngredient
} from "../src/data/matvaretabellen-composition-b31.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B31 source is explicit static Matvaretabellen reviewed ricotta composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B31.id, "matvaretabellen-2026-composition-b31");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B31.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B31.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B31.evidenceTranche, "B31");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B31.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B31.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B31.license, /NLOD 2\.0/);
});

test("B31 admits exactly official food 01.266 ricotta and preserves the cow-whey source qualifier", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B31), ["ricotta"]);
  const ricotta = matvaretabellenCompositionB31ForIngredient("ricotta");
  assert.equal(ricotta.foodId, "01.266");
  assert.equal(ricotta.foodName, "Cheese, Ricotta");
  assert.equal(ricotta.foodEx2, "Ricotta (A02QL)");
  assert.equal(ricotta.foodForm, "SEMISOLID_CHILLED_COW_WHEY_RICOTTA");
  assert.equal(ricotta.matchConfidence, "medium");
  assert.match(ricotta.matchNotes, /cow whey/i);
  assert.deepEqual(ricotta.per100g, {
    energyKcal: 125,
    proteinG: 7.5,
    carbohydrateG: 0.8,
    fatG: 10.2,
    fibreG: 0
  });
  assert.equal(ricotta.fieldEvidence.proteinG.sourceCode, "460h");
  assert.equal(ricotta.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(ricotta.fieldEvidence.fatG.sourceCode, "460h");
  assert.equal(ricotta.fieldEvidence.fibreG.sourceCode, "460h");
});

test("repository ricotta identity has one authored direct-mass use", () => {
  assert.equal(INGREDIENTS.ricotta.name, "ricotta");
  assert.ok(INGREDIENTS.ricotta.aliases.includes("ricotta cheese"));
  const uses = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "ricotta"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "ricotta")
    }));
  assert.deepEqual(uses.map(use => use.recipeId), ["italian_ricotta_spinach_pasta"]);
  assert.equal(uses[0].ingredient.quantity, 180);
  assert.equal(uses[0].ingredient.unit, "g");
  assert.equal(uses[0].ingredient.preparation, null);
});

test("B31 ricotta identity does not bleed into neighboring cheeses or milk-species claims", () => {
  for (const unsupported of ["cottage_cheese", "mascarpone", "mozzarella", "paneer", "cream_cheese", "sheep_ricotta", "goat_ricotta"]) {
    assert.equal(matvaretabellenCompositionB31ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B31.id, unsupported);
  }
});

test("runtime European-primary policy selects B31 ricotta provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["460h"],
    carbohydrateG: ["MI0181"],
    fatG: ["460h"],
    fibreG: ["460h"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("ricotta", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B31.id, nutrient);
    assert.equal(selection.sourceIdentifier, "01.266", nutrient);
    assert.equal(selection.evidenceTranche, "B31", nutrient);
    assert.equal(selection.formConfidence, "medium", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("ricotta", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["ricotta"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB31SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B31 composition evidence does not authorize a household portion, milk-species inference or cooked yield", () => {
  const ricotta = matvaretabellenCompositionB31ForIngredient("ricotta");
  assert.equal(ricotta.gramsPerUnit, undefined);
  assert.equal(ricotta.units, undefined);
  assert.equal(ricotta.sourcePortionId, undefined);
  assert.equal(ricotta.ediblePartPercent, undefined);
  assert.equal(ricotta.cookedYieldFactor, undefined);
});

test("B31 removes the authored ricotta density blocker while preserving the recipe's independent blockers", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.blockerCounts.missing_density, 76);
  const detail = audit.recipeDetails.find(row => row.recipeId === "italian_ricotta_spinach_pasta");
  assert.ok(detail);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "ricotta"), false);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "black_pepper"), true);
  assert.equal(detail.authoritative, false);
});

test("B31 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "ricotta", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    ricotta: EUROPEAN_PRIMARY_DENSITIES_V1.ricotta,
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
