import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B29,
  MATVARETABELLEN_COMPOSITION_SOURCE_B29,
  matvaretabellenCompositionB29ForIngredient
} from "../src/data/matvaretabellen-composition-b29.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B29 source is explicit static Matvaretabellen wheat-tortilla composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B29.id, "matvaretabellen-2026-composition-b29");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B29.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B29.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B29.evidenceTranche, "B29");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B29.runtimeFetch, false);
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B29.license, /NLOD 2\.0/);
});

test("B29 admits exactly official food 05.381 wheat-flour tortilla with complete tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B29), ["tortilla"]);
  const tortilla = matvaretabellenCompositionB29ForIngredient("tortilla");
  assert.equal(tortilla.foodId, "05.381");
  assert.equal(tortilla.foodName, "Tortilla, wheat flour");
  assert.equal(tortilla.foodEx2, "Tortilla (A006V)");
  assert.equal(tortilla.foodEx2IngredientFacet, "Wheat flour (A003X)");
  assert.equal(tortilla.foodForm, "FULLY_HEAT_TREATED_GRIDDED_WHEAT_FLOUR_TORTILLA");
  assert.equal(tortilla.matchConfidence, "high");
  assert.deepEqual(tortilla.per100g, {
    energyKcal: 260,
    proteinG: 8.5,
    carbohydrateG: 44.8,
    fatG: 4.8,
    fibreG: 2
  });
  assert.equal(tortilla.fieldEvidence.proteinG.sourceCode, "220a");
  assert.equal(tortilla.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(tortilla.fieldEvidence.fatG.sourceCode, "220a");
  assert.equal(tortilla.fieldEvidence.fibreG.sourceCode, "220a");
});

test("canonical tortilla is explicitly a wheat/flour wrap while corn tortilla stays separate", () => {
  assert.equal(INGREDIENTS.tortilla.name, "tortilla wrap");
  assert.ok(INGREDIENTS.tortilla.aliases.includes("flour tortilla"));
  assert.ok(INGREDIENTS.tortilla.aliases.includes("tortilla de trigo"));
  assert.ok(INGREDIENTS.tortilla.allergens.includes("gluten"));
  assert.equal(INGREDIENTS.corn_tortilla.name, "corn tortilla");
  const recipe = AUTHORED_RECIPES.find(row => row.id === "med_greek_yogurt_chickpea_wrap");
  assert.ok(recipe);
  const use = recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "tortilla");
  assert.ok(use);
  assert.equal(use.quantity, 4);
  assert.equal(use.unit, "pieces");
});

test("B29 wheat-tortilla evidence does not bleed into corn tortilla or neighboring flatbreads", () => {
  for (const unsupported of ["corn_tortilla", "bread", "pita", "naan", "flatbread"]) {
    assert.equal(matvaretabellenCompositionB29ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B29.id, unsupported);
  }
});

test("runtime European-primary policy selects B29 tortilla provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["220a"],
    carbohydrateG: ["MI0181"],
    fatG: ["220a"],
    fibreG: ["220a"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("tortilla", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B29.id, nutrient);
    assert.equal(selection.sourceIdentifier, "05.381", nutrient);
    assert.equal(selection.evidenceTranche, "B29", nutrient);
    assert.equal(selection.formConfidence, "high", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  const coverage = europeanPrimaryPolicyCoverage(["tortilla"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB29SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B29 composition evidence does not invent a tortilla-piece weight", () => {
  const tortilla = matvaretabellenCompositionB29ForIngredient("tortilla");
  assert.equal(tortilla.gramsPerUnit, undefined);
  assert.equal(tortilla.units, undefined);
  assert.equal(tortilla.sourcePortionId, undefined);
  assert.equal(tortilla.ediblePartPercent, undefined);
  assert.equal(tortilla.cookedYieldFactor, undefined);
});

test("B29 resolves tortilla composition but leaves the authored four-piece quantity fail-closed", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const detail = audit.recipeDetails.find(row => row.recipeId === "med_greek_yogurt_chickpea_wrap");
  assert.ok(detail);
  const tortillaBlockers = detail.blockers.filter(blocker => blocker.ingredientId === "tortilla");
  assert.deepEqual(tortillaBlockers, [{ ingredientId: "tortilla", reason: "unsupported_quantity_unit" }]);
  assert.equal(detail.authoritative, false);
});

test("B29 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "tortilla", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    tortilla: EUROPEAN_PRIMARY_DENSITIES_V1.tortilla,
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
