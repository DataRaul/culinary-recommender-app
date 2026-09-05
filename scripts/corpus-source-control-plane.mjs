import { createHash } from "node:crypto";

export const CORPUS_SOURCE_CONTROL_SCHEMA = "corpus-source-control-plane-v1";
export const CORPUS_SOURCE_ADMISSION_MANIFEST_SCHEMA = "corpus-source-admission-manifest-v1";

export const CONTROL_REVIEW_STATES = Object.freeze([
  "DISCOVERED_UNREVIEWED",
  "REVIEW_READY",
  "HELD",
  "ADMITTED",
  "REJECTED"
]);

export const CONTROL_RIGHTS_STATES = Object.freeze([
  "RIGHTS_REVIEW_REQUIRED",
  "ADMIT_RIGHTS_VERIFIED",
  "HOLD_RIGHTS_AMBIGUOUS",
  "REJECT_RIGHTS_INCOMPATIBLE",
  "REJECT_PROVENANCE_MISSING"
]);

export const CONTROL_NUTRITION_STATES = Object.freeze([
  "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED",
  "NOT_APPLICABLE"
]);

export const CONTROL_MEDIA_STATES = Object.freeze([
  "EXCLUDED",
  "SEPARATELY_LICENSED"
]);

const TERMINAL_REVIEW_STATES = new Set(["HELD", "ADMITTED", "REJECTED"]);
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const isIsoDateTime = value => isNonEmptyString(value) && Number.isFinite(Date.parse(value));
const sha256 = value => createHash("sha256").update(value).digest("hex");

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, stableValue(value[key])])
  );
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function assertVersion(version) {
  if (!/^v[0-9]{4,}$/.test(version)) {
    throw new Error("corpus admission version must match vNNNN or wider numeric form");
  }
}

export function validateSourceContract(source) {
  const errors = [];
  if (!isObject(source)) return ["source must be an object"];
  for (const field of ["id", "name", "adapterId", "sourceFamily", "versioningMode", "rightsEvidenceMode"]) {
    if (!isNonEmptyString(source[field])) errors.push(`source.${field} is required`);
  }
  if (source.runtimeFetch !== false) errors.push("source.runtimeFetch must remain false");
  if (source.sourceNutritionImportedAsAuthority !== false) {
    errors.push("source.sourceNutritionImportedAsAuthority must remain false");
  }
  if (!CONTROL_MEDIA_STATES.includes(source.mediaState)) errors.push("source.mediaState is invalid");
  if (source.mediaState !== "EXCLUDED" && source.mediaState !== "SEPARATELY_LICENSED") {
    errors.push("source media must be excluded or separately licensed");
  }
  if (!isNonEmptyString(source.license)) errors.push("source.license is required");
  if (!("licenseUrl" in source)) errors.push("source.licenseUrl must be explicit (string or null)");
  if (source.licenseUrl !== null && !isNonEmptyString(source.licenseUrl)) {
    errors.push("source.licenseUrl must be a non-empty string or null");
  }
  if (!isNonEmptyString(source.attributionPolicy)) errors.push("source.attributionPolicy is required");
  if (source.automaticAdmissionAuthorized !== false) errors.push("source.automaticAdmissionAuthorized must remain false");
  return errors;
}

export function assertValidSourceContract(source) {
  const errors = validateSourceContract(source);
  if (errors.length) throw new Error(`Invalid corpus source contract:\n- ${errors.join("\n- ")}`);
  return source;
}

function validateProvenance(record, errors) {
  const provenance = record.provenance;
  if (!isObject(provenance)) {
    errors.push(`${record.controlId}: provenance is required`);
    return;
  }
  for (const field of ["sourceName", "sourceItemId", "sourceVersionId", "sourceUrl", "immutableLocator", "license", "attribution"]) {
    if (!isNonEmptyString(provenance[field])) errors.push(`${record.controlId}: provenance.${field} is required`);
  }
  if (!("sourceVersionTimestamp" in provenance)) {
    errors.push(`${record.controlId}: provenance.sourceVersionTimestamp must be explicit`);
  } else if (provenance.sourceVersionTimestamp !== null && !isIsoDateTime(provenance.sourceVersionTimestamp)) {
    errors.push(`${record.controlId}: provenance.sourceVersionTimestamp must be ISO date-time or null`);
  }
  if (!("licenseUrl" in provenance)) errors.push(`${record.controlId}: provenance.licenseUrl must be explicit`);
  if (provenance.licenseUrl !== null && !isNonEmptyString(provenance.licenseUrl)) {
    errors.push(`${record.controlId}: provenance.licenseUrl must be string or null`);
  }
  if (provenance.mediaIncluded !== false && record.mediaState === "EXCLUDED") {
    errors.push(`${record.controlId}: excluded media requires provenance.mediaIncluded=false`);
  }
  if (provenance.sourceNutritionImportedAsAuthority !== false) {
    errors.push(`${record.controlId}: provenance must preserve nutrition firewall`);
  }
}

export function validateControlRecord(record, source = null) {
  const errors = [];
  if (!isObject(record)) return ["control record must be an object"];
  const label = record.controlId || record.externalRecordId || "control record";
  if (!isNonEmptyString(record.controlId)) errors.push(`${label}: controlId is required`);
  if (!isNonEmptyString(record.sourceId)) errors.push(`${label}: sourceId is required`);
  if (source && record.sourceId !== source.id) errors.push(`${label}: sourceId must match source contract`);
  if (!isNonEmptyString(record.sourceItemId)) errors.push(`${label}: sourceItemId is required`);
  if (!isNonEmptyString(record.sourceVersionId)) errors.push(`${label}: sourceVersionId is required`);
  if (!isNonEmptyString(record.title)) errors.push(`${label}: title is required`);
  if (!CONTROL_REVIEW_STATES.includes(record.reviewState)) errors.push(`${label}: invalid reviewState`);
  if (!CONTROL_RIGHTS_STATES.includes(record.rightsState)) errors.push(`${label}: invalid rightsState`);
  if (!CONTROL_NUTRITION_STATES.includes(record.nutritionState)) errors.push(`${label}: invalid nutritionState`);
  if (!CONTROL_MEDIA_STATES.includes(record.mediaState)) errors.push(`${label}: invalid mediaState`);
  if (record.runtimeActivationAuthorized !== false) errors.push(`${label}: runtimeActivationAuthorized must remain false`);
  validateProvenance(record, errors);

  if (["DISCOVERED_UNREVIEWED", "REVIEW_READY"].includes(record.reviewState)) {
    if (record.admissionState !== null) errors.push(`${label}: unadmitted record admissionState must be null`);
    if (record.runtimeArtifact !== null) errors.push(`${label}: unadmitted record runtimeArtifact must be null`);
    if (record.reviewState === "DISCOVERED_UNREVIEWED" && record.rightsState !== "RIGHTS_REVIEW_REQUIRED") {
      errors.push(`${label}: discovered records require RIGHTS_REVIEW_REQUIRED`);
    }
  }

  if (record.reviewState === "HELD") {
    if (!isNonEmptyString(record.holdReason)) errors.push(`${label}: held record requires holdReason`);
    if (!["HOLD_RIGHTS_AMBIGUOUS", "RIGHTS_REVIEW_REQUIRED"].includes(record.rightsState)) {
      errors.push(`${label}: held record requires ambiguous/pending rights state`);
    }
    if (record.admissionState !== null) errors.push(`${label}: held record admissionState must be null`);
    if (record.runtimeArtifact !== null) errors.push(`${label}: held record runtimeArtifact must be null`);
  }

  if (record.reviewState === "REJECTED") {
    if (!isNonEmptyString(record.rejectionReason)) errors.push(`${label}: rejected record requires rejectionReason`);
    if (record.admissionState !== null) errors.push(`${label}: rejected record admissionState must be null`);
    if (record.runtimeArtifact !== null) errors.push(`${label}: rejected record runtimeArtifact must be null`);
  }

  if (record.reviewState === "ADMITTED") {
    if (record.rightsState !== "ADMIT_RIGHTS_VERIFIED") {
      errors.push(`${label}: admitted record requires ADMIT_RIGHTS_VERIFIED`);
    }
    if (!isNonEmptyString(record.admissionState) || !record.admissionState.startsWith("ADMIT_")) {
      errors.push(`${label}: admitted record requires ADMIT_* admissionState`);
    }
    if (!isNonEmptyString(record.canonicalRecipeId)) {
      errors.push(`${label}: admitted record requires canonicalRecipeId`);
    }
    if (record.nutritionState !== "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED") {
      errors.push(`${label}: admitted record must preserve external nutrition firewall`);
    }
  }

  if (record.rightsState === "REJECT_PROVENANCE_MISSING" && record.reviewState !== "REJECTED") {
    errors.push(`${label}: REJECT_PROVENANCE_MISSING requires REJECTED reviewState`);
  }
  if (record.rightsState === "REJECT_RIGHTS_INCOMPATIBLE" && record.reviewState !== "REJECTED") {
    errors.push(`${label}: REJECT_RIGHTS_INCOMPATIBLE requires REJECTED reviewState`);
  }
  return errors;
}

export function assertValidControlRecord(record, source = null) {
  const errors = validateControlRecord(record, source);
  if (errors.length) throw new Error(`Invalid corpus control record:\n- ${errors.join("\n- ")}`);
  return record;
}

export function createControlPlaneSnapshot(source, records, options = {}) {
  assertValidSourceContract(source);
  if (!Array.isArray(records)) throw new Error("control-plane records must be an array");
  const ids = new Set();
  const sourceVersions = new Set();
  for (const record of records) {
    assertValidControlRecord(record, source);
    if (ids.has(record.controlId)) throw new Error(`duplicate controlId: ${record.controlId}`);
    ids.add(record.controlId);
    const versionKey = `${record.sourceItemId}:${record.sourceVersionId}`;
    if (sourceVersions.has(versionKey)) throw new Error(`duplicate source item/version: ${versionKey}`);
    sourceVersions.add(versionKey);
  }

  const ordered = records.map(record => structuredClone(record)).sort((a, b) => a.controlId.localeCompare(b.controlId));
  const snapshot = {
    schemaVersion: CORPUS_SOURCE_CONTROL_SCHEMA,
    source: structuredClone(source),
    runtimeActivationAuthorized: false,
    automaticAdmissionAuthorized: false,
    sourceUniverseState: options.sourceUniverseState || "BOUNDED_REVIEW_STATE",
    records: ordered
  };
  snapshot.snapshotSha256 = sha256(stableStringify({ ...snapshot, snapshotSha256: undefined }));
  return snapshot;
}

export function validateControlPlaneSnapshot(snapshot) {
  const errors = [];
  if (!isObject(snapshot)) return ["control-plane snapshot must be an object"];
  if (snapshot.schemaVersion !== CORPUS_SOURCE_CONTROL_SCHEMA) errors.push(`schemaVersion must be ${CORPUS_SOURCE_CONTROL_SCHEMA}`);
  errors.push(...validateSourceContract(snapshot.source));
  if (snapshot.runtimeActivationAuthorized !== false) errors.push("runtimeActivationAuthorized must remain false");
  if (snapshot.automaticAdmissionAuthorized !== false) errors.push("automaticAdmissionAuthorized must remain false");
  if (!Array.isArray(snapshot.records)) return [...errors, "records must be an array"];
  const ids = new Set();
  const versions = new Set();
  for (const record of snapshot.records) {
    errors.push(...validateControlRecord(record, snapshot.source));
    if (ids.has(record.controlId)) errors.push(`duplicate controlId: ${record.controlId}`);
    ids.add(record.controlId);
    const key = `${record.sourceItemId}:${record.sourceVersionId}`;
    if (versions.has(key)) errors.push(`duplicate source item/version: ${key}`);
    versions.add(key);
  }
  if (!isNonEmptyString(snapshot.snapshotSha256) || !/^[a-f0-9]{64}$/.test(snapshot.snapshotSha256)) {
    errors.push("snapshotSha256 must be a SHA-256 hex digest");
  } else {
    const expected = sha256(stableStringify({ ...snapshot, snapshotSha256: undefined }));
    if (snapshot.snapshotSha256 !== expected) errors.push("snapshotSha256 does not match snapshot contents");
  }
  return errors;
}

export function assertValidControlPlaneSnapshot(snapshot) {
  const errors = validateControlPlaneSnapshot(snapshot);
  if (errors.length) throw new Error(`Invalid corpus source control-plane snapshot:\n- ${errors.join("\n- ")}`);
  return snapshot;
}

export function buildControlPlaneActionQueue(snapshot) {
  assertValidControlPlaneSnapshot(snapshot);
  const actionableStates = new Set(["DISCOVERED_UNREVIEWED", "REVIEW_READY", "HELD"]);
  const records = snapshot.records
    .filter(record => actionableStates.has(record.reviewState))
    .map(record => ({
      controlId: record.controlId,
      sourceId: record.sourceId,
      sourceItemId: record.sourceItemId,
      sourceVersionId: record.sourceVersionId,
      title: record.title,
      reviewState: record.reviewState,
      rightsState: record.rightsState,
      holdReason: record.holdReason ?? null,
      immutableLocator: record.provenance.immutableLocator,
      runtimeActivationAuthorized: false
    }));
  return {
    schemaVersion: "corpus-source-action-queue-v1",
    sourceId: snapshot.source.id,
    generatedFromSnapshotSha256: snapshot.snapshotSha256,
    automaticAdmissionAuthorized: false,
    runtimeActivationAuthorized: false,
    actionCount: records.length,
    records
  };
}

export function applyExplicitReviewDecision(record, decision, source = null) {
  assertValidControlRecord(record, source);
  if (TERMINAL_REVIEW_STATES.has(record.reviewState)) {
    throw new Error(`record ${record.controlId} is terminal at ${record.reviewState}; create a new source version/event instead of overwriting history`);
  }
  if (!isObject(decision) || decision.decisionAuthority !== "EXPLICIT_REVIEW_DECISION") {
    throw new Error("review transition requires decisionAuthority=EXPLICIT_REVIEW_DECISION");
  }
  if (!CONTROL_REVIEW_STATES.includes(decision.reviewState) || decision.reviewState === "DISCOVERED_UNREVIEWED") {
    throw new Error("explicit decision reviewState must be REVIEW_READY, HELD, ADMITTED or REJECTED");
  }

  const next = structuredClone(record);
  next.reviewState = decision.reviewState;
  next.rightsState = decision.rightsState ?? next.rightsState;
  next.decisionAuthority = "EXPLICIT_REVIEW_DECISION";
  next.decisionEvidence = structuredClone(decision.decisionEvidence ?? null);
  next.runtimeActivationAuthorized = false;

  if (decision.reviewState === "REVIEW_READY") {
    next.admissionState = null;
    next.runtimeArtifact = null;
    next.holdReason = null;
    next.rejectionReason = null;
  } else if (decision.reviewState === "HELD") {
    next.holdReason = decision.holdReason ?? null;
    next.admissionState = null;
    next.runtimeArtifact = null;
    next.rejectionReason = null;
  } else if (decision.reviewState === "REJECTED") {
    next.rejectionReason = decision.rejectionReason ?? null;
    next.admissionState = null;
    next.runtimeArtifact = null;
    next.holdReason = null;
    next.canonicalRecipeId = null;
    next.nutritionState = "NOT_APPLICABLE";
  } else if (decision.reviewState === "ADMITTED") {
    next.admissionState = decision.admissionState ?? null;
    next.canonicalRecipeId = decision.canonicalRecipeId ?? null;
    next.nutritionState = "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED";
    next.runtimeArtifact = decision.runtimeArtifact ? structuredClone(decision.runtimeArtifact) : null;
    next.holdReason = null;
    next.rejectionReason = null;
  }

  assertValidControlRecord(next, source);
  return next;
}

export function buildCorpusAdmissionManifest(snapshot, version) {
  assertValidControlPlaneSnapshot(snapshot);
  assertVersion(version);
  const admitted = snapshot.records.filter(record => record.reviewState === "ADMITTED");
  const entries = admitted.map(record => ({
    controlId: record.controlId,
    externalRecordId: record.externalRecordId ?? null,
    canonicalRecipeId: record.canonicalRecipeId,
    sourceId: record.sourceId,
    sourceItemId: record.sourceItemId,
    sourceVersionId: record.sourceVersionId,
    rightsState: record.rightsState,
    admissionState: record.admissionState,
    nutritionState: record.nutritionState,
    mediaState: record.mediaState,
    immutableLocator: record.provenance.immutableLocator,
    provenanceSha256: sha256(stableStringify(record.provenance))
  })).sort((a, b) => a.canonicalRecipeId.localeCompare(b.canonicalRecipeId) || a.controlId.localeCompare(b.controlId));

  const manifest = {
    schemaVersion: CORPUS_SOURCE_ADMISSION_MANIFEST_SCHEMA,
    version,
    sourceId: snapshot.source.id,
    generatedFromSnapshotSha256: snapshot.snapshotSha256,
    runtimeActivationAuthorized: false,
    automaticAdmissionAuthorized: false,
    recipeBodiesIncluded: false,
    requiresCanonicalRecipeNormalization: true,
    counts: {
      tracked: snapshot.records.length,
      admitted: admitted.length,
      held: snapshot.records.filter(record => record.reviewState === "HELD").length,
      rejected: snapshot.records.filter(record => record.reviewState === "REJECTED").length,
      pending: snapshot.records.filter(record => ["DISCOVERED_UNREVIEWED", "REVIEW_READY"].includes(record.reviewState)).length
    },
    entries
  };
  return {
    ...manifest,
    manifestSha256: sha256(stableStringify(manifest))
  };
}
