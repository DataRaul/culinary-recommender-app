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

test("every reviewed candidate has a terminal decision in durable state", () => {
  const pointers = state.leaves.flatMap(leaf =>
    leaf.candidatePointers.map(pointer => ({ leafId: leaf.leafId, ...pointer }))
  );
  const byKey = new Map(pointers.map(row => [`${row.leafId}|${row.sourceRef}`, row]));

  for (const decision of review.decisions) {
    const pointer = byKey.get(`${decision.leafId}|${decision.sourceRef}`);
    assert.ok(pointer, `${decision.leafId} ${decision.sourceRef}`);
    assert.equal(pointer.qualificationStatus, decision.decision);
  }

  assert.equal(pointers.filter(row => row.qualificationStatus === "PENDING_REVIEW").length, 0);
});

test("qualified sources carry independent evidence and leaf-unique independence keys", () => {
  const expected = review.expected.qualifiedByLeaf;
  for (const leaf of state.leaves) {
    assert.equal(leaf.qualifiedSources.length, expected[leaf.leafId]);
    assert.equal(
      new Set(leaf.qualifiedSources.map(row => row.independenceKey)).size,
      leaf.qualifiedSources.length
    );
    for (const source of leaf.qualifiedSources) {
      assert.match(source.qualificationEvidenceRef, /^https:\/\//);
      assert.ok(source.projectAuthoredRationale.length > 20);
      assert.deepEqual(source.normalizedObservations, {});
    }
  }
});

test("review does not invent technique observations or earn pilot completion", () => {
  assert.equal(state.pilotPass, false);
  assert.equal(state.programmeStatus, "ACTIVE_BOUNDED_DISCOVERY");
  assert.equal(state.leaves.every(leaf => leaf.synthesis === null), true);
  assert.equal(state.leaves.every(leaf => leaf.status === "DISCOVERY_PENDING"), true);
  assert.equal(state.leaves.find(leaf => leaf.leafId === "poultry_chicken_competition").championshipSearchExhausted, true);
  assert.equal(state.leaves.filter(leaf => leaf.leafId !== "poultry_chicken_competition").every(leaf => leaf.championshipSearchExhausted === false), true);
});
