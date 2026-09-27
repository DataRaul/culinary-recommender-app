import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateC1NegativeCapability } from "../scripts/culinary-brain-c1-negative-capability-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c1_negative_capability_v1.json","utf8"));
const packet=JSON.parse(readFileSync("data/generated/culinary-brain-c1-unseen-400-input-v1.json","utf8"));
const predictions=JSON.parse(readFileSync("data/generated/culinary-brain-c1-unseen-400-predictions-v1.json","utf8"));
const coverage=JSON.parse(readFileSync("data/generated/culinary-brain-c1-reference-coverage-audit-v1.json","utf8"));
const closeout=JSON.parse(readFileSync("data/generated/culinary-brain-c1-combined-closeout-v1.json","utf8"));
const initialHold=JSON.parse(readFileSync("data/generated/culinary-brain-c1-evaluation-canary-hold-v1.json","utf8"));
const calibratedPass=JSON.parse(readFileSync("data/generated/culinary-brain-c1-evaluation-canary-pass-v1r1.json","utf8"));

test("unseen C1 remainder is exact 400 with zero authoritative semantic reference cells",()=>{
  assert.equal(packet.recipeCount,400);
  assert.equal(packet.rows.length,400);
  assert.equal(new Set(packet.rows.map(row=>row.recipeId)).size,400);
  assert.equal(coverage.authoritativeReferenceCells.unseenRemainder400.total,0);
  assert.equal(coverage.interpretation.doNotManufactureGoldLabels,true);
});

test("negative-capability policy abstains or reviews on all 800 unseen semantic cells",()=>{
  const result=evaluateC1NegativeCapability({contract,packet,predictions,coverage});
  assert.equal(result.pass,true);
  assert.equal(result.terminal,"CULINARY_BRAIN_C1_UNSEEN_400_NEGATIVE_CAPABILITY_PASS");
  assert.equal(result.recipeCount,400);
  assert.equal(result.evaluatedCells,800);
  assert.equal(result.proposedCells,0);
  assert.equal(result.abstainOrReviewCells,800);
  assert.equal(result.highConfidenceCells,0);
  assert.equal(result.hardAuthorityViolations,0);
  assert.equal(result.invalidVocabularyOutputs,0);
});

test("negative-capability gate fails closed on one unsupported proposal",()=>{
  const mutated=structuredClone(predictions);
  mutated.rows[0].dishCategory={decision:"PROPOSE",value:"SOUP",confidence:"MEDIUM",reasonCode:"TITLE_GUESS"};
  const result=evaluateC1NegativeCapability({contract,packet,predictions:mutated,coverage});
  assert.equal(result.pass,false);
  assert.equal(result.proposedCells,1);
});

test("negative-capability gate fails if an authoritative holdout label appears without reversioning",()=>{
  const mutated=structuredClone(coverage);
  mutated.authoritativeReferenceCells.unseenRemainder400.total=1;
  const result=evaluateC1NegativeCapability({contract,packet,predictions,coverage:mutated});
  assert.equal(result.pass,false);
  assert.ok(result.errors.includes("unseen reference cells must remain zero"));
});


test("combined C1 closeout preserves calibration history, reference limitation and C2 authority boundary",()=>{
  assert.equal(initialHold.score.pass,false);
  assert.equal(initialHold.score.precision,0.875);
  assert.equal(calibratedPass.score.pass,true);
  assert.equal(calibratedPass.score.precision,1);
  assert.equal(closeout.pass,true);
  assert.equal(closeout.terminal,"CULINARY_BRAIN_C1_PASS_WITH_REFERENCE_COVERAGE_LIMIT__C2_CANDIDATE_ONLY_READY");
  assert.equal(closeout.frozenRecipeCount,500);
  assert.equal(closeout.calibratedCanary.recipeCount,100);
  assert.equal(closeout.unseenRemainder.recipeCount,400);
  assert.equal(closeout.unseenRemainder.authoritativeSemanticReferenceCells,0);
  assert.equal(closeout.unseenRemainder.proposedCells,0);
  assert.equal(closeout.unseenRemainder.abstainOrReviewCells,800);
  assert.equal(closeout.interpretation.entireFrozen500Evaluated,true);
  assert.equal(closeout.interpretation.independentSemanticGeneralizationNotDemonstrated,true);
  assert.equal(closeout.interpretation.c2Scope,"CANDIDATE_ONLY__ABSTENTION_DEFAULT");
  for(const value of Object.values(closeout.authority)) assert.equal(value,false);
});
