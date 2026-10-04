import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { OWNER_CANARY_RANKING_META_V1 } from "../src/server/protected-corpus-limited-evidence-secondary-lane-owner-canary-manifest-v1.mjs";

const acceptance=JSON.parse(readFileSync(new URL("../config/protected_corpus_limited_evidence_secondary_lane_owner_live_acceptance_v1.json",import.meta.url),"utf8"));
const evidence=JSON.parse(readFileSync(new URL("../data/generated/protected-corpus-limited-evidence-secondary-lane-owner-live-acceptance-v1.json",import.meta.url),"utf8"));

test("owner live acceptance evidence is exact and self-consistent",()=>{
  assert.deepEqual(evidence,acceptance);
  assert.equal(acceptance.terminal,"V21_LIMITED_EVIDENCE_SECONDARY_LANE_OWNER_LIVE_ACCEPTANCE_PASS");
  assert.equal(acceptance.protectedCorpusVersion,"v8018");
  assert.equal(acceptance.candidateUniverseCount,271);
  assert.equal(acceptance.primaryRuntimeRecipeCount,86);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length,86);
});

test("owner live canary ranking digests match the frozen canary manifest",()=>{
  for(const meal of ["breakfast","lunch","dinner","snack"]){
    assert.equal(acceptance.probes[meal].resultCount,3);
    assert.equal(acceptance.probes[meal].rankingDigestSha256,OWNER_CANARY_RANKING_META_V1.rankingDigests[meal]);
    assert.equal(acceptance.probes[meal].recipeIds.length,3);
  }
  assert.deepEqual(acceptance.probes.lunch,acceptance.probes.dinner);
});

test("live acceptance stayed inside runtime cost and mutation boundaries",()=>{
  assert.ok(acceptance.observedRuntime.maxObservedD1Subqueries<=8);
  assert.equal(acceptance.observedRuntime.protectedD1Writes,0);
  assert.equal(acceptance.observedRuntime.fullCorpusScans,0);
  assert.equal(acceptance.unchangedBoundaries.publicRuntimeChanged,false);
  assert.equal(acceptance.unchangedBoundaries.recommendationAdmissionChanged,false);
  assert.equal(acceptance.unchangedBoundaries.fullSecondaryLanePromoted,false);
});

test("closeout does not authorize the full 271 rollout or any primary/public widening",()=>{
  assert.equal(acceptance.authority.liveAcceptanceCloseoutRecorded,true);
  for(const key of [
    "fullOwner271RolloutAuthorized",
    "fullSecondaryLanePromotionAuthorized",
    "publicRuntimeWideningAuthorized",
    "primaryRecommendationAdmissionAuthorized",
    "publicRecommendationAdmissionAuthorized",
    "candidateManifestMutationAuthorized",
    "protectedD1WritesAuthorized",
    "knowledgeCoreWriteAuthorized",
    "paidModelOrApiAuthorized",
    "thirdShardAuthorized",
    "barbecueMutationAuthorized"
  ]) assert.equal(acceptance.authority[key],false,key);
  assert.equal(acceptance.nextGate,"V21_LIMITED_EVIDENCE_SECONDARY_LANE_FULL_OWNER_271_ROLLOUT_AUTHORIZATION_REVIEW_V1");
});
