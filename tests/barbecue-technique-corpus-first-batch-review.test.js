import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const review = JSON.parse(await readFile(
  new URL("../config/barbecue_technique_corpus_candidate_review_2026_09_25.json", import.meta.url),
  "utf8"
));
const state = JSON.parse(await readFile(
  new URL("../data/generated/barbecue-technique-corpus-state.json", import.meta.url),
  "utf8"
));

test("first barbecue candidate review is complete and zero-search", () => {
  assert.equal(review.reviewId, "BARBECUE_FIRST_CANDIDATE_BATCH_REVIEW_2026_09_25");
  assert.equal(review.decisions.length, 34);
  assert.equal(review.decisions.filter(row => row.decision === "QUALIFIED").length, 11);
  assert.equal(review.decisions.filter(row => row.decision === "REJECTED").length, 23);
  assert.equal(review.authority.youtubeSearchCalls, 0);
  assert.equal(review.authority.protectedD1Reads, 0);
  assert.equal(review.authority.protectedD1Writes, 0);
  assert.equal(review.authority.knowledgeCoreWrites, 0);
});

test("every first-batch candidate remains terminal in durable state", () => {
  const pointers = state.leaves.flatMap(leaf =>
    leaf.candidatePointers.map(pointer => ({ leafId: leaf.leafId, ...pointer }))
  );
  const byKey = new Map(pointers.map(row => [`${row.leafId}|${row.sourceRef}`, row]));

  for (const decision of review.decisions) {
    const pointer = byKey.get(`${decision.leafId}|${decision.sourceRef}`);
    assert.ok(pointer, `${decision.leafId} ${decision.sourceRef}`);
    assert.equal(pointer.qualificationStatus, decision.decision);
    assert.notEqual(pointer.qualificationStatus, "PENDING_REVIEW");
  }
});

test("first-batch qualification decisions remain immutable while later evidence may append", () => {
  const firstBatchQualified = review.decisions.filter(row => row.decision === "QUALIFIED");
  for (const decision of firstBatchQualified) {
    assert.deepEqual(decision.normalizedObservations, {});
    const leaf = state.leaves.find(row => row.leafId === decision.leafId);
    assert.ok(leaf, decision.leafId);
    const source = leaf.qualifiedSources.find(row => row.sourceRef === decision.sourceRef);
    assert.ok(source, `${decision.leafId} ${decision.sourceRef}`);
    assert.equal(source.independenceKey, decision.independenceKey);
    assert.equal(source.qualificationEvidenceRef, decision.evidenceRef);
    assert.match(source.qualificationEvidenceRef, /^https:\/\//);
    assert.ok(source.projectAuthoredRationale.length > 20);
  }

  for (const [leafId, reviewedCount] of Object.entries(review.expected.qualifiedByLeaf)) {
    const leaf = state.leaves.find(row => row.leafId === leafId);
    assert.ok(leaf, leafId);
    assert.ok(leaf.qualifiedSources.length >= reviewedCount, leafId);
    assert.equal(new Set(leaf.qualifiedSources.map(row => row.independenceKey)).size, leaf.qualifiedSources.length);
  }
});

test("first review snapshot itself did not invent technique observations or earn completion", () => {
  assert.equal(review.expected.completedLeaves, 0);
  assert.equal(review.expected.pilotPass, false);
  assert.equal(review.decisions.every(row => Object.keys(row.normalizedObservations ?? {}).length === 0), true);
});
