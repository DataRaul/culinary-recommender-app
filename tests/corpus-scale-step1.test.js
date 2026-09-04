import test from "node:test";
import assert from "node:assert/strict";
import {
  benchmarkCatalogueQueries,
  buildSyntheticCatalogue,
  evaluateScaleAcceptance,
  fingerprintGoldenCorpus,
  indexKeysForRecipe,
  intersectPostings,
  syntheticRecipeFromGolden,
  validateSyntheticCatalogue
} from "../scripts/corpus-scale-step1-core.mjs";

const golden = [
  {
    id: "alpha",
    provenance: { source: "fixture" },
    culinary: { cuisine: "Mediterranean", mealTypes: ["lunch", "dinner"], difficulty: 1 },
    time: { totalMinutes: 25 },
    ingredients: [{ canonicalIngredientId: "chickpeas" }, { canonicalIngredientId: "tomato" }],
    dietaryTags: ["unrestricted", "vegetarian", "vegan"],
    mainProtein: "legume"
  },
  {
    id: "beta",
    provenance: { source: "fixture" },
    culinary: { cuisine: "Italian", mealTypes: ["dinner"], difficulty: 2 },
    time: { totalMinutes: 40 },
    ingredients: [{ canonicalIngredientId: "tomato" }, { canonicalIngredientId: "pasta" }],
    dietaryTags: ["unrestricted", "vegetarian"],
    mainProtein: "grain"
  }
];

test("golden fingerprint and synthetic identity are deterministic", () => {
  const first = fingerprintGoldenCorpus(golden);
  const second = fingerprintGoldenCorpus([...golden].reverse());
  assert.deepEqual(first, second);
  const synthetic = syntheticRecipeFromGolden(golden[0], 2);
  assert.equal(synthetic.id, "scale_000003_alpha");
  assert.equal(synthetic.provenance.benchmarkSourceRecipeId, "alpha");
  assert.equal(golden[0].provenance.benchmarkSynthetic, undefined);
});

test("index keys preserve hard-filter retrieval dimensions", () => {
  const keys = indexKeysForRecipe(golden[0]);
  assert.ok(keys.includes("ingredient:chickpeas"));
  assert.ok(keys.includes("cuisine:mediterranean"));
  assert.ok(keys.includes("diet:vegan"));
  assert.ok(keys.includes("meal:dinner"));
  assert.ok(keys.includes("time:under-30"));
  assert.ok(keys.includes("time:under-45"));
  assert.ok(keys.includes("skill:lte-1"));
  assert.ok(keys.includes("skill:lte-4"));
});

test("synthetic catalogue builds deterministic postings and validates", () => {
  const catalogue = buildSyntheticCatalogue(golden, 20, { memorySampleEvery: 5 });
  assert.equal(catalogue.targetSize, 20);
  assert.equal(catalogue.objectBodies.length, 20);
  const dinner = intersectPostings(catalogue.indexes, ["meal:dinner"]);
  assert.equal(dinner.length, 20);
  const vegan = intersectPostings(catalogue.indexes, ["diet:vegan"]);
  assert.equal(vegan.length, 10);
  const medVegan = intersectPostings(catalogue.indexes, ["cuisine:mediterranean", "diet:vegan"]);
  assert.equal(medVegan.length, 10);
  const validation = validateSyntheticCatalogue(catalogue);
  assert.match(validation.catalogueSha256, /^[a-f0-9]{64}$/);
});

test("query benchmark caps candidates and reports transfer/latency metrics", () => {
  const catalogue = buildSyntheticCatalogue(golden, 40);
  const queries = benchmarkCatalogueQueries(catalogue, recipes => recipes, { queryCap: 7, repetitions: 2 });
  assert.ok(queries.length >= 3);
  for (const query of queries) {
    assert.ok(query.boundedCandidateCount <= 7);
    assert.ok(query.transfer.gzipBytes > 0);
    assert.ok(query.retrievalP95Ms >= 0);
    assert.ok(query.rankP95Ms >= 0);
  }
});

test("acceptance evaluation is explicit and fail-closed", () => {
  const report = {
    targetSize: 100_000,
    metrics: {
      averageRecipeBytes: 100,
      p95RecipeBytes: 200,
      indexGzipBytesPerRecord: 20,
      buildMs: 100,
      peakMemory: { rssBytes: 1_000, heapUsedBytes: 500 }
    },
    validation: { validationMs: 50 },
    queries: [{ boundedCandidateCount: 10, retrievalP95Ms: 2, rankP95Ms: 3, transfer: { gzipBytes: 400 } }]
  };
  const thresholds = {
    maxAverageRecipeBytes: 500,
    maxP95RecipeBytes: 500,
    maxIndexGzipBytesPerRecord: 100,
    maxTransferGzipBytesPerQuery: 500,
    maxRetrievalP95Ms: 5,
    maxRankP95Ms: 5,
    maxBuildMsAt100k: 500,
    maxValidationMsAt100k: 500,
    maxRssBytesAt100k: 2_000,
    maxHeapUsedBytesAt100k: 2_000,
    maxBoundedCandidates: 20
  };
  assert.equal(evaluateScaleAcceptance(report, thresholds).pass, true);
  assert.equal(evaluateScaleAcceptance({ ...report, queries: [{ ...report.queries[0], transfer: { gzipBytes: 501 } }] }, thresholds).pass, false);
});
