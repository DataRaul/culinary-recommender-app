import { createHash } from "node:crypto";

import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";
import {
  STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
  STEP8G_MAX_DATABASE_BYTES,
  STEP8G_MAX_TOTAL_BYTES,
  STEP8G_ROUTE_INDEX_SCHEMA,
  STEP8G_SHARD_COUNT,
  STEP8G_MAX_ROWS_PER_WRITE_BATCH,
  buildStep8GForkRecipePrewrite,
  planStep8GProtectedHydration
} from "./corpus-scale-step8g-population-core.mjs";

export const STEP8G_CC0_PREWRITE_SCHEMA = "CORPUS_SCALE_STEP8G_CC0_V8003_PREWRITE_V1";
export const STEP8G_CC0_LAYER_VERSION = "v8003";
export const STEP8G_CC0_PARENT_VERSION = "v8002";
export const STEP8G_CC0_SOURCE_ID = "SGAUTHIER_RECIPES_CC0_B12E481D";
export const STEP8G_CC0_SOURCE_REPO = "sylGauthier/recipes";
export const STEP8G_CC0_SOURCE_COMMIT = "b12e481d1c220a13e0847a34e148d5872a16928e";
export const STEP8G_CC0_EXPECTED_RECIPE_COUNT = 226;
export const STEP8G_CC0_MEASUREMENT_TERMINAL = "STEP_8G_CC0_MARKDOWN_MEASUREMENT_EARNED_COHORT_CANDIDATE";

const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(value).digest("hex");
const bytes = value => encoder.encode(String(value)).byteLength;

const slugFromFile = fileName => String(fileName || "")
  .replace(/\.md$/i, "")
  .normalize("NFKD")
  .replace(/\p{M}+/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

export function buildStep8GCc0BodyPackets(candidateEntries = []) {
  if (!Array.isArray(candidateEntries) || candidateEntries.length !== STEP8G_CC0_EXPECTED_RECIPE_COUNT) {
    throw new Error(`Step 8G CC0 prewrite requires exactly ${STEP8G_CC0_EXPECTED_RECIPE_COUNT} candidate entries`);
  }
  const seen = new Set();
  return [...candidateEntries]
    .sort((a, b) => String(a.fileName).localeCompare(String(b.fileName)))
    .map((entry, ordinal) => {
      const slug = slugFromFile(entry.fileName);
      if (!slug) throw new Error(`invalid CC0 source filename: ${entry.fileName}`);
      const canonicalRecipeId = `cc0_sgauthier_${slug}`;
      if (seen.has(canonicalRecipeId)) throw new Error(`duplicate CC0 recipe ID: ${canonicalRecipeId}`);
      seen.add(canonicalRecipeId);
      const rawMarkdown = String(entry.rawMarkdown ?? "");
      const parsed = entry.parsed || {};
      if (!rawMarkdown.trim()) throw new Error(`${entry.fileName}: raw markdown required`);
      if (!parsed.title) throw new Error(`${entry.fileName}: parsed title required`);
      const packet = {
        schema: "STEP8G_CC0_PROTECTED_SOURCE_PACKET_V1",
        canonicalRecipeId,
        source: {
          cohortId: STEP8G_CC0_SOURCE_ID,
          repository: STEP8G_CC0_SOURCE_REPO,
          commit: STEP8G_CC0_SOURCE_COMMIT,
          path: `src/${entry.fileName}`,
          sourceContentSha256: sha256(rawMarkdown),
          licenseId: "CC0-1.0"
        },
        sourceContent: {
          rawMarkdown,
          title: parsed.title,
          parsedIngredientsNonAuthoritative: parsed.ingredients || [],
          parsedDirectionsNonAuthoritative: parsed.directions || [],
          tagsNonAuthoritative: parsed.tags || []
        },
        authority: {
          recommendationAdmissionAuthorized: false,
          publicRuntimeActivationAuthorized: false,
          ingredientOntologyAuthority: false,
          nutritionAuthority: false,
          dietaryAllergenAuthority: false,
          scalingAuthority: false,
          knowledgeCoreWriteAuthorized: false
        }
      };
      const bodyJson = JSON.stringify(packet);
      return {
        ordinal,
        recipeId: canonicalRecipeId,
        sourceCohortId: STEP8G_CC0_SOURCE_ID,
        bodyJson,
        bodySha256: sha256(bodyJson),
        bodyBytes: bytes(bodyJson)
      };
    });
}

function layerRouteEntries(layerPlan) {
  return layerPlan.batches.flatMap(batch => batch.entries.map(entry => ({
    recipeId: String(entry.recipeId),
    corpusVersion: STEP8G_CC0_LAYER_VERSION,
    shardNumber: Number(batch.shardNumber),
    sourceCohortId: String(entry.sourceCohortId),
    bodySha256: String(entry.bodySha256),
    bodyBytes: Number(entry.bodyBytes)
  })));
}

export function appendStep8GRouteIndex({ baselineRouteIndex, layerPlan } = {}) {
  if (baselineRouteIndex?.schema !== STEP8G_ROUTE_INDEX_SCHEMA) throw new Error("valid Step 8G baseline route index required");
  if (baselineRouteIndex.activeCorpusVersion !== STEP8G_CC0_PARENT_VERSION) throw new Error("CC0 prewrite requires active v8002 baseline");
  if (baselineRouteIndex.routeCount !== 1416) throw new Error("CC0 prewrite requires exact 1,416-route v8002 baseline");
  if (layerPlan?.manifest?.corpusVersion !== STEP8G_CC0_LAYER_VERSION) throw new Error("CC0 layer version mismatch");
  if (layerPlan.manifest.parentCorpusVersion !== STEP8G_CC0_PARENT_VERSION) throw new Error("CC0 layer parent mismatch");
  if (layerPlan.manifest.recipeBodyShards?.shardCount !== STEP8G_SHARD_COUNT) throw new Error("CC0 layer must preserve two shards");

  const routes = [...baselineRouteIndex.routes, ...layerRouteEntries(layerPlan)]
    .sort((a, b) => a.recipeId.localeCompare(b.recipeId));
  for (let index = 1; index < routes.length; index += 1) {
    if (routes[index - 1].recipeId === routes[index].recipeId) {
      throw new Error(`Step 8G v8003 route index recipe ID collision: ${routes[index].recipeId}`);
    }
  }
  const core = {
    schema: STEP8G_ROUTE_INDEX_SCHEMA,
    activeCorpusVersion: STEP8G_CC0_LAYER_VERSION,
    parentCorpusVersion: STEP8G_CC0_PARENT_VERSION,
    routeCount: routes.length,
    shardCount: STEP8G_SHARD_COUNT,
    lookupKey: "recipe_id",
    hydrationKey: "corpus_version_plus_recipe_id",
    fullCorpusScanRequired: false,
    routes
  };
  return { ...core, routeIndexSha256: sha256(JSON.stringify(core)) };
}

function buildComposition({ baselinePrewrite, layerPlan, routeIndex }) {
  const baseline = baselinePrewrite.composition;
  if (baseline.activeCorpusVersion !== STEP8G_CC0_PARENT_VERSION || baseline.cumulativeRecipeCount !== 1416) {
    throw new Error("exact v8002 composition baseline required");
  }
  const layerRows = layerPlan.manifest.recipeCount;
  const layerBytes = layerPlan.manifest.recipeBodyShards.descriptors.reduce((sum, row) => sum + Number(row.totalBodyBytes || 0), 0);
  const cumulativeRecipeCount = baseline.cumulativeRecipeCount + layerRows;
  if (routeIndex.routeCount !== cumulativeRecipeCount) throw new Error("v8003 composition route count mismatch");

  const perShard = Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) => {
    const prior = baseline.capacity.perShard.find(row => Number(row.shardNumber) === shardNumber);
    const added = layerPlan.manifest.recipeBodyShards.descriptors.find(row => Number(row.shardNumber) === shardNumber);
    const rowCount = Number(prior?.rowCount || 0) + Number(added?.rowCount || 0);
    const totalBodyBytes = Number(prior?.totalBodyBytes || 0) + Number(added?.totalBodyBytes || 0);
    return {
      shardNumber,
      rowCount,
      totalBodyBytes,
      withinProjectDatabaseBudget: totalBodyBytes <= STEP8G_MAX_DATABASE_BYTES
    };
  });

  const priorPhysicalBodyBytes = Number(baseline.capacity.layeredPhysicalBodyBytes || 0);
  const layeredPhysicalBodyBytes = priorPhysicalBodyBytes + layerBytes;
  const core = {
    schema: "CORPUS_SCALE_STEP8G_LAYER_COMPOSITION_V2",
    activeCorpusVersion: STEP8G_CC0_LAYER_VERSION,
    parentCorpusVersion: STEP8G_CC0_PARENT_VERSION,
    layers: [
      ...baseline.layers,
      {
        corpusVersion: STEP8G_CC0_LAYER_VERSION,
        parentCorpusVersion: STEP8G_CC0_PARENT_VERSION,
        recipeCount: layerRows,
        manifestSha256: layerPlan.manifest.manifestSha256,
        sourceCohortId: STEP8G_CC0_SOURCE_ID
      }
    ],
    cumulativeRecipeCount,
    routeIndexSha256: routeIndex.routeIndexSha256,
    routing: {
      shardCount: STEP8G_SHARD_COUNT,
      mode: "CONTROL_INDEX_EXACT_ROUTE_THEN_BATCH_HYDRATE_BY_SHARD",
      fullCorpusScans: 0,
      maxHydratedCandidates: 256,
      maxProtectedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES
    },
    capacity: {
      priorProtectedBodyBytes: priorPhysicalBodyBytes,
      newLayerBodyBytes: layerBytes,
      layeredPhysicalBodyBytes,
      avoidedDuplicatePriorRows: baseline.cumulativeRecipeCount,
      avoidedDuplicatePriorBodyBytes: priorPhysicalBodyBytes,
      cumulativeBodyBytesWithinProjectTotalBudget: layeredPhysicalBodyBytes <= STEP8G_MAX_TOTAL_BYTES,
      perShard
    },
    invariants: {
      immutablePriorRowsRewritten: false,
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

export function buildStep8GCc0V8003Prewrite({
  candidateEntries,
  forkEntries,
  publicTitles = [],
  step8dParentManifest,
  measurementEvidence
} = {}) {
  if (measurementEvidence?.pass !== true || measurementEvidence?.terminal !== STEP8G_CC0_MEASUREMENT_TERMINAL) {
    throw new Error("earned CC0 measurement evidence required");
  }
  if (measurementEvidence?.sourcePins?.candidate?.commit !== STEP8G_CC0_SOURCE_COMMIT) {
    throw new Error("CC0 measurement/source pin mismatch");
  }
  if (measurementEvidence?.candidate?.sourceRecipeCount !== STEP8G_CC0_EXPECTED_RECIPE_COUNT) {
    throw new Error("CC0 measurement recipe-count mismatch");
  }

  const baselinePrewrite = buildStep8GForkRecipePrewrite({
    forkEntries,
    publicTitles,
    parentManifest: step8dParentManifest
  });
  if (!baselinePrewrite.pass) throw new Error("v8002 baseline reconstruction must pass");
  if (baselinePrewrite.composition.cumulativeRecipeCount !== 1416) throw new Error("v8002 baseline must contain 1,416 protected recipes");

  const bodies = buildStep8GCc0BodyPackets(candidateEntries);
  const bodyById = new Map(bodies.map(row => [row.recipeId, row]));
  const layerPlan = buildStep8APopulationPlan({
    corpusVersion: STEP8G_CC0_LAYER_VERSION,
    parentCorpusVersion: STEP8G_CC0_PARENT_VERSION,
    sourceCohorts: [{
      id: STEP8G_CC0_SOURCE_ID,
      sourceName: "sylGauthier recipes CC0 markdown corpus",
      sourceVersion: STEP8G_CC0_SOURCE_COMMIT,
      admissionState: STEP8G_CC0_MEASUREMENT_TERMINAL,
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        `https://github.com/${STEP8G_CC0_SOURCE_REPO}/tree/${STEP8G_CC0_SOURCE_COMMIT}`,
        `https://github.com/${STEP8G_CC0_SOURCE_REPO}/blob/${STEP8G_CC0_SOURCE_COMMIT}/LICENSE`,
        "data/generated/step8g/cc0-markdown-measurement.json"
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
  const routeIndex = appendStep8GRouteIndex({ baselineRouteIndex: baselinePrewrite.routeIndex, layerPlan });
  const composition = buildComposition({ baselinePrewrite, layerPlan, routeIndex });
  const maxBodyBytes = Math.max(...bodies.map(row => row.bodyBytes));
  const maxBatchBodyBytes = Math.max(...batches.map(batch => batch.totalBodyBytes));

  const v8001Route = routeIndex.routes.find(route => route.corpusVersion === "v8001");
  const v8002Route = routeIndex.routes.find(route => route.corpusVersion === "v8002");
  const v8003Routes = routeIndex.routes.filter(route => route.corpusVersion === "v8003");
  const hydrationProbe = planStep8GProtectedHydration(routeIndex, [
    v8001Route?.recipeId,
    v8002Route?.recipeId,
    v8003Routes[0]?.recipeId,
    v8003Routes.at(-1)?.recipeId
  ].filter(Boolean));

  const pass = routeIndex.routeCount === 1642
    && composition.cumulativeRecipeCount === 1642
    && composition.capacity.cumulativeBodyBytesWithinProjectTotalBudget
    && composition.capacity.perShard.every(row => row.withinProjectDatabaseBudget)
    && maxBodyBytes < 2 * 1024 * 1024
    && batches.every(batch => batch.rowCount <= STEP8G_MAX_ROWS_PER_WRITE_BATCH)
    && hydrationProbe.pass
    && hydrationProbe.fullCorpusScans === 0;

  return {
    schema: STEP8G_CC0_PREWRITE_SCHEMA,
    pass,
    terminalCandidate: pass
      ? "STEP_8G_CC0_V8003_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED"
      : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
    source: {
      repository: STEP8G_CC0_SOURCE_REPO,
      commit: STEP8G_CC0_SOURCE_COMMIT,
      recordCount: bodies.length,
      licenseId: "CC0-1.0",
      measurementTerminal: measurementEvidence.terminal
    },
    parent: {
      activeCorpusVersion: STEP8G_CC0_PARENT_VERSION,
      composedRecipeCount: baselinePrewrite.composition.cumulativeRecipeCount,
      routeIndexSha256: baselinePrewrite.routeIndex.routeIndexSha256,
      compositionSha256: baselinePrewrite.composition.compositionSha256
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
    routeIndex,
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
      knowledgeCoreWritePerformed: false,
      step8fRemainsParked: true
    },
    layerPlan: layerPlanWithBodies
  };
}
