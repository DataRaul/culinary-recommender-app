import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B27,
  MATVARETABELLEN_COMPOSITION_SOURCE_B27,
  matvaretabellenCompositionB27ForIngredient
} from "../src/data/matvaretabellen-composition-b27.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B27 source is explicit static Matvaretabellen uncooked jasmine-rice composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B27.id, "matvaretabellen-2026-composition-b27");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B27.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B27.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B27.evidenceTranche, "B27");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B27.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B27.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B27.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B27.license, /NLOD 2\.0/);
});

test("B27 admits exactly official food 05.306 uncooked jasmine rice with complete tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B27), ["jasmine_rice"]);
  const rice = matvaretabellenCompositionB27ForIngredient("jasmine_rice");
  assert.equal(rice.foodId, "05.306");
  assert.equal(rice.foodName, "Rice, Jasmin, uncooked");
  assert.equal(rice.scientificName, "Oryza sativa L.");
  assert.equal(rice.foodEx2, "Rice grain, polished (A003D)");
  assert.equal(rice.foodForm, "DRY_UNCOOKED_POLISHED_JASMINE_RICE");
  assert.equal(rice.matchConfidence, "high");
  assert.deepEqual(rice.per100g, {
    energyKcal: 355,
    proteinG: 7.5,
    carbohydrateG: 79.6,
    fatG: 0.7,
    fibreG: 0
  });
  assert.equal(rice.fieldEvidence.energyKcal.sourceCode, null);
  assert.equal(rice.fieldEvidence.proteinG.sourceCode, "209");
  assert.equal(rice.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(rice.fieldEvidence.fatG.sourceCode, "209");
  assert.equal(rice.fieldEvidence.fibreG.sourceCode, "60a");
});

test("repository-native jasmine-rice uses are direct dry mass before authored cooking steps", () => {
  assert.equal(INGREDIENTS.jasmine_rice.name, "jasmine rice");
  assert.ok(INGREDIENTS.jasmine_rice.aliases.includes("arroz jazmín"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "jasmine_rice"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "jasmine_rice"),
      steps: recipe.instructions.map(step => step.text).join(" ")
    }));
  assert.deepEqual(rows.map(row => row.recipeId), [
    "se_asian_tofu_mango_rice_bowl",
    "east_asian_miso_salmon_rice",
    "se_asian_pineapple_tofu_jasmine_rice"
  ]);
  assert.deepEqual(rows.map(row => row.ingredient.quantity), [140, 140, 140]);
  assert.ok(rows.every(row => row.ingredient.unit === "g"));
  assert.ok(rows.every(row => row.ingredient.preparation === null));
  assert.ok(rows.every(row => /cook jasmine rice/i.test(row.steps)));
});

test("B27 jasmine-rice identity does not bleed into generic, basmati, brown or cooked rice", () => {
  for (const unsupported of ["rice", "basmati_rice", "brown_rice", "cooked_jasmine_rice", "rice_noodles"]) {
    assert.equal(matvaretabellenCompositionB27ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B27.id, unsupported);
  }
});

test("runtime European-primary policy selects B27 jasmine-rice provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["209"],
    carbohydrateG: ["MI0181"],
    fatG: ["209"],
    fibreG: ["60a"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("jasmine_rice", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B27.id, nutrient);
    assert.equal(selection.sourceIdentifier, "05.306", nutrient);
    assert.equal(selection.evidenceTranche, "B27", nutrient);
    assert.equal(selection.formConfidence, "high", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("jasmine_rice", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["jasmine_rice"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB26SelectedCount, 0);
  assert.equal(coverage.matvaretabellenB27SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B27 composition evidence does not authorize a household portion or cooked-yield conversion", () => {
  const rice = matvaretabellenCompositionB27ForIngredient("jasmine_rice");
  assert.equal(rice.gramsPerUnit, undefined);
  assert.equal(rice.units, undefined);
  assert.equal(rice.sourcePortionId, undefined);
  assert.equal(rice.ediblePartPercent, undefined);
  assert.equal(rice.cookedYieldFactor, undefined);
});

test("B27 jasmine-rice evidence remains active without freezing later independent evidence", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  for (const recipeId of ["se_asian_tofu_mango_rice_bowl", "east_asian_miso_salmon_rice", "se_asian_pineapple_tofu_jasmine_rice"]) {
    const detail = audit.recipeDetails.find(row => row.recipeId === recipeId);
    assert.ok(detail, recipeId);
    assert.equal(detail.blockers.some(blocker => blocker.ingredientId === "jasmine_rice"), false, recipeId);
  }
});

test("B27 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "jasmine_rice", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    jasmine_rice: EUROPEAN_PRIMARY_DENSITIES_V1.jasmine_rice,
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
