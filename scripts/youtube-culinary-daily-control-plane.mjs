import { createHash } from "node:crypto";
import { assertPolicySafeDurableObject, YT_CUL_MIN_SEARCH_RESERVE } from "./youtube-culinary-discovery-control-plane.mjs";
import { YT_CUL_5R_REVIEW_QUEUE_CAP, validateAtlasRelevanceReviewReadyPacket } from "./youtube-culinary-atlas-relevance-gate.mjs";

export const YT_CUL_5D_STATE_SCHEMA = "youtube-culinary-daily-discovery-state-v1";
export const YT_CUL_5D_QUERY_VINTAGE = "yt-cul-5d-query-v1-2026-09-05";
export const YT_CUL_5D_DEFAULT_BUDGET = 16;
export const YT_CUL_5D_MIN_BUDGET = 8;
export const YT_CUL_5D_MAX_BUDGET = 32;
export const YT_CUL_5D_POLICY_MAX_AGE_DAYS = 30;

const DAY_MS = 86400000;
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const hash = value => createHash("sha256").update(String(value)).digest("hex");

export const YT_CUL_5D_QUERY_LIBRARY = Object.freeze([
  ["africa-breakfast-c", "channel", "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES", "CENTRAL_SOUTHERN_AFRICA", "BREAKFAST_STAPLES", "Central Southern African traditional breakfast staples millet porridge home cooking recipes", ["millet", "porridge", "breakfast", "sorghum", "maize"]],
  ["africa-breakfast-p", "playlist", "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES", "CENTRAL_SOUTHERN_AFRICA", "BREAKFAST_STAPLES", "Central Southern African traditional breakfast recipe playlist millet porridge", ["millet", "porridge", "breakfast", "sorghum", "maize"]],
  ["central-asia-bread-c", "channel", "IRAN_CENTRAL_ASIA_AFGHANISTAN__BREADS_SOUPS", "IRAN_CENTRAL_ASIA_AFGHANISTAN", "BREADS_SOUPS", "Central Asian Afghan Iranian traditional breads soups home cooking recipes", ["bread", "soup", "naan", "nan", "ash", "shorba"]],
  ["central-asia-bread-p", "playlist", "IRAN_CENTRAL_ASIA_AFGHANISTAN__BREADS_SOUPS", "IRAN_CENTRAL_ASIA_AFGHANISTAN", "BREADS_SOUPS", "Central Asian Afghan Iranian bread soup recipe playlist", ["bread", "soup", "naan", "nan", "ash", "shorba"]],
  ["pacific-earthoven-c", "channel", "OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED", "OCEANIA_PACIFIC", "EARTH_OVEN_LEAF_WRAPPED", "Pacific Island traditional earth oven leaf wrapped cooking recipes", ["earth oven", "leaf", "taro", "umu", "hangi", "hāngi", "lovo"]],
  ["pacific-earthoven-p", "playlist", "OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED", "OCEANIA_PACIFIC", "EARTH_OVEN_LEAF_WRAPPED", "Pacific Island traditional earth oven recipe playlist taro leaf", ["earth oven", "leaf", "taro", "umu", "hangi", "hāngi", "lovo"]],
  ["caribbean-root-c", "channel", "CARIBBEAN__BREAKFAST_ROOT_CROP_ONE_POT", "CARIBBEAN", "BREAKFAST_ROOT_CROP_ONE_POT", "Caribbean traditional breakfast root crop one pot home cooking recipes", ["cassava", "yam", "plantain", "breakfast", "one pot", "callaloo"]],
  ["caribbean-root-p", "playlist", "CARIBBEAN__BREAKFAST_ROOT_CROP_ONE_POT", "CARIBBEAN", "BREAKFAST_ROOT_CROP_ONE_POT", "Caribbean traditional breakfast root crop one pot recipe playlist", ["cassava", "yam", "plantain", "breakfast", "one pot", "callaloo"]],
  ["andean-grain-c", "channel", "ANDEAN_NORTHERN_SOUTH_AMERICA__GRAINS_SOUPS", "ANDEAN_NORTHERN_SOUTH_AMERICA", "GRAINS_SOUPS", "Andean traditional home cooking grains soups quinoa recipes", ["quinoa", "grain", "soup", "chuño", "chuno", "locro"]],
  ["andean-grain-p", "playlist", "ANDEAN_NORTHERN_SOUTH_AMERICA__GRAINS_SOUPS", "ANDEAN_NORTHERN_SOUTH_AMERICA", "GRAINS_SOUPS", "recetas tradicionales andinas playlist quinoa granos sopas", ["quinoa", "grano", "sopa", "chuño", "chuno", "locro"]],
  ["west-africa-stew-c", "channel", "WEST_AFRICA__STEW_GRAIN_LEGUME", "WEST_AFRICA", "STEW_GRAIN_LEGUME", "West African traditional stew grain legume home cooking recipes", ["stew", "rice", "bean", "groundnut", "peanut", "fonio"]],
  ["west-africa-stew-p", "playlist", "WEST_AFRICA__STEW_GRAIN_LEGUME", "WEST_AFRICA", "STEW_GRAIN_LEGUME", "West African traditional stew grain legume recipe playlist", ["stew", "rice", "bean", "groundnut", "peanut", "fonio"]],
  ["se-asia-ferment-c", "channel", "SOUTHEAST_ASIA__FERMENTED_STEAMED_RICE", "SOUTHEAST_ASIA", "FERMENTED_STEAMED_RICE", "Southeast Asian traditional fermented steamed rice home cooking recipes", ["fermented", "steamed", "rice", "tempeh", "sticky rice"]],
  ["se-asia-ferment-p", "playlist", "SOUTHEAST_ASIA__FERMENTED_STEAMED_RICE", "SOUTHEAST_ASIA", "FERMENTED_STEAMED_RICE", "Southeast Asian fermented steamed rice traditional recipe playlist", ["fermented", "steamed", "rice", "tempeh", "sticky rice"]],
  ["levant-pulse-c", "channel", "LEVANT_EASTERN_MEDITERRANEAN__PULSES_FLATBREAD", "LEVANT_EASTERN_MEDITERRANEAN", "PULSES_FLATBREAD", "Levant traditional pulses flatbread home cooking recipes", ["lentil", "chickpea", "flatbread", "bulgur", "mujaddara"]],
  ["levant-pulse-p", "playlist", "LEVANT_EASTERN_MEDITERRANEAN__PULSES_FLATBREAD", "LEVANT_EASTERN_MEDITERRANEAN", "PULSES_FLATBREAD", "Levant traditional pulses flatbread recipe playlist", ["lentil", "chickpea", "flatbread", "bulgur", "mujaddara"]],
  ["africa-breakfast-alt", "channel", "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES", "CENTRAL_SOUTHERN_AFRICA", "BREAKFAST_STAPLES", "traditional sorghum maize millet breakfast porridge recipes southern africa", ["millet", "porridge", "sorghum", "maize"]],
  ["central-asia-alt", "playlist", "IRAN_CENTRAL_ASIA_AFGHANISTAN__BREADS_SOUPS", "IRAN_CENTRAL_ASIA_AFGHANISTAN", "BREADS_SOUPS", "osh non shurpa traditional Central Asia recipes playlist", ["osh", "non", "shurpa", "bread", "soup"]],
  ["pacific-alt", "channel", "OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED", "OCEANIA_PACIFIC", "EARTH_OVEN_LEAF_WRAPPED", "umu lovo hāngi traditional Pacific cooking recipes", ["umu", "lovo", "hangi", "hāngi", "taro"]],
  ["caribbean-alt", "playlist", "CARIBBEAN__BREAKFAST_ROOT_CROP_ONE_POT", "CARIBBEAN", "BREAKFAST_ROOT_CROP_ONE_POT", "traditional Caribbean provision ground food breakfast recipes playlist", ["provision", "cassava", "yam", "plantain"]],
  ["andean-alt", "channel", "ANDEAN_NORTHERN_SOUTH_AMERICA__GRAINS_SOUPS", "ANDEAN_NORTHERN_SOUTH_AMERICA", "GRAINS_SOUPS", "cocina andina tradicional quinoa chuño sopa recetas", ["quinoa", "chuño", "chuno", "sopa"]],
  ["west-africa-alt", "playlist", "WEST_AFRICA__STEW_GRAIN_LEGUME", "WEST_AFRICA", "STEW_GRAIN_LEGUME", "traditional West African groundnut fonio bean recipes playlist", ["groundnut", "fonio", "bean", "stew"]],
  ["se-asia-alt", "channel", "SOUTHEAST_ASIA__FERMENTED_STEAMED_RICE", "SOUTHEAST_ASIA", "FERMENTED_STEAMED_RICE", "traditional tempeh sticky rice steamed fermented recipes southeast asia", ["tempeh", "sticky rice", "fermented", "steamed"]],
  ["levant-alt", "playlist", "LEVANT_EASTERN_MEDITERRANEAN__PULSES_FLATBREAD", "LEVANT_EASTERN_MEDITERRANEAN", "PULSES_FLATBREAD", "mujaddara lentil bulgur flatbread traditional recipe playlist", ["mujaddara", "lentil", "bulgur", "flatbread"]],
  ["africa-staples-local", "playlist", "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES", "CENTRAL_SOUTHERN_AFRICA", "BREAKFAST_STAPLES", "sadza pap nshima traditional recipes playlist", ["sadza", "pap", "nshima", "maize"]],
  ["central-asia-local", "channel", "IRAN_CENTRAL_ASIA_AFGHANISTAN__BREADS_SOUPS", "IRAN_CENTRAL_ASIA_AFGHANISTAN", "BREADS_SOUPS", "нон шӯрбо шурпа traditional recipe cooking", ["bread", "soup", "shurpa"]],
  ["pacific-local", "playlist", "OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED", "OCEANIA_PACIFIC", "EARTH_OVEN_LEAF_WRAPPED", "palusami luau taro leaf traditional Pacific recipes playlist", ["palusami", "luau", "taro", "leaf"]],
  ["caribbean-local", "channel", "CARIBBEAN__BREAKFAST_ROOT_CROP_ONE_POT", "CARIBBEAN", "BREAKFAST_ROOT_CROP_ONE_POT", "green banana yam dasheen provision traditional Caribbean recipes", ["banana", "yam", "dasheen", "provision"]],
  ["andean-local", "playlist", "ANDEAN_NORTHERN_SOUTH_AMERICA__GRAINS_SOUPS", "ANDEAN_NORTHERN_SOUTH_AMERICA", "GRAINS_SOUPS", "locro quinua chuño recetas andinas playlist", ["locro", "quinua", "chuño", "chuno"]],
  ["west-africa-local", "channel", "WEST_AFRICA__STEW_GRAIN_LEGUME", "WEST_AFRICA", "STEW_GRAIN_LEGUME", "maafe fonio waakye traditional home cooking recipes", ["maafe", "fonio", "waakye"]],
  ["se-asia-local", "playlist", "SOUTHEAST_ASIA__FERMENTED_STEAMED_RICE", "SOUTHEAST_ASIA", "FERMENTED_STEAMED_RICE", "ketan tempe tapai traditional recipes playlist", ["ketan", "tempe", "tapai"]],
  ["levant-local", "channel", "LEVANT_EASTERN_MEDITERRANEAN__PULSES_FLATBREAD", "LEVANT_EASTERN_MEDITERRANEAN", "PULSES_FLATBREAD", "mujadara mujaddara lentils bulgur traditional home cooking", ["mujadara", "mujaddara", "lentil", "bulgur"]]
].map(([queryId, resourceType, focus, macroRegion, familyGap, queryText, relevanceTerms], index) => Object.freeze({
  queryId, resourceType, focus, priority: index + 1, queryText, relevanceTerms: Object.freeze(relevanceTerms),
  atlasGap: Object.freeze({ macroRegion, familyGap, mealRoleGap: null, techniqueGap: null })
})));

export function getYoutubeQuotaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const value = Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function createInitialDailyState({ policyRecheckedAt = "2026-09-05", assignedDailySearchLimit = 100 } = {}) {
  return {
    schemaVersion: YT_CUL_5D_STATE_SCHEMA,
    phase: "YT-CUL-5D",
    programmeStatus: "ACTIVE",
    queryVintage: YT_CUL_5D_QUERY_VINTAGE,
    policyRecheckedAt,
    assignedDailySearchLimit,
    protectedReserveCalls: YT_CUL_MIN_SEARCH_RESERVE,
    lastCompletedQuotaDate: null,
    completedQuotaDays: [],
    cumulative: {
      searchCalls: 0, independentPagesReviewed: 0, recipeStructuredPagesConfirmed: 0,
      reviewReadyPacketsCreated: 0, duplicatePairsSuppressed: 0
    },
    unresolvedPackets: [],
    resolvedPairKeys: [],
    canonicalOutcomes: [],
    hardHold: null,
    ytCul6Readiness: { earned: false, packetId: null, knowledgeCoreCommit: null }
  };
}

export function validateDailyState(state) {
  if (!isObject(state) || state.schemaVersion !== YT_CUL_5D_STATE_SCHEMA) throw new Error("invalid YT-CUL-5D state schema");
  if (!Number.isInteger(state.assignedDailySearchLimit) || state.assignedDailySearchLimit <= YT_CUL_MIN_SEARCH_RESERVE) throw new Error("assignedDailySearchLimit is invalid");
  if (state.protectedReserveCalls !== YT_CUL_MIN_SEARCH_RESERVE) throw new Error("protected reserve must remain five calls");
  if (!Array.isArray(state.completedQuotaDays) || !Array.isArray(state.unresolvedPackets) || !Array.isArray(state.resolvedPairKeys) || !Array.isArray(state.canonicalOutcomes)) throw new Error("daily state arrays are invalid");
  state.unresolvedPackets.forEach(validateAtlasRelevanceReviewReadyPacket);
  if (state.unresolvedPackets.length > YT_CUL_5R_REVIEW_QUEUE_CAP) throw new Error("review backlog exceeds cap");
  assertPolicySafeDurableObject(state);
  return state;
}

export function policyVintageIsFresh(policyRecheckedAt, now = new Date(), maxAgeDays = YT_CUL_5D_POLICY_MAX_AGE_DAYS) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policyRecheckedAt || "")) return false;
  const policyMs = Date.parse(`${policyRecheckedAt}T12:00:00Z`);
  return Number.isFinite(policyMs) && now.getTime() - policyMs <= maxAgeDays * DAY_MS && now.getTime() >= policyMs - DAY_MS;
}

function activeRecentDays(state, n = 3) {
  return state.completedQuotaDays.filter(day => Number.isInteger(day.searchCalls) && day.searchCalls > 0).slice(-n);
}

export function evaluatePreSearchGate(state, { now = new Date(), quotaDate = getYoutubeQuotaDate(now) } = {}) {
  validateDailyState(state);
  if (state.ytCul6Readiness?.earned) return { searchAllowed: false, terminalState: "YT_CUL_6_READINESS_EARNED", budget: 0 };
  if (state.hardHold) return { searchAllowed: false, terminalState: state.hardHold, budget: 0 };
  if (state.lastCompletedQuotaDate === quotaDate) return { searchAllowed: false, terminalState: "DAILY_SEARCH_HOLD_ALREADY_COMPLETED_QUOTA_DAY", budget: 0 };
  if (!policyVintageIsFresh(state.policyRecheckedAt, now)) return { searchAllowed: false, terminalState: "DAILY_SEARCH_HOLD_POLICY_OR_QUOTA", budget: 0 };
  if (state.unresolvedPackets.length >= YT_CUL_5R_REVIEW_QUEUE_CAP) return { searchAllowed: false, terminalState: "DAILY_SEARCH_HOLD_REVIEW_BACKLOG", budget: 0 };
  const recent = activeRecentDays(state, 3);
  if (recent.length === 3 && recent.every(day => day.reviewReadyPacketsCreated === 0)) return { searchAllowed: false, terminalState: "DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE", budget: 0 };
  return { searchAllowed: true, terminalState: "DAILY_DISCOVERY_PRECHECK_PASS", budget: chooseAdaptiveSearchBudget(state) };
}

export function chooseAdaptiveSearchBudget(state) {
  validateDailyState(state);
  const recent = activeRecentDays(state, 2);
  if (!recent.length) return Math.min(YT_CUL_5D_DEFAULT_BUDGET, state.assignedDailySearchLimit - state.protectedReserveCalls);
  const latest = recent.at(-1);
  let budget = Number.isInteger(latest.searchBudget) ? latest.searchBudget : YT_CUL_5D_DEFAULT_BUDGET;
  const duplicateRate = latest.reviewCandidatesConsidered > 0 ? latest.duplicatePairsSuppressed / latest.reviewCandidatesConsidered : 0;
  const degrading = latest.reviewReadyPacketsCreated === 0 || duplicateRate >= 0.5 || latest.largestSourceDomainShare >= 0.75 || state.unresolvedPackets.length >= 30;
  const expanding = latest.reviewReadyPacketsCreated > 0 && latest.uniqueUsefulSourceDomains > 1 && duplicateRate < 0.5 && state.unresolvedPackets.length < 20;
  if (degrading) budget -= 8;
  else if (expanding) budget += 8;
  else if (budget > YT_CUL_5D_DEFAULT_BUDGET) budget -= 8;
  else if (budget < YT_CUL_5D_DEFAULT_BUDGET) budget += 8;
  const absolute = state.assignedDailySearchLimit - state.protectedReserveCalls;
  return Math.max(0, Math.min(absolute, YT_CUL_5D_MAX_BUDGET, Math.max(YT_CUL_5D_MIN_BUDGET, budget)));
}

export function selectDailyQueries({ state, budget }) {
  validateDailyState(state);
  if (!Number.isInteger(budget) || budget < 0 || budget > YT_CUL_5D_MAX_BUDGET) throw new Error("budget must be 0..32");
  const priorFocusCounts = new Map();
  for (const day of state.completedQuotaDays) for (const focus of day.focuses ?? []) priorFocusCounts.set(focus, (priorFocusCounts.get(focus) ?? 0) + 1);
  return [...YT_CUL_5D_QUERY_LIBRARY]
    .sort((a, b) => (priorFocusCounts.get(a.focus) ?? 0) - (priorFocusCounts.get(b.focus) ?? 0) || a.priority - b.priority || hash(a.queryId).localeCompare(hash(b.queryId)))
    .slice(0, budget);
}

export function applyCanonicalReviewBridge(state, bridge) {
  validateDailyState(state);
  if (!bridge) return structuredClone(state);
  if (!isObject(bridge) || bridge.schemaVersion !== "youtube-culinary-canonical-review-bridge-v1" || !Array.isArray(bridge.outcomes)) throw new Error("invalid canonical review bridge");
  const next = structuredClone(state);
  const byPacketId = new Map(next.unresolvedPackets.map(packet => [packet.packetId, packet]));
  for (const outcome of bridge.outcomes) {
    if (!isObject(outcome) || !byPacketId.has(outcome.packetId)) continue;
    if (!["ACCEPTED", "REJECTED", "HELD"].includes(outcome.reviewDecision)) throw new Error("invalid canonical review decision");
    if (outcome.reviewAuthority !== "KNOWLEDGE_CORE_ATLAS_REVIEW") throw new Error("canonical outcome must come from Knowledge Core Atlas review");
    const packet = byPacketId.get(outcome.packetId);
    next.canonicalOutcomes = next.canonicalOutcomes.filter(existing => existing.packetId !== outcome.packetId);
    next.canonicalOutcomes.push(structuredClone(outcome));
    if (outcome.reviewDecision !== "HELD") {
      next.resolvedPairKeys.push(packet.reviewPairKey);
      next.unresolvedPackets = next.unresolvedPackets.filter(existing => existing.packetId !== outcome.packetId);
    }
    if (outcome.appAuthoringEligible === true && outcome.reviewDecision === "ACCEPTED" && outcome.independentNonYoutubeEvidence === true && outcome.rightsProvenanceSafetyClear === true) {
      next.ytCul6Readiness = { earned: true, packetId: outcome.packetId, knowledgeCoreCommit: outcome.knowledgeCoreCommit ?? null };
      next.programmeStatus = "YT_CUL_6_READINESS_EARNED";
      next.hardHold = "YT_CUL_6_READINESS_EARNED";
    }
  }
  next.resolvedPairKeys = [...new Set(next.resolvedPairKeys)];
  return validateDailyState(next);
}

export function appendCompletedDay(state, day) {
  validateDailyState(state);
  if (!isObject(day) || !/^\d{4}-\d{2}-\d{2}$/.test(day.quotaDate || "")) throw new Error("completed day quotaDate is invalid");
  if (state.completedQuotaDays.some(existing => existing.quotaDate === day.quotaDate)) throw new Error("quota day already recorded");
  const next = structuredClone(state);
  next.completedQuotaDays.push(structuredClone(day));
  next.lastCompletedQuotaDate = day.quotaDate;
  next.cumulative.searchCalls += day.searchCalls ?? 0;
  next.cumulative.independentPagesReviewed += day.independentPagesReviewed ?? 0;
  next.cumulative.recipeStructuredPagesConfirmed += day.recipeStructuredPagesConfirmed ?? 0;
  next.cumulative.reviewReadyPacketsCreated += day.reviewReadyPacketsCreated ?? 0;
  next.cumulative.duplicatePairsSuppressed += day.duplicatePairsSuppressed ?? 0;
  if (day.terminalState?.startsWith("DAILY_SEARCH_HOLD_")) {
    next.hardHold = day.terminalState;
    next.programmeStatus = day.terminalState;
  }
  return validateDailyState(next);
}
