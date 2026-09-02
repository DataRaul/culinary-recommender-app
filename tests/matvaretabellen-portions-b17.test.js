import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_PORTION_EVIDENCE_B17,
  MATVARETABELLEN_PORTION_SOURCE_B17,
  matvaretabellenPortionConversionB17
} from "../src/data/matvaretabellen-portions-b17.js";
import { MATVARETABELLEN_COMPOSITION_SOURCE_B16 } from "../src/data/matvaretabellen-composition-b16.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1 } from "../src/domain/nutrition-source-policy.js";
import { calculatePerServingFromDensities } from "../src/domain/nutrition.js";

test("B17 is a separate bounded NLOD portion-only source", () => {
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B17.id, "matvaretabellen-2026-portions-b17");
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B17.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B17.dataset, "Norwegian Food Composition Table 2026");
  assert.match(MATVARETABELLEN_PORTION_SOURCE_B17.licence, /NLOD 2\.0/);
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B17.evidenceTranche, "B17");
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B17.role, "PORTION_EVIDENCE_ONLY");
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B17.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal(MATVARETABELLEN_PORTION_SOURCE_B17.runtimeFetch, false);
  assert.notEqual(MATVARETABELLEN_PORTION_SOURCE_B17.id, MATVARETABELLEN_COMPOSITION_SOURCE_B16.id);
});

test("B17 preserves the exact official tahini tablespoon source row", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_PORTION_EVIDENCE_B17), ["tahini"]);
  const record = MATVARETABELLEN_PORTION_EVIDENCE_B17.tahini;
  assert.equal(record.foodId, "06.702");
  assert.equal(record.foodName, "Sesame paste, tahini");
  assert.equal(record.sourcePortionId, "spiseskje");
  assert.equal(record.sourcePortionName, "tablespoon");
  assert.equal(record.sourcePortionUnit, "stk");
  assert.equal(record.sourceQuantity, 16);
  assert.equal(record.sourceUnit, "g");
  assert.equal(record.gramsPerUnit, 16);
  assert.deepEqual(record.units, ["tbsp"]);
});

test("B17 accepts only canonical tahini tbsp and never infers neighboring identities or units", () => {
  assert.equal(matvaretabellenPortionConversionB17("tahini", "tbsp")?.gramsPerUnit, 16);
  for (const unsupported of ["tsp", "tablespoon", "slice", "piece"]) {
    assert.equal(matvaretabellenPortionConversionB17("tahini", unsupported), null, unsupported);
  }
  for (const unsupportedIdentity of ["sesame", "sesame_seeds", "sesame_butter", "tahini_sauce", "tahini_dressing"]) {
    assert.equal(matvaretabellenPortionConversionB17(unsupportedIdentity, "tbsp"), null, unsupportedIdentity);
  }
});

test("runtime resolves exact tahini tablespoons to grams with B17 provenance", () => {
  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "tahini", quantity: 2, unit: "tbsp" }],
    serving: { servings: 1 }
  }, EUROPEAN_PRIMARY_DENSITIES_V1);
  assert.equal(result.complete, true);
  assert.equal(result.used[0].grams, 32);
  assert.equal(result.used[0].quantityEvidence.sourceId, MATVARETABELLEN_PORTION_SOURCE_B17.id);
  assert.equal(result.used[0].quantityEvidence.evidenceTranche, "B17");
  assert.equal(result.used[0].quantityEvidence.sourcePortionId, "spiseskje");
  assert.equal(result.used[0].quantityEvidence.sourcePortionUnit, "stk");
  assert.equal(result.used[0].quantityEvidence.gramsPerUnit, 16);
  assert.equal(result.used[0].quantityEvidence.foodId, "06.702");
});

test("B17 does not silently turn the separate 15 g bread-spread row into a household conversion", () => {
  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "tahini", quantity: 1, unit: "slice" }],
    serving: { servings: 1 }
  }, EUROPEAN_PRIMARY_DENSITIES_V1);
  assert.equal(result.complete, false);
  assert.equal(result.skipped[0].reason, "unsupported_quantity_unit");
});
