import assert from "node:assert/strict";
import test from "node:test";
import {
  YT_CUL_3_SEARCH_PLAN,
  buildSearchRequest,
  buildVideosListRequest,
  classifyPilot,
  extractExternalUrls,
  isPublicIpAddress,
  validatePilotConfig
} from "../scripts/run-youtube-culinary-discovery-pilot.mjs";

test("YT-CUL-3 preregisters exactly 24 bounded Search calls", () => {
  assert.equal(YT_CUL_3_SEARCH_PLAN.length, 24);
  assert.equal(new Set(YT_CUL_3_SEARCH_PLAN.map(entry => entry.queryId)).size, 24);
  assert.ok(YT_CUL_3_SEARCH_PLAN.every(entry => entry.queryText && entry.purpose));
});

test("pilot config preserves the five-call reserve after prior canary use", () => {
  const config = validatePilotConfig({
    apiKey: "test-key-not-secret",
    dailySearchLimit: "100",
    priorSearchCalls: "1",
    projectIdentity: "culinary-youtube-discovery",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  });
  assert.equal(config.plannedSearchCalls, 24);
  assert.equal(config.dailySearchLimit - 5 - config.priorSearchCalls - config.plannedSearchCalls, 70);
});

test("pilot config fails closed if prior use would cross reserve", () => {
  assert.throws(() => validatePilotConfig({
    apiKey: "test-key-not-secret",
    dailySearchLimit: "100",
    priorSearchCalls: "72",
    projectIdentity: "culinary-youtube-discovery",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  }), /protected 5-call Search reserve/);
});

test("pilot rejects Blue Lagoon or music project identities", () => {
  assert.throws(() => validatePilotConfig({
    apiKey: "test-key-not-secret",
    dailySearchLimit: "100",
    priorSearchCalls: "1",
    projectIdentity: "blue-lagoon-music",
    policyRecheckedAt: "2026-09-05",
    quotaDate: "2026-09-05"
  }), /isolated from Blue Lagoon\/music/);
});

test("Search request uses header key, strict safe search, one page and 25 slots", () => {
  const request = buildSearchRequest(YT_CUL_3_SEARCH_PLAN[0], "sensitive-test-key");
  assert.equal(request.url.origin + request.url.pathname, "https://www.googleapis.com/youtube/v3/search");
  assert.equal(request.url.searchParams.get("part"), "snippet");
  assert.equal(request.url.searchParams.get("type"), "video");
  assert.equal(request.url.searchParams.get("maxResults"), "25");
  assert.equal(request.url.searchParams.get("safeSearch"), "strict");
  assert.equal(request.url.toString().includes("sensitive-test-key"), false);
  assert.equal(request.init.headers["X-Goog-Api-Key"], "sensitive-test-key");
  assert.equal(request.url.searchParams.has("pageToken"), false);
});

test("videos.list enrichment is batched and keeps the key out of the URL", () => {
  const request = buildVideosListRequest(["v1", "v2"], "sensitive-test-key");
  assert.equal(request.url.origin + request.url.pathname, "https://www.googleapis.com/youtube/v3/videos");
  assert.equal(request.url.searchParams.get("part"), "snippet");
  assert.equal(request.url.searchParams.get("id"), "v1,v2");
  assert.equal(request.url.toString().includes("sensitive-test-key"), false);
  assert.equal(request.init.headers["X-Goog-Api-Key"], "sensitive-test-key");
  assert.throws(() => buildVideosListRequest(Array.from({ length: 51 }, (_, index) => `v${index}`), "k"), /1\.\.50 IDs/);
});

test("external URL extraction excludes YouTube and social/link-hub destinations", () => {
  const urls = extractExternalUrls("Full recipe https://example.com/recipe and https://youtube.com/watch?v=x plus www.instagram.com/test and https://food.example.org/a).");
  assert.deepEqual(urls, ["https://example.com/recipe", "https://food.example.org/a"]);
});

test("network-safety helper rejects private/reserved addresses", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.1.1", "100.64.1.1", "203.0.113.5", "::1", "fc00::1", "2001:db8::1"]) {
    assert.equal(isPublicIpAddress(address), false, address);
  }
  assert.equal(isPublicIpAddress("8.8.8.8"), true);
  assert.equal(isPublicIpAddress("1.1.1.1"), true);
});

test("terminal classification is preregistered and deterministic", () => {
  assert.equal(classifyPilot({
    callsExecuted: 24,
    uniqueCandidatePointers: 500,
    externalSourcePointers: 25,
    independentlyReviewedCandidates: 16,
    independentlyConfirmedRecipePages: 10,
    uniqueConfirmedSourceDomains: 7
  }), "YOUTUBE_CULINARY_DISCOVERY_HIGH_INFORMATION_GAIN");

  assert.equal(classifyPilot({
    callsExecuted: 24,
    uniqueCandidatePointers: 350,
    externalSourcePointers: 8,
    independentlyReviewedCandidates: 5,
    independentlyConfirmedRecipePages: 2,
    uniqueConfirmedSourceDomains: 2
  }), "YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND");

  assert.equal(classifyPilot({
    callsExecuted: 24,
    uniqueCandidatePointers: 80,
    externalSourcePointers: 1,
    independentlyReviewedCandidates: 1,
    independentlyConfirmedRecipePages: 0,
    uniqueConfirmedSourceDomains: 0
  }), "YOUTUBE_CULINARY_DISCOVERY_LOW_MARGINAL_VALUE");
});
