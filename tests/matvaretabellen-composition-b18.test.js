import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B18,
  MATVARETABELLEN_COMPOSITION_SOURCE_B18,
  matvaretabellenCompositionB18ForIngredient
} from "../src/data/matvaretabellen-composition-b18.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B18 source is explicit static Matvaretabellen standalone cottage-cheese composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B18.id, "matvaretabellen-2026-composition-b18");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B18.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B18.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B18.evidenceTranche, "B18");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B18.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B18.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B18.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B18.license, /NLOD 2\.0/);
});

test("B18 admits exactly the official Cottage cheese identity and direct published tracked fields", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B18), ["cottage_cheese"]);
  const cottage = matvaretabellenCompositionB18ForIngredient("cottage_cheese");
  assert.equal(cottage.foodId, "01.028");
  assert.equal(cottage.foodName, "Cottage cheese");
  assert.equal(cottage.foodEx2, "Cottage cheese (A02QG)");
  assert.equal(cottage.foodForm, "EXACT_COTTAGE_CHEESE");
  assert.deepEqual(cottage.per100g, {
    energyKcal: 97,
    proteinG: 13,
    carbohydrateG: 1.5,
    fatG: 4.3,
    fibreG: 0
  });
  assert.equal(cottage.fieldEvidence.proteinG.sourceCode, "114a");
  assert.equal(cottage.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(cottage.fieldEvidence.fatG.sourceCode, "114a");
  assert.equal(cottage.fieldEvidence.fibreG.sourceCode, "50");
  assert.equal(cottage.fieldEvidence.fibreG.valueType, "Logical zero");
});

test("B18 exact identity does not bleed into neighboring cheese or dairy identities", () => {
  for (const unsupported of ["ricotta", "quark", "cream_cheese", "curd_cheese"]) {
    assert.equal(matvaretabellenCompositionB18ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "carbohydrateG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B18.id, unsupported);
  }
});

test("European-primary policy selects exact B18 cottage-cheese provenance for every tracked nutrient", () => {
  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"]) {
    const selection = selectEuropeanPrimaryNutrient("cottage_cheese", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B18.id, nutrient);
    assert.equal(selection.sourceIdentifier, "01.028", nutrient);
    assert.equal(selection.evidenceTranche, "B18", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("cottage_cheese", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["cottage_cheese"]);
  assert.equal(coverage.matvaretabellenB18SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B18 composition evidence does not authorize household portions", () => {
  const cottage = matvaretabellenCompositionB18ForIngredient("cottage_cheese");
  assert.equal(cottage.gramsPerUnit, undefined);
  assert.equal(cottage.units, undefined);
  assert.equal(cottage.sourcePortionId, undefined);
});

test("B18 exact cottage cheese unlocks only the recipe whose other evidence is complete", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.authoritativeRecipeCount, 15);
  const frittata = audit.recipeDetails.find(detail => detail.recipeId === "spanish_pepper_cottage_frittata");
  assert.equal(frittata.authoritative, true);
  assert.deepEqual(frittata.blockers, []);
  const pasta = audit.recipeDetails.find(detail => detail.recipeId === "med_cottage_tomato_pasta");
  assert.equal(pasta.authoritative, false);
  assert.deepEqual(pasta.blockers.map(blocker => [blocker.ingredientId, blocker.reason]), [["passata", "missing_density"]]);
});

test("B18 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "cottage_cheese", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    cottage_cheese: EUROPEAN_PRIMARY_DENSITIES_V1.cottage_cheese,
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
