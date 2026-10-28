import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createYoutubeApiPacer } from "./run-youtube-culinary-adaptive-discovery.mjs";
import { getYoutubeQuotaDate } from "./youtube-culinary-daily-control-plane.mjs";
import { assertPolicySafeDurableObject } from "./youtube-culinary-discovery-control-plane.mjs";
import { loadBarbecueConfig, validateBarbecueConfig, validateBarbecueState } from "./barbecue-technique-corpus-control-plane.mjs";

export const METADATA_SCHEMA = "barbecue-metadata-review-v1";
export const METADATA_COST_PER_REQUEST = 1;
export const METADATA_MAX_BATCH = 50;
export const METADATA_TTL_MS = 30 * 86400000;
export const METADATA_PILOT_MAX_IDS = 3;
const PRIORITY = ["pork_ribs_competition", "beef_brisket_competition", "vegetables_parrilla", "fish_parrilla"];
const ENDPOINTS = Object.freeze({
  "videos.list": "https://www.googleapis.com/youtube/v3/videos",
  "channels.list": "https://www.googleapis.com/youtube/v3/channels"
});
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = "data/generated/barbecue-metadata-pilot-evidence.json";
const isText = v => typeof v === "string" && v.length > 0;
const validDate = v => isText(v) && Number.isFinite(Date.parse(v));
const chunks = (items, n) => Array.from({ length: Math.ceil(items.length / n) }, (_, i) => items.slice(i * n, (i + 1) * n));
const clone = x => structuredClone(x);

export function metadataReviewQueue(state, config) {
  validateBarbecueState(state, config);
  const byId = new Map();
  for (const leafId of PRIORITY) {
    const leaf = state.leaves.find(x => x.leafId === leafId);
    if (!leaf || leaf.status === "COMPLETE") continue;
    for (const p of leaf.candidatePointers) {
      if (p.qualificationStatus !== "PENDING_REVIEW") continue;
      if (!/^youtube:[A-Za-z0-9_-]{11}$/.test(p.sourceRef) ||
          p.youtubeVideoRef !== p.sourceRef.slice(8) ||
          !isText(p.creatorChannelRef)) throw new Error("invalid existing candidate reference");
      let record = byId.get(p.youtubeVideoRef);
      if (!record) {
        record = { sourceRef: p.sourceRef, youtubeVideoRef: p.youtubeVideoRef,
          leafIds: [], priorCreatorChannelRefs: [], sameChannelAlreadyQualified: false };
        byId.set(p.youtubeVideoRef, record);
      }
      record.leafIds.push(leafId);
      if (!record.priorCreatorChannelRefs.includes(p.creatorChannelRef)) record.priorCreatorChannelRefs.push(p.creatorChannelRef);
      record.sameChannelAlreadyQualified ||= leaf.qualifiedSources.some(q => q.creatorChannelRef === p.creatorChannelRef);
    }
  }
  return [...byId.values()].map(r => ({
    ...r,
    leafIds: [...r.leafIds].sort(),
    crossLeafDuplicate: r.leafIds.length > 1
  }));
}

export function selectMetadataPilot(queue) {
  const ribs = queue.filter(r => r.leafIds.includes("pork_ribs_competition"));
  const selected = [];
  const seen = new Set();
  for (const row of ribs) {
    if (row.sameChannelAlreadyQualified) continue;
    const ref = row.priorCreatorChannelRefs[0];
    if (seen.has(ref)) continue;
    selected.push(row);
    seen.add(ref);
    if (selected.length === METADATA_PILOT_MAX_IDS) break;
  }
  if (!selected.length) throw new Error("BLOCKED_NO_INDEPENDENT_RIBS_PILOT_IDS");
  return selected;
}

export function metadataPolicyFresh(config, now = new Date()) {
  const reviewDate = Date.parse(String(config.policyRecheckedAt) + "T12:00:00Z");
  return Number.isFinite(reviewDate) &&
    now.getTime() >= reviewDate - 86400000 &&
    now.getTime() - reviewDate <= config.policyMaxAgeDays * 86400000;
}

export function preflightMetadataPilot({ state, config, now = new Date(), enabled = false,
  approved = false, apiKey = null, identity = null, quotaProof = null, selected = [] }) {
  validateBarbecueConfig(config);
  validateBarbecueState(state, config);
  if (!enabled) return { allowed: false, code: "BLOCKED_METADATA_DEFAULT_OFF" };
  if (!metadataPolicyFresh(config, now)) return { allowed: false, code: "BLOCKED_METADATA_POLICY_EXPIRED" };
  if (!approved) return { allowed: false, code: "BLOCKED_LIVE_METADATA_NOT_APPROVED" };
  if (!isText(apiKey) || !isText(identity) || /blue[ _-]*lagoon|music/i.test(identity)) {
    return { allowed: false, code: "BLOCKED_LIVE_METADATA_ACCESS" };
  }
  if (!Array.isArray(selected) || selected.length < 1 || selected.length > METADATA_PILOT_MAX_IDS ||
      selected.some(r => !r.leafIds?.includes("pork_ribs_competition"))) {
    return { allowed: false, code: "BLOCKED_METADATA_PILOT_SCOPE" };
  }
  const quotaDate = getYoutubeQuotaDate(now);
  // Explicit Google Cloud Console evidence is mandatory; repository search limits are NOT metadata quota evidence.
  if (quotaProof?.source !== "OWNER_VERIFIED_GOOGLE_CLOUD_CONSOLE" ||
      quotaProof.quotaDate !== quotaDate || quotaProof.projectIdentity !== identity ||
      !validDate(quotaProof.verifiedAt) ||
      Date.parse(quotaProof.verifiedAt) > now.getTime() ||
      now.getTime() - Date.parse(quotaProof.verifiedAt) > 86400000 ||
      !Number.isSafeInteger(quotaProof.remainingMetadataUnits) ||
      !Number.isSafeInteger(quotaProof.protectedReserveUnits) ||
      quotaProof.protectedReserveUnits < config.protectedReserveCalls) {
    return { allowed: false, code: "BLOCKED_METADATA_QUOTA_UNVERIFIED" };
  }
  const maxCalls = selected.length <= METADATA_MAX_BATCH ? 2 : 2 * Math.ceil(selected.length / METADATA_MAX_BATCH);
  if (quotaProof.remainingMetadataUnits - maxCalls * METADATA_COST_PER_REQUEST <
      quotaProof.protectedReserveUnits) {
    return { allowed: false, code: "BLOCKED_METADATA_QUOTA_RESERVE" };
  }
  return { allowed: true, code: "METADATA_LIVE_PREFLIGHT_PASS", quotaDate,
    estimatedMaxCalls: maxCalls, estimatedMaxUnits: maxCalls, protectedReserveUnits: quotaProof.protectedReserveUnits };
}

function buildRequest(method, ids, apiKey) {
  if (!ENDPOINTS[method] || !ids.length || ids.length > METADATA_MAX_BATCH) throw new Error("invalid bounded metadata request");
  const query = new URLSearchParams(method === "videos.list" ?
    { part: "snippet", fields: "items(id,snippet(channelId)),nextPageToken", id: ids.join(",") } :
    { part: "id", fields: "items(id),nextPageToken", id: ids.join(",") });
  return { url: ENDPOINTS[method] + "?" + query.toString(),
    init: { method: "GET", headers: { Accept: "application/json", "X-Goog-Api-Key": apiKey } } };
}

function ensureSnapshot(snapshot, selected, now) {
  if (!snapshot) return {
    schemaVersion: METADATA_SCHEMA, mode: "PILOT_METADATA_ONLY",
    requestedSourceRefs: selected.map(r => r.sourceRef),
    quotaDate: getYoutubeQuotaDate(now), createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + METADATA_TTL_MS).toISOString(),
    requests: [], records: [], completed: false, technicalOutcome: "IN_PROGRESS",
    automaticQualificationAuthorized: false,
    automaticPublicationAuthorized: false, automaticKnowledgeCorePromotionAuthorized: false,
    automaticAppAdmissionAuthorized: false, d1MutationAuthorized: false,
    paidServiceAuthorized: false, searchCalls: 0
  };
  if (snapshot.schemaVersion !== METADATA_SCHEMA || !validDate(snapshot.expiresAt) ||
      Date.parse(snapshot.expiresAt) <= now.getTime() ||
      snapshot.quotaDate !== getYoutubeQuotaDate(now) ||
      JSON.stringify(snapshot.requestedSourceRefs) !== JSON.stringify(selected.map(r => r.sourceRef)))
    throw new Error("BLOCKED_METADATA_SNAPSHOT_STALE_OR_DIFFERENT");
  if (snapshot.requests.some(r => r.status !== "COMPLETED"))
    throw new Error("BLOCKED_UNCERTAIN_METADATA_SPEND");
  return clone(snapshot);
}

export function expireMetadataSnapshot(snapshot, now = new Date()) {
  if (!snapshot || !validDate(snapshot.expiresAt) || Date.parse(snapshot.expiresAt) <= now.getTime())
    return null;
  return snapshot;
}

export function validateMetadataSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== METADATA_SCHEMA ||
      snapshot.searchCalls !== 0 || snapshot.automaticQualificationAuthorized !== false ||
      snapshot.automaticPublicationAuthorized !== false ||
      snapshot.automaticKnowledgeCorePromotionAuthorized !== false ||
      snapshot.automaticAppAdmissionAuthorized !== false ||
      snapshot.d1MutationAuthorized !== false || snapshot.paidServiceAuthorized !== false ||
      !Array.isArray(snapshot.requests) || !Array.isArray(snapshot.records)) throw new Error("invalid metadata snapshot");
  if (snapshot.requests.some(r => !["videos.list", "channels.list"].includes(r.method) ||
      r.costUnits !== METADATA_COST_PER_REQUEST ||
      !["RESERVED", "COMPLETED", "FAILED"].includes(r.status))) throw new Error("unsafe metadata request ledger");
  assertPolicySafeDurableObject(snapshot);
  return snapshot;
}

export async function runMetadataAdapter({ state, config, selected, fetchImpl, now = new Date(),
  enabled = false, approved = false, apiKey = null, identity = null, quotaProof = null,
  mode = "pilot", snapshot = null, checkpoint = async () => {},
  beforeRequest = null }) {
  if (mode !== "pilot" && mode !== "mock") throw new Error("unsupported metadata mode");
  if (mode === "mock" && typeof fetchImpl !== "function") throw new Error("mock requires injected fetch");
  if (mode === "pilot") {
    const gate = preflightMetadataPilot({ state, config, now, enabled, approved, apiKey, identity, quotaProof, selected });
    if (!gate.allowed) return { terminal: gate.code, snapshot: null, calls: 0 };
  } else {
    validateBarbecueState(state, config);
    if (!metadataPolicyFresh(config, now)) return { terminal: "BLOCKED_METADATA_POLICY_EXPIRED", snapshot: null, calls: 0 };
    const queueIds = new Set(metadataReviewQueue(state, config).map(x => x.sourceRef));
    if (selected.some(x => !queueIds.has(x.sourceRef))) throw new Error("mock selected unknown source");
  }
  if (!Array.isArray(selected) || !selected.length || new Set(selected.map(x => x.sourceRef)).size !== selected.length)
    throw new Error("missing or repeated metadata selection");
  if (selected.length > 100 && mode === "mock") throw new Error("mock metadata selection exceeds test-only cap");
  const safeKey = mode === "mock" ? "MOCK_ONLY" : apiKey;
  const fetcher = fetchImpl ?? fetch;
  const pace = beforeRequest ?? createYoutubeApiPacer({ minIntervalMs: config.minYoutubeRequestIntervalMs });
  const out = ensureSnapshot(snapshot, selected, now);
  const persist = async () => { validateMetadataSnapshot(out); await checkpoint(clone(out)); };
  if (out.completed) return { terminal: out.technicalOutcome, snapshot: out, calls: 0 };
  const existingRequests = new Map(out.requests.map(r => [r.key, r]));
  let calls = 0;
  async function call(method, ids) {
    const key = method + ":" + ids.join(",");
    if (existingRequests.has(key)) return null; // already completed; evidence compactly retained below
    const entry = { key, method, requested: ids.length, costUnits: 1, status: "RESERVED" };
    out.requests.push(entry);
    await persist(); // reserve BEFORE any network access; uncertain requests cannot replay automatically
    calls += 1;
    try {
      await pace();
      const response = await fetcher(...Object.values(buildRequest(method, ids, safeKey)));
      if (!response.ok) throw new Error("PROVIDER_HTTP_" + Number(response.status));
      const payload = await response.json();
      if (!Array.isArray(payload?.items) || payload.nextPageToken)
        throw new Error("UNEXPECTED_METADATA_RESPONSE_OR_PAGINATION");
      entry.status = "COMPLETED";
      await persist();
      return payload.items;
    } catch (error) {
      entry.status = "FAILED";
      entry.failureClass = String(error.message).slice(0, 60).replace(/[^A-Z0-9_]/gi, "_");
      await persist();
      throw new Error("BLOCKED_METADATA_PROVIDER_OR_UNCERTAIN_SPEND");
    }
  }
  try {
    const ids = selected.map(x => x.youtubeVideoRef);
    for (const batch of chunks(ids, METADATA_MAX_BATCH)) {
      const items = await call("videos.list", batch);
      if (!items) continue;
      const seen = new Map(items.filter(x => batch.includes(x.id) && isText(x.snippet?.channelId))
        .map(x => [x.id, x.snippet.channelId]));
      for (const videoRef of batch) {
        const q = selected.find(x => x.youtubeVideoRef === videoRef);
        const actualChannel = seen.get(videoRef) ?? null;
        out.records.push({
          sourceRef: q.sourceRef, leafIds: q.leafIds,
          channelPreviouslyQualified: q.sameChannelAlreadyQualified,
          crossLeafDuplicate: q.crossLeafDuplicate,
          previousCreatorChannelRefs: q.priorCreatorChannelRefs,
          observedCreatorChannelRef: actualChannel,
          sourceStatus: actualChannel ? "FOUND" : "MISSING_PRIVATE_OR_DELETED_UNDETERMINED",
          channelIntegrity: actualChannel ?
            (q.priorCreatorChannelRefs.includes(actualChannel) ? "MATCH" : "MISMATCH_REQUIRES_REVIEW") : "UNRESOLVED",
          channelAvailability: "PENDING",
          credentialEvidenceRef: null, sourceSpecificRelevanceEvidenceRef: null,
          reviewerDecision: "NEEDS_EVIDENCE", automaticQualificationAuthorized: false,
          retrievedAt: now.toISOString()
        });
      }
      await persist();
    }
    const channelIds = [...new Set(out.records.map(r => r.observedCreatorChannelRef).filter(Boolean))];
    for (const batch of chunks(channelIds, METADATA_MAX_BATCH)) {
      const items = await call("channels.list", batch);
      if (!items) continue;
      const found = new Set(items.filter(x => batch.includes(x.id)).map(x => x.id));
      for (const record of out.records) if (batch.includes(record.observedCreatorChannelRef))
        record.channelAvailability = found.has(record.observedCreatorChannelRef) ? "FOUND" : "UNAVAILABLE";
      await persist();
    }
    for (const record of out.records) if (!record.observedCreatorChannelRef)
      record.channelAvailability = "UNRESOLVED";
    out.completed = true;
    out.technicalOutcome = out.records.every(r => r.sourceStatus === "FOUND" &&
      r.channelIntegrity === "MATCH" && r.channelAvailability === "FOUND") ?
        "METADATA_TECHNICAL_PASS_EVIDENCE_PENDING" : "METADATA_PARTIAL_UNRESOLVED_EVIDENCE_PENDING";
    await persist();
    return { terminal: out.technicalOutcome, snapshot: out, calls };
  } catch (error) {
    return { terminal: error.message === "BLOCKED_METADATA_PROVIDER_OR_UNCERTAIN_SPEND" ?
      error.message : "BLOCKED_METADATA_INTERNAL", snapshot: out, calls };
  }
}

async function main() {
  const enabled = process.env.YT_BBQ_METADATA_ENABLED === "true";
  if (!enabled) {
    console.log(JSON.stringify({ terminal: "BLOCKED_METADATA_DEFAULT_OFF", calls: 0, searchCalls: 0 }));
    return;
  }
  const config = await loadBarbecueConfig(join(REPO_ROOT, "config/barbecue_technique_corpus_v1.json"));
  const state = JSON.parse(await readFile(join(REPO_ROOT, "data/generated/barbecue-technique-corpus-state.json"), "utf8"));
  const selected = selectMetadataPilot(metadataReviewQueue(state, config));
  const proof = {
    source: process.env.YT_BBQ_METADATA_QUOTA_PROOF_SOURCE,
    verifiedAt: process.env.YT_BBQ_METADATA_QUOTA_VERIFIED_AT,
    quotaDate: process.env.YT_BBQ_METADATA_QUOTA_DATE,
    projectIdentity: process.env.CULINARY_YOUTUBE_PROJECT_IDENTITY,
    remainingMetadataUnits: Number(process.env.YT_BBQ_METADATA_REMAINING_UNITS),
    protectedReserveUnits: Number(process.env.YT_BBQ_METADATA_RESERVE_UNITS)
  };
  const existing = await readFile(join(REPO_ROOT, outputPath), "utf8").then(JSON.parse).catch(e => {
    if (e.code === "ENOENT") return null;
    throw e;
  });
  const result = await runMetadataAdapter({ state, config, selected, enabled,
    approved: process.env.YT_BBQ_METADATA_LIVE_APPROVED === "true",
    apiKey: process.env.CULINARY_YOUTUBE_API_KEY,
    identity: process.env.CULINARY_YOUTUBE_PROJECT_IDENTITY, quotaProof: proof,
    snapshot: expireMetadataSnapshot(existing),
    checkpoint: async payload => {
      const path = join(REPO_ROOT, outputPath);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(payload, null, 2) + "\n");
    }
  });
  console.log(JSON.stringify({ terminal: result.terminal, calls: result.calls, searchCalls: 0,
    reviewed: result.snapshot?.records.length ?? 0, qualified: 0, output: result.snapshot ? outputPath : null }));
  if (result.terminal.startsWith("BLOCKED")) process.exitCode = 2;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  main().catch(e => { console.error("BLOCKED_METADATA_LOCAL_EXECUTION " + String(e.message)); process.exitCode = 2; });
