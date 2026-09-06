import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B24,
  MATVARETABELLEN_COMPOSITION_SOURCE_B24,
  matvaretabellenCompositionB24ForIngredient
} from "../src/data/matvaretabellen-composition-b24.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B24 source is explicit static Matvaretabellen feta composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B24.id, "matvaretabellen-2026-composition-b24");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B24.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B24.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B24.evidenceTranche, "B24");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B24.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B24.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B24.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B24.license, /NLOD 2\.0/);
});

test("B24 admits exactly official food 01.188 Feta with the narrower goat-milk qualifier preserved", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B24), ["feta"]);
  const feta = matvaretabellenCompositionB24ForIngredient("feta");
  assert.equal(feta.foodId, "01.188");
  assert.equal(feta.foodName, "Cheese, goat milk, Feta");
  assert.equal(feta.foodEx2, "Cheese, feta (A02RC)");
  assert.equal(feta.foodForm, "FETA_WITH_GOAT_MILK_QUALIFIER");
  assert.equal(feta.matchConfidence, "medium");
  assert.match(feta.matchNotes, /goat milk/i);
  assert.deepEqual(feta.per100g, {
    energyKcal: 260,
    proteinG: 18.1,
    carbohydrateG: 0.2,
    fatG: 20.8,
    fibreG: 0
  });
  assert.equal(feta.fieldEvidence.energyKcal.sourceCode, null);
  assert.equal(feta.fieldEvidence.proteinG.sourceCode, "620");
  assert.equal(feta.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(feta.fieldEvidence.fatG.sourceCode, "620");
  assert.equal(feta.fieldEvidence.fibreG.sourceCode, "50");
});

test("repository-native feta semantics are generic feta and the authored use is direct mass", () => {
  assert.equal(INGREDIENTS.feta.name, "feta");
  assert.ok(INGREDIENTS.feta.aliases.includes("feta cheese"));
  assert.ok(INGREDIENTS.feta.aliases.includes("queso feta"));
  assert.ok(INGREDIENTS.feta.allergens.includes("milk"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "feta"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "feta")
    }));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].recipeId, "med_lentil_feta_salad");
  assert.equal(rows[0].ingredient.unit, "g");
  assert.equal(rows[0].ingredient.quantity, 90);
  assert.equal(rows[0].ingredient.preparation, "crumbled");
});

test("B24 feta evidence does not bleed into neighboring cheeses or milk-species claims", () => {
  for (const unsupported of ["cottage_cheese", "ricotta", "parmesan", "mozzarella", "halloumi", "goat_cheese", "sheep_cheese"]) {
    assert.equal(matvaretabellenCompositionB24ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B24.id, unsupported);
  }
});

test("European-primary policy selects B24 feta provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["620"],
    carbohydrateG: ["MI0181"],
    fatG: ["620"],
    fibreG: ["50"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("feta", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B24.id, nutrient);
    assert.equal(selection.sourceIdentifier, "01.188", nutrient);
    assert.equal(selection.evidenceTranche, "B24", nutrient);
    assert.equal(selection.formConfidence, "medium", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("feta", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["feta"]);
  assert.equal(coverage.matvaretabellenB24SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B24 composition evidence does not authorize a household portion or edible-yield conversion", () => {
  const feta = matvaretabellenCompositionB24ForIngredient("feta");
  assert.equal(feta.gramsPerUnit, undefined);
  assert.equal(feta.units, undefined);
  assert.equal(feta.sourcePortionId, undefined);
  assert.equal(feta.ediblePartPercent, undefined);
});

test("B24 removes the feta density blocker while preserving the unresolved lentil blocker", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.authoritativeRecipeCount, 16);
  assert.equal(audit.estimateRecipeCount, 60);
  assert.equal(audit.blockerCounts.missing_density, 88);
  const salad = audit.recipeDetails.find(row => row.recipeId === "med_lentil_feta_salad");
  assert.equal(salad.authoritative, false);
  assert.ok(!salad.blockers.some(blocker => blocker.ingredientId === "feta"));
  assert.ok(salad.blockers.some(blocker => blocker.ingredientId === "lentils"));
});

test("B24 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "feta", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    feta: EUROPEAN_PRIMARY_DENSITIES_V1.feta,
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
