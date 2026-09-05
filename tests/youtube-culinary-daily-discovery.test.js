import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  YT_CUL_5D_DEFAULT_BUDGET,
  YT_CUL_5D_MIN_BUDGET,
  YT_CUL_5D_MAX_BUDGET,
  YT_CUL_5D_QUERY_LIBRARY,
  createInitialDailyState,
  getYoutubeQuotaDate,
  chooseAdaptiveSearchBudget,
  evaluatePreSearchGate,
  selectDailyQueries,
  appendCompletedDay,
  applyCanonicalReviewBridge,
  policyVintageIsFresh
} from "../scripts/youtube-culinary-daily-control-plane.mjs";
import { createAtlasRelevanceReviewReadyPacket } from "../scripts/youtube-culinary-atlas-relevance-gate.mjs";
import { buildDailySearchRequest, relevanceMatches } from "../scripts/run-youtube-culinary-daily-discovery.mjs";

function packet(index = 0) {
  return createAtlasRelevanceReviewReadyPacket({
    candidateLabel: `Millet Porridge ${index}`,
    claimScope: "IDENTITY",
    atlasGap: { macroRegion: "CENTRAL_SOUTHERN_AFRICA", familyGap: "BREAKFAST_STAPLES", mealRoleGap: null, techniqueGap: null },
    sourceDomain: `source${index}.example`,
    sourceUrl: `https://source${index}.example/millet-porridge`,
    sourceRetrievedAt: "2026-09-06T09:20:00Z",
    machineEvidence: { recipeStructuredPage: true, candidateLabelsObserved: [`Millet Porridge ${index}`], ingredientTermsObserved: ["millet"], independentPageFingerprint: `0123456789abcde${index % 10}` },
    relevanceReason: "Independent Recipe page matches the bounded millet breakfast gap.",
    unresolvedAmbiguity: ["Canonical identity remains Knowledge Core review-bound."]
  });
}

test("YouTube quota date follows America/Los_Angeles rather than runner UTC", () => {
  assert.equal(getYoutubeQuotaDate(new Date("2026-09-06T06:59:59Z")), "2026-09-05");
  assert.equal(getYoutubeQuotaDate(new Date("2026-09-06T07:00:00Z")), "2026-09-06");
});

test("daily query library is exactly bounded at 32 and channel/playlist first", () => {
  assert.equal(YT_CUL_5D_QUERY_LIBRARY.length, 32);
  assert.ok(YT_CUL_5D_QUERY_LIBRARY.every(query => ["channel", "playlist"].includes(query.resourceType)));
  assert.ok(YT_CUL_5D_QUERY_LIBRARY.every(query => query.atlasGap?.macroRegion && query.atlasGap?.familyGap));
  assert.ok(YT_CUL_5D_QUERY_LIBRARY.every(query => Array.isArray(query.relevanceTerms) && query.relevanceTerms.length > 0));
});

test("first active quota day starts at 16 calls and preserves the five-call reserve", () => {
  const state = createInitialDailyState({ assignedDailySearchLimit: 100 });
  assert.equal(chooseAdaptiveSearchBudget(state), YT_CUL_5D_DEFAULT_BUDGET);
  assert.equal(selectDailyQueries({ state, budget: 16 }).length, 16);
  assert.ok(16 <= 100 - 5);
});

test("adaptive budget rises toward 32 only after useful multi-domain yield", () => {
  let state = createInitialDailyState();
  state = appendCompletedDay(state, {
    quotaDate: "2026-09-06", searchBudget: 16, searchCalls: 16, reviewCandidatesConsidered: 4,
    reviewReadyPacketsCreated: 3, duplicatePairsSuppressed: 0, uniqueUsefulSourceDomains: 3,
    largestSourceDomainShare: 1 / 3, independentPagesReviewed: 4, recipeStructuredPagesConfirmed: 3,
    terminalState: "DAILY_DISCOVERY_CONTINUE", focuses: ["A"]
  });
  assert.equal(chooseAdaptiveSearchBudget(state), 24);
  state = appendCompletedDay(state, {
    quotaDate: "2026-09-07", searchBudget: 24, searchCalls: 24, reviewCandidatesConsidered: 5,
    reviewReadyPacketsCreated: 4, duplicatePairsSuppressed: 0, uniqueUsefulSourceDomains: 4,
    largestSourceDomainShare: 0.25, independentPagesReviewed: 5, recipeStructuredPagesConfirmed: 4,
    terminalState: "DAILY_DISCOVERY_CONTINUE", focuses: ["B"]
  });
  assert.equal(chooseAdaptiveSearchBudget(state), YT_CUL_5D_MAX_BUDGET);
});

test("adaptive budget falls toward 8 when yield or diversity deteriorates", () => {
  let state = createInitialDailyState();
  state = appendCompletedDay(state, {
    quotaDate: "2026-09-06", searchBudget: 16, searchCalls: 16, reviewCandidatesConsidered: 4,
    reviewReadyPacketsCreated: 0, duplicatePairsSuppressed: 3, uniqueUsefulSourceDomains: 1,
    largestSourceDomainShare: 1, independentPagesReviewed: 3, recipeStructuredPagesConfirmed: 1,
    terminalState: "DAILY_DISCOVERY_CONTINUE_REDUCED_BUDGET", focuses: ["A"]
  });
  assert.equal(chooseAdaptiveSearchBudget(state), YT_CUL_5D_MIN_BUDGET);
});

test("three consecutive zero-packet active days trigger low-marginal-value hold before Search", () => {
  let state = createInitialDailyState();
  for (const quotaDate of ["2026-09-06", "2026-09-07", "2026-09-08"]) {
    state = appendCompletedDay(state, {
      quotaDate, searchBudget: 8, searchCalls: 8, reviewCandidatesConsidered: 0, reviewReadyPacketsCreated: 0,
      duplicatePairsSuppressed: 0, uniqueUsefulSourceDomains: 0, largestSourceDomainShare: 0,
      independentPagesReviewed: 0, recipeStructuredPagesConfirmed: 0,
      terminalState: "DAILY_DISCOVERY_CONTINUE_REDUCED_BUDGET", focuses: [quotaDate]
    });
  }
  const gate = evaluatePreSearchGate(state, { now: new Date("2026-09-09T09:20:00Z"), quotaDate: "2026-09-09" });
  assert.equal(gate.searchAllowed, false);
  assert.equal(gate.terminalState, "DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE");
  assert.equal(gate.budget, 0);
});

test("40 unresolved packets trigger review-backlog hold before Search", () => {
  const state = createInitialDailyState();
  state.unresolvedPackets = Array.from({ length: 40 }, (_, index) => packet(index));
  const gate = evaluatePreSearchGate(state, { now: new Date("2026-09-06T09:20:00Z"), quotaDate: "2026-09-06" });
  assert.equal(gate.searchAllowed, false);
  assert.equal(gate.terminalState, "DAILY_SEARCH_HOLD_REVIEW_BACKLOG");
});

test("same Pacific quota day cannot spend Search twice", () => {
  let state = createInitialDailyState();
  state = appendCompletedDay(state, {
    quotaDate: "2026-09-06", searchBudget: 16, searchCalls: 16, reviewCandidatesConsidered: 1,
    reviewReadyPacketsCreated: 1, duplicatePairsSuppressed: 0, uniqueUsefulSourceDomains: 1,
    largestSourceDomainShare: 1, independentPagesReviewed: 1, recipeStructuredPagesConfirmed: 1,
    terminalState: "DAILY_DISCOVERY_CONTINUE", focuses: ["A"]
  });
  const gate = evaluatePreSearchGate(state, { now: new Date("2026-09-06T18:00:00Z"), quotaDate: "2026-09-06" });
  assert.equal(gate.searchAllowed, false);
  assert.equal(gate.terminalState, "DAILY_SEARCH_HOLD_ALREADY_COMPLETED_QUOTA_DAY");
});

test("stale policy vintage fails closed", () => {
  assert.equal(policyVintageIsFresh("2026-09-05", new Date("2026-09-20T00:00:00Z")), true);
  assert.equal(policyVintageIsFresh("2026-09-05", new Date("2026-10-10T00:00:00Z")), false);
});

test("canonical bridge alone can earn YT-CUL-6 and removes resolved packet from backlog", () => {
  const p = packet(1);
  const state = createInitialDailyState();
  state.unresolvedPackets = [p];
  const next = applyCanonicalReviewBridge(state, {
    schemaVersion: "youtube-culinary-canonical-review-bridge-v1",
    outcomes: [{
      packetId: p.packetId,
      reviewDecision: "ACCEPTED",
      reviewAuthority: "KNOWLEDGE_CORE_ATLAS_REVIEW",
      appAuthoringEligible: true,
      independentNonYoutubeEvidence: true,
      rightsProvenanceSafetyClear: true,
      knowledgeCoreCommit: "abc123"
    }]
  });
  assert.equal(next.unresolvedPackets.length, 0);
  assert.equal(next.ytCul6Readiness.earned, true);
  assert.equal(next.hardHold, "YT_CUL_6_READINESS_EARNED");
});

test("Search request uses strict safe search and header key, not URL key", () => {
  const request = buildDailySearchRequest(YT_CUL_5D_QUERY_LIBRARY[0], "test-key");
  assert.equal(request.url.searchParams.get("type"), "channel");
  assert.equal(request.url.searchParams.get("safeSearch"), "strict");
  assert.equal(request.url.searchParams.get("key"), null);
  assert.equal(request.init.headers["X-Goog-Api-Key"], "test-key");
});

test("relevance pre-screen requires independent page text/name to match bounded gap terms", () => {
  const query = YT_CUL_5D_QUERY_LIBRARY.find(item => item.focus === "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES");
  assert.deepEqual(relevanceMatches("<p>Traditional millet porridge</p>", "Breakfast Bowl", query).includes("millet"), true);
  assert.equal(relevanceMatches("<p>Chocolate cake</p>", "Chocolate Cake", query).length, 0);
});

test("YT-CUL-5D source contains no YouTube statistics, audiovisual download, auto-promotion or Blue Lagoon cross-use", async () => {
  const source = await readFile(new URL("../scripts/run-youtube-culinary-daily-discovery.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /part["']?\s*[,=:]\s*["'][^"']*statistics/i);
  assert.doesNotMatch(source, /commentThreads|comments\.list|captions\.download|subscriberCount|viewCount|likeCount|commentCount/i);
  assert.match(source, /rawYoutubeApiDataEmbedded:\s*false/);
  assert.match(source, /automaticAtlasPromotionAuthorized:\s*false/);
  assert.match(source, /automaticAppAdmissionAuthorized:\s*false/);
  assert.match(source, /blueLagoonCrossUse:\s*false/);
});
