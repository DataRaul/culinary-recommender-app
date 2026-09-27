import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  C2_TERMINAL,
  buildC2Classification,
  classifyC2Overlay,
  validateC2Contract,
  validateC2Summary
} from "../scripts/culinary-brain-c2-candidate-classification-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c2_candidate_classification_v1.json","utf8"));

function overlay({key="recipe.md",dishState="UNKNOWN",dishValue=null,roleState="UNKNOWN",roleValue=[],category=null,tags=[]}={}) {
  return {
    identity:{layer:"L",cohortId:"C",sourceSystem:"TEST",sourceRecordKey:key},
    sourceHints:{category,tags},
    canonical:{culinary:{
      dishCategory:{state:dishState,value:dishValue},
      mealRoles:{state:roleState,value:roleValue}
    }}
  };
}

test("C2 contract is exact-v8018, candidate-only and authority-safe",()=>{
  assert.deepEqual(validateC2Contract(contract),[]);
  assert.equal(contract.expectedRecipeCount,19268);
  assert.equal(contract.policy.maximumConfidence,"MEDIUM");
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
});

test("known canonical references are never overridden",()=>{
  const row=classifyC2Overlay(overlay({
    key:"tomato-soup.md",
    dishState:"REVIEWED_MAPPING",
    dishValue:"SALAD",
    roleState:"REVIEWED_MAPPING",
    roleValue:["MAIN"]
  }),contract);
  assert.equal(row.dishCategory.disposition,"REFERENCE_PRESENT");
  assert.equal(row.dishCategory.candidateValue,null);
  assert.equal(row.dishCategory.referenceValue,"SALAD");
  assert.equal(row.mealRole.disposition,"REFERENCE_PRESENT");
  assert.equal(row.mealRole.candidateValue,null);
});

test("unknown explicit lexical signals become review-only candidates",()=>{
  const row=classifyC2Overlay(overlay({key:"classic-tomato-soup.md"}),contract);
  assert.equal(row.dishCategory.disposition,"REVIEW");
  assert.equal(row.dishCategory.candidateValue,"SOUP");
  assert.equal(row.dishCategory.confidence,"MEDIUM");
  assert.equal(row.hardAuthorityClaim,null);
});

test("conflicting lexical dish signals fail to review without selecting a value",()=>{
  const row=classifyC2Overlay(overlay({key:"salad-with-sauce.md"}),contract);
  assert.equal(row.dishCategory.disposition,"REVIEW");
  assert.equal(row.dishCategory.candidateValue,null);
  assert.equal(row.dishCategory.reasonCode,"CONFLICTING_FROZEN_LEXICAL_SIGNALS");
  assert.ok(row.dishCategory.matchedRuleIds.length>=2);
});

test("unmatched unknown cells abstain",()=>{
  const row=classifyC2Overlay(overlay({key:"mystery-preparation.md"}),contract);
  assert.equal(row.dishCategory.disposition,"ABSTAIN");
  assert.equal(row.mealRole.disposition,"ABSTAIN");
});

test("full builder fails closed unless exact 19,268 v8018 overlays are supplied",()=>{
  assert.throws(()=>buildC2Classification({
    mapping:{protectedCorpusVersion:"v8018",observedRecipeCount:1,overlays:[overlay()]},
    contract
  }),/C2_EXACT_FULL_V8018_MAPPING_REQUIRED/);
});

test("summary validator enforces zero-authority boundary",()=>{
  const summary={
    schemaVersion:"CULINARY_BRAIN_C2_CANDIDATE_CLASSIFICATION_SUMMARY_V1",
    pass:true,
    terminal:C2_TERMINAL,
    protectedCorpusVersion:"v8018",
    recipeCount:19268,
    uniqueRecipeKeyCount:19268,
    fullClassificationDigestSha256:"a".repeat(64),
    invariants:{
      knownReferenceOverrideAttempts:0,
      highConfidenceCells:0,
      hardAuthorityViolations:0,
      fullRowsCommittedToRuntime:false,
      fullRowsRetainedAsCiArtifact:true
    },
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesReadOrExported:0,
      publicRuntimeChanged:false,recommendationBehaviorChanged:false,recommendationAuthorityWidened:false,
      nutritionAuthorityChanged:false,dietaryAllergenAuthorityChanged:false,sourceRightsAuthorityChanged:false,
      knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
    }
  };
  assert.deepEqual(validateC2Summary(summary),[]);
  summary.invariants.highConfidenceCells=1;
  assert.ok(validateC2Summary(summary).includes("highConfidenceCells"));
});
