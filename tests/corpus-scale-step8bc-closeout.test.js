import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const roadmap = JSON.parse(readFileSync(resolve(ROOT, "config/corpus_scale_step8_roadmap.json"), "utf8"));
const gates = new Map(roadmap.gates.map(gate => [gate.id, gate]));
const gate = id => gates.get(id);

test("Step 8B terminal is earned on exactly two Free/no-billing bound shards", () => {
  const b = gate("8B");
  assert.equal(b.status, "COMPLETE_PASS_LIVE_PRODUCTION");
  assert.equal(b.terminal, "STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS");
  assert.equal(b.machinePreparation.mergeSha, "280d261979908b42a7522f3f036d958cc619bb41");
  assert.deepEqual(b.machinePreparation.validationRuns, [34512554325, 34513562037]);
  assert.equal(b.machinePreparation.liveTerminalEarned, true);
  assert.equal(b.initialRecipeBodyShardCount, 2);
  assert.equal(b.humanRequired, false);
  assert.equal(b.liveAccountProgress.firstShard.database, "culinary-recipes-00");
  assert.equal(b.liveAccountProgress.firstShard.binding, "CULINARY_RECIPE_SHARD_00_DB");
  assert.equal(b.liveAccountProgress.firstShard.status, "CREATED_AND_BOUND_RUNTIME_VERIFIED");
  assert.equal(b.liveAccountProgress.firstShard.billingClassification, "FREE_NO_BILLING_AUTHORIZATION_CONFIRMED");
  assert.equal(b.liveAccountProgress.secondShard.database, "culinary-recipes-01");
  assert.equal(b.liveAccountProgress.secondShard.binding, "CULINARY_RECIPE_SHARD_01_DB");
  assert.equal(b.liveAccountProgress.secondShard.status, "CREATED_AND_BOUND_RUNTIME_VERIFIED");
  assert.equal(b.liveAccountProgress.secondShard.billingClassification, "FREE_NO_BILLING_AUTHORIZATION_CONFIRMED");
  assert.equal(b.liveAccountProgress.humanAttestedShardsCreated, 2);
  assert.equal(b.liveAccountProgress.machineVerifiedBoundShards, 2);
  assert.equal(b.liveAccountProgress.liveTerminalEarned, true);
});

test("Step 8B live evidence freezes bounded authenticated and unauthenticated production behavior", () => {
  const live = gate("8B").liveCanaryRuntime;
  assert.equal(live.pr, 136);
  assert.equal(live.mergeSha, "3db8084b0571e192094c384ece20417202b1fdc2");
  assert.equal(live.repositoryValidation, "PASS");
  assert.equal(live.browserValidation, "PASS");
  assert.equal(live.productionSmoke, "PASS");
  assert.equal(live.pagesDeployment, "PASS");
  assert.equal(live.route, "/api/step8b/canary");
  assert.equal(live.sameOriginCanaryPage, "/step8b-canary.html");
  assert.equal(live.bindingsConfigured, true);
  assert.equal(live.liveTerminalEarned, true);

  const auth = live.authenticatedLiveEvidence;
  assert.equal(auth.pass, true);
  assert.equal(auth.boundShardBindings, 2);
  assert.equal(auth.freeLimitFailClosedBeforeShardRead, true);
  assert.equal(auth.partialFailureRecoveryPass, true);
  assert.equal(auth.idempotentWritePass, true);
  assert.equal(auth.authenticatedCrossShardReadPass, true);
  assert.equal(auth.rollbackPass, true);
  assert.equal(auth.fullCorpusScans, 0);
  assert.ok(auth.maxObservedD1Subqueries <= roadmap.inheritedBudgets.maxD1SubqueriesPerProtectedRequest);
  assert.equal(auth.normalPublicRecommendationRuntimeChanged, false);

  const unauth = live.externalUnauthenticatedProbe;
  assert.equal(unauth.httpStatus, 401);
  assert.equal(unauth.error, "UNAUTHORIZED");
  assert.equal(unauth.reason, "NO_SESSION");
  assert.equal(unauth.protectedDataReturned, false);
  assert.equal(unauth.shardQueries, 0);
});

test("Step 8C terminal remains exact and bounded to the pinned UniTools cohort", () => {
  const c = gate("8C");
  assert.equal(c.status, "COMPLETE_PASS_MERGED_GREEN");
  assert.equal(c.terminal, "STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE");
  assert.equal(c.mergeSha, "34afa1d73af6f99f20b31739e8bebacabff81b2a");
  assert.deepEqual(c.validationRuns, [34513497653, 34513710875, 34513900064]);
  assert.equal(c.qualifiedInput.sourceId, "unitools-world-recipes-v1_1_0");
  assert.equal(c.qualifiedInput.recordCount, 501);
  assert.equal(c.qualifiedInput.countryCount, 127);
  assert.equal(c.qualifiedInput.sourceVersion, "1.1.0");
  assert.equal(c.qualifiedInput.immutableCommit, "1d09e9548d957dd0375301146a86dddf5e269c1b");
  assert.equal(c.qualifiedInput.dataBlobSha, "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed");
  assert.equal(c.qualifiedInput.licenseId, "CC-BY-SA-4.0");
  assert.equal(c.qualifiedInput.protectedPopulationInputOnly, true);
});

test("Step 8D terminal PASS remains bound to the exact Step 8B and Step 8C prerequisites", () => {
  const d = gate("8D");
  assert.deepEqual(d.dependsOn, ["8B", "8C"]);
  assert.equal(d.status, "COMPLETE_PASS_LIVE_PRODUCTION");
  assert.equal(d.terminal, "STEP_8D_PROTECTED_POPULATION_PASS");
  assert.equal(gate("8B").terminal, "STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS");
  assert.equal(gate("8B").liveCanaryRuntime.liveTerminalEarned, true);
  assert.equal(gate("8C").terminal, "STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE");
  assert.equal(d.livePopulationEvidence.recipeCount, 501);
  assert.equal(d.livePopulationEvidence.verifiedBatchCount, 51);
  assert.equal(d.livePopulationEvidence.shardCount, 2);
  assert.equal(d.livePopulationEvidence.fullCorpusScans, 0);
  assert.ok(d.livePopulationEvidence.maxObservedD1Subqueries <= roadmap.inheritedBudgets.maxD1SubqueriesPerProtectedRequest);
  assert.equal(d.humanRequired, false);
  assert.equal(d.publicRuntimeChangeAllowed, false);
});

test("Step 8F remains parked and unauthorized while Step 8G is active", () => {
  const f = gate("8F");
  const g = gate("8G");
  assert.equal(f.status, "PARKED_EXPLICIT_HUMAN_PUBLIC_RUNTIME_DECISION");
  assert.equal(f.parked, true);
  assert.equal(f.blockingActiveLane, false);
  assert.equal(f.humanRequired, true);
  assert.equal(f.decisionInput.runtimeActivationAuthorized, false);
  assert.equal(f.decisionInput.publicRuntimeChanged, false);
  assert.equal(g.status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(g.doesNotDependOn.includes("8F"), true);
  assert.equal(g.humanRequired, false);
  assert.equal(g.publicRuntimeChangeAllowed, false);
});

test("Step 8B closeout evidence exists and does not authorize a third shard", () => {
  assert.equal(existsSync(resolve(ROOT, "docs/CORPUS_SCALE_STEP8B_LIVE_CANARY_PASS.md")), true);
  assert.equal(gate("8B").initialRecipeBodyShardCount, 2);
  assert.equal(roadmap.programme.createAllRecipeBodyShardsUpFront, false);
  assert.equal(roadmap.programme.recipeBodyShardMax, 8);
});

test("source-state closeout keeps unresolved sources held instead of relaxing them", () => {
  assert.match(roadmap.sourceStateCurrent.openRecipeArchiveSpanish, /^HOLD_RIGHTS_AMBIGUOUS/);
  assert.equal(roadmap.sourceStateCurrent.recipeDb, "SOURCE_COHORT_SALVAGE_ONLY");
  assert.match(roadmap.sourceStateCurrent.uniTools, /^STEP8D_PROTECTED_POPULATED_501/);
  assert.equal(
    roadmap.sourceStateCurrent.forkRecipe,
    "STEP8G_LIVE_PROTECTED_POPULATED_V8002__915_CHILD__1416_COMPOSED__ZERO_PUBLIC_RECOMMENDATION_ADMISSION"
  );
});

test("public, cost and adjacent-lane firewalls remain unchanged after Step 8B terminal", () => {
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
