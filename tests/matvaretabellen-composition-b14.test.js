import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B14,
  MATVARETABELLEN_COMPOSITION_SOURCE_B14,
  matvaretabellenCompositionB14ForIngredient
} from "../src/data/matvaretabellen-composition-b14.js";
import { calculatePerServingFromDensities } from "../src/domain/nutrition.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B14 source is explicit static Matvaretabellen standalone composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B14.id, "matvaretabellen-2026-composition-b14");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B14.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B14.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B14.evidenceTranche, "B14");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B14.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B14.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B14.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B14.license, /NLOD 2\.0/);
});

test("B14 admits exactly raw courgette/zucchini", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B14), ["courgette"]);
  const courgette = matvaretabellenCompositionB14ForIngredient("courgette");
  assert.equal(courgette.foodId, "06.085");
  assert.equal(courgette.foodName, "Squash, zucchini, raw");
  assert.equal(courgette.scientificName, "Cucurbita pepo L.");
  assert.equal(courgette.foodEx2, "Courgettes (A00JR)");
  assert.deepEqual(courgette.foodEx2Facets, ["Raw, no heat treatment (A07HS)"]);
  assert.equal(courgette.foodForm, "RAW_WHOLE_COURGETTE_ZUCCHINI");
  assert.deepEqual(courgette.per100g, {
    energyKcal: 17,
    proteinG: 1.3,
    carbohydrateG: 2.2,
    fatG: 0.1,
    fibreG: 1
  });
  assert.equal(courgette.fieldEvidence.proteinG.sourceCode, "420h");
  assert.equal(courgette.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(courgette.fieldEvidence.fatG.sourceCode, "420h");
  assert.equal(courgette.fieldEvidence.fibreG.sourceCode, "420h");
});

test("B14 exact identity does not bleed into nearby identities or aliases as separate canonical ids", () => {
  for (const unsupported of ["zucchini", "squash", "pumpkin", "cooked_courgette", "courgette_cooked"]) {
    assert.equal(matvaretabellenCompositionB14ForIngredient(unsupported), null, unsupported);
  }

  for (const ingredientId of ["squash", "pumpkin"]) {
    const selection = selectEuropeanPrimaryNutrient(ingredientId, "carbohydrateG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B14.id, ingredientId);
  }
});

test("European-primary policy selects B14 courgette with exact provenance for every tracked nutrient", () => {
  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"]) {
    const selection = selectEuropeanPrimaryNutrient("courgette", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B14.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.085", nutrient);
    assert.equal(selection.evidenceTranche, "B14", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("courgette", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");

  const coverage = europeanPrimaryPolicyCoverage(["courgette"]);
  assert.equal(coverage.matvaretabellenB14SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B14 provenance retains source id, food id, tranche and nutrient source codes", () => {
  const courgette = EUROPEAN_PRIMARY_DENSITIES_V1.courgette;
  assert.ok(courgette);
  assert.equal(courgette.provenanceByNutrient.energyKcal.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B14.id);
  assert.equal(courgette.provenanceByNutrient.energyKcal.sourceIdentifier, "06.085");
  assert.equal(courgette.provenanceByNutrient.energyKcal.evidenceTranche, "B14");
  assert.deepEqual(courgette.provenanceByNutrient.proteinG.sourceCodes, ["420h"]);
  assert.deepEqual(courgette.provenanceByNutrient.carbohydrateG.sourceCodes, ["MI0181"]);
});

test("B14 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "courgette", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    courgette: EUROPEAN_PRIMARY_DENSITIES_V1.courgette,
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
