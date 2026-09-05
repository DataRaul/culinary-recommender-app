import { createHash } from "node:crypto";
import { assertPolicySafeDurableObject } from "./youtube-culinary-discovery-control-plane.mjs";

const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function createIndependentRecipeSourceReviewPointer({ candidateLabel, sourceDomain, sourceUrl }) {
  if (!isNonEmptyString(candidateLabel)) throw new Error("candidateLabel is required");
  if (!isNonEmptyString(sourceDomain)) throw new Error("sourceDomain is required");
  if (!isNonEmptyString(sourceUrl) || !/^https?:\/\//i.test(sourceUrl)) throw new Error("sourceUrl must be HTTP(S)");
  const pointer = {
    schemaVersion: "youtube-culinary-independent-recipe-source-review-pointer-v1",
    pointerId: `yt-cul-source-${hash(`${candidateLabel}\n${sourceUrl}`).slice(0, 20)}`,
    candidateLabel: candidateLabel.trim(),
    sourceDomain: sourceDomain.trim().toLowerCase(),
    independentSourceUrl: sourceUrl,
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
