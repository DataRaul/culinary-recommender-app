import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCanaryRequest,
  createSafeCanarySummary,
  validateCanaryConfig
} from "../scripts/run-youtube-culinary-connectivity-canary.mjs";

const VALID = {
  apiKey: "test-key-not-real",
  dailySearchLimit: "100",
  projectIdentity: "culinary-youtube-discovery",
  policyRecheckedAt: "2026-09-05"
};

test("YT-CUL-2 config requires verified quota and preserves five-call reserve", () => {
  const config = validateCanaryConfig(VALID);
  assert.equal(config.dailySearchLimit, 100);
  assert.throws(() => validateCanaryConfig({ ...VALID, dailySearchLimit: "5" }), /must exceed the 5-call reserve/);
  assert.throws(() => validateCanaryConfig({ ...VALID, dailySearchLimit: "" }), /positive integer/);
});

test("YT-CUL-2 config rejects Blue Lagoon/music project identity", () => {
  assert.throws(() => validateCanaryConfig({ ...VALID, projectIdentity: "youtube-blue-lagoon-lab" }), /must not identify Blue Lagoon\/music use/);
});

test("API key is carried in a header, never in the request URL", () => {
  const { url, init } = buildCanaryRequest(VALID.apiKey);
  assert.equal(url.searchParams.has("key"), false);
  assert.equal(url.toString().includes(VALID.apiKey), false);
  assert.equal(init.headers["X-Goog-Api-Key"], VALID.apiKey);
  assert.equal(url.searchParams.get("maxResults"), "1");
});

test("durable canary summary excludes raw YouTube metadata", () => {
  const config = validateCanaryConfig(VALID);
  const rawFixture = {
    items: [{
      id: { videoId: "private-fixture-id" },
      snippet: {
        title: "private fixture title",
        description: "private fixture description",
        channelTitle: "private fixture creator"
      }
    }]
  };
  const summary = createSafeCanarySummary({
    config,
    responsePayload: rawFixture,
    retrievedAt: "2026-09-05T18:30:00.000Z",
    transientCacheDeleted: true,
    httpStatus: 200
  });
  const durable = JSON.stringify(summary);
  assert.equal(summary.result, "PASS");
  assert.equal(summary.quota.plannedCalls, 1);
  assert.equal(summary.quota.executedCalls, 1);
  assert.equal(summary.quota.reserveCalls, 5);
  assert.equal(summary.api.resultSlotsObserved, 1);
  assert.equal(summary.transientCache.deletedBeforeJobExit, true);
  assert.equal(summary.rawYoutubeApiDataEmbedded, false);
  assert.equal(durable.includes("private fixture title"), false);
  assert.equal(durable.includes("private-fixture-id"), false);
  assert.equal(durable.includes(VALID.apiKey), false);
});
