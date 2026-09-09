import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B28,
  MATVARETABELLEN_COMPOSITION_SOURCE_B28,
  matvaretabellenCompositionB28ForIngredient
} from "../src/data/matvaretabellen-composition-b28.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B28 source is explicit static Matvaretabellen table-salt composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B28.id, "matvaretabellen-2026-composition-b28");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B28.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B28.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B28.evidenceTranche, "B28");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B28.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B28.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B28.license, /NLOD 2\.0/);
});

test("B28 admits exactly official food 12.022 table salt with published zero tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B28), ["salt"]);
  const salt = matvaretabellenCompositionB28ForIngredient("salt");
  assert.equal(salt.foodId, "12.022");
  assert.equal(salt.foodName, "Salt, table");
  assert.equal(salt.foodEx2, "Salt (A042P)");
  assert.equal(salt.foodForm, "FINELY_GROUND_DRY_TABLE_SALT");
  assert.equal(salt.matchConfidence, "medium");
  assert.deepEqual(salt.per100g, {
    energyKcal: 0,
    proteinG: 0,
    carbohydrateG: 0,
    fatG: 0,
    fibreG: 0
  });
  assert.equal(salt.fieldEvidence.proteinG.sourceCode, "400c");
  assert.equal(salt.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(salt.fieldEvidence.fatG.sourceCode, "50");
  assert.equal(salt.fieldEvidence.fibreG.sourceCode, "50");
});

test("repository canonical salt stays generic while B28 preserves the narrower table-salt source qualifier", () => {
  assert.equal(INGREDIENTS.salt.name, "salt");
  assert.ok(INGREDIENTS.salt.aliases.includes("sal"));
  const recipe = AUTHORED_RECIPES.find(row => row.id === "spanish_potato_onion_tortilla");
  assert.ok(recipe);
  const saltUse = recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "salt");
  assert.ok(saltUse);
  assert.equal(saltUse.quantity, 0.5);
  assert.equal(saltUse.unit, "tsp");
});

test("B28 table-salt evidence does not bleed into neighboring salt identities or seasonings", () => {
  for (const unsupported of ["sea_salt", "iodized_salt", "mineral_salt", "herbal_salt", "smoked_paprika"]) {
    assert.equal(matvaretabellenCompositionB28ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B28.id, unsupported);
  }
});

test("runtime European-primary policy selects B28 salt provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["400c"],
    carbohydrateG: ["MI0181"],
    fatG: ["50"],
    fibreG: ["50"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("salt", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B28.id, nutrient);
    assert.equal(selection.sourceIdentifier, "12.022", nutrient);
    assert.equal(selection.evidenceTranche, "B28", nutrient);
    assert.equal(selection.formConfidence, "medium", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  const coverage = europeanPrimaryPolicyCoverage(["salt"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB28SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B28 composition evidence does not authorize a household portion or density conversion", () => {
  const salt = matvaretabellenCompositionB28ForIngredient("salt");
  assert.equal(salt.gramsPerUnit, undefined);
  assert.equal(salt.units, undefined);
  assert.equal(salt.sourcePortionId, undefined);
  assert.equal(salt.ediblePartPercent, undefined);
  assert.equal(salt.cookedYieldFactor, undefined);
});

test("B28 removes the salt density blocker and unlocks the authored Spanish tortilla", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const detail = audit.recipeDetails.find(row => row.recipeId === "spanish_potato_onion_tortilla");
  assert.ok(detail);
  assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "salt"), false);
  assert.equal(detail.authoritative, true);
});

test("B28 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "salt", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    salt: EUROPEAN_PRIMARY_DENSITIES_V1.salt,
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
