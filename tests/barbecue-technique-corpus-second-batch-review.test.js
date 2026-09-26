import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildBarbecueQueryPortfolio } from "../scripts/barbecue-technique-corpus-control-plane.mjs";

const review = JSON.parse(await readFile(new URL("../config/barbecue_technique_corpus_candidate_review_2026_09_26.json", import.meta.url), "utf8"));
const state = JSON.parse(await readFile(new URL("../data/generated/barbecue-technique-corpus-state.json", import.meta.url), "utf8"));
const config = JSON.parse(await readFile(new URL("../config/barbecue_technique_corpus_v1.json", import.meta.url), "utf8"));

test("second barbecue candidate review is complete and zero-search", () => {
  assert.equal(review.reviewId, "BARBECUE_SECOND_CANDIDATE_BATCH_REVIEW_2026_09_26");
  assert.equal(review.decisions.length, 17);
  assert.equal(review.decisions.filter(row => row.decision === "QUALIFIED").length, 4);
  assert.equal(review.decisions.filter(row => row.decision === "REJECTED").length, 13);
  assert.equal(review.authority.youtubeSearchCalls, 0);
  assert.equal(review.authority.protectedD1Reads, 0);
  assert.equal(review.authority.protectedD1Writes, 0);
  assert.equal(review.authority.knowledgeCoreWrites, 0);
});

test("all September 26 candidate pointers are terminal", () => {
  const pointers = state.leaves.flatMap(leaf => leaf.candidatePointers.filter(pointer => pointer.discoveredQuotaDate === "2026-09-26").map(pointer => ({ leafId: leaf.leafId, ...pointer })));
  assert.equal(pointers.length, 17);
  assert.equal(pointers.filter(row => row.qualificationStatus === "PENDING_REVIEW").length, 0);
  const byKey = new Map(pointers.map(row => [`${row.leafId}|${row.sourceRef}`, row]));
  for (const decision of review.decisions) {
    const pointer = byKey.get(`${decision.leafId}|${decision.sourceRef}`);
    assert.ok(pointer, `${decision.leafId} ${decision.sourceRef}`);
    assert.equal(pointer.qualificationStatus, decision.decision);
  }
});

test("qualified source decisions remain immutable while later synthesis may append observations", () => {
  const expected = review.expected.qualifiedByLeafAfterReview;
  const reviewedQualified = review.decisions.filter(row => row.decision === "QUALIFIED");
  for (const decision of reviewedQualified) {
    assert.deepEqual(decision.normalizedObservations, {});
  }

  for (const leaf of state.leaves) {
    assert.equal(leaf.qualifiedSources.length, expected[leaf.leafId]);
    assert.equal(new Set(leaf.qualifiedSources.map(row => row.independenceKey)).size, leaf.qualifiedSources.length);
    for (const source of leaf.qualifiedSources) {
      assert.match(source.qualificationEvidenceRef, /^https:\/\//);
      assert.ok(source.projectAuthoredRationale.length > 20);
      if (leaf.leafId === "poultry_chicken_competition") {
        assert.ok(Object.keys(source.normalizedObservations).length > 0);
      } else {
        assert.deepEqual(source.normalizedObservations, {});
      }
    }
  }
});

test("poultry is complete and excluded from discovery while other leaves continue", () => {
  const poultry = state.leaves.find(leaf => leaf.leafId === "poultry_chicken_competition");
  assert.equal(poultry.qualifiedSources.length, 6);
  assert.equal(poultry.status, "COMPLETE");
  assert.equal(poultry.synthesis?.projectAuthored, true);
  assert.equal(state.pilotPass, false);
  assert.equal(state.programmeStatus, "ACTIVE_BOUNDED_DISCOVERY");
  assert.equal(state.leaves.filter(leaf => leaf.leafId !== poultry.leafId).every(leaf => leaf.status === "DISCOVERY_PENDING"), true);
  const plannedLeaves = new Set(buildBarbecueQueryPortfolio(config, state).map(row => row.leafId));
  assert.equal(plannedLeaves.has(poultry.leafId), false);
  assert.equal(["beef_brisket_competition","pork_ribs_competition","fish_parrilla","vegetables_parrilla"].every(id => plannedLeaves.has(id)), true);
});
