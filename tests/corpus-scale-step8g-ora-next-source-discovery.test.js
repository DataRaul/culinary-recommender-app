import test from "node:test";
import assert from "node:assert/strict";

import {
  ORA_NEXT_SOURCE_DISCOVERY_FOUND,
  discoverOraNextSources,
  oraSourceKey
} from "../scripts/corpus-scale-step8g-ora-next-source-discovery-core.mjs";

function row({ collection = "candidate-shelf", title, slug, sourceTitle = "Candidate Cook Book", author = "Historic Author", year = "1910", url = "https://archive.org/details/candidate", license = "public-domain", ingredient = "candidate spice" }) {
  return {
    title,
    slug,
    collection,
    source_title: sourceTitle,
    author,
    source_year: year,
    source_url: url,
    license,
    body: `## Ingredients\n\n- ${ingredient}\n- water\n\n## Directions\n\n1. Combine ${ingredient} with water.\n2. Cook until done.`
  };
}

const baseline = Array.from({ length: 80 }, (_, i) => ({
  title: `Baseline ${i}`,
  ingredients: [`baseline ingredient ${i}`]
}));

test("discovery identifies source-level marginal-value candidates but never clears rights", () => {
  const candidate = Array.from({ length: 60 }, (_, i) => row({ title: `Novel Dish ${i}`, slug: `novel-${i}`, ingredient: `novel ingredient ${i}` }));
  const result = discoverOraNextSources({
    collectionRows: candidate,
    baselineRecipes: baseline,
    activeProtectedVersion: "v8006",
    activeProtectedCount: 2906
  });
  assert.equal(result.pass, true);
  assert.equal(result.terminal, ORA_NEXT_SOURCE_DISCOVERY_FOUND);
  assert.equal(result.rightsReviewEligibleCount, 1);
  assert.equal(result.topRightsReviewCandidates[0].recipeCount, 60);
  assert.equal(result.topRightsReviewCandidates[0].parseableRecipeRatio, 1);
  assert.equal(result.topRightsReviewCandidates[0].uniqueTitleRatio, 1);
  assert.equal(result.topRightsReviewCandidates[0].novelTitleRatio, 1);
  assert.equal(result.topRightsReviewCandidates[0].rightsReviewStatus, "REQUIRED_SOURCE_SPECIFIC_DOCUMENTARY_REVIEW");
  assert.equal(result.topRightsReviewCandidates[0].measurementEarned, false);
  assert.equal(result.boundaries.sourceRightsClearedByDiscovery, false);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
});

test("already protected source, source-specific hold and held collection fail closed before candidate ranking", () => {
  const protectedRows = Array.from({ length: 60 }, (_, i) => row({ title: `Protected ${i}`, slug: `protected-${i}`, sourceTitle: "Already Protected" }));
  const heldSourceRows = Array.from({ length: 60 }, (_, i) => row({ collection: "magyar-konyha", title: `Held Source ${i}`, slug: `held-source-${i}`, sourceTitle: "Metadata Mismatch Book", author: "Incorrect Author", url: "https://archive.org/details/held-source" }));
  const heldRows = Array.from({ length: 60 }, (_, i) => row({ collection: "cocina-espanola", title: `Held ${i}`, slug: `held-${i}`, sourceTitle: "Held Book", url: "https://archive.org/details/held-book" }));
  const result = discoverOraNextSources({
    collectionRows: [...protectedRows, ...heldSourceRows, ...heldRows],
    baselineRecipes: baseline,
    excludedSourceKeys: new Set([oraSourceKey(protectedRows[0])]),
    heldSourceKeys: new Set([oraSourceKey(heldSourceRows[0])]),
    heldCollections: new Set(["cocina-espanola"]),
    activeProtectedVersion: "v8006",
    activeProtectedCount: 2906
  });
  assert.equal(result.rightsReviewEligibleCount, 0);
  assert.equal(result.excludedSources.some(source => source.reasons.includes("ALREADY_PROTECTED_SOURCE")), true);
  assert.equal(result.excludedSources.some(source => source.reasons.includes("SOURCE_RIGHTS_OR_PROVENANCE_HOLD")), true);
  assert.equal(result.excludedSources.some(source => source.reasons.includes("COLLECTION_RIGHTS_HOLD")), true);
});

test("raw size cannot rescue a structurally duplicate low-novelty source", () => {
  const rows = Array.from({ length: 120 }, (_, i) => row({
    title: i % 2 ? "Baseline 1" : "Baseline 2",
    slug: `duplicate-${i}`,
    sourceTitle: "Duplicate Book",
    url: "https://archive.org/details/duplicate-book"
  }));
  const result = discoverOraNextSources({ collectionRows: rows, baselineRecipes: baseline });
  assert.equal(result.rightsReviewEligibleCount, 0);
  assert.equal(result.allMeasuredCandidates.length, 1);
  assert.equal(result.allMeasuredCandidates[0].marginalValuePass, false);
  assert.equal(result.allMeasuredCandidates[0].discoveryEligibleForRightsReview, false);
});
