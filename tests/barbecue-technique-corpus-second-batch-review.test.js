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

test("qualified source decisions remain immutable while later state may append sources or synthesis observations", () => {
  const reviewedQualified = review.decisions.filter(row => row.decision === "QUALIFIED");
  for (const decision of reviewedQualified) {
    assert.deepEqual(decision.normalizedObservations, {});
    const leaf = state.leaves.find(row => row.leafId === decision.leafId);
    const source = leaf?.qualifiedSources.find(row => row.sourceRef === decision.sourceRef);
    assert.ok(source, `${decision.leafId} ${decision.sourceRef}`);
    assert.match(source.qualificationEvidenceRef, /^https:\/\//);
    assert.ok(source.projectAuthoredRationale.length > 20);
  }

  for (const leaf of state.leaves) {
    assert.ok(leaf.qualifiedSources.length >= review.expected.qualifiedByLeafAfterReview[leaf.leafId]);
    assert.equal(new Set(leaf.qualifiedSources.map(row => row.independenceKey)).size, leaf.qualifiedSources.length);
    for (const source of leaf.qualifiedSources) {
      assert.match(source.qualificationEvidenceRef, /^https:\/\//);
      assert.ok(source.projectAuthoredRationale.length > 20);
    }
  }
});

test("completed leaves stay excluded while unfinished barbecue leaves may advance through review and synthesis states", () => {
  const poultry = state.leaves.find(leaf => leaf.leafId === "poultry_chicken_competition");
  assert.ok(poultry.qualifiedSources.length >= 6);
  assert.equal(poultry.status, "COMPLETE");
  assert.equal(poultry.synthesis?.projectAuthored, true);

  const plannedLeaves = new Set(buildBarbecueQueryPortfolio(config, state).map(row => row.leafId));
  for (const leaf of state.leaves) {
    if (leaf.status === "COMPLETE" || leaf.qualifiedSources.length >= config.requiredQualifiedIndependentSourcesPerLeaf) {
      assert.equal(plannedLeaves.has(leaf.leafId), false);
    } else {
      assert.ok(["DISCOVERY_PENDING","REVIEW_PENDING"].includes(leaf.status));
      assert.equal(plannedLeaves.has(leaf.leafId), true);
    }
  }

  if (state.pilotPass) {
    assert.equal(state.programmeStatus, "BARBECUE_TECHNIQUE_CORPUS_PILOT_PASS");
    assert.equal(state.leaves.every(leaf => leaf.status === "COMPLETE"), true);
  } else {
    assert.equal(state.programmeStatus, "ACTIVE_BOUNDED_DISCOVERY");
  }
});
