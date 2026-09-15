import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));
const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8g/cc0-v8003-live-pass.json", import.meta.url), "utf8"));
const handover = JSON.parse(readFileSync(new URL("../docs/handovers/CURRENT.json", import.meta.url), "utf8"));
const gate = id => roadmap.gates.find(row => row.id === id);

test("Step 8G v8003 live closeout freezes the exact protected corpus terminal", () => {
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminal, "STEP_8G_CC0_V8003_PROTECTED_POPULATION_PASS");
  assert.equal(evidence.parentCorpusVersion, "v8002");
  assert.equal(evidence.activeCorpusVersion, "v8003");
  assert.equal(evidence.childRecipeCount, 226);
  assert.equal(evidence.parentRecipeCount, 1416);
  assert.equal(evidence.composedRecipeCount, 1642);
  assert.equal(evidence.bodyBatchCount, 23);
  assert.equal(evidence.routeBatchCount, 23);
  assert.equal(evidence.shardCount, 2);
  assert.equal(evidence.idempotentBodyReplayPass, true);
  assert.equal(evidence.idempotentRouteReplayPass, true);
  assert.equal(evidence.threeLayerHydrationPass, true);
  assert.equal(evidence.rollbackPass, true);
  assert.equal(evidence.rollbackHydrationFailClosedPass, true);
  assert.equal(evidence.finalProtectedActiveVersion, "v8003");
  assert.equal(evidence.fullCorpusScans, 0);
  assert.ok(evidence.maxObservedD1Subqueries <= 16);
});

test("v8003 closeout preserves the public, cost and topology firewalls", () => {
  assert.equal(evidence.publicRuntimeChanged, false);
  assert.equal(evidence.recommendationAdmissionChanged, false);
  assert.equal(evidence.thirdShardUsed, false);
  assert.equal(evidence.billingExpansion, false);
  assert.equal(evidence.boundaries.publicRuntimeActivationAuthorized, false);
  assert.equal(evidence.boundaries.automaticRecommendationAdmissionAuthorized, false);
  assert.equal(evidence.boundaries.thirdShardAuthorized, false);
  assert.equal(evidence.boundaries.billingExpansionAuthorized, false);
});

test("roadmap and current handover keep v8003 live while completed Step 8F stays exact and bounded", () => {
  const g = gate("8G");
  assert.equal(g.status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(g.latestIteration.layerVersion, "v8003");
  assert.equal(g.latestIteration.liveTerminal, "STEP_8G_CC0_V8003_PROTECTED_POPULATION_PASS");
  assert.equal(g.latestIteration.composedRecipeCount, 1642);
  assert.equal(g.latestIteration.finalProtectedActiveVersion, "v8003");
  assert.equal(g.latestIteration.publicRuntimeChanged, false);
  assert.equal(g.latestIteration.recommendationAdmissionChanged, false);
  assert.equal(g.doesNotDependOn.includes("8F"), true);

  assert.equal(handover.corpus_scale.step8g.status, "ACTIVE_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(handover.corpus_scale.step8g.latest_live_terminal, "STEP_8G_CC0_V8003_PROTECTED_POPULATION_PASS");
  assert.equal(handover.corpus_scale.step8g.composed_recipe_count, 1642);
  assert.equal(handover.corpus_scale.step8g.final_protected_active_version, "v8003");
  assert.equal(handover.corpus_scale.step8f.runtime_activation_authorized, true);
  assert.equal(handover.corpus_scale.step8f.public_runtime_changed, true);
  assert.equal(handover.corpus_scale.step8f.public_runtime_recipe_count_after, 85);
  assert.deepEqual(handover.corpus_scale.step8f.activated_canonical_recipe_ids, ["unitools_tortilla_espanola"]);
});
