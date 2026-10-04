import test from "node:test";
import assert from "node:assert/strict";
import {
  SECONDARY_LANE_EVAL_TERMINAL,
  evaluateSecondaryLaneEvidence,
  validateSecondaryLaneSummary
} from "../scripts/protected-corpus-limited-evidence-secondary-lane-evaluation-v1-core.mjs";

const digest="digest";
const cohort={size:500,digestSha256:digest};
const config={
  schemaVersion:"CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_EVALUATION_V1",
  entryTerminal:"V21_SHADOW_SPARSE_EVIDENCE_SCORER_POLICY_REVIEW_PASS__SEGREGATED_SECONDARY_LANE_EVALUATION_READY",
  protectedCorpusVersion:"v8018",
  qualityCohortSize:500,
  qualityCohortDigestSha256:digest,
  primaryRuntimeRecipeCount:86,
  expectedSecondaryLaneCandidateCount:271,
  expectedHeldCandidateCount:229,
  expectedMealTypeEligibleCounts:{breakfast:22,dinner:207,lunch:207,snack:42},
  expectedSparseEvidenceCoverage:0.436975,
  maximumPairwiseIngredientJaccard:0.85,
  minimumUniqueScoreCount:2,
  requiredMissingSoftSignals:["nutrition","protein","budget","mealPrep","novelty"],
  evaluationPolicy:{
    primaryLaneMayChange:false,
    secondaryCandidatesMayDisplacePrimaryRecipes:false,
    secondaryCandidatesRankOnlyAgainstSecondaryCandidates:true,
    limitedMetadataDisclosureRequired:true,
    unknownSoftSignalsRemainUnknown:true,
    normalModeEligibilityMustRemainZero:true,
    restrictedProfileEligibilityMustRemainZero:true,
    plannerMustBeCompleteDeterministicAndUnique:true,
    liveAuthority:false
  }
};
const base={protectedCorpusVersion:"v8018",qualityCohort:cohort};
const policyReview={...base,terminal:config.entryTerminal,primaryLane:{runtimeRecipeCount:86},secondaryLane:{candidateCount:271,heldCount:229}};
const mainRole={...base,uniqueMealTargetedShadowCandidateCount:271,totalMealTargetedHoldCount:229,mealTypeEligibleCounts:{breakfast:22,dinner:207,lunch:207,snack:42},normalModeEligibleCounts:{breakfast:0,dinner:0,lunch:0,snack:0},restrictedProfiles:{vegetarianEligible:0,eggAllergyEligible:0}};
const mealRows={breakfast:[22,15],dinner:[207,64],lunch:[207,64],snack:[42,28]};
const signalCoverage={...base,restrictedProfiles:{vegetarianEligibleCount:0,eggAllergyEligibleCount:0},mealTypes:Object.fromEntries(Object.entries(mealRows).map(([m,[n,u]])=>[m,{adaptedEligibleCount:n,adaptedDigestA:m,adaptedDigestB:m,adaptedTopKAverageAvailablePositiveWeightCoverage:0.436975,adaptedUniqueScoreCount:u}])),planners:Object.fromEntries(Object.keys(mealRows).map(m=>[m,{complete:true,deterministic:true,selectedRecipeCount:7,uniqueRecipeCount:7}]))};
const mealQuality={...base,planners:{breakfast:{maximumPairwiseIngredientJaccard:0.272727},dinner:{maximumPairwiseIngredientJaccard:0.2},lunch:{maximumPairwiseIngredientJaccard:0.2},snack:{maximumPairwiseIngredientJaccard:0.166667}}};
const enrichment={...base,signalAudit:{nutrition:{safeAdditionalEvidenceAvailable:false},protein:{safeAdditionalEvidenceAvailable:false},budget:{safeAdditionalEvidenceAvailable:false},mealPrep:{safeAdditionalEvidenceAvailable:false},novelty:{safeAdditionalEvidenceAvailable:false}}};

test("secondary lane passes with deterministic differentiated rankings and complete planners",()=>{
  const result=evaluateSecondaryLaneEvidence({policyReview,signalCoverage,mainRole,mealQuality,enrichment,config});
  assert.equal(result.pass,true);
  assert.equal(result.secondaryLaneCandidateCount,271);
  assert.equal(result.mealTypes.dinner.uniqueScoreCount,64);
  assert.deepEqual(result.missingSignals.sort(),["budget","mealPrep","novelty","nutrition","protein"]);
});

test("secondary lane fails if normal-mode eligibility leaks",()=>{
  const bad={...mainRole,normalModeEligibleCounts:{...mainRole.normalModeEligibleCounts,dinner:1}};
  assert.throws(()=>evaluateSecondaryLaneEvidence({policyReview,signalCoverage,mainRole:bad,mealQuality,enrichment,config}),/NORMAL_LEAK/);
});

test("secondary lane fails if ranking collapses to one score",()=>{
  const bad={...signalCoverage,mealTypes:{...signalCoverage.mealTypes,snack:{...signalCoverage.mealTypes.snack,adaptedUniqueScoreCount:1}}};
  assert.throws(()=>evaluateSecondaryLaneEvidence({policyReview,signalCoverage:bad,mainRole,mealQuality,enrichment,config}),/SCORE_COLLAPSE/);
});

test("summary validator preserves primary isolation and no live implementation authority",()=>{
  const result=evaluateSecondaryLaneEvidence({policyReview,signalCoverage,mainRole,mealQuality,enrichment,config});
  const summary={
    schemaVersion:"CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_EVALUATION_SUMMARY_V1",
    pass:true,
    terminal:SECONDARY_LANE_EVAL_TERMINAL,
    qualityCohort:cohort,
    primaryLane:{runtimeRecipeCount:86,minimumCoverageFloor:0.5,changed:false},
    secondaryLane:{candidateCount:271,heldCount:229,mayDisplacePrimaryValidatedRecipes:false,limitedMetadataDisclosureRequired:true,disclosedUnknownSoftSignals:result.missingSignals},
    mealTypes:result.mealTypes,
    disposition:{liveRecommendationAdmissionAuthorized:false,runtimeImplementationAuthorized:false},
    boundaries:{protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false}
  };
  assert.deepEqual(validateSecondaryLaneSummary(summary,config),[]);
});
