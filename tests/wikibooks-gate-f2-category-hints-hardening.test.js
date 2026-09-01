import test from "node:test";
import assert from "node:assert/strict";
import { GATE_F2_SOURCE } from "../scripts/wikibooks-gate-f2-contract.mjs";
import {
  buildGateF2CategoryHintSnapshot,
  validateGateF2CategoryHintSnapshot
} from "../scripts/wikibooks-gate-f2-category-hints.mjs";

const discovery = {
  schemaVersion: "wikibooks-gate-f2-discovery-v1",
  source: GATE_F2_SOURCE,
  acquiredAt: "2026-09-01T16:00:00Z",
  acquisitionMode: "METADATA_AND_EXACT_REVISION_IDS_ONLY",
  requestedLimit: 1,
  returnedRecordCount: 1,
  sourceUniverseState: "SOURCE_EXHAUSTED",
  sourceUniverseComplete: true,
  runtimeActivationAuthorized: false,
  records: [{
    id: "wikibooks_discovery_100",
    pageid: 100,
    title: "Cookbook:Alpha",
    revid: 1001,
    timestamp: "2026-08-31T10:00:00Z",
    reviewState: "DISCOVERED_UNREVIEWED",
    recommendationState: "NOT_APPLICABLE",
    hardMetadataState: "NOT_REVIEWED",
    ingredientMappingState: "NOT_REVIEWED",
    nutritionState: "NOT_APPLICABLE",
    runtimeArtifact: null,
    coverage: null
  }]
};

test("Gate F2 category-hint acquisition fails closed on malformed category payloads", () => {
  assert.throws(
    () => buildGateF2CategoryHintSnapshot(discovery, [{
      pageid: 100,
      title: "Cookbook:Alpha",
      categories: [{ title: "Not a source category" }]
    }]),
    /malformed category title/
  );

  assert.throws(
    () => buildGateF2CategoryHintSnapshot(discovery, [{
      pageid: 100,
      title: "Cookbook:Alpha",
      categories: { title: "Category:Invalid container" }
    }]),
    /malformed categories/
  );

  assert.throws(
    () => buildGateF2CategoryHintSnapshot(discovery, [{
      pageid: 100,
      title: "Cookbook:Alpha",
      missing: true,
      categories: [{ title: "Category:Should not survive" }]
    }]),
    /Non-present category-query page returned categories/
  );
});

test("Gate F2 category-hint validation cannot upgrade or contradict discovery completeness", () => {
  const snapshot = buildGateF2CategoryHintSnapshot(discovery, [{
    pageid: 100,
    title: "Cookbook:Alpha",
    categories: [{ title: "Category:Breakfast recipes" }]
  }], { acquiredAt: "2026-09-01T16:45:00Z" });

  const invalidState = structuredClone(snapshot);
  invalidState.discoverySourceUniverseState = "LIMIT_REACHED";
  const stateErrors = validateGateF2CategoryHintSnapshot(invalidState);
  assert.ok(stateErrors.some(error => error.includes("discoverySourceUniverseComplete must agree")));

  const invalidValue = structuredClone(snapshot);
  invalidValue.discoverySourceUniverseState = "UNKNOWN";
  const valueErrors = validateGateF2CategoryHintSnapshot(invalidValue);
  assert.ok(valueErrors.some(error => error.includes("discoverySourceUniverseState must be SOURCE_EXHAUSTED or LIMIT_REACHED")));
});

test("Gate F2 category-hint validation rejects categories attached to a non-present row", () => {
  const snapshot = buildGateF2CategoryHintSnapshot(discovery, [{
    pageid: 100,
    title: "Cookbook:Alpha",
    missing: true
  }], { acquiredAt: "2026-09-01T16:46:00Z" });

  const invalid = structuredClone(snapshot);
  invalid.records[0].categories = ["Category:Injected hint"];
  invalid.records[0].categoryCount = 1;
  invalid.totalCategoryHintCount = 1;
  const errors = validateGateF2CategoryHintSnapshot(invalid);
  assert.ok(errors.some(error => error.includes("non-PRESENT rows must not retain category hints")));
});
