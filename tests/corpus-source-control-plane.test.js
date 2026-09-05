import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyExplicitReviewDecision,
  assertValidControlPlaneSnapshot,
  buildControlPlaneActionQueue,
  buildCorpusAdmissionManifest,
  createControlPlaneSnapshot,
  validateControlRecord,
  validateSourceContract
} from "../scripts/corpus-source-control-plane.mjs";
import {
  adaptGateF2LedgerToControlPlane,
  gateF2SourceContract
} from "../scripts/wikibooks-gate-f2-control-plane-adapter.mjs";

const gateF2Ledger = JSON.parse(
  await readFile(new URL("../scripts/wikibooks-gate-f2-review-ledger.json", import.meta.url), "utf8")
);

const genericSource = Object.freeze({
  id: "TEST_OPEN_SOURCE",
  name: "Test Open Recipe Source",
  adapterId: "test-open-source-adapter-v1",
  sourceFamily: "TEST_FIXTURE",
  versioningMode: "EXACT_SOURCE_VERSION",
  rightsEvidenceMode: "RECORD_LEVEL_REVIEW",
  license: "PUBLIC-DOMAIN",
  licenseUrl: null,
  attributionPolicy: "Retain source provenance",
  runtimeFetch: false,
  mediaState: "EXCLUDED",
  sourceNutritionImportedAsAuthority: false,
  automaticAdmissionAuthorized: false
});

function discoveredRecord(overrides = {}) {
  return {
    controlId: "TEST_OPEN_SOURCE:item-1:version-1",
    externalRecordId: "item-1",
    sourceId: "TEST_OPEN_SOURCE",
    sourceItemId: "item-1",
    sourceVersionId: "version-1",
    title: "Fixture recipe",
    reviewState: "DISCOVERED_UNREVIEWED",
    rightsState: "RIGHTS_REVIEW_REQUIRED",
    admissionState: null,
    canonicalRecipeId: null,
    nutritionState: "NOT_APPLICABLE",
    mediaState: "EXCLUDED",
    holdReason: null,
    rejectionReason: null,
    provenance: {
      sourceName: "Test Open Recipe Source",
      sourceItemId: "item-1",
      sourceVersionId: "version-1",
      sourceVersionTimestamp: "2026-09-05T00:00:00Z",
      sourceUrl: "https://example.test/recipes/item-1",
      immutableLocator: "https://example.test/recipes/item-1?version=1",
      license: "PUBLIC-DOMAIN",
      licenseUrl: null,
      attribution: "Test fixture provenance",
      mediaIncluded: false,
      sourceNutritionImportedAsAuthority: false
    },
    runtimeArtifact: null,
    runtimeActivationAuthorized: false,
    ...overrides
  };
}

test("Gate F2 adapts losslessly into the provider-neutral control-plane boundary", () => {
  const source = gateF2SourceContract(gateF2Ledger);
  assert.deepEqual(validateSourceContract(source), []);

  const snapshot = adaptGateF2LedgerToControlPlane(gateF2Ledger);
  assert.doesNotThrow(() => assertValidControlPlaneSnapshot(snapshot));
  assert.equal(snapshot.source.id, "WIKIBOOKS_COOKBOOK_GATE_F2");
  assert.equal(snapshot.source.adapterId, "wikibooks-gate-f2-control-adapter-v1");
  assert.equal(snapshot.runtimeActivationAuthorized, false);
  assert.equal(snapshot.automaticAdmissionAuthorized, false);
  assert.equal(snapshot.records.length, gateF2Ledger.records.length);

  const admitted = snapshot.records.filter(record => record.reviewState === "ADMITTED");
  const rejected = snapshot.records.filter(record => record.reviewState === "REJECTED");
  assert.equal(admitted.length, 8);
  assert.equal(rejected.length, 5);
  assert.ok(admitted.every(record => record.rightsState === "ADMIT_RIGHTS_VERIFIED"));
  assert.ok(admitted.every(record => record.nutritionState === "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED"));
  assert.ok(admitted.every(record => record.mediaState === "EXCLUDED"));
  assert.ok(admitted.every(record => /oldid=\d+$/.test(record.provenance.immutableLocator)));
  assert.ok(rejected.every(record => record.runtimeArtifact === null));
});

test("generic discovery cannot self-admit without an explicit review authority", () => {
  const record = discoveredRecord();
  assert.deepEqual(validateControlRecord(record, genericSource), []);

  assert.throws(
    () => applyExplicitReviewDecision(record, {
      reviewState: "ADMITTED",
      rightsState: "ADMIT_RIGHTS_VERIFIED",
      admissionState: "ADMIT_REVIEWED",
      canonicalRecipeId: "fixture_recipe"
    }, genericSource),
    /decisionAuthority=EXPLICIT_REVIEW_DECISION/
  );
});

test("explicit hold and reject outcomes remain terminal, fail-closed and non-runtime", () => {
  const record = discoveredRecord();
  const held = applyExplicitReviewDecision(record, {
    decisionAuthority: "EXPLICIT_REVIEW_DECISION",
    reviewState: "HELD",
    rightsState: "HOLD_RIGHTS_AMBIGUOUS",
    holdReason: "SOURCE_BOOK_RIGHTS_NEED_REVIEW",
    decisionEvidence: { evidenceId: "fixture-rights-review" }
  }, genericSource);
  assert.equal(held.reviewState, "HELD");
  assert.equal(held.rightsState, "HOLD_RIGHTS_AMBIGUOUS");
  assert.equal(held.runtimeArtifact, null);
  assert.equal(held.runtimeActivationAuthorized, false);
  assert.throws(
    () => applyExplicitReviewDecision(held, {
      decisionAuthority: "EXPLICIT_REVIEW_DECISION",
      reviewState: "ADMITTED"
    }, genericSource),
    /terminal at HELD/
  );

  const rejected = applyExplicitReviewDecision(record, {
    decisionAuthority: "EXPLICIT_REVIEW_DECISION",
    reviewState: "REJECTED",
    rightsState: "REJECT_RIGHTS_INCOMPATIBLE",
    rejectionReason: "LICENSE_DOES_NOT_ALLOW_INTENDED_REHOSTING"
  }, genericSource);
  assert.equal(rejected.reviewState, "REJECTED");
  assert.equal(rejected.rightsState, "REJECT_RIGHTS_INCOMPATIBLE");
  assert.equal(rejected.nutritionState, "NOT_APPLICABLE");
  assert.equal(rejected.runtimeArtifact, null);
});

test("explicit admission requires verified rights and preserves nutrition/media firewalls", () => {
  const record = discoveredRecord();
  assert.throws(
    () => applyExplicitReviewDecision(record, {
      decisionAuthority: "EXPLICIT_REVIEW_DECISION",
      reviewState: "ADMITTED",
      rightsState: "HOLD_RIGHTS_AMBIGUOUS",
      admissionState: "ADMIT_REVIEWED",
      canonicalRecipeId: "fixture_recipe"
    }, genericSource),
    /ADMIT_RIGHTS_VERIFIED/
  );

  const admitted = applyExplicitReviewDecision(record, {
    decisionAuthority: "EXPLICIT_REVIEW_DECISION",
    reviewState: "ADMITTED",
    rightsState: "ADMIT_RIGHTS_VERIFIED",
    admissionState: "ADMIT_REVIEWED",
    canonicalRecipeId: "fixture_recipe",
    decisionEvidence: { rightsAudit: "fixture-pass" }
  }, genericSource);
  assert.equal(admitted.reviewState, "ADMITTED");
  assert.equal(admitted.nutritionState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
  assert.equal(admitted.mediaState, "EXCLUDED");
  assert.equal(admitted.runtimeActivationAuthorized, false);
});

test("control-plane snapshots and action queues are deterministic and never authorize admission", () => {
  const a = discoveredRecord();
  const b = discoveredRecord({
    controlId: "TEST_OPEN_SOURCE:item-2:version-1",
    externalRecordId: "item-2",
    sourceItemId: "item-2",
    title: "Second fixture recipe",
    provenance: {
      ...discoveredRecord().provenance,
      sourceItemId: "item-2",
      sourceUrl: "https://example.test/recipes/item-2",
      immutableLocator: "https://example.test/recipes/item-2?version=1"
    }
  });
  const first = createControlPlaneSnapshot(genericSource, [b, a]);
  const second = createControlPlaneSnapshot(genericSource, [a, b]);
  assert.equal(first.snapshotSha256, second.snapshotSha256);
  assert.deepEqual(first.records.map(record => record.controlId), [a.controlId, b.controlId]);

  const queue = buildControlPlaneActionQueue(first);
  assert.equal(queue.actionCount, 2);
  assert.equal(queue.automaticAdmissionAuthorized, false);
  assert.equal(queue.runtimeActivationAuthorized, false);
  assert.ok(queue.records.every(record => record.runtimeActivationAuthorized === false));
});

test("immutable admission manifest contains only reviewed admissions and no recipe bodies", () => {
  const base = discoveredRecord();
  const admitted = applyExplicitReviewDecision(base, {
    decisionAuthority: "EXPLICIT_REVIEW_DECISION",
    reviewState: "ADMITTED",
    rightsState: "ADMIT_RIGHTS_VERIFIED",
    admissionState: "ADMIT_REVIEWED",
    canonicalRecipeId: "fixture_recipe"
  }, genericSource);
  const pending = discoveredRecord({
    controlId: "TEST_OPEN_SOURCE:item-2:version-1",
    externalRecordId: "item-2",
    sourceItemId: "item-2",
    provenance: {
      ...base.provenance,
      sourceItemId: "item-2",
      sourceUrl: "https://example.test/recipes/item-2",
      immutableLocator: "https://example.test/recipes/item-2?version=1"
    }
  });
  const snapshot = createControlPlaneSnapshot(genericSource, [pending, admitted]);
  const manifest = buildCorpusAdmissionManifest(snapshot, "v0001");
  const again = buildCorpusAdmissionManifest(snapshot, "v0001");

  assert.equal(manifest.manifestSha256, again.manifestSha256);
  assert.equal(manifest.counts.tracked, 2);
  assert.equal(manifest.counts.admitted, 1);
  assert.equal(manifest.counts.pending, 1);
  assert.equal(manifest.entries.length, 1);
  assert.equal(manifest.entries[0].canonicalRecipeId, "fixture_recipe");
  assert.equal(manifest.recipeBodiesIncluded, false);
  assert.equal(manifest.requiresCanonicalRecipeNormalization, true);
  assert.equal(manifest.runtimeActivationAuthorized, false);
  assert.equal(manifest.automaticAdmissionAuthorized, false);
  assert.equal(Object.hasOwn(manifest.entries[0], "ingredients"), false);
  assert.equal(Object.hasOwn(manifest.entries[0], "instructions"), false);
});

test("duplicate source item/version and missing provenance fail closed", () => {
  const a = discoveredRecord();
  const duplicateVersion = discoveredRecord({ controlId: "TEST_OPEN_SOURCE:other-control-id" });
  assert.throws(
    () => createControlPlaneSnapshot(genericSource, [a, duplicateVersion]),
    /duplicate source item\/version/
  );

  const invalid = discoveredRecord({ provenance: null });
  assert.ok(validateControlRecord(invalid, genericSource).some(error => error.includes("provenance is required")));
});
