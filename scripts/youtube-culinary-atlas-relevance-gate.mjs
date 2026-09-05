import { createHash } from "node:crypto";
import { assertPolicySafeDurableObject } from "./youtube-culinary-discovery-control-plane.mjs";

export const YT_CUL_5R_REVIEW_PACKET_SCHEMA = "youtube-culinary-atlas-relevance-review-ready-v1";
export const YT_CUL_5R_REVIEW_QUEUE_CAP = 40;
export const YT_CUL_5R_CLAIM_SCOPES = Object.freeze([
  "IDENTITY",
  "STRUCTURE",
  "VARIANT",
  "TECHNIQUE_SOURCE_QUESTION",
  "TRANSFORMATION_QUESTION"
]);

const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeDomain(value) {
  const domain = normalizeText(value).toLowerCase().replace(/\.$/, "");
  if (!domain || domain.includes("/") || domain.includes(":")) throw new Error("sourceDomain must be a bare hostname");
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(domain)) throw new Error("sourceDomain must be independent and non-YouTube");
  return domain;
}

function canonicalizeIndependentUrl(value) {
  if (!isNonEmptyString(value)) throw new Error("sourceUrl must be HTTP(S)");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("sourceUrl must be HTTP(S)");
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(url.hostname)) throw new Error("sourceUrl must be independent and non-YouTube");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

function validateGap(gap) {
  if (!isObject(gap)) throw new Error("atlasGap must be an object");
  const normalized = {
    macroRegion: normalizeText(gap.macroRegion) || null,
    familyGap: normalizeText(gap.familyGap) || null,
    mealRoleGap: normalizeText(gap.mealRoleGap) || null,
    techniqueGap: normalizeText(gap.techniqueGap) || null
  };
  if (!Object.values(normalized).some(Boolean)) throw new Error("atlasGap must identify at least one bounded gap dimension");
  return normalized;
}

function validateMachineEvidence(value) {
  if (!isObject(value)) throw new Error("machineEvidence must be an object");
  const allowed = new Set([
    "recipeStructuredPage",
    "candidateLabelsObserved",
    "languageHint",
    "techniqueTermsObserved",
    "ingredientTermsObserved",
    "independentPageFingerprint"
  ]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`machineEvidence.${key} is not an approved policy-safe discovery field`);
  }
  if (value.recipeStructuredPage !== true) throw new Error("machineEvidence.recipeStructuredPage must be true");
  for (const listKey of ["candidateLabelsObserved", "techniqueTermsObserved", "ingredientTermsObserved"]) {
    if (value[listKey] !== undefined && (!Array.isArray(value[listKey]) || value[listKey].some(item => !isNonEmptyString(item)))) {
      throw new Error(`machineEvidence.${listKey} must be an array of non-empty strings`);
    }
  }
  if (value.languageHint !== undefined && value.languageHint !== null && !isNonEmptyString(value.languageHint)) {
    throw new Error("machineEvidence.languageHint must be a non-empty string or null");
  }
  if (value.independentPageFingerprint !== undefined && !/^[a-f0-9]{16,64}$/i.test(value.independentPageFingerprint)) {
    throw new Error("machineEvidence.independentPageFingerprint must be a hex digest");
  }
  return structuredClone(value);
}

export function createIndependentRecipeSourceReviewPointer({ candidateLabel, sourceDomain, sourceUrl }) {
  if (!isNonEmptyString(candidateLabel)) throw new Error("candidateLabel is required");
  const domain = normalizeDomain(sourceDomain);
  const independentSourceUrl = canonicalizeIndependentUrl(sourceUrl);
  const pointer = {
    schemaVersion: "youtube-culinary-independent-recipe-source-review-pointer-v1",
    pointerId: `yt-cul-source-${hash(`${candidateLabel}\n${independentSourceUrl}`).slice(0, 20)}`,
    candidateLabel: normalizeText(candidateLabel),
    sourceDomain: domain,
    independentSourceUrl,
    evidenceOrigin: "INDEPENDENT_NON_YOUTUBE_SOURCE",
    evidenceRole: "RECIPE_SOURCE_REVIEW_POINTER_ONLY",
    atlasFamilyCandidateNominated: false,
    atlasPromotionAuthorized: false,
    appAdmissionAuthorized: false,
    runtimeActivationAuthorized: false
  };
  assertPolicySafeDurableObject(pointer);
  return pointer;
}

export function createAtlasRelevanceReviewReadyPacket({
  candidateLabel,
  atlasCandidateId = null,
  claimScope,
  atlasGap,
  sourceDomain,
  sourceUrl,
  sourceRetrievedAt,
  machineEvidence,
  relevanceReason,
  unresolvedAmbiguity = []
}) {
  if (!isNonEmptyString(candidateLabel)) throw new Error("candidateLabel is required");
  if (atlasCandidateId !== null && !isNonEmptyString(atlasCandidateId)) throw new Error("atlasCandidateId must be a non-empty string or null");
  if (!YT_CUL_5R_CLAIM_SCOPES.includes(claimScope)) throw new Error("claimScope is not allowed");
  const gap = validateGap(atlasGap);
  const domain = normalizeDomain(sourceDomain);
  const independentSourceUrl = canonicalizeIndependentUrl(sourceUrl);
  if (new URL(independentSourceUrl).hostname.toLowerCase() !== domain) throw new Error("sourceDomain must match sourceUrl hostname");
  if (!isNonEmptyString(sourceRetrievedAt) || !Number.isFinite(Date.parse(sourceRetrievedAt))) throw new Error("sourceRetrievedAt must be an ISO date-time");
  if (!isNonEmptyString(relevanceReason)) throw new Error("relevanceReason is required");
  if (!Array.isArray(unresolvedAmbiguity) || unresolvedAmbiguity.some(item => !isNonEmptyString(item))) {
    throw new Error("unresolvedAmbiguity must be an array of non-empty strings");
  }
  const evidence = validateMachineEvidence(machineEvidence);
  const normalizedLabel = normalizeText(candidateLabel);
  const targetKey = [
    atlasCandidateId ? normalizeText(atlasCandidateId) : normalizedLabel.toLowerCase(),
    claimScope,
    gap.macroRegion ?? "",
    gap.familyGap ?? "",
    gap.mealRoleGap ?? "",
    gap.techniqueGap ?? ""
  ].join("|");
  const pairKey = `yt-cul-pair-${hash(`${targetKey}\n${independentSourceUrl}`).slice(0, 24)}`;
  const packet = {
    schemaVersion: YT_CUL_5R_REVIEW_PACKET_SCHEMA,
    packetStatus: "ATLAS_RELEVANCE_REVIEW_READY",
    packetId: `yt-cul-review-${hash(`${pairKey}\n${sourceRetrievedAt}`).slice(0, 24)}`,
    reviewPairKey: pairKey,
    candidateLabel: normalizedLabel,
    atlasCandidateId: atlasCandidateId ? normalizeText(atlasCandidateId) : null,
    claimScope,
    atlasGap: gap,
    independentSourceProvenance: {
      sourceDomain: domain,
      independentSourceUrl,
      sourceRetrievedAt: new Date(Date.parse(sourceRetrievedAt)).toISOString(),
      evidenceOrigin: "INDEPENDENT_NON_YOUTUBE_SOURCE"
    },
    machineEvidence: evidence,
    relevanceReason: normalizeText(relevanceReason),
    unresolvedAmbiguity: unresolvedAmbiguity.map(normalizeText),
    reviewAuthorityRequired: "KNOWLEDGE_CORE_ATLAS_REVIEW",
    atlasFamilyCandidateNominated: false,
    automaticAtlasPromotionAuthorized: false,
    automaticAppAdmissionAuthorized: false,
    knowledgeCoreStateChanged: false,
    appStateChanged: false
  };
  assertPolicySafeDurableObject(packet);
  return packet;
}

export function validateAtlasRelevanceReviewReadyPacket(packet) {
  if (!isObject(packet)) throw new Error("packet must be an object");
  if (packet.schemaVersion !== YT_CUL_5R_REVIEW_PACKET_SCHEMA) throw new Error("invalid review-ready packet schemaVersion");
  if (packet.packetStatus !== "ATLAS_RELEVANCE_REVIEW_READY") throw new Error("packetStatus must be ATLAS_RELEVANCE_REVIEW_READY");
  if (!/^yt-cul-review-[a-f0-9]{24}$/.test(packet.packetId || "")) throw new Error("invalid packetId");
  if (!/^yt-cul-pair-[a-f0-9]{24}$/.test(packet.reviewPairKey || "")) throw new Error("invalid reviewPairKey");
  if (!isNonEmptyString(packet.candidateLabel)) throw new Error("candidateLabel is required");
  if (!YT_CUL_5R_CLAIM_SCOPES.includes(packet.claimScope)) throw new Error("claimScope is not allowed");
  validateGap(packet.atlasGap);
  if (!isObject(packet.independentSourceProvenance)) throw new Error("independentSourceProvenance is required");
  const domain = normalizeDomain(packet.independentSourceProvenance.sourceDomain);
  const sourceUrl = canonicalizeIndependentUrl(packet.independentSourceProvenance.independentSourceUrl);
  if (new URL(sourceUrl).hostname.toLowerCase() !== domain) throw new Error("sourceDomain must match sourceUrl hostname");
  if (packet.independentSourceProvenance.evidenceOrigin !== "INDEPENDENT_NON_YOUTUBE_SOURCE") throw new Error("evidenceOrigin must be independent non-YouTube");
  if (!Number.isFinite(Date.parse(packet.independentSourceProvenance.sourceRetrievedAt || ""))) throw new Error("sourceRetrievedAt is invalid");
  validateMachineEvidence(packet.machineEvidence);
  if (!isNonEmptyString(packet.relevanceReason)) throw new Error("relevanceReason is required");
  if (!Array.isArray(packet.unresolvedAmbiguity)) throw new Error("unresolvedAmbiguity must be an array");
  if (packet.reviewAuthorityRequired !== "KNOWLEDGE_CORE_ATLAS_REVIEW") throw new Error("reviewAuthorityRequired must remain KNOWLEDGE_CORE_ATLAS_REVIEW");
  if (packet.atlasFamilyCandidateNominated !== false) throw new Error("review-ready packet cannot nominate an Atlas family");
  if (packet.automaticAtlasPromotionAuthorized !== false) throw new Error("automaticAtlasPromotionAuthorized must remain false");
  if (packet.automaticAppAdmissionAuthorized !== false) throw new Error("automaticAppAdmissionAuthorized must remain false");
  if (packet.knowledgeCoreStateChanged !== false || packet.appStateChanged !== false) throw new Error("review-ready packet cannot change canonical state");
  assertPolicySafeDurableObject(packet);
  return packet;
}

export function computeIndependentSourceDomainDiversity(packets) {
  if (!Array.isArray(packets)) throw new Error("packets must be an array");
  const counts = new Map();
  for (const packet of packets) {
    validateAtlasRelevanceReviewReadyPacket(packet);
    const domain = packet.independentSourceProvenance.sourceDomain;
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  const totalPackets = packets.length;
  const domainCounts = [...counts.entries()]
    .map(([sourceDomain, packetCount]) => ({ sourceDomain, packetCount }))
    .sort((a, b) => b.packetCount - a.packetCount || a.sourceDomain.localeCompare(b.sourceDomain));
  const largestDomainCount = domainCounts[0]?.packetCount ?? 0;
  const largestDomainShare = totalPackets === 0 ? 0 : largestDomainCount / totalPackets;
  const diversity = {
    schemaVersion: "youtube-culinary-independent-source-diversity-v1",
    totalPackets,
    uniqueIndependentSourceDomains: domainCounts.length,
    largestDomainShare,
    domainCounts,
    sourceDiversityUseful: domainCounts.length > 1,
    youtubeDerivedSourceDiversityUsed: false
  };
  assertPolicySafeDurableObject(diversity);
  return diversity;
}

export function suppressReviewedOrQueuedPairs({ candidates, reviewedPairKeys = [], unresolvedPackets = [] }) {
  if (!Array.isArray(candidates)) throw new Error("candidates must be an array");
  if (!Array.isArray(reviewedPairKeys) || reviewedPairKeys.some(key => !isNonEmptyString(key))) throw new Error("reviewedPairKeys must be an array of strings");
  if (!Array.isArray(unresolvedPackets)) throw new Error("unresolvedPackets must be an array");
  const seen = new Set(reviewedPairKeys);
  for (const packet of unresolvedPackets) {
    validateAtlasRelevanceReviewReadyPacket(packet);
    seen.add(packet.reviewPairKey);
  }
  const admitted = [];
  const suppressed = [];
  for (const candidate of candidates) {
    const packet = candidate?.schemaVersion === YT_CUL_5R_REVIEW_PACKET_SCHEMA
      ? validateAtlasRelevanceReviewReadyPacket(candidate)
      : createAtlasRelevanceReviewReadyPacket(candidate);
    if (seen.has(packet.reviewPairKey)) {
      suppressed.push({ reviewPairKey: packet.reviewPairKey, reason: "ALREADY_REVIEWED_OR_QUEUED_SOURCE_TARGET_PAIR" });
      continue;
    }
    seen.add(packet.reviewPairKey);
    admitted.push(packet);
  }
  return {
    admitted,
    suppressed,
    duplicatePairsSuppressed: suppressed.length
  };
}

export function evaluateReviewQueueBackpressure(unresolvedPackets, queueCap = YT_CUL_5R_REVIEW_QUEUE_CAP) {
  if (!Array.isArray(unresolvedPackets)) throw new Error("unresolvedPackets must be an array");
  if (!Number.isInteger(queueCap) || queueCap < 1) throw new Error("queueCap must be a positive integer");
  unresolvedPackets.forEach(validateAtlasRelevanceReviewReadyPacket);
  const unresolvedReviewBacklog = unresolvedPackets.length;
  const held = unresolvedReviewBacklog >= queueCap;
  return {
    schemaVersion: "youtube-culinary-review-backpressure-v1",
    queueCap,
    unresolvedReviewBacklog,
    remainingQueueCapacity: Math.max(0, queueCap - unresolvedReviewBacklog),
    searchAllowed: !held,
    terminalState: held ? "DAILY_SEARCH_HOLD_REVIEW_BACKLOG" : "REVIEW_QUEUE_CAPACITY_AVAILABLE"
  };
}

export function admitReviewReadyPackets({ candidates, reviewedPairKeys = [], unresolvedPackets = [], queueCap = YT_CUL_5R_REVIEW_QUEUE_CAP }) {
  const backpressure = evaluateReviewQueueBackpressure(unresolvedPackets, queueCap);
  if (!backpressure.searchAllowed) {
    return {
      ...backpressure,
      admittedPackets: [],
      suppressedPairs: [],
      duplicatePairsSuppressed: 0
    };
  }
  const deduped = suppressReviewedOrQueuedPairs({ candidates, reviewedPairKeys, unresolvedPackets });
  const available = backpressure.remainingQueueCapacity;
  const admittedPackets = deduped.admitted.slice(0, available);
  const capacitySuppressed = deduped.admitted.slice(available).map(packet => ({
    reviewPairKey: packet.reviewPairKey,
    reason: "REVIEW_QUEUE_CAPACITY_EXHAUSTED"
  }));
  return {
    ...backpressure,
    admittedPackets,
    suppressedPairs: [...deduped.suppressed, ...capacitySuppressed],
    duplicatePairsSuppressed: deduped.duplicatePairsSuppressed,
    terminalState: capacitySuppressed.length ? "REVIEW_QUEUE_FILLED_TO_CAP" : "REVIEW_QUEUE_CAPACITY_AVAILABLE"
  };
}

export function validateAtlasRelevanceMapping(mapping, pointerIds) {
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) throw new Error("mapping must be an object");
  if (!isNonEmptyString(mapping.sourceReviewPointerId) || !pointerIds.has(mapping.sourceReviewPointerId)) {
    throw new Error("mapping must reference a known independent source-review pointer");
  }
  if (mapping.reviewAuthority !== "KNOWLEDGE_CORE_ATLAS_REVIEW") throw new Error("mapping reviewAuthority must be KNOWLEDGE_CORE_ATLAS_REVIEW");
  if (!isNonEmptyString(mapping.atlasCandidateId)) throw new Error("mapping.atlasCandidateId is required");
  if (!isNonEmptyString(mapping.claimScope)) throw new Error("mapping.claimScope is required");
  if (mapping.identityRelevanceVerified !== true) throw new Error("mapping.identityRelevanceVerified must be true");
  if (mapping.automaticPromotionAuthorized !== false) throw new Error("mapping.automaticPromotionAuthorized must remain false");
  return mapping;
}

export function reconcileAtlasCandidateAuthority({ sourceReviewPointers, atlasRelevanceMappings = [] }) {
  if (!Array.isArray(sourceReviewPointers)) throw new Error("sourceReviewPointers must be an array");
  if (!Array.isArray(atlasRelevanceMappings)) throw new Error("atlasRelevanceMappings must be an array");
  const pointerIds = new Set();
  for (const pointer of sourceReviewPointers) {
    if (!pointer || pointer.schemaVersion !== "youtube-culinary-independent-recipe-source-review-pointer-v1") throw new Error("invalid source-review pointer");
    if (!isNonEmptyString(pointer.pointerId) || pointerIds.has(pointer.pointerId)) throw new Error("source-review pointer IDs must be unique");
    if (pointer.atlasFamilyCandidateNominated !== false || pointer.atlasPromotionAuthorized !== false) throw new Error("source-review pointer cannot carry Atlas authority");
    pointerIds.add(pointer.pointerId);
  }

  const mappings = atlasRelevanceMappings.map(mapping => validateAtlasRelevanceMapping(mapping, pointerIds));
  const mappedPointerIds = new Set();
  for (const mapping of mappings) {
    if (mappedPointerIds.has(mapping.sourceReviewPointerId)) throw new Error("duplicate Atlas relevance mapping for source-review pointer");
    mappedPointerIds.add(mapping.sourceReviewPointerId);
  }

  const reconciled = {
    schemaVersion: "youtube-culinary-atlas-relevance-reconciliation-v1",
    sourceReviewPointersObserved: sourceReviewPointers.length,
    atlasRelevanceMappingsVerified: mappings.length,
    atlasFamilyCandidatesNominated: mappings.length,
    atlasPromotions: 0,
    automaticAtlasPromotionAuthorized: false,
    automaticAppAdmissionAuthorized: false,
    knowledgeCoreStateChanged: false,
    appStateChanged: false,
    rule: "INDEPENDENT_RECIPE_STRUCTURED_PAGE_IS_NOT_ATLAS_FAMILY_RELEVANCE"
  };
  assertPolicySafeDurableObject(reconciled);
  return reconciled;
}

export function evaluateYtCul5rArchitecture({ packetSchema, sourceDiversity, deduplication, backlogControl, authorityBoundary }) {
  const checks = { packetSchema, sourceDiversity, deduplication, backlogControl, authorityBoundary };
  if (Object.values(checks).some(value => typeof value !== "boolean")) throw new Error("all YT-CUL-5R architecture checks must be boolean");
  return Object.values(checks).every(Boolean)
    ? "YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_ARCHITECTURE_PASS"
    : "YT_CUL_5R_REPAIR_REQUIRED";
}

export function classifyCanonicalYtCul5Terminal({ callsExecuted, independentlyReviewedCandidates, independentlyConfirmedRecipePages, uniqueConfirmedSourceDomains, atlasFamilyCandidatesNominated }) {
  if (!Number.isInteger(callsExecuted) || callsExecuted < 1) throw new Error("callsExecuted must be >= 1");
  const confirmedPerSearchCall = independentlyConfirmedRecipePages / callsExecuted;
  if (
    atlasFamilyCandidatesNominated >= 5 &&
    uniqueConfirmedSourceDomains >= 4 &&
    independentlyReviewedCandidates >= 10 &&
    confirmedPerSearchCall >= 0.5
  ) return "YT_CUL_5_ATLAS_EXPANSION_CADENCE_EARNED";
  if (independentlyConfirmedRecipePages >= 3 || independentlyReviewedCandidates >= 8) {
    return "YT_CUL_5_USEFUL_BUT_REVIEW_BOUND";
  }
  return "YT_CUL_5_LOW_MARGINAL_VALUE";
}
