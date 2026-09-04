import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { performance } from "node:perf_hooks";

export const CORPUS_SCALE_TARGETS = Object.freeze([1_000, 10_000, 50_000, 100_000]);
export const CORPUS_SCALE_QUERY_CAP = 256;

export const CORPUS_SCALE_ACCEPTANCE = Object.freeze({
  maxAverageRecipeBytes: 12 * 1024,
  maxP95RecipeBytes: 24 * 1024,
  maxIndexGzipBytesPerRecord: 768,
  maxTransferGzipBytesPerQuery: 2 * 1024 * 1024,
  maxRetrievalP95Ms: 25,
  maxRankP95Ms: 100,
  maxBuildMsAt100k: 60_000,
  maxValidationMsAt100k: 30_000,
  maxRssBytesAt100k: 1024 * 1024 * 1024,
  maxHeapUsedBytesAt100k: 768 * 1024 * 1024,
  maxBoundedCandidates: CORPUS_SCALE_QUERY_CAP
});

const percentile = (values, ratio) => {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const index = Math.min(ordered.length - 1, Math.max(0, Math.ceil(ordered.length * ratio) - 1));
  return ordered[index];
};

const rounded = value => Number(value.toFixed(3));
const bytes = value => Buffer.byteLength(value, "utf8");
const slug = value => String(value ?? "unknown").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";

function cloneRecipe(recipe) {
  return typeof structuredClone === "function"
    ? structuredClone(recipe)
    : JSON.parse(JSON.stringify(recipe));
}

export function fingerprintGoldenCorpus(goldenRecipes = []) {
  const ordered = [...goldenRecipes].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const idsSource = ordered.map(recipe => `${recipe.id}\n`).join("");
  const recordsSource = ordered.map(recipe => `${JSON.stringify(recipe)}\n`).join("");
  return {
    recipeCount: goldenRecipes.length,
    idsSha256: createHash("sha256").update(idsSource).digest("hex"),
    recordsSha256: createHash("sha256").update(recordsSource).digest("hex")
  };
}

export function syntheticRecipeFromGolden(goldenRecipe, ordinal) {
  const synthetic = cloneRecipe(goldenRecipe);
  const sourceId = goldenRecipe.id;
  synthetic.id = `scale_${String(ordinal + 1).padStart(6, "0")}_${sourceId}`;
  synthetic.provenance = {
    ...(synthetic.provenance || {}),
    benchmarkSynthetic: true,
    benchmarkSourceRecipeId: sourceId,
    benchmarkOrdinal: ordinal,
    benchmarkAdmissionState: "SYNTHETIC_ONLY_NEVER_PRODUCTION"
  };
  return synthetic;
}

export function indexKeysForRecipe(recipe) {
  const keys = new Set();
  for (const ingredient of recipe.ingredients || []) {
    if (ingredient?.canonicalIngredientId) keys.add(`ingredient:${slug(ingredient.canonicalIngredientId)}`);
  }
  if (recipe.culinary?.cuisine) keys.add(`cuisine:${slug(recipe.culinary.cuisine)}`);
  for (const tag of recipe.dietaryTags || []) keys.add(`diet:${slug(tag)}`);
  for (const mealType of recipe.culinary?.mealTypes || []) keys.add(`meal:${slug(mealType)}`);
  if (recipe.mainProtein) keys.add(`protein:${slug(recipe.mainProtein)}`);

  const totalMinutes = recipe.time?.totalMinutes;
  if (Number.isFinite(totalMinutes)) {
    if (totalMinutes <= 30) keys.add("time:under-30");
    if (totalMinutes <= 45) keys.add("time:under-45");
    if (totalMinutes <= 60) keys.add("time:under-60");
  }

  const difficulty = Number(recipe.culinary?.difficulty);
  if (Number.isFinite(difficulty)) {
    for (let limit = Math.max(1, Math.ceil(difficulty)); limit <= 4; limit += 1) {
      keys.add(`skill:lte-${limit}`);
    }
  }
  return [...keys].sort();
}

function memorySnapshot() {
  const usage = process.memoryUsage();
  return { rssBytes: usage.rss, heapUsedBytes: usage.heapUsed };
}

function updatePeak(peak, current) {
  peak.rssBytes = Math.max(peak.rssBytes, current.rssBytes);
  peak.heapUsedBytes = Math.max(peak.heapUsedBytes, current.heapUsedBytes);
}

function postingPayload(postings) {
  return JSON.stringify(postings);
}

function summarizeIndexBytes(indexes) {
  let rawBytes = 0;
  let gzipBytes = 0;
  for (const [key, postings] of [...indexes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const payload = JSON.stringify({ key, ordinals: postings });
    rawBytes += bytes(payload);
    gzipBytes += gzipSync(payload).byteLength;
  }
  return { rawBytes, gzipBytes };
}

export function buildSyntheticCatalogue(goldenRecipes, targetSize, options = {}) {
  if (!Array.isArray(goldenRecipes) || goldenRecipes.length === 0) throw new Error("goldenRecipes must contain at least one recipe");
  if (!Number.isInteger(targetSize) || targetSize <= 0) throw new Error("targetSize must be a positive integer");

  const sampleEvery = Math.max(1, Number(options.memorySampleEvery) || 1_000);
  const startedAt = performance.now();
  const objectBodies = new Array(targetSize);
  const ids = new Array(targetSize);
  const recordBytes = new Array(targetSize);
  const indexes = new Map();
  const peakMemory = memorySnapshot();
  let totalRecipeBytes = 0;
  let maxRecipeBytes = 0;

  for (let ordinal = 0; ordinal < targetSize; ordinal += 1) {
    const synthetic = syntheticRecipeFromGolden(goldenRecipes[ordinal % goldenRecipes.length], ordinal);
    const body = JSON.stringify(synthetic);
    const bodyBytes = bytes(body);
    objectBodies[ordinal] = body;
    ids[ordinal] = synthetic.id;
    recordBytes[ordinal] = bodyBytes;
    totalRecipeBytes += bodyBytes;
    maxRecipeBytes = Math.max(maxRecipeBytes, bodyBytes);

    for (const key of indexKeysForRecipe(synthetic)) {
      const postings = indexes.get(key) || [];
      postings.push(ordinal);
      indexes.set(key, postings);
    }

    if ((ordinal + 1) % sampleEvery === 0) updatePeak(peakMemory, memorySnapshot());
  }

  const indexBytes = summarizeIndexBytes(indexes);
  updatePeak(peakMemory, memorySnapshot());

  const buildMs = performance.now() - startedAt;
  return {
    targetSize,
    objectBodies,
    ids,
    indexes,
    goldenFingerprint: fingerprintGoldenCorpus(goldenRecipes),
    metrics: {
      buildMs: rounded(buildMs),
      totalRecipeBytes,
      averageRecipeBytes: Math.round(totalRecipeBytes / targetSize),
      p95RecipeBytes: percentile(recordBytes, 0.95),
      maxRecipeBytes,
      indexRawBytes: indexBytes.rawBytes,
      indexGzipBytes: indexBytes.gzipBytes,
      indexGzipBytesPerRecord: rounded(indexBytes.gzipBytes / targetSize),
      indexShardCount: indexes.size,
      peakMemory
    }
  };
}

function intersectTwoSorted(a, b) {
  const result = [];
  let left = 0;
  let right = 0;
  while (left < a.length && right < b.length) {
    const av = a[left];
    const bv = b[right];
    if (av === bv) {
      result.push(av);
      left += 1;
      right += 1;
    } else if (av < bv) {
      left += 1;
    } else {
      right += 1;
    }
  }
  return result;
}

export function intersectPostings(indexes, queryKeys) {
  const postings = [...new Set(queryKeys)]
    .map(key => indexes.get(key) || [])
    .sort((a, b) => a.length - b.length);
  if (!postings.length) return [];
  let result = [...postings[0]];
  for (let index = 1; index < postings.length && result.length; index += 1) {
    result = intersectTwoSorted(result, postings[index]);
  }
  return result;
}

function mostCommonKey(indexes, prefix) {
  return [...indexes.entries()]
    .filter(([key]) => key.startsWith(prefix))
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))[0]?.[0] || null;
}

export function benchmarkQueryScenarios(indexes) {
  const meal = indexes.has("meal:dinner") ? "meal:dinner" : mostCommonKey(indexes, "meal:");
  const time = indexes.has("time:under-45") ? "time:under-45" : mostCommonKey(indexes, "time:");
  const cuisine = mostCommonKey(indexes, "cuisine:");
  const ingredient = mostCommonKey(indexes, "ingredient:");
  const diet = indexes.has("diet:vegetarian") ? "diet:vegetarian" : mostCommonKey(indexes, "diet:");

  const candidates = [
    [meal].filter(Boolean),
    [meal, time].filter(Boolean),
    [cuisine, meal, time].filter(Boolean),
    [ingredient, meal].filter(Boolean),
    [diet, meal, time].filter(Boolean)
  ];

  const seen = new Set();
  return candidates
    .filter(keys => keys.length > 0)
    .map(keys => [...new Set(keys)])
    .filter(keys => {
      const signature = keys.join("|");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .map((keys, index) => ({ name: `scenario_${index + 1}`, keys }));
}

function queryTransferBytes(catalogue, scenario, boundedOrdinals) {
  let indexRawBytes = 0;
  let indexGzipBytes = 0;
  for (const key of scenario.keys) {
    const payload = postingPayload(catalogue.indexes.get(key) || []);
    indexRawBytes += bytes(payload);
    indexGzipBytes += gzipSync(payload).byteLength;
  }
  const detailPayload = `[${boundedOrdinals.map(ordinal => catalogue.objectBodies[ordinal]).join(",")}]`;
  const detailRawBytes = bytes(detailPayload);
  const detailGzipBytes = gzipSync(detailPayload).byteLength;
  return {
    rawBytes: indexRawBytes + detailRawBytes,
    gzipBytes: indexGzipBytes + detailGzipBytes,
    indexRawBytes,
    indexGzipBytes,
    detailRawBytes,
    detailGzipBytes
  };
}

export function benchmarkCatalogueQueries(catalogue, rankCandidateRecipes, options = {}) {
  const queryCap = Math.max(1, Number(options.queryCap) || CORPUS_SCALE_QUERY_CAP);
  const repetitions = Math.max(1, Number(options.repetitions) || 12);
  const scenarios = benchmarkQueryScenarios(catalogue.indexes);
  const results = [];

  for (const scenario of scenarios) {
    const allOrdinals = intersectPostings(catalogue.indexes, scenario.keys);
    const boundedOrdinals = allOrdinals.slice(0, queryCap);
    const transfer = queryTransferBytes(catalogue, scenario, boundedOrdinals);
    const retrievalSamples = [];
    const rankSamples = [];
    let rankedCount = 0;

    for (let repetition = 0; repetition < repetitions + 1; repetition += 1) {
      const retrievalStartedAt = performance.now();
      const ordinals = intersectPostings(catalogue.indexes, scenario.keys).slice(0, queryCap);
      const recipes = ordinals.map(ordinal => JSON.parse(catalogue.objectBodies[ordinal]));
      const retrievalMs = performance.now() - retrievalStartedAt;

      const rankStartedAt = performance.now();
      const ranked = rankCandidateRecipes(recipes, scenario);
      const rankMs = performance.now() - rankStartedAt;
      rankedCount = Array.isArray(ranked) ? ranked.length : Number(ranked?.eligible?.length || 0) + Number(ranked?.rejected?.length || 0);
      updatePeak(catalogue.metrics.peakMemory, memorySnapshot());

      if (repetition > 0) {
        retrievalSamples.push(retrievalMs);
        rankSamples.push(rankMs);
      }
    }

    results.push({
      ...scenario,
      fullCandidateCount: allOrdinals.length,
      boundedCandidateCount: boundedOrdinals.length,
      rankedCount,
      transfer,
      retrievalP50Ms: rounded(percentile(retrievalSamples, 0.5)),
      retrievalP95Ms: rounded(percentile(retrievalSamples, 0.95)),
      rankP50Ms: rounded(percentile(rankSamples, 0.5)),
      rankP95Ms: rounded(percentile(rankSamples, 0.95))
    });
  }
  return results;
}

function includesSorted(postings, ordinal) {
  let low = 0;
  let high = postings.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const value = postings[mid];
    if (value === ordinal) return true;
    if (value < ordinal) low = mid + 1;
    else high = mid - 1;
  }
  return false;
}

export function validateSyntheticCatalogue(catalogue, options = {}) {
  const sampleEvery = Math.max(1, Number(options.memorySampleEvery) || 1_000);
  const startedAt = performance.now();
  if (catalogue.objectBodies.length !== catalogue.targetSize) throw new Error("object body count mismatch");
  if (catalogue.ids.length !== catalogue.targetSize) throw new Error("id count mismatch");

  const seen = new Set();
  const digest = createHash("sha256");
  for (let ordinal = 0; ordinal < catalogue.targetSize; ordinal += 1) {
    const recipe = JSON.parse(catalogue.objectBodies[ordinal]);
    if (recipe.id !== catalogue.ids[ordinal]) throw new Error(`id mismatch at ordinal ${ordinal}`);
    if (seen.has(recipe.id)) throw new Error(`duplicate id ${recipe.id}`);
    seen.add(recipe.id);
    if (!recipe.provenance?.benchmarkSynthetic) throw new Error(`missing benchmark marker for ${recipe.id}`);
    if (!recipe.provenance?.benchmarkSourceRecipeId) throw new Error(`missing source recipe id for ${recipe.id}`);
    for (const key of indexKeysForRecipe(recipe)) {
      const postings = catalogue.indexes.get(key);
      if (!postings || !includesSorted(postings, ordinal)) throw new Error(`index ${key} missing ordinal ${ordinal}`);
    }
    digest.update(recipe.id);
    digest.update("\n");
    if ((ordinal + 1) % sampleEvery === 0) updatePeak(catalogue.metrics.peakMemory, memorySnapshot());
  }

  for (const [key, postings] of catalogue.indexes) {
    let previous = -1;
    for (const ordinal of postings) {
      if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= catalogue.targetSize) throw new Error(`invalid ordinal in ${key}`);
      if (ordinal <= previous) throw new Error(`posting list not strictly ordered for ${key}`);
      previous = ordinal;
    }
    digest.update(key);
    digest.update(":");
    digest.update(postings.join(","));
    digest.update("\n");
  }
  updatePeak(catalogue.metrics.peakMemory, memorySnapshot());

  return {
    validationMs: rounded(performance.now() - startedAt),
    catalogueSha256: digest.digest("hex")
  };
}

export function evaluateScaleAcceptance(sizeReport, thresholds = CORPUS_SCALE_ACCEPTANCE) {
  const maxTransfer = Math.max(0, ...sizeReport.queries.map(query => query.transfer.gzipBytes));
  const maxRetrievalP95 = Math.max(0, ...sizeReport.queries.map(query => query.retrievalP95Ms));
  const maxRankP95 = Math.max(0, ...sizeReport.queries.map(query => query.rankP95Ms));
  const maxBoundedCandidates = Math.max(0, ...sizeReport.queries.map(query => query.boundedCandidateCount));

  const checks = {
    averageRecipeBytes: sizeReport.metrics.averageRecipeBytes <= thresholds.maxAverageRecipeBytes,
    p95RecipeBytes: sizeReport.metrics.p95RecipeBytes <= thresholds.maxP95RecipeBytes,
    indexGzipBytesPerRecord: sizeReport.metrics.indexGzipBytesPerRecord <= thresholds.maxIndexGzipBytesPerRecord,
    transferGzipBytesPerQuery: maxTransfer <= thresholds.maxTransferGzipBytesPerQuery,
    retrievalP95Ms: maxRetrievalP95 <= thresholds.maxRetrievalP95Ms,
    rankP95Ms: maxRankP95 <= thresholds.maxRankP95Ms,
    boundedCandidates: maxBoundedCandidates <= thresholds.maxBoundedCandidates
  };

  if (sizeReport.targetSize === 100_000) {
    checks.buildMsAt100k = sizeReport.metrics.buildMs <= thresholds.maxBuildMsAt100k;
    checks.validationMsAt100k = sizeReport.validation.validationMs <= thresholds.maxValidationMsAt100k;
    checks.rssBytesAt100k = sizeReport.metrics.peakMemory.rssBytes <= thresholds.maxRssBytesAt100k;
    checks.heapUsedBytesAt100k = sizeReport.metrics.peakMemory.heapUsedBytes <= thresholds.maxHeapUsedBytesAt100k;
  }

  return {
    pass: Object.values(checks).every(Boolean),
    checks,
    observed: {
      maxTransferGzipBytesPerQuery: maxTransfer,
      maxRetrievalP95Ms: maxRetrievalP95,
      maxRankP95Ms: maxRankP95,
      maxBoundedCandidates
    }
  };
}

export function runStep1Benchmark(goldenRecipes, rankCandidateRecipes, options = {}) {
  const sizes = options.sizes || CORPUS_SCALE_TARGETS;
  const reports = [];
  for (const targetSize of sizes) {
    if (typeof global.gc === "function") global.gc();
    const catalogue = buildSyntheticCatalogue(goldenRecipes, targetSize, options);
    const queries = benchmarkCatalogueQueries(catalogue, rankCandidateRecipes, options);
    const validation = validateSyntheticCatalogue(catalogue, options);
    const sizeReport = { targetSize, goldenFingerprint: catalogue.goldenFingerprint, metrics: catalogue.metrics, queries, validation };
    sizeReport.acceptance = evaluateScaleAcceptance(sizeReport, options.thresholds || CORPUS_SCALE_ACCEPTANCE);
    reports.push(sizeReport);
  }
  return {
    contractVersion: "CORPUS_SCALE_STEP1_V1",
    generatedAt: new Date().toISOString(),
    targetSizes: [...sizes],
    queryCap: Number(options.queryCap) || CORPUS_SCALE_QUERY_CAP,
    thresholds: options.thresholds || CORPUS_SCALE_ACCEPTANCE,
    goldenFingerprint: fingerprintGoldenCorpus(goldenRecipes),
    reports,
    pass: reports.every(report => report.acceptance.pass)
  };
}
