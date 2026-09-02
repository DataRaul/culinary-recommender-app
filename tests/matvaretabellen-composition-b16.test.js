import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B16,
  MATVARETABELLEN_COMPOSITION_SOURCE_B16,
  matvaretabellenCompositionB16ForIngredient
} from "../src/data/matvaretabellen-composition-b16.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B16 source is explicit static Matvaretabellen standalone tahini composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B16.id, "matvaretabellen-2026-composition-b16");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B16.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B16.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B16.evidenceTranche, "B16");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B16.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B16.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B16.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B16.license, /NLOD 2\.0/);
});

test("B16 admits exactly the source identity sesame paste, tahini", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B16), ["tahini"]);
  const tahini = matvaretabellenCompositionB16ForIngredient("tahini");
  assert.equal(tahini.foodId, "06.702");
  assert.equal(tahini.foodName, "Sesame paste, tahini");
  assert.equal(tahini.foodEx2, "Sesame paste (tahini) (sesamus indicum) (A01BM)");
  assert.deepEqual(tahini.foodEx2Facets, ["59 % fat (A075C)"]);
  assert.equal(tahini.foodForm, "EXACT_SESAME_PASTE_TAHINI");
  assert.deepEqual(tahini.per100g, {
    energyKcal: 626,
    proteinG: 18.5,
    carbohydrateG: 0.8,
    fatG: 58.9,
    fibreG: 9
  });
  assert.equal(tahini.fieldEvidence.proteinG.sourceCode, "450a");
  assert.equal(tahini.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(tahini.fieldEvidence.fatG.sourceCode, "450a");
  assert.equal(tahini.fieldEvidence.fibreG.sourceCode, "460e");
});

test("B16 exact identity does not bleed into neighboring sesame identities or prepared tahini sauces", () => {
  for (const unsupported of ["sesame", "sesame_seeds", "sesame_butter", "tahini_sauce", "tahini_dressing"]) {
    assert.equal(matvaretabellenCompositionB16ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "carbohydrateG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B16.id, unsupported);
  }
});

test("European-primary policy selects exact B16 tahini provenance for every tracked nutrient", () => {
  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"]) {
    const selection = selectEuropeanPrimaryNutrient("tahini", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B16.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.702", nutrient);
    assert.equal(selection.evidenceTranche, "B16", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("tahini", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["tahini"]);
  assert.equal(coverage.matvaretabellenB16SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B16 composition evidence does not invent tahini household-unit conversions", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  const tahiniBlockers = audit.recipeDetails.flatMap(detail => detail.blockers
    .filter(blocker => blocker.ingredientId === "tahini")
    .map(blocker => ({ recipeId: detail.recipeId, reason: blocker.reason })));
  assert.equal(tahiniBlockers.length, 3);
  assert.deepEqual([...new Set(tahiniBlockers.map(item => item.reason))], ["unsupported_quantity_unit"]);
  assert.equal(audit.authoritativeRecipeCount, 12);
});

test("B16 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "tahini", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    tahini: EUROPEAN_PRIMARY_DENSITIES_V1.tahini,
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
