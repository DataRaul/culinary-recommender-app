import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { loadBarbecueConfig, validateBarbecueState, pendingCandidateCount } from "../scripts/barbecue-technique-corpus-control-plane.mjs";

const state = JSON.parse(await readFile("data/generated/barbecue-technique-corpus-state.json", "utf8"));
const review = JSON.parse(await readFile("config/barbecue_technique_corpus_candidate_review_2026_11_03.json", "utf8"));
const config = await loadBarbecueConfig();
const byLeaf = new Map(state.leaves.map(leaf => [leaf.leafId, leaf]));

test("BBQ-R3 persisted generated state stays within existing authorization", () => {
  validateBarbecueState(state, config);
  assert.equal(state.authority.paidQuotaAuthorized, false);
  assert.equal(state.authority.automaticPublicationAuthorized, false);
  assert.equal(state.authority.automaticAppAdmissionAuthorized, false);
  assert.equal(state.authority.automaticKnowledgeCorePromotionAuthorized, false);
  assert.equal(state.hardHold, null);
  assert.equal(review.authority.youtube_search_calls, 0);
  assert.equal(review.authority.youtube_metadata_calls, 0);
  assert.equal(review.authority.paid_spend, 0);
  assert.equal(review.authority.protected_d1_writes, 0);
  assert.equal(review.authority.public_app_widening, false);
  assert.equal(review.authority.knowledge_core_promotion, false);
});

test("all original 44 leaf occurrences have unique exact-source decisions", () => {
  assert.equal(review.decisions.length, 44);
  assert.equal(review.counts.reviewed, 44);
  assert.equal(review.counts.distinct_video_ids, 43);
  const keys = new Set();
  const ids = new Set();
  for (const decision of review.decisions) {
    const k = decision.leaf_id + "|" + decision.source_ref;
    assert.equal(keys.has(k), false, "duplicate leaf occurrence " + k);
    keys.add(k);
    ids.add(decision.source_ref);
    assert.match(decision.source_ref, /^youtube:[A-Za-z0-9_-]{11}$/);
    assert.equal(decision.exact_source_reference, "https://www.youtube.com/watch?v=" + decision.source_ref.slice(8));
    assert.ok(decision.checked_at);
    assert.ok(decision.reviewer_rationale);
    assert.ok(decision.expertise_claim_and_support);
    assert.ok(decision.technique_relevance);
    assert.equal(decision.automatic_qualification_authorized, false);
    const leaf = byLeaf.get(decision.leaf_id);
    assert.ok(leaf, "unknown leaf " + decision.leaf_id);
    const pointer = leaf.candidatePointers.find(p => p.sourceRef === decision.source_ref);
    assert.ok(pointer, "original pointer absent from generated state " + k);
    assert.equal(pointer.creatorChannelRef, decision.stored_channel_ref);
    const expectedStatus = decision.decision === "NEEDS_EVIDENCE" ? "PENDING_REVIEW" : decision.decision;
    assert.equal(pointer.qualificationStatus, expectedStatus);
    assert.ok(["QUALIFIED", "REJECTED", "NEEDS_EVIDENCE"].includes(decision.decision));
    if (decision.decision === "NEEDS_EVIDENCE") {
      assert.ok(decision.specific_unresolved_reason_if_applicable);
      assert.equal(pointer.automaticQualificationAuthorized, false);
    }
    if (decision.decision === "QUALIFIED") {
      assert.ok(decision.independence_key);
      assert.ok(decision.evidence_urls.length >= 2);
      assert.equal(leaf.qualifiedSources.filter(q => q.sourceRef === decision.source_ref).length, 1);
    }
    if (decision.decision === "REJECTED") assert.ok(pointer.projectAuthoredRejectionRationale);
  }
  assert.equal(ids.size, 43);
  assert.equal(keys.size, 44);
  assert.equal(review.decisions.filter(d => d.decision === "QUALIFIED").length, 1);
  assert.equal(review.decisions.filter(d => d.decision === "REJECTED").length, 3);
  assert.equal(review.decisions.filter(d => d.decision === "NEEDS_EVIDENCE").length, 40);
  assert.equal(pendingCandidateCount(state), 40);
});

test("cross-leaf duplicate remains separately reviewed and not counted twice", () => {
  const duplicate = review.decisions.filter(d => d.source_ref === "youtube:5zuQFx2J0jM");
  assert.deepEqual(duplicate.map(d => d.leaf_id).sort(), ["fish_parrilla", "vegetables_parrilla"]);
  assert.ok(duplicate.every(d => d.decision === "NEEDS_EVIDENCE"));
});

test("existing same-ribs-creator candidates cannot earn independent source keys", () => {
  const ribs = byLeaf.get("pork_ribs_competition");
  const alreadyQualifiedChannel = "UC--MxpGXJ3LVD8KvlNzRlcA";
  assert.equal(ribs.qualifiedSources.filter(q => q.creatorChannelRef === alreadyQualifiedChannel).length, 1);
  for (const video of ["tG2ro7UZOUE", "4fzy8UyO-KU"]) {
    const d = review.decisions.find(d => d.source_ref === "youtube:" + video && d.leaf_id === ribs.leafId);
    assert.equal(d.decision, "REJECTED");
    assert.equal(d.independence_key, "malcom-reed-killer-hogs");
  }
});

test("exact-video scope rejection and new Myron independence are supported", () => {
  const fish = review.decisions.find(d => d.source_ref === "youtube:AxFSYiLLnr0");
  assert.equal(fish.decision, "REJECTED");
  assert.equal(fish.leaf_id, "fish_parrilla");
  assert.ok(fish.evidence_urls.length >= 2);
  const myron = review.decisions.find(d => d.source_ref === "youtube:vEJrAdL8_cI");
  assert.equal(myron.decision, "QUALIFIED");
  assert.equal(myron.leaf_id, "pork_ribs_competition");
  assert.equal(myron.independence_key, "myron-mixon-jacks-old-south");
  const ribs = byLeaf.get("pork_ribs_competition");
  assert.ok(ribs.qualifiedSources.some(q => q.sourceRef === myron.source_ref && q.independenceKey === myron.independence_key));
  assert.equal(ribs.status, "SYNTHESIS_PENDING");
  assert.equal(ribs.synthesis, null);
});

test("coverage reports only unique independent qualified creators, never candidate volume", () => {
  const expected = new Map([
    ["poultry_chicken_competition", [6, 0, 0]],
    ["beef_brisket_competition", [2, 3, 14]],
    ["pork_ribs_competition", [5, 0, 8]],
    ["fish_parrilla", [1, 4, 8]],
    ["vegetables_parrilla", [2, 3, 10]]
  ]);
  for (const leaf of state.leaves) {
    const actual = [...new Set(leaf.qualifiedSources.map(q => q.independenceKey))];
    assert.equal(actual.length, leaf.qualifiedSources.length, "duplicate qualified independence key " + leaf.leafId);
    const report = review.coverage.find(c => c.leaf_id === leaf.leafId);
    assert.ok(report);
    assert.deepEqual([report.qualified_unique_independence_keys, report.remaining_to_five, report.unresolved_occurrences], expected.get(leaf.leafId));
    assert.equal(report.qualified_unique_independence_keys, actual.length);
    assert.equal(report.remaining_to_five, Math.max(0, 5 - actual.length));
  }
  assert.equal(state.pilotPass, false);
});
