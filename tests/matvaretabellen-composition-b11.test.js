import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B11,
  MATVARETABELLEN_COMPOSITION_SOURCE_B11,
  matvaretabellenCompositionB11ForIngredient
} from "../src/data/matvaretabellen-composition-b11.js";
import { calculatePerServingFromDensities } from "../src/domain/nutrition.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B11 source is explicit static Matvaretabellen standalone composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B11.id, "matvaretabellen-2026-composition-b11");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B11.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B11.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B11.evidenceTranche, "B11");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B11.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B11.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B11.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B11.license, /NLOD 2\.0/);
});

test("B11 admits exactly ground cumin, ground turmeric and dry red lentils", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B11), ["cumin", "turmeric", "red_lentils"]);

  const cumin = matvaretabellenCompositionB11ForIngredient("cumin");
  assert.equal(cumin.foodId, "06.266");
  assert.equal(cumin.foodName, "Cumin seeds, ground");
  assert.equal(cumin.scientificName, "Cuminum cyminum L.");
  assert.equal(cumin.foodForm, "GROUND");
  assert.deepEqual(cumin.per100g, {
    energyKcal: 428,
    proteinG: 17.8,
    carbohydrateG: 33.7,
    fatG: 22.3,
    fibreG: 11
  });
  assert.equal(cumin.fieldEvidence.proteinG.sourceCode, "460h");
  assert.equal(cumin.fieldEvidence.carbohydrateG.sourceCode, "MI0181");

  const turmeric = matvaretabellenCompositionB11ForIngredient("turmeric");
  assert.equal(turmeric.foodId, "06.153");
  assert.equal(turmeric.foodName, "Turmeric, ground");
  assert.equal(turmeric.scientificName, "Curcuma longa L.");
  assert.equal(turmeric.foodForm, "GROUND");
  assert.equal(turmeric.processingFacet, "GRINDING_MILLING_CRUSHING");
  assert.deepEqual(turmeric.per100g, {
    energyKcal: 291,
    proteinG: 9.7,
    carbohydrateG: 44.4,
    fatG: 3.3,
    fibreG: 23
  });
  assert.equal(turmeric.fieldEvidence.fatG.sourceCode, "460f");

  const redLentils = matvaretabellenCompositionB11ForIngredient("red_lentils");
  assert.equal(redLentils.foodId, "06.184");
  assert.equal(redLentils.foodName, "Lentils, red, uncooked");
  assert.equal(redLentils.foodForm, "DRY_UNCOOKED");
  assert.deepEqual(redLentils.per100g, {
    energyKcal: 274,
    proteinG: 22.5,
    carbohydrateG: 31.9,
    fatG: 2.2,
    fibreG: 19
  });
  assert.equal(redLentils.fieldEvidence.proteinG.sourceCode, "616");
  assert.equal(redLentils.fieldEvidence.fatG.sourceCode, "460g");
  assert.equal(redLentils.fieldEvidence.fibreG.sourceCode, "420i");
});

test("B11 exact identity does not bleed into nearby canonical identities", () => {
  for (const unsupported of ["cumin_seed", "whole_cumin", "lentils", "cooked_lentils", "smoked_paprika", "paprika"]) {
    assert.equal(matvaretabellenCompositionB11ForIngredient(unsupported), null, unsupported);
  }

  for (const ingredientId of ["lentils", "smoked_paprika"]) {
    const selection = selectEuropeanPrimaryNutrient(ingredientId, "carbohydrateG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B11.id, ingredientId);
  }
});

test("European-primary policy selects B11 records with exact provenance for every tracked nutrient", () => {
  const expectedIds = {
    cumin: "06.266",
    turmeric: "06.153",
    red_lentils: "06.184"
  };

  for (const [ingredientId, foodId] of Object.entries(expectedIds)) {
    for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"]) {
      const selection = selectEuropeanPrimaryNutrient(ingredientId, nutrient);
      assert.equal(selection.source, "matvaretabellen", `${ingredientId}:${nutrient}`);
      assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B11.id, `${ingredientId}:${nutrient}`);
      assert.equal(selection.sourceIdentifier, foodId, `${ingredientId}:${nutrient}`);
      assert.equal(selection.evidenceTranche, "B11", `${ingredientId}:${nutrient}`);
      assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", `${ingredientId}:${nutrient}`);
    }
    assert.equal(selectEuropeanPrimaryNutrient(ingredientId, "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  }

  const coverage = europeanPrimaryPolicyCoverage(Object.keys(expectedIds));
  assert.equal(coverage.matvaretabellenB11SelectedCount, 15);
  assert.equal(coverage.matvaretabellenSelectedCount, 15);
});

test("B11 provenance retains source id, food id, tranche and nutrient source codes", () => {
  const cumin = EUROPEAN_PRIMARY_DENSITIES_V1.cumin;
  assert.ok(cumin);
  assert.equal(cumin.provenanceByNutrient.energyKcal.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B11.id);
  assert.equal(cumin.provenanceByNutrient.energyKcal.sourceIdentifier, "06.266");
  assert.equal(cumin.provenanceByNutrient.energyKcal.evidenceTranche, "B11");
  assert.deepEqual(cumin.provenanceByNutrient.proteinG.sourceCodes, ["460h"]);
  assert.deepEqual(cumin.provenanceByNutrient.carbohydrateG.sourceCodes, ["MI0181"]);
});

test("B11 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "cumin", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    cumin: EUROPEAN_PRIMARY_DENSITIES_V1.cumin,
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
