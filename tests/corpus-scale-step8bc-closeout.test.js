import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const roadmap = JSON.parse(readFileSync(resolve(ROOT, "config/corpus_scale_step8_roadmap.json"), "utf8"));
const gates = new Map(roadmap.gates.map(gate => [gate.id, gate]));
const gate = id => gates.get(id);

test("Step 8B records exactly two human-attested Free/no-billing shards and no fabricated live terminal", () => {
  const b = gate("8B");
  assert.equal(b.status, "TWO_D1_SHARDS_HUMAN_ATTESTED_CREATED__LIVE_CANARY_RUNTIME_MERGED_GREEN__PAGES_BINDING_GATE_REQUIRED");
  assert.equal(b.machinePreparation.mergeSha, "280d261979908b42a7522f3f036d958cc619bb41");
  assert.deepEqual(b.machinePreparation.validationRuns, [34512554325, 34513562037]);
  assert.equal(b.machinePreparation.liveTerminalEarned, false);
  assert.equal(b.initialRecipeBodyShardCount, 2);
  assert.equal(b.humanRequired, true);
  assert.equal(b.liveAccountProgress.evidenceClass, "HUMAN_ATTESTED_ACCOUNT_GATE");
  assert.equal(b.liveAccountProgress.firstShard.database, "culinary-recipes-00");
  assert.equal(b.liveAccountProgress.firstShard.binding, "CULINARY_RECIPE_SHARD_00_DB");
  assert.equal(b.liveAccountProgress.firstShard.status, "CREATED");
  assert.equal(b.liveAccountProgress.firstShard.billingClassification, "FREE_NO_BILLING_AUTHORIZATION_CONFIRMED");
  assert.equal(b.liveAccountProgress.secondShard.database, "culinary-recipes-01");
  assert.equal(b.liveAccountProgress.secondShard.binding, "CULINARY_RECIPE_SHARD_01_DB");
  assert.equal(b.liveAccountProgress.secondShard.status, "CREATED");
  assert.equal(b.liveAccountProgress.secondShard.billingClassification, "FREE_NO_BILLING_AUTHORIZATION_CONFIRMED");
  assert.equal(b.liveAccountProgress.humanAttestedShardsCreated, 2);
  assert.equal(b.liveAccountProgress.machineVerifiedShardsCreated, 0);
  assert.equal(b.liveAccountProgress.liveTerminalEarned, false);
});

test("Step 8B protected live-canary runtime is merged and green but bindings are not fabricated", () => {
  const live = gate("8B").liveCanaryRuntime;
  assert.equal(live.pr, 136);
  assert.equal(live.mergeSha, "3db8084b0571e192094c384ece20417202b1fdc2");
  assert.equal(live.prValidationRun, 34778087774);
  assert.equal(live.postMergeValidationRun, 34778233576);
  assert.equal(live.pagesDeploymentRun, 34778233094);
  assert.equal(live.repositoryValidation, "PASS");
  assert.equal(live.browserValidation, "PASS");
  assert.equal(live.productionSmoke, "PASS");
  assert.equal(live.pagesDeployment, "PASS");
  assert.equal(live.route, "/api/step8b/canary");
  assert.equal(live.sameOriginCanaryPage, "/step8b-canary.html");
  assert.equal(live.bindingsConfigured, false);
  assert.equal(live.liveTerminalEarned, false);
});

test("Step 8C terminal is exact and bounded to the pinned UniTools cohort", () => {
  const c = gate("8C");
  assert.equal(c.status, "COMPLETE_PASS_MERGED_GREEN");
  assert.equal(c.terminal, "STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE");
  assert.equal(c.mergeSha, "34afa1d73af6f99f20b31739e8bebacabff81b2a");
  assert.deepEqual(c.validationRuns, [34513497653, 34513710875, 34513900064]);
  assert.equal(c.qualifiedInput.sourceId, "unitools-world-recipes-v1_1_0");
  assert.equal(c.qualifiedInput.recordCount, 501);
  assert.equal(c.qualifiedInput.sourceVersion, "1.1.0");
  assert.equal(c.qualifiedInput.immutableCommit, "1d09e9548d957dd0375301146a86dddf5e269c1b");
  assert.equal(c.qualifiedInput.dataBlobSha, "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed");
  assert.equal(c.qualifiedInput.licenseId, "CC-BY-SA-4.0");
  assert.equal(c.qualifiedInput.protectedPopulationInputOnly, true);
});

test("Step 8D remains blocked solely on the unearned live 8B terminal", () => {
  const d = gate("8D");
  assert.deepEqual(d.dependsOn, ["8B", "8C"]);
  assert.equal(d.status, "BLOCKED_PENDING_8B_LIVE_PASS__8C_INPUT_READY");
  assert.equal(gate("8B").liveCanaryRuntime.liveTerminalEarned, false);
  assert.equal(gate("8C").terminal, "STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE");
});

test("the current human action is exactly two existing D1 Pages bindings", () => {
  const human = roadmap.currentHumanGate;
  assert.equal(human.id, "STEP8B_PAGES_TWO_D1_BINDINGS_GATE");
  assert.equal(human.project, "culinary-recommender-app");
  assert.deepEqual(human.bindings, [
    { binding: "CULINARY_RECIPE_SHARD_00_DB", database: "culinary-recipes-00" },
    { binding: "CULINARY_RECIPE_SHARD_01_DB", database: "culinary-recipes-01" }
  ]);
  assert.equal(human.allowedOnlyIf, "EXACT_EXISTING_D1_BINDINGS_ONLY__NO_BILLING_AUTHORIZATION");
  assert.ok(human.stopIf.includes("CHECKOUT_OR_PAYMENT_METHOD_REQUIRED"));
  assert.ok(human.stopIf.includes("OVERAGE_OR_USAGE_CHARGE_AUTHORIZATION"));
  assert.ok(human.stopIf.includes("WORKERS_PAID_ACTIVATION"));
  assert.ok(human.stopIf.includes("R2_ACTIVATION"));
  assert.ok(human.stopIf.includes("ZERO_TRUST_ACCESS_ACTIVATION"));
  assert.ok(human.stopIf.includes("AMBIGUOUS_BILLING_STATE"));
  assert.ok(human.stopIf.includes("ANY_BINDING_OTHER_THAN_THE_EXACT_TWO_LISTED"));
});

test("source-state closeout keeps unresolved sources held instead of relaxing them", () => {
  assert.match(roadmap.sourceStateCurrent.openRecipeArchiveSpanish, /^HOLD_RIGHTS_AMBIGUOUS/);
  assert.equal(roadmap.sourceStateCurrent.recipeDb, "SOURCE_COHORT_SALVAGE_ONLY");
  assert.match(roadmap.sourceStateCurrent.uniTools, /^STEP8C_RIGHTS_CLEAN_PROTECTED_POPULATION_INPUT/);
});

test("public, cost and adjacent-lane firewalls remain unchanged at the binding gate", () => {
  assert.equal(roadmap.boundaries.noBillingAuthorization, true);
  assert.equal(roadmap.boundaries.workersPaidAllowed, false);
  assert.equal(roadmap.boundaries.r2Allowed, false);
  assert.equal(roadmap.boundaries.zeroTrustAccessAllowed, false);
  assert.equal(roadmap.boundaries.nutritionBLaneIndependent, true);
  assert.equal(roadmap.boundaries.youtubeCulinaryStateMutableFromStep8, false);
  assert.equal(roadmap.boundaries.knowledgeCoreWriteAllowedFromAppLane, false);
  assert.equal(gate("8B").publicRuntimeChangeAllowed, false);
  assert.equal(gate("8C").publicRuntimeChangeAllowed, false);
  assert.equal(gate("8D").publicRuntimeChangeAllowed, false);
});
