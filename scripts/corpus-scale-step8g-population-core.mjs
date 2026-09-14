import { createHash } from "node:crypto";

import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";
import {
  FORKRECIPE_STEP7E_EXPECTED_COMMIT,
  FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT,
  FORKRECIPE_STEP7E_LICENSE,
  FORKRECIPE_STEP7E_LICENSE_URL,
  FORKRECIPE_STEP7E_SOURCE_ID,
  FORKRECIPE_STEP7E_SOURCE_REPO,
  buildForkRecipeStep7ePilot
} from "./forkrecipe-step7e-core.mjs";

export const STEP8G_PREWRITE_SCHEMA = "CORPUS_SCALE_STEP8G_FORKRECIPE_PREWRITE_V1";
export const STEP8G_COMPOSITION_SCHEMA = "CORPUS_SCALE_STEP8G_LAYER_COMPOSITION_V1";
export const STEP8G_ROUTE_INDEX_SCHEMA = "CORPUS_SCALE_STEP8G_ROUTE_INDEX_V1";
export const STEP8G_FORKRECIPE_LAYER_VERSION = "v8002";
export const STEP8G_PARENT_VERSION = "v8001";
export const STEP8G_SHARD_COUNT = 2;
export const STEP8G_MAX_ROWS_PER_WRITE_BATCH = 10;
export const STEP8G_MAX_HYDRATED_CANDIDATES = 256;
export const STEP8G_MAX_PROTECTED_D1_SUBQUERIES = 16;
export const STEP8G_MAX_DATABASE_BYTES = 350 * 1024 * 1024;
export const STEP8G_MAX_TOTAL_BYTES = 3.5 * 1024 * 1024 * 1024;

const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(value).digest("hex");
const bytes = value => encoder.encode(String(value)).byteLength;

function requireParentManifest(parentManifest) {
  if (!parentManifest || parentManifest.corpusVersion !== STEP8G_PARENT_VERSION) {
    throw new Error(`Step 8G requires parent protected corpus ${STEP8G_PARENT_VERSION}`);
  }
  if (parentManifest.recipeCount !== 501) throw new Error("Step 8G parent must freeze exactly 501 UniTools recipes");
  if (parentManifest.routing?.shardCount !== STEP8G_SHARD_COUNT) throw new Error("Step 8G must preserve the earned two-shard topology");
  if (!Array.isArray(parentManifest.entries) || parentManifest.entries.length !== 501) {
    throw new Error("Step 8G parent manifest requires exact descriptor entries");
  }
  return parentManifest;
}

function parentRouteEntries(parentManifest) {
  return parentManifest.entries.map(entry => ({
    recipeId: String(entry.recipeId),
    corpusVersion: String(parentManifest.corpusVersion),
    shardNumber: Number(entry.shardNumber),
    sourceCohortId: String(entry.sourceCohortId),
    bodySha256: String(entry.bodySha256),
    bodyBytes: Number(entry.bodyBytes)
  }));
}

function layerRouteEntries(layerPlan) {
  return layerPlan.batches.flatMap(batch => batch.entries.map(entry => ({
    recipeId: String(entry.recipeId),
    corpusVersion: String(layerPlan.manifest.corpusVersion),
    shardNumber: Number(batch.shardNumber),
    sourceCohortId: String(entry.sourceCohortId),
    bodySha256: String(entry.bodySha256),
    bodyBytes: Number(entry.bodyBytes)
  })));
}

export function buildStep8GRouteIndex({ parentManifest, layerPlan } = {}) {
  const parent = requireParentManifest(parentManifest);
  if (layerPlan?.manifest?.corpusVersion !== STEP8G_FORKRECIPE_LAYER_VERSION) throw new Error("Step 8G layer version mismatch");
  if (layerPlan.manifest.parentCorpusVersion !== STEP8G_PARENT_VERSION) throw new Error("Step 8G layer parent mismatch");
  if (layerPlan.manifest.recipeBodyShards?.shardCount !== STEP8G_SHARD_COUNT) throw new Error("Step 8G layer must remain on two shards");

  const routes = [...parentRouteEntries(parent), ...layerRouteEntries(layerPlan)]
    .sort((a, b) => a.recipeId.localeCompare(b.recipeId));
  const duplicateIds = [];
  for (let index = 1; index < routes.length; index += 1) {
    if (routes[index - 1].recipeId === routes[index].recipeId) duplicateIds.push(routes[index].recipeId);
  }
  if (duplicateIds.length) throw new Error(`Step 8G route index recipe ID collision: ${duplicateIds[0]}`);

  const core = {
    schema: STEP8G_ROUTE_INDEX_SCHEMA,
    activeCorpusVersion: STEP8G_FORKRECIPE_LAYER_VERSION,
    parentCorpusVersion: STEP8G_PARENT_VERSION,
    routeCount: routes.length,
    shardCount: STEP8G_SHARD_COUNT,
    lookupKey: "recipe_id",
    hydrationKey: "corpus_version_plus_recipe_id",
    fullCorpusScanRequired: false,
    routes
  };
  return { ...core, routeIndexSha256: sha256(JSON.stringify(core)) };
}

export function planStep8GProtectedHydration(routeIndex, recipeIds = []) {
  if (routeIndex?.schema !== STEP8G_ROUTE_INDEX_SCHEMA) throw new Error("valid Step 8G route index required");
  const requested = [...new Set(recipeIds.map(value => String(value)).filter(Boolean))];
  if (requested.length === 0) throw new Error("at least one recipe ID is required");
  if (requested.length > STEP8G_MAX_HYDRATED_CANDIDATES) throw new Error("Step 8G hydration candidate limit exceeded");
  const byId = new Map(routeIndex.routes.map(route => [route.recipeId, route]));
  const missing = requested.filter(id => !byId.has(id));
  if (missing.length) return { pass: false, reason: "ROUTE_NOT_FOUND_FAIL_CLOSED", missingRecipeIds: missing };

  const groups = new Map();
  for (const recipeId of requested) {
    const route = byId.get(recipeId);
    const key = String(route.shardNumber);
    const list = groups.get(key) || [];
    list.push({ recipeId, corpusVersion: route.corpusVersion });
    groups.set(key, list);
  }
  const shardQueries = [...groups.entries()].map(([shardNumber, rows]) => ({
    shardNumber: Number(shardNumber),
    rows: rows.sort((a, b) => a.recipeId.localeCompare(b.recipeId)),
    queryShape: "BATCH_EXACT_(corpus_version,recipe_id)_LOOKUP"
  })).sort((a, b) => a.shardNumber - b.shardNumber);
  const d1Subqueries = 1 + 1 + shardQueries.length; // auth + route-index lookup + at most one exact batch lookup per shard
  return {
    pass: d1Subqueries <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
    requestedRecipeCount: requested.length,
    authSubqueries: 1,
    routeIndexSubqueries: 1,
    recipeShardSubqueries: shardQueries.length,
    d1Subqueries,
    maxAllowedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
    fullCorpusScans: 0,
    shardQueries
  };
}

export function buildStep8GComposition({ parentManifest, layerPlan, routeIndex } = {}) {
  const parent = requireParentManifest(parentManifest);
  if (routeIndex?.schema !== STEP8G_ROUTE_INDEX_SCHEMA) throw new Error("Step 8G route index required");
  const parentBytes = parent.routing.descriptors.reduce((sum, row) => sum + Number(row.totalBodyBytes || 0), 0);
  const layerBytes = layerPlan.manifest.recipeBodyShards.descriptors.reduce((sum, row) => sum + Number(row.totalBodyBytes || 0), 0);
  const layerRows = layerPlan.manifest.recipeCount;
  const cumulativeRecipeCount = parent.recipeCount + layerRows;
  if (routeIndex.routeCount !== cumulativeRecipeCount) throw new Error("Step 8G composition route count mismatch");

  const perShard = Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) => {
    const parentShard = parent.routing.descriptors.find(row => Number(row.shardNumber) === shardNumber);
    const layerShard = layerPlan.manifest.recipeBodyShards.descriptors.find(row => Number(row.shardNumber) === shardNumber);
    const rowCount = Number(parentShard?.rowCount || 0) + Number(layerShard?.rowCount || 0);
    const totalBodyBytes = Number(parentShard?.totalBodyBytes || 0) + Number(layerShard?.totalBodyBytes || 0);
    return {
      shardNumber,
      rowCount,
      totalBodyBytes,
      withinProjectDatabaseBudget: totalBodyBytes <= STEP8G_MAX_DATABASE_BYTES
    };
  });

  const layeredPhysicalBodyBytes = parentBytes + layerBytes;
  const naiveImmutableSnapshotBodyBytes = parentBytes + parentBytes + layerBytes;
  const core = {
    schema: STEP8G_COMPOSITION_SCHEMA,
    activeCorpusVersion: STEP8G_FORKRECIPE_LAYER_VERSION,
    parentCorpusVersion: STEP8G_PARENT_VERSION,
    layers: [
      {
        corpusVersion: STEP8G_PARENT_VERSION,
        parentCorpusVersion: null,
        recipeCount: parent.recipeCount,
        manifestSha256: parent.manifestSha256,
        sourceCohortId: parent.source?.sourceCohortId || null
      },
      {
        corpusVersion: STEP8G_FORKRECIPE_LAYER_VERSION,
        parentCorpusVersion: STEP8G_PARENT_VERSION,
        recipeCount: layerRows,
        manifestSha256: layerPlan.manifest.manifestSha256,
        sourceCohortId: FORKRECIPE_STEP7E_SOURCE_ID
      }
    ],
    cumulativeRecipeCount,
    routeIndexSha256: routeIndex.routeIndexSha256,
    routing: {
      shardCount: STEP8G_SHARD_COUNT,
      mode: "CONTROL_INDEX_EXACT_ROUTE_THEN_BATCH_HYDRATE_BY_SHARD",
      fullCorpusScans: 0,
      maxHydratedCandidates: STEP8G_MAX_HYDRATED_CANDIDATES,
      maxProtectedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES
    },
    capacity: {
      parentBodyBytes: parentBytes,
      newLayerBodyBytes: layerBytes,
      layeredPhysicalBodyBytes,
      naiveImmutableSnapshotBodyBytes,
      avoidedDuplicateParentRows: parent.recipeCount,
      avoidedDuplicateParentBodyBytes: parentBytes,
      cumulativeBodyBytesWithinProjectTotalBudget: layeredPhysicalBodyBytes <= STEP8G_MAX_TOTAL_BYTES,
      perShard
    },
    invariants: {
      immutableParentRowsRewritten: false,
      newLayerWritesOnly: true,
      thirdShardUsed: false,
      publicRuntimeChanged: false,
      publicRuntimeActivationAuthorized: false,
      recommendationAdmissionAuthorized: false,
      billingExpansionAuthorized: false,
      sourceNutritionImportedAsAuthority: false,
      sourceDietaryAllergenInferenceAuthorized: false,
      sourceRatioPromotionAuthorized: false,
      knowledgeCoreWriteAuthorized: false
    }
  };
  return { ...core, compositionSha256: sha256(JSON.stringify(core)) };
}

export function buildStep8GForkRecipePrewrite({ forkEntries, publicTitles = [], parentManifest } = {}) {
  const parent = requireParentManifest(parentManifest);
  if (!Array.isArray(forkEntries) || forkEntries.length !== FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT) {
    throw new Error(`Step 8G requires exactly ${FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT} ForkRecipe entries`);
  }
  const audit = buildForkRecipeStep7ePilot(forkEntries, {
    commit: FORKRECIPE_STEP7E_EXPECTED_COMMIT,
    sourceRightsVerified: true,
    publicTitles
  });
  if (!audit.pass) throw new Error("Step 8G ForkRecipe source audit must pass before prewrite planning");

  const packets = [...audit.packets].sort((a, b) => a.sourceItemId.localeCompare(b.sourceItemId));
  const bodies = packets.map((packet, ordinal) => {
    const bodyJson = JSON.stringify(packet);
    return {
      ordinal,
      recipeId: packet.canonicalRecipeId,
      sourceCohortId: FORKRECIPE_STEP7E_SOURCE_ID,
      bodyJson,
      bodySha256: sha256(bodyJson),
      bodyBytes: bytes(bodyJson)
    };
  });
  const bodyById = new Map(bodies.map(row => [row.recipeId, row]));

  const layerPlan = buildStep8APopulationPlan({
    corpusVersion: STEP8G_FORKRECIPE_LAYER_VERSION,
    parentCorpusVersion: STEP8G_PARENT_VERSION,
    sourceCohorts: [{
      id: FORKRECIPE_STEP7E_SOURCE_ID,
      sourceName: "ForkRecipe open recipe dataset",
      sourceVersion: `${FORKRECIPE_STEP7E_EXPECTED_COMMIT}`,
      admissionState: "STEP_8G_FORKRECIPE_MEASUREMENT_EARNED_COHORT_CANDIDATE",
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        `https://github.com/${FORKRECIPE_STEP7E_SOURCE_REPO}/tree/${FORKRECIPE_STEP7E_EXPECTED_COMMIT}`,
        `https://creativecommons.org/licenses/by-sa/4.0/`,
        "docs/CORPUS_SCALE_STEP8G_PROTECTED_SCALE_LOOP.md"
      ]
    }],
    entries: bodies.map(({ bodyJson, ...descriptor }) => descriptor),
    recipeShardCount: STEP8G_SHARD_COUNT,
    rowsPerWriteBatch: STEP8G_MAX_ROWS_PER_WRITE_BATCH
  });

  const batches = layerPlan.batches.map(batch => ({
    ...batch,
    entries: batch.entries.map(entry => ({ ...entry, bodyJson: bodyById.get(entry.recipeId).bodyJson }))
  }));
  const layerPlanWithBodies = { ...layerPlan, batches };
  const routeIndex = buildStep8GRouteIndex({ parentManifest: parent, layerPlan });
  const composition = buildStep8GComposition({ parentManifest: parent, layerPlan, routeIndex });
  const maxBodyBytes = Math.max(...bodies.map(row => row.bodyBytes));
  const maxBatchBodyBytes = Math.max(...batches.map(batch => batch.totalBodyBytes));
  const allRouteIds = routeIndex.routes.map(route => route.recipeId);
  const hydrationProbeIds = [
    parent.entries[0].recipeId,
    parent.entries.at(-1).recipeId,
    bodies[0].recipeId,
    bodies.at(-1).recipeId
  ];
  const hydrationProbe = planStep8GProtectedHydration(routeIndex, hydrationProbeIds);

  const pass = composition.capacity.cumulativeBodyBytesWithinProjectTotalBudget
    && composition.capacity.perShard.every(row => row.withinProjectDatabaseBudget)
    && maxBodyBytes < 2 * 1024 * 1024
    && batches.every(batch => batch.rowCount <= STEP8G_MAX_ROWS_PER_WRITE_BATCH)
    && hydrationProbe.pass
    && hydrationProbe.fullCorpusScans === 0
    && allRouteIds.length === new Set(allRouteIds).size;

  return {
    schema: STEP8G_PREWRITE_SCHEMA,
    pass,
    terminalCandidate: pass
      ? "STEP_8G_FORKRECIPE_LAYER_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_PENDING"
      : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
    source: {
      repository: FORKRECIPE_STEP7E_SOURCE_REPO,
      commit: FORKRECIPE_STEP7E_EXPECTED_COMMIT,
      recordCount: packets.length,
      licenseId: FORKRECIPE_STEP7E_LICENSE,
      licenseUrl: FORKRECIPE_STEP7E_LICENSE_URL,
      rightsAuditPass: audit.pass
    },
    parent: {
      corpusVersion: parent.corpusVersion,
      recipeCount: parent.recipeCount,
      manifestSha256: parent.manifestSha256
    },
    layer: {
      corpusVersion: layerPlan.manifest.corpusVersion,
      parentCorpusVersion: layerPlan.manifest.parentCorpusVersion,
      recipeCount: layerPlan.manifest.recipeCount,
      manifestSha256: layerPlan.manifest.manifestSha256,
      populationPlanSha256: layerPlan.populationPlanSha256,
      batchCount: batches.length,
      maxRowsPerBatch: Math.max(...batches.map(batch => batch.rowCount)),
      maxBodyBytes,
      maxBatchBodyBytes,
      shardDescriptors: layerPlan.manifest.recipeBodyShards.descriptors
    },
    composition,
    hydrationProbe,
    boundaries: {
      liveD1WritesPerformed: 0,
      publicRuntimeChanged: false,
      recommendationAdmissionPerformed: false,
      thirdShardUsed: false,
      billingExpansion: false,
      nutritionLaneModified: false,
      youtubeCulinaryStateModified: false,
      knowledgeCoreWritePerformed: false
    },
    routeIndex,
    layerPlan: layerPlanWithBodies
  };
}
