import { performance } from "node:perf_hooks";
import { gzipSync } from "node:zlib";

import {
  CORPUS_SCALE_ACCEPTANCE,
  CORPUS_SCALE_QUERY_CAP,
  CORPUS_SCALE_TARGETS,
  benchmarkQueryScenarios,
  indexKeysForRecipe,
  intersectPostings,
  syntheticRecipeFromGolden
} from "./corpus-scale-step1-core.mjs";
import { PORTABLE_CORPUS_CONTRACT_VERSION } from "./corpus-scale-step3-core.mjs";

export const STEP4_RETRIEVAL_ACCEPTANCE = Object.freeze({
  maxIndexObjectReadsPerQuery: 4,
  maxDetailObjectReadsPerQuery: CORPUS_SCALE_QUERY_CAP,
  maxBackendObjectReadsPerQuery: CORPUS_SCALE_QUERY_CAP + 4,
  maxBrowserWorkerRequestsPerQuery: 1,
  maxBackendReadGzipBytesPerQuery: CORPUS_SCALE_ACCEPTANCE.maxTransferGzipBytesPerQuery,
  maxWorkerResponseGzipBytesPerQuery: CORPUS_SCALE_ACCEPTANCE.maxTransferGzipBytesPerQuery,
  maxRetrievalP95Ms: CORPUS_SCALE_ACCEPTANCE.maxRetrievalP95Ms,
  maxRankP95Ms: CORPUS_SCALE_ACCEPTANCE.maxRankP95Ms,
  maxBuildMsAt100k: CORPUS_SCALE_ACCEPTANCE.maxBuildMsAt100k,
  maxRssBytesAt100k: CORPUS_SCALE_ACCEPTANCE.maxRssBytesAt100k,
  maxHeapUsedBytesAt100k: CORPUS_SCALE_ACCEPTANCE.maxHeapUsedBytesAt100k
});

const bytes = value => Buffer.byteLength(value, "utf8");
const rounded = value => Number(value.toFixed(3));
const gzipBytes = value => gzipSync(value).byteLength;

function percentile(values, ratio) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const index = Math.min(ordered.length - 1, Math.max(0, Math.ceil(ordered.length * ratio) - 1));
  return ordered[index];
}

function memorySnapshot() {
  const usage = process.memoryUsage();
  return { rssBytes: usage.rss, heapUsedBytes: usage.heapUsed };
}

function updatePeak(peak, current = memorySnapshot()) {
  peak.rssBytes = Math.max(peak.rssBytes, current.rssBytes);
  peak.heapUsedBytes = Math.max(peak.heapUsedBytes, current.heapUsedBytes);
}

function assertVersion(version) {
  if (!/^v[0-9]{4,}$/.test(version)) throw new Error("corpus version must match vNNNN or wider numeric form");
}

function assertGoldenRecipes(goldenRecipes) {
  if (!Array.isArray(goldenRecipes) || goldenRecipes.length === 0) {
    throw new Error("goldenRecipes must contain at least one recipe");
  }
}

function assertTargetSize(targetSize) {
  if (!Number.isInteger(targetSize) || targetSize <= 0) throw new Error("targetSize must be a positive integer");
}

export function portableIndexPathForKey(key) {
  const separator = String(key).indexOf(":");
  if (separator <= 0 || separator === String(key).length - 1) throw new Error(`invalid index key: ${key}`);
  const dimension = String(key).slice(0, separator);
  const value = String(key).slice(separator + 1);
  if (!/^[a-z0-9-]+$/.test(dimension) || !/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`index key is not portable: ${key}`);
  }
  return `indexes/${dimension}/${value}.json`;
}

export function portableDetailPathForOrdinal(ordinal, recipeCount) {
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= recipeCount) throw new Error(`invalid recipe ordinal: ${ordinal}`);
  const width = Math.max(6, String(recipeCount - 1).length);
  return `recipes/${String(ordinal).padStart(width, "0")}.json`;
}

function recipeForOrdinal(model, ordinal) {
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= model.targetSize) throw new Error(`invalid recipe ordinal: ${ordinal}`);
  if (model.synthetic) return syntheticRecipeFromGolden(model.goldenRecipes[ordinal % model.goldenRecipes.length], ordinal);
  return model.goldenRecipes[ordinal];
}

export function readPortableDetailObject(model, ordinal) {
  return JSON.stringify(recipeForOrdinal(model, ordinal));
}

export function readPortableIndexObject(model, key) {
  const object = model.indexObjects.get(key);
  if (!object) throw new Error(`missing index object: ${key}`);
  return object.content;
}

export function buildStep4RetrievalModel(goldenRecipes, targetSize, options = {}) {
  assertGoldenRecipes(goldenRecipes);
  assertTargetSize(targetSize);
  const synthetic = options.synthetic !== false;
  if (!synthetic && targetSize > goldenRecipes.length) throw new Error("non-synthetic model cannot exceed supplied recipe count");

  const corpusVersion = options.version || `v${String(targetSize).padStart(6, "0")}`;
  assertVersion(corpusVersion);
  const sampleEvery = Math.max(1, Number(options.memorySampleEvery) || 1_000);
  const startedAt = performance.now();
  const indexes = new Map();
  const peakMemory = memorySnapshot();

  for (let ordinal = 0; ordinal < targetSize; ordinal += 1) {
    const recipe = synthetic
      ? syntheticRecipeFromGolden(goldenRecipes[ordinal % goldenRecipes.length], ordinal)
      : goldenRecipes[ordinal];
    if (!recipe || typeof recipe.id !== "string" || !recipe.id.trim()) throw new Error(`recipe at ordinal ${ordinal} lacks a non-empty string id`);

    for (const key of indexKeysForRecipe(recipe)) {
      const postings = indexes.get(key) || [];
      postings.push(ordinal);
      indexes.set(key, postings);
    }
    if ((ordinal + 1) % sampleEvery === 0) updatePeak(peakMemory);
  }

  const indexObjects = new Map();
  let indexRawBytes = 0;
  let indexGzipBytes = 0;
  for (const [key, ordinals] of [...indexes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const content = JSON.stringify({
      contractVersion: PORTABLE_CORPUS_CONTRACT_VERSION,
      corpusVersion,
      key,
      count: ordinals.length,
      ordinals
    });
    const raw = bytes(content);
    const gzip = gzipBytes(content);
    indexRawBytes += raw;
    indexGzipBytes += gzip;
    indexObjects.set(key, {
      path: portableIndexPathForKey(key),
      content,
      rawBytes: raw,
      gzipBytes: gzip,
      count: ordinals.length
    });
  }
  updatePeak(peakMemory);

  return {
    contractVersion: PORTABLE_CORPUS_CONTRACT_VERSION,
    corpusVersion,
    targetSize,
    ordinalWidth: Math.max(6, String(targetSize - 1).length),
    synthetic,
    goldenRecipes,
    indexes,
    indexObjects,
    detailStrategy: synthetic ? "DETERMINISTIC_SYNTHETIC_DETAIL_ON_READ" : "CANONICAL_GOLDEN_DETAIL_ON_READ",
    metrics: {
      buildMs: rounded(performance.now() - startedAt),
      indexKeyCount: indexObjects.size,
      indexRawBytes,
      indexGzipBytes,
      peakMemory
    }
  };
}

export function executeStep4PortableQuery(model, scenario, options = {}) {
  const queryCap = Math.max(1, Number(options.queryCap) || CORPUS_SCALE_QUERY_CAP);
  const measureBytes = options.measureBytes === true;
  const keys = [...new Set(scenario.keys || [])];
  if (!keys.length) throw new Error("query scenario requires at least one index key");

  const fetchedIndexes = new Map();
  let indexReadRawBytes = 0;
  let indexReadGzipBytes = 0;

  for (const key of keys) {
    const object = model.indexObjects.get(key);
    if (!object) throw new Error(`query references missing index key: ${key}`);
    const payload = JSON.parse(object.content);
    if (payload.key !== key || payload.count !== payload.ordinals.length) throw new Error(`invalid index payload for ${key}`);
    fetchedIndexes.set(key, payload.ordinals);
    if (measureBytes) {
      indexReadRawBytes += object.rawBytes;
      indexReadGzipBytes += object.gzipBytes;
    }
  }

  const allOrdinals = intersectPostings(fetchedIndexes, keys);
  const boundedOrdinals = allOrdinals.slice(0, queryCap);
  const recipes = [];
  let detailReadRawBytes = 0;
  let detailReadGzipBytes = 0;

  for (const ordinal of boundedOrdinals) {
    const content = readPortableDetailObject(model, ordinal);
    const recipe = JSON.parse(content);
    recipes.push(recipe);
    if (measureBytes) {
      detailReadRawBytes += bytes(content);
      detailReadGzipBytes += gzipBytes(content);
    }
  }

  const workerResponse = JSON.stringify(recipes);
  const workerResponseRawBytes = measureBytes ? bytes(workerResponse) : 0;
  const workerResponseGzipBytes = measureBytes ? gzipBytes(workerResponse) : 0;
  updatePeak(model.metrics.peakMemory);

  return {
    recipes,
    fullCandidateCount: allOrdinals.length,
    boundedCandidateCount: boundedOrdinals.length,
    objectReads: {
      browserWorkerRequests: 1,
      metadataObjectReads: 0,
      indexObjectReads: keys.length,
      detailObjectReads: boundedOrdinals.length,
      backendObjectReads: keys.length + boundedOrdinals.length
    },
    transfer: {
      indexReadRawBytes,
      indexReadGzipBytes,
      detailReadRawBytes,
      detailReadGzipBytes,
      backendReadRawBytes: indexReadRawBytes + detailReadRawBytes,
      backendReadGzipBytes: indexReadGzipBytes + detailReadGzipBytes,
      workerResponseRawBytes,
      workerResponseGzipBytes
    }
  };
}

export function benchmarkStep4Queries(model, rankCandidateRecipes, options = {}) {
  const repetitions = Math.max(1, Number(options.repetitions) || 12);
  const queryCap = Math.max(1, Number(options.queryCap) || CORPUS_SCALE_QUERY_CAP);
  const scenarios = options.scenarios || benchmarkQueryScenarios(model.indexes);
  const results = [];

  for (const scenario of scenarios) {
    const retrievalSamples = [];
    const rankSamples = [];
    let measured = null;
    let rankedCount = 0;

    for (let repetition = 0; repetition < repetitions + 1; repetition += 1) {
      const retrievalStartedAt = performance.now();
      const queryResult = executeStep4PortableQuery(model, scenario, {
        queryCap,
        measureBytes: repetition === 0
      });
      const retrievalMs = performance.now() - retrievalStartedAt;

      const rankStartedAt = performance.now();
      const ranked = rankCandidateRecipes(queryResult.recipes, scenario);
      const rankMs = performance.now() - rankStartedAt;
      rankedCount = Array.isArray(ranked)
        ? ranked.length
        : Number(ranked?.eligible?.length || 0) + Number(ranked?.rejected?.length || 0);

      if (repetition === 0) measured = queryResult;
      else {
        retrievalSamples.push(retrievalMs);
        rankSamples.push(rankMs);
      }
    }

    results.push({
      name: scenario.name,
      keys: [...scenario.keys],
      fullCandidateCount: measured.fullCandidateCount,
      boundedCandidateCount: measured.boundedCandidateCount,
      rankedCount,
      objectReads: measured.objectReads,
      transfer: measured.transfer,
      retrievalP50Ms: rounded(percentile(retrievalSamples, 0.5)),
      retrievalP95Ms: rounded(percentile(retrievalSamples, 0.95)),
      rankP50Ms: rounded(percentile(rankSamples, 0.5)),
      rankP95Ms: rounded(percentile(rankSamples, 0.95))
    });
  }
  return results;
}

function check(id, observed, threshold, pass) {
  return { id, observed, threshold, pass: Boolean(pass) };
}

export function evaluateStep4Acceptance(model, queryResults, thresholds = STEP4_RETRIEVAL_ACCEPTANCE) {
  const checks = [];
  checks.push(check("queryScenarioCount", queryResults.length, ">=1", queryResults.length > 0));

  for (const result of queryResults) {
    const prefix = result.name;
    checks.push(check(`${prefix}.boundedCandidateCount`, result.boundedCandidateCount, CORPUS_SCALE_QUERY_CAP, result.boundedCandidateCount <= CORPUS_SCALE_QUERY_CAP));
    checks.push(check(`${prefix}.browserWorkerRequests`, result.objectReads.browserWorkerRequests, thresholds.maxBrowserWorkerRequestsPerQuery, result.objectReads.browserWorkerRequests <= thresholds.maxBrowserWorkerRequestsPerQuery));
    checks.push(check(`${prefix}.metadataObjectReads`, result.objectReads.metadataObjectReads, 0, result.objectReads.metadataObjectReads === 0));
    checks.push(check(`${prefix}.indexObjectReads`, result.objectReads.indexObjectReads, thresholds.maxIndexObjectReadsPerQuery, result.objectReads.indexObjectReads <= thresholds.maxIndexObjectReadsPerQuery));
    checks.push(check(`${prefix}.detailObjectReads`, result.objectReads.detailObjectReads, thresholds.maxDetailObjectReadsPerQuery, result.objectReads.detailObjectReads <= thresholds.maxDetailObjectReadsPerQuery));
    checks.push(check(`${prefix}.backendObjectReads`, result.objectReads.backendObjectReads, thresholds.maxBackendObjectReadsPerQuery, result.objectReads.backendObjectReads <= thresholds.maxBackendObjectReadsPerQuery));
    checks.push(check(`${prefix}.backendReadGzipBytes`, result.transfer.backendReadGzipBytes, thresholds.maxBackendReadGzipBytesPerQuery, result.transfer.backendReadGzipBytes <= thresholds.maxBackendReadGzipBytesPerQuery));
    checks.push(check(`${prefix}.workerResponseGzipBytes`, result.transfer.workerResponseGzipBytes, thresholds.maxWorkerResponseGzipBytesPerQuery, result.transfer.workerResponseGzipBytes <= thresholds.maxWorkerResponseGzipBytesPerQuery));
    checks.push(check(`${prefix}.retrievalP95Ms`, result.retrievalP95Ms, thresholds.maxRetrievalP95Ms, result.retrievalP95Ms <= thresholds.maxRetrievalP95Ms));
    checks.push(check(`${prefix}.rankP95Ms`, result.rankP95Ms, thresholds.maxRankP95Ms, result.rankP95Ms <= thresholds.maxRankP95Ms));
  }

  if (model.targetSize === 100_000) {
    checks.push(check("100k.buildMs", model.metrics.buildMs, thresholds.maxBuildMsAt100k, model.metrics.buildMs <= thresholds.maxBuildMsAt100k));
    checks.push(check("100k.peakRssBytes", model.metrics.peakMemory.rssBytes, thresholds.maxRssBytesAt100k, model.metrics.peakMemory.rssBytes <= thresholds.maxRssBytesAt100k));
    checks.push(check("100k.peakHeapUsedBytes", model.metrics.peakMemory.heapUsedBytes, thresholds.maxHeapUsedBytesAt100k, model.metrics.peakMemory.heapUsedBytes <= thresholds.maxHeapUsedBytesAt100k));
  }

  const failed = checks.filter(item => !item.pass);
  return {
    pass: failed.length === 0,
    checks,
    failedCheckIds: failed.map(item => item.id),
    d1Decision: failed.length === 0
      ? "NOT_EARNED_R2_PREBUILT_INDEX_PATH_PASSES"
      : "REVIEW_ONLY_AFTER_RETRIEVAL_GATE_FAILURE__DO_NOT_AUTO_ADD_D1"
  };
}

export function runStep4Benchmark(goldenRecipes, rankCandidateRecipes, options = {}) {
  assertGoldenRecipes(goldenRecipes);
  const sizes = options.sizes || CORPUS_SCALE_TARGETS;
  const reports = [];

  for (const targetSize of sizes) {
    assertTargetSize(targetSize);
    if (typeof global.gc === "function") global.gc();
    const model = buildStep4RetrievalModel(goldenRecipes, targetSize, options);
    const queries = benchmarkStep4Queries(model, rankCandidateRecipes, options);
    const acceptance = evaluateStep4Acceptance(model, queries, options.thresholds || STEP4_RETRIEVAL_ACCEPTANCE);
    reports.push({
      targetSize,
      corpusVersion: model.corpusVersion,
      model: {
        detailStrategy: model.detailStrategy,
        ordinalWidth: model.ordinalWidth,
        ...model.metrics
      },
      queries,
      acceptance
    });
    model.indexes.clear();
    model.indexObjects.clear();
  }

  const pass = reports.every(report => report.acceptance.pass);
  return {
    contract: "CORPUS_SCALE_STEP4_INDEXED_RETRIEVAL_PROOF_V1",
    sizes: [...sizes],
    queryCap: Number(options.queryCap) || CORPUS_SCALE_QUERY_CAP,
    thresholds: options.thresholds || STEP4_RETRIEVAL_ACCEPTANCE,
    pass,
    d1Decision: pass
      ? "NOT_EARNED_R2_PREBUILT_INDEX_PATH_PASSES"
      : "REVIEW_ONLY_AFTER_RETRIEVAL_GATE_FAILURE__DO_NOT_AUTO_ADD_D1",
    reports
  };
}
