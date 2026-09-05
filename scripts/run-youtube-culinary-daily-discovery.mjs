import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS,
  YT_CUL_MIN_SEARCH_RESERVE,
  YT_CUL_SECRET_NAME,
  assertPolicySafeDurableObject
} from "./youtube-culinary-discovery-control-plane.mjs";
import { extractExternalUrls, isPublicIpAddress } from "./run-youtube-culinary-discovery-pilot.mjs";
import { extractIndependentRecipeNames } from "./run-youtube-culinary-atlas-expansion-cadence.mjs";
import {
  admitReviewReadyPackets,
  computeIndependentSourceDomainDiversity,
  createAtlasRelevanceReviewReadyPacket
} from "./youtube-culinary-atlas-relevance-gate.mjs";
import {
  applyCanonicalReviewBridge,
  appendCompletedDay,
  createInitialDailyState,
  evaluatePreSearchGate,
  getYoutubeQuotaDate,
  selectDailyQueries,
  validateDailyState
} from "./youtube-culinary-daily-control-plane.mjs";

const SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const CHANNELS_ENDPOINT = "https://www.googleapis.com/youtube/v3/channels";
const PLAYLIST_ITEMS_ENDPOINT = "https://www.googleapis.com/youtube/v3/playlistItems";
const VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const SEARCH_RESULTS_PER_CALL = 10;
const PLAYLIST_ITEMS_PER_SURFACE = 25;
const MAX_SURFACES = 48;
const MAX_EXTERNAL_REVIEWS = 60;
const MAX_EXTERNAL_PER_DOMAIN = 4;
const MAX_EXTERNAL_BYTES = 512 * 1024;
const EXTERNAL_FETCH_TIMEOUT_MS = 8000;
const MAX_EXTERNAL_REDIRECTS = 3;
const STATE_PATH = process.env.YT_CUL_DAILY_STATE_PATH || "data/generated/youtube-culinary-daily-discovery-state.json";
const BRIDGE_PATH = process.env.YT_CUL_CANONICAL_REVIEW_BRIDGE_PATH || "data/generated/youtube-culinary-canonical-review-bridge.json";
const POLICY_RECHECKED_AT = process.env.YT_CUL_POLICY_RECHECKED_AT || "2026-09-05";
const DAILY_LIMIT = Number(process.env.CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT || 100);
const PROJECT_IDENTITY = process.env.CULINARY_YOUTUBE_PROJECT_IDENTITY || "culinary-youtube-discovery";
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.YT_CUL_DRY_RUN || "false");
const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(THIS_DIR, "..");
const BLOCKED_EXTERNAL_HOST_PATTERNS = [
  /(^|\.)youtube\.com$/i, /(^|\.)youtu\.be$/i, /(^|\.)google\.com$/i, /(^|\.)googleusercontent\.com$/i,
  /(^|\.)instagram\.com$/i, /(^|\.)facebook\.com$/i, /(^|\.)fb\.com$/i, /(^|\.)tiktok\.com$/i,
  /(^|\.)twitter\.com$/i, /(^|\.)x\.com$/i, /(^|\.)pinterest\./i, /(^|\.)patreon\.com$/i,
  /(^|\.)linktr\.ee$/i, /(^|\.)amazon\./i
];
const hash = value => createHash("sha256").update(String(value)).digest("hex");
const chunks = (values, size) => Array.from({ length: Math.ceil(values.length / size) }, (_, i) => values.slice(i * size, (i + 1) * size));
const unique = values => [...new Set(values.filter(Boolean))];

function noBlueLagoon(value) {
  if (!value || /blue[ _-]*lagoon|music/i.test(value)) throw new Error("Culinary project identity is missing or violates Blue Lagoon isolation");
  return value;
}

function youtubeRequest(endpoint, params, apiKey) {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return { url, init: { method: "GET", headers: { Accept: "application/json", "X-Goog-Api-Key": apiKey }, signal: AbortSignal.timeout(15000) } };
}

export function buildDailySearchRequest(query, apiKey) {
  if (!query || !["channel", "playlist"].includes(query.resourceType)) throw new Error("daily query resourceType must be channel or playlist");
  return youtubeRequest(SEARCH_ENDPOINT, { part: "snippet", type: query.resourceType, maxResults: SEARCH_RESULTS_PER_CALL, safeSearch: "strict", q: query.queryText }, apiKey);
}

async function fetchJson(fetchImpl, request, endpoint) {
  const response = await fetchImpl(request.url, request.init);
  let payload;
  try { payload = await response.json(); } catch { throw new Error(`${endpoint} returned non-JSON HTTP ${response.status}`); }
  if (!response.ok) {
    const safe = { endpoint, httpStatus: response.status, apiStatus: payload?.error?.status ?? null, apiReason: payload?.error?.errors?.[0]?.reason ?? null };
    throw new Error(`${endpoint} failed: ${JSON.stringify(safe)}`);
  }
  return payload;
}

async function writeTransient(cacheDir, filename, metadata, payload) {
  await writeFile(join(cacheDir, filename), JSON.stringify({
    schemaVersion: "youtube-culinary-transient-live-v1", dataClass: "YOUTUBE_API_DATA_TRANSIENT",
    retrievedAt: metadata.retrievedAt,
    expiresAt: new Date(Date.parse(metadata.retrievedAt) + YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS * 86400000).toISOString(),
    ttlDays: YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS, endpoint: metadata.endpoint, queryId: metadata.queryId ?? null, payload
  }), { encoding: "utf8", mode: 0o600 });
}

async function assertPublicUrl(url) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("external URL must be HTTP(S)");
  const host = url.hostname.toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".local") || BLOCKED_EXTERNAL_HOST_PATTERNS.some(pattern => pattern.test(host))) throw new Error("external host is not eligible");
  if (isIP(host)) {
    if (!isPublicIpAddress(host)) throw new Error("external IP is private/reserved");
    return;
  }
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(entry => !isPublicIpAddress(entry.address))) throw new Error("external DNS resolved to private/reserved address space");
}

async function boundedText(response) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > MAX_EXTERNAL_BYTES) throw new Error("external body exceeds byte limit");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_EXTERNAL_BYTES) { await reader.cancel(); throw new Error("external body exceeds byte limit"); }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function fetchIndependentPage(fetchImpl, rawUrl) {
  let current = new URL(rawUrl);
  for (let redirects = 0; redirects <= MAX_EXTERNAL_REDIRECTS; redirects += 1) {
    await assertPublicUrl(current);
    const response = await fetchImpl(current, {
      method: "GET", redirect: "manual", headers: { Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1", "User-Agent": "CulinaryRecommenderEvidenceReview/1.0" },
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS)
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect missing location");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`external review HTTP ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) throw new Error("external review content type is not HTML");
    return { finalUrl: current.toString(), html: await boundedText(response), sourceDomain: current.hostname.toLowerCase() };
  }
  throw new Error("external review exceeded redirect limit");
}

function pageText(html) {
  return String(html).replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").toLowerCase();
}

export function relevanceMatches(html, candidateLabel, query) {
  const haystack = `${candidateLabel} ${pageText(html)}`.toLowerCase();
  return unique(query.relevanceTerms.filter(term => haystack.includes(term.toLowerCase()))).slice(0, 8);
}

function selectDiverseExternalCandidates(candidates, cap = MAX_EXTERNAL_REVIEWS) {
  const byDomain = new Map();
  for (const candidate of candidates) {
    let domain;
    try { domain = new URL(candidate.url).hostname.toLowerCase(); } catch { continue; }
    if (BLOCKED_EXTERNAL_HOST_PATTERNS.some(pattern => pattern.test(domain))) continue;
    const rows = byDomain.get(domain) ?? [];
    if (rows.length < MAX_EXTERNAL_PER_DOMAIN) rows.push(candidate);
    byDomain.set(domain, rows);
  }
  for (const rows of byDomain.values()) rows.sort((a, b) => hash(a.url).localeCompare(hash(b.url)));
  const domains = [...byDomain.keys()].sort((a, b) => hash(a).localeCompare(hash(b)));
  const selected = [];
  for (let round = 0; selected.length < cap; round += 1) {
    let added = false;
    for (const domain of domains) {
      const row = byDomain.get(domain)[round];
      if (row) { selected.push(row); added = true; if (selected.length >= cap) break; }
    }
    if (!added) break;
  }
  return selected;
}

async function loadJsonIfExists(relativePath) {
  try { return JSON.parse(await readFile(join(REPO_ROOT, relativePath), "utf8")); } catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

async function saveState(state) {
  validateDailyState(state);
  const path = join(REPO_ROOT, STATE_PATH);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function acquireYoutube(fetchImpl, apiKey, queries, cacheDir, retrievedAt) {
  const channelIds = new Map();
  const playlistIds = new Map();
  let searchCalls = 0;
  for (const query of queries) {
    const request = buildDailySearchRequest(query, apiKey);
    const payload = await fetchJson(fetchImpl, request, "search.list");
    searchCalls += 1;
    await writeTransient(cacheDir, `search-${query.queryId}.json`, { retrievedAt, endpoint: "search.list", queryId: query.queryId }, payload);
    for (const item of payload.items ?? []) {
      if (query.resourceType === "channel" && item?.id?.channelId) channelIds.set(item.id.channelId, query);
      if (query.resourceType === "playlist" && item?.id?.playlistId) playlistIds.set(item.id.playlistId, query);
    }
  }

  for (const batch of chunks([...channelIds.keys()].slice(0, 50), 50)) {
    if (!batch.length) continue;
    const request = youtubeRequest(CHANNELS_ENDPOINT, { part: "contentDetails", id: batch.join(",") }, apiKey);
    const payload = await fetchJson(fetchImpl, request, "channels.list");
    await writeTransient(cacheDir, `channels-${hash(batch.join(",")).slice(0, 10)}.json`, { retrievedAt, endpoint: "channels.list" }, payload);
    for (const item of payload.items ?? []) {
      const uploads = item?.contentDetails?.relatedPlaylists?.uploads;
      const query = channelIds.get(item?.id);
      if (uploads && query && !playlistIds.has(uploads)) playlistIds.set(uploads, query);
    }
  }

  const surfaces = [...playlistIds.entries()].sort((a, b) => hash(a[0]).localeCompare(hash(b[0]))).slice(0, MAX_SURFACES);
  const videoQuery = new Map();
  for (const [playlistId, query] of surfaces) {
    const request = youtubeRequest(PLAYLIST_ITEMS_ENDPOINT, { part: "contentDetails", playlistId, maxResults: PLAYLIST_ITEMS_PER_SURFACE }, apiKey);
    const payload = await fetchJson(fetchImpl, request, "playlistItems.list");
    await writeTransient(cacheDir, `playlist-${hash(playlistId).slice(0, 12)}.json`, { retrievedAt, endpoint: "playlistItems.list", queryId: query.queryId }, payload);
    for (const item of payload.items ?? []) if (item?.contentDetails?.videoId && !videoQuery.has(item.contentDetails.videoId)) videoQuery.set(item.contentDetails.videoId, query);
  }

  const externalCandidates = [];
  for (const batch of chunks([...videoQuery.keys()], 50)) {
    const request = youtubeRequest(VIDEOS_ENDPOINT, { part: "snippet", id: batch.join(",") }, apiKey);
    const payload = await fetchJson(fetchImpl, request, "videos.list");
    await writeTransient(cacheDir, `videos-${hash(batch.join(",")).slice(0, 10)}.json`, { retrievedAt, endpoint: "videos.list" }, payload);
    for (const item of payload.items ?? []) {
      const query = videoQuery.get(item?.id);
      if (!query) continue;
      for (const url of extractExternalUrls(item?.snippet?.description ?? "")) externalCandidates.push({ url, query });
    }
  }
  return { searchCalls, transientVideoPointers: videoQuery.size, externalCandidates: selectDiverseExternalCandidates(externalCandidates) };
}

async function reviewIndependentSources(fetchImpl, candidates, retrievedAt) {
  const reviewCandidates = [];
  let independentPagesReviewed = 0;
  let recipeStructuredPagesConfirmed = 0;
  const errors = [];
  for (const candidate of candidates) {
    try {
      const page = await fetchIndependentPage(fetchImpl, candidate.url);
      independentPagesReviewed += 1;
      const names = extractIndependentRecipeNames(page.html);
      if (!names.length) continue;
      recipeStructuredPagesConfirmed += 1;
      const pageFingerprint = hash(page.html).slice(0, 32);
      for (const name of names.slice(0, 3)) {
        const matchedTerms = relevanceMatches(page.html, name, candidate.query);
        if (!matchedTerms.length) continue;
        reviewCandidates.push(createAtlasRelevanceReviewReadyPacket({
          candidateLabel: name,
          claimScope: "IDENTITY",
          atlasGap: candidate.query.atlasGap,
          sourceDomain: page.sourceDomain,
          sourceUrl: page.finalUrl,
          sourceRetrievedAt: retrievedAt,
          machineEvidence: {
            recipeStructuredPage: true,
            candidateLabelsObserved: [name],
            ingredientTermsObserved: matchedTerms,
            independentPageFingerprint: pageFingerprint
          },
          relevanceReason: `Independent Recipe-structured page matched bounded ${candidate.query.focus} relevance terms: ${matchedTerms.join(", ")}.`,
          unresolvedAmbiguity: ["Machine pre-screen establishes bounded discovery relevance only; canonical identity and claim scope require Knowledge Core Atlas review."]
        }));
      }
    } catch (error) {
      errors.push({ errorClass: error?.name ?? "Error", messageHash: hash(error?.message ?? String(error)).slice(0, 16) });
    }
  }
  return { reviewCandidates, independentPagesReviewed, recipeStructuredPagesConfirmed, externalReviewErrors: errors };
}

export async function runDailyDiscovery({ fetchImpl = fetch, now = new Date() } = {}) {
  noBlueLagoon(PROJECT_IDENTITY);
  if (!Number.isInteger(DAILY_LIMIT) || DAILY_LIMIT <= YT_CUL_MIN_SEARCH_RESERVE) throw new Error("CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT is invalid");
  let state = await loadJsonIfExists(STATE_PATH) ?? createInitialDailyState({ policyRecheckedAt: POLICY_RECHECKED_AT, assignedDailySearchLimit: DAILY_LIMIT });
  state = applyCanonicalReviewBridge(state, await loadJsonIfExists(BRIDGE_PATH));
  validateDailyState(state);
  const quotaDate = getYoutubeQuotaDate(now);
  const gate = evaluatePreSearchGate(state, { now, quotaDate });
  if (!gate.searchAllowed || DRY_RUN) {
    const summary = {
      schemaVersion: "youtube-culinary-daily-safe-summary-v1", phase: "YT-CUL-5D", quotaDate,
      result: DRY_RUN ? "YT_CUL_5D_DRY_RUN_PASS" : gate.terminalState,
      searchCallsExecuted: 0, searchBudget: gate.budget, dryRun: DRY_RUN,
      unresolvedReviewBacklog: state.unresolvedPackets.length,
      ytCul6ReadinessEarned: state.ytCul6Readiness.earned,
      controls: { rawYoutubeApiDataEmbedded: false, youtubeStatisticsRead: false, audiovisualDownloaded: false, automaticAtlasPromotionAuthorized: false, automaticAppAdmissionAuthorized: false, blueLagoonCrossUse: false }
    };
    assertPolicySafeDurableObject(summary);
    if (!DRY_RUN && !state.hardHold && gate.terminalState.startsWith("DAILY_SEARCH_HOLD_")) { state.hardHold = gate.terminalState; state.programmeStatus = gate.terminalState; await saveState(state); }
    return summary;
  }

  const apiKey = process.env[YT_CUL_SECRET_NAME];
  if (!apiKey) throw new Error(`${YT_CUL_SECRET_NAME} is required for live YT-CUL-5D`);
  const absoluteAvailable = state.assignedDailySearchLimit - state.protectedReserveCalls;
  if (gate.budget > absoluteAvailable || gate.budget < 8 || gate.budget > 32) throw new Error("adaptive Search budget violates 8-32/reserve control law");
  const queries = selectDailyQueries({ state, budget: gate.budget });
  const retrievedAt = now.toISOString();
  const cacheDir = await mkdir(join(tmpdir(), `yt-cul-5d-${process.pid}-${Date.now()}`), { recursive: true }).then(() => join(tmpdir(), `yt-cul-5d-${process.pid}-${Date.now()}`));
  // mkdir above uses a timestamp twice; normalize to a real unique directory instead.
  await rm(cacheDir, { recursive: true, force: true });
  const actualCacheDir = join(tmpdir(), `yt-cul-5d-${process.pid}-${hash(retrievedAt).slice(0, 12)}`);
  await mkdir(actualCacheDir, { recursive: true });
  try {
    const acquisition = await acquireYoutube(fetchImpl, apiKey, queries, actualCacheDir, retrievedAt);
    const reviewed = await reviewIndependentSources(fetchImpl, acquisition.externalCandidates, retrievedAt);
    const admission = admitReviewReadyPackets({
      candidates: reviewed.reviewCandidates,
      reviewedPairKeys: state.resolvedPairKeys,
      unresolvedPackets: state.unresolvedPackets
    });
    state.unresolvedPackets.push(...admission.admittedPackets);
    const diversity = computeIndependentSourceDomainDiversity(admission.admittedPackets);
    const terminalState = state.unresolvedPackets.length >= 40 ? "DAILY_SEARCH_HOLD_REVIEW_BACKLOG" :
      admission.admittedPackets.length > 0 ? "DAILY_DISCOVERY_CONTINUE" : "DAILY_DISCOVERY_CONTINUE_REDUCED_BUDGET";
    const day = {
      quotaDate, completedAt: new Date().toISOString(), searchBudget: gate.budget, searchCalls: acquisition.searchCalls,
      focuses: unique(queries.map(query => query.focus)), transientVideoPointersObserved: acquisition.transientVideoPointers,
      externalSourcePointersSelectedForIndependentReview: acquisition.externalCandidates.length,
      independentPagesReviewed: reviewed.independentPagesReviewed,
      recipeStructuredPagesConfirmed: reviewed.recipeStructuredPagesConfirmed,
      reviewCandidatesConsidered: reviewed.reviewCandidates.length,
      reviewReadyPacketsCreated: admission.admittedPackets.length,
      duplicatePairsSuppressed: admission.duplicatePairsSuppressed,
      uniqueUsefulSourceDomains: diversity.uniqueIndependentSourceDomains,
      largestSourceDomainShare: diversity.largestDomainShare,
      unresolvedReviewBacklogAfterRun: state.unresolvedPackets.length,
      externalReviewErrorCount: reviewed.externalReviewErrors.length,
      terminalState
    };
    state = appendCompletedDay(state, day);
    await saveState(state);
    const summary = {
      schemaVersion: "youtube-culinary-daily-safe-summary-v1", phase: "YT-CUL-5D", quotaDate,
      result: terminalState, searchCallsExecuted: acquisition.searchCalls, searchBudget: gate.budget,
      independentPagesReviewed: reviewed.independentPagesReviewed,
      recipeStructuredPagesConfirmed: reviewed.recipeStructuredPagesConfirmed,
      reviewReadyPacketsCreated: admission.admittedPackets.length,
      duplicatePairsSuppressed: admission.duplicatePairsSuppressed,
      uniqueUsefulSourceDomains: diversity.uniqueIndependentSourceDomains,
      unresolvedReviewBacklog: state.unresolvedPackets.length,
      ytCul6ReadinessEarned: state.ytCul6Readiness.earned,
      controls: { rawYoutubeApiDataEmbedded: false, rawYoutubePayloadDeletedBeforeExit: true, youtubeStatisticsRead: false, audiovisualDownloaded: false, automaticAtlasPromotionAuthorized: false, automaticAppAdmissionAuthorized: false, blueLagoonCrossUse: false }
    };
    assertPolicySafeDurableObject(summary);
    return summary;
  } finally {
    await rm(actualCacheDir, { recursive: true, force: true });
  }
}

async function main() {
  try {
    const summary = await runDailyDiscovery();
    process.stdout.write(`${JSON.stringify(summary)}\n`);
  } catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
