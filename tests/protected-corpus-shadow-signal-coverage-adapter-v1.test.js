import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  SIGNAL_COVERAGE_ADAPTER_SUMMARY_SCHEMA,
  SIGNAL_COVERAGE_ADAPTER_TERMINAL_HELD,
  applyShadowSignalCoverageAdapter,
  shadowRuntimeDifficulty,
  validateSignalCoverageAdapterSummary
} from "../scripts/protected-corpus-shadow-signal-coverage-adapter-v1-core.mjs";

const config=JSON.parse(readFileSync(new URL("../config/protected_corpus_shadow_signal_coverage_adapter_v1.json",import.meta.url),"utf8"));

test("difficulty adapter is explicit shadow-only and cannot populate unrelated signals",()=>{
  assert.equal(config.adapterPolicy.scope,"SHADOW_ONLY");
  assert.equal(config.adapterPolicy.mayPopulateOtherMissingSignals,false);
  assert.equal(config.authority.liveDifficultyTranslationAuthorized,false);
  assert.equal(config.authority.recommendationAdmissionAuthorized,false);
});

test("difficulty translation is deterministic and bounded to runtime 1-4",()=>{
  const p=config.adapterPolicy;
  assert.equal(shadowRuntimeDifficulty({state:"EXACT_SOURCE_NORMALIZATION",value:{scale:"NUMERIC_1_5",level:1}},p),1);
  assert.equal(shadowRuntimeDifficulty({state:"EXACT_SOURCE_NORMALIZATION",value:{scale:"NUMERIC_1_5",level:5}},p),4);
  assert.equal(shadowRuntimeDifficulty({state:"EXACT_SOURCE_NORMALIZATION",value:{scale:"LABEL_EASY_MEDIUM_HARD",label:"MEDIUM"}},p),2);
  assert.equal(shadowRuntimeDifficulty({state:"AMBIGUOUS",value:{scale:"NUMERIC_1_5",level:3}},p),undefined);
});

test("adapter rejects non-shadow recipes and changes only difficulty plus governance evidence",()=>{
  const live={governance:{recommendationState:"ELIGIBLE"},culinary:{difficulty:2},economics:{},convenience:{},nutrition:{},discovery:{}};
  assert.throws(()=>applyShadowSignalCoverageAdapter(live,{},config),/SHADOW_ONLY/);

  const shadow={governance:{recommendationState:"SHADOW_CANDIDATE_ONLY"},culinary:{difficulty:undefined,mealTypes:["lunch"]},economics:{},convenience:{},nutrition:{},discovery:{}};
  const overlay={canonical:{culinary:{difficulty:{state:"EXACT_SOURCE_NORMALIZATION",value:{scale:"NUMERIC_1_5",level:3}}}}};
  const adapted=applyShadowSignalCoverageAdapter(shadow,overlay,config);
  assert.equal(adapted.culinary.difficulty,3);
  assert.deepEqual(adapted.economics,{});
  assert.deepEqual(adapted.convenience,{});
  assert.equal(adapted.governance.shadowDifficultyPolicyLiveAuthority,false);
});

test("summary validator supports PASS with improved coverage but live quality still held",()=>{
  const mealTypes={},planners={};
  for(const mealType of config.mealTypes){
    mealTypes[mealType]={
      baselineEligibleCount:10,adaptedEligibleCount:10,normalModeEligibleCount:0,semanticRoleViolationCount:0,
      baselineTopKAverageAvailablePositiveWeightCoverage:0.361345,
      adaptedTopKAverageAvailablePositiveWeightCoverage:0.436975,
      coverageGain:0.07563,
      adaptedDigestA:"x",adaptedDigestB:"x"
    };
    planners[mealType]={complete:true,deterministic:true,uniqueRecipeCount:7};
  }
  const summary={
    schemaVersion:SIGNAL_COVERAGE_ADAPTER_SUMMARY_SCHEMA,pass:true,terminal:SIGNAL_COVERAGE_ADAPTER_TERMINAL_HELD,
    liveQualityEarned:false,qualityCohort:{size:500,digestSha256:config.qualityCohortDigestSha256},
    difficultyEvidence:{adaptedCount:500},mealTypes,planners,
    restrictedProfiles:{vegetarianEligibleCount:0,eggAllergyEligibleCount:0},
    disposition:{liveRecommendationAdmissionAuthorized:false,liveDifficultyTranslationAuthorized:false},
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,publicRuntimeChanged:false,
      recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,candidateClassificationPromoted:false,
      dietaryAllergenAuthorityPromoted:false,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
    }
  };
  assert.deepEqual(validateSignalCoverageAdapterSummary(summary,config),[]);
});
