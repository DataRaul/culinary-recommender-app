import test from "node:test";
import assert from "node:assert/strict";
import { existsSync,readFileSync } from "node:fs";
import { buildR2IdentityReview,compactR2IdentityEvidence,resolveWithR2IdentityDecision,validateR2IdentityContract } from "../scripts/protected-corpus-recommendation-expansion-r2-identity-core.mjs";
const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const contract=read("config/protected_corpus_recommendation_expansion_r2_identity_review_v1.json");
const r1=read("data/generated/protected-corpus-recommendation-expansion-r1-frontier-compact-v1.json");
const alias=read("config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json");\nconst committed=read("data/generated/protected-corpus-recommendation-expansion-r2-identity-compact-v1.json");

test("R2 identity review covers exactly the frozen R1 repair keys and remains candidate-only",()=>{
  assert.deepEqual(validateR2IdentityContract(contract,r1),[]);
  assert.equal(contract.identityDecisions.filter(row=>row.decision==="MAP_EXISTING").length,5);
  assert.equal(contract.identityDecisions.filter(row=>row.decision==="HOLD").length,10);
  assert.equal(contract.authority.recommendationAdmissionAuthorized,false);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized,false);
});

test("bounded exact mappings resolve form-only variants while ambiguous/composite names remain held",()=>{
  assert.equal(resolveWithR2IdentityDecision({id:"parsley",name:{en:"Flat-leaf parsley"}},alias,contract).canonicalIngredientId,"parsley");
  assert.equal(resolveWithR2IdentityDecision({id:"salt",name:{en:"Coarse salt"}},alias,contract).canonicalIngredientId,"salt");
  assert.equal(resolveWithR2IdentityDecision({id:"salt",name:{en:"Salt and pepper"}},alias,contract).status,"UNRESOLVED");
  assert.equal(resolveWithR2IdentityDecision({id:"flour",name:{en:"Flour"}},alias,contract).status,"UNRESOLVED");
});

test("exact pinned R2 identity result is reproducible when source checkout is present",{skip:!existsSync(".tmp/unitools/unitools-recipes-v1.json")},()=>{
  const dataset=JSON.parse(readFileSync(".tmp/unitools/unitools-recipes-v1.json","utf8"));
  const summary=buildR2IdentityReview({contract,r1,aliasContract:alias,dataset});
  assert.equal(summary.pass,true);
  assert.equal(summary.terminal,"PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_IDENTITY_REVIEW_PASS__HARD_SAFETY_POLICY_READY");
  assert.equal(summary.recommendationAdmissionChanged,false);
  assert.equal(summary.publicRuntimeChanged,false);
});
