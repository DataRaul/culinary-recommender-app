import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { STEP8G_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/runtime-descriptor.mjs";
import {
  STEP8G_EXPECTED_RECIPE_COUNT,
  STEP8G_EXPECTED_ROUTE_COUNT,
  STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
  expectedStep8GBodyBatchIds,
  expectedStep8GRouteBatchIds,
  materializeStep8GIncomingBodyBatch,
  publicStep8GLiveSummary
} from "../src/server/step8g-live-runtime.mjs";
import {
  STEP8G_D1_MAX_BOUND_PARAMETERS,
  STEP8G_MAX_HYDRATION_D1_SUBQUERIES,
  step8gHydrationQueryBudget
} from "../src/server/step8g-hydration-runtime.mjs";
import {
  FORKRECIPE_STEP7E_EXPECTED_COMMIT,
  FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT
} from "./forkrecipe-step7e-core.mjs";
import { buildStep8GForkRecipePrewrite } from "./corpus-scale-step8g-population-core.mjs";

const MAX_REQUEST_BYTES = 256 * 1024;
const outputDir = resolve(process.env.STEP8G_LIVE_PREFLIGHT_ARTIFACT_DIR || "artifacts/step8g-live-preflight");

function parseArgs(argv) {
  const options = { forkrecipe: null, parentManifest: "data/generated/step8d/manifest.json" };
  for (const arg of argv) {
    if (arg.startsWith("--forkrecipe=")) options.forkrecipe = arg.slice("--forkrecipe=".length);
    else if (arg.startsWith("--parent-manifest=")) options.parentManifest = arg.slice("--parent-manifest=".length);
  }
  if (!options.forkrecipe) throw new Error("--forkrecipe=<checked-out pinned source> is required");
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function loadForkEntries(sourceRoot) {
  const recipesDir = resolve(sourceRoot, "recipes");
  const files = (await readdir(recipesDir))
    .filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js")
    .sort();
  const entries = [];
  for (const fileName of files) {
    const mod = await import(pathToFileURL(resolve(recipesDir, fileName)).href);
    entries.push({ fileName, recipe: mod.default });
  }
  return entries;
}

function canonicalIdFor(entry) {
  return `forkrecipe_${String(entry.recipe?.slug || "").replace(/-/g, "_")}`;
}

function routeBatchPlan(routes) {
  const batches = [];
  for (const corpusVersion of ["v8001", "v8002"]) {
    for (const shardNumber of [0, 1]) {
      const rows = routes
        .filter(route => route.corpusVersion === corpusVersion && Number(route.shardNumber) === shardNumber)
        .sort((a, b) => a.recipeId.localeCompare(b.recipeId));
      for (let offset = 0, batchNumber = 0; offset < rows.length; offset += 10, batchNumber += 1) {
        batches.push({
          batchId: `route-${corpusVersion}-s${String(shardNumber).padStart(2, "0")}-b${String(batchNumber).padStart(6, "0")}`,
          entries: rows.slice(offset, offset + 10)
        });
      }
    }
  }
  return batches;
}

const args = parseArgs(process.argv.slice(2));
const sourceRoot = resolve(args.forkrecipe);
if (commitAt(sourceRoot) !== FORKRECIPE_STEP7E_EXPECTED_COMMIT) throw new Error("FORKRECIPE_PIN_MISMATCH");

const [forkEntries, parentManifest] = await Promise.all([
  loadForkEntries(sourceRoot),
  readFile(resolve(args.parentManifest), "utf8").then(JSON.parse)
]);
if (forkEntries.length !== FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT) throw new Error("FORKRECIPE_COUNT_MISMATCH");

const publicTitles = ALL_RECIPES.map(recipe => recipe.identity?.canonicalTitle || recipe.title || recipe.id);
const prewrite = buildStep8GForkRecipePrewrite({ forkEntries, publicTitles, parentManifest });
if (!prewrite.pass) throw new Error("STEP8G_PREWRITE_REGENERATION_FAILED");

const summary = publicStep8GLiveSummary();
const fingerprintsPass = summary.layerManifestSha256 === prewrite.layer.manifestSha256
  && summary.populationPlanSha256 === prewrite.layer.populationPlanSha256
  && summary.routeIndexSha256 === prewrite.routeIndex.routeIndexSha256
  && summary.compositionSha256 === prewrite.composition.compositionSha256
  && summary.parentManifestSha256 === prewrite.parent.manifestSha256
  && STEP8G_RUNTIME_DESCRIPTOR.sourceCommit === FORKRECIPE_STEP7E_EXPECTED_COMMIT;
if (!fingerprintsPass) throw new Error("STEP8G_RUNTIME_FINGERPRINT_MISMATCH");

const sourceByCanonicalId = new Map(forkEntries.map(entry => [canonicalIdFor(entry), entry]));
let maxBodyRequestBytes = 0;
let maxBodyRows = 0;
const bodyEvidence = [];
for (const frozenBatch of prewrite.layerPlan.batches) {
  const sourceEntries = frozenBatch.entries.map(descriptor => {
    const source = sourceByCanonicalId.get(descriptor.recipeId);
    if (!source) throw new Error(`MISSING_SOURCE_FOR_${descriptor.recipeId}`);
    return { ordinal: descriptor.ordinal, fileName: source.fileName, recipe: source.recipe };
  });
  const materialized = await materializeStep8GIncomingBodyBatch({
    batchId: frozenBatch.batchId,
    sourceEntries
  });
  if (!materialized.pass) throw new Error(`LIVE_TRANSFORMER_REJECTED_${frozenBatch.batchId}_${materialized.reason}`);
  if (materialized.batch.entries.length !== frozenBatch.entries.length) throw new Error("LIVE_TRANSFORMER_ROW_COUNT_DRIFT");
  for (let index = 0; index < frozenBatch.entries.length; index += 1) {
    const expected = frozenBatch.entries[index];
    const actual = materialized.batch.entries[index];
    if (actual.ordinal !== expected.ordinal
      || actual.recipeId !== expected.recipeId
      || actual.bodySha256 !== expected.bodySha256
      || actual.bodyBytes !== expected.bodyBytes
      || actual.sourceCohortId !== expected.sourceCohortId) {
      throw new Error(`LIVE_TRANSFORMER_DESCRIPTOR_DRIFT_${expected.recipeId}`);
    }
  }
  const requestBytes = Buffer.byteLength(JSON.stringify({
    action: "write-body",
    batch: { batchId: frozenBatch.batchId, sourceEntries }
  }), "utf8");
  maxBodyRequestBytes = Math.max(maxBodyRequestBytes, requestBytes);
  maxBodyRows = Math.max(maxBodyRows, sourceEntries.length);
  if (requestBytes > MAX_REQUEST_BYTES) throw new Error(`BODY_REQUEST_TOO_LARGE_${frozenBatch.batchId}`);
  bodyEvidence.push({ batchId: frozenBatch.batchId, rowCount: sourceEntries.length, requestBytes });
}

const runtimeBodyBatchIds = expectedStep8GBodyBatchIds();
const regeneratedBodyBatchIds = prewrite.layerPlan.batches.map(batch => batch.batchId);
if (JSON.stringify(runtimeBodyBatchIds) !== JSON.stringify(regeneratedBodyBatchIds)) throw new Error("BODY_BATCH_ID_DRIFT");

const routeBatches = routeBatchPlan(prewrite.routeIndex.routes);
const runtimeRouteBatchIds = expectedStep8GRouteBatchIds();
if (JSON.stringify(runtimeRouteBatchIds) !== JSON.stringify(routeBatches.map(batch => batch.batchId))) throw new Error("ROUTE_BATCH_ID_DRIFT");
const routeRows = routeBatches.reduce((sum, batch) => sum + batch.entries.length, 0);
if (routeRows !== STEP8G_EXPECTED_ROUTE_COUNT) throw new Error("ROUTE_ROW_COUNT_DRIFT");
const maxRouteRequestBytes = Math.max(...routeBatches.map(batch => Buffer.byteLength(JSON.stringify({
  action: "write-route",
  batchId: batch.batchId,
  entries: batch.entries
}), "utf8")));
if (maxRouteRequestBytes > MAX_REQUEST_BYTES) throw new Error("ROUTE_REQUEST_TOO_LARGE");

const maxBodyWriteD1Subqueries = 1 + 1 + (maxBodyRows + 1) + 1 + 1;
const maxRouteWriteD1Subqueries = 1 + 1 + 1 + (10 + 1) + 1 + 1;
let worstHydration = null;
for (let shard0 = 0; shard0 <= 256; shard0 += 1) {
  const shard1 = 256 - shard0;
  const budget = step8gHydrationQueryBudget(256, [shard0, shard1]);
  if (!worstHydration || budget.d1Subqueries > worstHydration.d1Subqueries) worstHydration = { shard0, shard1, ...budget };
}
if (maxBodyWriteD1Subqueries > STEP8G_MAX_PROTECTED_D1_SUBQUERIES) throw new Error("BODY_D1_BUDGET_EXCEEDED");
if (maxRouteWriteD1Subqueries > STEP8G_MAX_PROTECTED_D1_SUBQUERIES) throw new Error("ROUTE_D1_BUDGET_EXCEEDED");
if (worstHydration.d1Subqueries > STEP8G_MAX_HYDRATION_D1_SUBQUERIES
  || worstHydration.d1Subqueries > STEP8G_MAX_PROTECTED_D1_SUBQUERIES) throw new Error("HYDRATION_D1_BUDGET_EXCEEDED");

const projectedFirstPopulationRowWrites = STEP8G_EXPECTED_RECIPE_COUNT
  + (runtimeBodyBatchIds.length * 2)
  + STEP8G_EXPECTED_ROUTE_COUNT
  + (runtimeRouteBatchIds.length * 2)
  + 3;

const evidence = {
  contractVersion: "CORPUS_SCALE_STEP8G_LIVE_PREFLIGHT_V1",
  pass: true,
  source: {
    repository: "futurechef/forkrecipe-recipes",
    commit: FORKRECIPE_STEP7E_EXPECTED_COMMIT,
    recipeCount: forkEntries.length
  },
  fingerprints: {
    pass: fingerprintsPass,
    layerManifestSha256: summary.layerManifestSha256,
    populationPlanSha256: summary.populationPlanSha256,
    routeIndexSha256: summary.routeIndexSha256,
    compositionSha256: summary.compositionSha256,
    parentManifestSha256: summary.parentManifestSha256
  },
  bodyPayloads: {
    recipeCount: STEP8G_EXPECTED_RECIPE_COUNT,
    batchCount: runtimeBodyBatchIds.length,
    maxRowsPerBatch: maxBodyRows,
    maxRequestBytes: maxBodyRequestBytes,
    requestLimitBytes: MAX_REQUEST_BYTES,
    exactLiveTransformerMatchesFrozenPrewrite: true,
    maxWriteD1SubqueriesIncludingAuth: maxBodyWriteD1Subqueries
  },
  routePayloads: {
    routeCount: routeRows,
    batchCount: runtimeRouteBatchIds.length,
    maxRowsPerBatch: 10,
    maxRequestBytes: maxRouteRequestBytes,
    requestLimitBytes: MAX_REQUEST_BYTES,
    maxWriteD1SubqueriesIncludingAuth: maxRouteWriteD1Subqueries
  },
  hydration: {
    maxCandidates: 256,
    d1BoundParameterLimit: STEP8G_D1_MAX_BOUND_PARAMETERS,
    worstCase: worstHydration,
    maxD1SubqueriesIncludingAuth: STEP8G_MAX_HYDRATION_D1_SUBQUERIES,
    fullCorpusScans: 0
  },
  freePlanSafety: {
    projectedFirstPopulationRowWrites,
    billingExpansionAuthorized: false,
    freeLimitFailurePolicy: "FAIL_CLOSED_NO_AUTOMATIC_UPGRADE_OR_OVERAGE"
  },
  boundaries: {
    liveD1WritesPerformed: 0,
    publicRuntimeChanged: false,
    recommendationAdmissionChanged: false,
    thirdShardUsed: false,
    billingExpansion: false,
    nutritionLaneModified: false,
    knowledgeCoreWritePerformed: false
  }
};

await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await writeFile(resolve(outputDir, "body-batches.json"), `${JSON.stringify(bodyEvidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify(evidence, null, 2));
