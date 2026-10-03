import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  RELEVANCE_SUMMARY_SCHEMA,
  RELEVANCE_TERMINAL,
  classifyMealRoleDisposition,
  obviousLexicalConflict,
  validateRelevanceSummary
} from "../scripts/protected-corpus-shadow-relevance-acceptance-v1-core.mjs";

const config=JSON.parse(readFileSync(new URL("../config/protected_corpus_shadow_relevance_acceptance_v1.json",import.meta.url),"utf8"));

const overlay=roles=>({
  identity:{cohortId:"unitools-world-recipes-v1_1_0",sourceRecordKey:"fixture"},
  canonical:{
    culinary:{
      mealRoles:{state:"REVIEWED_MAPPING",value:roles},
      dishCategory:{state:"UNKNOWN",value:null},
      difficulty:{state:"EXACT_SOURCE_NORMALIZATION",value:{scale:"LABEL_EASY_MEDIUM_HARD",label:"EASY"}}
    },
    time:{totalMinutes:{state:"REVIEWED_MAPPING",value:30}},
    serving:{servings:{state:"EXACT_SOURCE_NORMALIZATION",value:4}}
  }
});

test("only canonical roles that directly match current runtime semantics pass through",()=>{
  assert.deepEqual(classifyMealRoleDisposition(overlay(["BREAKFAST"])),{
    disposition:"DIRECT_RUNTIME_ROLE",canonicalRoles:["BREAKFAST"],runtimeMealTypes:["breakfast"]
  });
  assert.deepEqual(classifyMealRoleDisposition(overlay(["SNACK"])),{
    disposition:"DIRECT_RUNTIME_ROLE",canonicalRoles:["SNACK"],runtimeMealTypes:["snack"]
  });
  assert.deepEqual(classifyMealRoleDisposition(overlay(["MAIN"])),{
    disposition:"NON_RUNTIME_ROLE_POLICY_HOLD",canonicalRoles:["MAIN"],runtimeMealTypes:[]
  });
  assert.deepEqual(classifyMealRoleDisposition(overlay(["DESSERT"])),{
    disposition:"NON_RUNTIME_ROLE_POLICY_HOLD",canonicalRoles:["DESSERT"],runtimeMealTypes:[]
  });
});

test("unknown meal role remains held",()=>{
  const o=overlay([]);
  o.canonical.culinary.mealRoles={state:"UNKNOWN",value:null};
  assert.deepEqual(classifyMealRoleDisposition(o),{
    disposition:"UNKNOWN_ROLE_HOLD",canonicalRoles:[],runtimeMealTypes:[]
  });
});

test("obvious savory-pie lexical dessert signal is detected but not promoted",()=>{
  const o=overlay(["MAIN"]);
  const c2Row={dishCategory:{disposition:"REVIEW",candidateValue:"DESSERT"}};
  assert.equal(obviousLexicalConflict({overlay:o,c2Row,config}),true);
  assert.equal(obviousLexicalConflict({overlay:o,c2Row:{dishCategory:{disposition:"REVIEW",candidateValue:"PROTEIN_DISH"}},config}),false);
});

test("summary validator keeps all live authority closed",()=>{
  const summary={
    schemaVersion:RELEVANCE_SUMMARY_SCHEMA,
    pass:true,
    terminal:RELEVANCE_TERMINAL,
    qualityCohort:{size:500,digestSha256:config.qualityCohortDigestSha256},
    mealRoleAudit:{invalidRuntimeMealTypeLeakCount:0,directRuntimeRoleCount:64,mealTargetedShadowHeldCount:436},
    metadataAudit:{candidateOnlyDishCategoryAuthorityCount:0,runtimeDifficultyAuthorityCount:0},
    disposition:{progressiveLiveExposureAuthorized:false,runtimeMealRoleTranslationAuthorized:false},
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,
      publicRuntimeChanged:false,recommendationAdmissionChanged:false,recommendationAuthorityWidened:false,
      candidateClassificationPromoted:false,dietaryAllergenAuthorityPromoted:false,
      knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
    }
  };
  assert.deepEqual(validateRelevanceSummary(summary,config),[]);
});
