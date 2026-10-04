import test from "node:test";
import assert from "node:assert/strict";
import {
  SPARSE_POLICY_TERMINAL,
  evaluateSparseEvidencePolicy,
  validateSparseEvidencePolicySummary
} from "../scripts/protected-corpus-shadow-sparse-evidence-scorer-policy-review-v1-core.mjs";

const digest="digest";
const config={
  schemaVersion:"CULINARY_PROTECTED_CORPUS_SHADOW_SPARSE_EVIDENCE_SCORER_POLICY_REVIEW_V1",
  entryTerminal:"V21_SHADOW_SCORER_EVIDENCE_ENRICHMENT_PASS__NO_ADDITIONAL_SAFE_SCORER_SIGNAL__SCORER_POLICY_REVIEW_NEXT",
  protectedCorpusVersion:"v8018",
  qualityCohortSize:500,
  qualityCohortDigestSha256:digest,
  currentPublicRuntimeRecipeCount:86,
  expectedSparseEvidenceCoverage:0.436975,
  primaryLaneMinimumCoverageFloor:0.5,
  expectedUniqueMealTargetedShadowCandidateCount:271,
  expectedMealTargetedHoldCount:229,
  expectedMealTypeEligibleCounts:{breakfast:22,dinner:207,lunch:207,snack:42},
  candidatePolicy:{
    primaryValidatedLaneRemainsUnchanged:true,
    primaryLaneCoverageFloorRemains:0.5,
    sparseCandidatesMayDisplacePrimaryValidatedRecipes:false,
    secondaryLaneMayRankSparseCandidatesAgainstEachOther:true,
    secondaryLaneRequiresExplicitLimitedMetadataDisclosure:true,
    unknownNutritionMayBeClaimed:false,
    unknownBudgetMayBeClaimed:false,
    unknownMealPrepMayBeClaimed:false,
    unknownNoveltyMayBeClaimed:false,
    missingSignalsMayBeDefaultFilled:false,
    initialRestrictedProfileEligibilityAuthorized:false,
    initialAllergenProfileEligibilityAuthorized:false,
    initialIngredientExclusionProfileEligibilityAuthorized:false,
    liveAuthority:false
  }
};
const cohort={size:500,digestSha256:digest};
const runtime=86;
const enrichment={terminal:config.entryTerminal,protectedCorpusVersion:"v8018",currentPublicRuntimeRecipeCount:runtime,qualityCohort:cohort,safeAdditionalSignalCount:0,postAuditAverageAvailablePositiveWeightCoverage:0.436975};
const signalCoverage={
  protectedCorpusVersion:"v8018",currentPublicRuntimeRecipeCount:runtime,qualityCohort:cohort,
  difficultyEvidence:{adaptedCount:500},
  restrictedProfiles:{vegetarianEligibleCount:0,eggAllergyEligibleCount:0},
  mealTypes:Object.fromEntries(["breakfast","dinner","lunch","snack"].map(m=>[m,{adaptedTopKAverageAvailablePositiveWeightCoverage:0.436975}])),
  planners:Object.fromEntries(["breakfast","dinner","lunch","snack"].map(m=>[m,{complete:true,deterministic:true}]))
};
const mainRole={
  protectedCorpusVersion:"v8018",currentPublicRuntimeRecipeCount:runtime,qualityCohort:cohort,
  uniqueMealTargetedShadowCandidateCount:271,totalMealTargetedHoldCount:229,
  mealTypeEligibleCounts:{breakfast:22,dinner:207,lunch:207,snack:42},
  normalModeEligibleCounts:{breakfast:0,dinner:0,lunch:0,snack:0},
  restrictedProfiles:{vegetarianEligible:0,eggAllergyEligible:0}
};
const mealQuality={protectedCorpusVersion:"v8018",currentPublicRuntimeRecipeCount:runtime,qualityCohort:cohort,readinessCriteria:{safetyAndModeIsolationPass:true,plannerQualityPass:true}};

test("policy review preserves primary floor and isolates sparse candidates in a secondary lane",()=>{
  const result=evaluateSparseEvidencePolicy({enrichment,signalCoverage,mainRole,mealQuality,config});
  assert.equal(result.pass,true);
  assert.equal(result.primaryRuntimeRecipeCount,86);
  assert.equal(result.secondaryLaneCandidateCount,271);
  assert.equal(result.heldCandidateCount,229);
  assert.equal(result.primaryCoverageFloor,0.5);
  assert.equal(result.sparseEvidenceCoverage,0.436975);
  assert.equal(result.secondaryLaneSegregationRequired,true);
});

test("policy fails closed if sparse candidates could displace validated primary recipes",()=>{
  const bad={...config,candidatePolicy:{...config.candidatePolicy,sparseCandidatesMayDisplacePrimaryValidatedRecipes:true}};
  assert.throws(()=>evaluateSparseEvidencePolicy({enrichment,signalCoverage,mainRole,mealQuality,config:bad}),/SPARSE_POLICY_CONTRACT_FAIL/);
});

test("policy fails closed on restricted-profile leakage",()=>{
  const badSignal={...signalCoverage,restrictedProfiles:{vegetarianEligibleCount:1,eggAllergyEligibleCount:0}};
  assert.throws(()=>evaluateSparseEvidencePolicy({enrichment,signalCoverage:badSignal,mainRole,mealQuality,config}),/SPARSE_POLICY_RESTRICTED_LEAK/);
});

test("summary validator requires no live implementation authority",()=>{
  const summary={
    schemaVersion:"CULINARY_PROTECTED_CORPUS_SHADOW_SPARSE_EVIDENCE_SCORER_POLICY_REVIEW_SUMMARY_V1",
    pass:true,
    terminal:SPARSE_POLICY_TERMINAL,
    qualityCohort:cohort,
    primaryLane:{runtimeRecipeCount:86,minimumCoverageFloor:0.5},
    secondaryLane:{candidateCount:271,heldCount:229,mayDisplacePrimaryValidatedRecipes:false,limitedMetadataDisclosureRequired:true},
    disposition:{liveRecommendationAdmissionAuthorized:false,secondaryLaneImplementationAuthorized:false},
    boundaries:{protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false}
  };
  assert.deepEqual(validateSparseEvidencePolicySummary(summary,config),[]);
});
