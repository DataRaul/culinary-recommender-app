import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  YT_CUL_5_SEARCH_PLAN,
  validateAtlasCadenceConfig,
  buildAtlasSearchRequest,
  buildChannelsListRequest,
  buildPlaylistItemsRequest,
  buildVideosListRequest,
  extractIndependentRecipeNames,
  createIndependentIdentityCandidate,
  classifyAtlasCadence
} from "../scripts/run-youtube-culinary-atlas-expansion-cadence.mjs";

const API_KEY = "test-only-not-a-real-key";

test("YT-CUL-5 preregisters ten bounded channel/playlist Search calls across five focus areas", () => {
  assert.equal(YT_CUL_5_SEARCH_PLAN.length, 10);
  assert.equal(YT_CUL_5_SEARCH_PLAN.filter(query => query.resourceType === "channel").length, 5);
  assert.equal(YT_CUL_5_SEARCH_PLAN.filter(query => query.resourceType === "playlist").length, 5);
  assert.equal(new Set(YT_CUL_5_SEARCH_PLAN.map(query => query.focus)).size, 5);
  assert.ok(YT_CUL_5_SEARCH_PLAN.every(query => ["CREATOR_OR_CHANNEL_DISCOVERY", "PLAYLIST_DISCOVERY"].includes(query.purpose)));
});

test("YT-CUL-5 preserves the five-call reserve after the 33 known prior Search calls", () => {
  const config = validateAtlasCadenceConfig({
    apiKey: API_KEY,
    dailySearchLimit: "100",
    priorSearchCalls: "33",
    projectIdentity: "culinary-youtube-discovery",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  });
  assert.equal(config.plannedSearchCalls, 10);
  assert.equal(100 - 5 - 33 - config.plannedSearchCalls, 52);
});

test("YT-CUL-5 fails closed if Search use would cross the protected reserve", () => {
  assert.throws(() => validateAtlasCadenceConfig({
    apiKey: API_KEY,
    dailySearchLimit: "100",
    priorSearchCalls: "86",
    projectIdentity: "culinary-youtube-discovery",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  }), /protected 5-call Search reserve/);
});

test("YT-CUL-5 rejects Blue Lagoon or music project identities", () => {
  assert.throws(() => validateAtlasCadenceConfig({
    apiKey: API_KEY,
    dailySearchLimit: "100",
    priorSearchCalls: "33",
    projectIdentity: "blue-lagoon-music",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  }), /isolated from Blue Lagoon\/music/);
});

test("typed Search uses strict safe search, one page and header key", () => {
  const request = buildAtlasSearchRequest(YT_CUL_5_SEARCH_PLAN[0], API_KEY);
  assert.equal(request.url.searchParams.get("type"), "channel");
  assert.equal(request.url.searchParams.get("maxResults"), "10");
  assert.equal(request.url.searchParams.get("safeSearch"), "strict");
  assert.equal(request.url.searchParams.get("key"), null);
  assert.equal(request.init.headers["X-Goog-Api-Key"], API_KEY);
  assert.equal(request.url.searchParams.get("pageToken"), null);
});

test("lower-cost read requests remain bounded and keep the API key out of URLs", () => {
  const channels = buildChannelsListRequest(["channel-a", "channel-b"], API_KEY);
  assert.equal(channels.url.searchParams.get("part"), "contentDetails");
  assert.equal(channels.url.searchParams.get("key"), null);
  assert.equal(channels.init.headers["X-Goog-Api-Key"], API_KEY);

  const playlist = buildPlaylistItemsRequest("playlist-a", API_KEY);
  assert.equal(playlist.url.searchParams.get("part"), "contentDetails");
  assert.equal(playlist.url.searchParams.get("maxResults"), "25");
  assert.equal(playlist.url.searchParams.get("pageToken"), null);
  assert.equal(playlist.url.searchParams.get("key"), null);

  const videos = buildVideosListRequest(["video-a", "video-b"], API_KEY);
  assert.equal(videos.url.searchParams.get("part"), "snippet");
  assert.equal(videos.url.searchParams.get("key"), null);
  assert.equal(videos.init.headers["X-Goog-Api-Key"], API_KEY);
});

test("independent Recipe JSON-LD names can create discovery-only identity handoffs", () => {
  const html = `<!doctype html><html><head><script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: "Example" },
      { "@type": ["Recipe", "CreativeWork"], name: "  Example   Millet Stew  " }
    ]
  })}</script></head><body></body></html>`;
  assert.deepEqual(extractIndependentRecipeNames(html), ["Example Millet Stew"]);

  const candidate = createIndependentIdentityCandidate({
    candidateLabel: "Example Millet Stew",
    sourceDomain: "recipes.example",
    sourceUrl: "https://recipes.example/example-millet-stew"
  });
  assert.equal(candidate.candidateLabel, "Example Millet Stew");
  assert.equal(candidate.evidenceRole, "INDEPENDENT_RECIPE_PAGE_DISCOVERY_ONLY");
  assert.equal(candidate.handoff.candidateKind, "IDENTITY");
  assert.equal(candidate.handoff.evidenceOrigin, "INDEPENDENT_NON_YOUTUBE_SOURCE");
  assert.equal(candidate.handoff.automaticAtlasPromotionAuthorized, false);
  assert.equal(candidate.handoff.automaticAppAdmissionAuthorized, false);
  assert.equal(candidate.atlasStateChanged, false);
  assert.equal(candidate.appStateChanged, false);
});

test("candidate extraction ignores non-Recipe JSON-LD", () => {
  const html = `<script type="application/ld+json">${JSON.stringify({ "@type": "Article", name: "Not a recipe" })}</script>`;
  assert.deepEqual(extractIndependentRecipeNames(html), []);
});

test("terminal Atlas cadence classification is preregistered and deterministic", () => {
  assert.equal(classifyAtlasCadence({
    callsExecuted: 10,
    independentlyReviewedCandidates: 12,
    independentlyConfirmedRecipePages: 5,
    uniqueConfirmedSourceDomains: 4,
    atlasCandidateHandoffs: 5
  }), "YT_CUL_5_ATLAS_EXPANSION_CADENCE_EARNED");

  assert.equal(classifyAtlasCadence({
    callsExecuted: 10,
    independentlyReviewedCandidates: 9,
    independentlyConfirmedRecipePages: 3,
    uniqueConfirmedSourceDomains: 3,
    atlasCandidateHandoffs: 3
  }), "YT_CUL_5_USEFUL_BUT_REVIEW_BOUND");

  assert.equal(classifyAtlasCadence({
    callsExecuted: 10,
    independentlyReviewedCandidates: 2,
    independentlyConfirmedRecipePages: 0,
    uniqueConfirmedSourceDomains: 0,
    atlasCandidateHandoffs: 0
  }), "YT_CUL_5_LOW_MARGINAL_VALUE");
});

test("YT-CUL-5 source creates no YouTube statistics, audiovisual, or automatic-promotion path", async () => {
  const source = await readFile(new URL("../scripts/run-youtube-culinary-atlas-expansion-cadence.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /part["']?\s*[,=]\s*["'][^"']*statistics/i);
  assert.doesNotMatch(source, /commentThreads|comments\.list|captions\.download|videos\.batchGetStats/i);
  assert.match(source, /rawYoutubeApiDataEmbedded:\s*false/);
  assert.match(source, /youtubeDerivedCreatorQualityScoreCreated:\s*false/);
  assert.match(source, /automaticAtlasPromotionAuthorized:\s*false/);
  assert.match(source, /automaticAppAdmissionAuthorized:\s*false/);
  assert.match(source, /knowledgeCoreStateChanged:\s*false/);
});
