import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createControlPlaneSnapshot
} from "../scripts/corpus-source-control-plane.mjs";
import {
  buildPipelineAdmissionManifest,
  createIngestionPipelineSnapshot,
  createPipelineRecord,
  createSourceRegistry,
  emptyPipelineStages,
  validateIngestionPipelineSnapshot,
  validatePipelineStages
} from "../scripts/corpus-ingestion-pipeline.mjs";
import {
  adaptGateF2LedgerToIngestionPipeline,
  gateF2SourceContract
} from "../scripts/wikibooks-gate-f2-control-plane-adapter.mjs";

const gateF2Ledger = JSON.parse(
  await readFile(new URL("../scripts/wikibooks-gate-f2-review-ledger.json", import.meta.url), "utf8")
);

const secondarySource = Object.freeze({
  id: "SECONDARY_TEST_SOURCE",
  name: "Secondary test source",
  adapterId: "secondary-test-adapter-v1",
  sourceFamily: "TEST_FIXTURE",
  versioningMode: "IMMUTABLE_RECORD_VERSION",
  rightsEvidenceMode: "RECORD_LEVEL_REVIEW",
  license: "PUBLIC-DOMAIN",
  licenseUrl: null,
  attributionPolicy: "Retain provenance",
  runtimeFetch: false,
  mediaState: "EXCLUDED",
  sourceNutritionImportedAsAuthority: false,
  automaticAdmissionAuthorized: false
});

function pendingControlRecord() {
  return {
    controlId: "SECONDARY_TEST_SOURCE:item-1:v1",
    externalRecordId: "item-1",
    sourceId: "SECONDARY_TEST_SOURCE",
    sourceItemId: "item-1",
    sourceVersionId: "v1",
    title: "Pending source record",
    reviewState: "DISCOVERED_UNREVIEWED",
    rightsState: "RIGHTS_REVIEW_REQUIRED",
    admissionState: null,
    canonicalRecipeId: null,
    nutritionState: "NOT_APPLICABLE",
    mediaState: "EXCLUDED",
    holdReason: null,
    rejectionReason: null,
    provenance: {
      sourceName: "Secondary test source",
      sourceItemId: "item-1",
      sourceVersionId: "v1",
      sourceVersionTimestamp: "2026-09-05T00:00:00Z",
      sourceUrl: "https://example.test/source/item-1",
      immutableLocator: "https://example.test/source/item-1?v=1",
      license: "PUBLIC-DOMAIN",
      licenseUrl: null,
      attribution: "Fixture source",
      mediaIncluded: false,
      sourceNutritionImportedAsAuthority: false
    },
    runtimeArtifact: null,
    runtimeActivationAuthorized: false
  };
}

test("source registry is deterministic, provider-neutral and rejects duplicate source/adapter identities", () => {
  const wikibooks = gateF2SourceContract(gateF2Ledger);
  const first = createSourceRegistry([secondarySource, wikibooks]);
  const second = createSourceRegistry([wikibooks, secondarySource]);
  assert.equal(first.registrySha256, second.registrySha256);
  assert.deepEqual(first.sources.map(source => source.id), ["SECONDARY_TEST_SOURCE", "WIKIBOOKS_COOKBOOK_GATE_F2"]);
  assert.equal(first.runtimeActivationAuthorized, false);
  assert.equal(first.automaticAdmissionAuthorized, false);

  assert.throws(() => createSourceRegistry([wikibooks, wikibooks]), /duplicate source id/);
  assert.throws(
    () => createSourceRegistry([secondarySource, { ...secondarySource, id: "OTHER_SOURCE" }]),
    /duplicate adapter id/
  );
});

test("Gate F2 maps into every canonical ingestion stage without changing its eight admits/five rejects", () => {
  const { controlPlane, pipeline } = adaptGateF2LedgerToIngestionPipeline(gateF2Ledger);
  assert.deepEqual(validateIngestionPipelineSnapshot(controlPlane, pipeline), []);
  assert.equal(pipeline.records.length, 13);

  const admitted = pipeline.records.filter(record => record.reviewState === "ADMITTED");
  const rejected = pipeline.records.filter(record => record.reviewState === "REJECTED");
  assert.equal(admitted.length, 8);
  assert.equal(rejected.length, 5);
  assert.ok(admitted.every(record => record.stages.provenance === "VERIFIED"));
  assert.ok(admitted.every(record => record.stages.parse === "PASS"));
  assert.ok(admitted.every(record => ["PASS", "PARTIAL"].includes(record.stages.hardMetadata)));
  assert.ok(admitted.every(record => record.stages.nutrition === "FIREWALLED"));
  assert.ok(admitted.every(record => record.stages.decision === "PASS"));
  assert.ok(admitted.every(record => record.stages.portableArtifact === "READY"));
  assert.ok(rejected.every(record => record.stages.decision === "REJECT"));
  assert.ok(rejected.every(record => record.stages.portableArtifact === "NOT_APPLICABLE"));
});

test("pipeline admission manifest is deterministic and includes only fully reviewed admissions", () => {
  const { controlPlane, pipeline } = adaptGateF2LedgerToIngestionPipeline(gateF2Ledger);
  const manifest = buildPipelineAdmissionManifest(controlPlane, pipeline, "v0001");
  const again = buildPipelineAdmissionManifest(controlPlane, pipeline, "v0001");

  assert.equal(manifest.manifestSha256, again.manifestSha256);
  assert.equal(manifest.counts.tracked, 13);
  assert.equal(manifest.counts.admitted, 8);
  assert.equal(manifest.counts.rejected, 5);
  assert.equal(manifest.entries.length, 8);
  assert.equal(manifest.runtimeActivationAuthorized, false);
  assert.equal(manifest.automaticAdmissionAuthorized, false);
  assert.equal(manifest.recipeBodiesIncluded, false);
  assert.ok(manifest.entries.every(entry => entry.pipelineStages.provenance === "VERIFIED"));
  assert.ok(manifest.entries.every(entry => entry.pipelineStages.nutrition === "FIREWALLED"));
  assert.ok(manifest.entries.every(entry => entry.pipelineStages.decision === "PASS"));
});

test("pending source records remain resumable with explicit NOT_STARTED stages and cannot masquerade as admitted", () => {
  const record = pendingControlRecord();
  const controlPlane = createControlPlaneSnapshot(secondarySource, [record]);
  const stages = emptyPipelineStages();
  const pipelineRecord = createPipelineRecord(record, stages);
  const pipeline = createIngestionPipelineSnapshot(controlPlane, [pipelineRecord]);

  assert.deepEqual(validateIngestionPipelineSnapshot(controlPlane, pipeline), []);
  assert.equal(pipeline.records[0].stages.decision, "NOT_STARTED");
  assert.equal(pipeline.runtimeActivationAuthorized, false);
  assert.equal(pipeline.automaticAdmissionAuthorized, false);
});

test("admitted state fails closed unless parse/normalize/dedup/mapping/hard-metadata stages were reviewed", () => {
  const record = {
    ...pendingControlRecord(),
    reviewState: "ADMITTED",
    rightsState: "ADMIT_RIGHTS_VERIFIED",
    admissionState: "ADMIT_REVIEWED",
    canonicalRecipeId: "secondary_fixture_recipe",
    nutritionState: "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED"
  };
  const stages = {
    ...emptyPipelineStages(),
    provenance: "VERIFIED",
    nutrition: "FIREWALLED",
    decision: "PASS",
    portableArtifact: "PENDING"
  };
  const errors = validatePipelineStages(record, stages);
  assert.ok(errors.some(error => error.includes("parse")));
  assert.ok(errors.some(error => error.includes("normalize")));
  assert.ok(errors.some(error => error.includes("deduplicate")));
  assert.ok(errors.some(error => error.includes("ingredientQuantityMapping")));
  assert.ok(errors.some(error => error.includes("hardMetadata")));
});

test("pipeline snapshot requires one stage record per control-plane record and detects tampering", () => {
  const a = pendingControlRecord();
  const b = {
    ...pendingControlRecord(),
    controlId: "SECONDARY_TEST_SOURCE:item-2:v1",
    externalRecordId: "item-2",
    sourceItemId: "item-2",
    provenance: {
      ...pendingControlRecord().provenance,
      sourceItemId: "item-2",
      sourceUrl: "https://example.test/source/item-2",
      immutableLocator: "https://example.test/source/item-2?v=1"
    }
  };
  const controlPlane = createControlPlaneSnapshot(secondarySource, [a, b]);
  const onlyA = createPipelineRecord(a, emptyPipelineStages());
  assert.throws(
    () => createIngestionPipelineSnapshot(controlPlane, [onlyA]),
    /missing pipeline state/
  );

  const complete = createIngestionPipelineSnapshot(controlPlane, [
    onlyA,
    createPipelineRecord(b, emptyPipelineStages())
  ]);
  const tampered = structuredClone(complete);
  tampered.records[0].stages.parse = "PASS";
  assert.ok(validateIngestionPipelineSnapshot(controlPlane, tampered).includes("pipelineSha256 does not match pipeline contents"));
});
