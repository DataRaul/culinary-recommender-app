import test from "node:test";
import assert from "node:assert/strict";
import {
  SECONDARY_RUNTIME_CONTRACT_TERMINAL,
  buildSecondaryLaneEnvelope,
  normalizeSecondaryRequest,
  validateRuntimeContract,
  validateRuntimeContractSummary
} from "../scripts/protected-corpus-limited-evidence-secondary-lane-runtime-contract-v1-core.mjs";

const contract={
  schemaVersion:"CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_CONTRACT_V1",
  entryTerminal:"V21_LIMITED_EVIDENCE_SECONDARY_RECOMMENDATION_LANE_EVALUATION_PASS__RUNTIME_CONTRACT_NEXT",
  protectedCorpusVersion:"v8018",
  primaryRuntimeRecipeCount:86,
  secondaryLaneCandidateCount:271,
  heldCandidateCount:229,
  requestContract:{surface:"AUTHENTICATED_OWNER_ONLY",activationMode:"EXPLICIT_OPT_IN",modeValue:"limited_evidence_secondary",defaultEnabled:false,dietaryModeRequired:"unrestricted",allergensRequiredEmpty:true,excludedIngredientIdsRequiredEmpty:true,unavailableIngredientIdsRequiredEmpty:true,maximumSecondaryResults:20,automaticFallbackFromPrimary:false},
  responseContract:{primaryAndSecondarySeparated:true,secondaryMayDisplacePrimary:false,secondaryMayBeMergedIntoPrimaryRanking:false,requiredLaneLabel:"Limited-evidence suggestions",requiredDisclosure:"Disclosure",requiredUnknownSoftSignals:["nutrition","protein","budget","mealPrep","novelty"],unknownValuesMayBeDisplayedAsKnown:false,sourceProvenanceMustRemainVisible:true,recommendationValidationStateMustRemainVisible:true},
  candidateContract:{candidateUniverse:"EXACT_FROZEN_271_MEAL_TARGETABLE_COHORT",candidateManifestMustBeImmutableForV1:true,mainToLunchDinnerStatus:"PRODUCT_SLOT_HYPOTHESIS_NOT_SOURCE_FACT",dessertBeverageSideUnknownRemainHeld:true,restrictedProfileEligibility:false,allergenProfileEligibility:false,ingredientExclusionProfileEligibility:false},
  runtimeCostContract:{readOnly:true,protectedD1WritesAllowed:0,fullCorpusScansAllowed:0,maximumD1SubqueriesPerRequest:8,thirdShardAllowed:false,paidInfrastructureAllowed:false,topKHydrationOnly:true},
  rollbackContract:{singleFeatureFlagDisableRequired:true,disableMustRestoreCurrentPrimaryOnlyBehavior:true,primary86MustRemainByteForByteBehaviorallyIndependent:true,noDataMigrationRequiredToRollback:true},
  authority:{runtimeImplementationAuthorized:false,ownerCanaryActivationAuthorized:false,publicRuntimeWideningAuthorized:false,recommendationAdmissionAuthorized:false,candidateManifestWriteAuthorized:false,protectedD1ReadsAuthorizedForThisContractPackage:false,protectedD1WritesAuthorized:false,knowledgeCoreWriteAuthorized:false,paidModelOrApiAuthorized:false,thirdShardAuthorized:false,barbecueMutationAuthorized:false}
};
const evaluation={terminal:contract.entryTerminal,protectedCorpusVersion:"v8018",primaryLane:{runtimeRecipeCount:86},secondaryLane:{candidateCount:271,heldCount:229,disclosedUnknownSoftSignals:["budget","mealPrep","novelty","nutrition","protein"]}};

test("runtime contract validates against the passed secondary-lane evaluation",()=>{
  assert.deepEqual(validateRuntimeContract(contract,evaluation),[]);
});

test("secondary mode requires explicit opt-in and unrestricted profile",()=>{
  const profile={dietaryMode:"unrestricted",allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[]};
  assert.equal(normalizeSecondaryRequest({profile},contract).eligible,false);
  assert.equal(normalizeSecondaryRequest({mode:"limited_evidence_secondary",profile},contract).eligible,true);
  assert.equal(normalizeSecondaryRequest({mode:"limited_evidence_secondary",profile:{...profile,allergens:["egg"]}},contract).eligible,false);
});

test("secondary result count is capped at twenty",()=>{
  const profile={dietaryMode:"unrestricted",allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[]};
  const state=normalizeSecondaryRequest({mode:"limited_evidence_secondary",profile,limit:999},contract);
  assert.equal(state.limit,20);
});

test("response envelope keeps primary and secondary separate",()=>{
  const profile={dietaryMode:"unrestricted",allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[]};
  const state=normalizeSecondaryRequest({mode:"limited_evidence_secondary",profile,limit:2},contract);
  const envelope=buildSecondaryLaneEnvelope({primary:[{id:"p"}],secondary:[{id:"s1"},{id:"s2"}],requestState:state,contract});
  assert.deepEqual(envelope.primary,[{id:"p"}]);
  assert.equal(envelope.secondaryLane.results.length,2);
  assert.equal(envelope.secondaryLane.mayDisplacePrimary,false);
});

test("summary validator requires zero implementation authority",()=>{
  const summary={
    schemaVersion:"CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_CONTRACT_SUMMARY_V1",
    pass:true,
    terminal:SECONDARY_RUNTIME_CONTRACT_TERMINAL,
    primaryRuntimeRecipeCount:86,
    secondaryLaneCandidateCount:271,
    heldCandidateCount:229,
    contractChecks:{ownerOnlyExplicitOptIn:true,rankingSeparation:true,restrictedProfilesFailClosed:true,boundedReadOnlyCost:true,singleFlagRollback:true},
    disposition:{runtimeImplementationAuthorized:false,ownerCanaryActivationAuthorized:false},
    boundaries:{protectedD1Reads:0,protectedD1Writes:0,fullCorpusScans:0,publicRuntimeChanged:false}
  };
  assert.deepEqual(validateRuntimeContractSummary(summary,contract),[]);
});
