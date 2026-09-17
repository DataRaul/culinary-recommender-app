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
  assert.equal(gates.get("8F").decisionInput.runtimeActivationAuthorized, true);
  assert.equal(roadmap.boundaries.automaticPublicRecommendationAdmission, false);
});

test("current handover preserves Step 8 cost, topology and public-scope firewalls without pinning an obsolete schema", () => {
  assert.equal(current.lane.billing, "NO_BILLING_AUTHORIZATION");
  assert.equal(current.live_protected_state.shard_count, 2);
  assert.equal(current.live_protected_state.third_shard_used, false);
  assert.equal(current.live_protected_state.billing_expansion, false);
  assert.equal(current.live_protected_state.public_runtime_recipe_count, 85);
  assert.equal(current.live_protected_state.public_runtime_changed, false);
  assert.equal(current.live_protected_state.max_allowed_d1_subqueries, 16);
  assert.equal(current.live_protected_state.d1_budget_headroom_assumed, false);
});