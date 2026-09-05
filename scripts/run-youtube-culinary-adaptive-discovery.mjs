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
  createAtlasRelevanceReviewReadyPacket,
  YT_CUL_5R_REVIEW_QUEUE_CAP
} from "./youtube-culinary-atlas-relevance-gate.mjs";
import {
  applyCanonicalReviewBridge,
  createInitialDailyState,
  getYoutubeQuotaDate,
  validateDailyState
} from "./youtube-culinary-daily-control-plane.mjs";
import {
  YT_CUL_5E_DAILY_SEARCH_CAPACITY,
  YT_CUL_5E_QUERY_VINTAGE,
  buildAdaptiveQueryPortfolio,
  computeResearchKpis,
  evaluateAdaptivePreSearchGate,
  nextTrancheSize,
  selectNextAdaptiveTranche,
  summarizeCanonicalLearning
} from "./youtube-culinary-adaptive-portfolio.mjs";

const SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const CHANNELS_ENDPOINT = "https://www.googleapis.com/youtube/v3/channels";
const PLAYLIST_ITEMS_ENDPOINT = "https://www.googleapis.com/youtube/v3/playlistItems";
const VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const SEARCH_RESULTS_PER_CALL = 10;
const PLAYLIST_ITEMS_PER_SURFACE = 25;
const MAX_SURFACES_PER_TRANCHE = 20;
const MAX_EXTERNAL_REVIEWS_PER_TRANCHE = 12;
const MAX_EXTERNAL_PER_DOMAIN_PER_TRANCHE = 2;
const MAX_EXTERNAL_BYTES = 512 * 1024;
const EXTERNAL_FETCH_TIMEOUT_MS = 8000;
const MAX_EXTERNAL_REDIRECTS = 3;
const REVIEW_CONCURRENCY = 6;
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
const unique = values => [...new Set(values.filter(Boolean))];
const chunks = (values, size) => Array.from({ length: Math.ceil(values.length / size) }, (_, i) => values.slice(i * size, (i + 1) * size));

function noBlueLagoon(value) {
  if (!value || /blue[ _-]*lagoon|music/i.test(value)) throw new Error("Culinary project identity is missing or violates Blue Lagoon isolation");
  return value;
}

function youtubeRequest(endpoint, params, apiKey) {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return { url, init: { method: "GET", headers: { Accept: "application/json", "X-Goog-Api-Key": apiKey }, signal: AbortSignal.timeout(15000) } };
}

export function buildAdaptiveSearchRequest(query, apiKey) {
  if (!query || !["channel", "playlist"].includes(query.resourceType)) throw new Error("adaptive query resourceType must be channel or playlist");
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

export function adaptiveRelevanceMatches(html, candidateLabel, query) {
  const haystack = `${candidateLabel} ${pageText(html)}`.toLowerCase();
  return unique(query.relevanceTerms.filter(term => haystack.includes(String(term).toLowerCase()))).slice(0, 10);
}

function selectDiverseExternalCandidates(candidates, seenExternalUrls) {
  const byDomain = new Map();
  for (const candidate of candidates) {
    if (seenExternalUrls.has(candidate.url)) continue;
    let domain;
    try { domain = new URL(candidate.url).hostname.toLowerCase(); } catch { continue; }
    if (BLOCKED_EXTERNAL_HOST_PATTERNS.some(pattern => pattern.test(domain))) continue;
    const rows = byDomain.get(domain) ?? [];
    if (rows.length < MAX_EXTERNAL_PER_DOMAIN_PER_TRANCHE) rows.push(candidate);
    byDomain.set(domain, rows);
  }
  for (const rows of byDomain.values()) rows.sort((a, b) => hash(a.url).localeCompare(hash(b.url)));
  const domains = [...byDomain.keys()].sort((a, b) => hash(a).localeCompare(hash(b)));
  const selected = [];
  for (let round = 0; selected.length < MAX_EXTERNAL_REVIEWS_PER_TRANCHE; round += 1) {
    let added = false;
    for (const domain of domains) {
      const row = byDomain.get(domain)[round];
      if (row) { selected.push(row); added = true; if (selected.length >= MAX_EXTERNAL_REVIEWS_PER_TRANCHE) break; }
    }
    if (!added) break;
  }
  selected.forEach(row => seenExternalUrls.add(row.url));
  return selected;
}

async function loadJsonIfExists(relativePath) {
  try { return JSON.parse(await readFile(join(REPO_ROOT, relativePath), "utf8")); } catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

async function saveState(state) {
  validateDailyState(state);
  assertPolicySafeDurableObject(state);
  const path = join(REPO_ROOT, STATE_PATH);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function initializeAdaptiveState(state, quotaDate) {
  state.queryVintage = YT_CUL_5E_QUERY_VINTAGE;
  if (["DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE", "DAILY_SEARCH_HOLD_ALREADY_COMPLETED_QUOTA_DAY"].includes(state.hardHold)) {
    state.hardHold = null;
    state.programmeStatus = "ACTIVE";
  }
  if (state.quotaDayProgress && state.quotaDayProgress.quotaDate !== quotaDate) {
    state.previousIncompleteQuotaDay = { quotaDate: state.quotaDayProgress.quotaDate, searchCallsUsed: state.quotaDayProgress.searchCallsUsed ?? 0, terminalState: "INCOMPLETE_QUOTA_DAY_CARRIED_FORWARD_NO_REUSE" };
    state.quotaDayProgress = null;
  }
  if (!state.quotaDayProgress) {
    state.quotaDayProgress = {
      schemaVersion: "youtube-culinary-adaptive-quota-day-progress-v1", quotaDate,
      searchCapacity: Math.min(YT_CUL_5E_DAILY_SEARCH_CAPACITY, state.assignedDailySearchLimit - state.protectedReserveCalls),
      searchCallsUsed: 0, usedQueryIds: [], tranches: [], sameDayFocusMetrics: {}, newPacketIds: [], status: "IN_PROGRESS"
    };
  }
  return state;
}

function ensureFocusMetric(progress, focus) {
  progress.sameDayFocusMetrics[focus] ??= { searchCalls: 0, independentPagesReviewed: 0, recipeStructuredPagesConfirmed: 0, reviewCandidatesConsidered: 0, reviewReadyPacketsCreated: 0, duplicatePairsSuppressed: 0, usefulSourceDomains: [] };
  return progress.sameDayFocusMetrics[focus];
}

async function acquireYoutubeTranche(fetchImpl, apiKey, queries, cacheDir, retrievedAt, transient, onSearchAttempt) {
  const channelQueries = new Map(), playlistQueries = new Map();
  for (const query of queries) {
    await onSearchAttempt(query);
    const request = buildAdaptiveSearchRequest(query, apiKey);
    const payload = await fetchJson(fetchImpl, request, "search.list");
    await writeTransient(cacheDir, `search-${query.queryId}.json`, { retrievedAt, endpoint: "search.list", queryId: query.queryId }, payload);
    for (const item of payload.items ?? []) {
      if (query.resourceType === "channel" && item?.id?.channelId) channelQueries.set(item.id.channelId, query);
      if (query.resourceType === "playlist" && item?.id?.playlistId) playlistQueries.set(item.id.playlistId, query);
    }
  }

  const newChannels = [...channelQueries.keys()].filter(id => !transient.channelUploads.has(id)).slice(0, 100);
  for (const batch of chunks(newChannels, 50)) {
    if (!batch.length) continue;
    const request = youtubeRequest(CHANNELS_ENDPOINT, { part: "contentDetails", id: batch.join(",") }, apiKey);
    const payload = await fetchJson(fetchImpl, request, "channels.list");
    await writeTransient(cacheDir, `channels-${hash(batch.join(",")).slice(0, 10)}.json`, { retrievedAt, endpoint: "channels.list" }, payload);
    for (const item of payload.items ?? []) {
      const uploads = item?.contentDetails?.relatedPlaylists?.uploads;
      if (uploads) transient.channelUploads.set(item.id, uploads);
    }
  }
  for (const [channelId, query] of channelQueries) {
    const uploads = transient.channelUploads.get(channelId);
    if (uploads && !playlistQueries.has(uploads)) playlistQueries.set(uploads, query);
  }

  const surfaces = [...playlistQueries.entries()].filter(([playlistId]) => !transient.seenPlaylists.has(playlistId)).sort((a, b) => hash(a[0]).localeCompare(hash(b[0]))).slice(0, MAX_SURFACES_PER_TRANCHE);
  const videoQueries = new Map();
  for (const [playlistId, query] of surfaces) {
    transient.seenPlaylists.add(playlistId);
    const request = youtubeRequest(PLAYLIST_ITEMS_ENDPOINT, { part: "contentDetails", playlistId, maxResults: PLAYLIST_ITEMS_PER_SURFACE }, apiKey);
    const payload = await fetchJson(fetchImpl, request, "playlistItems.list");
    await writeTransient(cacheDir, `playlist-${hash(playlistId).slice(0, 12)}.json`, { retrievedAt, endpoint: "playlistItems.list", queryId: query.queryId }, payload);
    for (const item of payload.items ?? []) {
      const videoId = item?.contentDetails?.videoId;
      if (videoId && !transient.seenVideos.has(videoId)) { transient.seenVideos.add(videoId); videoQueries.set(videoId, query); }
    }
  }

  const externalCandidates = [];
  for (const batch of chunks([...videoQueries.keys()], 50)) {
    if (!batch.length) continue;
    const request = youtubeRequest(VIDEOS_ENDPOINT, { part: "snippet", id: batch.join(",") }, apiKey);
    const payload = await fetchJson(fetchImpl, request, "videos.list");
    await writeTransient(cacheDir, `videos-${hash(batch.join(",")).slice(0, 10)}.json`, { retrievedAt, endpoint: "videos.list" }, payload);
    for (const item of payload.items ?? []) {
      const query = videoQueries.get(item?.id);
      if (!query) continue;
      for (const url of extractExternalUrls(item?.snippet?.description ?? "")) externalCandidates.push({ url, query });
    }
  }
  return { transientVideoPointers: videoQueries.size, externalCandidates: selectDiverseExternalCandidates(externalCandidates, transient.seenExternalUrls) };
}

async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try { results[index] = await fn(items[index], index); } catch (error) { results[index] = { error }; }
    }
  });
  await Promise.all(workers);
  return results;
}

async function reviewIndependentSources(fetchImpl, candidates, retrievedAt) {
  const results = await mapWithConcurrency(candidates, REVIEW_CONCURRENCY, async candidate => {
    const page = await fetchIndependentPage(fetchImpl, candidate.url);
    const names = extractIndependentRecipeNames(page.html);
    const packets = [];
    if (names.length) {
      const pageFingerprint = hash(page.html).slice(0, 32);
      for (const name of names.slice(0, 2)) {
        const matchedTerms = adaptiveRelevanceMatches(page.html, name, candidate.query);
        if (!matchedTerms.length) continue;
        packets.push(createAtlasRelevanceReviewReadyPacket({ candidateLabel: name, claimScope: "IDENTITY", atlasGap: candidate.query.atlasGap, sourceDomain: page.sourceDomain, sourceUrl: page.finalUrl, sourceRetrievedAt: retrievedAt, machineEvidence: { recipeStructuredPage: true, candidateLabelsObserved: [name], ingredientTermsObserved: matchedTerms, independentPageFingerprint: pageFingerprint }, relevanceReason: `Independent Recipe-structured page matched bounded ${candidate.query.focus} relevance terms: ${matchedTerms.join(", ")}.`, unresolvedAmbiguity: ["Discovery relevance only; canonical identity and claim scope remain Knowledge Core Atlas review-bound."] }));
      }
    }
    return { candidate, names, packets };
  });

  const reviewCandidates = [], perFocus = {}, errors = [];
  for (const result of results) {
    if (!result) continue;
    if (result.error) { errors.push({ errorClass: result.error?.name ?? "Error", messageHash: hash(result.error?.message ?? String(result.error)).slice(0, 16) }); continue; }
    const focus = result.candidate.query.focus;
    perFocus[focus] ??= { independentPagesReviewed: 0, recipeStructuredPagesConfirmed: 0, reviewCandidatesConsidered: 0 };
    perFocus[focus].independentPagesReviewed += 1;
    if (result.names.length) perFocus[focus].recipeStructuredPagesConfirmed += 1;
    perFocus[focus].reviewCandidatesConsidered += result.packets.length;
    reviewCandidates.push(...result.packets);
  }
  return { reviewCandidates, perFocus, independentPagesReviewed: Object.values(perFocus).reduce((sum, row) => sum + row.independentPagesReviewed, 0), recipeStructuredPagesConfirmed: Object.values(perFocus).reduce((sum, row) => sum + row.recipeStructuredPagesConfirmed, 0), externalReviewErrors: errors };
}

function updateFocusMetrics(progress, queries, reviewed, admission) {
  for (const query of queries) ensureFocusMetric(progress, query.focus).searchCalls += 1;
  for (const [focus, row] of Object.entries(reviewed.perFocus)) {
    const target = ensureFocusMetric(progress, focus);
    target.independentPagesReviewed += row.independentPagesReviewed;
    target.recipeStructuredPagesConfirmed += row.recipeStructuredPagesConfirmed;
    target.reviewCandidatesConsidered += row.reviewCandidatesConsidered;
  }
  const packetFocusByPair = new Map(reviewed.reviewCandidates.map(packet => [packet.reviewPairKey, `${packet.atlasGap.macroRegion}__${packet.atlasGap.familyGap}`]));
  for (const packet of admission.admittedPackets) {
    const focus = `${packet.atlasGap.macroRegion}__${packet.atlasGap.familyGap}`;
    const target = ensureFocusMetric(progress, focus);
    target.reviewReadyPacketsCreated += 1;
    const domain = packet.independentSourceProvenance.sourceDomain;
    if (!target.usefulSourceDomains.includes(domain)) target.usefulSourceDomains.push(domain);
  }
  for (const suppressed of admission.suppressedPairs ?? []) {
    if (suppressed.reason !== "ALREADY_REVIEWED_OR_QUEUED_SOURCE_TARGET_PAIR") continue;
    const focus = packetFocusByPair.get(suppressed.reviewPairKey);
    if (focus) ensureFocusMetric(progress, focus).duplicatePairsSuppressed += 1;
  }
}

function allocatorMetrics(progress) {
  const output = {};
  for (const [focus, row] of Object.entries(progress.sameDayFocusMetrics ?? {})) output[focus] = { ...row, uniqueUsefulSourceDomains: row.usefulSourceDomains?.length ?? 0 };
  return output;
}

function appendCompletedAdaptiveDay(state, day) {
  if (state.completedQuotaDays.some(existing => existing.quotaDate === day.quotaDate)) throw new Error("quota day already completed");
  state.completedQuotaDays.push(day);
  state.lastCompletedQuotaDate = day.quotaDate;
  state.cumulative.searchCalls += day.searchCalls;
  state.cumulative.independentPagesReviewed += day.independentPagesReviewed;
  state.cumulative.recipeStructuredPagesConfirmed += day.recipeStructuredPagesConfirmed;
  state.cumulative.reviewReadyPacketsCreated += day.reviewReadyPacketsCreated;
  state.cumulative.duplicatePairsSuppressed += day.duplicatePairsSuppressed;
  state.quotaDayProgress = null;
  state.programmeStatus = day.terminalState === "DAILY_SEARCH_HOLD_REVIEW_BACKLOG" ? day.terminalState : "ACTIVE";
  state.hardHold = day.terminalState === "DAILY_SEARCH_HOLD_REVIEW_BACKLOG" ? day.terminalState : null;
  return state;
}

function buildSummary(state, day, result, dryRun = false) {
  const summary = {
    schemaVersion: "youtube-culinary-adaptive-daily-safe-summary-v1", phase: "YT-CUL-5E", quotaDate: day?.quotaDate ?? getYoutubeQuotaDate(), result, dryRun,
    searchCallsExecuted: day?.searchCalls ?? 0, searchCapacity: day?.searchCapacity ?? 0, tranchesRun: day?.tranches?.length ?? 0, reallocations: Math.max(0, (day?.tranches?.length ?? 0) - 1),
    independentPagesReviewed: day?.independentPagesReviewed ?? 0, recipeStructuredPagesConfirmed: day?.recipeStructuredPagesConfirmed ?? 0, reviewReadyPacketsCreated: day?.reviewReadyPacketsCreated ?? 0, duplicatePairsSuppressed: day?.duplicatePairsSuppressed ?? 0, uniqueUsefulSourceDomains: day?.uniqueUsefulSourceDomains ?? 0,
    unresolvedReviewBacklog: state.unresolvedPackets.length, researchKpis: day?.researchKpis ?? {}, canonicalLearning: summarizeCanonicalLearning(state), ytCul6ReadinessEarned: state.ytCul6Readiness.earned,
    controls: { protectedSearchReserve: state.protectedReserveCalls, rawYoutubeApiDataEmbedded: false, rawYoutubePayloadDeletedBeforeExit: true, youtubeStatisticsRead: false, audiovisualDownloaded: false, automaticAtlasPromotionAuthorized: false, automaticAppAdmissionAuthorized: false, blueLagoonCrossUse: false }
  };
  assertPolicySafeDurableObject(summary);
  return summary;
}

export async function runAdaptiveDailyDiscovery({ fetchImpl = fetch, now = new Date() } = {}) {
  noBlueLagoon(PROJECT_IDENTITY);
  if (!Number.isInteger(DAILY_LIMIT) || DAILY_LIMIT !== 100) throw new Error("YT-CUL-5E is armed only for the owner-verified 100/day Search Queries limit");
  let state = await loadJsonIfExists(STATE_PATH) ?? createInitialDailyState({ policyRecheckedAt: POLICY_RECHECKED_AT, assignedDailySearchLimit: DAILY_LIMIT });
  state = applyCanonicalReviewBridge(state, await loadJsonIfExists(BRIDGE_PATH));
  const quotaDate = getYoutubeQuotaDate(now);
  state = initializeAdaptiveState(state, quotaDate);
  validateDailyState(state);
  const gate = evaluateAdaptivePreSearchGate(state, { now, quotaDate });
  if (!gate.searchAllowed || DRY_RUN) {
    const syntheticDay = { quotaDate, searchCalls: 0, searchCapacity: gate.dailyCapacity ?? 0, tranches: [] };
    return buildSummary(state, syntheticDay, DRY_RUN ? "YT_CUL_5E_DRY_RUN_PASS" : gate.terminalState, DRY_RUN);
  }

  const apiKey = process.env[YT_CUL_SECRET_NAME];
  if (!apiKey) throw new Error(`${YT_CUL_SECRET_NAME} is required for live YT-CUL-5E`);
  const progress = state.quotaDayProgress;
  if (progress.searchCapacity !== gate.dailyCapacity || progress.searchCapacity > YT_CUL_5E_DAILY_SEARCH_CAPACITY || progress.searchCapacity > DAILY_LIMIT - YT_CUL_MIN_SEARCH_RESERVE) throw new Error("adaptive daily capacity violates reserve control");
  const sameDayPackets = () => progress.newPacketIds.map(id => state.unresolvedPackets.find(packet => packet.packetId === id)).filter(Boolean);
  const transient = { channelUploads: new Map(), seenPlaylists: new Set(), seenVideos: new Set(), seenExternalUrls: new Set() };
  const actualCacheDir = join(tmpdir(), `yt-cul-5e-${process.pid}-${hash(`${quotaDate}-${Date.now()}`).slice(0, 12)}`);
  await mkdir(actualCacheDir, { recursive: true });
  let terminalState = "DAILY_DISCOVERY_QUOTA_PORTFOLIO_COMPLETE";
  try {
    while (progress.searchCallsUsed < progress.searchCapacity) {
      if (state.unresolvedPackets.length >= YT_CUL_5R_REVIEW_QUEUE_CAP) { terminalState = "DAILY_SEARCH_HOLD_REVIEW_BACKLOG"; break; }
      const trancheSize = nextTrancheSize(progress.searchCallsUsed, progress.searchCapacity);
      const portfolio = buildAdaptiveQueryPortfolio({ state, sameDayPackets: sameDayPackets() });
      const allocation = selectNextAdaptiveTranche({ state, portfolio, usedQueryIds: progress.usedQueryIds, sameDayFocusMetrics: allocatorMetrics(progress), trancheSize });
      if (!allocation.queries.length) { terminalState = "DAILY_DISCOVERY_PORTFOLIO_EXHAUSTED"; break; }
      const trancheNumber = progress.tranches.length + 1;
      const retrievedAt = new Date(now.getTime() + trancheNumber).toISOString();
      const beforeSearchCalls = progress.searchCallsUsed;
      const onSearchAttempt = async query => { progress.searchCallsUsed += 1; progress.usedQueryIds.push(query.queryId); progress.status = "IN_PROGRESS"; await saveState(state); };
      const acquisition = await acquireYoutubeTranche(fetchImpl, apiKey, allocation.queries, actualCacheDir, retrievedAt, transient, onSearchAttempt);
      const reviewed = await reviewIndependentSources(fetchImpl, acquisition.externalCandidates, retrievedAt);
      const admission = admitReviewReadyPackets({ candidates: reviewed.reviewCandidates, reviewedPairKeys: state.resolvedPairKeys, unresolvedPackets: state.unresolvedPackets });
      state.unresolvedPackets.push(...admission.admittedPackets);
      progress.newPacketIds.push(...admission.admittedPackets.map(packet => packet.packetId));
      updateFocusMetrics(progress, allocation.queries, reviewed, admission);
      const diversity = computeIndependentSourceDomainDiversity(admission.admittedPackets);
      progress.tranches.push({ trancheNumber, searchCalls: progress.searchCallsUsed - beforeSearchCalls, exploitationSlots: allocation.exploitationSlots, explorationSlots: allocation.explorationSlots, focuses: unique(allocation.queries.map(query => query.focus)), queryOrigins: [...new Set(allocation.queries.map(query => query.queryOrigin))].sort(), independentPagesReviewed: reviewed.independentPagesReviewed, recipeStructuredPagesConfirmed: reviewed.recipeStructuredPagesConfirmed, reviewCandidatesConsidered: reviewed.reviewCandidates.length, reviewReadyPacketsCreated: admission.admittedPackets.length, duplicatePairsSuppressed: admission.duplicatePairsSuppressed, uniqueUsefulSourceDomains: diversity.uniqueIndependentSourceDomains, transientVideoPointersObserved: acquisition.transientVideoPointers, externalReviewErrorCount: reviewed.externalReviewErrors.length });
      await saveState(state);
    }

    const allDomains = new Set();
    for (const row of Object.values(progress.sameDayFocusMetrics)) for (const domain of row.usefulSourceDomains ?? []) allDomains.add(domain);
    const day = {
      quotaDate, completedAt: new Date().toISOString(), searchCapacity: progress.searchCapacity, searchCalls: progress.searchCallsUsed, searchUtilization: progress.searchCapacity ? progress.searchCallsUsed / progress.searchCapacity : 0,
      tranches: progress.tranches, focuses: unique(progress.tranches.flatMap(tranche => tranche.focuses ?? [])), independentPagesReviewed: progress.tranches.reduce((sum, tranche) => sum + tranche.independentPagesReviewed, 0), recipeStructuredPagesConfirmed: progress.tranches.reduce((sum, tranche) => sum + tranche.recipeStructuredPagesConfirmed, 0), reviewCandidatesConsidered: progress.tranches.reduce((sum, tranche) => sum + tranche.reviewCandidatesConsidered, 0), reviewReadyPacketsCreated: progress.tranches.reduce((sum, tranche) => sum + tranche.reviewReadyPacketsCreated, 0), duplicatePairsSuppressed: progress.tranches.reduce((sum, tranche) => sum + tranche.duplicatePairsSuppressed, 0), uniqueUsefulSourceDomains: allDomains.size, unresolvedReviewBacklogAfterRun: state.unresolvedPackets.length, terminalState
    };
    day.researchKpis = computeResearchKpis({ state, day });
    state = appendCompletedAdaptiveDay(state, day);
    await saveState(state);
    return buildSummary(state, day, terminalState, false);
  } catch (error) {
    progress.status = "INTERRUPTED_FAIL_CLOSED";
    progress.lastErrorClass = error?.name ?? "Error";
    progress.lastErrorHash = hash(error?.message ?? String(error)).slice(0, 16);
    await saveState(state);
    throw error;
  } finally {
    await rm(actualCacheDir, { recursive: true, force: true });
  }
}

async function main() {
  try { const summary = await runAdaptiveDailyDiscovery(); process.stdout.write(`${JSON.stringify(summary)}\n`); }
  catch (error) { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
