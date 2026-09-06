import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B25,
  MATVARETABELLEN_COMPOSITION_SOURCE_B25,
  matvaretabellenCompositionB25ForIngredient
} from "../src/data/matvaretabellen-composition-b25.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B25 source is explicit static Matvaretabellen uncooked-barley composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B25.id, "matvaretabellen-2026-composition-b25");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B25.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B25.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B25.evidenceTranche, "B25");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B25.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B25.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B25.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B25.license, /NLOD 2\.0/);
});

test("B25 admits exactly official food 05.001 uncooked barley with the pearled FoodEx2 qualifier preserved", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B25), ["barley"]);
  const barley = matvaretabellenCompositionB25ForIngredient("barley");
  assert.equal(barley.foodId, "05.001");
  assert.equal(barley.foodName, "Barley, uncooked");
  assert.equal(barley.scientificName, "Hordeum vulgare L.");
  assert.equal(barley.foodEx2, "Barley grain, pearled (A002K)");
  assert.equal(barley.foodForm, "UNCOOKED_BARLEY_GRAIN_WITH_PEARLED_FOODEX2_QUALIFIER");
  assert.equal(barley.matchConfidence, "medium");
  assert.match(barley.matchNotes, /pearled/i);
  assert.deepEqual(barley.per100g, {
    energyKcal: 327,
    proteinG: 8.6,
    carbohydrateG: 65.4,
    fatG: 1.1,
    fibreG: 11
  });
  assert.equal(barley.fieldEvidence.energyKcal.sourceCode, null);
  assert.equal(barley.fieldEvidence.proteinG.sourceCode, "305");
  assert.equal(barley.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(barley.fieldEvidence.fatG.sourceCode, "305");
  assert.equal(barley.fieldEvidence.fibreG.sourceCode, "400e");
});

test("repository-native barley uses are direct dry mass before authored cooking steps", () => {
  assert.equal(INGREDIENTS.barley.name, "barley");
  assert.ok(INGREDIENTS.barley.aliases.includes("cebada"));
  assert.ok(INGREDIENTS.barley.allergens.includes("gluten"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "barley"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "barley"),
      steps: recipe.instructions.map(step => step.text).join(" ")
    }))
    .sort((a, b) => a.recipeId.localeCompare(b.recipeId));
  assert.deepEqual(rows.map(row => row.recipeId), [
    "med_lentil_mushroom_barley",
    "med_pumpkin_white_bean_barley_stew",
    "med_salmon_barley_spinach"
  ]);
  assert.deepEqual(rows.map(row => row.ingredient.quantity), [130, 120, 140]);
  assert.ok(rows.every(row => row.ingredient.unit === "g"));
  assert.ok(rows.every(row => /barley/i.test(row.steps) && /(simmer|cook)/i.test(row.steps)));
});

test("B25 barley evidence does not bleed into neighboring grains or cooked-barley identity", () => {
  for (const unsupported of ["bulgur", "couscous", "oats", "rice", "brown_rice", "wheat", "cooked_barley"]) {
    assert.equal(matvaretabellenCompositionB25ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B25.id, unsupported);
  }
});

test("European-primary policy selects B25 barley provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["305"],
    carbohydrateG: ["MI0181"],
    fatG: ["305"],
    fibreG: ["400e"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("barley", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B25.id, nutrient);
    assert.equal(selection.sourceIdentifier, "05.001", nutrient);
    assert.equal(selection.evidenceTranche, "B25", nutrient);
    assert.equal(selection.formConfidence, "medium", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("barley", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["barley"]);
  assert.equal(coverage.matvaretabellenB25SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B25 composition evidence does not authorize a household portion or cooked-yield conversion", () => {
  const barley = matvaretabellenCompositionB25ForIngredient("barley");
  assert.equal(barley.gramsPerUnit, undefined);
  assert.equal(barley.units, undefined);
  assert.equal(barley.sourcePortionId, undefined);
  assert.equal(barley.ediblePartPercent, undefined);
  assert.equal(barley.cookedYieldFactor, undefined);
});

test("B25 removes exactly the three authored barley density blockers without masking independent blockers", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.blockerCounts.missing_density, 85);

  for (const recipeId of ["med_lentil_mushroom_barley", "med_pumpkin_white_bean_barley_stew", "med_salmon_barley_spinach"]) {
    const detail = audit.recipeDetails.find(row => row.recipeId === recipeId);
    assert.ok(detail, recipeId);
    assert.ok(!detail.blockers.some(blocker => blocker.ingredientId === "barley"), recipeId);
  }

  const lentilBowl = audit.recipeDetails.find(row => row.recipeId === "med_lentil_mushroom_barley");
  assert.ok(lentilBowl.blockers.some(blocker => blocker.ingredientId === "lentils"));
});

test("B25 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "barley", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    barley: EUROPEAN_PRIMARY_DENSITIES_V1.barley,
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
