import { createHash } from "node:crypto";

import {
  STEP7A_BUDGETS,
  STEP7A_RECIPE_DATABASES,
  STEP7A_RESERVED_DATABASES,
  recipeDatabaseShardForId
} from "./corpus-scale-step7a-core.mjs";

export const STEP8A_POPULATION_CONTRACT_VERSION = "CORPUS_SCALE_STEP8A_POPULATION_CONTRACT_V1";
export const STEP8A_INITIAL_RECIPE_SHARDS = 2;
export const STEP8A_MAX_RECIPE_SHARDS = STEP7A_RECIPE_DATABASES;
export const STEP8A_RESERVED_DATABASE_SLOTS = STEP7A_RESERVED_DATABASES;
export const STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH = 10;

const VERSION_PATTERN = /^v[0-9]{4,}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const sha256 = value => createHash("sha256").update(value).digest("hex");

function assertVersion(version, label) {
  if (!VERSION_PATTERN.test(version || "")) throw new Error(`${label} must match vNNNN or wider numeric form`);
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer`);
}

function normalizeEvidenceRefs(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some(ref => !isNonEmptyString(ref))) {
    throw new Error(`${label} requires at least one non-empty evidence reference`);
  }
  return [...new Set(value.map(ref => ref.trim()))].sort();
}

function normalizeSourceCohorts(sourceCohorts) {
  if (!Array.isArray(sourceCohorts) || sourceCohorts.length === 0) {
    throw new Error("sourceCohorts must contain at least one admitted/protected source cohort");
  }
  const seen = new Set();
  const normalized = sourceCohorts.map(source => {
    if (!isObject(source)) throw new Error("source cohort must be an object");
    const id = String(source.id || "").trim();
    if (!id) throw new Error("source cohort id is required");
    if (seen.has(id)) throw new Error(`duplicate source cohort id: ${id}`);
    seen.add(id);
    if (!isNonEmptyString(source.sourceName)) throw new Error(`${id}: sourceName is required`);
    if (!isNonEmptyString(source.sourceVersion)) throw new Error(`${id}: immutable sourceVersion is required`);
    if (!isNonEmptyString(source.admissionState)) throw new Error(`${id}: admissionState is required`);
    if (source.protectedPopulationAllowed !== true) throw new Error(`${id}: protectedPopulationAllowed must be true`);
    if (source.publicRuntimeActivationAuthorized === true) {
      throw new Error(`${id}: Step 8A source cohort cannot authorize public runtime activation`);
    }
    return {
      id,
      sourceName: source.sourceName.trim(),
      sourceVersion: source.sourceVersion.trim(),
      admissionState: source.admissionState.trim(),
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: normalizeEvidenceRefs(source.evidenceRefs, `${id}: evidenceRefs`)
    };
  });
  return normalized.sort((a, b) => a.id.localeCompare(b.id));
}

function normalizeEntries(entries, sourceById, shardCount) {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error("entries must contain at least one recipe body descriptor");
  const ids = new Set();
  const ordinals = new Set();
  const normalized = entries.map(entry => {
    if (!isObject(entry)) throw new Error("population entry must be an object");
    if (!Number.isInteger(entry.ordinal) || entry.ordinal < 0) throw new Error("population entry ordinal must be a non-negative integer");
    const recipeId = String(entry.recipeId || "").trim();
    if (!recipeId) throw new Error(`population entry ${entry.ordinal} requires recipeId`);
    if (ids.has(recipeId)) throw new Error(`duplicate population recipeId: ${recipeId}`);
    if (ordinals.has(entry.ordinal)) throw new Error(`duplicate population ordinal: ${entry.ordinal}`);
    ids.add(recipeId);
    ordinals.add(entry.ordinal);
    if (!SHA256_PATTERN.test(entry.bodySha256 || "")) throw new Error(`${recipeId}: bodySha256 must be lowercase SHA-256 hex`);
    assertPositiveInteger(entry.bodyBytes, `${recipeId}: bodyBytes`);
    const sourceCohortId = String(entry.sourceCohortId || "").trim();
    if (!sourceById.has(sourceCohortId)) throw new Error(`${recipeId}: unknown source cohort ${sourceCohortId || "<empty>"}`);
    return {
      ordinal: entry.ordinal,
      recipeId,
      bodySha256: entry.bodySha256,
      bodyBytes: entry.bodyBytes,
      sourceCohortId,
      shardNumber: recipeDatabaseShardForId(recipeId, shardCount)
    };
  }).sort((a, b) => a.ordinal - b.ordinal);

  for (let ordinal = 0; ordinal < normalized.length; ordinal += 1) {
    if (normalized[ordinal].ordinal !== ordinal) {
      throw new Error(`population ordinals must be contiguous from zero; expected ${ordinal}, found ${normalized[ordinal].ordinal}`);
    }
  }
  return normalized;
}

function shardDescriptors(entries, shardCount) {
  const groups = Array.from({ length: shardCount }, () => []);
  for (const entry of entries) groups[entry.shardNumber].push(entry);
  return groups.map((rows, shardNumber) => ({
    shardNumber,
    rowCount: rows.length,
    totalBodyBytes: rows.reduce((sum, row) => sum + row.bodyBytes, 0),
    firstOrdinal: rows.length ? rows[0].ordinal : null,
    lastOrdinal: rows.length ? rows[rows.length - 1].ordinal : null,
    entriesSha256: sha256(JSON.stringify(rows.map(row => [row.ordinal, row.recipeId, row.bodySha256, row.bodyBytes, row.sourceCohortId])))
  }));
}

function normalizeShardCount(value) {
  const shardCount = value == null ? STEP8A_INITIAL_RECIPE_SHARDS : Number(value);
  assertPositiveInteger(shardCount, "recipeShardCount");
  if (shardCount < 2) throw new Error("recipeShardCount must be at least 2 to prove multi-shard routing");
  if (shardCount > STEP8A_MAX_RECIPE_SHARDS) throw new Error(`recipeShardCount exceeds measured maximum ${STEP8A_MAX_RECIPE_SHARDS}`);
  return shardCount;
}

export function buildStep8APopulationPlan({
  corpusVersion,
  parentCorpusVersion = null,
  sourceCohorts,
  entries,
  recipeShardCount = STEP8A_INITIAL_RECIPE_SHARDS,
  rowsPerWriteBatch = STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH
} = {}) {
  assertVersion(corpusVersion, "corpusVersion");
  if (parentCorpusVersion != null) assertVersion(parentCorpusVersion, "parentCorpusVersion");
  if (parentCorpusVersion === corpusVersion) throw new Error("parentCorpusVersion must differ from corpusVersion");
  const shardCount = normalizeShardCount(recipeShardCount);
  assertPositiveInteger(rowsPerWriteBatch, "rowsPerWriteBatch");
  if (rowsPerWriteBatch > STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH) {
    throw new Error(`rowsPerWriteBatch exceeds pre-8B proven maximum ${STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH}`);
  }

  const normalizedSources = normalizeSourceCohorts(sourceCohorts);
  const sourceById = new Map(normalizedSources.map(source => [source.id, source]));
  const normalizedEntries = normalizeEntries(entries, sourceById, shardCount);
  const shards = shardDescriptors(normalizedEntries, shardCount);

  const manifestCore = {
    contractVersion: STEP8A_POPULATION_CONTRACT_VERSION,
    corpusVersion,
    parentCorpusVersion,
    recipeCount: normalizedEntries.length,
    sourceCohorts: normalizedSources,
    recipeBodyShards: {
      shardCount,
      deterministicRouter: "recipeDatabaseShardForId/FNV1A32_MOD_SHARD_COUNT",
      descriptors: shards
    },
    inheritedBudgets: {
      maxTotalBytesAt170k: STEP7A_BUDGETS.maxTotalBytesAt170k,
      maxDatabaseBytesAt170k: STEP7A_BUDGETS.maxDatabaseBytesAt170k,
      maxIndexArtifactRowBytes: STEP7A_BUDGETS.maxIndexArtifactRowBytes,
      maxHydratedCandidates: STEP7A_BUDGETS.maxHydratedCandidates,
      maxD1SubqueriesPerProtectedRequest: STEP7A_BUDGETS.maxD1SubqueriesPerProtectedRequest,
      maxDatabaseSlots: STEP7A_BUDGETS.maxDatabaseSlots,
      reservedDatabaseSlots: STEP7A_BUDGETS.reservedDatabaseSlots,
      maxProviderRowOrBlobBytes: STEP7A_BUDGETS.maxProviderRowOrBlobBytes
    },
    writeContract: {
      rowsPerWriteBatch,
      metadataStatementsPerBatch: 1,
      maxPlannedStatementsPerBatch: rowsPerWriteBatch + 1,
      idempotencyKey: "batchId_plus_expectedSha256",
      exactReceiptRequired: true
    },
    invariants: {
      immutableCorpusVersion: true,
      sourceVersionProvenanceRequired: true,
      stableCanonicalOrdinalsRequired: true,
      publicRuntimeActivationAuthorized: false,
      automaticAdmissionAuthorized: false,
      sourceNutritionAuthorityImported: false,
      sourceDietaryAllergenInferenceAuthorized: false,
      sourceRatioPromotionAuthorized: false,
      destructiveRollbackAllowed: false,
      billingAuthorizationAllowed: false
    }
  };
  const manifestSha256 = sha256(JSON.stringify(manifestCore));
  const manifest = { ...manifestCore, manifestSha256 };

  const batches = [];
  for (const descriptor of shards) {
    const rows = normalizedEntries.filter(entry => entry.shardNumber === descriptor.shardNumber);
    for (let offset = 0, batchNumber = 0; offset < rows.length; offset += rowsPerWriteBatch, batchNumber += 1) {
      const batchEntries = rows.slice(offset, offset + rowsPerWriteBatch);
      const batchCore = {
        shardNumber: descriptor.shardNumber,
        batchNumber,
        entries: batchEntries.map(entry => ({
          ordinal: entry.ordinal,
          recipeId: entry.recipeId,
          bodySha256: entry.bodySha256,
          bodyBytes: entry.bodyBytes,
          sourceCohortId: entry.sourceCohortId
        }))
      };
      const expectedSha256 = sha256(JSON.stringify(batchCore));
      batches.push({
        batchId: `s${String(descriptor.shardNumber).padStart(2, "0")}-b${String(batchNumber).padStart(6, "0")}`,
        shardNumber: descriptor.shardNumber,
        batchNumber,
        rowCount: batchEntries.length,
        totalBodyBytes: batchEntries.reduce((sum, entry) => sum + entry.bodyBytes, 0),
        plannedStatements: batchEntries.length + 1,
        expectedSha256,
        entries: batchCore.entries
      });
    }
  }

  return {
    contractVersion: STEP8A_POPULATION_CONTRACT_VERSION,
    manifest,
    batches,
    populationPlanSha256: sha256(JSON.stringify({ manifestSha256, batches }))
  };
}

function normalizeReceipts(receipts) {
  if (!Array.isArray(receipts)) throw new Error("receipts must be an array");
  const byId = new Map();
  const duplicateConflicts = [];
  for (const receipt of receipts) {
    if (!isObject(receipt) || !isNonEmptyString(receipt.batchId)) throw new Error("receipt batchId is required");
    const normalized = {
      batchId: receipt.batchId,
      expectedSha256: receipt.expectedSha256,
      rowCount: receipt.rowCount,
      status: receipt.status
    };
    const existing = byId.get(normalized.batchId);
    if (existing && JSON.stringify(existing) !== JSON.stringify(normalized)) duplicateConflicts.push(normalized.batchId);
    else byId.set(normalized.batchId, normalized);
  }
  return { byId, duplicateConflicts };
}

export function classifyStep8APopulationProgress(plan, receipts = []) {
  if (!isObject(plan) || plan.contractVersion !== STEP8A_POPULATION_CONTRACT_VERSION || !Array.isArray(plan.batches)) {
    throw new Error("invalid Step 8A population plan");
  }
  const { byId, duplicateConflicts } = normalizeReceipts(receipts);
  const known = new Map(plan.batches.map(batch => [batch.batchId, batch]));
  const conflicts = duplicateConflicts.map(batchId => ({ batchId, reason: "DUPLICATE_RECEIPT_CONFLICT" }));
  const completed = [];

  for (const [batchId, receipt] of byId) {
    const batch = known.get(batchId);
    if (!batch) {
      conflicts.push({ batchId, reason: "UNKNOWN_BATCH" });
      continue;
    }
    if (receipt.status !== "VERIFIED") {
      conflicts.push({ batchId, reason: "RECEIPT_NOT_VERIFIED" });
      continue;
    }
    if (receipt.expectedSha256 !== batch.expectedSha256) {
      conflicts.push({ batchId, reason: "BATCH_FINGERPRINT_MISMATCH" });
      continue;
    }
    if (receipt.rowCount !== batch.rowCount) {
      conflicts.push({ batchId, reason: "BATCH_ROW_COUNT_MISMATCH" });
      continue;
    }
    completed.push(batchId);
  }

  const completedSet = new Set(completed);
  const pending = plan.batches.map(batch => batch.batchId).filter(batchId => !completedSet.has(batchId));
  let status = "READY";
  if (conflicts.length) status = "CONFLICT_FAIL_CLOSED";
  else if (pending.length === 0) status = "COMPLETE_VERIFIED";
  else if (completed.length) status = "RESUMABLE_PARTIAL";

  return {
    status,
    writesMayContinue: conflicts.length === 0,
    completedBatchIds: completed.sort(),
    idempotentSkipBatchIds: completed.sort(),
    pendingBatchIds: pending,
    conflicts,
    exactPlanFingerprint: plan.populationPlanSha256
  };
}

export function verifiedReceiptForBatch(batch) {
  if (!isObject(batch) || !isNonEmptyString(batch.batchId)) throw new Error("valid batch required");
  return {
    batchId: batch.batchId,
    expectedSha256: batch.expectedSha256,
    rowCount: batch.rowCount,
    status: "VERIFIED"
  };
}

export function buildStep8ARollbackDirective({ fromManifest, toManifest } = {}) {
  if (!isObject(fromManifest) || !isObject(toManifest)) throw new Error("fromManifest and toManifest are required");
  if (fromManifest.contractVersion !== STEP8A_POPULATION_CONTRACT_VERSION || toManifest.contractVersion !== STEP8A_POPULATION_CONTRACT_VERSION) {
    throw new Error("rollback manifests must use the Step 8A population contract");
  }
  if (fromManifest.parentCorpusVersion !== toManifest.corpusVersion) {
    throw new Error("rollback target must be the immutable parent corpus version");
  }
  if (!SHA256_PATTERN.test(toManifest.manifestSha256 || "")) throw new Error("rollback target manifest fingerprint is invalid");
  return {
    contractVersion: STEP8A_POPULATION_CONTRACT_VERSION,
    mode: "ACTIVE_VERSION_POINTER_SWITCH_ONLY",
    fromCorpusVersion: fromManifest.corpusVersion,
    toCorpusVersion: toManifest.corpusVersion,
    targetManifestSha256: toManifest.manifestSha256,
    requiresTargetIntegrityVerified: true,
    destructiveDeleteAllowed: false,
    publicRuntimeChangeAllowed: false,
    billingAuthorizationAllowed: false
  };
}

export function validateStep8AEvidenceEnvelope(evidence = {}) {
  const errors = [];
  if (evidence.repositoryOnly !== true) errors.push("repositoryOnly must be true for Step 8A terminal evidence");
  if (evidence.createdRecipeBodyShards !== 0) errors.push("Step 8A must create zero recipe-body shards");
  if (evidence.publicRuntimeChanged !== false) errors.push("Step 8A must not change public runtime behavior");
  if (evidence.billingAuthorizationObserved !== false) errors.push("billing authorization must remain absent");
  if (evidence.paidPlanActivated !== false) errors.push("paid plan activation must remain false");
  if (evidence.r2Activated !== false) errors.push("R2 activation must remain false");
  if (evidence.zeroTrustAccessActivated !== false) errors.push("Zero Trust/Access activation must remain false");
  if (evidence.youtubeStateModified !== false) errors.push("YT-CUL state must remain untouched");
  if (evidence.nutritionBLaneModified !== false) errors.push("Nutrition B-lane must remain untouched");
  if (evidence.knowledgeCoreWritePerformed !== false) errors.push("Knowledge Core writes are not allowed from Step 8A");
  return { pass: errors.length === 0, errors };
}
