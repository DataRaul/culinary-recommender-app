import test from "node:test";
import assert from "node:assert/strict";
import {
  MEXT_COMPOSITION_DENSITIES_B48,
  MEXT_COMPOSITION_SOURCE_B48,
  mextCompositionB48ForIngredient
} from "../src/data/mext-composition-b48.js";
import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";
import { selectEuropeanPrimaryNutrient as selectBaseEuropeanPrimaryNutrient } from "../src/domain/nutrition-source-policy.js";

test("B48 source is explicit bounded MEXT fish-sauce composition evidence", () => {
  assert.equal(MEXT_COMPOSITION_SOURCE_B48.id, "mext-standard-tables-2023-composition-b48");
  assert.equal(MEXT_COMPOSITION_SOURCE_B48.authority, "Ministry of Education, Culture, Sports, Science and Technology (MEXT), Japan");
  assert.equal(MEXT_COMPOSITION_SOURCE_B48.evidenceTranche, "B48");
  assert.equal(MEXT_COMPOSITION_SOURCE_B48.runtimeFetch, false);
  assert.equal(MEXT_COMPOSITION_SOURCE_B48.state, "BOUNDED_STATIC_REVIEWED_COMPOSITION_EVIDENCE");
  assert.equal(MEXT_COMPOSITION_SOURCE_B48.carbohydrateSemantic, "AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF");
  assert.match(MEXT_COMPOSITION_SOURCE_B48.reuseTerms, /freely used/i);
});

test("B48 admits exactly MEXT food 17107 Nam pla fish sauce with all tracked fields", () => {
  assert.deepEqual(Object.keys(MEXT_COMPOSITION_DENSITIES_B48), ["fish_sauce"]);
  const record = mextCompositionB48ForIngredient("fish_sauce");
  assert.equal(record.foodId, "17107");
  assert.equal(record.foodName, "Nam pla (fish sauce)");
  assert.equal(record.sourceCategory, "SEASONINGS AND SPICES/Seasoning sauce/Nam pla (fish sauce)");
  assert.equal(record.matchConfidence, "high");
  assert.deepEqual(record.per100g, {
    energyKcal: 47,
    proteinG: 9.1,
    carbohydrateG: 5.5,
    fatG: 0.1,
    fibreG: 0
  });
  assert.equal(record.fieldEvidence.carbohydrateG.sourceCode, "CHOAVLDF-");
  assert.equal(record.fieldEvidence.fibreG.valueType, "Published estimated zero");
});

test("B48 exact fish-sauce identity does not bleed into neighboring sauces or fish products", () => {
  assert.equal(INGREDIENTS.fish_sauce.name, "fish sauce");
  assert.equal(normalizeIngredient("fish sauce"), "fish_sauce");
  assert.equal(normalizeIngredient("salsa de pescado"), "fish_sauce");
  assert.equal(selectBaseEuropeanPrimaryNutrient("fish_sauce", "proteinG"), null);
  for (const unsupported of ["soy_sauce", "oyster_sauce", "fish_stock", "sardines", "nam_prik", "fermented_fish_paste"]) {
    assert.equal(mextCompositionB48ForIngredient(unsupported), null, unsupported);
    assert.notEqual(selectEuropeanPrimaryNutrient(unsupported, "proteinG")?.sourceId, MEXT_COMPOSITION_SOURCE_B48.id, unsupported);
  }
});

test("runtime selects B48 MEXT provenance without miscounting it as Matvaretabellen", () => {
  const expectedSemantics = {
    energyKcal: "ENERGY_MEXT_PUBLISHED",
    proteinG: "PROTEIN_MEXT",
    carbohydrateG: "AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF",
    fatG: "TOTAL_FAT",
    fibreG: "DIETARY_FIBRE_MEXT"
  };
  for (const [nutrient, semantic] of Object.entries(expectedSemantics)) {
    const selection = selectEuropeanPrimaryNutrient("fish_sauce", nutrient);
    assert.equal(selection.source, "mext", nutrient);
    assert.equal(selection.sourceId, MEXT_COMPOSITION_SOURCE_B48.id, nutrient);
    assert.equal(selection.sourceIdentifier, "17107", nutrient);
    assert.equal(selection.evidenceTranche, "B48", nutrient);
    assert.equal(selection.semantic, semantic, nutrient);
    assert.equal(selection.formConfidence, "high", nutrient);
  }
  assert.deepEqual(EUROPEAN_PRIMARY_DENSITIES_V1.fish_sauce.per100g, {
    energyKcal: 47,
    proteinG: 9.1,
    carbohydrateG: 5.5,
    fatG: 0.1,
    fibreG: 0
  });
  const coverage = europeanPrimaryPolicyCoverage(["fish_sauce"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.mextSelectedCount, 5);
  assert.equal(coverage.mextB48SelectedCount, 5);
  assert.equal(coverage.matvaretabellenSelectedCount, 0);
});

test("B48 composition grants no household portion, density or yield authority", () => {
  const record = mextCompositionB48ForIngredient("fish_sauce");
  assert.equal(record.gramsPerUnit, undefined);
  assert.equal(record.units, undefined);
  assert.equal(record.sourcePortionId, undefined);
  assert.equal(record.ediblePartPercent, undefined);
  assert.equal(record.cookedYieldFactor, undefined);
});
