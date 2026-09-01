import test from "node:test";
import assert from "node:assert/strict";
import { GATE_F2_SOURCE } from "../scripts/wikibooks-gate-f2-contract.mjs";
import {
  buildGateF2CategoryHintSnapshot,
  fetchGateF2CategoryHints,
  validateGateF2CategoryHintSnapshot
} from "../scripts/wikibooks-gate-f2-category-hints.mjs";

const discoveryRecord = ({ pageid, title, revid, timestamp }) => ({
  id: `wikibooks_discovery_${pageid}`,
  pageid,
  title,
  revid,
  timestamp,
  reviewState: "DISCOVERED_UNREVIEWED",
  recommendationState: "NOT_APPLICABLE",
  hardMetadataState: "NOT_REVIEWED",
  ingredientMappingState: "NOT_REVIEWED",
  nutritionState: "NOT_APPLICABLE",
  runtimeArtifact: null,
  coverage: null
});

const discoveryFixture = ({ complete = true, records = null } = {}) => {
  const rows = records || [
    discoveryRecord({ pageid: 100, title: "Cookbook:Alpha", revid: 1001, timestamp: "2026-08-31T10:00:00Z" }),
    discoveryRecord({ pageid: 200, title: "Cookbook:Beta", revid: 2001, timestamp: "2026-08-31T11:00:00Z" }),
    discoveryRecord({ pageid: 300, title: "Cookbook:Gamma", revid: 3001, timestamp: "2026-08-31T12:00:00Z" })
  ];
  return {
    schemaVersion: "wikibooks-gate-f2-discovery-v1",
    source: GATE_F2_SOURCE,
    acquiredAt: "2026-09-01T16:00:00Z",
    acquisitionMode: "METADATA_AND_EXACT_REVISION_IDS_ONLY",
    requestedLimit: complete ? 10 : rows.length,
    returnedRecordCount: rows.length,
    sourceUniverseState: complete ? "SOURCE_EXHAUSTED" : "LIMIT_REACHED",
    sourceUniverseComplete: complete,
    runtimeActivationAuthorized: false,
    records: rows
  };
};

test("Gate F2 category hints stay current-page discovery metadata and never become hard evidence", () => {
  const discovery = discoveryFixture();
  const snapshot = buildGateF2CategoryHintSnapshot(discovery, [
    {
      pageid: 100,
      title: "Cookbook:Alpha",
      categories: [{ title: "Category:Japanese recipes" }, { title: "Category:Breakfast recipes" }]
    },
    {
      pageid: 100,
      title: "Cookbook:Alpha",
      categories: [{ title: "Category:Breakfast recipes" }, { title: "Category:Rice recipes" }]
    },
    {
      pageid: 200,
      title: "Cookbook:Beta",
      missing: true
    },
    {
      pageid: 300,
      title: "Cookbook:Gamma renamed",
      categories: []
    }
  ], { acquiredAt: "2026-09-01T16:30:00Z" });

  assert.deepEqual(validateGateF2CategoryHintSnapshot(snapshot), []);
  assert.equal(snapshot.discoverySourceUniverseComplete, true);
  assert.equal(snapshot.categoryMetadataRevisionPinned, false);
  assert.equal(snapshot.hardMetadataInferenceAuthorized, false);
  assert.equal(snapshot.authenticityInferenceAuthorized, false);
  assert.equal(snapshot.trendInferenceAuthorized, false);
  assert.equal(snapshot.nutritionAuthorityAuthorized, false);
  assert.equal(snapshot.runtimeActivationAuthorized, false);
  assert.equal(snapshot.categoryFetchAnomalyCount, 1);
  assert.equal(snapshot.titleDriftCount, 1);
  assert.equal(snapshot.totalCategoryHintCount, 3);

  const alpha = snapshot.records.find(record => record.pageid === 100);
  assert.deepEqual(alpha.categories, [
    "Category:Breakfast recipes",
    "Category:Japanese recipes",
    "Category:Rice recipes"
  ]);
  assert.equal(alpha.categoryMetadataRevisionPinned, false);
  assert.equal(alpha.maySetCoverageMetadata, false);
  assert.equal(alpha.mayAuthorizeRecommendation, false);
  assert.equal(alpha.mayAuthorizeAuthenticityClaim, false);
  assert.equal(alpha.mayAuthorizeTrendClaim, false);

  const beta = snapshot.records.find(record => record.pageid === 200);
  assert.equal(beta.categoryFetchState, "MISSING_AT_CATEGORY_ACQUISITION");
  assert.equal(beta.categoryQueryTitle, null);
  assert.deepEqual(beta.categories, []);

  const gamma = snapshot.records.find(record => record.pageid === 300);
  assert.equal(gamma.categoryFetchState, "PRESENT");
  assert.equal(gamma.titleChangedSinceDiscovery, true);
  assert.equal(gamma.categoryQueryTitle, "Cookbook:Gamma renamed");
});

test("Gate F2 category hints inherit partial discovery status instead of upgrading it", () => {
  const records = [
    discoveryRecord({ pageid: 100, title: "Cookbook:Alpha", revid: 1001, timestamp: "2026-08-31T10:00:00Z" }),
    discoveryRecord({ pageid: 200, title: "Cookbook:Beta", revid: 2001, timestamp: "2026-08-31T11:00:00Z" })
  ];
  const discovery = discoveryFixture({ complete: false, records });
  const snapshot = buildGateF2CategoryHintSnapshot(discovery, [
    { pageid: 100, title: "Cookbook:Alpha", categories: [] },
    { pageid: 200, title: "Cookbook:Beta", categories: [] }
  ], { acquiredAt: "2026-09-01T16:31:00Z" });

  assert.equal(snapshot.discoverySourceUniverseState, "LIMIT_REACHED");
  assert.equal(snapshot.discoverySourceUniverseComplete, false);
  assert.equal(snapshot.categoryRecordCount, 2);
  assert.equal(snapshot.categoryFetchAnomalyCount, 0);
});

test("Gate F2 category fetch fully drains property continuation before advancing a page-id batch", async () => {
  const records = [
    discoveryRecord({ pageid: 100, title: "Cookbook:Alpha", revid: 1001, timestamp: "2026-08-31T10:00:00Z" }),
    discoveryRecord({ pageid: 200, title: "Cookbook:Beta", revid: 2001, timestamp: "2026-08-31T11:00:00Z" })
  ];
  const discovery = discoveryFixture({ records });
  const calls = [];
  const payloads = [
    {
      query: {
        pages: [{
          pageid: 100,
          title: "Cookbook:Alpha",
          categories: [{ title: "Category:Breakfast recipes" }]
        }]
      },
      continue: {
        continue: "||",
        clcontinue: "100|Category:Japanese recipes"
      }
    },
    {
      query: {
        pages: [
          {
            pageid: 100,
            title: "Cookbook:Alpha",
            categories: [{ title: "Category:Japanese recipes" }]
          },
          {
            pageid: 200,
            title: "Cookbook:Beta",
            categories: [{ title: "Category:Vegan recipes" }]
          }
        ]
      }
    }
  ];

  const fetchImpl = async url => {
    calls.push(url);
    const payload = payloads.shift();
    assert.ok(payload, "unexpected extra fetch");
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => payload
    };
  };

  const snapshot = await fetchGateF2CategoryHints(discovery, {
    fetchImpl,
    batchSize: 2,
    acquiredAt: "2026-09-01T16:32:00Z"
  });

  assert.equal(calls.length, 2);
  const second = new URL(calls[1]);
  assert.equal(second.searchParams.get("pageids"), "100|200");
  assert.equal(second.searchParams.get("continue"), "||");
  assert.equal(second.searchParams.get("clcontinue"), "100|Category:Japanese recipes");
  assert.equal(snapshot.totalCategoryHintCount, 3);
  assert.equal(snapshot.categoryFetchAnomalyCount, 0);
  assert.deepEqual(snapshot.records.find(record => record.pageid === 100).categories, [
    "Category:Breakfast recipes",
    "Category:Japanese recipes"
  ]);
});

test("Gate F2 category fetch fails closed on repeated continuation tokens", async () => {
  const discovery = discoveryFixture({ records: [
    discoveryRecord({ pageid: 100, title: "Cookbook:Alpha", revid: 1001, timestamp: "2026-08-31T10:00:00Z" })
  ] });
  const repeated = { continue: "||", clcontinue: "100|Category:Loop" };
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        query: { pages: [{ pageid: 100, title: "Cookbook:Alpha", categories: [] }] },
        continue: repeated
      })
    };
  };

  await assert.rejects(
    fetchGateF2CategoryHints(discovery, { fetchImpl, batchSize: 1 }),
    /Repeated Wikibooks category continuation/
  );
  assert.equal(calls, 2);
});

test("Gate F2 category hints reject unexpected pages and behavior-authorizing mutations", () => {
  const discovery = discoveryFixture();
  assert.throws(
    () => buildGateF2CategoryHintSnapshot(discovery, [{ pageid: 999, title: "Cookbook:Unexpected", categories: [] }]),
    /unexpected pageid/
  );

  const snapshot = buildGateF2CategoryHintSnapshot(discovery, [
    { pageid: 100, title: "Cookbook:Alpha", categories: [] },
    { pageid: 200, title: "Cookbook:Beta", categories: [] },
    { pageid: 300, title: "Cookbook:Gamma", categories: [] }
  ], { acquiredAt: "2026-09-01T16:33:00Z" });
  const invalid = structuredClone(snapshot);
  invalid.trendInferenceAuthorized = true;
  invalid.records[0].maySetCoverageMetadata = true;
  invalid.records[0].categories = ["Not a source category"];
  invalid.records[0].categoryCount = 1;
  invalid.totalCategoryHintCount = 1;

  const errors = validateGateF2CategoryHintSnapshot(invalid);
  assert.ok(errors.some(error => error.includes("trendInferenceAuthorized must remain false")));
  assert.ok(errors.some(error => error.includes("maySetCoverageMetadata must remain false")));
  assert.ok(errors.some(error => error.includes("Category: titles")));
});
