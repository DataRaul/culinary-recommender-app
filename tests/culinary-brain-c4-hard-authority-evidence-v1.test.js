import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  buildC4HardAuthorityEvidence,
  validateC4HardAuthorityEvidenceContract,
  validateC4HardAuthorityEvidenceSummary
} from "../scripts/culinary-brain-c4-hard-authority-evidence-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c4_hard_authority_evidence_audit_v1.json","utf8"));
const sha256=value=>createHash("sha256").update(String(value)).digest("hex");

function fixture(){
  const diagnostics=[];
  const readyKeys=[];
  for(let i=0;i<19268;i++){
    const cohortId=i<10000?"A":"B";
    const sourceRecordKey="r"+String(i).padStart(5,"0");
    const ready=i<112;
    if(ready) readyKeys.push(cohortId+"::"+sourceRecordKey);
    diagnostics.push({
      cohortId,sourceSystem:"TEST",sourceRecordKey,
      ingredientOccurrenceCount:ready?1:1,
      allIngredientIdentitiesResolved:ready,
      identityRows:ready?[{raw:"egg",candidate:"egg",canonicalIngredientId:"eggs",state:"EXACT_ALIAS_MATCH"}]:[{raw:"x",candidate:"x",canonicalIngredientId:null,state:"UNRESOLVED"}]
    });
  }
  const digest=sha256(JSON.stringify(readyKeys));
  const localContract=structuredClone(contract);
  localContract.expectedRepairCohortDigestSha256=digest;
  return {
    contract:localContract,
    nutritionFull:{protectedCorpusVersion:"v8018",observedRecipeCount:19268,protectedCorpusRecipeDiagnostics:diagnostics},
    c4MatrixSummary:{pass:true,terminal:localContract.entryTerminal,repairCohort:{recipeCount:112,digestSha256:digest}}
  };
}

test("hard-authority evidence contract grants no authority",()=>{
  assert.deepEqual(validateC4HardAuthorityEvidenceContract(contract),[]);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
});

test("evidence audit preserves positive-only allergen semantics and earns no authority",()=>{
  const {summary,full}=buildC4HardAuthorityEvidence(fixture());
  assert.deepEqual(validateC4HardAuthorityEvidenceSummary(summary),[]);
  assert.equal(summary.repairCohortCount,112);
  assert.equal(summary.hardAuthorityEarnedCount,0);
  assert.equal(summary.recipesWithPositiveCatalogAllergenSignalCount,112);
  assert.deepEqual(summary.positiveAllergenSignalRecipeCounts,{egg:112});
  assert.equal(full.recipeRows[0].positiveCatalogAllergenSignals[0],"egg");
  assert.equal(summary.safetyInterpretation.emptyCatalogAllergenSignalProvesAllergenFree,false);
});

test("evidence audit fails closed on a nonexact identity",()=>{
  const fx=fixture();
  fx.nutritionFull.protectedCorpusRecipeDiagnostics[0].identityRows[0].state="UNRESOLVED";
  assert.throws(()=>buildC4HardAuthorityEvidence(fx),/C4_HARD_AUTHORITY_NONEXACT_IDENTITY/);
});
