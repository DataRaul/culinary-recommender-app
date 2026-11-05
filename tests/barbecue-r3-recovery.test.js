import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { applyRecovery } from "../scripts/apply-barbecue-r3-recovery.mjs";
import {
  createInitialBarbecueState, loadBarbecueConfig, qualifiedIndependentSourceCount,
  buildBarbecueQueryPortfolio, refreshBarbecueDiscoveryPhases, evaluateLeafCompletion
} from "../scripts/barbecue-technique-corpus-control-plane.mjs";

const config = await loadBarbecueConfig();
const recovery = JSON.parse(await readFile("config/barbecue_technique_corpus_candidate_recovery_2026_11_05.json", "utf8"));
const state = JSON.parse(await readFile("data/generated/barbecue-technique-corpus-state.json", "utf8"));

test("forty authored occurrence decisions bind original identity and leave missing proof unqualified", () => {
  assert.equal(recovery.decisions.length, 40);
  assert.equal(new Set(recovery.decisions.map(d => d.leaf_id + "|" + d.source_ref)).size, 40);
  assert.equal(new Set(recovery.decisions.map(d => d.source_ref)).size, 39);
  assert.deepEqual(recovery.counts, { QUALIFIED: 11, REJECTED: 4, NEEDS_EVIDENCE: 25 });
  for (const d of recovery.decisions) {
    assert.equal(d.original_page_identity.identity_match, true);
    assert.equal(d.original_page_identity.creator_channel_ref, d.stored_channel_ref);
    const leaf = state.leaves.find(l => l.leafId === d.leaf_id);
    const pointer = leaf.candidatePointers.find(p => p.sourceRef === d.source_ref);
    assert.equal(pointer.qualificationStatus, d.decision === "NEEDS_EVIDENCE" ? "PENDING_REVIEW" : d.decision);
    if (d.decision === "QUALIFIED") {
      assert.equal(d.unresolved_gates.length, 0);
      assert.ok(d.evidence_urls.length >= 2);
      assert.ok(leaf.qualifiedSources.some(q => q.sourceRef === d.source_ref && q.independenceKey === d.independence_key));
    } else if (d.decision === "NEEDS_EVIDENCE") assert.ok(d.unresolved_gates.length);
  }
});

test("different publishers of one demonstrated lineage cannot satisfy the five-source gate", () => {
  let fixture = createInitialBarbecueState(config);
  const ribs = fixture.leaves.find(l => l.leafId === "pork_ribs_competition");
  ribs.qualifiedSources = Array.from({ length: 5 }, (_, i) => ({ sourceRef: "source:" + i, independenceKey: "same-pitmaster" }));
  assert.equal(qualifiedIndependentSourceCount(ribs), 1);
  assert.ok(buildBarbecueQueryPortfolio(config, fixture).some(q => q.leafId === ribs.leafId));
  fixture = refreshBarbecueDiscoveryPhases(fixture, config);
  assert.notEqual(fixture.leaves.find(l => l.leafId === ribs.leafId).status, "SYNTHESIS_PENDING");
  const actual = state.leaves.find(l => l.leafId === ribs.leafId);
  assert.equal(actual.qualifiedSources.length, 7);
  assert.equal(qualifiedIndependentSourceCount(actual), 5);
  for (const id of ["2XNUH5I9_2o", "Hy5wnwuIZ2M", "xlQjCdpOJOE"])
    assert.equal(actual.qualifiedSources.find(q => q.sourceRef === "youtube:" + id).independenceKey, "heath-riles-bbq");
});

test("two syntheses use five distinct qualified lineages and separate official safety authority", () => {
  assert.equal(recovery.syntheses.length, 2);
  for (const packet of recovery.syntheses) {
    const leaf = state.leaves.find(l => l.leafId === packet.leafId);
    assert.equal(new Set(packet.sourceObservations.map(s => s.independenceKey)).size, 5);
    assert.equal(evaluateLeafCompletion(leaf, config), true);
    assert.equal(leaf.status, "COMPLETE");
    assert.equal(Object.keys(leaf.synthesis.adjustmentAxes).length, 12);
    assert.equal(leaf.synthesis.safetyConstraints.wholeMusclePorkAndBeefMinimumInternalF, 145);
    assert.equal(leaf.synthesis.safetyConstraints.minimumRestMinutes, 3);
    assert.ok(leaf.synthesis.safetyAuthorityRefs.every(url => /fsis\.usda\.gov|foodsafety\.gov/.test(url)));
    const selected = new Set(packet.sourceObservations.map(s => s.sourceRef));
    for (const axis of Object.values(leaf.synthesis.adjustmentAxes))
      assert.ok(axis.sourceRefs.every(ref => selected.has(ref)));
  }
  assert.equal(state.pilotPass, false);
});

test("replay rejects stale inputs and an unauthored or duplicate review queue", () => {
  const bytes = JSON.stringify(createInitialBarbecueState(config));
  assert.throws(() => applyRecovery(bytes, config, recovery), /HOLD_SOURCE_STATE_CHANGED/);
  const digest = createHash("sha256").update(bytes).digest("hex");
  assert.throws(() => applyRecovery(bytes, config, { ...recovery, source_state_sha256: digest }), /HOLD_REVIEW_QUEUE_MISMATCH/);
});
