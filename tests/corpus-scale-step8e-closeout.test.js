import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));
const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8e/admission-evidence.json", import.meta.url), "utf8"));
const subset = JSON.parse(readFileSync(new URL("../data/generated/step8e/eligible-subset.json", import.meta.url), "utf8"));
const handover = JSON.parse(readFileSync(new URL("../docs/handovers/CURRENT.json", import.meta.url), "utf8"));
const gate = id => roadmap.gates.find(row => row.id === id);

test("Step 8E terminal closeout is exact and bounded", () => {
  assert.equal(gate("8E").status, "COMPLETE_PASS_RECOMMENDATION_ELIGIBILITY");
  assert.equal(gate("8E").terminal, "STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS");
  assert.equal(evidence.pass, true);
  assert.equal(evidence.reviewedStoredPopulation, 501);
  assert.equal(evidence.eligibleSubsetCount, 1);
  assert.equal(evidence.storedOnlyCount, 500);
  assert.deepEqual(evidence.canonicalRecipeIds, ["unitools_tortilla_espanola"]);
  assert.equal(subset.recipes.length, 1);
  assert.equal(subset.recipes[0].id, "unitools_tortilla_espanola");
});

test("Step 8F exact one-record activation remains complete while Step 8G advances independently", () => {
  assert.equal(gate("8F").status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");
  assert.equal(gate("8F").terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");
  assert.equal(gate("8F").parked, false);
  assert.equal(gate("8F").blockingActiveLane, false);
  assert.equal(gate("8F").decisionInput.runtimeActivationAuthorized, true);
  assert.equal(gate("8F").decisionInput.publicRuntimeChanged, true);
  assert.equal(gate("8F").decisionInput.publicCorpusRecipeCountBeforeDecision, 84);
  assert.equal(gate("8F").decisionInput.publicCorpusRecipeCountAfterDecision, 85);
  assert.equal(gate("8F").decisionInput.candidatePresentInPublicCorpus, true);
  assert.equal(gate("8G").doesNotDependOn.includes("8F"), true);
  assert.match(handover.operating_contract.public_activation, /unitools_tortilla_espanola/);
  assert.match(handover.operating_contract.public_activation, /85 recipes/);
  assert.equal(handover.not_authorized.includes("No broader Step 8F/public recommendation admission."), true);
});

test("Step 8E closeout preserves cost and adjacent-lane firewalls", () => {
  assert.equal(roadmap.boundaries.noBillingAuthorization, true);
  assert.equal(roadmap.boundaries.nutritionBLaneIndependent, true);
  assert.equal(roadmap.boundaries.youtubeCulinaryStateMutableFromStep8, false);
  assert.equal(roadmap.boundaries.knowledgeCoreWriteAllowedFromAppLane, false);
  assert.equal(evidence.boundaries.d1WritesPerformed, 0);
  assert.equal(evidence.boundaries.thirdShardUsed, false);
  assert.equal(evidence.boundaries.billingExpansion, false);
  assert.equal(evidence.boundaries.nutritionLaneModified, false);
  assert.equal(evidence.boundaries.youtubeCulinaryStateModified, false);
  assert.equal(evidence.boundaries.knowledgeCoreWritePerformed, false);
  assert.equal(handover.lane.billing, "NO_BILLING_AUTHORIZATION");
});