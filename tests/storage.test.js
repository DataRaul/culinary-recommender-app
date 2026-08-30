import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE, normalizeState, exportState, importState, SCHEMA_VERSION } from "../src/domain/storage.js";

test("state normalization preserves schema and repairs arrays", () => {
  const normalized = normalizeState({ schemaVersion: 1, selectedSlotIds: null, profile: { budget: 99 } });
  assert.equal(normalized.schemaVersion, SCHEMA_VERSION);
  assert.equal(normalized.profile.budget, 4);
  assert.ok(Array.isArray(normalized.selectedSlotIds));
});

test("export/import is deterministic and versioned", () => {
  const restored = importState(exportState(DEFAULT_STATE));
  assert.deepEqual(restored, normalizeState(DEFAULT_STATE));
});

test("unsupported schema fails closed", () => {
  assert.throws(() => importState(JSON.stringify({ schemaVersion: 999 })), /Unsupported/);
});
