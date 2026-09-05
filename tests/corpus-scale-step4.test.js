import test from "node:test";
import assert from "node:assert/strict";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  CORPUS_SCALE_QUERY_CAP,
  benchmarkQueryScenarios,
  buildSyntheticCatalogue,
  intersectPostings
} from "../scripts/corpus-scale-step1-core.mjs";
import { materializePortableCorpusArtifacts } from "../scripts/corpus-scale-step3-core.mjs";
import {
  STEP4_RETRIEVAL_ACCEPTANCE,
  benchmarkStep4Queries,
  buildStep4RetrievalModel,
  evaluateStep4Acceptance,
  executeStep4PortableQuery,
  portableDetailPathForOrdinal,
  portableIndexPathForKey,
  readPortableDetailObject,
  readPortableIndexObject
} from "../scripts/corpus-scale-step4-core.mjs";

const ROOT = "corpus/v0001";

function permissiveThresholds() {
  return {
    ...STEP4_RETRIEVAL_ACCEPTANCE,
    maxBackendReadGzipBytesPerQuery: Number.MAX_SAFE_INTEGER,
    maxWorkerResponseGzipBytesPerQuery: Number.MAX_SAFE_INTEGER,
    maxRetrievalP95Ms: Number.MAX_SAFE_INTEGER,
    maxRankP95Ms: Number.MAX_SAFE_INTEGER,
    maxBuildMsAt100k: Number.MAX_SAFE_INTEGER,
    maxRssBytesAt100k: Number.MAX_SAFE_INTEGER,
    maxHeapUsedBytesAt100k: Number.MAX_SAFE_INTEGER
  };
}

test("Step 4 direct model reads exactly the Step 3 canonical 84-record detail and index objects", () => {
  const portable = materializePortableCorpusArtifacts(ALL_RECIPES, { version: "v0001" });
  const model = buildStep4RetrievalModel(ALL_RECIPES, ALL_RECIPES.length, {
    synthetic: false,
    version: "v0001"
  });

  assert.equal(model.targetSize, 84);
  assert.equal(model.detailStrategy, "CANONICAL_GOLDEN_DETAIL_ON_READ");

  for (let ordinal = 0; ordinal < ALL_RECIPES.length; ordinal += 1) {
    const path = portableDetailPathForOrdinal(ordinal, ALL_RECIPES.length);
    assert.equal(readPortableDetailObject(model, ordinal), portable.files.get(`${ROOT}/${path}`));
  }

  for (const key of model.indexes.keys()) {
    const path = portableIndexPathForKey(key);
    assert.equal(readPortableIndexObject(model, key), portable.files.get(`${ROOT}/${path}`));
  }
});

test("Step 4 scale model preserves Step 1 candidate intersections and bounded detail identities", () => {
  const targetSize = 1_000;
  const step1 = buildSyntheticCatalogue(ALL_RECIPES, targetSize);
  const model = buildStep4RetrievalModel(ALL_RECIPES, targetSize);
  const scenarios = benchmarkQueryScenarios(step1.indexes);

  for (const scenario of scenarios) {
    const expectedOrdinals = intersectPostings(step1.indexes, scenario.keys);
    const actual = executeStep4PortableQuery(model, scenario, {
      queryCap: CORPUS_SCALE_QUERY_CAP,
      measureBytes: true
    });
    assert.equal(actual.fullCandidateCount, expectedOrdinals.length);
    assert.equal(actual.boundedCandidateCount, Math.min(expectedOrdinals.length, CORPUS_SCALE_QUERY_CAP));
    assert.deepEqual(
      actual.recipes.map(recipe => recipe.id),
      expectedOrdinals.slice(0, CORPUS_SCALE_QUERY_CAP).map(ordinal => JSON.parse(step1.objectBodies[ordinal]).id)
    );
  }
});

test("portable retrieval uses one browser request, no metadata scan, bounded index reads and bounded detail reads", () => {
  const model = buildStep4RetrievalModel(ALL_RECIPES, 1_000);
  const scenario = benchmarkQueryScenarios(model.indexes)[0];
  const result = executeStep4PortableQuery(model, scenario, { measureBytes: true });

  assert.equal(result.objectReads.browserWorkerRequests, 1);
  assert.equal(result.objectReads.metadataObjectReads, 0);
  assert.equal(result.objectReads.indexObjectReads, scenario.keys.length);
  assert.equal(result.objectReads.detailObjectReads, result.boundedCandidateCount);
  assert.ok(result.objectReads.detailObjectReads <= CORPUS_SCALE_QUERY_CAP);
  assert.equal(
    result.objectReads.backendObjectReads,
    result.objectReads.indexObjectReads + result.objectReads.detailObjectReads
  );
  assert.ok(result.transfer.backendReadRawBytes > 0);
  assert.ok(result.transfer.backendReadGzipBytes > 0);
  assert.ok(result.transfer.workerResponseGzipBytes > 0);
});

test("query benchmark is deterministic in cardinality/read shape and acceptance can pass without timing flakiness", () => {
  const model = buildStep4RetrievalModel(ALL_RECIPES, 1_000);
  const rankStub = recipes => recipes.map(recipe => recipe.id);
  const first = benchmarkStep4Queries(model, rankStub, { repetitions: 2 });
  const second = benchmarkStep4Queries(model, rankStub, { repetitions: 2 });

  assert.deepEqual(
    first.map(row => ({
      name: row.name,
      keys: row.keys,
      fullCandidateCount: row.fullCandidateCount,
      boundedCandidateCount: row.boundedCandidateCount,
      objectReads: row.objectReads,
      transfer: row.transfer
    })),
    second.map(row => ({
      name: row.name,
      keys: row.keys,
      fullCandidateCount: row.fullCandidateCount,
      boundedCandidateCount: row.boundedCandidateCount,
      objectReads: row.objectReads,
      transfer: row.transfer
    }))
  );

  const acceptance = evaluateStep4Acceptance(model, first, permissiveThresholds());
  assert.equal(acceptance.pass, true);
  assert.equal(acceptance.d1Decision, "NOT_EARNED_R2_PREBUILT_INDEX_PATH_PASSES");
});

test("retrieval gate failure is fail-closed and earns review only, never automatic D1 adoption", () => {
  const model = buildStep4RetrievalModel(ALL_RECIPES, 1_000);
  const rows = benchmarkStep4Queries(model, recipes => recipes, { repetitions: 1 });
  const failedRows = rows.map((row, index) => index === 0 ? { ...row, retrievalP95Ms: 999_999 } : row);
  const thresholds = permissiveThresholds();
  thresholds.maxRetrievalP95Ms = 25;

  const acceptance = evaluateStep4Acceptance(model, failedRows, thresholds);
  assert.equal(acceptance.pass, false);
  assert.ok(acceptance.failedCheckIds.some(id => id.endsWith("retrievalP95Ms")));
  assert.equal(acceptance.d1Decision, "REVIEW_ONLY_AFTER_RETRIEVAL_GATE_FAILURE__DO_NOT_AUTO_ADD_D1");
});

test("scale model does not retain a second full serialized recipe corpus", () => {
  const model = buildStep4RetrievalModel(ALL_RECIPES, 10_000);
  assert.equal(Object.hasOwn(model, "objectBodies"), false);
  assert.equal(Object.hasOwn(model, "detailObjects"), false);
  assert.equal(model.detailStrategy, "DETERMINISTIC_SYNTHETIC_DETAIL_ON_READ");
  assert.equal(model.indexObjects.size, model.indexes.size);
  assert.ok(model.metrics.indexRawBytes > 0);
});

test("Step 4 validates portable paths and model inputs fail closed", () => {
  assert.equal(portableIndexPathForKey("ingredient:tomato"), "indexes/ingredient/tomato.json");
  assert.equal(portableDetailPathForOrdinal(0, 84), "recipes/000000.json");
  assert.throws(() => portableIndexPathForKey("bad key"), /invalid index key|not portable/);
  assert.throws(() => portableDetailPathForOrdinal(84, 84), /invalid recipe ordinal/);
  assert.throws(() => buildStep4RetrievalModel([], 1_000), /at least one recipe/);
  assert.throws(() => buildStep4RetrievalModel(ALL_RECIPES, 0), /positive integer/);
  assert.throws(
    () => buildStep4RetrievalModel(ALL_RECIPES, 85, { synthetic: false, version: "v0001" }),
    /cannot exceed supplied recipe count/
  );
  assert.throws(() => buildStep4RetrievalModel(ALL_RECIPES, 84, { synthetic: false, version: "latest" }), /corpus version/);
});
