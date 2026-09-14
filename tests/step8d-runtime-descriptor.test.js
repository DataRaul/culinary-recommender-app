import test from "node:test";
import assert from "node:assert/strict";

import manifest from "../data/generated/step8d/manifest.json" with { type: "json" };
import plan from "../data/generated/step8d/population-plan-descriptors.json" with { type: "json" };
import { STEP8D_RUNTIME_DESCRIPTOR } from "../data/generated/step8d/runtime-descriptor.mjs";
import { publicStep8DPlanSummary as canonicalSummary } from "../src/server/step8d-live.mjs";
import { publicStep8DPlanSummary as runtimeSummary } from "../src/server/step8d-live-runtime.mjs";

function compactBatch(batch) {
  return {
    batchId: String(batch.batchId),
    shardNumber: Number(batch.shardNumber),
    batchNumber: Number(batch.batchNumber),
    rowCount: Number(batch.rowCount),
    totalBodyBytes: Number(batch.totalBodyBytes),
    expectedSha256: String(batch.expectedSha256)
  };
}

function shardRows() {
  return manifest.routing.descriptors.map(descriptor => ({
    shardNumber: Number(descriptor.shardNumber),
    rowCount: Number(descriptor.rowCount),
    totalBodyBytes: Number(descriptor.totalBodyBytes),
    entriesSha256: String(descriptor.entriesSha256)
  }));
}

function canaries() {
  return [0, 1].map(shardNumber => {
    const batch = plan.batches.find(candidate => Number(candidate.shardNumber) === shardNumber);
    const entry = batch.entries[0];
    return {
      shardNumber,
      ordinal: Number(entry.ordinal),
      recipeId: String(entry.recipeId),
      bodySha256: String(entry.bodySha256),
      bodyBytes: Number(entry.bodyBytes),
      sourceCohortId: String(entry.sourceCohortId)
    };
  });
}

test("Step 8D Cloudflare runtime descriptor is an exact compact projection of frozen JSON evidence", () => {
  assert.equal(STEP8D_RUNTIME_DESCRIPTOR.manifestSha256, manifest.manifestSha256);
  assert.equal(STEP8D_RUNTIME_DESCRIPTOR.step8APopulationManifestSha256, plan.manifestSha256);
  assert.equal(STEP8D_RUNTIME_DESCRIPTOR.populationPlanSha256, plan.populationPlanSha256);
  assert.deepEqual(STEP8D_RUNTIME_DESCRIPTOR.shardRows, shardRows());
  assert.deepEqual(STEP8D_RUNTIME_DESCRIPTOR.batches, plan.batches.map(compactBatch));
  assert.deepEqual(STEP8D_RUNTIME_DESCRIPTOR.crossShardCanaries, canaries());
});

test("Step 8D Cloudflare runtime summary preserves the canonical live contract", () => {
  const canonical = canonicalSummary();
  const runtime = runtimeSummary();
  for (const field of [
    "contractVersion",
    "corpusVersion",
    "sourceCohortId",
    "recipeCount",
    "batchCount",
    "shardCount",
    "maxRowsPerBatch",
    "maxProtectedD1Subqueries",
    "manifestSha256",
    "step8APopulationManifestSha256",
    "populationPlanSha256"
  ]) {
    assert.equal(runtime[field], canonical[field], field);
  }
  assert.deepEqual(runtime.shardRows, canonical.shardRows);
  assert.deepEqual(runtime.batches, canonical.batches.map(compactBatch));
});
