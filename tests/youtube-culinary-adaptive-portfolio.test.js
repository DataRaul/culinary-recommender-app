import test from "node:test";
import assert from "node:assert/strict";
import {
  YT_CUL_5E_BASE_QUERY_PORTFOLIO,
  YT_CUL_5E_DAILY_SEARCH_CAPACITY,
  YT_CUL_5E_EXPLORATION_FRACTION,
  YT_CUL_5E_ZERO_YIELD_COOL_AFTER_CALLS,
  buildAdaptiveQueryPortfolio,
  evaluateAdaptivePreSearchGate,
  nextTrancheSize,
  selectNextAdaptiveTranche
} from "../scripts/youtube-culinary-adaptive-portfolio.mjs";
import {
  YT_CUL_5E_MIN_YOUTUBE_REQUEST_INTERVAL_MS,
  buildAdaptiveSearchRequest,
  classifyYoutubeSearchQuotaFailure,
  createYoutubeApiPacer
} from "../scripts/run-youtube-culinary-adaptive-discovery.mjs";

function state() {
  return {
    schemaVersion: "youtube-culinary-daily-discovery-state-v1",
    policyRecheckedAt: "2026-09-05",
    assignedDailySearchLimit: 100,
    protectedReserveCalls: 5,
    completedQuotaDays: [],
    canonicalOutcomes: [],
    unresolvedPackets: [],
    hardHold: null,
    ytCul6Readiness: { earned: false },
    cumulative: { searchCalls: 0 }
  };
}

test("adaptive portfolio keeps a 90-call routine ceiling with a larger provider cushion", () => {
  assert.equal(YT_CUL_5E_DAILY_SEARCH_CAPACITY, 90);
  assert.ok(YT_CUL_5E_BASE_QUERY_PORTFOLIO.length >= 90);
  assert.equal(new Set(YT_CUL_5E_BASE_QUERY_PORTFOLIO.map(q => q.queryId)).size, YT_CUL_5E_BASE_QUERY_PORTFOLIO.length);
  assert.ok(YT_CUL_5E_BASE_QUERY_PORTFOLIO.every(q => ["channel", "playlist"].includes(q.resourceType)));
});

test("adaptive tranches consume 16 then 8-call reallocations and land exactly on 90", () => {
  const sizes = [];
  let used = 0;
  while (used < 90) {
    const size = nextTrancheSize(used);
    sizes.push(size);
    used += size;
  }
  assert.equal(used, 90);
  assert.equal(sizes[0], 16);
  assert.equal(sizes.at(-1), 2);
  assert.ok(sizes.slice(1, -1).every(size => size === 8));
});

test("three low-yield days do not create a global Search hold", () => {
  const s = state();
  s.completedQuotaDays = [
    { quotaDate: "2026-09-03", searchCalls: 8, reviewReadyPacketsCreated: 0 },
    { quotaDate: "2026-09-04", searchCalls: 8, reviewReadyPacketsCreated: 0 },
    { quotaDate: "2026-09-05", searchCalls: 8, reviewReadyPacketsCreated: 0 }
  ];
  const gate = evaluateAdaptivePreSearchGate(s, { now: new Date("2026-09-06T09:20:00Z"), quotaDate: "2026-09-06" });
  assert.equal(gate.searchAllowed, true);
  assert.equal(gate.dailyCapacity, 90);
});

test("obsolete low-marginal-value hold is recoverable under the adaptive portfolio law", () => {
  const s = state();
  s.hardHold = "DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE";
  const gate = evaluateAdaptivePreSearchGate(s, { now: new Date("2026-09-06T09:20:00Z"), quotaDate: "2026-09-06" });
  assert.equal(gate.searchAllowed, true);
});

test("review backlog remains a genuine hard gate", () => {
  const s = state();
  s.unresolvedPackets = Array.from({ length: 40 }, (_, i) => ({ packetId: `p${i}` }));
  const gate = evaluateAdaptivePreSearchGate(s, { now: new Date("2026-09-06T09:20:00Z"), quotaDate: "2026-09-06" });
  assert.equal(gate.searchAllowed, false);
  assert.equal(gate.terminalState, "DAILY_SEARCH_HOLD_REVIEW_BACKLOG");
});

test("weak same-day focus is cooled and quota is reallocated to stronger and exploratory focuses", () => {
  const s = state();
  const portfolio = buildAdaptiveQueryPortfolio({ state: s });
  const metrics = {
    CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES: { searchCalls: 8, independentPagesReviewed: 0, recipeStructuredPagesConfirmed: 0, reviewCandidatesConsidered: 0, reviewReadyPacketsCreated: 0, duplicatePairsSuppressed: 0, uniqueUsefulSourceDomains: 0 },
    OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED: { searchCalls: 4, independentPagesReviewed: 6, recipeStructuredPagesConfirmed: 4, reviewCandidatesConsidered: 4, reviewReadyPacketsCreated: 3, duplicatePairsSuppressed: 0, uniqueUsefulSourceDomains: 3 }
  };
  const tranche = selectNextAdaptiveTranche({ state: s, portfolio, usedQueryIds: [], sameDayFocusMetrics: metrics, trancheSize: 8 });
  const pacific = tranche.queries.filter(q => q.focus === "OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED").length;
  const africa = tranche.queries.filter(q => q.focus === "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES").length;
  assert.ok(pacific > africa);
  assert.ok(new Set(tranche.queries.map(q => q.focus)).size > 1);
  assert.ok(tranche.explorationSlots >= Math.ceil(8 * YT_CUL_5E_EXPLORATION_FRACTION));
});

test("zero-evidence focus is fully cooled after the bounded same-day threshold", () => {
  const s = state();
  const portfolio = buildAdaptiveQueryPortfolio({ state: s });
  const metrics = {
    LEVANT_EASTERN_MEDITERRANEAN__PULSES_FLATBREAD: {
      searchCalls: YT_CUL_5E_ZERO_YIELD_COOL_AFTER_CALLS,
      independentPagesReviewed: 0,
      recipeStructuredPagesConfirmed: 0,
      reviewCandidatesConsidered: 0,
      reviewReadyPacketsCreated: 0,
      duplicatePairsSuppressed: 0,
      uniqueUsefulSourceDomains: 0
    }
  };
  const tranche = selectNextAdaptiveTranche({ state: s, portfolio, usedQueryIds: [], sameDayFocusMetrics: metrics, trancheSize: 8 });
  assert.equal(tranche.queries.filter(q => q.focus === "LEVANT_EASTERN_MEDITERRANEAN__PULSES_FLATBREAD").length, 0);
});

test("provider daily Search quota exhaustion near the routine ceiling is a safe close, while early exhaustion remains a hard hold", () => {
  const error = new Error("synthetic provider daily quota exhaustion");
  error.youtubeApiFailure = { endpoint: "search.list", httpStatus: 403, apiStatus: "RESOURCE_EXHAUSTED", apiReason: "quotaExceeded" };
  const near = classifyYoutubeSearchQuotaFailure(error, { searchCallsUsed: 87, searchCapacity: 90 });
  assert.equal(near.terminalState, "DAILY_DISCOVERY_PROVIDER_QUOTA_EXHAUSTED_SAFE_CLOSE");
  assert.equal(near.failureClass, "DAILY_QUOTA");
  assert.equal(near.nearRoutineCeiling, true);
  const early = classifyYoutubeSearchQuotaFailure(error, { searchCallsUsed: 40, searchCapacity: 90 });
  assert.equal(early.terminalState, "DAILY_SEARCH_HOLD_POLICY_OR_QUOTA");
  assert.equal(early.failureClass, "DAILY_QUOTA");
  assert.equal(early.nearRoutineCeiling, false);
  assert.equal(classifyYoutubeSearchQuotaFailure(new Error("other"), { searchCallsUsed: 89, searchCapacity: 90 }), null);
});

test("provider rateLimitExceeded is a distinct hard hold, never inferred as daily quota exhaustion", () => {
  const error = new Error("synthetic provider rate limit");
  error.youtubeApiFailure = {
    endpoint: "search.list",
    httpStatus: 429,
    apiStatus: "RESOURCE_EXHAUSTED",
    apiReason: "rateLimitExceeded",
    retryAfterSeconds: 2
  };
  const classified = classifyYoutubeSearchQuotaFailure(error, { searchCallsUsed: 83, searchCapacity: 90 });
  assert.equal(classified.terminalState, "DAILY_SEARCH_HOLD_RATE_LIMIT");
  assert.equal(classified.progressStatus, "PROVIDER_RATE_LIMIT_HOLD");
  assert.equal(classified.failureClass, "RATE_LIMIT");
  assert.equal(classified.nearRoutineCeiling, false);
  assert.equal(classified.retryAfterSeconds, 2);
});

test("YouTube API pacer enforces deterministic spacing without slowing tests", async () => {
  assert.equal(YT_CUL_5E_MIN_YOUTUBE_REQUEST_INTERVAL_MS, 1000);
  let now = 10000;
  const sleeps = [];
  const pacer = createYoutubeApiPacer({
    minIntervalMs: 1000,
    nowMs: () => now,
    sleepImpl: async ms => { sleeps.push(ms); now += ms; }
  });
  await pacer();
  await pacer();
  now += 400;
  await pacer();
  assert.deepEqual(sleeps, [1000, 600]);
});

test("promising same-day discovery creates bounded candidate-label follow-up searches", () => {
  const s = state();
  const packet = { packetId: "yt-cul-review-aaaaaaaaaaaaaaaaaaaaaaaa", candidateLabel: "Palusami", atlasGap: { macroRegion: "OCEANIA_PACIFIC", familyGap: "EARTH_OVEN_LEAF_WRAPPED", mealRoleGap: null, techniqueGap: null } };
  const portfolio = buildAdaptiveQueryPortfolio({ state: s, sameDayPackets: [packet] });
  const followups = portfolio.filter(q => q.sourcePacketId === packet.packetId);
  assert.equal(followups.length, 2);
  assert.ok(followups.every(q => q.queryOrigin === "PROVISIONAL_PACKET_FOLLOWUP"));
  assert.ok(followups.every(q => q.queryText.includes("Palusami")));
});

test("canonical accepted evidence is exploited while non-retryable rejection is not repeated", () => {
  const s = state();
  const context = { candidateLabel: "Palusami", atlasGap: { macroRegion: "OCEANIA_PACIFIC", familyGap: "EARTH_OVEN_LEAF_WRAPPED", mealRoleGap: null, techniqueGap: null } };
  s.canonicalOutcomes = [
    { packetId: "accepted", reviewDecision: "ACCEPTED", feedbackContext: context },
    { packetId: "rejected", reviewDecision: "REJECTED", feedbackContext: context }
  ];
  const portfolio = buildAdaptiveQueryPortfolio({ state: s });
  assert.equal(portfolio.filter(q => q.sourcePacketId === "accepted").length, 2);
  assert.equal(portfolio.filter(q => q.sourcePacketId === "rejected").length, 0);
});

test("adaptive Search request keeps strict safe search and API key out of URL", () => {
  const request = buildAdaptiveSearchRequest(YT_CUL_5E_BASE_QUERY_PORTFOLIO[0], "test-key");
  assert.equal(request.url.searchParams.get("safeSearch"), "strict");
  assert.equal(request.url.searchParams.get("key"), null);
  assert.equal(request.init.headers["X-Goog-Api-Key"], "test-key");
});
