import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildC4HardAuthorityPolicyReview,
  validateC4HardAuthorityPolicyContract
} from "../scripts/culinary-brain-c4-hard-authority-policy-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c4_hard_authority_policy_review_v1.json","utf8"));

test("policy contract is explicit, complete, and grants no runtime authority",()=>{
  assert.deepEqual(validateC4HardAuthorityPolicyContract(contract),[]);
  assert.equal(contract.ingredientPolicies.length,49);
  assert.equal(contract.ingredientPolicies.filter(row=>row.policyState==="REVIEWED_CURRENT_PROFILE_COMPLETE").length,45);
  assert.deepEqual(contract.ingredientPolicies.filter(row=>row.policyState==="HOLD_FORMULATION_VARIANT").map(row=>row.ingredientId).sort(),["bread","curry_powder","noodles","pasta"]);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
});

test("policy fails closed when catalog positive allergen evidence drifts",()=>{
  const evidence={
    pass:true,
    terminal:contract.entryTerminal,
    protectedCorpusVersion:"v8018",
    repairCohortCount:112,
    repairCohortDigestSha256:contract.expectedRepairCohortDigestSha256,
    distinctCanonicalIngredientCount:49,
    canonicalIngredientCatalogDigestSha256:contract.expectedCatalogDigestSha256,
    distinctIngredientIds:contract.ingredientPolicies.map(row=>row.ingredientId).sort(),
    catalogRows:contract.ingredientPolicies.map(row=>({id:row.ingredientId,allergens:[...row.reviewedPresentAllergens]})),
    recipeRows:[]
  };
  evidence.catalogRows.find(row=>row.id==="eggs").allergens=[];
  assert.throws(()=>buildC4HardAuthorityPolicyReview({contract,evidence}),/C4_POLICY_POSITIVE_ALLERGEN_DRIFT__eggs/);
});

test("held formulation ingredient blocks recipe policy completeness",()=>{
  const held=contract.ingredientPolicies.find(row=>row.ingredientId==="bread");
  assert.equal(held.policyState,"HOLD_FORMULATION_VARIANT");
  assert.equal(held.vegetarian,null);
  assert.equal(held.vegan,null);
  assert.equal(held.supportedAllergenCoverage,"INCOMPLETE_FORMULATION_VARIANT");
});
