import test from "node:test";
import assert from "node:assert/strict";
import {
  USDA_SR_LEGACY_PORTION_EVIDENCE_B8,
  USDA_SR_LEGACY_PORTION_SOURCE_B8,
  usdaSrLegacyPortionConversion
} from "../src/data/usda-sr-legacy-portions-b8.js";
import { calculatePerServingFromDensities } from "../src/domain/nutrition.js";

test("B8 pins the official SR Legacy final-release small raw-onion row exactly", () => {
  const record = USDA_SR_LEGACY_PORTION_EVIDENCE_B8.onion;
  assert.equal(USDA_SR_LEGACY_PORTION_SOURCE_B8.releaseDate, "2018-04");
  assert.equal(USDA_SR_LEGACY_PORTION_SOURCE_B8.archive, "FoodData_Central_sr_legacy_food_csv_2018-04.zip");
  assert.match(USDA_SR_LEGACY_PORTION_SOURCE_B8.licence, /public domain/);
  assert.equal(record.fdcId, "170000");
  assert.equal(record.ndbNumber, "11282");
  assert.equal(record.description, "Onions, raw");
  assert.equal(record.portionRowId, "85862");
  assert.equal(record.modifier, "small");
  assert.equal(record.gramWeight, 70);
  assert.equal(record.amount, 1);
});

test("only canonical onion with explicit small unit receives the 70 g conversion", () => {
  assert.equal(usdaSrLegacyPortionConversion("onion", "small")?.gramsPerUnit, 70);
  assert.equal(usdaSrLegacyPortionConversion("onion", "piece"), null);
  assert.equal(usdaSrLegacyPortionConversion("onion", "medium"), null);
  assert.equal(usdaSrLegacyPortionConversion("onion", "large"), null);
  assert.equal(usdaSrLegacyPortionConversion("red_onion", "small"), null);
});

test("runtime uses exact SR Legacy provenance for small onion without changing generic piece semantics", () => {
  const density = { onion: { energyKcal: 40, proteinG: 1.1, carbohydrateG: 9.3, fatG: 0.1, fibreG: 1.7 } };
  const small = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "onion", quantity: 1, unit: "small" }],
    serving: { servings: 1 }
  }, density);
  assert.equal(small.complete, true);
  assert.equal(small.used[0].grams, 70);
  assert.equal(small.used[0].quantityEvidence.sourceId, USDA_SR_LEGACY_PORTION_SOURCE_B8.id);
  assert.equal(small.used[0].quantityEvidence.portionRowId, "85862");
  assert.equal(small.used[0].quantityEvidence.modifier, "small");

  const ordinaryPiece = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "onion", quantity: 1, unit: "piece" }],
    serving: { servings: 1 }
  }, density);
  assert.equal(ordinaryPiece.complete, true);
  assert.equal(ordinaryPiece.used[0].grams, 160);
  assert.notEqual(ordinaryPiece.used[0].quantityEvidence.sourceId, USDA_SR_LEGACY_PORTION_SOURCE_B8.id);
});

test("SR Legacy B8 remains quantity-only and does not claim composition authority", () => {
  assert.equal(USDA_SR_LEGACY_PORTION_SOURCE_B8.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal("per100g" in USDA_SR_LEGACY_PORTION_EVIDENCE_B8.onion, false);
});
