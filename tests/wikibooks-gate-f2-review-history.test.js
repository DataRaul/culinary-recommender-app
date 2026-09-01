import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  GATE_F2_SOURCE,
  validateGateF2Ledger
} from "../scripts/wikibooks-gate-f2-contract.mjs";
import {
  buildGateF2ReviewQueue,
  validateGateF2DiscoverySnapshot
} from "../scripts/wikibooks-gate-f2-review-queue.mjs";

const ledger = JSON.parse(
  await readFile(new URL("../scripts/wikibooks-gate-f2-review-ledger.json", import.meta.url), "utf8")
);

test("Gate F2 compares discovery with the newest tracked revision even when an older exact revision remains in immutable history", () => {
  const candidate = structuredClone(ledger);
  candidate.records.push({
    id: "wikibooks_bruschetta_review_ready_revision_5000000",
    pageid: 25256,
    title: "Cookbook:Bruschetta",
    revid: 5000000,
    timestamp: "2026-08-01T12:00:00Z",
    reviewState: "REVIEW_READY",
    recommendationState: "NOT_APPLICABLE",
    hardMetadataState: "NOT_REVIEWED",
    ingredientMappingState: "NOT_REVIEWED",
    nutritionState: "NOT_APPLICABLE",
    runtimeArtifact: null,
    coverage: null
  });

  assert.deepEqual(validateGateF2Ledger(candidate), []);

  const discovery = {
    schemaVersion: "wikibooks-gate-f2-discovery-v1",
    source: GATE_F2_SOURCE,
    acquiredAt: "2026-09-01T10:00:00Z",
    acquisitionMode: "METADATA_AND_EXACT_REVISION_IDS_ONLY",
    requestedLimit: 1,
    returnedRecordCount: 1,
    sourceUniverseState: "LIMIT_REACHED",
    sourceUniverseComplete: false,
    runtimeActivationAuthorized: false,
    records: [{
      id: "wikibooks_discovery_25256_old_exact",
      pageid: 25256,
      title: "Cookbook:Bruschetta",
      revid: 4523487,
      timestamp: "2025-07-13T19:16:22Z",
      reviewState: "DISCOVERED_UNREVIEWED",
      recommendationState: "NOT_APPLICABLE",
      hardMetadataState: "NOT_REVIEWED",
      ingredientMappingState: "NOT_REVIEWED",
      nutritionState: "NOT_APPLICABLE",
      runtimeArtifact: null,
      coverage: null
    }]
  };

  assert.deepEqual(validateGateF2DiscoverySnapshot(discovery), []);
  const queue = buildGateF2ReviewQueue(candidate, discovery);

  assert.equal(queue.unchangedTrackedRevisionCount, 0);
  assert.equal(queue.reviewQueueCount, 1);
  assert.equal(queue.reviewEventCount, 0);
  assert.equal(queue.holdCount, 1);
  assert.equal(queue.queueReasonCounts.TRACKED_PAGE_REVISION_REGRESSION, 1);

  const held = queue.reviewQueue[0];
  assert.equal(held.queueReason, "TRACKED_PAGE_REVISION_REGRESSION");
  assert.equal(held.queueAction, "HOLD_SOURCE_ORDER_ANOMALY");
  assert.equal(held.revisionOrderState, "OLDER_REVISION");
  assert.equal(held.discoveredRevisionId, 4523487);
  assert.equal(held.trackedRevisionId, 5000000);
  assert.equal(held.trackedReviewState, "REVIEW_READY");
  assert.equal(held.mayOverwriteTrackedRecord, false);
});
