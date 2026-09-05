import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  YT_CUL_4_SEARCH_PLAN,
  validateEfficiencyConfig,
  buildTypedSearchRequest,
  buildChannelsListRequest,
  buildPlaylistItemsRequest,
  buildVideosListRequest,
  classifyEfficiencyLane
} from "../scripts/run-youtube-culinary-channel-playlist-efficiency.mjs";

const API_KEY = "test-only-not-a-real-key";

test("YT-CUL-4 preregisters exactly eight channel/playlist Search calls", () => {
  assert.equal(YT_CUL_4_SEARCH_PLAN.length, 8);
  assert.equal(YT_CUL_4_SEARCH_PLAN.filter(query => query.resourceType === "channel").length, 4);
  assert.equal(YT_CUL_4_SEARCH_PLAN.filter(query => query.resourceType === "playlist").length, 4);
  assert.ok(YT_CUL_4_SEARCH_PLAN.every(query => ["CREATOR_OR_CHANNEL_DISCOVERY", "PLAYLIST_DISCOVERY"].includes(query.purpose)));
});

test("YT-CUL-4 preserves the five-call reserve after the 25 known prior calls", () => {
  const config = validateEfficiencyConfig({
    apiKey: API_KEY,
    dailySearchLimit: "100",
    priorSearchCalls: "25",
    projectIdentity: "culinary-youtube-discovery",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  });
  assert.equal(config.plannedSearchCalls, 8);
  assert.equal(100 - 5 - 25 - config.plannedSearchCalls, 62);
});

test("YT-CUL-4 fails closed if Search use would cross the reserve", () => {
  assert.throws(() => validateEfficiencyConfig({
    apiKey: API_KEY,
    dailySearchLimit: "100",
    priorSearchCalls: "88",
    projectIdentity: "culinary-youtube-discovery",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  }), /protected 5-call Search reserve/);
});

test("YT-CUL-4 rejects Blue Lagoon or music project identities", () => {
  assert.throws(() => validateEfficiencyConfig({
    apiKey: API_KEY,
    dailySearchLimit: "100",
    priorSearchCalls: "25",
    projectIdentity: "blue-lagoon-music",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  }), /isolated from Blue Lagoon\/music/);
});

test("typed Search uses strict safe search, one page and header key", () => {
  const request = buildTypedSearchRequest(YT_CUL_4_SEARCH_PLAN[0], API_KEY);
  assert.equal(request.url.searchParams.get("type"), "channel");
  assert.equal(request.url.searchParams.get("maxResults"), "10");
  assert.equal(request.url.searchParams.get("safeSearch"), "strict");
  assert.equal(request.url.searchParams.get("key"), null);
  assert.equal(request.init.headers["X-Goog-Api-Key"], API_KEY);
  assert.equal(request.url.searchParams.get("pageToken"), null);
});

test("lower-cost read requests keep API key out of URL and remain bounded", () => {
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

test("terminal efficiency classification is preregistered and deterministic", () => {
  assert.equal(classifyEfficiencyLane({
    callsExecuted: 8,
    externalSourcePointers: 40,
    independentlyReviewedCandidates: 12,
    independentlyConfirmedRecipePages: 4,
    uniqueConfirmedSourceDomains: 4
  }), "YT_CUL_4_CHANNEL_PLAYLIST_EFFICIENCY_GAIN");

  assert.equal(classifyEfficiencyLane({
    callsExecuted: 8,
    externalSourcePointers: 30,
    independentlyReviewedCandidates: 10,
    independentlyConfirmedRecipePages: 3,
    uniqueConfirmedSourceDomains: 3
  }), "YT_CUL_4_USEFUL_NO_CLEAR_EFFICIENCY_GAIN");

  assert.equal(classifyEfficiencyLane({
    callsExecuted: 8,
    externalSourcePointers: 5,
    independentlyReviewedCandidates: 2,
    independentlyConfirmedRecipePages: 0,
    uniqueConfirmedSourceDomains: 0
  }), "YT_CUL_4_LOW_MARGINAL_VALUE");
});

test("YT-CUL-4 source contains no YouTube statistics or audiovisual acquisition path", async () => {
  const source = await readFile(new URL("../scripts/run-youtube-culinary-channel-playlist-efficiency.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /part["']?\s*[,=]\s*["'][^"']*statistics/i);
  assert.doesNotMatch(source, /commentThreads|comments\.list|captions\.download|videos\.batchGetStats/i);
  assert.match(source, /rawYoutubeApiDataEmbedded:\s*false/);
  assert.match(source, /youtubeDerivedCreatorQualityScoreCreated:\s*false/);
  assert.match(source, /automaticAtlasPromotionAuthorized:\s*false/);
  assert.match(source, /automaticAppAdmissionAuthorized:\s*false/);
});
