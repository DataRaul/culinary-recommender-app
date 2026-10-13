import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadBarbecueConfig, validateBarbecueState, selectBarbecueDailyQueries, pendingCandidateCount } from "./barbecue-technique-corpus-control-plane.mjs";

export function auditBarbecueReviewQueue(state, config) {
  validateBarbecueState(state, config);
  const across = new Map();
  const reviewQueue = [];
  const gaps = [];
  for (const leaf of state.leaves) {
    for (const pointer of leaf.candidatePointers) {
      if (pointer.qualificationStatus !== "PENDING_REVIEW") continue;
      const sameChannelQualified = leaf.qualifiedSources.some(q => q.creatorChannelRef === pointer.creatorChannelRef);
      const elsewhere = across.get(pointer.sourceRef) ?? [];
      elsewhere.push(leaf.leafId);
      across.set(pointer.sourceRef, elsewhere);
      reviewQueue.push({
        leafId: leaf.leafId, sourceRef: pointer.sourceRef,
        canonicalReference: pointer.canonicalReference,
        creatorChannelRef: pointer.creatorChannelRef,
        reviewStatus: "EVIDENCE_REQUIRED",
        channelAlreadyQualifiedInLeaf: sameChannelQualified,
        qualificationEvidenceRef: null,
        independenceKey: null,
        projectAuthoredRationale: null
      });
    }
    gaps.push({
      leafId: leaf.leafId, status: leaf.status,
      qualified: leaf.qualifiedSources.length,
      required: config.requiredQualifiedIndependentSourcesPerLeaf,
      stillNeeded: Math.max(0, config.requiredQualifiedIndependentSourcesPerLeaf - leaf.qualifiedSources.length),
      pending: leaf.candidatePointers.filter(p => p.qualificationStatus === "PENDING_REVIEW").length,
      remainingRetentionSlots: Math.max(0, config.maxCandidatesPerLeaf - leaf.candidatePointers.length)
    });
  }
  for (const item of reviewQueue) item.crossLeafDuplicate = (across.get(item.sourceRef) ?? []).length > 1;
  const planned = selectBarbecueDailyQueries(config, state);
  return {
    schemaVersion: "bbq-review-audit-v1",
    quotaDate: state.lastCompletedQuotaDate,
    pending: pendingCandidateCount(state),
    backlogCap: config.candidateBacklogCap,
    usedQueryCount: state.usedQueryIds.length,
    freshQueryCount: planned.length,
    freshQueryIds: planned.map(q => q.queryId),
    gaps, reviewQueue,
    qualificationPolicy: "NO_AUTOMATIC_QUALIFICATION; independent credential/domain evidence and independence verification required",
    recommendation: reviewQueue.length ? "REVIEW_EVIDENCE_FIRST" : planned.length ? "BOUNDED_DISCOVERY_READY" : "QUERY_PORTFOLIO_EXHAUSTED"
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const config = await loadBarbecueConfig();
  const state = JSON.parse(await readFile("data/generated/barbecue-technique-corpus-state.json", "utf8"));
  const result = auditBarbecueReviewQueue(state, config);
  const output = process.argv[2];
  if (output) await writeFile(output, JSON.stringify(result, null, 2) + "\n");
  else console.log(JSON.stringify(result, null, 2));
}
