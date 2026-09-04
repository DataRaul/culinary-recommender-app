import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_DENSITIES_B22,
  MATVARETABELLEN_COMPOSITION_SOURCE_B22,
  matvaretabellenCompositionB22ForIngredient
} from "../src/data/matvaretabellen-composition-b22.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B22 source is explicit static Matvaretabellen standalone raw-mint composition evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B22.id, "matvaretabellen-2026-composition-b22");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B22.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B22.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B22.evidenceTranche, "B22");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B22.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B22.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B22.runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B22.license, /NLOD 2\.0/);
});

test("B22 admits exactly official food 06.259 Mint, raw with reviewed tracked composition", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_DENSITIES_B22), ["mint"]);
  const mint = matvaretabellenCompositionB22ForIngredient("mint");
  assert.equal(mint.foodId, "06.259");
  assert.equal(mint.foodName, "Mint, raw");
  assert.equal(mint.scientificName, "Mentha L.");
  assert.equal(mint.foodEx2, "Mints (A00XZ)");
  assert.equal(mint.foodForm, "EXACT_GENERIC_RAW_MINT_AROMATIC_LEAVES");
  assert.deepEqual(mint.per100g, {
    energyKcal: 58,
    proteinG: 3.5,
    carbohydrateG: 5.3,
    fatG: 0.8,
    fibreG: 7
  });
  assert.equal(mint.fieldEvidence.energyKcal.sourceCode, undefined);
  assert.equal(mint.fieldEvidence.proteinG.sourceCode, "430c");
  assert.equal(mint.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(mint.fieldEvidence.fatG.sourceCode, "430c");
  assert.equal(mint.fieldEvidence.fibreG.sourceCode, "430c");
});

test("repository-native mint semantics establish generic gram-denominated fresh-herb inputs", () => {
  assert.equal(INGREDIENTS.mint.name, "mint");
  assert.ok(INGREDIENTS.mint.aliases.includes("menta"));
  const rows = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "mint"))
    .map(recipe => ({
      recipeId: recipe.id,
      ingredient: recipe.ingredients.find(ingredient => ingredient.canonicalIngredientId === "mint")
    }));
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.recipeId).sort(), [
    "middle_eastern_bulgur_chickpea_salad",
    "middle_eastern_lentil_bulgur_herb_bowl"
  ]);
  assert.ok(rows.every(row => row.ingredient.unit === "g"));
  assert.ok(rows.every(row => Number.isFinite(row.ingredient.quantity) && row.ingredient.quantity > 0));
});

test("B22 generic raw-mint identity does not bleed into species-specific or processed mint neighbors", () => {
  for (const unsupported of [
    "peppermint",
    "spearmint",
    "dried_mint",
    "mint_tea",
    "mint_extract",
    "mint_oil",
    "basil",
    "parsley"
  ]) {
    assert.equal(matvaretabellenCompositionB22ForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "proteinG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B22.id, unsupported);
  }
});

test("European-primary policy selects exact B22 mint provenance for every tracked nutrient", () => {
  const expectedCodes = {
    energyKcal: [],
    proteinG: ["430c"],
    carbohydrateG: ["MI0181"],
    fatG: ["430c"],
    fibreG: ["430c"]
  };
  for (const [nutrient, sourceCodes] of Object.entries(expectedCodes)) {
    const selection = selectEuropeanPrimaryNutrient("mint", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B22.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.259", nutrient);
    assert.equal(selection.evidenceTranche, "B22", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
    assert.deepEqual(selection.sourceCodes, sourceCodes, nutrient);
  }
  assert.equal(selectEuropeanPrimaryNutrient("mint", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  const coverage = europeanPrimaryPolicyCoverage(["mint"]);
  assert.equal(coverage.matvaretabellenB22SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 5);
});

test("B22 composition evidence does not authorize the source edible-part yield or a household portion", () => {
  const mint = matvaretabellenCompositionB22ForIngredient("mint");
  assert.equal(mint.gramsPerUnit, undefined);
  assert.equal(mint.units, undefined);
  assert.equal(mint.sourcePortionId, undefined);
  assert.equal(mint.ediblePartPercent, undefined);
});

test("B22 removes exactly two mint density blockers and unlocks only the bulgur-chickpea salad", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.authoritativeRecipeCount, 16);
  assert.equal(audit.estimateRecipeCount, 60);
  assert.equal(audit.blockerCounts.missing_density, 91);

  const salad = audit.recipeDetails.find(row => row.recipeId === "middle_eastern_bulgur_chickpea_salad");
  assert.equal(salad.authoritative, true);
  assert.deepEqual(salad.blockers, []);

  const lentilBowl = audit.recipeDetails.find(row => row.recipeId === "middle_eastern_lentil_bulgur_herb_bowl");
  assert.equal(lentilBowl.authoritative, false);
  assert.deepEqual(lentilBowl.blockers.map(blocker => [blocker.ingredientId, blocker.reason]), [
    ["lentils", "missing_density"]
  ]);
});

test("B22 available carbohydrate remains incompatible with USDA carbohydrate-by-difference", () => {
  const recipe = {
    ingredients: [
      { canonicalIngredientId: "mint", quantity: 100, unit: "g" },
      { canonicalIngredientId: "synthetic_usda", quantity: 100, unit: "g" }
    ],
    serving: { servings: 1 }
  };
  const densityMap = {
    mint: EUROPEAN_PRIMARY_DENSITIES_V1.mint,
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
