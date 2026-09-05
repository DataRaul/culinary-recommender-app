import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS,
  YT_CUL_MAX_TRANSIENT_TTL_DAYS,
  YT_CUL_MIN_SEARCH_RESERVE,
  assertPolicySafeDurableObject,
  buildDeterministicSearchPlan,
  createClientContract,
  createDailyFunnelReport,
  createPromotionHandoff,
  createQuotaLedger,
  createTransientCacheEnvelope,
  purgeExpiredTransientCache,
  recordExecutedSearchCalls,
  validateClientContract,
  validateQuotaLedger,
  validateTransientCacheEnvelope
} from "../scripts/youtube-culinary-discovery-control-plane.mjs";

test("YT-CUL-0 freezes a zero-live, separate-client policy contract", () => {
  const contract = createClientContract();
  assert.deepEqual(validateClientContract(contract), []);
  assert.equal(contract.liveApiCallsAuthorized, false);
  assert.equal(contract.crossUseWithBlueLagoonAuthorized, false);
  assert.equal(contract.oneApiProjectPerClient, true);
  assert.equal(contract.rawYoutubeApiDataDurableStorageAuthorized, false);
  assert.equal(contract.derivedYoutubeMetricsAuthorized, false);
  assert.equal(contract.transientDefaultTtlDays, YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS);
  assert.equal(contract.transientMaxTtlDays, YT_CUL_MAX_TRANSIENT_TTL_DAYS);
});

test("quota ledger preserves a hard reserve and rejects Blue Lagoon cross-use", () => {
  const ledger = createQuotaLedger({
    projectIdentity: "culinary-youtube-discovery",
    quotaDate: "2026-09-05",
    dailySearchLimit: 100
  });
  assert.deepEqual(validateQuotaLedger(ledger), []);
  assert.equal(ledger.reserveCalls, YT_CUL_MIN_SEARCH_RESERVE);
  assert.equal(ledger.acquisitionBudget, 95);
  assert.throws(() => createQuotaLedger({
    projectIdentity: "youtube-blue-lagoon-lab",
    quotaDate: "2026-09-05",
    dailySearchLimit: 100
  }), /must not identify Blue Lagoon\/music use/);
});

test("deterministic planner sorts by programme priority and never spends the reserve", () => {
  const ledger = createQuotaLedger({
    projectIdentity: "culinary-youtube-discovery",
    quotaDate: "2026-09-05",
    dailySearchLimit: 12,
    reserveCalls: 5
  });
  const requests = [
    { queryId: "q-b", purpose: "VARIANT_DISCOVERY", priorityTier: 2, requestedCalls: 3, queryText: "synthetic variant query" },
    { queryId: "q-c", purpose: "CONTROL", priorityTier: 3, requestedCalls: 3, queryText: "synthetic control query" },
    { queryId: "q-a", purpose: "DISH_FAMILY_DISCOVERY", priorityTier: 1, requestedCalls: 4, queryText: "synthetic family query" }
  ];
  const plan = buildDeterministicSearchPlan(ledger, requests);
  assert.deepEqual(plan.plan.map(entry => entry.queryId), ["q-a", "q-b"]);
  assert.equal(plan.plannedCalls, 7);
  assert.equal(plan.remainingAcquisitionBudget, 0);
  assert.equal(plan.deferred[0].queryId, "q-c");
  assert.equal(plan.liveApiCallsAuthorized, false);
  assert.equal(plan.youtubeDerivedRankingAuthorized, false);
  assert.deepEqual(validateQuotaLedger(plan.ledger), []);
  const executed = recordExecutedSearchCalls(plan.ledger, 6);
  assert.equal(executed.executedCalls, 6);
  assert.throws(() => recordExecutedSearchCalls(plan.ledger, 8), /cannot exceed plannedCalls/);
});

test("planner rejects YouTube-derived creator, engagement or authenticity scoring", () => {
  const ledger = createQuotaLedger({ projectIdentity: "culinary-youtube-discovery", quotaDate: "2026-09-05", dailySearchLimit: 100 });
  assert.throws(() => buildDeterministicSearchPlan(ledger, [{
    queryId: "bad",
    purpose: "CREATOR_OR_CHANNEL_DISCOVERY",
    priorityTier: 1,
    youtubeEngagementScore: 99
  }]), /scores are forbidden/);
});

test("transient cache defaults to seven days, caps at thirty and purges deterministically", () => {
  const active = createTransientCacheEnvelope({
    cacheKey: "synthetic-a",
    endpoint: "search.list",
    queryId: "q-a",
    retrievedAt: "2026-09-05T12:00:00Z",
    payload: { snippet: { title: "Synthetic fixture only" } }
  });
  assert.deepEqual(validateTransientCacheEnvelope(active), []);
  assert.equal(active.ttlDays, 7);
  assert.equal(active.expiresAt, "2026-09-12T12:00:00.000Z");

  const expired = createTransientCacheEnvelope({
    cacheKey: "synthetic-b",
    endpoint: "search.list",
    queryId: "q-b",
    retrievedAt: "2026-08-01T00:00:00Z",
    ttlDays: 30,
    payload: { snippet: { title: "Synthetic expired fixture" } }
  });
  const purged = purgeExpiredTransientCache([active, expired], "2026-09-05T13:00:00Z");
  assert.deepEqual(purged.expiredKeys, ["synthetic-b"]);
  assert.deepEqual(purged.kept.map(entry => entry.cacheKey), ["synthetic-a"]);
  assert.throws(() => createTransientCacheEnvelope({
    cacheKey: "bad",
    endpoint: "search.list",
    queryId: "q-bad",
    retrievedAt: "2026-09-05T00:00:00Z",
    ttlDays: 31,
    payload: {}
  }), /must not exceed 30/);
});

test("durable report and promotion handoff contain no raw YouTube metadata or automatic authority", () => {
  const handoff = createPromotionHandoff({
    handoffId: "handoff-1",
    candidateKind: "IDENTITY",
    independentSourceId: "independent-source-1",
    independentSourceUrl: "https://example.test/culinary-source",
    atlasCandidateId: "fixture-family"
  });
  assert.equal(handoff.evidenceOrigin, "INDEPENDENT_NON_YOUTUBE_SOURCE");
  assert.equal(handoff.youtubeApiDataEmbedded, false);
  assert.equal(handoff.automaticAtlasPromotionAuthorized, false);
  assert.equal(handoff.automaticAppAdmissionAuthorized, false);

  const report = createDailyFunnelReport({
    runId: "yt-cul-fixture-001",
    quotaDate: "2026-09-05",
    clientProjectIdentity: "culinary-youtube-discovery",
    callsPlanned: 95,
    callsExecuted: 90,
    callsReserved: 5,
    resultSlotsObserved: 4500,
    transientUniqueCandidatePointers: 1200,
    newCandidateSourceFamilies: 70,
    atlasFamilyCandidatesNominated: 35,
    variantOrTechniqueQuestionsNominated: 50,
    independentlyReviewedCandidates: 20,
    atlasPromotions: { IDENTITY: 4, STRUCTURE: 3, VARIANT: 2, TECHNIQUE: 1, TRANSFORMATION: 0 },
    appHandoffsCreated: 3,
    publicRecipesAdmitted: 1
  });
  assert.equal(report.funnel.atlasPromotions.IDENTITY, 4);
  assert.equal(report.grossYoutubeResultsAreRecipesAcquired, false);
  assert.equal(report.rawYoutubeApiDataEmbedded, false);
  assert.match(report.reportSha256, /^[a-f0-9]{64}$/);
  assert.doesNotThrow(() => assertPolicySafeDurableObject(report));
  assert.throws(() => assertPolicySafeDurableObject({ title: "raw api title" }), /forbidden raw YouTube API metadata/);
});

test("YT-CUL-0 module has no live network client or secret read", async () => {
  const source = await readFile(new URL("../scripts/youtube-culinary-discovery-control-plane.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /https\.request\s*\(/);
  assert.doesNotMatch(source, /process\.env\s*\[?\s*["']CULINARY_YOUTUBE_API_KEY/);
});
