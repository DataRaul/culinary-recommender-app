import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contract = JSON.parse(readFileSync(new URL("../config/recipe_family_p0_review_v1.json", import.meta.url), "utf8"));

test("blocking review keeps public admission separate from prototype expansion", () => {
  assert.equal(contract.nextPrimaryGateOnPass, "RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_GATE");
  assert.deepEqual(contract.unlockedAfterPass, ["RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_NONPUBLIC"]);
});

test("eligible-family quality requires publisher diversity", () => {
  assert.ok(contract.minimumPrototype.minimumDistinctPublishersPerEligibleFamily >= 3);
  assert.ok(contract.minimumPrototype.minimumDistinctPublishersPerStableQuantitativeRange >= 2);
});

test("candidate authority remains non-public", () => {
  assert.ok(contract.interpretationRules.includes("APP_AUTHORING_ELIGIBLE_IS_CANDIDATE_AUTHORITY_ONLY_NOT_PUBLIC_OR_RUNTIME_ADMISSION"));
});
