import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13,
  MATVARETABELLEN_COMPOSITION_SOURCE_B13,
  matvaretabellenCompositionB13CompletionForIngredient
} from "../src/data/matvaretabellen-composition-b13.js";
import { europeanPrimaryPolicyCoverage, selectEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B13 source is explicit static Matvaretabellen field-completion evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B13.id, "matvaretabellen-2026-composition-b13");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B13.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B13.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B13.evidenceTranche, "B13");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B13.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B13.runtimePolicy, "ELIGIBLE_ONLY_WHEN_EXISTING_REVIEWED_PRIMARY_FIELD_IS_MISSING");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B13.license, /NLOD 2\.0/);
});

test("B13 admits exactly generic raw tomato and raw cherry tomato", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B13), ["tomato", "cherry_tomato"]);

  const tomato = matvaretabellenCompositionB13CompletionForIngredient("tomato");
  assert.equal(tomato.foodId, "06.754");
  assert.equal(tomato.foodName, "Tomato, unspecified, raw");
  assert.equal(tomato.scientificName, "Lycopersicon esculentum Mill.");
  assert.deepEqual(tomato.foodEx2Facets, ["Unspecified (A07XD)", "Raw, no heat treatment (A07HS)"]);
  assert.deepEqual(tomato.per100g, {
    energyKcal: 12,
    proteinG: 0.4,
    carbohydrateG: 2.1,
    fatG: 0,
    fibreG: 1
  });
  assert.equal(tomato.fieldEvidence.fatG.sourceCode, "235");

  const cherry = matvaretabellenCompositionB13CompletionForIngredient("cherry_tomato");
  assert.equal(cherry.foodId, "06.752");
  assert.equal(cherry.foodName, "Tomato, small, cherry, imported, raw");
  assert.equal(cherry.foodEx2, "Cherry tomatoes (A00HY)");
  assert.deepEqual(cherry.per100g, {
    energyKcal: 17,
    proteinG: 0.6,
    carbohydrateG: 2.5,
    fatG: 0.2,
    fibreG: 1
  });
  assert.equal(cherry.fieldEvidence.fatG.sourceCode, "20");
});

test("B13 fills only missing fat and never displaces populated Ciqual B5 evidence", () => {
  const expectedIds = { tomato: "06.754", cherry_tomato: "06.752" };
  for (const [ingredientId, foodId] of Object.entries(expectedIds)) {
    for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fibreG"]) {
      const selection = selectEuropeanPrimaryNutrient(ingredientId, nutrient);
      assert.equal(selection.source, "ciqual", `${ingredientId}:${nutrient}`);
      assert.equal(selection.evidenceTranche, "B5", `${ingredientId}:${nutrient}`);
      assert.notEqual(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B13.id, `${ingredientId}:${nutrient}`);
    }

    const fat = selectEuropeanPrimaryNutrient(ingredientId, "fatG");
    assert.equal(fat.source, "matvaretabellen", ingredientId);
    assert.equal(fat.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B13.id, ingredientId);
    assert.equal(fat.sourceIdentifier, foodId, ingredientId);
    assert.equal(fat.evidenceTranche, "B13", ingredientId);
    assert.equal(fat.semantic, "TOTAL_FAT", ingredientId);
    assert.equal(fat.selectionReason, "EUROPEAN_EXACT_FIELD_COMPLETION", ingredientId);
  }
});

test("B13 cannot bleed tomato evidence into neighboring canonical identities", () => {
  for (const unsupported of ["passata", "canned_tomato", "tomato_puree", "sun_dried_tomato", "smoked_paprika"]) {
    assert.equal(matvaretabellenCompositionB13CompletionForIngredient(unsupported), null, unsupported);
    assert.notEqual(selectEuropeanPrimaryNutrient(unsupported, "fatG")?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B13.id, unsupported);
  }
});

test("B13 provenance counts exactly two selected completion fields", () => {
  const coverage = europeanPrimaryPolicyCoverage(["tomato", "cherry_tomato"]);
  assert.equal(coverage.matvaretabellenB13SelectedCount, 2);
  assert.equal(coverage.matvaretabellenSelectedCount, 2);
  assert.equal(coverage.ciqualB5SelectedCount, 8);
});
