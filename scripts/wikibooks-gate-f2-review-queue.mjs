import {
  GATE_F2_SOURCE,
  assertValidGateF2Ledger
} from "./wikibooks-gate-f2-contract.mjs";

const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const isIsoDateTime = value => isNonEmptyString(value) && Number.isFinite(Date.parse(value));
const DISCOVERY_UNIVERSE_STATES = new Set(["SOURCE_EXHAUSTED", "LIMIT_REACHED"]);

export function validateGateF2DiscoverySnapshot(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== "object") return ["discovery snapshot must be an object"];
  if (snapshot.schemaVersion !== "wikibooks-gate-f2-discovery-v1") {
    errors.push("schemaVersion must be wikibooks-gate-f2-discovery-v1");
  }
  if (snapshot.source?.id !== GATE_F2_SOURCE.id) {
    errors.push(`source.id must be ${GATE_F2_SOURCE.id}`);
  }
  if (snapshot.source?.license !== GATE_F2_SOURCE.license ||
      snapshot.source?.licenseUrl !== GATE_F2_SOURCE.licenseUrl) {
    errors.push("source licence must match the Gate F2 source contract");
  }
  if (snapshot.source?.runtimeFetch !== false) {
    errors.push("source.runtimeFetch must remain false");
  }
  if (snapshot.source?.imagesBundled !== false) {
    errors.push("source.imagesBundled must remain false");
  }
  if (snapshot.source?.sourceNutritionImportedAsAuthority !== false) {
    errors.push("source.sourceNutritionImportedAsAuthority must remain false");
  }
  if (snapshot.acquisitionMode !== "METADATA_AND_EXACT_REVISION_IDS_ONLY") {
    errors.push("acquisitionMode must remain metadata-only");
  }
  if (!isIsoDateTime(snapshot.acquiredAt)) {
    errors.push("acquiredAt must be an ISO date-time");
  }
  if (!Number.isInteger(snapshot.requestedLimit) || snapshot.requestedLimit <= 0 || snapshot.requestedLimit > 10000) {
    errors.push("requestedLimit must be an integer between 1 and 10000");
  }
  if (!DISCOVERY_UNIVERSE_STATES.has(snapshot.sourceUniverseState)) {
    errors.push("sourceUniverseState must be SOURCE_EXHAUSTED or LIMIT_REACHED");
  }
  if (typeof snapshot.sourceUniverseComplete !== "boolean") {
    errors.push("sourceUniverseComplete must be boolean");
  } else if (snapshot.sourceUniverseComplete !== (snapshot.sourceUniverseState === "SOURCE_EXHAUSTED")) {
    errors.push("sourceUniverseComplete must agree with sourceUniverseState");
  }
  if (snapshot.runtimeActivationAuthorized !== false) {
    errors.push("runtimeActivationAuthorized must remain false");
  }
  if (!Array.isArray(snapshot.records)) {
    errors.push("records must be an array");
    return errors;
  }
  if (snapshot.returnedRecordCount !== snapshot.records.length) {
    errors.push("returnedRecordCount must equal records.length");
  }
  if (snapshot.records.length > snapshot.requestedLimit) {
    errors.push("records length must not exceed requestedLimit");
  }
  if (snapshot.sourceUniverseState === "LIMIT_REACHED" && snapshot.records.length !== snapshot.requestedLimit) {
    errors.push("LIMIT_REACHED snapshots must contain requestedLimit records");
  }

  const ids = new Set();
  const pageids = new Set();
  const revisionKeys = new Set();

  for (const record of snapshot.records) {
    const label = record?.id || record?.title || "discovery record";
    if (!isNonEmptyString(record?.id)) errors.push(`${label}: id is required`);
    if (ids.has(record?.id)) errors.push(`${label}: duplicate id`);
    ids.add(record?.id);

    if (!Number.isInteger(record?.pageid) || record.pageid <= 0) {
      errors.push(`${label}: positive integer pageid is required`);
    }
    if (pageids.has(record?.pageid)) errors.push(`${label}: duplicate pageid`);
    pageids.add(record?.pageid);

    if (!isNonEmptyString(record?.title) || !record.title.startsWith("Cookbook:")) {
      errors.push(`${label}: Cookbook: source title is required`);
    }
    if (!Number.isInteger(record?.revid) || record.revid <= 0) {
      errors.push(`${label}: positive integer revid is required`);
    }
    if (!isIsoDateTime(record?.timestamp)) {
      errors.push(`${label}: exact revision timestamp is required`);
    }

    const revisionKey = `${record?.pageid}:${record?.revid}`;
    if (revisionKeys.has(revisionKey)) errors.push(`${label}: duplicate page/revision pair`);
    revisionKeys.add(revisionKey);

    if (record?.reviewState !== "DISCOVERED_UNREVIEWED") {
      errors.push(`${label}: discovery reviewState must be DISCOVERED_UNREVIEWED`);
    }
    if (record?.recommendationState !== "NOT_APPLICABLE") {
      errors.push(`${label}: discovery recommendationState must be NOT_APPLICABLE`);
    }
    if (record?.hardMetadataState !== "NOT_REVIEWED") {
      errors.push(`${label}: discovery hardMetadataState must be NOT_REVIEWED`);
    }
    if (record?.ingredientMappingState !== "NOT_REVIEWED") {
      errors.push(`${label}: discovery ingredientMappingState must be NOT_REVIEWED`);
    }
    if (record?.nutritionState !== "NOT_APPLICABLE") {
      errors.push(`${label}: discovery nutritionState must be NOT_APPLICABLE`);
    }
    if (record?.runtimeArtifact !== null) {
      errors.push(`${label}: discovery runtimeArtifact must be null`);
    }
    if (record?.coverage !== null) {
      errors.push(`${label}: discovery coverage must remain null before review`);
    }
  }

  return errors;
}

export function assertValidGateF2DiscoverySnapshot(snapshot) {
  const errors = validateGateF2DiscoverySnapshot(snapshot);
  if (errors.length) {
    throw new Error(`Invalid Gate F2 discovery snapshot:\n- ${errors.join("\n- ")}`);
  }
  return snapshot;
}

function classifyTrackedDiscovery(latestTracked, exact, discovered) {
  if (!latestTracked) {
    return {
      queueReason: "NEW_SOURCE_PAGE",
      queueAction: "REVIEW_SOURCE_EVENT",
      revisionOrderState: "UNTRACKED"
    };
  }

  if (discovered.revid < latestTracked.revid) {
    return {
      queueReason: "TRACKED_PAGE_REVISION_REGRESSION",
      queueAction: "HOLD_SOURCE_ORDER_ANOMALY",
      revisionOrderState: "OLDER_REVISION"
    };
  }

  if (exact) {
    return {
      queueReason: "TRACKED_PAGE_METADATA_CHANGED",
      queueAction: "REVIEW_SOURCE_EVENT",
      revisionOrderState: "SAME_REVISION"
    };
  }

  const discoveredTime = Date.parse(discovered.timestamp);
  const trackedTime = Date.parse(latestTracked.timestamp);
  if (discovered.revid > latestTracked.revid &&
      Number.isFinite(trackedTime) &&
      discoveredTime <= trackedTime) {
    return {
      queueReason: "TRACKED_PAGE_REVISION_ORDER_INCONSISTENT",
      queueAction: "HOLD_SOURCE_ORDER_ANOMALY",
      revisionOrderState: "INCONSISTENT_REVISION_ORDER"
    };
  }

  return {
    queueReason: "TRACKED_PAGE_NEW_REVISION",
    queueAction: "REVIEW_SOURCE_EVENT",
    revisionOrderState: "NEWER_REVISION"
  };
}

export function buildGateF2ReviewQueue(ledger, discovery) {
  assertValidGateF2Ledger(ledger);
  assertValidGateF2DiscoverySnapshot(discovery);

  const trackedByPage = new Map();
  for (const record of ledger.records) {
    const rows = trackedByPage.get(record.pageid) || [];
    rows.push(record);
    trackedByPage.set(record.pageid, rows);
  }

  const reviewQueue = [];
  let unchangedTrackedRevisionCount = 0;

  for (const discovered of discovery.records) {
    const tracked = trackedByPage.get(discovered.pageid) || [];
    const exact = tracked.find(record => record.revid === discovered.revid) || null;
    const latestTracked = tracked
      .slice()
      .sort((a, b) => (b.revid || 0) - (a.revid || 0))[0] || null;

    if (latestTracked &&
        exact &&
        exact.revid === latestTracked.revid &&
        exact.title === discovered.title) {
      unchangedTrackedRevisionCount += 1;
      continue;
    }

    const classification = classifyTrackedDiscovery(latestTracked, exact, discovered);

    reviewQueue.push({
      id: discovered.id,
      pageid: discovered.pageid,
      title: discovered.title,
      discoveredRevisionId: discovered.revid,
      discoveredRevisionTimestamp: discovered.timestamp,
      queueReason: classification.queueReason,
      queueAction: classification.queueAction,
      revisionOrderState: classification.revisionOrderState,
      trackedReviewState: latestTracked?.reviewState ?? null,
      trackedTitle: latestTracked?.title ?? null,
      trackedRevisionId: latestTracked?.revid ?? null,
      trackedRevisionTimestamp: latestTracked?.timestamp ?? null,
      titleChanged: latestTracked ? latestTracked.title !== discovered.title : false,
      reviewState: "DISCOVERED_UNREVIEWED",
      recommendationState: "NOT_APPLICABLE",
      hardMetadataState: "NOT_REVIEWED",
      ingredientMappingState: "NOT_REVIEWED",
      nutritionState: "NOT_APPLICABLE",
      runtimeArtifact: null,
      coverage: null,
      mayOverwriteTrackedRecord: false
    });
  }

  reviewQueue.sort((a, b) => a.pageid - b.pageid || a.discoveredRevisionId - b.discoveredRevisionId);

  const queueReasonCounts = {
    NEW_SOURCE_PAGE: reviewQueue.filter(row => row.queueReason === "NEW_SOURCE_PAGE").length,
    TRACKED_PAGE_NEW_REVISION: reviewQueue.filter(row => row.queueReason === "TRACKED_PAGE_NEW_REVISION").length,
    TRACKED_PAGE_METADATA_CHANGED: reviewQueue.filter(row => row.queueReason === "TRACKED_PAGE_METADATA_CHANGED").length,
    TRACKED_PAGE_REVISION_REGRESSION: reviewQueue.filter(row => row.queueReason === "TRACKED_PAGE_REVISION_REGRESSION").length,
    TRACKED_PAGE_REVISION_ORDER_INCONSISTENT: reviewQueue.filter(row => row.queueReason === "TRACKED_PAGE_REVISION_ORDER_INCONSISTENT").length
  };

  return {
    schemaVersion: "wikibooks-gate-f2-review-queue-v1",
    sourceId: GATE_F2_SOURCE.id,
    discoverySnapshotAcquiredAt: discovery.acquiredAt,
    discoverySourceUniverseState: discovery.sourceUniverseState,
    discoverySourceUniverseComplete: discovery.sourceUniverseComplete,
    generatedFromLedgerSchema: ledger.schemaVersion,
    generatedFromDiscoverySchema: discovery.schemaVersion,
    runtimeActivationAuthorized: false,
    automaticAdmissionAuthorized: false,
    trackedLedgerRecordCount: ledger.records.length,
    discoveredRecordCount: discovery.records.length,
    unchangedTrackedRevisionCount,
    reviewQueueCount: reviewQueue.length,
    reviewEventCount: reviewQueue.filter(row => row.queueAction === "REVIEW_SOURCE_EVENT").length,
    holdCount: reviewQueue.filter(row => row.queueAction === "HOLD_SOURCE_ORDER_ANOMALY").length,
    queueReasonCounts,
    reviewQueue
  };
}
