import { createHash } from "node:crypto";

export const YT_CUL_5E_QUERY_VINTAGE = "yt-cul-5e-adaptive-portfolio-v1-2026-09-06";
export const YT_CUL_5E_DAILY_SEARCH_CAPACITY = 95;
export const YT_CUL_5E_FIRST_TRANCHE_SIZE = 16;
export const YT_CUL_5E_NEXT_TRANCHE_SIZE = 8;
export const YT_CUL_5E_EXPLORATION_FRACTION = 0.25;
export const YT_CUL_5E_MAX_EXPLOIT_SHARE_PER_FOCUS = 0.5;
export const YT_CUL_5E_POLICY_MAX_AGE_DAYS = 30;
export const YT_CUL_5E_REVIEW_QUEUE_CAP = 40;

const DAY_MS = 86400000;
const hash = value => createHash("sha256").update(String(value)).digest("hex");
const normalize = value => String(value ?? "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const YT_CUL_5E_FOCUS_SPECS = Object.freeze([
  Object.freeze({ focus: "CENTRAL_SOUTHERN_AFRICA__BREAKFAST_STAPLES", macroRegion: "CENTRAL_SOUTHERN_AFRICA", familyGap: "BREAKFAST_STAPLES", regionText: "Central and Southern Africa", familyText: "breakfast staples", terms: Object.freeze(["millet", "porridge", "sorghum", "maize", "sadza", "pap", "nshima", "breakfast"]) }),
  Object.freeze({ focus: "IRAN_CENTRAL_ASIA_AFGHANISTAN__BREADS_SOUPS", macroRegion: "IRAN_CENTRAL_ASIA_AFGHANISTAN", familyGap: "BREADS_SOUPS", regionText: "Iran Central Asia Afghanistan", familyText: "traditional breads and soups", terms: Object.freeze(["bread", "soup", "naan", "nan", "ash", "shorba", "shurpa", "non"]) }),
  Object.freeze({ focus: "OCEANIA_PACIFIC__EARTH_OVEN_LEAF_WRAPPED", macroRegion: "OCEANIA_PACIFIC", familyGap: "EARTH_OVEN_LEAF_WRAPPED", regionText: "Oceania Pacific Islands", familyText: "earth oven and leaf wrapped dishes", terms: Object.freeze(["earth oven", "taro", "umu", "hangi", "hāngi", "lovo", "palusami", "luau"]) }),
  Object.freeze({ focus: "CARIBBEAN__BREAKFAST_ROOT_CROP_ONE_POT", macroRegion: "CARIBBEAN", familyGap: "BREAKFAST_ROOT_CROP_ONE_POT", regionText: "Caribbean", familyText: "breakfast root crop and one pot dishes", terms: Object.freeze(["cassava", "yam", "plantain", "callaloo", "provision", "dasheen", "green banana", "one pot"]) }),
  Object.freeze({ focus: "ANDEAN_NORTHERN_SOUTH_AMERICA__GRAINS_SOUPS", macroRegion: "ANDEAN_NORTHERN_SOUTH_AMERICA", familyGap: "GRAINS_SOUPS", regionText: "Andean and Northern South America", familyText: "traditional grains and soups", terms: Object.freeze(["quinoa", "quinua", "chuño", "chuno", "locro", "sopa", "grain", "soup"]) }),
  Object.freeze({ focus: "WEST_AFRICA__STEW_GRAIN_LEGUME", macroRegion: "WEST_AFRICA", familyGap: "STEW_GRAIN_LEGUME", regionText: "West Africa", familyText: "traditional stews grains and legumes", terms: Object.freeze(["stew", "groundnut", "peanut", "fonio", "bean", "maafe", "waakye", "rice"]) }),
  Object.freeze({ focus: "SOUTHEAST_ASIA__FERMENTED_STEAMED_RICE", macroRegion: "SOUTHEAST_ASIA", familyGap: "FERMENTED_STEAMED_RICE", regionText: "Southeast Asia", familyText: "fermented steamed and rice dishes", terms: Object.freeze(["fermented", "steamed", "rice", "tempeh", "tempe", "sticky rice", "ketan", "tapai"]) }),
  Object.freeze({ focus: "LEVANT_EASTERN_MEDITERRANEAN__PULSES_FLATBREAD", macroRegion: "LEVANT_EASTERN_MEDITERRANEAN", familyGap: "PULSES_FLATBREAD", regionText: "Levant Eastern Mediterranean", familyText: "pulses and flatbreads", terms: Object.freeze(["lentil", "chickpea", "flatbread", "bulgur", "mujaddara", "mujadara", "pulse", "bread"]) })
]);

const focusSpecByKey = new Map(YT_CUL_5E_FOCUS_SPECS.map(spec => [spec.focus, spec]));

function gapKey(gap) {
  if (!gap || typeof gap !== "object") return null;
  return [gap.macroRegion ?? "", gap.familyGap ?? "", gap.mealRoleGap ?? "", gap.techniqueGap ?? ""].join("|");
}

function focusFromGap(gap) {
  if (!gap || typeof gap !== "object") return null;
  const exact = YT_CUL_5E_FOCUS_SPECS.find(spec => spec.macroRegion === gap.macroRegion && spec.familyGap === gap.familyGap);
  return exact?.focus ?? null;
}

function baseVariantTexts(spec) {
  const [a, b, c, d, e, f, g, h] = spec.terms;
  return [
    `${spec.regionText} traditional ${spec.familyText} home cooking recipes`,
    `${spec.regionText} ${a} ${b} family recipe cooking`,
    `${a} ${c} ${d} traditional recipes ${spec.regionText}`,
    `${spec.regionText} regional home cooking ${e} ${f} recipes`,
    `${g} ${h} ${spec.regionText} traditional dish recipes`,
    `${spec.regionText} local food ${a} ${e} ${spec.familyText} recipes`,
    `${b} ${f} ${g} traditional cooking ${spec.regionText}`,
    `${spec.regionText} household cooking ${c} ${d} ${h} recipe`
  ];
}

function createQuery({ queryId, resourceType, focus, atlasGap, queryText, relevanceTerms, queryOrigin, signalStrength = 0, sourcePacketId = null }) {
  return Object.freeze({ queryId, resourceType, focus, atlasGap: Object.freeze({ macroRegion: atlasGap.macroRegion ?? null, familyGap: atlasGap.familyGap ?? null, mealRoleGap: atlasGap.mealRoleGap ?? null, techniqueGap: atlasGap.techniqueGap ?? null }), queryText: normalize(queryText).slice(0, 320), relevanceTerms: Object.freeze([...new Set(relevanceTerms.map(normalize).filter(Boolean))].slice(0, 12)), queryOrigin, signalStrength, sourcePacketId });
}

export function buildBaseQueryPortfolio() {
  const rows = [];
  for (const spec of YT_CUL_5E_FOCUS_SPECS) {
    const texts = baseVariantTexts(spec);
    texts.forEach((text, index) => {
      for (const resourceType of ["channel", "playlist"]) {
        rows.push(createQuery({ queryId: `yt5e-${hash(`${spec.focus}|${index}|${resourceType}`).slice(0, 18)}`, resourceType, focus: spec.focus, atlasGap: { macroRegion: spec.macroRegion, familyGap: spec.familyGap, mealRoleGap: null, techniqueGap: null }, queryText: text, relevanceTerms: spec.terms, queryOrigin: "ATLAS_GAP_PORTFOLIO" }));
      }
    });
  }
  return Object.freeze(rows);
}

export const YT_CUL_5E_BASE_QUERY_PORTFOLIO = buildBaseQueryPortfolio();

function safeCandidateLabel(value) {
  const label = normalize(value).replace(/[<>\[\]{}]/g, " ").replace(/\s+/g, " ").trim();
  return label.length >= 2 ? label.slice(0, 120) : null;
}

function packetFollowups(packet, queryOrigin, signalStrength) {
  const label = safeCandidateLabel(packet?.candidateLabel);
  const focus = focusFromGap(packet?.atlasGap);
  if (!label || !focus) return [];
  const spec = focusSpecByKey.get(focus);
  const terms = [label, ...spec.terms.slice(0, 5)];
  return ["channel", "playlist"].map(resourceType => createQuery({ queryId: `yt5e-fu-${hash(`${packet.packetId ?? label}|${resourceType}|${queryOrigin}`).slice(0, 18)}`, resourceType, focus, atlasGap: packet.atlasGap, queryText: `${label} ${spec.regionText} traditional recipe ${resourceType}`, relevanceTerms: terms, queryOrigin, signalStrength, sourcePacketId: packet.packetId ?? null }));
}

function outcomeFollowups(outcome) {
  const context = outcome?.feedbackContext;
  const label = safeCandidateLabel(context?.candidateLabel);
  const focus = focusFromGap(context?.atlasGap);
  if (!label || !focus) return [];
  const spec = focusSpecByKey.get(focus);
  const decision = outcome.reviewDecision;
  if (decision === "REJECTED" && outcome.retryable !== true) return [];
  const queryOrigin = decision === "ACCEPTED" ? "CANONICAL_ACCEPTED_FOLLOWUP" : decision === "HELD" ? "CANONICAL_HELD_REPAIR" : "CANONICAL_RETRYABLE_REPAIR";
  const signalStrength = decision === "ACCEPTED" ? 8 : decision === "HELD" ? 2 : 1;
  const repairTerms = Array.isArray(outcome.requiredEvidenceTerms) ? outcome.requiredEvidenceTerms : [];
  return ["channel", "playlist"].map(resourceType => createQuery({ queryId: `yt5e-kc-${hash(`${outcome.packetId}|${decision}|${resourceType}`).slice(0, 18)}`, resourceType, focus, atlasGap: context.atlasGap, queryText: `${label} ${spec.regionText} ${repairTerms.slice(0, 3).join(" ")} traditional recipe ${resourceType}`, relevanceTerms: [label, ...repairTerms, ...spec.terms.slice(0, 4)], queryOrigin, signalStrength, sourcePacketId: outcome.packetId ?? null }));
}

export function buildAdaptiveQueryPortfolio({ state = {}, sameDayPackets = [] } = {}) {
  const rows = [...YT_CUL_5E_BASE_QUERY_PORTFOLIO];
  for (const outcome of (state.canonicalOutcomes ?? []).slice(-40)) rows.push(...outcomeFollowups(outcome));
  for (const packet of sameDayPackets.slice(-24)) rows.push(...packetFollowups(packet, "PROVISIONAL_PACKET_FOLLOWUP", 4));
  const byId = new Map();
  for (const row of rows) if (!byId.has(row.queryId)) byId.set(row.queryId, row);
  return [...byId.values()];
}

function canonicalStats(state) {
  const byGap = new Map();
  let accepted = 0, rejected = 0, held = 0, appAuthoringEligible = 0, lifecycleAdvancements = 0;
  for (const outcome of (state.canonicalOutcomes ?? []).slice(-40)) {
    const key = gapKey(outcome?.feedbackContext?.atlasGap);
    if (!key) continue;
    const row = byGap.get(key) ?? { accepted: 0, rejected: 0, held: 0, observations: 0, score: 0 };
    if (outcome.reviewDecision === "ACCEPTED") { row.accepted += 1; accepted += 1; }
    else if (outcome.reviewDecision === "REJECTED") { row.rejected += 1; rejected += 1; }
    else if (outcome.reviewDecision === "HELD") { row.held += 1; held += 1; }
    else continue;
    if (outcome.appAuthoringEligible === true) appAuthoringEligible += 1;
    if (outcome.lifecycleAdvanced === true) lifecycleAdvancements += 1;
    row.observations += 1;
    row.score = row.accepted * 6 - row.rejected * 4 - row.held * 1.5;
    byGap.set(key, row);
  }
  return { byGap, accepted, rejected, held, appAuthoringEligible, lifecycleAdvancements };
}

function historicalFocusExposure(state) {
  const counts = new Map();
  for (const day of state.completedQuotaDays ?? []) {
    for (const focus of day.focuses ?? []) counts.set(focus, (counts.get(focus) ?? 0) + 1);
    for (const tranche of day.tranches ?? []) for (const focus of tranche.focuses ?? []) counts.set(focus, (counts.get(focus) ?? 0) + 0.25);
  }
  return counts;
}

function getSameDayMetric(metrics, focus) {
  return metrics?.[focus] ?? { searchCalls: 0, independentPagesReviewed: 0, recipeStructuredPagesConfirmed: 0, reviewCandidatesConsidered: 0, reviewReadyPacketsCreated: 0, duplicatePairsSuppressed: 0, uniqueUsefulSourceDomains: 0 };
}

function sameDayYieldScore(row) {
  const calls = Math.max(1, row.searchCalls ?? 0);
  const packetRate = (row.reviewReadyPacketsCreated ?? 0) / calls;
  const pageRate = (row.independentPagesReviewed ?? 0) / calls;
  const recipeRate = (row.recipeStructuredPagesConfirmed ?? 0) / calls;
  const domainRate = (row.uniqueUsefulSourceDomains ?? 0) / calls;
  const duplicateRate = (row.reviewCandidatesConsidered ?? 0) > 0 ? (row.duplicatePairsSuppressed ?? 0) / row.reviewCandidatesConsidered : 0;
  const noYieldPenalty = (row.searchCalls ?? 0) >= 4 && (row.reviewReadyPacketsCreated ?? 0) === 0 ? 3 : 0;
  return packetRate * 12 + domainRate * 5 + recipeRate * 2 + pageRate * 0.5 - duplicateRate * 4 - noYieldPenalty;
}

function queryScore(query, { state, sameDayFocusMetrics }) {
  const kc = canonicalStats(state);
  const gap = kc.byGap.get(gapKey(query.atlasGap)) ?? { score: 0, observations: 0 };
  const same = getSameDayMetric(sameDayFocusMetrics, query.focus);
  const exposure = historicalFocusExposure(state).get(query.focus) ?? 0;
  return { score: gap.score * 2 + sameDayYieldScore(same) * 4 + (query.signalStrength ?? 0) - exposure * 0.15 - (same.searchCalls ?? 0) * 0.08, canonicalObservations: gap.observations, sameDayCalls: same.searchCalls ?? 0, historicalExposure: exposure };
}

function takeWithFocusCap(rows, limit, capPerFocus) {
  const result = [], counts = new Map();
  for (const row of rows) {
    const count = counts.get(row.focus) ?? 0;
    if (count >= capPerFocus) continue;
    result.push(row); counts.set(row.focus, count + 1);
    if (result.length >= limit) break;
  }
  if (result.length < limit) {
    const chosen = new Set(result.map(row => row.queryId));
    for (const row of rows) { if (chosen.has(row.queryId)) continue; result.push(row); if (result.length >= limit) break; }
  }
  return result;
}

export function nextTrancheSize(searchCallsUsed, dailyCapacity = YT_CUL_5E_DAILY_SEARCH_CAPACITY) {
  if (!Number.isInteger(searchCallsUsed) || searchCallsUsed < 0) throw new Error("searchCallsUsed must be a non-negative integer");
  const remaining = Math.max(0, dailyCapacity - searchCallsUsed);
  if (remaining === 0) return 0;
  return Math.min(searchCallsUsed === 0 ? YT_CUL_5E_FIRST_TRANCHE_SIZE : YT_CUL_5E_NEXT_TRANCHE_SIZE, remaining);
}

export function selectNextAdaptiveTranche({ state = {}, portfolio, usedQueryIds = [], sameDayFocusMetrics = {}, trancheSize }) {
  if (!Array.isArray(portfolio)) throw new Error("portfolio must be an array");
  if (!Number.isInteger(trancheSize) || trancheSize < 0) throw new Error("trancheSize must be a non-negative integer");
  if (trancheSize === 0) return { queries: [], explorationSlots: 0, exploitationSlots: 0 };
  const used = new Set(usedQueryIds);
  const available = portfolio.filter(query => !used.has(query.queryId));
  const scored = available.map(query => ({ query, ...queryScore(query, { state, sameDayFocusMetrics }) }));
  const explorationSlots = Math.min(trancheSize, Math.max(2, Math.ceil(trancheSize * YT_CUL_5E_EXPLORATION_FRACTION)));
  const exploitationSlots = Math.max(0, trancheSize - explorationSlots);
  const exploitSorted = [...scored].sort((a, b) => b.score - a.score || hash(a.query.queryId).localeCompare(hash(b.query.queryId)));
  const capPerFocus = Math.max(1, Math.ceil(exploitationSlots * YT_CUL_5E_MAX_EXPLOIT_SHARE_PER_FOCUS));
  const exploit = takeWithFocusCap(exploitSorted.map(row => row.query), exploitationSlots, capPerFocus);
  const chosen = new Set(exploit.map(query => query.queryId));
  const exploreSorted = scored.filter(row => !chosen.has(row.query.queryId)).sort((a, b) => a.canonicalObservations - b.canonicalObservations || a.sameDayCalls - b.sameDayCalls || a.historicalExposure - b.historicalExposure || hash(a.query.queryId).localeCompare(hash(b.query.queryId)));
  const explore = exploreSorted.slice(0, Math.max(0, trancheSize - exploit.length)).map(row => row.query);
  const queries = [...exploit, ...explore].slice(0, trancheSize);
  return { queries, exploitationSlots: exploit.length, explorationSlots: queries.length - exploit.length, availableQueriesBeforeSelection: available.length };
}

export function policyVintageIsFresh(policyRecheckedAt, now = new Date(), maxAgeDays = YT_CUL_5E_POLICY_MAX_AGE_DAYS) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policyRecheckedAt || "")) return false;
  const policyMs = Date.parse(`${policyRecheckedAt}T12:00:00Z`);
  return Number.isFinite(policyMs) && now.getTime() - policyMs <= maxAgeDays * DAY_MS && now.getTime() >= policyMs - DAY_MS;
}

export function evaluateAdaptivePreSearchGate(state, { now = new Date(), quotaDate } = {}) {
  if (!state || typeof state !== "object") throw new Error("state is required");
  if (!quotaDate || !/^\d{4}-\d{2}-\d{2}$/.test(quotaDate)) throw new Error("quotaDate is required");
  if (state.ytCul6Readiness?.earned) return { searchAllowed: false, terminalState: "YT_CUL_6_READINESS_EARNED", dailyCapacity: 0, resumeSearchCallsUsed: 0 };
  const supersededRecoverableHold = ["DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE", "DAILY_SEARCH_HOLD_ALREADY_COMPLETED_QUOTA_DAY"].includes(state.hardHold);
  if (state.hardHold && !supersededRecoverableHold) return { searchAllowed: false, terminalState: state.hardHold, dailyCapacity: 0, resumeSearchCallsUsed: 0 };
  if (!policyVintageIsFresh(state.policyRecheckedAt, now)) return { searchAllowed: false, terminalState: "DAILY_SEARCH_HOLD_POLICY_OR_QUOTA", dailyCapacity: 0, resumeSearchCallsUsed: 0 };
  if ((state.unresolvedPackets ?? []).length >= YT_CUL_5E_REVIEW_QUEUE_CAP) return { searchAllowed: false, terminalState: "DAILY_SEARCH_HOLD_REVIEW_BACKLOG", dailyCapacity: 0, resumeSearchCallsUsed: 0 };
  const absolute = Math.max(0, (state.assignedDailySearchLimit ?? 0) - (state.protectedReserveCalls ?? 0));
  const dailyCapacity = Math.min(YT_CUL_5E_DAILY_SEARCH_CAPACITY, absolute);
  if (dailyCapacity <= 0) return { searchAllowed: false, terminalState: "DAILY_SEARCH_HOLD_POLICY_OR_QUOTA", dailyCapacity: 0, resumeSearchCallsUsed: 0 };
  const progress = state.quotaDayProgress?.quotaDate === quotaDate ? state.quotaDayProgress : null;
  if (state.lastCompletedQuotaDate === quotaDate && !progress) return { searchAllowed: false, terminalState: "DAILY_SEARCH_ALREADY_COMPLETED_QUOTA_DAY", dailyCapacity: 0, resumeSearchCallsUsed: 0 };
  const resumeSearchCallsUsed = clamp(progress?.searchCallsUsed ?? 0, 0, dailyCapacity);
  if (resumeSearchCallsUsed >= dailyCapacity) return { searchAllowed: false, terminalState: "DAILY_DISCOVERY_QUOTA_PORTFOLIO_COMPLETE", dailyCapacity, resumeSearchCallsUsed };
  return { searchAllowed: true, terminalState: progress ? "DAILY_DISCOVERY_RESUME_PRECHECK_PASS" : "DAILY_DISCOVERY_PRECHECK_PASS", dailyCapacity, resumeSearchCallsUsed };
}

export function summarizeCanonicalLearning(state) {
  const kc = canonicalStats(state ?? {});
  const resolved = kc.accepted + kc.rejected;
  return { accepted: kc.accepted, rejected: kc.rejected, held: kc.held, resolved, acceptanceRate: resolved ? kc.accepted / resolved : null, appAuthoringEligible: kc.appAuthoringEligible, explicitLifecycleAdvancements: kc.lifecycleAdvancements };
}

export function computeResearchKpis({ state, day }) {
  const calls = Math.max(0, day?.searchCalls ?? 0);
  const cumulativePrior = Math.max(0, state?.cumulative?.searchCalls ?? 0);
  const cumulativeCalls = cumulativePrior + calls;
  const learning = summarizeCanonicalLearning(state ?? {});
  const ratio = numerator => calls > 0 ? numerator / calls : 0;
  const cumulativeRatio = numerator => cumulativeCalls > 0 ? numerator / cumulativeCalls : 0;
  return { searchUtilization: (day?.searchCapacity ?? 0) > 0 ? calls / day.searchCapacity : 0, independentPagesPerSearch: ratio(day?.independentPagesReviewed ?? 0), recipeStructuredPagesPerSearch: ratio(day?.recipeStructuredPagesConfirmed ?? 0), reviewReadyPacketsPerSearch: ratio(day?.reviewReadyPacketsCreated ?? 0), usefulSourceDomainsPerSearch: ratio(day?.uniqueUsefulSourceDomains ?? 0), canonicalAcceptedPerCumulativeSearch: cumulativeRatio(learning.accepted), appAuthoringEligiblePerCumulativeSearch: cumulativeRatio(learning.appAuthoringEligible), explicitLifecycleAdvancementsPerCumulativeSearch: cumulativeRatio(learning.explicitLifecycleAdvancements) };
}
