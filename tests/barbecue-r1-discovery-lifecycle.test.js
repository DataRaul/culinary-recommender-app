import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  buildBarbecueQueryPortfolio,
  classifyBarbecueQueryAvailability,
  createInitialBarbecueState,
  loadBarbecueConfig,
  pendingCandidateCount,
  selectBarbecueDailyQueries,
  validateBarbecueConfig
} from "../scripts/barbecue-technique-corpus-control-plane.mjs";
import { deriveBarbecueWorkUnitState } from "../scripts/barbecue-technique-corpus-work-unit-lifecycle.mjs";

const config=validateBarbecueConfig(await loadBarbecueConfig());
const EXHAUSTED="BARBECUE_SEARCH_PORTFOLIO_EXHAUSTED_REVIEW_PENDING";

function completedOtherLeaves(state,keep) {
  for (const leaf of state.leaves) {
    if (leaf.leafId!==keep) leaf.status="COMPLETE";
  }
}

function exhausted44() {
  const state=createInitialBarbecueState(config);
  const counts={beef_brisket_competition:14,pork_ribs_competition:11,fish_parrilla:9,vegetables_parrilla:10};
  state.leaves[0].status="COMPLETE";
  for(const leaf of state.leaves.slice(1)){
    leaf.championshipSearchExhausted=true;
    leaf.status="REVIEW_PENDING";
    leaf.candidatePointers=Array.from({length:counts[leaf.leafId]},(_,i)=>({
      sourceRef:`youtube:synthetic-${leaf.leafId}-${i}`,
      creatorChannelRef:`synthetic-channel-${i}`,
      qualificationStatus:"PENDING_REVIEW",
      leafId:leaf.leafId,
      automaticQualificationAuthorized:false
    }));
  }
  state.usedQueryIds=buildBarbecueQueryPortfolio(config,state).map(row=>row.queryId);
  return state;
}

test("exhausted 44-occurrence portfolio is a review successor, not ongoing discovery or quota failure",()=>{
  const state=exhausted44();
  assert.equal(pendingCandidateCount(state),44);
  assert.equal(selectBarbecueDailyQueries(config,state).length,0);
  const outcome=classifyBarbecueQueryAvailability(config,state);
  assert.equal(outcome.status,EXHAUSTED);
  assert.equal(outcome.pendingReviewOccurrences,44);
  assert.equal(state.hardHold,null);
});

test("a championship review gate is not falsely classified as full search exhaustion",()=>{
  const state=createInitialBarbecueState(config);
  const target=state.leaves[1];
  completedOtherLeaves(state,target.leafId);
  state.usedQueryIds=buildBarbecueQueryPortfolio(config,state).map(row=>row.queryId);
  target.status="REVIEW_PENDING";
  target.candidatePointers=[{qualificationStatus:"PENDING_REVIEW",sourceRef:"youtube:synthetic",leafId:target.leafId}];
  assert.equal(selectBarbecueDailyQueries(config,state).length,0);
  assert.equal(classifyBarbecueQueryAvailability(config,state).status,"BARBECUE_DISCOVERY_WAITING_FOR_REVIEW_GATE");
  assert.equal(state.leaves[1].championshipSearchExhausted,false);
});

test("no source left to review has a different bounded owner-decision successor",()=>{
  const state=exhausted44();
  for (const leaf of state.leaves) leaf.candidatePointers=[];
  assert.equal(classifyBarbecueQueryAvailability(config,state).status,"BARBECUE_SEARCH_PORTFOLIO_EXHAUSTED_NO_REVIEW_CANDIDATES");
});

test("ordinary discovery and pilot/hold closures retain their established contracts",()=>{
  const initial=createInitialBarbecueState(config);
  assert.ok(selectBarbecueDailyQueries(config,initial).length>0);
  assert.equal(classifyBarbecueQueryAvailability(config,initial).status,"QUERIES_AVAILABLE");
  assert.equal(deriveBarbecueWorkUnitState(initial).closureStatus,"CLOSED_CONTINUE");
  initial.hardHold="BARBECUE_SEARCH_HOLD_RATE_LIMIT";
  assert.equal(deriveBarbecueWorkUnitState(initial).schedulerDisposition,"HOLD_FAIL_CLOSED");
  initial.hardHold=null;
  initial.pilotPass=true;
  assert.equal(deriveBarbecueWorkUnitState(initial).successorAction,"BARBECUE_PILOT_CLOSEOUT_AND_EXPANSION_DECISION");
  assert.equal(deriveBarbecueWorkUnitState(initial,{primaryOutcome:"failure"}).closureStatus,"PRIMARY_RUN_FAILED");
});

test("zero-query live execution needs no key, consumes zero quota, persists once and restarts idempotently",async()=>{
  const path=`data/generated/.barbecue-r1-${process.pid}-${randomUUID()}.json`;
  const fixture=exhausted44();
  try {
    await writeFile(path,JSON.stringify(fixture),"utf8");
    const env={...process.env,YT_BBQ_STATE_PATH:path,YT_BBQ_DRY_RUN:"false",
      CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT:"100",CULINARY_YOUTUBE_PROJECT_IDENTITY:"culinary-youtube-discovery"};
    delete env.CULINARY_YOUTUBE_API_KEY;
    const run=()=>JSON.parse(execFileSync(process.execPath,["scripts/run-barbecue-technique-corpus-discovery.mjs"],{
      cwd:process.cwd(),env,encoding:"utf8",timeout:10000
    }).trim());
    const first=run();
    assert.equal(first.result,EXHAUSTED);
    assert.equal(first.searchCallsExecuted,0);
    assert.equal(first.candidatePointersAdded,0);
    assert.equal(first.pendingCandidateBacklog,44);
    const saved=JSON.parse(await readFile(path,"utf8"));
    assert.equal(saved.programmeStatus,EXHAUSTED);
    assert.equal(saved.completedQuotaDays.at(-1).terminalState,EXHAUSTED);
    assert.equal(saved.completedQuotaDays.at(-1).providerFailure,null);
    assert.equal(saved.completedQuotaDays.at(-1).searchCalls,0);
    assert.equal(saved.hardHold,null);
    const count=saved.completedQuotaDays.length;
    const work=deriveBarbecueWorkUnitState(saved,{generatedAt:"2026-11-03T18:00:00.000Z"});
    assert.equal(work.primaryOutcome,"success");
    assert.equal(work.acquisitionOutcome,"NO_NEW_DISCOVERY_REVIEW_OR_DECISION_REQUIRED");
    assert.equal(work.closureStatus,EXHAUSTED);
    assert.equal(work.successorAction,"EVIDENCE_REVIEW_PENDING_BARBECUE_CANDIDATES");
    assert.equal(work.schedulerDisposition,"CONTINUE_BOUNDED_ZERO_CALL_WAKEUP");
    assert.equal(work.latestSearchCalls,0);
    const second=run();
    assert.equal(second.result,"BARBECUE_DAILY_ALREADY_COMPLETED");
    assert.equal(JSON.parse(await readFile(path,"utf8")).completedQuotaDays.length,count);
  } finally {
    await unlink(path).catch(()=>{});
  }
});

test("dry run of an exhausted portfolio is zero-call and does not mutate durable state",async()=>{
  const path=`data/generated/.barbecue-r1-dry-${process.pid}-${randomUUID()}.json`;
  const fixture=exhausted44();
  try {
    const before=JSON.stringify(fixture);
    await writeFile(path,before,"utf8");
    const env={...process.env,YT_BBQ_STATE_PATH:path,YT_BBQ_DRY_RUN:"true",
      CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT:"100",CULINARY_YOUTUBE_PROJECT_IDENTITY:"culinary-youtube-discovery"};
    delete env.CULINARY_YOUTUBE_API_KEY;
    const result=JSON.parse(execFileSync(process.execPath,["scripts/run-barbecue-technique-corpus-discovery.mjs"],{
      cwd:process.cwd(),env,encoding:"utf8",timeout:10000
    }).trim());
    assert.equal(result.result,EXHAUSTED);
    assert.equal(result.searchCallsExecuted,0);
    assert.equal(await readFile(path,"utf8"),before);
  } finally {
    await unlink(path).catch(()=>{});
  }
});
