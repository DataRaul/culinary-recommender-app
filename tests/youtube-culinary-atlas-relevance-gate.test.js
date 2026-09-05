import test from "node:test";
import assert from "node:assert/strict";
import {
  createIndependentRecipeSourceReviewPointer,
  reconcileAtlasCandidateAuthority,
  classifyCanonicalYtCul5Terminal
} from "../scripts/youtube-culinary-atlas-relevance-gate.mjs";

test("independent Recipe page is a source-review pointer, not an Atlas family nomination", () => {
  const pointer = createIndependentRecipeSourceReviewPointer({
    candidateLabel: "Example soup",
    sourceDomain: "recipes.example",
    sourceUrl: "https://recipes.example/example-soup"
  });
  assert.equal(pointer.evidenceRole, "RECIPE_SOURCE_REVIEW_POINTER_ONLY");
  assert.equal(pointer.atlasFamilyCandidateNominated, false);
  assert.equal(pointer.atlasPromotionAuthorized, false);
  assert.equal(pointer.appAdmissionAuthorized, false);
});

test("no Brain-side relevance mapping means zero Atlas family candidates nominated", () => {
  const pointers = [
    createIndependentRecipeSourceReviewPointer({ candidateLabel: "Example A", sourceDomain: "recipes.example", sourceUrl: "https://recipes.example/a" }),
    createIndependentRecipeSourceReviewPointer({ candidateLabel: "Example B", sourceDomain: "recipes.example", sourceUrl: "https://recipes.example/b" }),
    createIndependentRecipeSourceReviewPointer({ candidateLabel: "Example C", sourceDomain: "recipes.example", sourceUrl: "https://recipes.example/c" })
  ];
  const reconciled = reconcileAtlasCandidateAuthority({ sourceReviewPointers: pointers });
  assert.equal(reconciled.sourceReviewPointersObserved, 3);
  assert.equal(reconciled.atlasRelevanceMappingsVerified, 0);
  assert.equal(reconciled.atlasFamilyCandidatesNominated, 0);
  assert.equal(reconciled.atlasPromotions, 0);
  assert.equal(reconciled.knowledgeCoreStateChanged, false);
});

test("Atlas relevance requires an explicit Knowledge Core review mapping and still grants no automatic promotion", () => {
  const pointer = createIndependentRecipeSourceReviewPointer({
    candidateLabel: "Example family candidate",
    sourceDomain: "recipes.example",
    sourceUrl: "https://recipes.example/family"
  });
  const reconciled = reconcileAtlasCandidateAuthority({
    sourceReviewPointers: [pointer],
    atlasRelevanceMappings: [{
      sourceReviewPointerId: pointer.pointerId,
      reviewAuthority: "KNOWLEDGE_CORE_ATLAS_REVIEW",
      atlasCandidateId: "atlas-example-family",
      claimScope: "IDENTITY_RELEVANCE_ONLY",
      identityRelevanceVerified: true,
      automaticPromotionAuthorized: false
    }]
  });
  assert.equal(reconciled.atlasFamilyCandidatesNominated, 1);
  assert.equal(reconciled.atlasPromotions, 0);
  assert.equal(reconciled.automaticAtlasPromotionAuthorized, false);
});

test("mapping cannot silently self-authorize or bypass Brain-side relevance review", () => {
  const pointer = createIndependentRecipeSourceReviewPointer({
    candidateLabel: "Example family candidate",
    sourceDomain: "recipes.example",
    sourceUrl: "https://recipes.example/family"
  });
  assert.throws(() => reconcileAtlasCandidateAuthority({
    sourceReviewPointers: [pointer],
    atlasRelevanceMappings: [{
      sourceReviewPointerId: pointer.pointerId,
      reviewAuthority: "YOUTUBE_DISCOVERY",
      atlasCandidateId: "atlas-example-family",
      claimScope: "IDENTITY_RELEVANCE_ONLY",
      identityRelevanceVerified: true,
      automaticPromotionAuthorized: false
    }]
  }), /KNOWLEDGE_CORE_ATLAS_REVIEW/);
});

test("canonical YT-CUL-5 result remains useful-but-review-bound with the live metrics and zero verified Atlas nominations", () => {
  assert.equal(classifyCanonicalYtCul5Terminal({
    callsExecuted: 10,
    independentlyReviewedCandidates: 14,
    independentlyConfirmedRecipePages: 3,
    uniqueConfirmedSourceDomains: 1,
    atlasFamilyCandidatesNominated: 0
  }), "YT_CUL_5_USEFUL_BUT_REVIEW_BOUND");
});
