import test from "node:test";
import assert from "node:assert/strict";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B34,
  MATVARETABELLEN_COMPOSITION_SOURCE_B34,
  matvaretabellenCompositionB34CompletionForIngredient
} from "../src/data/matvaretabellen-composition-b34.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";
import { selectEuropeanPrimaryNutrient as selectBaseEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B34 source is explicit bounded Matvaretabellen field-completion evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B34.id, "matvaretabellen-2026-composition-b34");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B34.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B34.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B34.evidenceTranche, "B34");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B34.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B34.state, "BOUNDED_STATIC_REVIEWED_FIELD_COMPLETION_EVIDENCE");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B34.license, /NLOD 2\.0/);
});

test("B34 admits only exact raw spring onion and raw peeled/pitted mango completion identities", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B34), ["spring_onion", "mango"]);

  const springOnion = matvaretabellenCompositionB34CompletionForIngredient("spring_onion");
  assert.equal(springOnion.foodId, "06.113");
  assert.equal(springOnion.foodName, "Scallion, spring onion, raw");
  assert.equal(springOnion.scientificName, "Allium cepa L.");
  assert.equal(springOnion.foodEx2, "Spring onions (A00HH)");
  assert.deepEqual(springOnion.eligibleCompletionFields, ["energyKcal", "carbohydrateG", "fatG"]);
  assert.equal(springOnion.per100g.energyKcal, 23);
  assert.equal(springOnion.per100g.carbohydrateG, 2.3);
  assert.equal(springOnion.per100g.fatG, 0.2);
  assert.equal(springOnion.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(springOnion.fieldEvidence.fatG.sourceCode, "460g");

  const mango = matvaretabellenCompositionB34CompletionForIngredient("mango");
  assert.equal(mango.foodId, "06.542");
  assert.equal(mango.foodName, "Mango, raw");
  assert.equal(mango.scientificName, "Mangifera indica L.");
  assert.equal(mango.foodEx2, "Mangoes (A01LF)");
  assert.deepEqual(mango.eligibleCompletionFields, ["fatG"]);
  assert.equal(mango.per100g.fatG, 0.3);
  assert.equal(mango.fieldEvidence.fatG.sourceCode, "610");
});

test("B34 only fills fields that were genuinely absent from the frozen reviewed primary policy", () => {
  for (const nutrient of ["energyKcal", "carbohydrateG", "fatG"]) {
    assert.equal(selectBaseEuropeanPrimaryNutrient("spring_onion", nutrient), null, `spring_onion.${nutrient}`);
  }
  assert.equal(selectBaseEuropeanPrimaryNutrient("mango", "fatG"), null);

  assert.ok(selectBaseEuropeanPrimaryNutrient("spring_onion", "proteinG"));
  assert.ok(selectBaseEuropeanPrimaryNutrient("spring_onion", "fibreG"));
  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fibreG"]) {
    assert.ok(selectBaseEuropeanPrimaryNutrient("mango", nutrient), `mango.${nutrient}`);
  }
});

test("runtime selects B34 only for the four explicitly eligible missing fields", () => {
  const expected = [
    ["spring_onion", "energyKcal", 23, []],
    ["spring_onion", "carbohydrateG", 2.3, ["MI0181"]],
    ["spring_onion", "fatG", 0.2, ["460g"]],
    ["mango", "fatG", 0.3, ["610"]]
  ];
  for (const [ingredientId, nutrient, value, sourceCodes] of expected) {
    const selection = selectEuropeanPrimaryNutrient(ingredientId, nutrient);
    assert.equal(selection.source, "matvaretabellen", `${ingredientId}.${nutrient}`);
    assert.equal(selection.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B34.id, `${ingredientId}.${nutrient}`);
    assert.equal(selection.evidenceTranche, "B34", `${ingredientId}.${nutrient}`);
    assert.equal(selection.value, value, `${ingredientId}.${nutrient}`);
    assert.equal(selection.selectionReason, "EUROPEAN_EXACT_FIELD_COMPLETION", `${ingredientId}.${nutrient}`);
    assert.deepEqual(selection.sourceCodes, sourceCodes, `${ingredientId}.${nutrient}`);
  }
  assert.equal(selectEuropeanPrimaryNutrient("spring_onion", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");

  const coverage = europeanPrimaryPolicyCoverage(["spring_onion", "mango"]);
  assert.equal(coverage.matvaretabellenB34SelectedCount, 4);
  const b34 = coverage.selections.filter(selection => selection.evidenceTranche === "B34");
  assert.deepEqual(b34.map(selection => [selection.ingredientId, selection.nutrient]), [
    ["spring_onion", "energyKcal"],
    ["spring_onion", "carbohydrateG"],
    ["spring_onion", "fatG"],
    ["mango", "fatG"]
  ]);
});

test("B34 preserves populated USDA spring-onion and Ciqual mango fields instead of replacing whole records", () => {
  assert.equal(EUROPEAN_PRIMARY_DENSITIES_V1.spring_onion.provenanceByNutrient.proteinG.source, "usda");
  assert.equal(EUROPEAN_PRIMARY_DENSITIES_V1.spring_onion.provenanceByNutrient.fibreG.source, "usda");
  assert.equal(EUROPEAN_PRIMARY_DENSITIES_V1.spring_onion.provenanceByNutrient.energyKcal.evidenceTranche, "B34");
  assert.equal(EUROPEAN_PRIMARY_DENSITIES_V1.spring_onion.provenanceByNutrient.carbohydrateG.evidenceTranche, "B34");
  assert.equal(EUROPEAN_PRIMARY_DENSITIES_V1.spring_onion.provenanceByNutrient.fatG.evidenceTranche, "B34");

  for (const nutrient of ["energyKcal", "proteinG", "carbohydrateG", "fibreG"]) {
    assert.equal(EUROPEAN_PRIMARY_DENSITIES_V1.mango.provenanceByNutrient[nutrient].source, "ciqual", nutrient);
  }
  assert.equal(EUROPEAN_PRIMARY_DENSITIES_V1.mango.provenanceByNutrient.fatG.evidenceTranche, "B34");
});

test("B34 completion evidence grants no new quantity, edible-yield or neighboring-identity authority", () => {
  for (const ingredientId of ["spring_onion", "mango"]) {
    const record = matvaretabellenCompositionB34CompletionForIngredient(ingredientId);
    assert.equal(record.gramsPerUnit, undefined, ingredientId);
    assert.equal(record.units, undefined, ingredientId);
    assert.equal(record.ediblePartPercent, undefined, ingredientId);
    assert.equal(record.cookedYieldFactor, undefined, ingredientId);
  }
  for (const unsupported of ["onion", "red_onion", "leek", "green_onion_powder", "mango_puree", "dried_mango", "mango_juice"]) {
    assert.equal(matvaretabellenCompositionB34CompletionForIngredient(unsupported), null, unsupported);
  }
});

test("B34 target completion remains tranche-local as later cumulative evidence evolves", () => {
  const springUses = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "spring_onion"));
  const mangoUses = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "mango"));
  assert.equal(springUses.length, 5);
  assert.equal(mangoUses.length, 2);

  for (const [ingredientId, nutrient] of [
    ["spring_onion", "energyKcal"],
    ["spring_onion", "carbohydrateG"],
    ["spring_onion", "fatG"],
    ["mango", "fatG"]
  ]) {
    assert.equal(selectEuropeanPrimaryNutrient(ingredientId, nutrient)?.evidenceTranche, "B34", `${ingredientId}.${nutrient}`);
  }
});
