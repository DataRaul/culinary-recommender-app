import test from "node:test";
import assert from "node:assert/strict";
import { loadBarbecueConfig, createInitialBarbecueState, createDurableCandidatePointer, addCandidatePointers, buildBarbecueQueryPortfolio } from "../scripts/barbecue-technique-corpus-control-plane.mjs";
import { auditBarbecueReviewQueue } from "../scripts/audit-barbecue-review-queue.mjs";

test("audit identifies evidence-required candidates without inventing qualification", async () => {
  const config = await loadBarbecueConfig();
  let state = createInitialBarbecueState(config);
  const query = buildBarbecueQueryPortfolio(config, state)[0];
  const pointer = createDurableCandidatePointer({id:{videoId:"audit-v1"},snippet:{channelId:"audit-channel"}},query,"2026-10-13");
  state = addCandidatePointers(state,config,[pointer]);
  const report = auditBarbecueReviewQueue(state,config);
  assert.equal(report.pending,1);
  assert.equal(report.reviewQueue[0].reviewStatus,"EVIDENCE_REQUIRED");
  assert.equal(report.reviewQueue[0].qualificationEvidenceRef,null);
  assert.equal(report.reviewQueue[0].independenceKey,null);
  assert.equal(report.gaps.find(x=>x.leafId===query.leafId).stillNeeded,5);
  assert.ok(report.freshQueryCount <= config.dailySearchBudget);
});
test("audit never recommends duplicate used queries", async () => {
  const config = await loadBarbecueConfig();
  const state = createInitialBarbecueState(config);
  state.usedQueryIds = buildBarbecueQueryPortfolio(config,state).map(x=>x.queryId);
  const report = auditBarbecueReviewQueue(state,config);
  assert.equal(report.freshQueryCount,0);
  assert.equal(report.recommendation,"QUERY_PORTFOLIO_EXHAUSTED");
});
