import { createHash } from "node:crypto";

export const STEP8G_ATRUTEL_V8018_PARENT_VERSION = "v8017";
export const STEP8G_ATRUTEL_V8018_LAYER_VERSION = "v8018";
export const STEP8G_ATRUTEL_V8018_PARENT_COUNT = 18787;
export const STEP8G_ATRUTEL_V8018_CHILD_COUNT = 481;
export const STEP8G_ATRUTEL_V8018_COMPOSED_COUNT = 19268;
export const STEP8G_ATRUTEL_V8018_MAX_ROWS_PER_BATCH = 10;
export const STEP8G_ATRUTEL_V8018_OPTIMIZED_MAX_D1_SUBQUERIES = 8;
export const STEP8G_ATRUTEL_V8018_HARD_MAX_D1_SUBQUERIES = 16;
export const STEP8G_ATRUTEL_V8018_MAX_REQUEST_BYTES = 262144;
export const STEP8G_ATRUTEL_V8018_ROUTE_STORAGE_MODE = "V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA";

export const sha256HexSync = value => createHash("sha256").update(String(value)).digest("hex");

export function buildV8017ParentFingerprint({ prewriteEvidence, liveEvidence, runtimeDescriptor }) {
  if (prewriteEvidence?.pass !== true) throw new Error("V8017_PREWRITE_PASS_REQUIRED");
  if (prewriteEvidence?.composition?.activeCorpusVersion !== "v8017" ||
      Number(prewriteEvidence?.composition?.cumulativeRecipeCount) !== STEP8G_ATRUTEL_V8018_PARENT_COUNT) throw new Error("V8017_PREWRITE_PARENT_IDENTITY_MISMATCH");

  if (liveEvidence?.pass !== true ||
      liveEvidence?.terminal !== "STEP_8G_FANNIE_FARMER_V8017_PROTECTED_POPULATION_PASS") throw new Error("V8017_LIVE_PASS_REQUIRED");
  if (liveEvidence?.liveProtectedState?.activeVersion !== "v8017" ||
      Number(liveEvidence?.liveProtectedState?.composedRecipeCount) !== STEP8G_ATRUTEL_V8018_PARENT_COUNT) throw new Error("V8017_LIVE_PARENT_IDENTITY_MISMATCH");
  if (liveEvidence?.ownerTerminal?.finalProtectedActiveVersion !== "v8017" ||
      Number(liveEvidence?.ownerTerminal?.maxObservedD1Subqueries) > STEP8G_ATRUTEL_V8018_OPTIMIZED_MAX_D1_SUBQUERIES) throw new Error("V8017_LIVE_OPTIMIZED_TERMINAL_MISMATCH");
  if (liveEvidence?.ownerTerminal?.routeStorageMode !== "V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA" ||
      Number(liveEvidence?.ownerTerminal?.parentRouteRowsCopied) !== 0) throw new Error("V8017_LIVE_ROUTE_ARCHITECTURE_MISMATCH");

  if (runtimeDescriptor?.composedRouteCount !== STEP8G_ATRUTEL_V8018_PARENT_COUNT) throw new Error("V8017_DESCRIPTOR_ROUTE_COUNT_MISMATCH");
  if (runtimeDescriptor?.layerManifestSha256 !== prewriteEvidence?.layer?.manifestSha256) throw new Error("V8017_DESCRIPTOR_MANIFEST_MISMATCH");
  if (runtimeDescriptor?.populationPlanSha256 !== prewriteEvidence?.layer?.populationPlanSha256) throw new Error("V8017_DESCRIPTOR_PLAN_MISMATCH");

  const material = {
    activeCorpusVersion: "v8017",
    composedRecipeCount: STEP8G_ATRUTEL_V8018_PARENT_COUNT,
    liveTerminal: liveEvidence.terminal,
    sourceCommit: runtimeDescriptor.sourceCommit,
    layerManifestSha256: runtimeDescriptor.layerManifestSha256,
    populationPlanSha256: runtimeDescriptor.populationPlanSha256,
    bodyShardRows: runtimeDescriptor.bodyShardRows,
    composedRouteCount: runtimeDescriptor.composedRouteCount,
    routeStorageMode: liveEvidence.ownerTerminal.routeStorageMode,
    parentRouteRowsCopied: 0,
    optimizedMaxRequestD1Subqueries: STEP8G_ATRUTEL_V8018_OPTIMIZED_MAX_D1_SUBQUERIES
  };
  return { material, sha256: sha256HexSync(JSON.stringify(material)) };
}

export function plannedV8018OperationBudget({ maxRowsPerBatch = STEP8G_ATRUTEL_V8018_MAX_ROWS_PER_BATCH } = {}) {
  if (!Number.isInteger(maxRowsPerBatch) || maxRowsPerBatch < 1 || maxRowsPerBatch > STEP8G_ATRUTEL_V8018_MAX_ROWS_PER_BATCH) throw new Error("MAX_ROWS_PER_BATCH_INVALID");
  const operations = {
    status: 1,
    bindings: 3,
    freeLimitSimulation: 1,
    initialize: 8,
    bodyWriteFresh: 6,
    bodyWriteReplay: 3,
    progress: 7,
    verifyParentAncestry: 4,
    routeWriteFresh: 7,
    routeWriteReplay: 4,
    activate: 8,
    rollback: 3,
    eighteenLayerHydrationCanary: 4,
    boundedHydrationWorstCase: 8,
    evidence: 7
  };
  const maxPlannedD1Subqueries = Math.max(...Object.values(operations));
  return {
    maxRowsPerBatch,
    routeStorageMode: STEP8G_ATRUTEL_V8018_ROUTE_STORAGE_MODE,
    parentRouteRowsCopied: 0,
    operations,
    maxPlannedD1Subqueries,
    optimizedTargetMaxD1Subqueries: STEP8G_ATRUTEL_V8018_OPTIMIZED_MAX_D1_SUBQUERIES,
    hardFailSafeMaxD1Subqueries: STEP8G_ATRUTEL_V8018_HARD_MAX_D1_SUBQUERIES,
    limitingOperations: Object.entries(operations).filter(([, value]) => value === maxPlannedD1Subqueries).map(([name]) => name),
    pass: maxPlannedD1Subqueries <= STEP8G_ATRUTEL_V8018_OPTIMIZED_MAX_D1_SUBQUERIES,
    optimizedTargetHeadroomAssumed: false,
    hardFailSafeIsNotSpendableHeadroom: true
  };
}

export function assertV8018PrewriteBoundaries(evidence) {
  if (evidence?.boundaries?.liveD1WritesPerformed !== 0) throw new Error("PREWRITE_LIVE_WRITE_FORBIDDEN");
  for (const key of ["publicRuntimeChanged","recommendationAdmissionPerformed","thirdShardUsed","d1BudgetExpansion","billingExpansion","nutritionLaneModified","youtubeCulinaryStateModified","knowledgeCoreWritePerformed","culturalAuthenticityAuthorityImported"]) {
    if (evidence?.boundaries?.[key] !== false) throw new Error(`PREWRITE_BOUNDARY_${key}_MUST_BE_FALSE`);
  }
  if (evidence?.composition?.routing?.parentRouteRowsCopied !== 0) throw new Error("PARENT_ROUTE_COPY_FORBIDDEN");
  if (evidence?.composition?.routing?.routeStorageMode !== STEP8G_ATRUTEL_V8018_ROUTE_STORAGE_MODE) throw new Error("ROUTE_STORAGE_MODE_MISMATCH");
  return true;
}
