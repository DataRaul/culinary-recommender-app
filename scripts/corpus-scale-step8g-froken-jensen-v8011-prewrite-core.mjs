import { createHash } from "node:crypto";

export const STEP8G_FROKEN_JENSEN_V8011_PARENT_VERSION = "v8010";
export const STEP8G_FROKEN_JENSEN_V8011_LAYER_VERSION = "v8011";
export const STEP8G_FROKEN_JENSEN_V8011_PARENT_COUNT = 11752;
export const STEP8G_FROKEN_JENSEN_V8011_CHILD_COUNT = 1372;
export const STEP8G_FROKEN_JENSEN_V8011_COMPOSED_COUNT = 13124;
export const STEP8G_FROKEN_JENSEN_V8011_MAX_ROWS_PER_BATCH = 10;
export const STEP8G_FROKEN_JENSEN_V8011_MAX_D1_SUBQUERIES = 16;
export const STEP8G_FROKEN_JENSEN_V8011_MAX_REQUEST_BYTES = 262144;

export const sha256HexSync = value => createHash("sha256").update(String(value)).digest("hex");

export function buildV8010ParentFingerprint({ prewriteEvidence, liveEvidence, runtimeDescriptor }) {
  if (prewriteEvidence?.pass !== true) throw new Error("V8010_PREWRITE_PASS_REQUIRED");
  if (liveEvidence?.terminal !== "STEP_8G_ARTUSI_V8010_PROTECTED_POPULATION_PASS") throw new Error("V8010_LIVE_PASS_REQUIRED");
  if (liveEvidence?.finalProtectedActiveVersion !== "v8010" || Number(liveEvidence?.composedRecipeCount) !== STEP8G_FROKEN_JENSEN_V8011_PARENT_COUNT) throw new Error("V8010_LIVE_PARENT_IDENTITY_MISMATCH");
  if (prewriteEvidence?.composition?.activeCorpusVersion !== "v8010" || Number(prewriteEvidence?.composition?.cumulativeRecipeCount) !== STEP8G_FROKEN_JENSEN_V8011_PARENT_COUNT) throw new Error("V8010_PREWRITE_PARENT_IDENTITY_MISMATCH");
  if (runtimeDescriptor?.composedRouteCount !== STEP8G_FROKEN_JENSEN_V8011_PARENT_COUNT) throw new Error("V8010_DESCRIPTOR_ROUTE_COUNT_MISMATCH");
  if (runtimeDescriptor?.layerManifestSha256 !== prewriteEvidence?.layer?.manifestSha256) throw new Error("V8010_DESCRIPTOR_MANIFEST_MISMATCH");
  if (runtimeDescriptor?.populationPlanSha256 !== prewriteEvidence?.layer?.populationPlanSha256) throw new Error("V8010_DESCRIPTOR_PLAN_MISMATCH");
  const material = {
    activeCorpusVersion: "v8010",
    composedRecipeCount: STEP8G_FROKEN_JENSEN_V8011_PARENT_COUNT,
    liveTerminal: liveEvidence.terminal,
    sourceCommit: runtimeDescriptor.sourceCommit,
    layerManifestSha256: runtimeDescriptor.layerManifestSha256,
    populationPlanSha256: runtimeDescriptor.populationPlanSha256,
    bodyShardRows: runtimeDescriptor.bodyShardRows,
    parentCompositionRouteCount: runtimeDescriptor.parentCompositionRouteCount,
    composedRouteCount: runtimeDescriptor.composedRouteCount
  };
  return { material, sha256: sha256HexSync(JSON.stringify(material)) };
}

export function plannedV8011OperationBudget({ maxRowsPerBatch = STEP8G_FROKEN_JENSEN_V8011_MAX_ROWS_PER_BATCH } = {}) {
  if (!Number.isInteger(maxRowsPerBatch) || maxRowsPerBatch < 1) throw new Error("MAX_ROWS_PER_BATCH_INVALID");
  const auth = 1;
  const bodyWriteInternal = 1 + (maxRowsPerBatch + 1) + 1 + 1;
  const routeWriteInternal = 1 + 1 + (maxRowsPerBatch + 1) + 1 + 1;
  const operations = {
    status: auth,
    bindings: auth + 2,
    freeLimitSimulation: auth,
    initialize: auth + 4 + 3,
    bodyWriteFresh: auth + bodyWriteInternal,
    bodyWriteReplay: auth + 2,
    progress: auth + 2 + 3 + 1,
    copyParentRoutesFresh: auth + 5,
    routeWriteFresh: auth + routeWriteInternal,
    routeWriteReplay: auth + 3,
    activate: auth + 2 + 3 + 2,
    rollback: auth + 2,
    elevenLayerHydrationCanary: auth + 1 + 2,
    boundedHydrationWorstCase: auth + 11,
    evidence: auth + 2 + 3 + 1
  };
  const maxPlannedD1Subqueries = Math.max(...Object.values(operations));
  return {
    authD1Subqueries: auth,
    maxRowsPerBatch,
    operations,
    maxPlannedD1Subqueries,
    maxAllowedD1Subqueries: STEP8G_FROKEN_JENSEN_V8011_MAX_D1_SUBQUERIES,
    limitingOperations: Object.entries(operations).filter(([, value]) => value === maxPlannedD1Subqueries).map(([name]) => name),
    pass: maxPlannedD1Subqueries <= STEP8G_FROKEN_JENSEN_V8011_MAX_D1_SUBQUERIES,
    headroomAssumed: false
  };
}

export function assertV8011PrewriteBoundaries(evidence) {
  if (evidence?.boundaries?.liveD1WritesPerformed !== 0) throw new Error("PREWRITE_LIVE_WRITE_FORBIDDEN");
  for (const key of ["publicRuntimeChanged","recommendationAdmissionPerformed","thirdShardUsed","d1BudgetExpansion","billingExpansion","nutritionLaneModified","youtubeCulinaryStateModified","knowledgeCoreWritePerformed","culturalAuthenticityAuthorityImported"]) {
    if (evidence?.boundaries?.[key] !== false) throw new Error(`PREWRITE_BOUNDARY_${key}_MUST_BE_FALSE`);
  }
  return true;
}
