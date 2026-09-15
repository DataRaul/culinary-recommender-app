import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALL_RECIPES, ACTIVATED_EXTERNAL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

const roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));
const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-bosse-watanna-v8005-live-pass.json", import.meta.url), "utf8"));
const handover = JSON.parse(readFileSync(new URL("../docs/handovers/CURRENT.json", import.meta.url), "utf8"));
const gate = id => roadmap.gates.find(row => row.id === id);

test("Step 8G Bosse Watanna v8005 live closeout freezes the exact protected terminal", () => {
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminal, "STEP_8G_ORA_BOSSE_WATANNA_V8005_PROTECTED_POPULATION_PASS");
  assert.equal(evidence.sourceCohortId, "ORA_BOSSE_WATANNA_1914_JAPANESE_SHELF_AE3BD2C");
  assert.equal(evidence.parentCorpusVersion, "v8004");
  assert.equal(evidence.activeCorpusVersion, "v8005");
  assert.equal(evidence.childRecipeCount, 109);
  assert.equal(evidence.parentRecipeCount, 2355);
  assert.equal(evidence.composedRecipeCount, 2464);
  assert.equal(evidence.bodyBatchCount, 12);
  assert.equal(evidence.routeBatchCount, 12);
  assert.equal(evidence.maxRowsPerFreshBatch, 10);
  assert.equal(evidence.shardCount, 2);
  assert.equal(evidence.idempotentBodyReplayPass, true);
  assert.equal(evidence.idempotentRouteReplayPass, true);
  assert.equal(evidence.fiveLayerHydrationPass, true);
  assert.equal(evidence.rollbackPass, true);
  assert.equal(evidence.rollbackHydrationFailClosedPass, true);
  assert.equal(evidence.finalProtectedActiveVersion, "v8005");
  assert.equal(evidence.fullCorpusScans, 0);
  assert.equal(evidence.maxObservedD1Subqueries, 16);
  assert.equal(evidence.maxAllowedD1Subqueries, 16);
  assert.equal(evidence.d1BudgetHeadroomAssumed, false);
});

test("v8005 closeout preserves public, recommendation, topology, authority and cost firewalls", () => {
  assert.equal(evidence.publicRuntimeChanged, false);
  assert.equal(evidence.recommendationAdmissionChanged, false);
  assert.equal(evidence.thirdShardUsed, false);
  assert.equal(evidence.billingExpansion, false);
  assert.equal(evidence.culturalAuthenticityAuthorityImported, false);
  assert.equal(evidence.boundaries.publicRuntimeActivationAuthorized, false);
  assert.equal(evidence.boundaries.automaticRecommendationAdmissionAuthorized, false);
  assert.equal(evidence.boundaries.thirdShardAuthorized, false);
  assert.equal(evidence.boundaries.d1BudgetExpansionAuthorized, false);
  assert.equal(evidence.boundaries.billingExpansionAuthorized, false);
  assert.equal(evidence.boundaries.nutritionLaneModified, false);
  assert.equal(evidence.boundaries.youtubeCulinaryStateModified, false);
  assert.equal(evidence.boundaries.knowledgeCoreWritePerformed, false);
  assert.equal(evidence.boundaries.culturalAuthenticityAuthorityImported, false);
  assert.equal(evidence.boundaries.step8fReopened, false);
});

test("roadmap and handover advance protected state to v8005 without changing the public corpus", () => {
  const g = gate("8G");
  assert.equal(g.status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(g.latestIteration.layerVersion, "v8005");
  assert.equal(g.latestIteration.liveTerminal, "STEP_8G_ORA_BOSSE_WATANNA_V8005_PROTECTED_POPULATION_PASS");
  assert.equal(g.latestIteration.composedRecipeCount, 2464);
  assert.equal(g.latestIteration.finalProtectedActiveVersion, "v8005");
  assert.equal(g.latestIteration.fiveLayerHydrationPass, true);
  assert.equal(g.latestIteration.maxObservedD1Subqueries, 16);
  assert.equal(g.latestIteration.d1BudgetHeadroomAssumed, false);
  assert.equal(g.latestIteration.publicRuntimeChanged, false);
  assert.equal(g.latestIteration.recommendationAdmissionChanged, false);
  assert.equal(g.doesNotDependOn.includes("8F"), true);

  assert.equal(handover.human_needed, false);
  assert.equal(handover.active_human_gate, "NONE");
  assert.equal(handover.corpus_scale.step8g.latest_live_terminal, "STEP_8G_ORA_BOSSE_WATANNA_V8005_PROTECTED_POPULATION_PASS");
  assert.equal(handover.corpus_scale.step8g.composed_recipe_count, 2464);
  assert.equal(handover.corpus_scale.step8g.final_protected_active_version, "v8005");
  assert.equal(handover.corpus_scale.step8f.automatic_broader_admission_authorized, false);

  assert.equal(ALL_RECIPES.length, 84);
  assert.equal(ACTIVATED_EXTERNAL_RECIPES.length, 1);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 85);
});
