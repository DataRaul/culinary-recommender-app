import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALL_RECIPES, ACTIVATED_EXTERNAL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

const roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));
const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-bosse-watanna-v8005-prewrite-evidence.json", import.meta.url), "utf8"));
const validation = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-bosse-watanna-v8005-prewrite-validation.json", import.meta.url), "utf8"));
const handover = JSON.parse(readFileSync(new URL("../docs/handovers/CURRENT.json", import.meta.url), "utf8"));
const gate = id => roadmap.gates.find(row => row.id === id);

test("Step 8G Bosse Watanna v8005 prewrite freezes the exact earned protected plan", () => {
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminalCandidate, "STEP_8G_ORA_BOSSE_WATANNA_V8005_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED");
  assert.equal(evidence.source.cohortId, "ORA_BOSSE_WATANNA_1914_JAPANESE_SHELF_AE3BD2C");
  assert.equal(evidence.parent.activeCorpusVersion, "v8004");
  assert.equal(evidence.parent.composedRecipeCount, 2355);
  assert.equal(evidence.layer.corpusVersion, "v8005");
  assert.equal(evidence.layer.recipeCount, 109);
  assert.equal(evidence.layer.maxRowsPerBatch, 10);
  assert.equal(evidence.composition.cumulativeRecipeCount, 2464);
  assert.equal(evidence.composition.routing.shardCount, 2);
  assert.equal(evidence.composition.routing.fullCorpusScans, 0);
  assert.equal(evidence.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(evidence.layer.operationBudget.maxAllowedD1Subqueries, 16);
  assert.equal(evidence.layer.operationBudget.headroomAssumed, false);
  assert.equal(validation.pass, true);
  assert.equal(validation.routeWriteCeilingExact, true);
  assert.equal(validation.routeMaxRowsPerBatch, 10);
});

test("v8005 prewrite remains immutable proof after the later live v8005 PASS", () => {
  assert.equal(evidence.boundaries.liveD1WritesPerformed, 0);
  for (const key of ["publicRuntimeChanged","recommendationAdmissionPerformed","thirdShardUsed","d1BudgetExpansion","billingExpansion","nutritionLaneModified","youtubeCulinaryStateModified","knowledgeCoreWritePerformed","culturalAuthenticityAuthorityImported","step8fReopened"]) {
    assert.equal(evidence.boundaries[key], false, key);
  }
  const g = gate("8G");
  assert.equal(g.latestIteration.layerVersion, "v8005");
  assert.equal(g.latestIteration.parentCorpusVersion, "v8004");
  assert.equal(g.latestIteration.composedRecipeCount, 2464);
  assert.equal(g.latestIteration.liveTerminal, "STEP_8G_ORA_BOSSE_WATANNA_V8005_PROTECTED_POPULATION_PASS");
  assert.equal(roadmap.evidenceBasis.includes("data/generated/step8g/ora-bosse-watanna-v8005-prewrite-evidence.json"), true);
  assert.equal(roadmap.evidenceBasis.includes("data/generated/step8g/ora-bosse-watanna-v8005-prewrite-validation.json"), true);
  assert.equal(handover.corpus_scale.step8g.final_protected_active_version, "v8005");
  assert.equal(handover.corpus_scale.step8g.composed_recipe_count, 2464);
  assert.equal(handover.corpus_scale.step8f.automatic_broader_admission_authorized, false);
  assert.equal(ALL_RECIPES.length, 84);
  assert.equal(ACTIVATED_EXTERNAL_RECIPES.length, 1);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 85);
});
