import { createHash } from "node:crypto";

export const YT_CUL_SCHEMA_VERSION = "youtube-culinary-discovery-v0";
export const YT_CUL_CLIENT_ID = "CULINARY_YOUTUBE_DISCOVERY_V0";
export const YT_CUL_PROJECT_PURPOSE = "CULINARY_INTERNAL_CULINARY_DISCOVERY";
export const YT_CUL_SECRET_NAME = "CULINARY_YOUTUBE_API_KEY";
export const YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS = 7;
export const YT_CUL_MAX_TRANSIENT_TTL_DAYS = 30;
export const YT_CUL_MIN_SEARCH_RESERVE = 5;

export const YT_CUL_SEARCH_PURPOSES = Object.freeze([
  "DISH_FAMILY_DISCOVERY",
  "CUISINE_REGION_GAP",
  "VARIANT_DISCOVERY",
  "TECHNIQUE_SOURCE_DISCOVERY",
  "CREATOR_OR_CHANNEL_DISCOVERY",
  "PLAYLIST_DISCOVERY",
  "EXTERNAL_RECIPE_SOURCE_DISCOVERY",
  "TARGETED_REPLICATION",
  "CONTROL"
]);

export const YT_CUL_ATLAS_PROMOTION_KINDS = Object.freeze([
  "IDENTITY",
  "STRUCTURE",
  "VARIANT",
  "TECHNIQUE",
  "TRANSFORMATION"
]);

const RAW_YOUTUBE_METADATA_KEYS = new Set([
  "title",
  "description",
  "channelTitle",
  "videoId",
  "channelId",
  "playlistId",
  "tags",
  "thumbnail",
  "thumbnails",
  "viewCount",
  "likeCount",
  "commentCount",
  "subscriberCount"
]);

const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const isIsoDateTime = value => isNonEmptyString(value) && Number.isFinite(Date.parse(value));
const sha256 = value => createHash("sha256").update(value).digest("hex");

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function assertInteger(value, label, { min = 0 } = {}) {
  if (!Number.isInteger(value) || value < min) throw new Error(`${label} must be an integer >= ${min}`);
}

function assertFiniteNonNegative(value, label) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a finite number >= 0`);
}

function assertNoBlueLagoonIdentity(value, label) {
  if (!isNonEmptyString(value)) throw new Error(`${label} is required`);
  if (/blue[ _-]*lagoon|music/i.test(value)) {
    throw new Error(`${label} must be dedicated to the Culinary API client and must not identify Blue Lagoon/music use`);
  }
}

function maxAgeMs(days) {
  return days * 24 * 60 * 60 * 1000;
}

export function validateClientContract(contract) {
  const errors = [];
  if (!isObject(contract)) return ["client contract must be an object"];
  if (contract.schemaVersion !== YT_CUL_SCHEMA_VERSION) errors.push(`schemaVersion must be ${YT_CUL_SCHEMA_VERSION}`);
  if (contract.clientId !== YT_CUL_CLIENT_ID) errors.push(`clientId must be ${YT_CUL_CLIENT_ID}`);
  if (contract.projectPurpose !== YT_CUL_PROJECT_PURPOSE) errors.push(`projectPurpose must be ${YT_CUL_PROJECT_PURPOSE}`);
  if (contract.secretName !== YT_CUL_SECRET_NAME) errors.push(`secretName must be ${YT_CUL_SECRET_NAME}`);
  if (contract.oauthRequired !== false) errors.push("oauthRequired must remain false for V0 public discovery");
  if (contract.liveApiCallsAuthorized !== false) errors.push("liveApiCallsAuthorized must remain false in YT-CUL-0");
  if (contract.publicRuntimeDependencyAuthorized !== false) errors.push("publicRuntimeDependencyAuthorized must remain false");
  if (contract.rawYoutubeApiDataDurableStorageAuthorized !== false) errors.push("rawYoutubeApiDataDurableStorageAuthorized must remain false");
  if (contract.derivedYoutubeMetricsAuthorized !== false) errors.push("derivedYoutubeMetricsAuthorized must remain false without an applicable audited permission path");
  if (contract.crossUseWithBlueLagoonAuthorized !== false) errors.push("crossUseWithBlueLagoonAuthorized must remain false");
  if (contract.oneApiProjectPerClient !== true) errors.push("oneApiProjectPerClient must be true");
  if (contract.transientDefaultTtlDays !== YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS) errors.push(`transientDefaultTtlDays must be ${YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS}`);
  if (contract.transientMaxTtlDays !== YT_CUL_MAX_TRANSIENT_TTL_DAYS) errors.push(`transientMaxTtlDays must be ${YT_CUL_MAX_TRANSIENT_TTL_DAYS}`);
  try { assertNoBlueLagoonIdentity(contract.clientId, "clientId"); } catch (error) { errors.push(error.message); }
  try { assertNoBlueLagoonIdentity(contract.projectPurpose, "projectPurpose"); } catch (error) { errors.push(error.message); }
  return errors;
}

export function createClientContract() {
  return Object.freeze({
    schemaVersion: YT_CUL_SCHEMA_VERSION,
    clientId: YT_CUL_CLIENT_ID,
    projectPurpose: YT_CUL_PROJECT_PURPOSE,
    secretName: YT_CUL_SECRET_NAME,
    oauthRequired: false,
    liveApiCallsAuthorized: false,
    publicRuntimeDependencyAuthorized: false,
    rawYoutubeApiDataDurableStorageAuthorized: false,
    derivedYoutubeMetricsAuthorized: false,
    crossUseWithBlueLagoonAuthorized: false,
    oneApiProjectPerClient: true,
    transientDefaultTtlDays: YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS,
    transientMaxTtlDays: YT_CUL_MAX_TRANSIENT_TTL_DAYS
  });
}

export function assertValidClientContract(contract) {
  const errors = validateClientContract(contract);
  if (errors.length) throw new Error(`Invalid YT-CUL client contract:\n- ${errors.join("\n- ")}`);
  return contract;
}

export function createQuotaLedger({ projectIdentity, quotaDate, dailySearchLimit, reserveCalls = YT_CUL_MIN_SEARCH_RESERVE }) {
  assertNoBlueLagoonIdentity(projectIdentity, "projectIdentity");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(quotaDate || "")) throw new Error("quotaDate must be YYYY-MM-DD");
  assertInteger(dailySearchLimit, "dailySearchLimit", { min: 1 });
  assertInteger(reserveCalls, "reserveCalls", { min: YT_CUL_MIN_SEARCH_RESERVE });
  if (reserveCalls >= dailySearchLimit) throw new Error("reserveCalls must be lower than dailySearchLimit");
  return {
    schemaVersion: "youtube-culinary-quota-ledger-v0",
    clientId: YT_CUL_CLIENT_ID,
    projectPurpose: YT_CUL_PROJECT_PURPOSE,
    projectIdentity,
    quotaDate,
    dailySearchLimit,
    reserveCalls,
    acquisitionBudget: dailySearchLimit - reserveCalls,
    plannedCalls: 0,
    executedCalls: 0,
    liveApiCallsAuthorized: false,
    crossUseWithBlueLagoonAuthorized: false
  };
}

export function validateQuotaLedger(ledger) {
  const errors = [];
  if (!isObject(ledger)) return ["quota ledger must be an object"];
  if (ledger.schemaVersion !== "youtube-culinary-quota-ledger-v0") errors.push("invalid quota ledger schemaVersion");
  if (ledger.clientId !== YT_CUL_CLIENT_ID) errors.push(`clientId must be ${YT_CUL_CLIENT_ID}`);
  if (ledger.projectPurpose !== YT_CUL_PROJECT_PURPOSE) errors.push(`projectPurpose must be ${YT_CUL_PROJECT_PURPOSE}`);
  if (!isNonEmptyString(ledger.projectIdentity)) errors.push("projectIdentity is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ledger.quotaDate || "")) errors.push("quotaDate must be YYYY-MM-DD");
  if (!Number.isInteger(ledger.dailySearchLimit) || ledger.dailySearchLimit < 1) errors.push("dailySearchLimit must be a positive integer");
  if (!Number.isInteger(ledger.reserveCalls) || ledger.reserveCalls < YT_CUL_MIN_SEARCH_RESERVE) errors.push(`reserveCalls must be >= ${YT_CUL_MIN_SEARCH_RESERVE}`);
  if (ledger.reserveCalls >= ledger.dailySearchLimit) errors.push("reserveCalls must be lower than dailySearchLimit");
  if (ledger.acquisitionBudget !== ledger.dailySearchLimit - ledger.reserveCalls) errors.push("acquisitionBudget must equal dailySearchLimit - reserveCalls");
  if (!Number.isInteger(ledger.plannedCalls) || ledger.plannedCalls < 0) errors.push("plannedCalls must be a non-negative integer");
  if (!Number.isInteger(ledger.executedCalls) || ledger.executedCalls < 0) errors.push("executedCalls must be a non-negative integer");
  if (ledger.plannedCalls > ledger.acquisitionBudget) errors.push("plannedCalls exceeds acquisitionBudget");
  if (ledger.executedCalls > ledger.plannedCalls) errors.push("executedCalls cannot exceed plannedCalls");
  if (ledger.liveApiCallsAuthorized !== false) errors.push("liveApiCallsAuthorized must remain false in YT-CUL-0");
  if (ledger.crossUseWithBlueLagoonAuthorized !== false) errors.push("crossUseWithBlueLagoonAuthorized must remain false");
  try { assertNoBlueLagoonIdentity(ledger.projectIdentity, "projectIdentity"); } catch (error) { errors.push(error.message); }
  return errors;
}

export function assertValidQuotaLedger(ledger) {
  const errors = validateQuotaLedger(ledger);
  if (errors.length) throw new Error(`Invalid YT-CUL quota ledger:\n- ${errors.join("\n- ")}`);
  return ledger;
}

function validatePlanRequest(request, index) {
  if (!isObject(request)) throw new Error(`plan request ${index} must be an object`);
  if (!isNonEmptyString(request.queryId)) throw new Error(`plan request ${index}.queryId is required`);
  if (!YT_CUL_SEARCH_PURPOSES.includes(request.purpose)) throw new Error(`plan request ${request.queryId}: invalid purpose`);
  assertInteger(request.priorityTier, `plan request ${request.queryId}.priorityTier`, { min: 1 });
  assertInteger(request.requestedCalls ?? 1, `plan request ${request.queryId}.requestedCalls`, { min: 1 });
  if (request.youtubeEngagementScore !== undefined || request.creatorQualityScore !== undefined || request.authenticityScore !== undefined) {
    throw new Error(`plan request ${request.queryId}: YouTube-derived creator/engagement/authenticity scores are forbidden`);
  }
}

export function buildDeterministicSearchPlan(ledger, requests) {
  assertValidQuotaLedger(ledger);
  if (!Array.isArray(requests)) throw new Error("requests must be an array");
  requests.forEach(validatePlanRequest);
  const ids = new Set();
  for (const request of requests) {
    if (ids.has(request.queryId)) throw new Error(`duplicate queryId: ${request.queryId}`);
    ids.add(request.queryId);
  }
  const ordered = requests
    .map(request => ({ ...structuredClone(request), requestedCalls: request.requestedCalls ?? 1 }))
    .sort((a, b) => a.priorityTier - b.priorityTier || a.queryId.localeCompare(b.queryId));

  let remaining = ledger.acquisitionBudget;
  const admitted = [];
  const deferred = [];
  for (const request of ordered) {
    if (request.requestedCalls <= remaining) {
      admitted.push({
        queryId: request.queryId,
        purpose: request.purpose,
        queryText: request.queryText ?? null,
        priorityTier: request.priorityTier,
        plannedCalls: request.requestedCalls
      });
      remaining -= request.requestedCalls;
    } else {
      deferred.push({ queryId: request.queryId, reason: "DAILY_SEARCH_ACQUISITION_BUDGET_EXHAUSTED" });
    }
  }

  const plannedCalls = admitted.reduce((sum, request) => sum + request.plannedCalls, 0);
  const nextLedger = { ...ledger, plannedCalls };
  assertValidQuotaLedger(nextLedger);
  return {
    schemaVersion: "youtube-culinary-search-plan-v0",
    clientId: YT_CUL_CLIENT_ID,
    quotaDate: ledger.quotaDate,
    acquisitionBudget: ledger.acquisitionBudget,
    reserveCalls: ledger.reserveCalls,
    plannedCalls,
    remainingAcquisitionBudget: ledger.acquisitionBudget - plannedCalls,
    plan: admitted,
    deferred,
    liveApiCallsAuthorized: false,
    youtubeDerivedRankingAuthorized: false,
    ledger: nextLedger
  };
}

export function recordExecutedSearchCalls(ledger, executedCalls) {
  assertValidQuotaLedger(ledger);
  assertInteger(executedCalls, "executedCalls", { min: 0 });
  const next = { ...ledger, executedCalls };
  assertValidQuotaLedger(next);
  return next;
}

export function createTransientCacheEnvelope({ cacheKey, endpoint, queryId, retrievedAt, ttlDays = YT_CUL_DEFAULT_TRANSIENT_TTL_DAYS, payload, dataClass = "SYNTHETIC_FIXTURE" }) {
  if (!isNonEmptyString(cacheKey)) throw new Error("cacheKey is required");
  if (!isNonEmptyString(endpoint)) throw new Error("endpoint is required");
  if (!isNonEmptyString(queryId)) throw new Error("queryId is required");
  if (!isIsoDateTime(retrievedAt)) throw new Error("retrievedAt must be ISO date-time");
  assertInteger(ttlDays, "ttlDays", { min: 1 });
  if (ttlDays > YT_CUL_MAX_TRANSIENT_TTL_DAYS) throw new Error(`ttlDays must not exceed ${YT_CUL_MAX_TRANSIENT_TTL_DAYS}`);
  if (!["SYNTHETIC_FIXTURE", "YOUTUBE_API_DATA_TRANSIENT"].includes(dataClass)) throw new Error("invalid dataClass");
  const retrievedMs = Date.parse(retrievedAt);
  const expiresAt = new Date(retrievedMs + maxAgeMs(ttlDays)).toISOString();
  return {
    schemaVersion: "youtube-culinary-transient-cache-v0",
    cacheKey,
    endpoint,
    queryId,
    clientId: YT_CUL_CLIENT_ID,
    dataClass,
    retrievedAt: new Date(retrievedMs).toISOString(),
    expiresAt,
    ttlDays,
    rawYoutubeApiDataDurableStorageAuthorized: false,
    payload: structuredClone(payload)
  };
}

export function validateTransientCacheEnvelope(envelope) {
  const errors = [];
  if (!isObject(envelope)) return ["transient cache envelope must be an object"];
  if (envelope.schemaVersion !== "youtube-culinary-transient-cache-v0") errors.push("invalid transient cache schemaVersion");
  if (!isNonEmptyString(envelope.cacheKey)) errors.push("cacheKey is required");
  if (!isNonEmptyString(envelope.endpoint)) errors.push("endpoint is required");
  if (!isNonEmptyString(envelope.queryId)) errors.push("queryId is required");
  if (envelope.clientId !== YT_CUL_CLIENT_ID) errors.push(`clientId must be ${YT_CUL_CLIENT_ID}`);
  if (!["SYNTHETIC_FIXTURE", "YOUTUBE_API_DATA_TRANSIENT"].includes(envelope.dataClass)) errors.push("invalid dataClass");
  if (!isIsoDateTime(envelope.retrievedAt)) errors.push("retrievedAt must be ISO date-time");
  if (!isIsoDateTime(envelope.expiresAt)) errors.push("expiresAt must be ISO date-time");
  if (!Number.isInteger(envelope.ttlDays) || envelope.ttlDays < 1 || envelope.ttlDays > YT_CUL_MAX_TRANSIENT_TTL_DAYS) errors.push(`ttlDays must be 1..${YT_CUL_MAX_TRANSIENT_TTL_DAYS}`);
  if (isIsoDateTime(envelope.retrievedAt) && isIsoDateTime(envelope.expiresAt) && Number.isInteger(envelope.ttlDays)) {
    const expected = Date.parse(envelope.retrievedAt) + maxAgeMs(envelope.ttlDays);
    if (Date.parse(envelope.expiresAt) !== expected) errors.push("expiresAt must equal retrievedAt + ttlDays");
  }
  if (envelope.rawYoutubeApiDataDurableStorageAuthorized !== false) errors.push("rawYoutubeApiDataDurableStorageAuthorized must remain false");
  if (!("payload" in envelope)) errors.push("payload must be explicit");
  return errors;
}

export function purgeExpiredTransientCache(envelopes, now) {
  if (!Array.isArray(envelopes)) throw new Error("envelopes must be an array");
  if (!isIsoDateTime(now)) throw new Error("now must be ISO date-time");
  const nowMs = Date.parse(now);
  const kept = [];
  const expiredKeys = [];
  for (const envelope of envelopes) {
    const errors = validateTransientCacheEnvelope(envelope);
    if (errors.length) throw new Error(`Invalid transient cache envelope:\n- ${errors.join("\n- ")}`);
    if (Date.parse(envelope.expiresAt) <= nowMs) expiredKeys.push(envelope.cacheKey);
    else kept.push(structuredClone(envelope));
  }
  return { kept, expiredKeys: expiredKeys.sort() };
}

function collectForbiddenDurablePaths(value, prefix = "$", paths = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectForbiddenDurablePaths(entry, `${prefix}[${index}]`, paths));
    return paths;
  }
  if (!isObject(value)) return paths;
  for (const [key, nested] of Object.entries(value)) {
    const path = `${prefix}.${key}`;
    if (RAW_YOUTUBE_METADATA_KEYS.has(key)) paths.push(path);
    collectForbiddenDurablePaths(nested, path, paths);
  }
  return paths;
}

export function assertPolicySafeDurableObject(value) {
  const forbiddenPaths = collectForbiddenDurablePaths(value);
  if (forbiddenPaths.length) {
    throw new Error(`durable object embeds forbidden raw YouTube API metadata fields: ${forbiddenPaths.join(", ")}`);
  }
  return value;
}

export function createPromotionHandoff({ handoffId, candidateKind, independentSourceId, independentSourceUrl, atlasCandidateId = null, reviewNotes = null }) {
  if (!isNonEmptyString(handoffId)) throw new Error("handoffId is required");
  if (!YT_CUL_ATLAS_PROMOTION_KINDS.includes(candidateKind)) throw new Error("invalid candidateKind");
  if (!isNonEmptyString(independentSourceId)) throw new Error("independentSourceId is required");
  if (!isNonEmptyString(independentSourceUrl)) throw new Error("independentSourceUrl is required");
  const handoff = {
    schemaVersion: "youtube-culinary-promotion-handoff-v0",
    handoffId,
    candidateKind,
    evidenceOrigin: "INDEPENDENT_NON_YOUTUBE_SOURCE",
    independentSourceId,
    independentSourceUrl,
    atlasCandidateId,
    reviewNotes,
    youtubeApiDataEmbedded: false,
    automaticAtlasPromotionAuthorized: false,
    automaticAppAdmissionAuthorized: false,
    runtimeActivationAuthorized: false
  };
  assertPolicySafeDurableObject(handoff);
  return handoff;
}

export function createDailyFunnelReport({ runId, quotaDate, clientProjectIdentity, callsPlanned, callsExecuted, callsReserved, resultSlotsObserved, transientUniqueCandidatePointers, newCandidateSourceFamilies, atlasFamilyCandidatesNominated, variantOrTechniqueQuestionsNominated, independentlyReviewedCandidates, atlasPromotions, appHandoffsCreated, publicRecipesAdmitted }) {
  if (!isNonEmptyString(runId)) throw new Error("runId is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(quotaDate || "")) throw new Error("quotaDate must be YYYY-MM-DD");
  assertNoBlueLagoonIdentity(clientProjectIdentity, "clientProjectIdentity");
  for (const [label, value] of Object.entries({
    callsPlanned,
    callsExecuted,
    callsReserved,
    resultSlotsObserved,
    transientUniqueCandidatePointers,
    newCandidateSourceFamilies,
    atlasFamilyCandidatesNominated,
    variantOrTechniqueQuestionsNominated,
    independentlyReviewedCandidates,
    appHandoffsCreated,
    publicRecipesAdmitted
  })) assertInteger(value, label, { min: 0 });
  if (callsExecuted > callsPlanned) throw new Error("callsExecuted cannot exceed callsPlanned");
  if (callsReserved < YT_CUL_MIN_SEARCH_RESERVE) throw new Error(`callsReserved must be >= ${YT_CUL_MIN_SEARCH_RESERVE}`);
  if (!isObject(atlasPromotions)) throw new Error("atlasPromotions must be an object");
  const normalizedPromotions = {};
  for (const kind of YT_CUL_ATLAS_PROMOTION_KINDS) {
    const value = atlasPromotions[kind] ?? 0;
    assertInteger(value, `atlasPromotions.${kind}`, { min: 0 });
    normalizedPromotions[kind] = value;
  }
  const promotionTotal = Object.values(normalizedPromotions).reduce((sum, value) => sum + value, 0);
  const report = {
    schemaVersion: "youtube-culinary-daily-funnel-report-v0",
    runId,
    quotaDate,
    clientId: YT_CUL_CLIENT_ID,
    clientProjectIdentity,
    calls: { planned: callsPlanned, executed: callsExecuted, reserved: callsReserved },
    funnel: {
      resultSlotsObserved,
      transientUniqueCandidatePointers,
      newCandidateSourceFamilies,
      atlasFamilyCandidatesNominated,
      variantOrTechniqueQuestionsNominated,
      independentlyReviewedCandidates,
      atlasPromotions: normalizedPromotions,
      appHandoffsCreated,
      publicRecipesAdmitted
    },
    marginalYield: {
      atlasPromotionsPerExecutedSearchCall: callsExecuted === 0 ? null : promotionTotal / callsExecuted,
      appHandoffsPerExecutedSearchCall: callsExecuted === 0 ? null : appHandoffsCreated / callsExecuted,
      publicAdmissionsPerReviewedCandidate: independentlyReviewedCandidates === 0 ? null : publicRecipesAdmitted / independentlyReviewedCandidates
    },
    grossYoutubeResultsAreRecipesAcquired: false,
    youtubeDerivedRankingAuthorized: false,
    rawYoutubeApiDataEmbedded: false,
    automaticAtlasPromotionAuthorized: false,
    automaticAppAdmissionAuthorized: false
  };
  for (const [label, value] of Object.entries(report.marginalYield)) {
    if (value !== null) assertFiniteNonNegative(value, label);
  }
  report.reportSha256 = sha256(stableStringify({ ...report, reportSha256: undefined }));
  assertPolicySafeDurableObject(report);
  return report;
}
