import test from "node:test";
import assert from "node:assert/strict";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10,
  MATVARETABELLEN_COMPOSITION_SOURCE_B10,
  matvaretabellenCompositionCompletionForIngredient
} from "../src/data/matvaretabellen-composition-b10.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { EUROPEAN_PRIMARY_POLICY_V1, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B10 source is explicit static Matvaretabellen field-completion evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B10.id, "matvaretabellen-2026-composition-b10");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B10.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B10.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B10.evidenceTranche, "B10");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B10.runtimeFetch, false);
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B10.license, /NLOD 2\.0/);
  assert.match(EUROPEAN_PRIMARY_POLICY_V1.fieldCompletionRule, /MISSING_FROM_ALL_EXISTING_REVIEWED_USDA_AND_CIQUAL/);
});

test("B10 admits only the exact raw edible lemon record", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B10), ["lemon"]);
  const record = matvaretabellenCompositionCompletionForIngredient("lemon");
  assert.equal(record.foodId, "06.550");
  assert.equal(record.foodName, "Lemon, raw");
  assert.equal(record.scientificName, "Citrus limon (L.) Burm.f.");
  assert.equal(record.matchConfidence, "high");
  assert.deepEqual(record.per100g, {
    energyKcal: 23,
    proteinG: 1.1,
    carbohydrateG: 2.5,
    fatG: 0.3,
    fibreG: 3
  });
  assert.equal(record.fieldEvidence.fatG.sourceCode, "460e");
  assert.equal(record.fieldEvidence.fibreG.sourceCode, "460e");
  assert.equal(matvaretabellenCompositionCompletionForIngredient("lime"), null);
  assert.equal(matvaretabellenCompositionCompletionForIngredient("lemon_juice"), null);
});

test("B10 fills only missing lemon fields and never displaces populated Ciqual evidence", () => {
  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG"]) {
    const selection = selectEuropeanPrimaryNutrient("lemon", nutrient);
    assert.equal(selection.source, "ciqual", nutrient);
    assert.equal(selection.evidenceTranche, "B5", nutrient);
    assert.equal(selection.selectionReason, "ONLY_REVIEWED_SOURCE_AVAILABLE", nutrient);
  }

  for (const nutrient of ["fatG", "fibreG"]) {
    const selection = selectEuropeanPrimaryNutrient("lemon", nutrient);
    assert.equal(selection.source, "matvaretabellen", nutrient);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B10.id, nutrient);
    assert.equal(selection.sourceIdentifier, "06.550", nutrient);
    assert.equal(selection.evidenceTranche, "B10", nutrient);
    assert.equal(selection.selectionReason, "EUROPEAN_EXACT_FIELD_COMPLETION", nutrient);
  }
});

test("exact B10 lemon completion unlocks the one-key authored mushroom-pea orzo through actual calculation", () => {
  const recipe = AUTHORED_RECIPES.find(item => item.id === "italian_mushroom_pea_orzo");
  assert.ok(recipe);
  const estimate = publicNutritionSource.estimate(recipe);
  assert.equal(estimate.method, "EUROPEAN_PRIMARY_STATIC_CALCULATION_V1");
  assert.equal(estimate.evidence.sourceSelectionState, "EUROPEAN_PRIMARY_COMPLETE");
  assert.equal(estimate.evidence.state, "AUTHORITATIVE_STATIC_RECIPE_CALCULATION_AVAILABLE");
  const lemon = estimate.evidence.staticCalculation.used.find(item => item.ingredientId === "lemon");
  assert.ok(lemon);
  assert.equal(lemon.grams, 40);
  assert.equal(lemon.quantityEvidence.sourceId, "matvaretabellen-2026-portions-b6");
  assert.equal(lemon.provenanceByNutrient.energyKcal.source, "ciqual");
  assert.equal(lemon.provenanceByNutrient.fatG.source, "matvaretabellen");
  assert.equal(lemon.provenanceByNutrient.fatG.evidenceTranche, "B10");
  assert.equal(lemon.provenanceByNutrient.fibreG.sourceIdentifier, "06.550");
});
