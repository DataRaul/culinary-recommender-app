import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  inspectRemainingHardMetadata,
  validateC4ReconciliationContract
} from "../scripts/culinary-brain-c4-hard-authority-recipe-reconciliation-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c4_hard_authority_recipe_reconciliation_v1.json","utf8"));

test("reconciliation contract preserves fail-closed authority boundaries",()=>{
  assert.deepEqual(validateC4ReconciliationContract(contract),[]);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
  assert.equal(contract.expectedPolicyCompleteCandidateCount,100);
});

test("authoritative meal role and time still do not silently authorize source difficulty",()=>{
  const row=inspectRemainingHardMetadata({
    overlay:{canonical:{culinary:{
      mealRoles:{state:"REVIEWED_MAPPING",value:["MAIN"]},
      difficulty:{state:"EXACT_SOURCE_NORMALIZATION",value:{scale:"NUMERIC_1_5",level:2}}
    },time:{totalMinutes:{state:"EXACT_SOURCE_NORMALIZATION",value:30}}}},
    structuralException:false,
    provenanceAvailable:true
  });
  assert.equal(row.mealRoleReady,true);
  assert.equal(row.totalMinutesReady,true);
  assert.equal(row.difficultySourceEvidencePresent,true);
  assert.equal(row.runtimeDifficultyReady,false);
  assert.equal(row.readyExceptDifficulty,true);
  assert.equal(row.runtimeHardMetadataReady,false);
  assert.deepEqual(row.blockers,["RUNTIME_DIFFICULTY_SCALE_ADAPTER_NOT_AUTHORIZED"]);
});

test("unknown meal role and time fail closed independently",()=>{
  const row=inspectRemainingHardMetadata({
    overlay:{canonical:{culinary:{
      mealRoles:{state:"UNKNOWN",value:[]},
      difficulty:{state:"UNKNOWN",value:null}
    },time:{totalMinutes:{state:"UNKNOWN",value:null}}}},
    structuralException:false,
    provenanceAvailable:true
  });
  assert.equal(row.runtimeHardMetadataReady,false);
  assert.deepEqual(row.blockers,[
    "MEAL_ROLE_AUTHORITY_MISSING",
    "DIFFICULTY_AUTHORITY_MISSING",
    "TOTAL_MINUTES_AUTHORITY_MISSING"
  ]);
});
