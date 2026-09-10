import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  STEP8A_INITIAL_RECIPE_SHARDS,
  STEP8A_MAX_RECIPE_SHARDS,
  STEP8A_POPULATION_CONTRACT_VERSION,
  STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH,
  buildStep8APopulationPlan,
  buildStep8ARollbackDirective,
  classifyStep8APopulationProgress,
  validateStep8AEvidenceEnvelope,
  verifiedReceiptForBatch
} from "../scripts/corpus-scale-step8a-core.mjs";
import {
  STEP7A_RECIPE_DATABASES,
  STEP7A_RESERVED_DATABASES
} from "../scripts/corpus-scale-step7a-core.mjs";

const bodySha256 = recipe => createHash("sha256").update(JSON.stringify(recipe)).digest("hex");
const bodyBytes = recipe => Buffer.byteLength(JSON.stringify(recipe), "utf8");

const sourceCohorts = [
  {
    id: "reviewed-runtime-oracle",
    sourceName: "Culinary Recommender reviewed runtime corpus",
    sourceVersion: "step8a-repository-fixture-v1",
    admissionState: "PASS_ALREADY_ESTABLISHED",
    protectedPopulationAllowed: true,
    publicRuntimeActivationAuthorized: false,
    evidenceRefs: [
      "docs/CORPUS_SCALE_STEP6_CONTRACT.md",
      "docs/CORPUS_SCALE_STEP7D_PROTECTED_84_CANARY.md"
    ]
  }
];

const entries = ALL_RECIPES.map((recipe, ordinal) => ({
  ordinal,
  recipeId: recipe.id,
  bodySha256: bodySha256(recipe),
  bodyBytes: bodyBytes(recipe),
  sourceCohortId: "reviewed-runtime-oracle"
}));

function planFor(version = "v0001", options = {}) {
  return buildStep8APopulationPlan({
    corpusVersion: version,
    sourceCohorts,
    entries,
    ...options
  });
}

test("Step 8A uses the measured shard ceiling and starts with the minimum useful two-shard topology", () => {
  assert.equal(STEP8A_INITIAL_RECIPE_SHARDS, 2);
  assert.equal(STEP8A_MAX_RECIPE_SHARDS, STEP7A_RECIPE_DATABASES);
  assert.equal(STEP7A_RESERVED_DATABASES, 1);
  const plan = planFor();
  assert.equal(plan.manifest.recipeBodyShards.shardCount, 2);
  assert.equal(plan.manifest.inheritedBudgets.reservedDatabaseSlots, 1);
  assert.equal(plan.manifest.invariants.billingAuthorizationAllowed, false);
});

test("population plan is deterministic even when input descriptors arrive in reverse order", () => {
  const forward = planFor();
  const reversed = buildStep8APopulationPlan({
    corpusVersion: "v0001",
    sourceCohorts: [...sourceCohorts].reverse(),
    entries: [...entries].reverse()
  });
  assert.equal(forward.manifest.manifestSha256, reversed.manifest.manifestSha256);
  assert.equal(forward.populationPlanSha256, reversed.populationPlanSha256);
  assert.deepEqual(forward.batches, reversed.batches);
});

test("current reviewed corpus exercises both canary shards without storing full bodies in the manifest", () => {
  const plan = planFor();
  const nonEmptyShards = plan.manifest.recipeBodyShards.descriptors.filter(descriptor => descriptor.rowCount > 0);
  assert.equal(nonEmptyShards.length, 2);
  assert.equal(nonEmptyShards.reduce((sum, descriptor) => sum + descriptor.rowCount, 0), ALL_RECIPES.length);
  const manifestText = JSON.stringify(plan.manifest);
  assert.equal(manifestText.includes("instructions"), false);
  assert.equal(manifestText.includes("ingredients"), false);
});

test("pre-8B write batches preserve the already-proven 10-row ceiling and bounded statement shape", () => {
  const plan = planFor();
  assert.ok(plan.batches.length > 0);
  for (const batch of plan.batches) {
    assert.ok(batch.rowCount >= 1 && batch.rowCount <= STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH);
    assert.equal(batch.plannedStatements, batch.rowCount + 1);
    assert.ok(batch.plannedStatements <= 11);
    assert.match(batch.expectedSha256, /^[a-f0-9]{64}$/);
  }
});

test("partial exact receipts are resumable and exact completed batches become idempotent skips", () => {
  const plan = planFor();
  const completed = plan.batches.slice(0, Math.max(1, Math.floor(plan.batches.length / 2)));
  const progress = classifyStep8APopulationProgress(plan, completed.map(verifiedReceiptForBatch));
  assert.equal(progress.status, "RESUMABLE_PARTIAL");
  assert.equal(progress.writesMayContinue, true);
  assert.deepEqual(progress.idempotentSkipBatchIds, completed.map(batch => batch.batchId).sort());
  assert.ok(progress.pendingBatchIds.length > 0);
});

test("a mismatched receipt fails closed instead of being rewritten or silently accepted", () => {
  const plan = planFor();
  const receipt = verifiedReceiptForBatch(plan.batches[0]);
  receipt.expectedSha256 = "0".repeat(64);
  const progress = classifyStep8APopulationProgress(plan, [receipt]);
  assert.equal(progress.status, "CONFLICT_FAIL_CLOSED");
  assert.equal(progress.writesMayContinue, false);
  assert.equal(progress.conflicts[0].reason, "BATCH_FINGERPRINT_MISMATCH");
});

test("all exact receipts reach COMPLETE_VERIFIED without a second write pass", () => {
  const plan = planFor();
  const receipts = plan.batches.map(verifiedReceiptForBatch);
  const progress = classifyStep8APopulationProgress(plan, receipts);
  assert.equal(progress.status, "COMPLETE_VERIFIED");
  assert.equal(progress.pendingBatchIds.length, 0);
  assert.equal(progress.idempotentSkipBatchIds.length, plan.batches.length);
});

test("rollback is an immutable active-version pointer switch, never destructive deletion", () => {
  const parent = planFor("v0001");
  const child = buildStep8APopulationPlan({
    corpusVersion: "v0002",
    parentCorpusVersion: "v0001",
    sourceCohorts,
    entries
  });
  const rollback = buildStep8ARollbackDirective({
    fromManifest: child.manifest,
    toManifest: parent.manifest
  });
  assert.equal(rollback.mode, "ACTIVE_VERSION_POINTER_SWITCH_ONLY");
  assert.equal(rollback.requiresTargetIntegrityVerified, true);
  assert.equal(rollback.destructiveDeleteAllowed, false);
  assert.equal(rollback.publicRuntimeChangeAllowed, false);
  assert.equal(rollback.billingAuthorizationAllowed, false);
});

test("Step 8A terminal evidence rejects any live shard, public, paid, YT, Nutrition or Knowledge Core mutation", () => {
  const clean = {
    repositoryOnly: true,
    createdRecipeBodyShards: 0,
    publicRuntimeChanged: false,
    billingAuthorizationObserved: false,
    paidPlanActivated: false,
    r2Activated: false,
    zeroTrustAccessActivated: false,
    youtubeStateModified: false,
    nutritionBLaneModified: false,
    knowledgeCoreWritePerformed: false
  };
  assert.deepEqual(validateStep8AEvidenceEnvelope(clean), { pass: true, errors: [] });
  assert.equal(validateStep8AEvidenceEnvelope({ ...clean, createdRecipeBodyShards: 1 }).pass, false);
  assert.equal(validateStep8AEvidenceEnvelope({ ...clean, publicRuntimeChanged: true }).pass, false);
  assert.equal(validateStep8AEvidenceEnvelope({ ...clean, billingAuthorizationObserved: true }).pass, false);
  assert.equal(validateStep8AEvidenceEnvelope({ ...clean, nutritionBLaneModified: true }).pass, false);
  assert.equal(validateStep8AEvidenceEnvelope({ ...clean, youtubeStateModified: true }).pass, false);
  assert.equal(validateStep8AEvidenceEnvelope({ ...clean, knowledgeCoreWritePerformed: true }).pass, false);
});

test("contract rejects authority creep, unproven batch enlargement and malformed provenance", () => {
  assert.throws(() => planFor("v0001", { recipeShardCount: 1 }), /at least 2/);
  assert.throws(() => planFor("v0001", { recipeShardCount: STEP8A_MAX_RECIPE_SHARDS + 1 }), /exceeds measured maximum/);
  assert.throws(() => planFor("v0001", { rowsPerWriteBatch: STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH + 1 }), /exceeds pre-8B proven maximum/);
  assert.throws(() => buildStep8APopulationPlan({
    corpusVersion: "v0001",
    sourceCohorts: [{ ...sourceCohorts[0], publicRuntimeActivationAuthorized: true }],
    entries
  }), /cannot authorize public runtime activation/);
  assert.throws(() => buildStep8APopulationPlan({
    corpusVersion: "v0001",
    sourceCohorts: [{ ...sourceCohorts[0], sourceVersion: "" }],
    entries
  }), /immutable sourceVersion is required/);
  assert.throws(() => buildStep8APopulationPlan({
    corpusVersion: "v0001",
    sourceCohorts,
    entries: entries.map((entry, index) => index === 1 ? { ...entry, ordinal: 2 } : entry)
  }), /duplicate population ordinal|contiguous from zero/);
});

test("Step 8A manifest carries an explicit contract version and public/non-authority firewalls", () => {
  const manifest = planFor().manifest;
  assert.equal(manifest.contractVersion, STEP8A_POPULATION_CONTRACT_VERSION);
  assert.equal(manifest.invariants.publicRuntimeActivationAuthorized, false);
  assert.equal(manifest.invariants.automaticAdmissionAuthorized, false);
  assert.equal(manifest.invariants.sourceNutritionAuthorityImported, false);
  assert.equal(manifest.invariants.sourceDietaryAllergenInferenceAuthorized, false);
  assert.equal(manifest.invariants.sourceRatioPromotionAuthorized, false);
  assert.equal(manifest.invariants.destructiveRollbackAllowed, false);
});
