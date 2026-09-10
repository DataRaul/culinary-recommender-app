import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const roadmap = JSON.parse(readFileSync(resolve(ROOT, "config/corpus_scale_step8_roadmap.json"), "utf8"));
const gates = new Map(roadmap.gates.map(gate => [gate.id, gate]));
const gate = id => gates.get(id);

test("Step 8B machine preparation is complete but live terminal is not fabricated", () => {
  const b = gate("8B");
  assert.equal(b.status, "MACHINE_PREPARATION_COMPLETE_MERGED_GREEN__HUMAN_ACCOUNT_GATE_REQUIRED");
  assert.equal(b.machinePreparation.mergeSha, "280d261979908b42a7522f3f036d958cc619bb41");
  assert.deepEqual(b.machinePreparation.validationRuns, [34512554325, 34513562037]);
  assert.equal(b.machinePreparation.recipeBodyShardsCreated, 0);
  assert.equal(b.machinePreparation.liveTerminalEarned, false);
  assert.equal(b.initialRecipeBodyShardCount, 2);
  assert.equal(b.humanRequired, true);
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

test("Step 8D remains blocked solely on the unearned live 8B input", () => {
  const d = gate("8D");
  assert.deepEqual(d.dependsOn, ["8B", "8C"]);
  assert.equal(d.status, "BLOCKED_PENDING_8B_LIVE_PASS__8C_INPUT_READY");
  assert.equal(gate("8B").machinePreparation.liveTerminalEarned, false);
  assert.equal(gate("8C").terminal, "STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE");
});

test("the first human action is one exact D1 Free/no-billing classification gate", () => {
  const human = roadmap.currentHumanGate;
  assert.equal(human.id, "STEP8B_FIRST_D1_SHARD_NO_BILLING_ACCOUNT_GATE");
  assert.equal(human.firstDatabaseName, "culinary-recipes-00");
  assert.equal(human.allowedOnlyIf, "FREE_NO_BILLING_AUTHORIZATION_CONFIRMED");
  assert.ok(human.stopIf.includes("CHECKOUT_OR_PAYMENT_METHOD_REQUIRED"));
  assert.ok(human.stopIf.includes("OVERAGE_OR_USAGE_CHARGE_AUTHORIZATION"));
  assert.ok(human.stopIf.includes("WORKERS_PAID_ACTIVATION"));
  assert.ok(human.stopIf.includes("R2_ACTIVATION"));
  assert.ok(human.stopIf.includes("ZERO_TRUST_ACCESS_ACTIVATION"));
  assert.ok(human.stopIf.includes("AMBIGUOUS_BILLING_STATE"));
});

test("source-state closeout keeps unresolved sources held instead of relaxing them", () => {
  assert.match(roadmap.sourceStateCurrent.openRecipeArchiveSpanish, /^HOLD_RIGHTS_AMBIGUOUS/);
  assert.equal(roadmap.sourceStateCurrent.recipeDb, "SOURCE_COHORT_SALVAGE_ONLY");
  assert.match(roadmap.sourceStateCurrent.uniTools, /^STEP8C_RIGHTS_CLEAN_PROTECTED_POPULATION_INPUT/);
});

test("public, cost and adjacent-lane firewalls remain unchanged at the human gate", () => {
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
