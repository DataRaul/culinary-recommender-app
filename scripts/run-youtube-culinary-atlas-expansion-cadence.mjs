import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  YT_CUL_CLIENT_ID,
  YT_CUL_PROJECT_PURPOSE,
  YT_CUL_SECRET_NAME,
  YT_CUL_MIN_SEARCH_RESERVE,
  YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS,
  assertPolicySafeDurableObject,
  createDailyFunnelReport,
  createPromotionHandoff
} from "./youtube-culinary-discovery-control-plane.mjs";
import { extractExternalUrls, isPublicIpAddress } from "./run-youtube-culinary-discovery-pilot.mjs";

const SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const CHANNELS_ENDPOINT = "https://www.googleapis.com/youtube/v3/channels";
const PLAYLIST_ITEMS_ENDPOINT = "https://www.googleapis.com/youtube/v3/playlistItems";
const VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const DEFAULT_PROJECT_IDENTITY = "culinary-youtube-discovery";
const SEARCH_RESULTS_PER_CALL = 10;
const MAX_SELECTED_CHANNELS = 15;
const MAX_SELECTED_PLAYLISTS = 15;
const MAX_PLAYLIST_SURFACES = 30;
const PLAYLIST_ITEMS_PER_SURFACE = 25;
const MAX_EXTERNAL_REVIEWS = 60;
const MAX_PROMOTION_HANDOFFS = 12;
const MAX_EXTERNAL_BYTES = 512 * 1024;
const MAX_EXTERNAL_REDIRECTS = 3;
const EXTERNAL_FETCH_TIMEOUT_MS = 8000;
const YT_CUL_4_CONFIRMED_PER_SEARCH_BASELINE = 0.625;

export const YT_CUL_5_SEARCH_PLAN = Object.freeze([
  {
    queryId: "c01",
    purpose: "CREATOR_OR_CHANNEL_DISCOVERY",
    resourceType: "channel",
    focus: "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES",
    queryText: "Central African traditional home cooking breakfast staples recipes"
  },
  {
    queryId: "c02",
    purpose: "CREATOR_OR_CHANNEL_DISCOVERY",
    resourceType: "channel",
    focus: "IRAN_CENTRAL_ASIA_AFGHANISTAN__BREADS_SOUPS",
    queryText: "Central Asian traditional breads soups home cooking recipes"
  },
  {
    queryId: "c03",
    purpose: "CREATOR_OR_CHANNEL_DISCOVERY",
    resourceType: "channel",
    focus: "OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED",
    queryText: "Pacific Island traditional earth oven leaf wrapped cooking recipes"
  },
  {
    queryId: "c04",
    purpose: "CREATOR_OR_CHANNEL_DISCOVERY",
    resourceType: "channel",
    focus: "CARIBBEAN__BREAKFAST_ROOT_CROP_ONE_POT",
    queryText: "Caribbean traditional breakfast root crop one pot cooking recipes"
  },
  {
    queryId: "c05",
    purpose: "CREATOR_OR_CHANNEL_DISCOVERY",
    resourceType: "channel",
    focus: "ANDEAN_NORTHERN_SOUTH_AMERICA__GRAINS_SOUPS",
    queryText: "Andean traditional home cooking grains soups recipes"
  },
  {
    queryId: "p01",
    purpose: "PLAYLIST_DISCOVERY",
    resourceType: "playlist",
    focus: "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES",
    queryText: "Central African traditional recipe playlist breakfast staples"
  },
  {
    queryId: "p02",
    purpose: "PLAYLIST_DISCOVERY",
    resourceType: "playlist",
    focus: "IRAN_CENTRAL_ASIA_AFGHANISTAN__BREADS_SOUPS",
    queryText: "Central Asian traditional bread soup recipe playlist"
  },
  {
    queryId: "p03",
    purpose: "PLAYLIST_DISCOVERY",
    resourceType: "playlist",
    focus: "OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED",
    queryText: "Pacific Island traditional food recipe playlist"
  },
  {
    queryId: "p04",
    purpose: "PLAYLIST_DISCOVERY",
    resourceType: "playlist",
    focus: "CARIBBEAN__BREAKFAST_ROOT_CROP_ONE_POT",
    queryText: "Caribbean traditional breakfast recipe playlist"
  },
  {
    queryId: "p05",
    purpose: "PLAYLIST_DISCOVERY",
    resourceType: "playlist",
    focus: "ANDEAN_NORTHERN_SOUTH_AMERICA__GRAINS_SOUPS",
    queryText: "recetas tradicionales andinas playlist cocina casera granos sopas"
  }
]);

const BLOCKED_EXTERNAL_HOST_PATTERNS = [
  /(^|\.)youtube\.com$/i,
  /(^|\.)youtu\.be$/i,
  /(^|\.)google\.com$/i,
  /(^|\.)googleusercontent\.com$/i,
  /(^|\.)instagram\.com$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)fb\.com$/i,
  /(^|\.)tiktok\.com$/i,
  /(^|\.)twitter\.com$/i,
  /(^|\.)x\.com$/i,
  /(^|\.)pinterest\./i,
  /(^|\.)patreon\.com$/i,
  /(^|\.)linktr\.ee$/i,
  /(^|\.)amazon\./i
];

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function positiveInteger(value, label) {
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) throw new Error(`${label} must be a positive integer`);
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer`);
  return parsed;
}

function nonNegativeInteger(value, label) {
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) throw new Error(`${label} must be a non-negative integer`);
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative integer`);
  return parsed;
}

function noBlueLagoon(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} is required`);
  if (/blue[ _-]*lagoon|music/i.test(value)) throw new Error(`${label} must remain isolated from Blue Lagoon/music use`);
  return value.trim();
}

export function validateAtlasCadenceConfig({ apiKey, dailySearchLimit, priorSearchCalls, projectIdentity = DEFAULT_PROJECT_IDENTITY, policyRecheckedAt, quotaDate }) {
  if (typeof apiKey !== "string" || apiKey.trim().length === 0) throw new Error(`${YT_CUL_SECRET_NAME} is required`);
  const limit = positiveInteger(dailySearchLimit, "CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT");
  const prior = nonNegativeInteger(priorSearchCalls, "CULINARY_YOUTUBE_SEARCH_CALLS_ALREADY_USED");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policyRecheckedAt || "")) throw new Error("YT_CUL_POLICY_RECHECKED_AT must be YYYY-MM-DD");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(quotaDate || "")) throw new Error("YT_CUL_QUOTA_DATE must be YYYY-MM-DD");
  const project = noBlueLagoon(projectIdentity, "CULINARY_YOUTUBE_PROJECT_IDENTITY");
  const planned = YT_CUL_5_SEARCH_PLAN.length;
  if (prior + planned > limit - YT_CUL_MIN_SEARCH_RESERVE) {
    throw new Error(`YT-CUL-5 would cross the protected ${YT_CUL_MIN_SEARCH_RESERVE}-call Search reserve`);
  }
  return {
    apiKey: apiKey.trim(),
    dailySearchLimit: limit,
    priorSearchCalls: prior,
    projectIdentity: project,
    policyRecheckedAt,
    quotaDate,
    plannedSearchCalls: planned
  };
}

export function buildAtlasSearchRequest(query, apiKey) {
  if (!['channel', 'playlist'].includes(query?.resourceType)) throw new Error("YT-CUL-5 Search resourceType must be channel or playlist");
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", query.resourceType);
  url.searchParams.set("maxResults", String(SEARCH_RESULTS_PER_CALL));
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("q", query.queryText);
  return {
    url,
    init: {
      method: "GET",
      headers: { Accept: "application/json", "X-Goog-Api-Key": apiKey },
      signal: AbortSignal.timeout(15000)
    }
  };
}

export function buildChannelsListRequest(channelIds, apiKey) {
  if (!Array.isArray(channelIds) || channelIds.length < 1 || channelIds.length > 50) throw new Error("channels.list batch must contain 1..50 IDs");
  const url = new URL(CHANNELS_ENDPOINT);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", channelIds.join(","));
  return {
    url,
    init: {
      method: "GET",
      headers: { Accept: "application/json", "X-Goog-Api-Key": apiKey },
      signal: AbortSignal.timeout(15000)
    }
  };
}

export function buildPlaylistItemsRequest(playlistId, apiKey) {
  if (typeof playlistId !== "string" || playlistId.length === 0) throw new Error("playlistId is required");
  const url = new URL(PLAYLIST_ITEMS_ENDPOINT);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("maxResults", String(PLAYLIST_ITEMS_PER_SURFACE));
  return {
    url,
    init: {
      method: "GET",
      headers: { Accept: "application/json", "X-Goog-Api-Key": apiKey },
      signal: AbortSignal.timeout(15000)
    }
  };
}

export function buildVideosListRequest(videoIds, apiKey) {
  if (!Array.isArray(videoIds) || videoIds.length < 1 || videoIds.length > 50) throw new Error("videos.list batch must contain 1..50 IDs");
  const url = new URL(VIDEOS_ENDPOINT);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoIds.join(","));
  return {
    url,
    init: {
      method: "GET",
      headers: { Accept: "application/json", "X-Goog-Api-Key": apiKey },
      signal: AbortSignal.timeout(15000)
    }
  };
}

function safeYoutubeApiFailure(response, payload, endpoint) {
  return {
    endpoint,
    httpStatus: response.status,
    apiStatus: payload?.error?.status ?? null,
    apiReason: payload?.error?.errors?.[0]?.reason ?? null
  };
}

async function fetchJsonOrThrow(fetchImpl, request, endpoint) {
  const response = await fetchImpl(request.url, request.init);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${endpoint} returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok) throw new Error(`${endpoint} failed: ${JSON.stringify(safeYoutubeApiFailure(response, payload, endpoint))}`);
  return payload;
}

function deterministicSelect(values, cap) {
  return [...new Set(values)].sort((a, b) => hash(a).localeCompare(hash(b))).slice(0, cap);
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

async function writeTransientPayload(cacheDir, filename, metadata, payload) {
  await writeFile(join(cacheDir, filename), JSON.stringify({
    schemaVersion: "youtube-culinary-transient-live-v1",
    dataClass: "YOUTUBE_API_DATA_TRANSIENT",
    retrievedAt: metadata.retrievedAt,
    expiresAt: new Date(Date.parse(metadata.retrievedAt) + YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS * 86400000).toISOString(),
    ttlDays: YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS,
    endpoint: metadata.endpoint,
    queryId: metadata.queryId ?? null,
    payload
  }), { encoding: "utf8", mode: 0o600 });
}

async function assertPublicUrl(url) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("external review URL must be HTTP(S)");
  const host = url.hostname.toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || BLOCKED_EXTERNAL_HOST_PATTERNS.some(pattern => pattern.test(host))) {
    throw new Error("external review host is not eligible");
  }
  if (isIP(host)) {
    if (!isPublicIpAddress(host)) throw new Error("external review IP is private/reserved");
    return;
  }
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(entry => !isPublicIpAddress(entry.address))) throw new Error("external review DNS resolved to private/reserved address space");
}

async function readBoundedText(response) {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_EXTERNAL_BYTES) throw new Error("external review body exceeds byte limit");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_EXTERNAL_BYTES) {
      await reader.cancel();
      throw new Error("external review body exceeds byte limit");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

function hasRecipeStructuredData(html) {
  return /schema\.org\/Recipe/i.test(html) || /"@type"\s*:\s*"Recipe"/i.test(html) || /"@type"\s*:\s*\[[^\]]*"Recipe"/i.test(html);
}

function recipeType(value) {
  if (Array.isArray(value)) return value.some(recipeType);
  if (typeof value !== "string") return false;
  return value === "Recipe" || /(?:^|[/#])Recipe$/i.test(value);
}

function collectRecipeObjects(value, output, budget) {
  if (budget.remaining <= 0 || value === null || typeof value !== "object") return;
  budget.remaining -= 1;
  if (Array.isArray(value)) {
    for (const entry of value) collectRecipeObjects(entry, output, budget);
    return;
  }
  if (recipeType(value["@type"])) output.push(value);
  for (const nested of Object.values(value)) collectRecipeObjects(nested, output, budget);
}

function sanitizeCandidateLabel(value) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (normalized.length < 2 || normalized.length > 160) return null;
  if (/^https?:\/\//i.test(normalized)) return null;
  return normalized;
}

export function extractIndependentRecipeNames(html) {
  if (typeof html !== "string" || html.length === 0) return [];
  const names = [];
  const seen = new Set();
  const scriptPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const raw = match[1].trim().replace(/^<!--\s*/, "").replace(/\s*-->$/, "");
    if (!raw) continue;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const recipeObjects = [];
    collectRecipeObjects(parsed, recipeObjects, { remaining: 2000 });
    for (const recipe of recipeObjects) {
      const label = sanitizeCandidateLabel(recipe?.name);
      if (!label) continue;
      const key = label.toLocaleLowerCase("und");
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(label);
      if (names.length >= 5) return names;
    }
  }
  return names;
}

function normalizeIndependentUrl(value) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(?:utm_[a-z0-9_]+|fbclid|gclid|dclid|mc_cid|mc_eid)$/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

async function reviewExternalPage(initialUrl, fetchImpl = fetch) {
  let current = new URL(initialUrl);
  for (let redirectCount = 0; redirectCount <= MAX_EXTERNAL_REDIRECTS; redirectCount += 1) {
    await assertPublicUrl(current);
    const response = await fetchImpl(current, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        "User-Agent": "CulinaryRecommender-YT-CUL-5/1.0 independent-source-review"
      },
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS)
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_EXTERNAL_REDIRECTS) throw new Error("external review redirect limit exceeded");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`external review HTTP ${response.status}`);
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("external review response is not HTML");
    const html = await readBoundedText(response);
    const recipeStructuredData = hasRecipeStructuredData(html);
    return {
      reachable: true,
      recipeStructuredData,
      recipeNames: recipeStructuredData ? extractIndependentRecipeNames(html) : [],
      finalHost: current.hostname.toLowerCase(),
      finalUrl: normalizeIndependentUrl(current.toString())
    };
  }
  throw new Error("external review did not resolve");
}

export function createIndependentIdentityCandidate({ candidateLabel, sourceDomain, sourceUrl }) {
  const label = sanitizeCandidateLabel(candidateLabel);
  if (!label) throw new Error("candidateLabel must be a bounded non-empty independent-source label");
  if (typeof sourceDomain !== "string" || !sourceDomain.trim()) throw new Error("sourceDomain is required");
  if (typeof sourceUrl !== "string" || !/^https?:\/\//i.test(sourceUrl)) throw new Error("sourceUrl must be HTTP(S)");
  const fingerprint = hash(`${label.toLocaleLowerCase("und")}\n${sourceUrl}`).slice(0, 20);
  const candidate = {
    schemaVersion: "youtube-culinary-atlas-candidate-handoff-v1",
    candidateLabel: label,
    sourceDomain: sourceDomain.toLowerCase(),
    evidenceRole: "INDEPENDENT_RECIPE_PAGE_DISCOVERY_ONLY",
    handoff: createPromotionHandoff({
      handoffId: `yt-cul-5-${fingerprint}`,
      candidateKind: "IDENTITY",
      independentSourceId: `external-domain:${sourceDomain.toLowerCase()}`,
      independentSourceUrl: sourceUrl,
      atlasCandidateId: null,
      reviewNotes: "DISCOVERY_ONLY. Brain must independently verify identity/name, geography/culture, aliases, representative structure and variants before any Atlas promotion."
    }),
    atlasStateChanged: false,
    appStateChanged: false
  };
  assertPolicySafeDurableObject(candidate);
  return candidate;
}

export function classifyAtlasCadence({ callsExecuted, independentlyReviewedCandidates, independentlyConfirmedRecipePages, uniqueConfirmedSourceDomains, atlasCandidateHandoffs }) {
  if (!Number.isInteger(callsExecuted) || callsExecuted < 1) throw new Error("callsExecuted must be >= 1");
  const confirmedPerSearchCall = independentlyConfirmedRecipePages / callsExecuted;
  if (
    atlasCandidateHandoffs >= 5 &&
    uniqueConfirmedSourceDomains >= 4 &&
    independentlyReviewedCandidates >= 10 &&
    confirmedPerSearchCall >= 0.5
  ) return "YT_CUL_5_ATLAS_EXPANSION_CADENCE_EARNED";
  if (atlasCandidateHandoffs >= 3 || independentlyConfirmedRecipePages >= 3 || independentlyReviewedCandidates >= 8) {
    return "YT_CUL_5_USEFUL_BUT_REVIEW_BOUND";
  }
  return "YT_CUL_5_LOW_MARGINAL_VALUE";
}

export async function executeAtlasCadence({ fetchImpl = fetch, env = process.env } = {}) {
  const config = validateAtlasCadenceConfig({
    apiKey: env[YT_CUL_SECRET_NAME],
    dailySearchLimit: env.CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT,
    priorSearchCalls: env.CULINARY_YOUTUBE_SEARCH_CALLS_ALREADY_USED,
    projectIdentity: env.CULINARY_YOUTUBE_PROJECT_IDENTITY || DEFAULT_PROJECT_IDENTITY,
    policyRecheckedAt: env.YT_CUL_POLICY_RECHECKED_AT,
    quotaDate: env.YT_CUL_QUOTA_DATE
  });

  const cacheDir = join(tmpdir(), `yt-cul-5-${process.pid}-${Date.now()}`);
  let cacheDeleted = false;
  let searchCallsExecuted = 0;
  let channelsListCallsExecuted = 0;
  let playlistItemsListCallsExecuted = 0;
  let videosListCallsExecuted = 0;
  let channelResultSlots = 0;
  let playlistResultSlots = 0;
  const channelCandidates = new Set();
  const playlistCandidates = new Set();
  const videoIds = new Set();
  const externalUrls = new Set();
  let independentReviewAttempts = 0;
  let independentlyReviewedCandidates = 0;
  let independentlyConfirmedRecipePages = 0;
  const confirmedSourceDomains = new Set();
  const candidateHandoffs = [];
  const candidateKeys = new Set();

  await mkdir(cacheDir, { recursive: false });
  try {
    for (const query of YT_CUL_5_SEARCH_PLAN) {
      const request = buildAtlasSearchRequest(query, config.apiKey);
      searchCallsExecuted += 1;
      const payload = await fetchJsonOrThrow(fetchImpl, request, "search.list");
      if (!Array.isArray(payload?.items)) throw new Error("search.list returned an unexpected response shape");
      const retrievedAt = new Date().toISOString();
      await writeTransientPayload(cacheDir, `search-${query.queryId}.json`, { retrievedAt, endpoint: "search.list", queryId: query.queryId }, payload);
      if (query.resourceType === "channel") channelResultSlots += payload.items.length;
      else playlistResultSlots += payload.items.length;
      for (const item of payload.items) {
        if (query.resourceType === "channel" && typeof item?.id?.channelId === "string" && item.id.channelId) channelCandidates.add(item.id.channelId);
        if (query.resourceType === "playlist" && typeof item?.id?.playlistId === "string" && item.id.playlistId) playlistCandidates.add(item.id.playlistId);
      }
    }

    const selectedChannels = deterministicSelect([...channelCandidates], MAX_SELECTED_CHANNELS);
    const selectedPlaylists = deterministicSelect([...playlistCandidates], MAX_SELECTED_PLAYLISTS);
    const uploadPlaylists = [];

    if (selectedChannels.length) {
      const request = buildChannelsListRequest(selectedChannels, config.apiKey);
      channelsListCallsExecuted += 1;
      const payload = await fetchJsonOrThrow(fetchImpl, request, "channels.list");
      if (!Array.isArray(payload?.items)) throw new Error("channels.list returned an unexpected response shape");
      const retrievedAt = new Date().toISOString();
      await writeTransientPayload(cacheDir, "channels-01.json", { retrievedAt, endpoint: "channels.list" }, payload);
      for (const item of payload.items) {
        const uploads = item?.contentDetails?.relatedPlaylists?.uploads;
        if (typeof uploads === "string" && uploads) uploadPlaylists.push(uploads);
      }
    }

    const playlistSurfaces = deterministicSelect([...selectedPlaylists, ...uploadPlaylists], MAX_PLAYLIST_SURFACES);
    for (let index = 0; index < playlistSurfaces.length; index += 1) {
      const request = buildPlaylistItemsRequest(playlistSurfaces[index], config.apiKey);
      playlistItemsListCallsExecuted += 1;
      const payload = await fetchJsonOrThrow(fetchImpl, request, "playlistItems.list");
      if (!Array.isArray(payload?.items)) throw new Error("playlistItems.list returned an unexpected response shape");
      const retrievedAt = new Date().toISOString();
      await writeTransientPayload(cacheDir, `playlist-items-${String(index + 1).padStart(2, "0")}.json`, { retrievedAt, endpoint: "playlistItems.list" }, payload);
      for (const item of payload.items) {
        const id = item?.contentDetails?.videoId;
        if (typeof id === "string" && id) videoIds.add(id);
      }
    }

    const orderedVideoIds = deterministicSelect([...videoIds], videoIds.size);
    for (const batch of chunk(orderedVideoIds, 50)) {
      if (!batch.length) continue;
      const request = buildVideosListRequest(batch, config.apiKey);
      videosListCallsExecuted += 1;
      const payload = await fetchJsonOrThrow(fetchImpl, request, "videos.list");
      if (!Array.isArray(payload?.items)) throw new Error("videos.list returned an unexpected response shape");
      const retrievedAt = new Date().toISOString();
      await writeTransientPayload(cacheDir, `videos-${String(videosListCallsExecuted).padStart(2, "0")}.json`, { retrievedAt, endpoint: "videos.list" }, payload);
      for (const item of payload.items) {
        for (const url of extractExternalUrls(item?.snippet?.description ?? "")) externalUrls.add(url);
      }
    }

    const orderedExternalUrls = deterministicSelect([...externalUrls], MAX_EXTERNAL_REVIEWS);
    for (const url of orderedExternalUrls) {
      independentReviewAttempts += 1;
      try {
        const review = await reviewExternalPage(url, fetchImpl);
        independentlyReviewedCandidates += 1;
        if (!review.recipeStructuredData) continue;
        independentlyConfirmedRecipePages += 1;
        confirmedSourceDomains.add(review.finalHost);
        const candidateLabel = review.recipeNames[0] ?? null;
        if (!candidateLabel || candidateHandoffs.length >= MAX_PROMOTION_HANDOFFS) continue;
        const candidateKey = candidateLabel.toLocaleLowerCase("und");
        if (candidateKeys.has(candidateKey)) continue;
        candidateKeys.add(candidateKey);
        candidateHandoffs.push(createIndependentIdentityCandidate({
          candidateLabel,
          sourceDomain: review.finalHost,
          sourceUrl: review.finalUrl
        }));
      } catch {
        // URL-level failures remain transient; no failed URL or raw response is persisted.
      }
    }
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
    cacheDeleted = true;
  }

  if (!cacheDeleted) throw new Error("transient cache cleanup failed");
  if (searchCallsExecuted !== config.plannedSearchCalls) throw new Error("executed Search calls do not match preregistered plan");
  if (config.priorSearchCalls + searchCallsExecuted > config.dailySearchLimit - YT_CUL_MIN_SEARCH_RESERVE) throw new Error("protected Search reserve was crossed");

  const terminalClassification = classifyAtlasCadence({
    callsExecuted: searchCallsExecuted,
    independentlyReviewedCandidates,
    independentlyConfirmedRecipePages,
    uniqueConfirmedSourceDomains: confirmedSourceDomains.size,
    atlasCandidateHandoffs: candidateHandoffs.length
  });
  const confirmedPerSearchCall = independentlyConfirmedRecipePages / searchCallsExecuted;
  const candidateHandoffsPerSearchCall = candidateHandoffs.length / searchCallsExecuted;

  const dailyFunnelReport = createDailyFunnelReport({
    runId: `yt-cul-5-${config.quotaDate}`,
    quotaDate: config.quotaDate,
    clientProjectIdentity: config.projectIdentity,
    callsPlanned: config.plannedSearchCalls,
    callsExecuted: searchCallsExecuted,
    callsReserved: YT_CUL_MIN_SEARCH_RESERVE,
    resultSlotsObserved: channelResultSlots + playlistResultSlots,
    transientUniqueCandidatePointers: channelCandidates.size + playlistCandidates.size,
    newCandidateSourceFamilies: confirmedSourceDomains.size,
    atlasFamilyCandidatesNominated: candidateHandoffs.length,
    variantOrTechniqueQuestionsNominated: 0,
    independentlyReviewedCandidates,
    atlasPromotions: { IDENTITY: 0, STRUCTURE: 0, VARIANT: 0, TECHNIQUE: 0, TRANSFORMATION: 0 },
    appHandoffsCreated: 0,
    publicRecipesAdmitted: 0
  });

  const generalReadCalls = channelsListCallsExecuted + playlistItemsListCallsExecuted + videosListCallsExecuted;
  const summary = {
    schemaVersion: "youtube-culinary-atlas-expansion-cadence-v1",
    phase: "YT-CUL-5",
    result: "PASS",
    terminalClassification,
    clientId: YT_CUL_CLIENT_ID,
    projectPurpose: YT_CUL_PROJECT_PURPOSE,
    projectIdentity: config.projectIdentity,
    credentialSource: YT_CUL_SECRET_NAME,
    policyRecheckedAt: config.policyRecheckedAt,
    quotaDate: config.quotaDate,
    atlasBaseline: {
      knowledgeCoreMainSnapshot: "77849eb20c3050eb3fd51f0bd28560ddcfc60631",
      seedCandidates: 338,
      macroRegionalBuckets: 20,
      identityVerified: 32,
      identityUnverified: 306,
      structureVerified: 25,
      variantAware: 25,
      transformationAware: 5,
      appAuthoringEligible: 0,
      publicExportEligible: 0,
      baselineUsedForRoutingOnly: true,
      knowledgeCoreStateChanged: false
    },
    quota: {
      searchQueries: {
        verifiedAssignedDailyLimit: config.dailySearchLimit,
        callsAlreadyUsedBeforeLane: config.priorSearchCalls,
        callsPlanned: config.plannedSearchCalls,
        callsExecuted: searchCallsExecuted,
        protectedReserve: YT_CUL_MIN_SEARCH_RESERVE,
        remainingBeforeProtectedReserve: config.dailySearchLimit - YT_CUL_MIN_SEARCH_RESERVE - config.priorSearchCalls - searchCallsExecuted
      },
      generalQueries: {
        channelsListCallsExecuted,
        playlistItemsListCallsExecuted,
        videosListCallsExecuted,
        totalExecuted: generalReadCalls,
        ownerReportedDailyLimit: 10000
      }
    },
    acquisition: {
      focusAreasPreregistered: new Set(YT_CUL_5_SEARCH_PLAN.map(query => query.focus)).size,
      channelSearchCalls: YT_CUL_5_SEARCH_PLAN.filter(query => query.resourceType === "channel").length,
      playlistSearchCalls: YT_CUL_5_SEARCH_PLAN.filter(query => query.resourceType === "playlist").length,
      resultsPerSearchCallRequested: SEARCH_RESULTS_PER_CALL,
      channelResultSlots,
      playlistResultSlots,
      transientUniqueChannelCandidates: channelCandidates.size,
      transientUniquePlaylistCandidates: playlistCandidates.size,
      selectedChannelCandidates: deterministicSelect([...channelCandidates], MAX_SELECTED_CHANNELS).length,
      selectedPlaylistCandidates: deterministicSelect([...playlistCandidates], MAX_SELECTED_PLAYLISTS).length,
      playlistSurfacesInspected: playlistItemsListCallsExecuted,
      transientUniqueVideoPointers: videoIds.size,
      externalSourcePointersObserved: externalUrls.size,
      independentReviewAttemptCap: MAX_EXTERNAL_REVIEWS,
      independentReviewAttempts,
      independentlyReviewedCandidates,
      independentlyConfirmedRecipePages,
      uniqueConfirmedSourceDomains: confirmedSourceDomains.size,
      independentIdentityCandidateHandoffs: candidateHandoffs.length
    },
    cadence: {
      ytCul4ConfirmedRecipePagesPerSearchCallBaseline: YT_CUL_4_CONFIRMED_PER_SEARCH_BASELINE,
      confirmedRecipePagesPerSearchCall: confirmedPerSearchCall,
      confirmedRecipePageEfficiencyRatioVsYtCul4: confirmedPerSearchCall / YT_CUL_4_CONFIRMED_PER_SEARCH_BASELINE,
      identityCandidateHandoffsPerSearchCall: candidateHandoffsPerSearchCall,
      candidatePromotionState: "DISCOVERY_ONLY_INDEPENDENT_EVIDENCE_HANDOFF",
      atlasStateChanged: false,
      appStateChanged: false,
      ytCul6AutomaticallyEarned: false
    },
    candidateHandoffs,
    dailyFunnelReport,
    controls: {
      rawYoutubeApiDataEmbedded: false,
      unreviewedExternalUrlsEmbedded: false,
      independentlyReviewedSourceUrlsEmbeddedOnlyInsidePromotionHandoffs: true,
      transientCacheTtlDays: YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS,
      transientRawPayloadDeletedBeforeJobExit: cacheDeleted,
      youtubeDerivedCreatorQualityScoreCreated: false,
      youtubeDerivedAuthenticityScoreCreated: false,
      youtubeDerivedEngagementScoreCreated: false,
      youtubeStatisticsRead: false,
      searchPaginationUsed: false,
      playlistPaginationUsed: false,
      audiovisualDownloaded: false,
      blueLagoonCredentialMapped: false,
      crossUseWithBlueLagoonAuthorized: false,
      automaticAtlasPromotionAuthorized: false,
      automaticAppAdmissionAuthorized: false,
      publicRuntimeActivationAuthorized: false,
      grossYoutubeResultsAreRecipesAcquired: false
    }
  };
  assertPolicySafeDurableObject(summary);
  return summary;
}

async function main() {
  try {
    const summary = await executeAtlasCadence();
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    const safeFailure = {
      schemaVersion: "youtube-culinary-atlas-expansion-cadence-v1",
      phase: "YT-CUL-5",
      result: "FAIL_CLOSED",
      terminalClassification: "POLICY_QUOTA_NETWORK_OR_EVIDENCE_REDESIGN_REQUIRED",
      errorType: error?.name ?? "Error",
      errorMessage: String(error?.message ?? error).replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED]"),
      rawYoutubeApiDataEmbedded: false,
      unreviewedExternalUrlsEmbedded: false,
      automaticAtlasPromotionAuthorized: false,
      automaticAppAdmissionAuthorized: false
    };
    process.stdout.write(`${JSON.stringify(safeFailure, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) await main();
