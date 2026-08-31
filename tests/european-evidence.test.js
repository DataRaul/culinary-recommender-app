import test from "node:test";
import assert from "node:assert/strict";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { CIQUAL_2025_SOURCE, CIQUAL_DENSITIES_B4 } from "../src/data/ciqual-nutrients-b4.js";
import { CIQUAL_DENSITIES_B5 } from "../src/data/ciqual-nutrients-b5.js";
import { USDA_FOUNDATION_DENSITIES } from "../src/data/nutrition-evidence.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import {
  CIQUAL_CANONICAL_DENSITIES,
  CIQUAL_CANONICAL_DENSITIES_B4,
  CIQUAL_CANONICAL_DENSITIES_B5,
  nutritionEvidenceComparisonForIngredient,
  nutritionEvidenceComparisonCoverage
} from "../src/domain/nutrition-evidence-comparison.js";

test("Ciqual 2025 frozen B4 source snapshot preserves official identity, licence, attribution and introduction policy", () => {
  assert.equal(CIQUAL_2025_SOURCE.datasetDoi, "10.57745/RDMHWY");
  assert.equal(CIQUAL_2025_SOURCE.releaseDate, "2025-11-19");
  assert.equal(CIQUAL_2025_SOURCE.license, "Etalab Open Licence 2.0");
  assert.ok(CIQUAL_2025_SOURCE.requiredAttribution.includes("Anses. 2025"));
  assert.equal(CIQUAL_2025_SOURCE.runtimePolicy, "CORROBORATION_ONLY_NOT_PRIMARY");
  assert.equal(Object.keys(CIQUAL_DENSITIES_B4).length, 32);
});

test("B5 adds only strictly reviewed Ciqual forms and deliberately leaves weak matches unpromoted", () => {
  assert.equal(Object.keys(CIQUAL_DENSITIES_B5).length, 22);
  assert.equal(CIQUAL_DENSITIES_B5.olive_oil.alimCode, "17270");
  assert.equal(CIQUAL_DENSITIES_B5.tomato.alimCode, "20385");
  assert.equal(CIQUAL_DENSITIES_B5.chickpeas.alimCode, "20532");
  assert.equal(CIQUAL_DENSITIES_B5.hake.alimCode, "26044");
  for (const deferred of ["cumin", "smoked_paprika", "tofu_firm", "lentils", "noodles", "red_lentils", "turkey_mince", "edamame"]) {
    assert.equal(CIQUAL_DENSITIES_B5[deferred], undefined, `${deferred} should remain deferred rather than use a weak/form-mismatched candidate`);
  }
});

test("Ciqual extraction aliases normalize to canonical ingredient IDs before comparison", () => {
  assert.equal(CIQUAL_CANONICAL_DENSITIES_B4.eggs.alimCode, "22000");
  assert.equal(CIQUAL_CANONICAL_DENSITIES_B4.mushroom.alimCode, "20056");
  assert.equal(CIQUAL_CANONICAL_DENSITIES_B4.greek_yogurt.alimCode, "19860");
  assert.equal(CIQUAL_CANONICAL_DENSITIES_B4.egg, undefined);
  assert.equal(CIQUAL_CANONICAL_DENSITIES_B4.mushrooms, undefined);
  assert.equal(CIQUAL_CANONICAL_DENSITIES_B4.yogurt, undefined);
  assert.equal(CIQUAL_CANONICAL_DENSITIES_B5.olive_oil.alimCode, "17270");
  for (const ingredientId of Object.keys(CIQUAL_CANONICAL_DENSITIES)) {
    assert.ok(INGREDIENTS[ingredientId], `Ciqual evidence references unknown canonical ingredient ${ingredientId}`);
  }
});

test("carbohydrate semantics are never compared as if Ciqual CHOAVL equalled USDA carbohydrate by difference", () => {
  const broccoli = nutritionEvidenceComparisonForIngredient("broccoli");
  assert.ok(broccoli.sources.usda);
  assert.ok(broccoli.sources.ciqual);
  assert.equal(broccoli.nutrients.carbohydrate.comparability, "NOT_DIRECTLY_COMPARABLE_USDA_BY_DIFFERENCE_VS_CIQUAL_AVAILABLE");
  assert.equal(broccoli.nutrients.carbohydrate.relativeDifferencePct, null);
  assert.equal(CIQUAL_2025_SOURCE.trackedSemantics.carbohydrateAvailableG.infoodsCode, "CHOAVL");
});

test("comparison exposes multi-source disagreement and method caveats instead of averaging", () => {
  const tuna = nutritionEvidenceComparisonForIngredient("tuna");
  assert.equal(tuna.primarySelectionPolicy, "COMPARISON_ONLY_SELECTION_SEPARATE");
  assert.equal(tuna.state, "MULTI_SOURCE_FORM_CAVEAT");
  assert.equal(tuna.sources.usda.per100g.energyKcal, 90);
  assert.equal(tuna.sources.ciqual.per100g.energyJonesWithFibreKcal, 143);
  assert.ok(tuna.nutrients.energy.relativeDifferencePct > 40);
  assert.equal(tuna.nutrients.energy.comparability, "METHOD_DIFFERENT_COMPARE_WITH_CAUTION");
  assert.equal(tuna.sources.ciqual.matchConfidence, "medium");
  assert.equal(tuna.sources.ciqual.evidenceTranche, "B4");
});

test("Ciqual can add European evidence without fabricating a USDA match", () => {
  assert.equal(USDA_FOUNDATION_DENSITIES.salmon, undefined);
  const salmon = nutritionEvidenceComparisonForIngredient("salmon");
  assert.equal(salmon.state, "SINGLE_SOURCE_EVIDENCE");
  assert.equal(salmon.sources.usda, null);
  assert.equal(salmon.sources.ciqual.sourceIdentifier, "26036");
  assert.equal(salmon.sources.ciqual.description, "Salmon, raw, farmed");
  assert.equal(salmon.sources.ciqual.evidenceTranche, "B4");

  const hake = nutritionEvidenceComparisonForIngredient("hake");
  assert.equal(hake.sources.usda, null);
  assert.equal(hake.sources.ciqual.sourceIdentifier, "26044");
  assert.equal(hake.sources.ciqual.evidenceTranche, "B5");
});

test("Ciqual per-field confidence codes are preserved as evidence rather than collapsed to one source score", () => {
  const milk = nutritionEvidenceComparisonForIngredient("milk");
  assert.deepEqual(Object.values(milk.sources.ciqual.confidenceCodes), ["D", "D", "D", "D", "D", "D"]);
  const broccoli = nutritionEvidenceComparisonForIngredient("broccoli");
  assert.equal(broccoli.sources.ciqual.confidenceCodes.proteinJonesG, "C");
  assert.equal(broccoli.sources.ciqual.confidenceCodes.fibreG, "B");
  const chickpeas = nutritionEvidenceComparisonForIngredient("chickpeas");
  assert.equal(chickpeas.sources.ciqual.confidenceCodes.proteinJonesG, "C");
  assert.equal(chickpeas.sources.ciqual.confidenceCodes.fibreG, "C");
});

test("coverage audit separates multi-source, single-source, B4/B5 and missing evidence deterministically", () => {
  const input = ["broccoli", "salmon", "black_beans", "olive_oil", "oregano", "broccoli"];
  const coverage = nutritionEvidenceComparisonCoverage(input);
  assert.equal(coverage.ingredientCount, 5);
  assert.equal(coverage.multiSourceCount, 1);
  assert.equal(coverage.usdaOnlyCount, 1);
  assert.equal(coverage.ciqualOnlyCount, 2);
  assert.equal(coverage.noEvidenceCount, 1);
  assert.equal(coverage.ciqualB4EvidenceCount, 2);
  assert.equal(coverage.ciqualB5EvidenceCount, 1);
  assert.deepEqual(coverage, nutritionEvidenceComparisonCoverage(input));
});

test("partial Ciqual-only evidence remains fail-closed after European-primary authorization", () => {
  const syntheticRecipe = {
    ingredients: [{ canonicalIngredientId: "salmon", quantity: 100, unit: "g" }],
    serving: { servings: 1 },
    nutrition: {
      perServing: { energyKcal: 205, proteinG: 22, carbohydrateG: 0, fatG: 13, fibreG: 0 },
      estimationState: "INFERRED_ESTIMATE",
      confidence: "low",
      provenance: "Project-authored estimate."
    }
  };
  const estimate = publicNutritionSource.estimate(syntheticRecipe);
  assert.deepEqual(estimate.perServing, syntheticRecipe.nutrition.perServing);
  assert.equal(estimate.method, "INFERRED_ESTIMATE");
  assert.equal(estimate.confidence, "low");
  assert.equal(estimate.evidence.sourcePolicy.id, "european-primary-v1");
  assert.equal(estimate.evidence.sources[1].runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.equal(estimate.evidence.sources[1].evidenceIntroductionPolicy, "CORROBORATION_ONLY_NOT_PRIMARY");
  assert.deepEqual(estimate.evidence.sources[1].evidenceTranches, ["B4", "B5"]);
  assert.equal(estimate.evidence.staticCalculation.complete, false);
  assert.equal(estimate.evidence.coverage.mappedIngredientIds.includes("salmon"), false);
});
