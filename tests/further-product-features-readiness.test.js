import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  summarizeFurtherProductFeaturesReadiness,
  validateFurtherProductFeaturesReadiness
} from "../scripts/further-product-features-readiness.mjs";

const config = JSON.parse(
  await readFile(new URL("../config/further_product_features_v1.json", import.meta.url), "utf8")
);

test("further-product-features readiness contract passes and selects D3 design without runtime authority", () => {
  assert.deepEqual(validateFurtherProductFeaturesReadiness(config), []);
  const summary = summarizeFurtherProductFeaturesReadiness(config);
  assert.equal(summary.pass, true);
  assert.equal(summary.terminal, "FURTHER_PRODUCT_FEATURES_READINESS_PASS");
  assert.equal(summary.selectedNextDesignCandidate, "D3");
  assert.equal(summary.selectedName, "Recipe Images");
  assert.equal(summary.selectedState, "P0_COMPLETE");
  assert.equal(summary.runtimeActivationAuthorized, false);
  assert.equal(summary.nextGate, "FURTHER_PRODUCT_FEATURES_REASSESSMENT_AFTER_D3");
});

test("D1 remains fail-closed while vitamin/mineral schema is unavailable", () => {
  const mutated = structuredClone(config);
  mutated.capabilities.find(row => row.id === "D1").state = "READY_FOR_BOUNDED_P0_DESIGN";
  assert.ok(
    validateFurtherProductFeaturesReadiness(mutated)
      .some(error => error.includes("D1 must remain BLOCKED"))
  );
});

test("D3 readiness does not inherit external source-media authority", () => {
  for (const key of [
    "thirdPartyRecipeSourceImagesAuthorized",
    "protectedCorpusSourceImagesAuthorized",
    "wikibooksCommonsImagesAuthorized"
  ]) {
    const mutated = structuredClone(config);
    mutated.capabilities.find(row => row.id === "D3").mediaBoundary[key] = true;
    assert.ok(validateFurtherProductFeaturesReadiness(mutated).some(error => error.includes("unauthorized")));
  }
});

test("D6 remains behind the active owner-priority barbecue pilot", () => {
  const mutated = structuredClone(config);
  mutated.capabilities.find(row => row.id === "D6").state = "READY_FOR_BOUNDED_P0_DESIGN";
  assert.ok(
    validateFurtherProductFeaturesReadiness(mutated)
      .some(error => error.includes("owner-priority sequencing"))
  );
});

test("readiness audit may authorize bounded design only, never product/runtime widening", () => {
  const forbiddenAuthorityKeys = [
    "publicRuntimeChangeAuthorized",
    "newExternalMediaAdmissionAuthorized",
    "protectedCorpusMutationAuthorized",
    "thirdD1ShardAuthorized",
    "paidInfrastructureAuthorized",
    "knowledgeCoreWriteAuthorized",
    "barbecueMutationAuthorized"
  ];
  for (const key of forbiddenAuthorityKeys) {
    const mutated = structuredClone(config);
    mutated.authority[key] = true;
    assert.ok(validateFurtherProductFeaturesReadiness(mutated).some(error => error.includes(key)));
  }
});
