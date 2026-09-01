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

const discoveryRecordFromLedger = record => ({
  id: `wikibooks_discovery_${record.pageid}`,
  pageid: record.pageid,
  title: record.title,
  revid: record.revid,
  timestamp: record.timestamp,
  reviewState: "DISCOVERED_UNREVIEWED",
  recommendationState: "NOT_APPLICABLE",
  hardMetadataState: "NOT_REVIEWED",
  ingredientMappingState: "NOT_REVIEWED",
  nutritionState: "NOT_APPLICABLE",
  runtimeArtifact: null,
  coverage: null
});

const discoverySnapshot = ({ record, complete }) => ({
  schemaVersion: "wikibooks-gate-f2-discovery-v1",
  source: GATE_F2_SOURCE,
  acquiredAt: "2026-09-01T16:45:00Z",
  acquisitionMode: "METADATA_AND_EXACT_REVISION_IDS_ONLY",
  requestedLimit: 1,
  returnedRecordCount: 1,
  sourceUniverseState: complete ? "SOURCE_EXHAUSTED" : "LIMIT_REACHED",
  sourceUniverseComplete: complete,
  runtimeActivationAuthorized: false,
  records: [discoveryRecordFromLedger(record)]
});

test("Gate F2 complete discovery holds active tracked pages that disappear from the source universe", () => {
  const observed = ledger.records.find(record => record.reviewState === "ADMITTED");
  const discovery = discoverySnapshot({ record: observed, complete: true });

  assert.deepEqual(validateGateF2DiscoverySnapshot(discovery), []);
  const queue = buildGateF2ReviewQueue(ledger, discovery);

  assert.equal(queue.sourcePresenceAuditEligible, true);
  assert.equal(queue.unchangedTrackedRevisionCount, 1);
  assert.equal(queue.reviewQueueCount, 0);
  assert.equal(queue.holdCount, 0);
  assert.equal(queue.revisionOrderHoldCount, 0);
  assert.equal(queue.sourcePresenceHoldCount, 7);
  assert.equal(queue.totalHoldCount, 7);
  assert.deepEqual(queue.sourcePresenceReasonCounts, {
    TRACKED_PAGE_NOT_IN_COMPLETE_DISCOVERY: 7
  });

  for (const hold of queue.sourcePresenceHolds) {
    assert.equal(hold.holdReason, "TRACKED_PAGE_NOT_IN_COMPLETE_DISCOVERY");
    assert.equal(hold.holdAction, "HOLD_SOURCE_PRESENCE_ANOMALY");
    assert.ok(hold.presenceRelevantReviewStates.includes("ADMITTED"));
    assert.equal(hold.sourceUniverseComplete, true);
    assert.equal(hold.mayDeleteTrackedRecord, false);
    assert.equal(hold.mayOverwriteTrackedRecord, false);
    assert.equal(hold.runtimeActivationAuthorized, false);
  }
});

test("Gate F2 partial discovery never interprets unobserved tracked pages as source removals", () => {
  const observed = ledger.records.find(record => record.reviewState === "ADMITTED");
  const discovery = discoverySnapshot({ record: observed, complete: false });

  assert.deepEqual(validateGateF2DiscoverySnapshot(discovery), []);
  const queue = buildGateF2ReviewQueue(ledger, discovery);

  assert.equal(queue.sourcePresenceAuditEligible, false);
  assert.equal(queue.sourcePresenceHoldCount, 0);
  assert.equal(queue.totalHoldCount, 0);
  assert.deepEqual(queue.sourcePresenceHolds, []);
  assert.deepEqual(queue.sourcePresenceReasonCounts, {
    TRACKED_PAGE_NOT_IN_COMPLETE_DISCOVERY: 0
  });
});

test("Gate F2 source-presence holds anchor to the newest immutable history row", () => {
  const candidate = structuredClone(ledger);
  const baba = candidate.records.find(record => record.pageid === 28381 && record.reviewState === "ADMITTED");
  const newer = {
    ...structuredClone(baba),
    id: "wikibooks_baba_ganoush_review_ready_newer_revision",
    revid: 999999996,
    timestamp: "2026-09-01T16:40:00Z",
    reviewState: "REVIEW_READY",
    recommendationState: "NOT_APPLICABLE",
    runtimeArtifact: null
  };
  candidate.records.push(newer);

  assert.deepEqual(validateGateF2Ledger(candidate), []);

  const observed = candidate.records.find(record => record.pageid === 25256 && record.reviewState === "ADMITTED");
  const discovery = discoverySnapshot({ record: observed, complete: true });
  const queue = buildGateF2ReviewQueue(candidate, discovery);
  const hold = queue.sourcePresenceHolds.find(row => row.pageid === 28381);

  assert.ok(hold);
  assert.equal(hold.trackedReviewState, "REVIEW_READY");
  assert.equal(hold.trackedRevisionId, 999999996);
  assert.equal(hold.trackedRevisionTimestamp, "2026-09-01T16:40:00Z");
  assert.deepEqual(hold.presenceRelevantReviewStates, ["ADMITTED", "REVIEW_READY"]);
  assert.equal(hold.holdAction, "HOLD_SOURCE_PRESENCE_ANOMALY");
  assert.equal(hold.mayDeleteTrackedRecord, false);
});

test("Gate F2 keeps an admitted source-presence obligation when a newer reviewed revision is rejected", () => {
  const candidate = structuredClone(ledger);
  const baba = candidate.records.find(record => record.pageid === 28381 && record.reviewState === "ADMITTED");
  const rejectedNewer = {
    ...structuredClone(baba),
    id: "wikibooks_baba_ganoush_rejected_newer_revision",
    revid: 999999997,
    timestamp: "2026-09-01T16:42:00Z",
    reviewState: "REJECTED",
    recommendationState: "NOT_APPLICABLE",
    hardMetadataState: "REJECTED",
    ingredientMappingState: "NOT_APPLICABLE",
    runtimeArtifact: null,
    rejectionReason: "NEWER_REVISION_NOT_ADMISSIBLE"
  };
  candidate.records.push(rejectedNewer);

  assert.deepEqual(validateGateF2Ledger(candidate), []);

  const observed = candidate.records.find(record => record.pageid === 25256 && record.reviewState === "ADMITTED");
  const discovery = discoverySnapshot({ record: observed, complete: true });
  const queue = buildGateF2ReviewQueue(candidate, discovery);
  const hold = queue.sourcePresenceHolds.find(row => row.pageid === 28381);

  assert.ok(hold);
  assert.equal(hold.trackedReviewState, "REJECTED");
  assert.equal(hold.trackedRevisionId, 999999997);
  assert.deepEqual(hold.presenceRelevantReviewStates, ["ADMITTED"]);
  assert.equal(hold.holdReason, "TRACKED_PAGE_NOT_IN_COMPLETE_DISCOVERY");
  assert.equal(hold.mayDeleteTrackedRecord, false);
});
