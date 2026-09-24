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

test("post-D3 reassessment selects D5 bounded adapter design without runtime authority", () => {
  assert.deepEqual(validateFurtherProductFeaturesReadiness(config), []);
  const summary = summarizeFurtherProductFeaturesReadiness(config);
  assert.equal(summary.pass, true);
  assert.equal(summary.terminal, "FURTHER_PRODUCT_FEATURES_REASSESSMENT_AFTER_D3_PASS");
  assert.equal(summary.selectedNextDesignCandidate, "D5");
  assert.equal(summary.selectedName, "Fitness Integration");
  assert.equal(summary.selectedState, "P0_ADAPTER_DESIGN_CONTRACT_PASS");
  assert.equal(summary.runtimeActivationAuthorized, false);
  assert.equal(summary.nextGate, "D5_FITNESS_INTEGRATION_P0_ADAPTER_PROTOTYPE");
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


test("D5 adapter-design progression remains one-way, user-permission-gated and non-medical", () => {
  for (const key of [
    "automaticFolderReadAuthorized",
    "crossAppLocalStorageReadAuthorized",
    "cloudSyncAuthorized",
    "sourceAppMutationAuthorized",
    "medicalInferenceAuthorized",
    "calorieBurnEstimationAuthorized",
    "individualizedMacroOrSupplementPrescriptionAuthorized"
  ]) {
    const mutated = structuredClone(config);
    mutated.capabilities.find(row => row.id === "D5").adapterBoundary[key] = true;
    assert.ok(validateFurtherProductFeaturesReadiness(mutated).some(error => error.includes("D5")));
  }

  const sensitive = structuredClone(config);
  sensitive.capabilities.find(row => row.id === "D5").adapterBoundary.sensitiveWorkoutFieldsDefaultExcluded = false;
  assert.ok(validateFurtherProductFeaturesReadiness(sensitive).some(error => error.includes("sensitive workout fields")));
});
