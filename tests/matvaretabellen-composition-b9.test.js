import test from "node:test";
import assert from "node:assert/strict";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B9,
  MATVARETABELLEN_COMPOSITION_SOURCE_B9,
  matvaretabellenCompositionForIngredient
} from "../src/data/matvaretabellen-composition-b9.js";
import { publicNutritionSource, calculatePerServingFromDensities } from "../src/domain/nutrition.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B9 source is explicit static Matvaretabellen composition evidence, separate from B6 portions", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B9.id, "matvaretabellen-2026-composition-b9");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B9.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B9.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B9.evidenceTranche, "B9");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B9.runtimeFetch, false);
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B9.license, /NLOD 2\.0/);
});

test("B9 admits only the exact uncooked basmati record and never generic rice", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B9), ["basmati_rice"]);
  const record = matvaretabellenCompositionForIngredient("basmati_rice");
  assert.equal(record.foodId, "05.305");
  assert.equal(record.foodName, "Rice, Basmati, uncooked");
  assert.equal(record.scientificName, "Oryza sativa L.");
  assert.equal(record.matchConfidence, "high");
  assert.deepEqual(record.per100g, {
    energyKcal: 354,
    proteinG: 9.2,
    carbohydrateG: 76.8,
    fatG: 1.1,
    fibreG: 0.5
  });
  assert.equal(record.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.match(record.fieldEvidence.carbohydrateG.method, /available calculated from sugar and starch/i);
  assert.equal(matvaretabellenCompositionForIngredient("rice"), null);
  assert.equal(matvaretabellenCompositionForIngredient("jasmine_rice"), null);
});

test("European-primary policy selects B9 basmati with exact provenance", () => {
  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"]) {
    const selection = selectEuropeanPrimaryNutrient("basmati_rice", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B9.id, nutrient);
    assert.equal(selection.sourceIdentifier, "05.305", nutrient);
    assert.equal(selection.evidenceTranche, "B9", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("basmati_rice", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
});

test("B9 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "basmati_rice", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    basmati_rice: EUROPEAN_PRIMARY_DENSITIES_V1.basmati_rice,
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

test("exact B9 basmati evidence unlocks the one-blocker authored curry through actual calculation", () => {
  const recipe = AUTHORED_RECIPES.find(item => item.id === "indian_chickpea_cauliflower_curry");
  assert.ok(recipe);
  const estimate = publicNutritionSource.estimate(recipe);
  assert.equal(estimate.method, "EUROPEAN_PRIMARY_STATIC_CALCULATION_V1");
  assert.equal(estimate.evidence.sourceSelectionState, "EUROPEAN_PRIMARY_COMPLETE");
  assert.equal(estimate.evidence.state, "AUTHORITATIVE_STATIC_RECIPE_CALCULATION_AVAILABLE");
  const basmati = estimate.evidence.staticCalculation.used.find(item => item.ingredientId === "basmati_rice");
  assert.ok(basmati);
  assert.equal(basmati.grams, 130);
  assert.equal(basmati.provenanceByNutrient.carbohydrateG.source, "matvaretabellen");
  assert.equal(basmati.provenanceByNutrient.carbohydrateG.sourceIdentifier, "05.305");
});
