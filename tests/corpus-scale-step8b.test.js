import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  STEP8A_INITIAL_RECIPE_SHARDS,
  buildStep8APopulationPlan
} from "../scripts/corpus-scale-step8a-core.mjs";
import {
  STEP8B_MACHINE_PREP_CONTRACT_VERSION,
  STEP8B_MAX_CANARY_ROWS_PER_SHARD,
  STEP8B_RECEIPT_TABLE_SQL,
  STEP8B_RECIPE_TABLE_SQL,
  STEP8B_REQUIRED_RECIPE_SHARDS,
  STEP8B_SHARD_SPECS,
  buildStep8BMachineCanaryPlan,
  buildStep8BProtectedReadPlan,
  classifyStep8BCanaryProgress,
  validateStep8BLiveEvidenceEnvelope,
  verifiedStep8BReceipt
} from "../scripts/corpus-scale-step8b-core.mjs";
import { STEP7A_BUDGETS } from "../scripts/corpus-scale-step7a-core.mjs";

const hash = recipe => createHash("sha256").update(JSON.stringify(recipe)).digest("hex");
const bytes = recipe => Buffer.byteLength(JSON.stringify(recipe), "utf8");

const sourceCohorts = [{
  id: "reviewed-runtime-oracle",
  sourceName: "Culinary Recommender reviewed runtime corpus",
  sourceVersion: "step8b-golden-oracle-v1",
  admissionState: "PASS_ALREADY_ESTABLISHED",
  protectedPopulationAllowed: true,
  publicRuntimeActivationAuthorized: false,
  evidenceRefs: ["docs/CORPUS_SCALE_STEP7D_PROTECTED_84_CANARY.md"]
}];

const entries = ALL_RECIPES.map((recipe, ordinal) => ({
  ordinal,
  recipeId: recipe.id,
  bodySha256: hash(recipe),
  bodyBytes: bytes(recipe),
  sourceCohortId: sourceCohorts[0].id
}));

function step8aPlan(options = {}) {
  return buildStep8APopulationPlan({
    corpusVersion: "v0001",
    sourceCohorts,
    entries,
    ...options
  });
}

function canary(options = {}) {
  return buildStep8BMachineCanaryPlan(step8aPlan(), options);
}

test("Step 8B is exactly the minimum two-shard topology earned by Step 8A", () => {
  assert.equal(STEP8B_REQUIRED_RECIPE_SHARDS, 2);
  assert.equal(STEP8B_REQUIRED_RECIPE_SHARDS, STEP8A_INITIAL_RECIPE_SHARDS);
  assert.equal(STEP8B_SHARD_SPECS.length, 2);
  assert.deepEqual(STEP8B_SHARD_SPECS.map(item => item.bindingName), [
    "CULINARY_RECIPE_SHARD_00_DB",
    "CULINARY_RECIPE_SHARD_01_DB"
  ]);
  assert.equal(new Set(STEP8B_SHARD_SPECS.map(item => item.databaseName)).size, 2);
});

test("machine canary plan deterministically selects one bounded batch from each shard", () => {
  const first = canary();
  const second = canary();
  assert.equal(first.contractVersion, STEP8B_MACHINE_PREP_CONTRACT_VERSION);
  assert.equal(first.canaryPlanSha256, second.canaryPlanSha256);
  assert.equal(first.shardBatches.length, 2);
  assert.deepEqual(first.shardBatches, second.shardBatches);
  for (const batch of first.shardBatches) {
    assert.ok(batch.rowCount >= 1 && batch.rowCount <= STEP8B_MAX_CANARY_ROWS_PER_SHARD);
    assert.equal(batch.plannedStatements, batch.rowCount + 1);
    assert.ok(batch.plannedStatements <= 11);
    assert.match(batch.expectedSha256, /^[a-f0-9]{64}$/);
  }
});

test("canary plan contains descriptors only, not recipe bodies", () => {
  const text = JSON.stringify(canary());
  assert.equal(text.includes('"instructions"'), false);
  assert.equal(text.includes('"ingredients"'), false);
  assert.equal(text.includes('"body_json"'), false);
});

test("two selected recipes can prove a bounded authenticated cross-shard read within project budget", () => {
  const plan = canary();
  const recipeIds = plan.shardBatches.map(batch => batch.entries[0].recipeId);
  const read = buildStep8BProtectedReadPlan(plan, recipeIds);
  assert.equal(read.touchedShards, 2);
  assert.equal(read.accountStateReads, 1);
  assert.equal(read.d1Subqueries, 3);
  assert.ok(read.d1Subqueries <= STEP7A_BUDGETS.maxD1SubqueriesPerProtectedRequest);
  assert.equal(read.fullCorpusScan, false);
  assert.deepEqual(read.shardReads.map(item => item.bindingName), STEP8B_SHARD_SPECS.map(item => item.bindingName));
});

test("verified first shard plus verified-absent second shard is resumable without rewriting the first", () => {
  const plan = canary();
  const first = verifiedStep8BReceipt(plan.shardBatches[0]);
  const second = { batchId: plan.shardBatches[1].batchId, status: "ABSENT_VERIFIED" };
  const progress = classifyStep8BCanaryProgress(plan, [first, second]);
  assert.equal(progress.status, "RESUMABLE_PARTIAL");
  assert.equal(progress.writesMayContinue, true);
  assert.deepEqual(progress.idempotentSkipBatchIds, [plan.shardBatches[0].batchId]);
  assert.deepEqual(progress.retryableBatchIds, [plan.shardBatches[1].batchId]);
});

test("indeterminate write state fails closed rather than allowing a blind retry", () => {
  const plan = canary();
  const progress = classifyStep8BCanaryProgress(plan, [{
    batchId: plan.shardBatches[0].batchId,
    status: "WRITE_ERROR_UNKNOWN_COMMIT_STATE"
  }]);
  assert.equal(progress.status, "CONFLICT_FAIL_CLOSED");
  assert.equal(progress.writesMayContinue, false);
  assert.equal(progress.conflicts[0].reason, "INDETERMINATE_OR_UNVERIFIED_STATE");
});

test("both exact verified receipts complete the machine canary without another write pass", () => {
  const plan = canary();
  const progress = classifyStep8BCanaryProgress(plan, plan.shardBatches.map(verifiedStep8BReceipt));
  assert.equal(progress.status, "COMPLETE_VERIFIED");
  assert.equal(progress.retryableBatchIds.length, 0);
  assert.equal(progress.idempotentSkipBatchIds.length, 2);
});

test("schema freezes immutable corpus identity, recipe identity and exact receipt identity", () => {
  assert.match(STEP8B_RECIPE_TABLE_SQL, /PRIMARY KEY \(corpus_version, ordinal\)/);
  assert.match(STEP8B_RECIPE_TABLE_SQL, /UNIQUE \(corpus_version, recipe_id\)/);
  assert.match(STEP8B_RECIPE_TABLE_SQL, /body_sha256 TEXT NOT NULL/);
  assert.match(STEP8B_RECEIPT_TABLE_SQL, /PRIMARY KEY \(corpus_version, batch_id\)/);
  assert.match(STEP8B_RECEIPT_TABLE_SQL, /expected_sha256 TEXT NOT NULL/);
});

test("machine prep rejects wider topology and larger write units before live evidence earns them", () => {
  assert.throws(
    () => buildStep8BMachineCanaryPlan(step8aPlan({ recipeShardCount: 3 })),
    /exactly 2 recipe-body shards/
  );
  assert.throws(
    () => canary({ maxRowsPerShard: STEP8B_MAX_CANARY_ROWS_PER_SHARD + 1 }),
    /exceeds inherited pre-canary maximum/
  );
});

test("Step 8B live evidence requires exact two-shard, auth, fail-closed, recovery and zero-billing boundaries", () => {
  const clean = {
    humanAccountGatePassed: true,
    createdRecipeBodyShards: 2,
    boundShardBindings: 2,
    authenticatedCrossShardReadPass: true,
    unauthenticatedDeniedBeforeShardRead: true,
    freeLimitFailClosedBeforeShardRead: true,
    idempotentWritePass: true,
    partialFailureRecoveryPass: true,
    rollbackPass: true,
    fullCorpusScans: 0,
    maxObservedD1Subqueries: 3,
    billingAuthorizationObserved: false,
    paidPlanActivated: false,
    r2Activated: false,
    zeroTrustAccessActivated: false,
    publicRecommendationRuntimeChanged: false,
    youtubeStateModified: false,
    nutritionBLaneModified: false,
    knowledgeCoreWritePerformed: false
  };
  const pass = validateStep8BLiveEvidenceEnvelope(clean);
  assert.equal(pass.pass, true);
  assert.equal(pass.terminal, "STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS");

  for (const mutation of [
    { humanAccountGatePassed: false },
    { createdRecipeBodyShards: 1 },
    { authenticatedCrossShardReadPass: false },
    { freeLimitFailClosedBeforeShardRead: false },
    { partialFailureRecoveryPass: false },
    { fullCorpusScans: 1 },
    { maxObservedD1Subqueries: STEP7A_BUDGETS.maxD1SubqueriesPerProtectedRequest + 1 },
    { billingAuthorizationObserved: true },
    { publicRecommendationRuntimeChanged: true },
    { nutritionBLaneModified: true },
    { youtubeStateModified: true },
    { knowledgeCoreWritePerformed: true }
  ]) {
    assert.equal(validateStep8BLiveEvidenceEnvelope({ ...clean, ...mutation }).pass, false);
  }
});
