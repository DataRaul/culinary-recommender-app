import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLIENT_ID = "CULINARY_YOUTUBE_DISCOVERY_V0";
const PROJECT_PURPOSE = "CULINARY_INTERNAL_CULINARY_DISCOVERY";
const SECRET_NAME = "CULINARY_YOUTUBE_API_KEY";
const DEFAULT_PROJECT_IDENTITY = "culinary-youtube-discovery";
const MIN_SEARCH_RESERVE = 5;
const TRANSIENT_TTL_DAYS = 7;
const CANARY_QUERY = "culinary recipe";
const SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";

function isBlueLagoonIdentity(value) {
  return /blue[ _-]*lagoon|music/i.test(value || "");
}

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || String(parsed) !== String(value).trim()) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

export function validateCanaryConfig({ apiKey, dailySearchLimit, projectIdentity = DEFAULT_PROJECT_IDENTITY, policyRecheckedAt }) {
  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
    throw new Error(`${SECRET_NAME} is required`);
  }
  if (typeof projectIdentity !== "string" || projectIdentity.trim().length === 0) {
    throw new Error("CULINARY_YOUTUBE_PROJECT_IDENTITY must be non-empty when supplied");
  }
  if (isBlueLagoonIdentity(projectIdentity)) {
    throw new Error("Culinary canary project identity must not identify Blue Lagoon/music use");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policyRecheckedAt || "")) {
    throw new Error("YT_CUL_POLICY_RECHECKED_AT must be YYYY-MM-DD");
  }
  const limit = parsePositiveInteger(dailySearchLimit, "CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT");
  if (limit <= MIN_SEARCH_RESERVE) {
    throw new Error(`daily Search Queries limit must exceed the ${MIN_SEARCH_RESERVE}-call reserve`);
  }
  if (1 > limit - MIN_SEARCH_RESERVE) {
    throw new Error("one-call canary would consume the protected Search reserve");
  }
  return {
    apiKey: apiKey.trim(),
    dailySearchLimit: limit,
    projectIdentity: projectIdentity.trim(),
    policyRecheckedAt
  };
}

export function buildCanaryRequest(apiKey) {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("q", CANARY_QUERY);
  return {
    url,
    init: {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Goog-Api-Key": apiKey
      },
      signal: AbortSignal.timeout(15000)
    }
  };
}

function safeApiFailure(response, payload) {
  return {
    httpStatus: response.status,
    apiStatus: payload?.error?.status ?? null,
    apiReason: payload?.error?.errors?.[0]?.reason ?? null
  };
}

export function createSafeCanarySummary({ config, responsePayload, retrievedAt, transientCacheDeleted, httpStatus = 200 }) {
  const resultSlotsObserved = Array.isArray(responsePayload?.items) ? responsePayload.items.length : 0;
  return {
    schemaVersion: "youtube-culinary-connectivity-canary-v1",
    phase: "YT-CUL-2",
    result: "PASS",
    clientId: CLIENT_ID,
    projectPurpose: PROJECT_PURPOSE,
    projectIdentity: config.projectIdentity,
    credentialSource: SECRET_NAME,
    blueLagoonCredentialMapped: false,
    crossUseWithBlueLagoonAuthorized: false,
    policyRecheckedAt: config.policyRecheckedAt,
    quota: {
      bucket: "Search Queries",
      verifiedAssignedDailyLimit: config.dailySearchLimit,
      reserveCalls: MIN_SEARCH_RESERVE,
      plannedCalls: 1,
      executedCalls: 1,
      remainingBeforeProtectedReserve: config.dailySearchLimit - MIN_SEARCH_RESERVE - 1
    },
    api: {
      endpoint: "search.list",
      httpStatus,
      resultSlotsObserved
    },
    transientCache: {
      dataClass: "YOUTUBE_API_DATA_TRANSIENT",
      retrievedAt,
      ttlDays: TRANSIENT_TTL_DAYS,
      expiresAt: new Date(Date.parse(retrievedAt) + TRANSIENT_TTL_DAYS * 86400000).toISOString(),
      deletedBeforeJobExit: transientCacheDeleted
    },
    rawYoutubeApiDataEmbedded: false,
    durableYoutubeDerivedMetricsCreated: false,
    automaticAtlasPromotionAuthorized: false,
    automaticAppAdmissionAuthorized: false
  };
}

async function executeCanary({ fetchImpl = fetch, env = process.env } = {}) {
  const config = validateCanaryConfig({
    apiKey: env[SECRET_NAME],
    dailySearchLimit: env.CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT,
    projectIdentity: env.CULINARY_YOUTUBE_PROJECT_IDENTITY || DEFAULT_PROJECT_IDENTITY,
    policyRecheckedAt: env.YT_CUL_POLICY_RECHECKED_AT
  });

  const { url, init } = buildCanaryRequest(config.apiKey);
  const response = await fetchImpl(url, init);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`YouTube search.list returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok) {
    const safe = safeApiFailure(response, payload);
    throw new Error(`YouTube search.list canary failed: ${JSON.stringify(safe)}`);
  }
  if (!Array.isArray(payload?.items)) {
    throw new Error("YouTube search.list canary returned an unexpected response shape");
  }

  const retrievedAt = new Date().toISOString();
  const cacheDir = join(tmpdir(), `yt-cul-2-${process.pid}-${Date.now()}`);
  const cachePath = join(cacheDir, "search-response.json");
  let transientCacheDeleted = false;
  try {
    await mkdir(cacheDir, { recursive: false });
    await writeFile(cachePath, JSON.stringify({
      schemaVersion: "youtube-culinary-transient-cache-v1",
      dataClass: "YOUTUBE_API_DATA_TRANSIENT",
      endpoint: "search.list",
      retrievedAt,
      expiresAt: new Date(Date.parse(retrievedAt) + TRANSIENT_TTL_DAYS * 86400000).toISOString(),
      ttlDays: TRANSIENT_TTL_DAYS,
      payload
    }), { encoding: "utf8", mode: 0o600 });
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
    transientCacheDeleted = true;
  }

  const summary = createSafeCanarySummary({
    config,
    responsePayload: payload,
    retrievedAt,
    transientCacheDeleted,
    httpStatus: response.status
  });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

export { executeCanary };

if (import.meta.url === `file://${process.argv[1]}`) {
  executeCanary().catch(error => {
    process.stderr.write(`YT-CUL-2 FAIL: ${error.message}\n`);
    process.exitCode = 1;
  });
}
