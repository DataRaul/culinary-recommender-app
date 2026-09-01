import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12,
  MATVARETABELLEN_COMPOSITION_SOURCE_B12,
  matvaretabellenCompositionB12CompletionForIngredient
} from "../src/data/matvaretabellen-composition-b12.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1, europeanPrimaryPolicyCoverage, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B12 source is explicit static Matvaretabellen field-completion evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B12.id, "matvaretabellen-2026-composition-b12");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B12.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B12.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B12.evidenceTranche, "B12");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B12.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B12.runtimePolicy, "ELIGIBLE_ONLY_WHEN_EXISTING_REVIEWED_PRIMARY_FIELD_IS_MISSING");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B12.license, /NLOD 2\.0/);
});

test("B12 admits only exact extra-virgin olive oil", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B12), ["olive_oil"]);
  const record = matvaretabellenCompositionB12CompletionForIngredient("olive_oil");
  assert.equal(record.foodId, "08.112");
  assert.equal(record.foodName, "Oil, olive, Extra Virgin");
  assert.equal(record.scientificName, "Olea europea L.");
  assert.equal(record.foodEx2, "Olive oil, virgin or extra-virgin (A036Q)");
  assert.equal(record.matchConfidence, "high");
  assert.deepEqual(record.per100g, {
    energyKcal: 889,
    proteinG: 0,
    carbohydrateG: 0,
    fatG: 98.8,
    fibreG: 0
  });
  assert.equal(record.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(record.fieldEvidence.fatG.sourceCode, "210");
  assert.equal(record.fieldEvidence.proteinG.sourceCode, "50");
  assert.equal(record.fieldEvidence.fibreG.sourceCode, "50");
  assert.equal(matvaretabellenCompositionB12CompletionForIngredient("neutral_oil"), null);
  assert.equal(matvaretabellenCompositionB12CompletionForIngredient("sesame_oil"), null);
});

test("B12 fills only missing olive-oil carbohydrate and never displaces populated Ciqual B5 evidence", () => {
  for (const nutrient of ["energyKcal", "proteinG", "fatG", "fibreG"]) {
    const selection = selectEuropeanPrimaryNutrient("olive_oil", nutrient);
    assert.equal(selection.source, "ciqual", nutrient);
    assert.equal(selection.evidenceTranche, "B5", nutrient);
    assert.notEqual(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B12.id, nutrient);
  }

  const carbohydrate = selectEuropeanPrimaryNutrient("olive_oil", "carbohydrateG");
  assert.equal(carbohydrate.source, "matvaretabellen");
  assert.equal(carbohydrate.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B12.id);
  assert.equal(carbohydrate.sourceIdentifier, "08.112");
  assert.equal(carbohydrate.evidenceTranche, "B12");
  assert.equal(carbohydrate.value, 0);
  assert.equal(carbohydrate.semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  assert.equal(carbohydrate.selectionReason, "EUROPEAN_EXACT_FIELD_COMPLETION");
  assert.deepEqual(carbohydrate.sourceCodes, ["MI0181"]);
});

test("B12 provenance is visible without changing the separate B6 portion contract", () => {
  const oliveOil = EUROPEAN_PRIMARY_DENSITIES_V1.olive_oil;
  assert.ok(oliveOil);
  assert.equal(oliveOil.provenanceByNutrient.carbohydrateG.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B12.id);
  assert.equal(oliveOil.provenanceByNutrient.carbohydrateG.sourceIdentifier, "08.112");
  assert.equal(oliveOil.provenanceByNutrient.carbohydrateG.evidenceTranche, "B12");
  assert.equal(oliveOil.provenanceByNutrient.energyKcal.source, "ciqual");

  const coverage = europeanPrimaryPolicyCoverage(["olive_oil"]);
  assert.equal(coverage.matvaretabellenB12SelectedCount, 1);
  assert.equal(coverage.ciqualB5SelectedCount, 4);
});
