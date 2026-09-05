import {
  assertValidControlPlaneSnapshot,
  assertValidControlRecord,
  assertValidSourceContract,
  buildCorpusAdmissionManifest,
  stableStringify
} from "./corpus-source-control-plane.mjs";
import { createHash } from "node:crypto";

export const CORPUS_INGESTION_PIPELINE_SCHEMA = "corpus-ingestion-pipeline-v1";
export const CORPUS_SOURCE_REGISTRY_SCHEMA = "corpus-source-registry-v1";

export const PIPELINE_STAGE_STATES = Object.freeze([
  "NOT_STARTED",
  "VERIFIED",
  "PASS",
  "PARTIAL",
  "HOLD",
  "REJECT",
  "FIREWALLED",
  "PENDING",
  "READY",
  "NOT_APPLICABLE"
]);

export const PIPELINE_STAGE_KEYS = Object.freeze([
  "provenance",
  "parse",
  "normalize",
  "deduplicate",
  "ingredientQuantityMapping",
  "hardMetadata",
  "nutrition",
  "decision",
  "portableArtifact"
]);

const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const sha256 = value => createHash("sha256").update(value).digest("hex");

export function createSourceRegistry(sources) {
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("source registry requires at least one source contract");
  const ids = new Set();
  const adapters = new Set();
  const records = sources.map(source => {
    assertValidSourceContract(source);
    if (ids.has(source.id)) throw new Error(`duplicate source id: ${source.id}`);
    if (adapters.has(source.adapterId)) throw new Error(`duplicate adapter id: ${source.adapterId}`);
    ids.add(source.id);
    adapters.add(source.adapterId);
    return structuredClone(source);
  }).sort((a, b) => a.id.localeCompare(b.id));

  const registry = {
    schemaVersion: CORPUS_SOURCE_REGISTRY_SCHEMA,
    runtimeActivationAuthorized: false,
    automaticAdmissionAuthorized: false,
    sourceCount: records.length,
    sources: records
  };
  return { ...registry, registrySha256: sha256(stableStringify(registry)) };
}

export function emptyPipelineStages() {
  return Object.fromEntries(PIPELINE_STAGE_KEYS.map(key => [key, "NOT_STARTED"]));
}

export function validatePipelineStages(record, stages) {
  const errors = [];
  if (!isObject(stages)) return [`${record.controlId}: pipeline stages must be an object`];
  for (const key of PIPELINE_STAGE_KEYS) {
    if (!PIPELINE_STAGE_STATES.includes(stages[key])) errors.push(`${record.controlId}: invalid pipeline stage ${key}`);
  }

  if (record.reviewState === "ADMITTED") {
    if (stages.provenance !== "VERIFIED") errors.push(`${record.controlId}: admission requires verified provenance stage`);
    for (const key of ["parse", "normalize", "deduplicate", "ingredientQuantityMapping", "hardMetadata"]) {
      if (!["PASS", "PARTIAL"].includes(stages[key])) errors.push(`${record.controlId}: admission requires reviewed ${key} stage`);
    }
    if (stages.nutrition !== "FIREWALLED") errors.push(`${record.controlId}: admission requires FIREWALLED nutrition stage`);
    if (stages.decision !== "PASS") errors.push(`${record.controlId}: admitted record decision stage must PASS`);
    if (!["PENDING", "READY"].includes(stages.portableArtifact)) {
      errors.push(`${record.controlId}: admitted record portableArtifact must be PENDING or READY`);
    }
  }

  if (record.reviewState === "HELD" && stages.decision !== "HOLD") {
    errors.push(`${record.controlId}: held record decision stage must HOLD`);
  }
  if (record.reviewState === "REJECTED" && stages.decision !== "REJECT") {
    errors.push(`${record.controlId}: rejected record decision stage must REJECT`);
  }
  if (["DISCOVERED_UNREVIEWED", "REVIEW_READY"].includes(record.reviewState) && !["NOT_STARTED", "PENDING"].includes(stages.decision)) {
    errors.push(`${record.controlId}: pending review decision stage must be NOT_STARTED or PENDING`);
  }
  return errors;
}

export function createPipelineRecord(controlRecord, stages) {
  assertValidControlRecord(controlRecord);
  const errors = validatePipelineStages(controlRecord, stages);
  if (errors.length) throw new Error(`Invalid ingestion pipeline stages:\n- ${errors.join("\n- ")}`);
  return {
    controlId: controlRecord.controlId,
    sourceId: controlRecord.sourceId,
    sourceItemId: controlRecord.sourceItemId,
    sourceVersionId: controlRecord.sourceVersionId,
    reviewState: controlRecord.reviewState,
    rightsState: controlRecord.rightsState,
    stages: structuredClone(stages)
  };
}

export function createIngestionPipelineSnapshot(controlPlaneSnapshot, pipelineRecords) {
  assertValidControlPlaneSnapshot(controlPlaneSnapshot);
  if (!Array.isArray(pipelineRecords)) throw new Error("pipelineRecords must be an array");
  const controlById = new Map(controlPlaneSnapshot.records.map(record => [record.controlId, record]));
  const pipelineById = new Map();

  for (const pipelineRecord of pipelineRecords) {
    if (!isObject(pipelineRecord) || typeof pipelineRecord.controlId !== "string") throw new Error("pipeline record controlId is required");
    if (pipelineById.has(pipelineRecord.controlId)) throw new Error(`duplicate pipeline record: ${pipelineRecord.controlId}`);
    const control = controlById.get(pipelineRecord.controlId);
    if (!control) throw new Error(`pipeline record has no control-plane record: ${pipelineRecord.controlId}`);
    const errors = validatePipelineStages(control, pipelineRecord.stages);
    if (errors.length) throw new Error(`Invalid ingestion pipeline stages:\n- ${errors.join("\n- ")}`);
    pipelineById.set(pipelineRecord.controlId, structuredClone(pipelineRecord));
  }

  for (const control of controlPlaneSnapshot.records) {
    if (!pipelineById.has(control.controlId)) throw new Error(`missing pipeline state for ${control.controlId}`);
  }

  const records = [...pipelineById.values()].sort((a, b) => a.controlId.localeCompare(b.controlId));
  const snapshot = {
    schemaVersion: CORPUS_INGESTION_PIPELINE_SCHEMA,
    sourceId: controlPlaneSnapshot.source.id,
    generatedFromControlPlaneSha256: controlPlaneSnapshot.snapshotSha256,
    runtimeActivationAuthorized: false,
    automaticAdmissionAuthorized: false,
    records
  };
  return { ...snapshot, pipelineSha256: sha256(stableStringify(snapshot)) };
}

export function validateIngestionPipelineSnapshot(controlPlaneSnapshot, pipelineSnapshot) {
  const errors = [];
  try {
    assertValidControlPlaneSnapshot(controlPlaneSnapshot);
  } catch (error) {
    return [String(error.message || error)];
  }
  if (!isObject(pipelineSnapshot)) return ["pipeline snapshot must be an object"];
  if (pipelineSnapshot.schemaVersion !== CORPUS_INGESTION_PIPELINE_SCHEMA) errors.push(`schemaVersion must be ${CORPUS_INGESTION_PIPELINE_SCHEMA}`);
  if (pipelineSnapshot.sourceId !== controlPlaneSnapshot.source.id) errors.push("pipeline sourceId must match control plane");
  if (pipelineSnapshot.generatedFromControlPlaneSha256 !== controlPlaneSnapshot.snapshotSha256) {
    errors.push("pipeline control-plane fingerprint mismatch");
  }
  if (pipelineSnapshot.runtimeActivationAuthorized !== false) errors.push("runtimeActivationAuthorized must remain false");
  if (pipelineSnapshot.automaticAdmissionAuthorized !== false) errors.push("automaticAdmissionAuthorized must remain false");
  if (!Array.isArray(pipelineSnapshot.records)) return [...errors, "pipeline records must be an array"];

  const controlById = new Map(controlPlaneSnapshot.records.map(record => [record.controlId, record]));
  const seen = new Set();
  for (const pipelineRecord of pipelineSnapshot.records) {
    if (seen.has(pipelineRecord.controlId)) errors.push(`duplicate pipeline record: ${pipelineRecord.controlId}`);
    seen.add(pipelineRecord.controlId);
    const control = controlById.get(pipelineRecord.controlId);
    if (!control) {
      errors.push(`pipeline record has no control-plane record: ${pipelineRecord.controlId}`);
      continue;
    }
    errors.push(...validatePipelineStages(control, pipelineRecord.stages));
  }
  for (const controlId of controlById.keys()) {
    if (!seen.has(controlId)) errors.push(`missing pipeline state for ${controlId}`);
  }
  if (!/^[a-f0-9]{64}$/.test(pipelineSnapshot.pipelineSha256 || "")) {
    errors.push("pipelineSha256 must be a SHA-256 digest");
  } else {
    const { pipelineSha256: _ignored, ...withoutHash } = pipelineSnapshot;
    if (pipelineSnapshot.pipelineSha256 !== sha256(stableStringify(withoutHash))) errors.push("pipelineSha256 does not match pipeline contents");
  }
  return errors;
}

export function buildPipelineAdmissionManifest(controlPlaneSnapshot, pipelineSnapshot, version) {
  const errors = validateIngestionPipelineSnapshot(controlPlaneSnapshot, pipelineSnapshot);
  if (errors.length) throw new Error(`Invalid ingestion pipeline snapshot:\n- ${errors.join("\n- ")}`);
  const base = buildCorpusAdmissionManifest(controlPlaneSnapshot, version);
  const pipelineById = new Map(pipelineSnapshot.records.map(record => [record.controlId, record]));
  const entries = base.entries.map(entry => {
    const pipeline = pipelineById.get(entry.controlId);
    if (!pipeline) throw new Error(`missing admitted pipeline state for ${entry.controlId}`);
    return { ...entry, pipelineStages: structuredClone(pipeline.stages) };
  });
  const manifest = {
    ...base,
    pipelineSchemaVersion: pipelineSnapshot.schemaVersion,
    generatedFromPipelineSha256: pipelineSnapshot.pipelineSha256,
    entries
  };
  const { manifestSha256: _oldHash, ...withoutHash } = manifest;
  return { ...withoutHash, manifestSha256: sha256(stableStringify(withoutHash)) };
}
