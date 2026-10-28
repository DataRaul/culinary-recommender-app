import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadBarbecueConfig } from "../scripts/barbecue-technique-corpus-control-plane.mjs";
import {
  metadataReviewQueue, selectMetadataPilot, preflightMetadataPilot, metadataPolicyFresh,
  expireMetadataSnapshot, validateMetadataSnapshot, runMetadataAdapter,
  METADATA_MAX_BATCH, METADATA_SCHEMA
} from "../scripts/barbecue-metadata-review-adapter.mjs";

const config = await loadBarbecueConfig();
const state = JSON.parse(await readFile("data/generated/barbecue-technique-corpus-state.json", "utf8"));
const now = new Date("2026-10-28T19:00:00.000Z");
const queue = metadataReviewQueue(state, config);
const pilot = selectMetadataPilot(queue);
const identity = "culinary-youtube-discovery";
function quotaProof(remaining = 20, reserve = 5) {
  return { source: "OWNER_VERIFIED_GOOGLE_CLOUD_CONSOLE", quotaDate: "2026-10-28",
    verifiedAt: "2026-10-28T18:00:00Z", projectIdentity: identity,
    remainingMetadataUnits: remaining, protectedReserveUnits: reserve };
}
function mockResponses({ missing = [], mismatch = [], missingChannels = [], failOn = null,
  nextPage = false, lookupQueue = queue } = {}) {
  const calls = [];
  const fn = async (url, options) => {
    const u = new URL(url);
    const endpoint = u.pathname.endsWith("/videos") ? "videos.list" :
      u.pathname.endsWith("/channels") ? "channels.list" : "forbidden";
    const ids = u.searchParams.get("id").split(",");
    calls.push({ endpoint, ids, url, options });
    if (failOn === endpoint) return { ok: false, status: 403, json: async () => ({ error: { message: "SECRET_RAW_PROVIDER_RESPONSE" } }) };
    const items = endpoint === "videos.list" ?
      ids.filter(id => !missing.includes(id)).map(id => {
        const q = lookupQueue.find(r => r.youtubeVideoRef === id);
        return { id, snippet: { channelId: mismatch.includes(id) ? "different-channel" : q.priorCreatorChannelRefs[0],
          title: "RAW FORBIDDEN TITLE", description: "RAW FORBIDDEN DESCRIPTION" } };
      }) :
      ids.filter(id => !missingChannels.includes(id)).map(id => ({ id, snippet: { title: "RAW CHANNEL TITLE" } }));
    return { ok: true, status: 200, json: async () => ({ items, ...(nextPage ? { nextPageToken: "unauthorized-page" } : {}) }) };
  };
  return { calls, fn };
}
function args(selected, mock, overrides = {}) {
  return { state, config, selected, fetchImpl: mock.fn, now, enabled: true, approved: true,
    apiKey: "not-a-real-secret", identity, quotaProof: quotaProof(), mode: "pilot",
    beforeRequest: async () => {}, ...overrides };
}

test("P0A inventory: all 44 pending pointers, canonical IDs only, stable cross-leaf dedup", () => {
  const pending = state.leaves.flatMap(l => l.candidatePointers.filter(p => p.qualificationStatus === "PENDING_REVIEW"));
  assert.equal(pending.length, 44);
  assert.equal(queue.length, new Set(pending.map(p => p.youtubeVideoRef)).size);
  assert.equal(queue.filter(x => x.crossLeafDuplicate).length >= 1, true);
  assert.ok(queue.find(x => x.youtubeVideoRef === "5zuQFx2J0jM")?.crossLeafDuplicate);
  assert.equal(pilot.length, 3);
  assert.ok(pilot.every(p => p.leafIds.includes("pork_ribs_competition") && !p.sameChannelAlreadyQualified));
  assert.equal(new Set(pilot.map(x => x.priorCreatorChannelRefs[0])).size, pilot.length);
  assert.ok(pilot.every(p => !p.leafIds.includes("poultry_chicken_competition")));
});

test("P0A fail-closed preflight, independent metadata quota, policy date, credentials and reserve", () => {
  const base = { state, config, now, selected: pilot, enabled: true, approved: true,
    apiKey: "fixture", identity, quotaProof: quotaProof() };
  assert.equal(preflightMetadataPilot(base).allowed, true);
  assert.equal(preflightMetadataPilot(base).estimatedMaxUnits, 2);
  assert.equal(preflightMetadataPilot({ ...base, enabled: false }).code, "BLOCKED_METADATA_DEFAULT_OFF");
  assert.equal(preflightMetadataPilot({ ...base, approved: false }).code, "BLOCKED_LIVE_METADATA_NOT_APPROVED");
  assert.equal(preflightMetadataPilot({ ...base, apiKey: "" }).code, "BLOCKED_LIVE_METADATA_ACCESS");
  assert.equal(preflightMetadataPilot({ ...base, identity: "Blue Lagoon music" }).code, "BLOCKED_LIVE_METADATA_ACCESS");
  assert.equal(preflightMetadataPilot({ ...base, quotaProof: null }).code, "BLOCKED_METADATA_QUOTA_UNVERIFIED");
  assert.equal(preflightMetadataPilot({ ...base, quotaProof: quotaProof(6, 5) }).code, "BLOCKED_METADATA_QUOTA_RESERVE");
  assert.equal(preflightMetadataPilot({ ...base, quotaProof: quotaProof(20, 4) }).code, "BLOCKED_METADATA_QUOTA_UNVERIFIED");
  assert.equal(preflightMetadataPilot({ ...base, selected: queue }).code, "BLOCKED_METADATA_PILOT_SCOPE");
  assert.equal(metadataPolicyFresh(config, new Date("2026-12-01T12:00:00Z")), false);
  assert.equal(preflightMetadataPilot({ ...base, now: new Date("2026-12-01T12:00:00Z") }).code, "BLOCKED_METADATA_POLICY_EXPIRED");
});

test("P0B pilot: only existing ID lookups, 2 read-only calls, minimal metadata and no qualification", async () => {
  const mock = mockResponses();
  const checkpoints = [];
  const result = await runMetadataAdapter(args(pilot, mock, { checkpoint: async x => checkpoints.push(x) }));
  assert.equal(result.terminal, "METADATA_TECHNICAL_PASS_EVIDENCE_PENDING");
  assert.equal(result.calls, 2);
  assert.deepEqual(mock.calls.map(x => x.endpoint), ["videos.list", "channels.list"]);
  assert.equal(mock.calls.reduce((n, x) => n + x.ids.length, 0), 6);
  assert.ok(mock.calls.every(x => x.ids.length <= METADATA_MAX_BATCH &&
    x.options.method === "GET" && x.url.startsWith("https://www.googleapis.com/youtube/v3/")));
  assert.ok(mock.calls[0].url.includes("fields="));
  assert.equal(result.snapshot.schemaVersion, METADATA_SCHEMA);
  assert.ok(result.snapshot.records.every(x => x.reviewerDecision === "NEEDS_EVIDENCE" &&
    x.credentialEvidenceRef === null && x.channelIntegrity === "MATCH" && x.channelAvailability === "FOUND"));
  assert.equal(result.snapshot.searchCalls, 0);
  assert.equal(result.snapshot.automaticPublicationAuthorized, false);
  assert.equal(result.snapshot.automaticKnowledgeCorePromotionAuthorized, false);
  assert.equal(result.snapshot.automaticAppAdmissionAuthorized, false);
  assert.equal(result.snapshot.d1MutationAuthorized, false);
  assert.equal(result.snapshot.paidServiceAuthorized, false);
  assert.equal(result.snapshot.requests.reduce((n, x) => n + x.costUnits, 0), 2);
  assert.equal(result.snapshot.requests.every(x => x.status === "COMPLETED"), true);
  assert.ok(checkpoints.some(x => x.requests.some(r => r.status === "RESERVED")));
  validateMetadataSnapshot(result.snapshot);
  const retained = JSON.stringify(result.snapshot);
  assert.doesNotMatch(retained, /RAW FORBIDDEN|RAW CHANNEL|SECRET_RAW|title|description|thumbnail|rawPayload/i);
});

test("P0C mock all 44 pointers with dedup, channel reuse, and <=50 batching; no external calls", async () => {
  const mock = mockResponses();
  const selected = queue;
  const r = await runMetadataAdapter(args(selected, mock, { mode: "mock" }));
  assert.equal(r.terminal, "METADATA_TECHNICAL_PASS_EVIDENCE_PENDING");
  assert.equal(r.snapshot.records.length, selected.length);
  assert.equal(r.snapshot.records.filter(x => x.crossLeafDuplicate).length >= 1, true);
  assert.equal(r.snapshot.records.every(x => x.reviewerDecision === "NEEDS_EVIDENCE"), true);
  assert.ok(mock.calls.every(x => x.ids.length <= 50));
  assert.ok(mock.calls.every(x => !x.url.includes("/search")));
  assert.ok(mock.calls.every(x => !x.url.includes("pageToken")));
  const replay = mockResponses();
  const again = await runMetadataAdapter(args(selected, replay, { mode: "mock", snapshot: r.snapshot }));
  assert.equal(again.calls, 0);
  assert.equal(replay.calls.length, 0);
  assert.deepEqual(again.snapshot, r.snapshot);
});

test("P0C larger existing-ID fixture uses 50-ID batches and never follows pages", async () => {
  const synthetic = structuredClone(state);
  for (let i = 0; i < 20; i++) {
    const target = synthetic.leaves.find(x => x.leafId === (i < 10 ? "fish_parrilla" : "vegetables_parrilla"));
    const id = String(i).padStart(11, "0");
    target.candidatePointers.push({
      sourceRef: "youtube:" + id, youtubeVideoRef: id, creatorChannelRef: "unique-channel-" + id,
      canonicalReference: "https://www.youtube.com/watch?v=" + id, leafId: target.leafId,
      queryId: "synthetic-only", queryClass: "SPECIALIST_FALLBACK_DISCOVERY",
      discoveredQuotaDate: "2026-10-28", qualificationStatus: "PENDING_REVIEW",
      automaticQualificationAuthorized: false
    });
  }
  const extended = metadataReviewQueue(synthetic, config);
  assert.ok(extended.length > 50);
  const mock = mockResponses({ lookupQueue: extended });
  const result = await runMetadataAdapter(args(extended, mock, { mode: "mock", state: synthetic }));
  assert.equal(result.terminal, "METADATA_TECHNICAL_PASS_EVIDENCE_PENDING");
  assert.equal(result.snapshot.records.length, extended.length);
  assert.equal(mock.calls.filter(x => x.endpoint === "videos.list").length, 2);
  assert.ok(mock.calls.every(x => x.ids.length <= 50 && !x.url.includes("pageToken")));
});

test("P0C missing, deleted or private unknown remain unresolved rather than falsely rejected", async () => {
  const mock = mockResponses({ missing: [pilot[0].youtubeVideoRef] });
  const r = await runMetadataAdapter(args(pilot, mock));
  assert.equal(r.terminal, "METADATA_PARTIAL_UNRESOLVED_EVIDENCE_PENDING");
  assert.equal(r.snapshot.records[0].sourceStatus, "MISSING_PRIVATE_OR_DELETED_UNDETERMINED");
  assert.equal(r.snapshot.records[0].channelAvailability, "UNRESOLVED");
  assert.equal(r.snapshot.records[0].reviewerDecision, "NEEDS_EVIDENCE");
});

test("P0C channel mismatch / missing channel remain fail-closed", async () => {
  const mismatch = mockResponses({ mismatch: [pilot[0].youtubeVideoRef],
    missingChannels: ["different-channel"] });
  const r = await runMetadataAdapter(args(pilot, mismatch));
  assert.equal(r.terminal, "METADATA_PARTIAL_UNRESOLVED_EVIDENCE_PENDING");
  assert.equal(r.snapshot.records[0].channelIntegrity, "MISMATCH_REQUIRES_REVIEW");
  assert.equal(r.snapshot.records[0].channelAvailability, "UNAVAILABLE");
});

test("P0C quota/provider errors charge only one reserved request and never replay automatically", async () => {
  const mock = mockResponses({ failOn: "videos.list" });
  const snapshots = [];
  const r = await runMetadataAdapter(args(pilot, mock, { checkpoint: async x => snapshots.push(x) }));
  assert.equal(r.terminal, "BLOCKED_METADATA_PROVIDER_OR_UNCERTAIN_SPEND");
  assert.equal(r.calls, 1);
  assert.equal(mock.calls.length, 1);
  assert.equal(snapshots.at(-1).requests[0].status, "FAILED");
  assert.doesNotMatch(JSON.stringify(snapshots), /SECRET_RAW_PROVIDER_RESPONSE/);
  const replay = mockResponses();
  await assert.rejects(runMetadataAdapter(args(pilot, replay, { snapshot: r.snapshot })), /BLOCKED_UNCERTAIN_METADATA_SPEND/);
  assert.equal(replay.calls.length, 0);
});

test("P0C unexpected provider pagination fails closed, no extra requests", async () => {
  const mock = mockResponses({ nextPage: true });
  const r = await runMetadataAdapter(args(pilot, mock));
  assert.equal(r.terminal, "BLOCKED_METADATA_PROVIDER_OR_UNCERTAIN_SPEND");
  assert.equal(r.calls, 1);
  assert.equal(mock.calls.length, 1);
});

test("P0C expiry purges API-derived metadata, never reuses stale snapshots", async () => {
  const mock = mockResponses();
  const r = await runMetadataAdapter(args(pilot, mock));
  const expiration = new Date(r.snapshot.expiresAt);
  assert.equal(expireMetadataSnapshot(r.snapshot, now)?.schemaVersion, METADATA_SCHEMA);
  assert.equal(expireMetadataSnapshot(r.snapshot, expiration), null);
  assert.equal(expireMetadataSnapshot(r.snapshot, new Date(expiration.getTime() + 1)), null);
  assert.equal(expireMetadataSnapshot(null), null);
});

test("P0C unauthorized external requests remain zero across all preflight failures", async () => {
  const mock = mockResponses();
  for (const overrides of [
    { enabled: false }, { approved: false }, { apiKey: "" },
    { quotaProof: null }, { quotaProof: quotaProof(6, 5) }
  ]) {
    const r = await runMetadataAdapter(args(pilot, mock, overrides));
    assert.ok(r.terminal.startsWith("BLOCKED"));
    assert.equal(r.calls, 0);
  }
  assert.equal(mock.calls.length, 0);
});
