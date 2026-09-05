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
  createDailyFunnelReport
} from "./youtube-culinary-discovery-control-plane.mjs";

const SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const DEFAULT_PROJECT_IDENTITY = "culinary-youtube-discovery";
const SEARCH_RESULTS_PER_CALL = 25;
const MAX_EXTERNAL_REVIEWS = 40;
const MAX_EXTERNAL_BYTES = 512 * 1024;
const MAX_EXTERNAL_REDIRECTS = 3;
const EXTERNAL_FETCH_TIMEOUT_MS = 8000;

export const YT_CUL_3_SEARCH_PLAN = Object.freeze([
  { queryId: "q01", purpose: "CUISINE_REGION_GAP", queryText: "traditional Sahel home cooking recipe" },
  { queryId: "q02", purpose: "CUISINE_REGION_GAP", queryText: "traditional Horn of Africa home cooking recipe" },
  { queryId: "q03", purpose: "CUISINE_REGION_GAP", queryText: "traditional Central African home cooking recipe" },
  { queryId: "q04", purpose: "CUISINE_REGION_GAP", queryText: "traditional Central Asian home cooking recipe" },
  { queryId: "q05", purpose: "CUISINE_REGION_GAP", queryText: "traditional Caucasus home cooking recipe" },
  { queryId: "q06", purpose: "CUISINE_REGION_GAP", queryText: "traditional Pacific Islands home cooking recipe" },
  { queryId: "q07", purpose: "CUISINE_REGION_GAP", queryText: "receta tradicional andina cocina casera" },
  { queryId: "q08", purpose: "CUISINE_REGION_GAP", queryText: "receta tradicional caribeña cocina casera" },
  { queryId: "q09", purpose: "DISH_FAMILY_DISCOVERY", queryText: "traditional Balkan home cooking dish recipe" },
  { queryId: "q10", purpose: "DISH_FAMILY_DISCOVERY", queryText: "traditional Levant home cooking dish recipe" },
  { queryId: "q11", purpose: "DISH_FAMILY_DISCOVERY", queryText: "traditional Southeast Asian home cooking dish recipe" },
  { queryId: "q12", purpose: "DISH_FAMILY_DISCOVERY", queryText: "traditional South Indian home cooking dish recipe" },
  { queryId: "q13", purpose: "VARIANT_DISCOVERY", queryText: "regional variations jollof rice recipe" },
  { queryId: "q14", purpose: "VARIANT_DISCOVERY", queryText: "regional variations khachapuri recipe" },
  { queryId: "q15", purpose: "VARIANT_DISCOVERY", queryText: "variantes regionales tamal receta tradicional" },
  { queryId: "q16", purpose: "VARIANT_DISCOVERY", queryText: "regional variations laksa traditional recipe" },
  { queryId: "q17", purpose: "TECHNIQUE_SOURCE_DISCOVERY", queryText: "traditional leaf wrapped cooking recipe" },
  { queryId: "q18", purpose: "TECHNIQUE_SOURCE_DISCOVERY", queryText: "traditional clay pot cooking recipe" },
  { queryId: "q19", purpose: "TECHNIQUE_SOURCE_DISCOVERY", queryText: "traditional fermented batter recipe" },
  { queryId: "q20", purpose: "TECHNIQUE_SOURCE_DISCOVERY", queryText: "traditional stone ground maize recipe" },
  { queryId: "q21", purpose: "EXTERNAL_RECIPE_SOURCE_DISCOVERY", queryText: "traditional West African cooking full recipe website" },
  { queryId: "q22", purpose: "EXTERNAL_RECIPE_SOURCE_DISCOVERY", queryText: "traditional Central Asian cooking full recipe website" },
  { queryId: "q23", purpose: "EXTERNAL_RECIPE_SOURCE_DISCOVERY", queryText: "traditional Caribbean cooking recipe link website" },
  { queryId: "q24", purpose: "CONTROL", queryText: "arepa traditional recipe" }
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

export function validatePilotConfig({ apiKey, dailySearchLimit, priorSearchCalls, projectIdentity = DEFAULT_PROJECT_IDENTITY, policyRecheckedAt, quotaDate }) {
  if (typeof apiKey !== "string" || apiKey.trim().length === 0) throw new Error(`${YT_CUL_SECRET_NAME} is required`);
  const limit = positiveInteger(dailySearchLimit, "CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT");
  const prior = nonNegativeInteger(priorSearchCalls, "CULINARY_YOUTUBE_SEARCH_CALLS_ALREADY_USED");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policyRecheckedAt || "")) throw new Error("YT_CUL_POLICY_RECHECKED_AT must be YYYY-MM-DD");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(quotaDate || "")) throw new Error("YT_CUL_QUOTA_DATE must be YYYY-MM-DD");
  const project = noBlueLagoon(projectIdentity, "CULINARY_YOUTUBE_PROJECT_IDENTITY");
  const planned = YT_CUL_3_SEARCH_PLAN.length;
  if (prior + planned > limit - YT_CUL_MIN_SEARCH_RESERVE) {
    throw new Error(`YT-CUL-3 would cross the protected ${YT_CUL_MIN_SEARCH_RESERVE}-call Search reserve`);
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

export function buildSearchRequest(query, apiKey) {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
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
  return { response, payload };
}

function trimUrlToken(value) {
  return value.replace(/[),.;!?\]}>'"]+$/g, "");
}

function independentCandidateUrl(value) {
  let url;
  try {
    url = new URL(value.startsWith("www.") ? `https://${value}` : value);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  if (!host || BLOCKED_EXTERNAL_HOST_PATTERNS.some(pattern => pattern.test(host))) return null;
  url.hash = "";
  return url.toString();
}

export function extractExternalUrls(description) {
  if (typeof description !== "string" || description.length === 0) return [];
  const matches = description.match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) ?? [];
  const urls = [];
  for (const match of matches) {
    const candidate = independentCandidateUrl(trimUrlToken(match));
    if (candidate) urls.push(candidate);
  }
  return [...new Set(urls)];
}

function isPrivateOrReservedIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 198 && (b === 18 || b === 19 || b === 51)) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  return false;
}

function isPrivateOrReservedIpv6(address) {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  if (normalized.startsWith("2001:db8:")) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateOrReservedIpv4(mapped[1]);
  return false;
}

export function isPublicIpAddress(address) {
  const family = isIP(address);
  if (family === 4) return !isPrivateOrReservedIpv4(address);
  if (family === 6) return !isPrivateOrReservedIpv6(address);
  return false;
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

async function reviewExternalPage(initialUrl, fetchImpl = fetch) {
  let current = new URL(initialUrl);
  for (let redirectCount = 0; redirectCount <= MAX_EXTERNAL_REDIRECTS; redirectCount += 1) {
    await assertPublicUrl(current);
    const response = await fetchImpl(current, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        "User-Agent": "CulinaryRecommender-YT-CUL-3/1.0 independent-source-review"
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
    return {
      reachable: true,
      recipeStructuredData: hasRecipeStructuredData(html),
      finalHost: current.hostname.toLowerCase()
    };
  }
  throw new Error("external review did not resolve");
}

export function classifyPilot({ callsExecuted, uniqueCandidatePointers, externalSourcePointers, independentlyReviewedCandidates, independentlyConfirmedRecipePages, uniqueConfirmedSourceDomains }) {
  if (!Number.isInteger(callsExecuted) || callsExecuted < 1) throw new Error("callsExecuted must be >= 1 for terminal classification");
  const confirmedPerCall = independentlyConfirmedRecipePages / callsExecuted;
  if (independentlyConfirmedRecipePages >= 10 && uniqueConfirmedSourceDomains >= 6 && confirmedPerCall >= 0.25) {
    return "YOUTUBE_CULINARY_DISCOVERY_HIGH_INFORMATION_GAIN";
  }
  if (
    independentlyConfirmedRecipePages >= 3 ||
    independentlyReviewedCandidates >= 8 ||
    externalSourcePointers >= 10 ||
    (uniqueCandidatePointers >= 200 && externalSourcePointers >= 3)
  ) {
    return "YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND";
  }
  return "YOUTUBE_CULINARY_DISCOVERY_LOW_MARGINAL_VALUE";
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

export async function executePilot({ fetchImpl = fetch, env = process.env } = {}) {
  const config = validatePilotConfig({
    apiKey: env[YT_CUL_SECRET_NAME],
    dailySearchLimit: env.CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT,
    priorSearchCalls: env.CULINARY_YOUTUBE_SEARCH_CALLS_ALREADY_USED,
    projectIdentity: env.CULINARY_YOUTUBE_PROJECT_IDENTITY || DEFAULT_PROJECT_IDENTITY,
    policyRecheckedAt: env.YT_CUL_POLICY_RECHECKED_AT,
    quotaDate: env.YT_CUL_QUOTA_DATE
  });

  const cacheDir = join(tmpdir(), `yt-cul-3-${process.pid}-${Date.now()}`);
  let cacheDeleted = false;
  let searchCallsExecuted = 0;
  let generalQueriesExecuted = 0;
  let resultSlotsObserved = 0;
  const videoIds = new Set();
  const channelIds = new Set();
  const externalUrls = new Set();
  let independentlyReviewedCandidates = 0;
  let independentlyConfirmedRecipePages = 0;
  const confirmedSourceDomains = new Set();
  let independentReviewAttempts = 0;

  await mkdir(cacheDir, { recursive: false });
  try {
    for (const query of YT_CUL_3_SEARCH_PLAN) {
      const request = buildSearchRequest(query, config.apiKey);
      searchCallsExecuted += 1;
      const { payload } = await fetchJsonOrThrow(fetchImpl, request, "search.list");
      if (!Array.isArray(payload?.items)) throw new Error("search.list returned an unexpected response shape");
      const retrievedAt = new Date().toISOString();
      await writeTransientPayload(cacheDir, `search-${query.queryId}.json`, { retrievedAt, endpoint: "search.list", queryId: query.queryId }, payload);
      resultSlotsObserved += payload.items.length;
      for (const item of payload.items) {
        if (typeof item?.id?.videoId === "string" && item.id.videoId) videoIds.add(item.id.videoId);
        if (typeof item?.snippet?.channelId === "string" && item.snippet.channelId) channelIds.add(item.snippet.channelId);
      }
    }

    const orderedVideoIds = [...videoIds].sort((a, b) => hash(a).localeCompare(hash(b)));
    for (const batch of chunk(orderedVideoIds, 50)) {
      if (!batch.length) continue;
      const request = buildVideosListRequest(batch, config.apiKey);
      generalQueriesExecuted += 1;
      const { payload } = await fetchJsonOrThrow(fetchImpl, request, "videos.list");
      if (!Array.isArray(payload?.items)) throw new Error("videos.list returned an unexpected response shape");
      const retrievedAt = new Date().toISOString();
      await writeTransientPayload(cacheDir, `videos-${String(generalQueriesExecuted).padStart(2, "0")}.json`, { retrievedAt, endpoint: "videos.list" }, payload);
      for (const item of payload.items) {
        if (typeof item?.snippet?.channelId === "string" && item.snippet.channelId) channelIds.add(item.snippet.channelId);
        for (const url of extractExternalUrls(item?.snippet?.description ?? "")) externalUrls.add(url);
      }
    }

    const orderedExternalUrls = [...externalUrls].sort((a, b) => hash(a).localeCompare(hash(b))).slice(0, MAX_EXTERNAL_REVIEWS);
    for (const url of orderedExternalUrls) {
      independentReviewAttempts += 1;
      try {
        const review = await reviewExternalPage(url, fetchImpl);
        independentlyReviewedCandidates += 1;
        if (review.recipeStructuredData) {
          independentlyConfirmedRecipePages += 1;
          confirmedSourceDomains.add(review.finalHost);
        }
      } catch {
        // Failures/rejections remain transient and are intentionally not persisted with URL-level detail.
      }
    }
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
    cacheDeleted = true;
  }

  if (!cacheDeleted) throw new Error("transient cache cleanup failed");
  if (searchCallsExecuted !== config.plannedSearchCalls) throw new Error("executed Search calls do not match preregistered plan");
  if (config.priorSearchCalls + searchCallsExecuted > config.dailySearchLimit - YT_CUL_MIN_SEARCH_RESERVE) throw new Error("protected Search reserve was crossed");

  const terminalClassification = classifyPilot({
    callsExecuted: searchCallsExecuted,
    uniqueCandidatePointers: videoIds.size,
    externalSourcePointers: externalUrls.size,
    independentlyReviewedCandidates,
    independentlyConfirmedRecipePages,
    uniqueConfirmedSourceDomains: confirmedSourceDomains.size
  });

  const dailyFunnelReport = createDailyFunnelReport({
    runId: `yt-cul-3-${config.quotaDate}`,
    quotaDate: config.quotaDate,
    clientProjectIdentity: config.projectIdentity,
    callsPlanned: config.plannedSearchCalls,
    callsExecuted: searchCallsExecuted,
    callsReserved: YT_CUL_MIN_SEARCH_RESERVE,
    resultSlotsObserved,
    transientUniqueCandidatePointers: videoIds.size,
    newCandidateSourceFamilies: confirmedSourceDomains.size,
    atlasFamilyCandidatesNominated: 0,
    variantOrTechniqueQuestionsNominated: 0,
    independentlyReviewedCandidates,
    atlasPromotions: { IDENTITY: 0, STRUCTURE: 0, VARIANT: 0, TECHNIQUE: 0, TRANSFORMATION: 0 },
    appHandoffsCreated: 0,
    publicRecipesAdmitted: 0
  });

  const summary = {
    schemaVersion: "youtube-culinary-discovery-pilot-v1",
    phase: "YT-CUL-3",
    result: "PASS",
    terminalClassification,
    clientId: YT_CUL_CLIENT_ID,
    projectPurpose: YT_CUL_PROJECT_PURPOSE,
    projectIdentity: config.projectIdentity,
    credentialSource: YT_CUL_SECRET_NAME,
    policyRecheckedAt: config.policyRecheckedAt,
    quotaDate: config.quotaDate,
    quota: {
      searchQueries: {
        verifiedAssignedDailyLimit: config.dailySearchLimit,
        callsAlreadyUsedBeforePilot: config.priorSearchCalls,
        callsPlanned: config.plannedSearchCalls,
        callsExecuted: searchCallsExecuted,
        protectedReserve: YT_CUL_MIN_SEARCH_RESERVE,
        remainingBeforeProtectedReserve: config.dailySearchLimit - YT_CUL_MIN_SEARCH_RESERVE - config.priorSearchCalls - searchCallsExecuted
      },
      generalQueries: {
        videosListCallsExecuted: generalQueriesExecuted,
        ownerReportedDailyLimit: 10000
      }
    },
    acquisition: {
      searchQueries: YT_CUL_3_SEARCH_PLAN.length,
      resultsPerSearchCallRequested: SEARCH_RESULTS_PER_CALL,
      resultSlotsObserved,
      transientUniqueCandidatePointers: videoIds.size,
      transientUniqueCandidateChannels: channelIds.size,
      externalSourcePointersObserved: externalUrls.size,
      independentReviewAttemptCap: MAX_EXTERNAL_REVIEWS,
      independentReviewAttempts,
      independentlyReviewedCandidates,
      independentlyConfirmedRecipePages,
      uniqueConfirmedSourceDomains: confirmedSourceDomains.size
    },
    dailyFunnelReport,
    controls: {
      rawYoutubeApiDataEmbedded: false,
      externalUrlsEmbedded: false,
      transientCacheTtlDays: YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS,
      transientRawPayloadDeletedBeforeJobExit: cacheDeleted,
      youtubeDerivedCreatorQualityScoreCreated: false,
      youtubeDerivedAuthenticityScoreCreated: false,
      youtubeDerivedEngagementScoreCreated: false,
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
    const summary = await executePilot();
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    const safeFailure = {
      schemaVersion: "youtube-culinary-discovery-pilot-v1",
      phase: "YT-CUL-3",
      result: "FAIL_CLOSED",
      terminalClassification: "POLICY_OR_STORAGE_REDESIGN_REQUIRED",
      errorType: error?.name ?? "Error",
      errorMessage: String(error?.message ?? error).replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED]"),
      rawYoutubeApiDataEmbedded: false,
      externalUrlsEmbedded: false
    };
    process.stdout.write(`${JSON.stringify(safeFailure, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) await main();
