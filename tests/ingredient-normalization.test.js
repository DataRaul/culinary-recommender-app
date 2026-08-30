import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIngredient } from "../src/data/ingredients.js";

test("normalizes multilingual/common aliases without collapsing forms", () => {
  assert.equal(normalizeIngredient("tomate"), "tomato");
  assert.equal(normalizeIngredient("tomate triturado"), "canned_tomato");
  assert.equal(normalizeIngredient("garbanzos"), "chickpeas");
  assert.equal(normalizeIngredient("feta cheese"), "feta");
  assert.equal(normalizeIngredient("unknown item"), null);
});
