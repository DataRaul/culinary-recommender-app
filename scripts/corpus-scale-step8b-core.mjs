import { createHash } from "node:crypto";

import {
  STEP8A_INITIAL_RECIPE_SHARDS,
  STEP8A_POPULATION_CONTRACT_VERSION,
  STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH
} from "./corpus-scale-step8a-core.mjs";
import {
  STEP7A_BUDGETS,
  recipeDatabaseShardForId
} from "./corpus-scale-step7a-core.mjs";

export const STEP8B_MACHINE_PREP_CONTRACT_VERSION = "CORPUS_SCALE_STEP8B_MACHINE_PREP_V1";
export const STEP8B_REQUIRED_RECIPE_SHARDS = STEP8A_INITIAL_RECIPE_SHARDS;
export const STEP8B_MAX_CANARY_ROWS_PER_SHARD = STEP8A_PRE_CANARY_MAX_ROWS_PER_WRITE_BATCH;

export const STEP8B_SHARD_SPECS = Object.freeze([
  Object.freeze({
    shardNumber: 0,
    databaseName: "culinary-recipes-00",
    bindingName: "CULINARY_RECIPE_SHARD_00_DB"
  }),
  Object.freeze({
    shardNumber: 1,
    databaseName: "culinary-recipes-01",
    bindingName: "CULINARY_RECIPE_SHARD_01_DB"
  })
]);

export const STEP8B_RECIPE_TABLE = "corpus_recipe_bodies";
export const STEP8B_RECEIPT_TABLE = "corpus_population_receipts";

export const STEP8B_RECIPE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8B_RECIPE_TABLE} (
  corpus_version TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  recipe_id TEXT NOT NULL,
  body_json TEXT NOT NULL,
  body_bytes INTEGER NOT NULL,
  body_sha256 TEXT NOT NULL,
  source_cohort_id TEXT NOT NULL,
  PRIMARY KEY (corpus_version, ordinal),
  UNIQUE (corpus_version, recipe_id)
)`;

export const STEP8B_RECEIPT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${STEP8B_RECEIPT_TABLE} (
  corpus_version TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  expected_sha256 TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  verified INTEGER NOT NULL CHECK (verified IN (0, 1)),
  PRIMARY KEY (corpus_version, batch_id)
)`;

const sha256 = value => createHash("sha256").update(value).digest("hex");
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function assertStep8APlan(plan) {
  if (!isObject(plan) || plan.contractVersion !== STEP8A_POPULATION_CONTRACT_VERSION) {
    throw new Error("Step 8B requires a valid Step 8A population plan");
  }
  if (plan.manifest?.recipeBodyShards?.shardCount !== STEP8B_REQUIRED_RECIPE_SHARDS) {
    throw new Error(`Step 8B minimum canary requires exactly ${STEP8B_REQUIRED_RECIPE_SHARDS} recipe-body shards`);
  }
  if (!Array.isArray(plan.batches) || plan.batches.length < STEP8B_REQUIRED_RECIPE_SHARDS) {
    throw new Error("Step 8B requires Step 8A batches for both recipe-body shards");
  }
}

function firstBatchForShard(plan, shardNumber) {
  return plan.batches
    .filter(batch => batch.shardNumber === shardNumber)
    .sort((a, b) => a.batchNumber - b.batchNumber)[0] || null;
}

function normalizeCanaryBatch(batch, spec, maxRowsPerShard) {
  if (!batch) throw new Error(`Step 8B canary shard ${spec.shardNumber} has no population batch`);
  const entries = batch.entries.slice(0, maxRowsPerShard);
  if (!entries.length) throw new Error(`Step 8B canary shard ${spec.shardNumber} has no entries`);
  for (const entry of entries) {
    if (recipeDatabaseShardForId(entry.recipeId, STEP8B_REQUIRED_RECIPE_SHARDS) !== spec.shardNumber) {
      throw new Error(`${entry.recipeId}: Step 8B shard routing mismatch`);
    }
  }
  const core = {
    shardNumber: spec.shardNumber,
    databaseName: spec.databaseName,
    bindingName: spec.bindingName,
    entries
  };
  const expectedSha256 = sha256(JSON.stringify(core));
  return {
    batchId: `step8b-s${String(spec.shardNumber).padStart(2, "0")}-canary-000000`,
    shardNumber: spec.shardNumber,
    databaseName: spec.databaseName,
    bindingName: spec.bindingName,
    rowCount: entries.length,
    plannedStatements: entries.length + 1,
    expectedSha256,
    entries
  };
}

export function buildStep8BMachineCanaryPlan(step8aPlan, options = {}) {
  assertStep8APlan(step8aPlan);
  const maxRowsPerShard = options.maxRowsPerShard == null
    ? STEP8B_MAX_CANARY_ROWS_PER_SHARD
    : Number(options.maxRowsPerShard);
  if (!Number.isInteger(maxRowsPerShard) || maxRowsPerShard <= 0) {
    throw new Error("maxRowsPerShard must be a positive integer");
  }
  if (maxRowsPerShard > STEP8B_MAX_CANARY_ROWS_PER_SHARD) {
    throw new Error(`maxRowsPerShard exceeds inherited pre-canary maximum ${STEP8B_MAX_CANARY_ROWS_PER_SHARD}`);
  }

  const shardBatches = STEP8B_SHARD_SPECS.map(spec => normalizeCanaryBatch(
    firstBatchForShard(step8aPlan, spec.shardNumber),
    spec,
    maxRowsPerShard
  ));

  const core = {
    contractVersion: STEP8B_MACHINE_PREP_CONTRACT_VERSION,
    parentPopulationPlanSha256: step8aPlan.populationPlanSha256,
    corpusVersion: step8aPlan.manifest.corpusVersion,
    shardCount: STEP8B_REQUIRED_RECIPE_SHARDS,
    shardSpecs: STEP8B_SHARD_SPECS,
    shardBatches,
    schema: {
      recipeTable: STEP8B_RECIPE_TABLE,
      receiptTable: STEP8B_RECEIPT_TABLE,
      recipeTableSql: STEP8B_RECIPE_TABLE_SQL.trim(),
      receiptTableSql: STEP8B_RECEIPT_TABLE_SQL.trim()
    },
    readContract: {
      exactPrimaryKeyOrRecipeIdReadsOnly: true,
      fullCorpusScansAllowed: false,
      accountStateReadPerProtectedRequestMax: 1,
      maxD1SubqueriesPerProtectedRequest: STEP7A_BUDGETS.maxD1SubqueriesPerProtectedRequest
    },
    writeContract: {
      maxRowsPerShardBatch: STEP8B_MAX_CANARY_ROWS_PER_SHARD,
      metadataStatementsPerBatch: 1,
      maxPlannedStatementsPerBatch: STEP8B_MAX_CANARY_ROWS_PER_SHARD + 1,
      exactPostWriteVerificationRequired: true,
      indeterminateWriteMayBeBlindlyRetried: false
    },
    recoveryContract: {
      verifiedBatchIsIdempotentSkip: true,
      verifiedAbsentBatchMayBeRetried: true,
      indeterminateOrConflictingStateFailsClosed: true,
      rollbackMode: "ACTIVE_VERSION_POINTER_SWITCH_ONLY",
      destructiveDeleteRollbackAllowed: false
    },
    authority: {
      machinePreparationOnly: true,
      shardCreationAuthorized: false,
      bindingCreationAuthorized: false,
      protectedPopulationAuthorizedBeyondCanary: false,
      publicRecommendationRuntimeActivationAuthorized: false,
      billingAuthorizationAllowed: false,
      workersPaidAllowed: false,
      r2Allowed: false,
      zeroTrustAccessAllowed: false,
      youtubeMutationAllowed: false,
      nutritionBLaneMutationAllowed: false,
      knowledgeCoreWriteAllowed: false
    }
  };

  return {
    ...core,
    canaryPlanSha256: sha256(JSON.stringify(core))
  };
}

export function buildStep8BProtectedReadPlan(canaryPlan, recipeIds) {
  if (!isObject(canaryPlan) || canaryPlan.contractVersion !== STEP8B_MACHINE_PREP_CONTRACT_VERSION) {
    throw new Error("valid Step 8B canary plan required");
  }
  if (!Array.isArray(recipeIds) || recipeIds.length === 0) throw new Error("recipeIds must be non-empty");

  const available = new Map();
  for (const batch of canaryPlan.shardBatches) {
    for (const entry of batch.entries) available.set(entry.recipeId, entry);
  }

  const uniqueIds = [...new Set(recipeIds.map(value => String(value)))];
  const groups = new Map();
  for (const recipeId of uniqueIds) {
    const entry = available.get(recipeId);
    if (!entry) throw new Error(`recipeId is outside the Step 8B canary fixture: ${recipeId}`);
    const shardNumber = recipeDatabaseShardForId(recipeId, STEP8B_REQUIRED_RECIPE_SHARDS);
    const group = groups.get(shardNumber) || [];
    group.push(recipeId);
    groups.set(shardNumber, group);
  }

  const shardReads = [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([shardNumber, ids]) => ({
      shardNumber,
      bindingName: STEP8B_SHARD_SPECS[shardNumber].bindingName,
      recipeIds: ids.sort(),
      queryShape: "BOUNDED_PRIMARY_KEY_OR_UNIQUE_RECIPE_ID_READ"
    }));
  const d1Subqueries = 1 + shardReads.length;
  if (d1Subqueries > STEP7A_BUDGETS.maxD1SubqueriesPerProtectedRequest) {
    throw new Error("Step 8B protected read plan exceeds D1 subquery budget");
  }
  return {
    accountStateReads: 1,
    shardReads,
    touchedShards: shardReads.length,
    d1Subqueries,
    fullCorpusScan: false,
    boundedRecipeIds: uniqueIds.sort()
  };
}

function expectedCanaryBatches(canaryPlan) {
  return new Map(canaryPlan.shardBatches.map(batch => [batch.batchId, batch]));
}

export function classifyStep8BCanaryProgress(canaryPlan, receipts = []) {
  if (!isObject(canaryPlan) || canaryPlan.contractVersion !== STEP8B_MACHINE_PREP_CONTRACT_VERSION) {
    throw new Error("valid Step 8B canary plan required");
  }
  if (!Array.isArray(receipts)) throw new Error("receipts must be an array");
  const expected = expectedCanaryBatches(canaryPlan);
  const seen = new Set();
  const completed = [];
  const retryable = [];
  const conflicts = [];

  for (const receipt of receipts) {
    if (!isObject(receipt) || typeof receipt.batchId !== "string") throw new Error("receipt batchId is required");
    if (seen.has(receipt.batchId)) {
      conflicts.push({ batchId: receipt.batchId, reason: "DUPLICATE_RECEIPT" });
      continue;
    }
    seen.add(receipt.batchId);
    const batch = expected.get(receipt.batchId);
    if (!batch) {
      conflicts.push({ batchId: receipt.batchId, reason: "UNKNOWN_BATCH" });
      continue;
    }
    if (receipt.status === "VERIFIED") {
      if (receipt.expectedSha256 !== batch.expectedSha256) {
        conflicts.push({ batchId: receipt.batchId, reason: "BATCH_FINGERPRINT_MISMATCH" });
      } else if (receipt.rowCount !== batch.rowCount) {
        conflicts.push({ batchId: receipt.batchId, reason: "BATCH_ROW_COUNT_MISMATCH" });
      } else {
        completed.push(receipt.batchId);
      }
      continue;
    }
    if (receipt.status === "ABSENT_VERIFIED") {
      retryable.push(receipt.batchId);
      continue;
    }
    conflicts.push({ batchId: receipt.batchId, reason: "INDETERMINATE_OR_UNVERIFIED_STATE" });
  }

  for (const batchId of expected.keys()) {
    if (!seen.has(batchId)) retryable.push(batchId);
  }

  const status = conflicts.length
    ? "CONFLICT_FAIL_CLOSED"
    : completed.length === expected.size
      ? "COMPLETE_VERIFIED"
      : completed.length
        ? "RESUMABLE_PARTIAL"
        : "READY";

  return {
    status,
    writesMayContinue: conflicts.length === 0,
    idempotentSkipBatchIds: completed.sort(),
    retryableBatchIds: [...new Set(retryable)].sort(),
    conflicts,
    exactCanaryPlanFingerprint: canaryPlan.canaryPlanSha256
  };
}

export function verifiedStep8BReceipt(batch) {
  if (!isObject(batch)) throw new Error("batch required");
  return {
    batchId: batch.batchId,
    status: "VERIFIED",
    expectedSha256: batch.expectedSha256,
    rowCount: batch.rowCount
  };
}

export function validateStep8BLiveEvidenceEnvelope(evidence = {}) {
  const errors = [];
  if (evidence.humanAccountGatePassed !== true) errors.push("human/account no-billing gate must pass before Step 8B live acceptance");
  if (evidence.createdRecipeBodyShards !== STEP8B_REQUIRED_RECIPE_SHARDS) errors.push("exactly two recipe-body shards must exist for the minimum canary");
  if (evidence.boundShardBindings !== STEP8B_REQUIRED_RECIPE_SHARDS) errors.push("both recipe-body shard bindings must be present");
  if (evidence.authenticatedCrossShardReadPass !== true) errors.push("authenticated cross-shard read must pass");
  if (evidence.unauthenticatedDeniedBeforeShardRead !== true) errors.push("unauthenticated request must be denied before shard reads");
  if (evidence.freeLimitFailClosedBeforeShardRead !== true) errors.push("Free-limit simulation must fail closed before protected shard reads");
  if (evidence.idempotentWritePass !== true) errors.push("exact verified batch replay must be an idempotent skip");
  if (evidence.partialFailureRecoveryPass !== true) errors.push("partial-failure recovery must be verified");
  if (evidence.rollbackPass !== true) errors.push("immutable-version rollback path must be verified");
  if (evidence.fullCorpusScans !== 0) errors.push("Step 8B permits zero full-corpus scans");
  if (!Number.isInteger(evidence.maxObservedD1Subqueries) || evidence.maxObservedD1Subqueries > STEP7A_BUDGETS.maxD1SubqueriesPerProtectedRequest) {
    errors.push("observed D1 subqueries exceed or do not establish the project budget");
  }
  if (evidence.billingAuthorizationObserved !== false) errors.push("billing authorization must remain absent");
  if (evidence.paidPlanActivated !== false) errors.push("paid plan must remain inactive");
  if (evidence.r2Activated !== false) errors.push("R2 must remain inactive");
  if (evidence.zeroTrustAccessActivated !== false) errors.push("Zero Trust/Access must remain inactive");
  if (evidence.publicRecommendationRuntimeChanged !== false) errors.push("normal public recommendation runtime must remain unchanged");
  if (evidence.youtubeStateModified !== false) errors.push("YT-CUL state must remain unchanged");
  if (evidence.nutritionBLaneModified !== false) errors.push("Nutrition B lane must remain unchanged");
  if (evidence.knowledgeCoreWritePerformed !== false) errors.push("Knowledge Core writes are forbidden from Step 8B");

  return {
    pass: errors.length === 0,
    terminal: errors.length === 0 ? "STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS" : null,
    errors
  };
}
