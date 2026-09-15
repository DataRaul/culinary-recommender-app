import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALL_RECIPES, ACTIVATED_EXTERNAL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

const roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));
const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8f/public-runtime-activation-pass.json", import.meta.url), "utf8"));
const current = JSON.parse(readFileSync(new URL("../docs/handovers/CURRENT.json", import.meta.url), "utf8"));
const gate = id => roadmap.gates.find(row => row.id === id);

test("Step 8F terminal evidence freezes the exact one-record public activation", () => {
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");
  assert.deepEqual(evidence.ownerAuthorization.scope, ["unitools_tortilla_espanola"]);
  assert.equal(evidence.publicRuntime.recipeCountBefore, 84);
  assert.equal(evidence.publicRuntime.recipeCountAfter, 85);
  assert.equal(evidence.publicRuntime.historicalGoldenCorpusCountPreserved, 84);
  assert.equal(evidence.implementation.cloudflareDeployment, "PASS");
  assert.equal(evidence.implementation.productionSmoke, "PASS");
});

test("machine roadmap and handover preserve 8F complete without broad automatic admission", () => {
  const f = gate("8F");
  assert.equal(f.status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");
  assert.equal(f.terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");
  assert.equal(f.decisionInput.runtimeActivationAuthorized, true);
  assert.equal(f.decisionInput.publicRuntimeChanged, true);
  assert.equal(f.decisionInput.publicCorpusRecipeCountAfterDecision, 85);
  assert.equal(roadmap.boundaries.automaticPublicRecommendationAdmission, false);
  assert.equal(current.corpus_scale.step8f.status, "COMPLETE_PASS_PUBLIC_RUNTIME_ACTIVATED");
  assert.equal(current.corpus_scale.step8f.terminal, "STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED");
  assert.equal(current.corpus_scale.step8f.automatic_broader_admission_authorized, false);
});

test("public runtime remains 85 and historical golden corpus 84 as protected Step 8G advances independently", () => {
  assert.equal(ALL_RECIPES.length, 84);
  assert.equal(ACTIVATED_EXTERNAL_RECIPES.length, 1);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 85);
  assert.equal(gate("8G").status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(gate("8G").doesNotDependOn.includes("8F"), true);
  assert.equal(gate("8G").latestIteration.publicRuntimeChanged, false);
  assert.equal(gate("8G").latestIteration.recommendationAdmissionChanged, false);
  assert.equal(current.corpus_scale.step8g.public_runtime_changed, false);
  assert.equal(current.corpus_scale.step8g.recommendation_admission_changed, false);
});
