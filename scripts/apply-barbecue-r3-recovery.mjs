// Offline replay of an explicitly authored review packet. No discovery or network access.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  applySourceQualification, rejectCandidatePointer, setLeafSynthesis,
  refreshBarbecueDiscoveryPhases, validateBarbecueState
} from "./barbecue-technique-corpus-control-plane.mjs";

export function applyRecovery(sourceBytes, config, packet) {
  if (createHash("sha256").update(sourceBytes).digest("hex") !== packet.source_state_sha256)
    throw new Error("HOLD_SOURCE_STATE_CHANGED");
  let state = JSON.parse(sourceBytes);
  validateBarbecueState(state, config);
  const pending = state.leaves.flatMap(l => l.candidatePointers
    .filter(p => p.qualificationStatus === "PENDING_REVIEW")
    .map(p => l.leafId + "|" + p.sourceRef)).sort();
  const reviewed = packet.decisions.map(d => d.leaf_id + "|" + d.source_ref).sort();
  if (JSON.stringify(pending) !== JSON.stringify(reviewed) || new Set(reviewed).size !== reviewed.length)
    throw new Error("HOLD_REVIEW_QUEUE_MISMATCH");
  for (const correction of packet.lineage_corrections) {
    const q = state.leaves.find(l => l.leafId === correction.leaf_id)?.qualifiedSources
      .find(q => q.sourceRef === correction.source_ref);
    if (!q || q.independenceKey !== correction.prior_independence_key ||
        correction.qualification_status_unchanged !== true || !correction.rationale ||
        correction.evidence_urls.length < 2) throw new Error("HOLD_LINEAGE_CORRECTION");
    q.independenceKey = correction.independence_key;
  }
  for (const d of packet.decisions) {
    if (!d.reviewer_session || d.automatic_qualification_authorized !== false ||
        !d.original_page_identity?.identity_match || !d.reviewer_rationale)
      throw new Error("HOLD_AUTHORED_REVIEW_REQUIRED");
    if (d.decision === "QUALIFIED") {
      if (d.unresolved_gates.length || !d.independence_key || d.evidence_urls.length < 2)
        throw new Error("HOLD_QUALIFICATION_EVIDENCE");
      state = applySourceQualification(state, config, d.leaf_id, d.source_ref, {
        independenceKey: d.independence_key,
        domainCompetenceEvidenceRef: d.evidence_urls[1],
        projectAuthoredRationale: d.creator_identity + ": " + d.expertise_claim_and_support + " " + d.technique_relevance,
        normalizedObservations: d.normalized_observations
      });
    } else if (d.decision === "REJECTED") {
      state = rejectCandidatePointer(state, config, d.leaf_id, d.source_ref, {
        projectAuthoredRationale: d.reviewer_rationale
      });
    } else if (d.decision !== "NEEDS_EVIDENCE" || !d.unresolved_gates.length) {
      throw new Error("HOLD_INVALID_DECISION");
    }
  }
  state = refreshBarbecueDiscoveryPhases(state, config);
  for (const s of packet.syntheses ?? []) {
    const leaf = state.leaves.find(l => l.leafId === s.leafId);
    const selected = new Set();
    for (const observation of s.sourceObservations) {
      const q = leaf.qualifiedSources.find(q => q.sourceRef === observation.sourceRef);
      if (!q || q.independenceKey !== observation.independenceKey ||
          !observation.normalizedObservations.sourceEvidenceRefs?.length)
        throw new Error("HOLD_SYNTHESIS_PROVENANCE");
      selected.add(q.independenceKey);
      q.normalizedObservations = observation.normalizedObservations;
    }
    if (selected.size < config.requiredQualifiedIndependentSourcesPerLeaf)
      throw new Error("HOLD_SYNTHESIS_INDEPENDENCE");
    state = setLeafSynthesis(state, config, s.leafId, s.synthesis);
  }
  return validateBarbecueState(state, config);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, configPath, packetPath, output] = process.argv.slice(2);
  if (!input || !configPath || !packetPath || !output) throw new Error("input config packet output required");
  const source = await readFile(input, "utf8");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const packet = JSON.parse(await readFile(packetPath, "utf8"));
  const next = applyRecovery(source, config, packet);
  await writeFile(output, JSON.stringify(next, null, 2) + "\n");
  console.log("AUTHORED_REVIEW_REPLAY_PASS");
}
