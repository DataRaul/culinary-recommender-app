import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_AMBIGUOUS_PORTIONS_B6,
  MATVARETABELLEN_DEFERRED_PORTION_TARGETS_B6,
  MATVARETABELLEN_PORTION_EVIDENCE_B6,
  MATVARETABELLEN_PORTION_SOURCE_B6,
  matvaretabellenAmbiguousPortion,
  matvaretabellenPortionConversion
} from "../src/data/matvaretabellen-portions-b6.js";
import { USDA_SR_LEGACY_PORTION_SOURCE_B8 } from "../src/data/usda-sr-legacy-portions-b8.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { USDA_FOUNDATION_DENSITIES } from "../src/data/nutrition-evidence.js";
import { USDA_FOUNDATION_DENSITIES_V1 } from "../src/data/usda-foundation-nutrients-v1.js";

const expected = {
  lemon: { unit: "piece", grams: 80, foodId: "06.550" },
  garlic: { unit: "clove", grams: 3, foodId: "06.038" },
  olive_oil: { unit: "tbsp", grams: 10, foodId: "08.112" },
  tomato: { unit: "piece", grams: 95, foodId: "06.754" },
  bell_pepper: { unit: "piece", grams: 145, foodId: "06.047" },
  soy_sauce: { unit: "tbsp", grams: 13, foodId: "10.126" },
  onion: { unit: "piece", grams: 160, foodId: "06.042" },
  carrot: { unit: "piece", grams: 80, foodId: "06.036" },
  cucumber: { unit: "piece", grams: 325, foodId: "06.010" },
  eggs: { unit: "piece", grams: 55, foodId: "02.001" },
  spring_onion: { unit: "piece", grams: 19, foodId: "06.113" },
  curry_powder: { unit: "tsp", grams: 3, foodId: "06.158" },
  aubergine: { unit: "piece", grams: 285, foodId: "06.015" },
  mango: { unit: "piece", grams: 335, foodId: "06.542" }
};

test("Matvaretabellen B6 is a bounded attributed NLOD portion source", () => {
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B6.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B6.dataset, "Norwegian Food Composition Table 2026");
  assert.match(MATVARETABELLEN_PORTION_SOURCE_B6.licence, /NLOD/);
  assert.match(MATVARETABELLEN_PORTION_SOURCE_B6.attribution, /Norwegian Food Composition Table 2026/);
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B6.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B6.evidenceTranche, "B6");
});

test("all 14 promoted B6 conversions preserve exact reviewed source rows", () => {
  assert.equal(Object.keys(MATVARETABELLEN_PORTION_EVIDENCE_B6).length, 14);
  for (const [ingredientId, expectation] of Object.entries(expected)) {
    const record = MATVARETABELLEN_PORTION_EVIDENCE_B6[ingredientId];
    assert.ok(record, ingredientId);
    assert.equal(record.foodId, expectation.foodId, ingredientId);
    assert.equal(record.gramsPerUnit, expectation.grams, ingredientId);
    assert.equal(record.sourceId, MATVARETABELLEN_PORTION_SOURCE_B6.id, ingredientId);
    assert.equal(record.evidenceTranche, "B6", ingredientId);
    const conversion = matvaretabellenPortionConversion(ingredientId, expectation.unit);
    assert.equal(conversion?.gramsPerUnit, expectation.grams, ingredientId);
  }
});

test("singular/plural household units are accepted only where explicitly reviewed", () => {
  assert.equal(matvaretabellenPortionConversion("lemon", "pieces")?.gramsPerUnit, 80);
  assert.equal(matvaretabellenPortionConversion("garlic", "cloves")?.gramsPerUnit, 3);
  assert.equal(matvaretabellenPortionConversion("eggs", "pieces")?.gramsPerUnit, 55);
  assert.equal(matvaretabellenPortionConversion("olive_oil", "tsp"), null);
});

test("generic bell pepper uses exact cross-colour agreement rather than averaging", () => {
  const record = MATVARETABELLEN_PORTION_EVIDENCE_B6.bell_pepper;
  assert.deepEqual(record.supportingFoodRows.map(row => row.gramsPerUnit), [145, 145, 145]);
  assert.equal(record.gramsPerUnit, 145);
});

test("lime and avocado remain ambiguous instead of choosing convenient piece weights", () => {
  assert.deepEqual(MATVARETABELLEN_AMBIGUOUS_PORTIONS_B6.lime.candidateGramWeights, [17, 65]);
  assert.deepEqual(MATVARETABELLEN_AMBIGUOUS_PORTIONS_B6.avocado.candidateGramWeights, [130, 220]);
  assert.equal(matvaretabellenPortionConversion("lime", "piece"), null);
  assert.equal(matvaretabellenPortionConversion("avocado", "piece"), null);
  assert.deepEqual(matvaretabellenAmbiguousPortion("lime", "piece")?.candidateGramWeights, [17, 65]);

  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "lime", quantity: 1, unit: "piece" }],
    serving: { servings: 1 }
  }, { lime: { energyKcal: 30, proteinG: 1, carbohydrateG: 10, fatG: 0, fibreG: 2 } });
  assert.equal(result.complete, false);
  assert.equal(result.skipped[0].reason, "ambiguous_portion_unit");
  assert.deepEqual(result.skipped[0].quantityEvidence.candidateGramWeights, [17, 65]);
});

test("B6 deferred targets remain unsupported by B6 and no generic spoon arithmetic is introduced", () => {
  assert.ok(MATVARETABELLEN_DEFERRED_PORTION_TARGETS_B6["onion|small"]);
  assert.ok(MATVARETABELLEN_DEFERRED_PORTION_TARGETS_B6["sesame_oil|tsp"]);
  assert.ok(MATVARETABELLEN_DEFERRED_PORTION_TARGETS_B6["red_onion|piece"]);
  assert.equal(matvaretabellenPortionConversion("onion", "small"), null);
  assert.equal(matvaretabellenPortionConversion("sesame_oil", "tsp"), null);
  assert.equal(matvaretabellenPortionConversion("red_onion", "piece"), null);

  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "sesame_oil", quantity: 1, unit: "tsp" }],
    serving: { servings: 1 }
  }, { sesame_oil: { energyKcal: 900, proteinG: 0, carbohydrateG: 0, fatG: 100, fibreG: 0 } });
  assert.equal(result.complete, false);
  assert.equal(result.skipped[0].reason, "unsupported_quantity_unit");
});

test("runtime integrates B6 quantity provenance without replacing existing USDA banana conversion", () => {
  const eggResult = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "eggs", quantity: 2, unit: "pieces" }],
    serving: { servings: 1 }
  }, USDA_FOUNDATION_DENSITIES);
  assert.equal(eggResult.used[0].grams, 110);
  assert.equal(eggResult.used[0].quantityEvidence.sourceId, MATVARETABELLEN_PORTION_SOURCE_B6.id);
  assert.equal(eggResult.used[0].quantityEvidence.foodId, "02.001");

  const bananaResult = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "banana", quantity: 1, unit: "piece" }],
    serving: { servings: 1 }
  }, USDA_FOUNDATION_DENSITIES_V1);
  assert.equal(bananaResult.used[0].grams, 115);
  assert.equal(bananaResult.used[0].quantityEvidence.state, "USDA_FOUNDATION_PORTION_MATCH");
  assert.notEqual(bananaResult.used[0].quantityEvidence.sourceId, MATVARETABELLEN_PORTION_SOURCE_B6.id);
});

test("public nutrition evidence exposes all bounded portion sources without making SR Legacy a composition source", () => {
  const estimate = publicNutritionSource.estimate({
    ingredients: [{ canonicalIngredientId: "banana", quantity: 100, unit: "g" }],
    serving: { servings: 1 },
    nutrition: { perServing: { energyKcal: 1 }, estimationState: "INFERRED_ESTIMATE", confidence: "low" }
  });
  assert.equal(estimate.evidence.portionSources.length, 3);
  assert.equal(estimate.evidence.portionSources[1].id, MATVARETABELLEN_PORTION_SOURCE_B6.id);
  assert.equal(estimate.evidence.portionSources[2].id, USDA_SR_LEGACY_PORTION_SOURCE_B8.id);
  assert.equal(USDA_SR_LEGACY_PORTION_SOURCE_B8.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal(estimate.evidence.sources.some(source => source.id === USDA_SR_LEGACY_PORTION_SOURCE_B8.id), false);
});
