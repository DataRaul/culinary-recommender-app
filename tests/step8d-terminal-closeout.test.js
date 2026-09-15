import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const evidence = JSON.parse(readFileSync(resolve(ROOT, "data/generated/corpus-scale-step8d-live-pass.json"), "utf8"));
const roadmap = JSON.parse(readFileSync(resolve(ROOT, "config/corpus_scale_step8_roadmap.json"), "utf8"));
const current = JSON.parse(readFileSync(resolve(ROOT, "docs/handovers/CURRENT.json"), "utf8"));
const gates = new Map(roadmap.gates.map(gate => [gate.id, gate]));

test("Step 8D frozen live evidence satisfies terminal contract", () => {
  const r = evidence.authenticatedProductionRunner;
  assert.equal(evidence.terminal, "STEP_8D_PROTECTED_POPULATION_PASS");
  assert.equal(r.pass, true);
  assert.equal(r.terminalCandidate, "STEP_8D_PROTECTED_POPULATION_PASS");
  assert.equal(r.recipeCount, 501);
  assert.equal(r.verifiedBatchCount, 51);
  assert.equal(r.shardCount, 2);
  assert.equal(r.resumableInterruptionPass, true);
  assert.equal(r.idempotentWritePass, true);
  assert.equal(r.exactPostWrite501Pass, true);
  assert.equal(r.authenticatedCrossShardReadPass, true);
  assert.equal(r.rollbackPass, true);
  assert.equal(r.fullCorpusScans, 0);
  assert.ok(r.maxObservedD1Subqueries <= 16);
  assert.equal(r.normalPublicRecommendationRuntimeChanged, false);
  assert.equal(r.thirdShardUsed, false);
  assert.equal(r.billingExpansion, false);
});

test("Step 8D PASS remains the prerequisite for completed 8E and independent active 8G", () => {
  assert.equal(gates.get("8D").status, "COMPLETE_PASS_LIVE_PRODUCTION");
  assert.equal(gates.get("8D").terminal, "STEP_8D_PROTECTED_POPULATION_PASS");
  assert.equal(gates.get("8E").status, "COMPLETE_PASS_RECOMMENDATION_ELIGIBILITY");
  assert.equal(gates.get("8E").terminal, "STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS");
  assert.equal(gates.get("8G").status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(gates.get("8G").doesNotDependOn.includes("8F"), true);
  assert.equal(gates.get("8F").status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");
  assert.equal(gates.get("8F").humanRequired, true);
  assert.equal(gates.get("8F").decisionInput.runtimeActivationAuthorized, true);
  assert.equal(roadmap.boundaries.automaticPublicRecommendationAdmission, false);
});

test("canonical handover preserves Step 8D while completed 8F coexists with active 8G", () => {
  assert.equal(current.corpus_scale.step8d.terminal, "STEP_8D_PROTECTED_POPULATION_PASS");
  assert.equal(current.corpus_scale.step8d.max_observed_d1_subqueries, 15);
  assert.equal(current.corpus_scale.step8e.status, "COMPLETE_PASS_RECOMMENDATION_ELIGIBILITY");
  assert.equal(current.corpus_scale.step8e.terminal, "STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS");
  assert.equal(current.corpus_scale.step8f.status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");
  assert.equal(current.corpus_scale.step8f.runtime_activation_authorized, true);
  assert.equal(current.corpus_scale.step8f.public_runtime_changed, true);
  assert.equal(current.corpus_scale.step8f.public_runtime_recipe_count_after, 85);
  assert.equal(current.corpus_scale.step8g.status, "ACTIVE_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(current.corpus_scale.step8g.depends_on_step8f, false);
});
