import test from "node:test";
import assert from "node:assert/strict";
import {
  YT_CUL_5R_REVIEW_PACKET_SCHEMA,
  YT_CUL_5R_REVIEW_QUEUE_CAP,
  createAtlasRelevanceReviewReadyPacket,
  validateAtlasRelevanceReviewReadyPacket,
  computeIndependentSourceDomainDiversity,
  suppressReviewedOrQueuedPairs,
  evaluateReviewQueueBackpressure,
  admitReviewReadyPackets,
  reconcileAtlasCandidateAuthority,
  evaluateYtCul5rArchitecture
} from "../scripts/youtube-culinary-atlas-relevance-gate.mjs";

function packetInput({
  candidateLabel = "Example Millet Stew",
  atlasCandidateId = null,
  claimScope = "IDENTITY",
  sourceDomain = "recipes.example",
  sourceUrl = "https://recipes.example/example-millet-stew",
  sourceRetrievedAt = "2026-09-05T20:00:00Z",
  macroRegion = "CENTRAL_SOUTHERN_AFRICA"
} = {}) {
  return {
    candidateLabel,
    atlasCandidateId,
    claimScope,
    atlasGap: {
      macroRegion,
      familyGap: "MILLET_STEW_FAMILY",
      mealRoleGap: null,
      techniqueGap: null
    },
    sourceDomain,
    sourceUrl,
    sourceRetrievedAt,
    machineEvidence: {
      recipeStructuredPage: true,
      candidateLabelsObserved: [candidateLabel],
      languageHint: "en",
      techniqueTermsObserved: ["stew"],
      ingredientTermsObserved: ["millet"],
      independentPageFingerprint: "0123456789abcdef"
    },
    relevanceReason: "Independent Recipe page names the bounded candidate and matches the Atlas family gap under review.",
    unresolvedAmbiguity: ["Regional naming breadth still requires canonical Knowledge Core review."]
  };
}

test("YT-CUL-5R creates a policy-safe ATLAS_RELEVANCE_REVIEW_READY packet without canonical authority", () => {
  const packet = createAtlasRelevanceReviewReadyPacket(packetInput());
  assert.equal(packet.schemaVersion, YT_CUL_5R_REVIEW_PACKET_SCHEMA);
  assert.equal(packet.packetStatus, "ATLAS_RELEVANCE_REVIEW_READY");
  assert.equal(packet.claimScope, "IDENTITY");
  assert.equal(packet.independentSourceProvenance.sourceDomain, "recipes.example");
  assert.equal(packet.independentSourceProvenance.evidenceOrigin, "INDEPENDENT_NON_YOUTUBE_SOURCE");
  assert.equal(packet.reviewAuthorityRequired, "KNOWLEDGE_CORE_ATLAS_REVIEW");
  assert.equal(packet.atlasFamilyCandidateNominated, false);
  assert.equal(packet.automaticAtlasPromotionAuthorized, false);
  assert.equal(packet.automaticAppAdmissionAuthorized, false);
  assert.equal(packet.knowledgeCoreStateChanged, false);
  assert.equal(packet.appStateChanged, false);
  assert.doesNotThrow(() => validateAtlasRelevanceReviewReadyPacket(packet));
});

test("YT-CUL-5R requires bounded Atlas gap, explicit relevance reason and independent non-YouTube provenance", () => {
  assert.throws(() => createAtlasRelevanceReviewReadyPacket({
    ...packetInput(),
    atlasGap: { macroRegion: null, familyGap: null, mealRoleGap: null, techniqueGap: null }
  }), /at least one bounded gap dimension/);

  assert.throws(() => createAtlasRelevanceReviewReadyPacket({
    ...packetInput(),
    relevanceReason: ""
  }), /relevanceReason is required/);

  assert.throws(() => createAtlasRelevanceReviewReadyPacket({
    ...packetInput(),
    sourceDomain: "youtube.com",
    sourceUrl: "https://youtube.com/watch?v=not-used"
  }), /independent and non-YouTube/);
});

test("YT-CUL-5R limits machine evidence to policy-safe independent-source discovery metadata", () => {
  assert.throws(() => createAtlasRelevanceReviewReadyPacket({
    ...packetInput(),
    machineEvidence: {
      recipeStructuredPage: true,
      viewCount: 123
    }
  }), /not an approved policy-safe discovery field/);
});

test("source-domain diversity accounting is deterministic and independent-source only", () => {
  const packets = [
    createAtlasRelevanceReviewReadyPacket(packetInput()),
    createAtlasRelevanceReviewReadyPacket(packetInput({
      candidateLabel: "Example Bean Stew",
      sourceDomain: "recipes.example",
      sourceUrl: "https://recipes.example/example-bean-stew",
      sourceRetrievedAt: "2026-09-05T20:01:00Z"
    })),
    createAtlasRelevanceReviewReadyPacket(packetInput({
      candidateLabel: "Example Leaf Stew",
      sourceDomain: "heritage.example.org",
      sourceUrl: "https://heritage.example.org/example-leaf-stew",
      sourceRetrievedAt: "2026-09-05T20:02:00Z"
    }))
  ];
  const diversity = computeIndependentSourceDomainDiversity(packets);
  assert.equal(diversity.totalPackets, 3);
  assert.equal(diversity.uniqueIndependentSourceDomains, 2);
  assert.equal(diversity.domainCounts[0].sourceDomain, "recipes.example");
  assert.equal(diversity.domainCounts[0].packetCount, 2);
  assert.equal(diversity.largestDomainShare, 2 / 3);
  assert.equal(diversity.sourceDiversityUseful, true);
  assert.equal(diversity.youtubeDerivedSourceDiversityUsed, false);
});

test("deduplication suppresses previously reviewed and already queued source/target pairs", () => {
  const queued = createAtlasRelevanceReviewReadyPacket(packetInput());
  const reviewed = createAtlasRelevanceReviewReadyPacket(packetInput({
    candidateLabel: "Reviewed Soup",
    sourceDomain: "archive.example",
    sourceUrl: "https://archive.example/reviewed-soup",
    sourceRetrievedAt: "2026-09-05T20:03:00Z"
  }));
  const fresh = packetInput({
    candidateLabel: "Fresh Porridge",
    sourceDomain: "cooking.example.net",
    sourceUrl: "https://cooking.example.net/fresh-porridge",
    sourceRetrievedAt: "2026-09-05T20:04:00Z"
  });

  const result = suppressReviewedOrQueuedPairs({
    candidates: [packetInput(), packetInput({
      candidateLabel: "Reviewed Soup",
      sourceDomain: "archive.example",
      sourceUrl: "https://archive.example/reviewed-soup",
      sourceRetrievedAt: "2026-09-06T01:00:00Z"
    }), fresh],
    reviewedPairKeys: [reviewed.reviewPairKey],
    unresolvedPackets: [queued]
  });

  assert.equal(result.admitted.length, 1);
  assert.equal(result.admitted[0].candidateLabel, "Fresh Porridge");
  assert.equal(result.duplicatePairsSuppressed, 2);
  assert.ok(result.suppressed.every(item => item.reason === "ALREADY_REVIEWED_OR_QUEUED_SOURCE_TARGET_PAIR"));
});

test("review-queue backpressure holds Search at the 40-packet cap", () => {
  const base = packetInput();
  const unresolved = Array.from({ length: YT_CUL_5R_REVIEW_QUEUE_CAP }, (_, index) => createAtlasRelevanceReviewReadyPacket({
    ...base,
    candidateLabel: `Candidate ${index}`,
    sourceDomain: `source${index}.example`,
    sourceUrl: `https://source${index}.example/recipe`,
    sourceRetrievedAt: `2026-09-05T20:${String(index).padStart(2, "0")}:00Z`
  }));
  const state = evaluateReviewQueueBackpressure(unresolved);
  assert.equal(state.unresolvedReviewBacklog, 40);
  assert.equal(state.remainingQueueCapacity, 0);
  assert.equal(state.searchAllowed, false);
  assert.equal(state.terminalState, "DAILY_SEARCH_HOLD_REVIEW_BACKLOG");

  const admission = admitReviewReadyPackets({ candidates: [packetInput({ candidateLabel: "Would Overflow" })], unresolvedPackets: unresolved });
  assert.equal(admission.admittedPackets.length, 0);
  assert.equal(admission.terminalState, "DAILY_SEARCH_HOLD_REVIEW_BACKLOG");
});

test("a Recipe-structured review-ready packet cannot become an Atlas nomination without canonical Knowledge Core mapping", () => {
  const packet = createAtlasRelevanceReviewReadyPacket(packetInput());
  assert.equal(packet.machineEvidence.recipeStructuredPage, true);
  assert.equal(packet.atlasFamilyCandidateNominated, false);
  assert.throws(() => reconcileAtlasCandidateAuthority({
    sourceReviewPointers: [packet],
    atlasRelevanceMappings: []
  }), /invalid source-review pointer/);
});

test("YT-CUL-5R architecture terminal state is explicit", () => {
  assert.equal(evaluateYtCul5rArchitecture({
    packetSchema: true,
    sourceDiversity: true,
    deduplication: true,
    backlogControl: true,
    authorityBoundary: true
  }), "YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_ARCHITECTURE_PASS");

  assert.equal(evaluateYtCul5rArchitecture({
    packetSchema: true,
    sourceDiversity: true,
    deduplication: false,
    backlogControl: true,
    authorityBoundary: true
  }), "YT_CUL_5R_REPAIR_REQUIRED");
});
