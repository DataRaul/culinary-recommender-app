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

test("Step 8F remains unauthorized while the continuation state parks it and activates Step 8G", () => {
  assert.equal(gate("8F").status, "READY_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION");
  assert.equal(gate("8F").humanRequired, true);
  assert.equal(gate("8F").decisionInput.runtimeActivationAuthorized, false);
  assert.equal(gate("8F").decisionInput.publicRuntimeChanged, false);
  assert.equal(gate("8F").decisionInput.publicCorpusRecipeCountBeforeDecision, 84);
  assert.equal(gate("8F").decisionInput.candidatePresentInPublicCorpus, false);
  assert.equal(gate("8G").doesNotDependOn.includes("8F"), true);
  assert.equal(handover.human_needed, false);
  assert.equal(handover.parked_human_gate.id, "STEP8F_PUBLIC_RUNTIME_ACTIVATION_DECISION");
  assert.equal(handover.parked_human_gate.status, "PARKED_NOT_AUTHORIZED");
  assert.equal(handover.parked_human_gate.blocking_active_lane, false);
  assert.equal(handover.active_human_gate, "NONE");
  assert.equal(handover.corpus_scale.step8f.runtime_activation_authorized, false);
  assert.equal(handover.corpus_scale.step8f.public_runtime_changed, false);
  assert.equal(handover.corpus_scale.step8g.status, "ACTIVE_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(handover.corpus_scale.step8g.depends_on_step8f, false);
  assert.equal(handover.corpus_scale.step8g.public_runtime_change_allowed, false);
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
});
