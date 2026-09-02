import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_PORTION_EVIDENCE_B15,
  MATVARETABELLEN_PORTION_SOURCE_B15,
  matvaretabellenPortionConversionB15
} from "../src/data/matvaretabellen-portions-b15.js";
import { calculatePerServingFromDensities } from "../src/domain/nutrition.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1 } from "../src/domain/nutrition-source-policy.js";

test("B15 is a separate bounded static portion-evidence source", () => {
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B15.id, "matvaretabellen-2026-portions-b15");
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B15.evidenceTranche, "B15");
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B15.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B15.state, "BOUNDED_STATIC_PORTION_EVIDENCE_BUNDLED");
  assert.match(MATVARETABELLEN_PORTION_SOURCE_B15.licence, /NLOD 2\.0/);
});

test("B15 admits exactly reviewed courgette-piece and ground-spice teaspoon rows", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_PORTION_EVIDENCE_B15).sort(), ["courgette", "cumin", "turmeric"]);
  const courgette = matvaretabellenPortionConversionB15("courgette", "piece");
  assert.equal(courgette.foodId, "06.085");
  assert.equal(courgette.portionName, "pcs");
  assert.equal(courgette.gramsPerUnit, 285);

  const cumin = matvaretabellenPortionConversionB15("cumin", "tsp");
  assert.equal(cumin.foodId, "06.266");
  assert.equal(cumin.foodName, "Cumin seeds, ground");
  assert.equal(cumin.gramsPerUnit, 3);

  const turmeric = matvaretabellenPortionConversionB15("turmeric", "tsp");
  assert.equal(turmeric.foodId, "06.153");
  assert.equal(turmeric.foodName, "Turmeric, ground");
  assert.equal(turmeric.gramsPerUnit, 3);
});

test("B15 does not generalize portion evidence across units or nearby identities", () => {
  for (const [ingredientId, unit] of [
    ["courgette", "slice"],
    ["courgette", "small"],
    ["zucchini", "piece"],
    ["squash", "piece"],
    ["cumin", "tbsp"],
    ["turmeric", "tbsp"],
    ["cumin_seed", "tsp"],
    ["turmeric_root", "tsp"]
  ]) {
    assert.equal(matvaretabellenPortionConversionB15(ingredientId, unit), null, `${ingredientId}|${unit}`);
  }
});

test("B15 quantity routing uses published grams without inferred arithmetic", () => {
  const cases = [
    { ingredientId: "courgette", quantity: 1, unit: "piece", expectedGrams: 285 },
    { ingredientId: "cumin", quantity: 0.5, unit: "tsp", expectedGrams: 1.5 },
    { ingredientId: "turmeric", quantity: 2, unit: "tsp", expectedGrams: 6 }
  ];

  for (const item of cases) {
    const result = calculatePerServingFromDensities({
      ingredients: [{ canonicalIngredientId: item.ingredientId, quantity: item.quantity, unit: item.unit }],
      serving: { servings: 1 }
    }, EUROPEAN_PRIMARY_DENSITIES_V1);
    assert.equal(result.skipped.length, 0, item.ingredientId);
    assert.equal(result.used.length, 1, item.ingredientId);
    assert.equal(result.used[0].grams, item.expectedGrams, item.ingredientId);
    assert.equal(result.used[0].quantityEvidence.sourceId, MATVARETABELLEN_PORTION_SOURCE_B15.id, item.ingredientId);
    assert.equal(result.used[0].quantityEvidence.evidenceTranche, "B15", item.ingredientId);
  }
});

test("B15 remains portion-only and requires a separate density record", () => {
  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "courgette", quantity: 1, unit: "piece" }],
    serving: { servings: 1 }
  }, {});
  assert.equal(result.complete, false);
  assert.equal(result.skipped[0].reason, "missing_density");
});
