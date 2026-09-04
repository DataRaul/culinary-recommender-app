import test from "node:test";
import assert from "node:assert/strict";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { CIQUAL_2025_SOURCE, CIQUAL_DENSITIES_B4 } from "../src/data/ciqual-nutrients-b4.js";
import { CIQUAL_DENSITIES_B5 } from "../src/data/ciqual-nutrients-b5.js";
import { CIQUAL_DENSITIES_B7 } from "../src/data/ciqual-nutrients-b7.js";
import { USDA_FOUNDATION_DENSITIES } from "../src/data/nutrition-evidence.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import {
  CIQUAL_CANONICAL_DENSITIES,
  CIQUAL_CANONICAL_DENSITIES_B4,
  CIQUAL_CANONICAL_DENSITIES_B5,
  CIQUAL_CANONICAL_DENSITIES_B7,
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

test("B7 is a tiny recipe-unlock tranche with strict reviewed food forms", () => {
  assert.equal(Object.keys(CIQUAL_DENSITIES_B7).length, 3);
  assert.equal(CIQUAL_DENSITIES_B7.quinoa.alimCode, "9340");
  assert.equal(CIQUAL_DENSITIES_B7.quinoa.matchConfidence, "high");
  assert.equal(CIQUAL_DENSITIES_B7.prawns.alimCode, "10021");
  assert.equal(CIQUAL_DENSITIES_B7.prawns.nameEn, "Shrimp or prawn, raw");
  assert.equal(CIQUAL_DENSITIES_B7.orzo.alimCode, "9810");
  assert.equal(CIQUAL_DENSITIES_B7.orzo.matchConfidence, "medium");
  assert.match(CIQUAL_DENSITIES_B7.orzo.matchNotes, /category-level/);
  for (const deferred of ["barley", "courgette", "cottage_cheese", "salt", "smoked_paprika", "tortilla"]) {
    assert.equal(CIQUAL_DENSITIES_B7[deferred], undefined, `${deferred} remains deferred in the first recipe-unlock tranche`);
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
  assert.equal(CIQUAL_CANONICAL_DENSITIES_B7.quinoa.alimCode, "9340");
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

  const quinoa = nutritionEvidenceComparisonForIngredient("quinoa");
  assert.equal(quinoa.sources.usda, null);
  assert.equal(quinoa.sources.ciqual.sourceIdentifier, "9340");
  assert.equal(quinoa.sources.ciqual.evidenceTranche, "B7");
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
  const prawns = nutritionEvidenceComparisonForIngredient("prawns");
  assert.deepEqual(Object.values(prawns.sources.ciqual.confidenceCodes), ["D", "D", "D", "D", "D", "D"]);
});

test("coverage audit separates multi-source, single-source and Ciqual tranches deterministically", () => {
  const input = ["broccoli", "salmon", "black_beans", "olive_oil", "quinoa", "oregano", "broccoli"];
  const coverage = nutritionEvidenceComparisonCoverage(input);
  assert.equal(coverage.ingredientCount, 6);
  assert.equal(coverage.multiSourceCount, 1);
  assert.equal(coverage.usdaOnlyCount, 1);
  assert.equal(coverage.ciqualOnlyCount, 3);
  assert.equal(coverage.noEvidenceCount, 1);
  assert.equal(coverage.ciqualB4EvidenceCount, 2);
  assert.equal(coverage.ciqualB5EvidenceCount, 1);
  assert.equal(coverage.ciqualB7EvidenceCount, 1);
  assert.deepEqual(coverage, nutritionEvidenceComparisonCoverage(input));
});

test("B21 exact salmon completion yields a coherent European-primary calculation", () => {
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
  assert.deepEqual(estimate.perServing, {
    energyKcal: 193,
    proteinG: 20.5,
    carbohydrateG: 0,
    fatG: 12.4,
    fibreG: 0
  });
  assert.equal(estimate.method, "EUROPEAN_PRIMARY_STATIC_CALCULATION_V1");
  assert.equal(estimate.confidence, "medium");
  assert.equal(estimate.evidence.sources[1].runtimePolicy, "ELIGIBLE_VIA_EUROPEAN_PRIMARY_POLICY_V1");
  assert.equal(estimate.evidence.sources[1].evidenceIntroductionPolicy, "CORROBORATION_ONLY_NOT_PRIMARY");
  assert.deepEqual(estimate.evidence.sources[1].evidenceTranches, ["B4", "B5", "B7"]);
  assert.equal(estimate.evidence.staticCalculation.complete, true);
  assert.equal(estimate.evidence.sourceSelectionState, "EUROPEAN_PRIMARY_COMPLETE");
  assert.equal(estimate.evidence.europeanPrimaryCoverage.matvaretabellenB21SelectedCount, 2);
});

test("genuinely partial European evidence remains fail-closed after B21 completion", () => {
  const projectEstimate = AUTHORED_RECIPES[0].nutrition;
  const syntheticRecipe = {
    ingredients: [{ canonicalIngredientId: "lime", quantity: 100, unit: "g" }],
    serving: { servings: 1 },
    nutrition: projectEstimate
  };
  const estimate = publicNutritionSource.estimate(syntheticRecipe);
  assert.deepEqual(estimate.perServing, projectEstimate.perServing);
  assert.equal(estimate.method, projectEstimate.estimationState || "INFERRED_ESTIMATE");
  assert.equal(estimate.confidence, projectEstimate.confidence || "low");
  assert.equal(estimate.evidence.staticCalculation.complete, false);
  assert.equal(estimate.evidence.sourceSelectionState, "NO_COMPLETE_AUTHORITATIVE_RECIPE_CALCULATION");
  assert.deepEqual(estimate.evidence.staticCalculation.used[0].missingNutrients, ["fatG"]);
});
