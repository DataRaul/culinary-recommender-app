import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALL_RECIPES, ACTIVATED_EXTERNAL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

const roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));
const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-turabi-v8006-prewrite-evidence.json", import.meta.url), "utf8"));
const validation = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-turabi-v8006-prewrite-validation.json", import.meta.url), "utf8"));
const handover = JSON.parse(readFileSync(new URL("../docs/handovers/CURRENT.json", import.meta.url), "utf8"));
const gate = id => roadmap.gates.find(row => row.id === id);

test("Step 8G Turabi v8006 prewrite freezes the exact earned protected plan", () => {
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminalCandidate, "STEP_8G_ORA_TURABI_EFENDI_V8006_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED");
  assert.equal(evidence.source.cohortId, "ORA_TURABI_EFENDI_1864_OTTOMAN_SHELF_AE3BD2C");
  assert.equal(evidence.parent.activeCorpusVersion, "v8005");
  assert.equal(evidence.parent.composedRecipeCount, 2464);
  assert.equal(evidence.layer.corpusVersion, "v8006");
  assert.equal(evidence.layer.recipeCount, 442);
  assert.equal(evidence.layer.batchCount, 45);
  assert.equal(evidence.layer.maxRowsPerBatch, 10);
  assert.equal(evidence.composition.cumulativeRecipeCount, 2906);
  assert.equal(evidence.composition.routing.shardCount, 2);
  assert.equal(evidence.composition.routing.fullCorpusScans, 0);
  assert.equal(evidence.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(evidence.layer.operationBudget.maxAllowedD1Subqueries, 16);
  assert.equal(evidence.layer.operationBudget.headroomAssumed, false);
  assert.equal(validation.pass, true);
  assert.equal(validation.routeWriteCeilingExact, true);
  assert.equal(validation.routeMaxRowsPerBatch, 10);
  assert.equal(validation.maxAnyWriteRequestBytes, 16090);
});

test("v8006 prewrite remains immutable proof after implementation, recovery and live PASS", () => {
  assert.equal(evidence.boundaries.liveD1WritesPerformed, 0);
  for (const key of ["publicRuntimeChanged","recommendationAdmissionPerformed","thirdShardUsed","d1BudgetExpansion","billingExpansion","nutritionLaneModified","youtubeCulinaryStateModified","knowledgeCoreWritePerformed","culturalAuthenticityAuthorityImported","step8fReopened"]) {
    assert.equal(evidence.boundaries[key], false, key);
  }
  assert.equal(roadmap.evidenceBasis.includes("data/generated/step8g/ora-turabi-v8006-prewrite-evidence.json"), true);
  assert.equal(roadmap.evidenceBasis.includes("data/generated/step8g/ora-turabi-v8006-prewrite-validation.json"), true);
  assert.match(handover.operating_contract.public_activation, /unitools_tortilla_espanola/);
  assert.match(handover.operating_contract.topology, /two protected D1 recipe-body shards/i);
  assert.match(handover.operating_contract.d1_budget, /16\/16 D1 subqueries/);
  assert.equal(handover.live_protected_state.active_version, "v8006");
  assert.equal(handover.live_protected_state.child_recipe_count, 442);
  assert.equal(handover.live_protected_state.parent_recipe_count, 2464);
  assert.equal(handover.live_protected_state.composed_recipe_count, 2906);
  assert.equal(handover.v8006_live.status, "PASS_PROTECTED_POPULATION_COMPLETE_ACTIVE");
  assert.equal(handover.v8006_live.source_cohort_id, evidence.source.cohortId);
  assert.equal(gate("8G").latestIteration.layerVersion, "v8006");
  assert.equal(gate("8G").latestIteration.finalProtectedActiveVersion, "v8006");
  assert.equal(gate("8G").nextIteration.status, "NOT_YET_EARNED_SOURCE_DISCOVERY_AND_MEASUREMENT_REQUIRED");
  assert.equal(ALL_RECIPES.length, 84);
  assert.equal(ACTIVATED_EXTERNAL_RECIPES.length, 1);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 85);
});
