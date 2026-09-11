import test from "node:test";
import assert from "node:assert/strict";
import {
  MEXT_COMPOSITION_DENSITIES_B39,
  MEXT_COMPOSITION_SOURCE_B39,
  mextCompositionB39ForIngredient
} from "../src/data/mext-composition-b39.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";
import { selectEuropeanPrimaryNutrient as selectBaseEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B39 source is explicit bounded MEXT rice-vinegar composition evidence", () => {
  assert.equal(MEXT_COMPOSITION_SOURCE_B39.id, "mext-standard-tables-2023-composition-b39");
  assert.equal(MEXT_COMPOSITION_SOURCE_B39.authority, "Ministry of Education, Culture, Sports, Science and Technology (MEXT), Japan");
  assert.equal(MEXT_COMPOSITION_SOURCE_B39.evidenceTranche, "B39");
  assert.equal(MEXT_COMPOSITION_SOURCE_B39.runtimeFetch, false);
  assert.equal(MEXT_COMPOSITION_SOURCE_B39.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MEXT_COMPOSITION_SOURCE_B39.carbohydrateSemantic, "AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF");
  assert.match(MEXT_COMPOSITION_SOURCE_B39.reuseTerms, /freely used/i);
});

test("B39 admits exactly MEXT food 17016 Rice vinegar with all tracked fields", () => {
  assert.deepEqual(Object.keys(MEXT_COMPOSITION_DENSITIES_B39), ["rice_vinegar"]);
  const record = mextCompositionB39ForIngredient("rice_vinegar");
  assert.equal(record.foodId, "17016");
  assert.equal(record.foodName, "Rice vinegar");
  assert.equal(record.sourceCategory, "SEASONINGS AND SPICES/Vinegar/rice vinegar");
  assert.equal(record.matchConfidence, "high");
  assert.deepEqual(record.per100g, {
    energyKcal: 46,
    proteinG: 0.2,
    carbohydrateG: 7.4,
    fatG: 0,
    fibreG: 0
  });
  assert.equal(record.fieldEvidence.carbohydrateG.sourceCode, "CHOAVLDF-");
  assert.equal(record.fieldEvidence.fibreG.valueType, "Published estimated zero");
});

test("B39 exact rice-vinegar identity does not bleed into generic, seasoned or neighboring vinegars", () => {
  assert.equal(INGREDIENTS.rice_vinegar.name, "rice vinegar");
  assert.equal(normalizeIngredient("rice vinegar"), "rice_vinegar");
  assert.equal(normalizeIngredient("vinagre de arroz"), "rice_vinegar");
  assert.equal(selectBaseEuropeanPrimaryNutrient("rice_vinegar", "proteinG"), null);

  for (const unsupported of ["vinegar", "balsamic_vinegar", "rice_wine", "seasoned_rice_vinegar", "black_rice_vinegar"]) {
    assert.equal(mextCompositionB39ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MEXT_COMPOSITION_SOURCE_B39.id, unsupported);
  }
});

test("runtime selects B39 MEXT provenance without miscounting it as Matvaretabellen", () => {
  const expectedSemantics = {
    energyKcal: "ENERGY_MEXT_PUBLISHED",
    proteinG: "PROTEIN_MEXT",
    carbohydrateG: "AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF",
    fatG: "TOTAL_FAT",
    fibreG: "DIETARY_FIBRE_MEXT"
  };
  for (const [nutrient, semantic] of Object.entries(expectedSemantics)) {
    const selection = selectEuropeanPrimaryNutrient("rice_vinegar", nutrient);
    assert.equal(selection.source, "mext", nutrient);
    assert.equal(selection.sourceId, MEXT_COMPOSITION_SOURCE_B39.id, nutrient);
    assert.equal(selection.sourceIdentifier, "17016", nutrient);
    assert.equal(selection.evidenceTranche, "B39", nutrient);
    assert.equal(selection.semantic, semantic, nutrient);
    assert.equal(selection.formConfidence, "high", nutrient);
  }
  const density = EUROPEAN_PRIMARY_DENSITIES_V1.rice_vinegar;
  assert.deepEqual(density.per100g, {
    energyKcal: 46,
    proteinG: 0.2,
    carbohydrateG: 7.4,
    fatG: 0,
    fibreG: 0
  });
  const coverage = europeanPrimaryPolicyCoverage(["rice_vinegar"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.mextSelectedCount, 5);
  assert.equal(coverage.mextB39SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 0);
});

test("B39 composition grants no tablespoon, density, edible-yield or cooked-yield authority", () => {
  const record = mextCompositionB39ForIngredient("rice_vinegar");
  assert.equal(record.gramsPerUnit, undefined);
  assert.equal(record.units, undefined);
  assert.equal(record.sourcePortionId, undefined);
  assert.equal(record.ediblePartPercent, undefined);
  assert.equal(record.cookedYieldFactor, undefined);
});

test("B39 moves exactly three authored rice-vinegar uses from missing density to unsupported tablespoon quantity", () => {
  const recipes = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "rice_vinegar"));
  assert.equal(recipes.length, 3);
  for (const recipe of recipes) {
    const ingredient = recipe.ingredients.find(item => item.canonicalIngredientId === "rice_vinegar");
    assert.equal(ingredient.quantity, 1, recipe.id);
    assert.equal(ingredient.unit, "tbsp", recipe.id);
    const estimate = publicNutritionSource.estimate(recipe);
    const blocker = estimate.evidence.europeanStaticCalculation.skipped.find(item => item.ingredientId === "rice_vinegar");
    assert.deepEqual(blocker, { ingredientId: "rice_vinegar", reason: "unsupported_quantity_unit" }, recipe.id);
  }
});

test("MEXT available-carbohydrate-by-difference remains incompatible with USDA total carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "rice_vinegar", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densities = {
    rice_vinegar: EUROPEAN_PRIMARY_DENSITIES_V1.rice_vinegar,
    synthetic_usda: {
      per100g: { energyKcal: 100, proteinG: 1, carbohydrateG: 10, fatG: 1, fibreG: 1 },
      provenanceByNutrient: {
        carbohydrateG: { semantic: "CARBOHYDRATE_BY_DIFFERENCE_USDA_1005" }
      }
    }
  };
  const result = calculatePerServingFromDensities(recipe, densities);
  assert.equal(result.complete, false);
  assert.equal(result.nutrientCoverage.carbohydrateG.semanticCompatibility, false);
  assert.equal(result.nutrientCoverage.carbohydrateG.semanticIssue, "mixed_incompatible_carbohydrate_semantics");
  assert.equal(result.perServing.carbohydrateG, null);
});
