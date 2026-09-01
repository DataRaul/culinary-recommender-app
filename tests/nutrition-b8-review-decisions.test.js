import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { USDA_FOUNDATION_DENSITIES } from "../src/data/nutrition-evidence.js";
import { matvaretabellenPortionConversion } from "../src/data/matvaretabellen-portions-b6.js";
import { usdaSrLegacyPortionConversion } from "../src/data/usda-sr-legacy-portions-b8.js";

const decisions = JSON.parse(readFileSync(new URL("../scripts/usda-foundation-b8-reviewed-decisions.json", import.meta.url), "utf8"));

test("B8 review ledger pins the official Foundation 2026-04 release and explicit decisions", () => {
  assert.equal(decisions.source.releaseDate, "2026-04-30");
  assert.equal(decisions.source.releaseVersion, "15.0");
  assert.equal(decisions.source.archive, "FoodData_Central_foundation_food_csv_2026-04-30.zip");
  assert.equal(decisions.decisions.lentils.fdcId, "2644283");
  assert.equal(decisions.decisions.turkey_mince.fdcId, "2514747");
  assert.equal(decisions.decisions.cottage_cheese.fdcId, "2346384");
  assert.equal(decisions.decisions.tahini.fdcId, "2262073");
  assert.equal(decisions.decisions.salt.fdcId, "746775");
});

test("partial or form-qualified Foundation candidates remain unpromoted when they do not earn a recipe unlock", () => {
  for (const ingredientId of ["lentils", "turkey_mince", "cottage_cheese", "tahini", "salt"]) {
    assert.equal(USDA_FOUNDATION_DENSITIES[ingredientId], undefined, ingredientId);
  }
  assert.match(decisions.decisions.lentils.runtimeDecision, /^DEFER_/);
  assert.match(decisions.decisions.turkey_mince.runtimeDecision, /^DEFER_/);
  assert.match(decisions.decisions.cottage_cheese.runtimeDecision, /^DEFER_/);
  assert.match(decisions.decisions.tahini.runtimeDecision, /^DEFER_/);
  assert.match(decisions.decisions.salt.runtimeDecision, /^REJECT_/);
});

test("wrong-form candidates remain rejected rather than normalized for convenience", () => {
  assert.equal(decisions.decisions.passata.runtimeDecision, "REJECT_WRONG_FORM");
  assert.equal(decisions.decisions.edamame.runtimeDecision, "DEFER_WRONG_FORM");
  assert.equal(USDA_FOUNDATION_DENSITIES.passata, undefined);
  assert.equal(USDA_FOUNDATION_DENSITIES.edamame, undefined);
});

test("smoked paprika remains distinct from generic paprika", () => {
  assert.equal(decisions.decisions.smoked_paprika.runtimeDecision, "UNRESOLVED_EXACT_SMOKED_FORM_REQUIRED");
  assert.equal(USDA_FOUNDATION_DENSITIES.smoked_paprika, undefined);
  assert.equal(USDA_FOUNDATION_DENSITIES.paprika, undefined);
});

test("small-onion evidence is exact and does not mutate generic Matvaretabellen onion semantics", () => {
  assert.equal(matvaretabellenPortionConversion("onion", "small"), null);
  assert.equal(matvaretabellenPortionConversion("onion", "piece")?.gramsPerUnit, 160);
  assert.equal(usdaSrLegacyPortionConversion("onion", "small")?.gramsPerUnit, 70);
  assert.equal(usdaSrLegacyPortionConversion("onion", "piece"), null);
  assert.equal(usdaSrLegacyPortionConversion("red_onion", "small"), null);
});
