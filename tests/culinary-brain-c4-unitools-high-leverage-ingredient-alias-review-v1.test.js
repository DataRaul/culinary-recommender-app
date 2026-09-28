import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveWithReviewedUnitoolsAlias, validateC4UnitoolsAliasReviewContract } from "../scripts/culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json","utf8"));

test("alias review decisions are explicit, bounded and do not mutate the global alias index",()=>{
  assert.deepEqual(validateC4UnitoolsAliasReviewContract(contract),[]);
  assert.equal(contract.decisions.filter(row=>row.decision==="MAP").length,6);
  assert.equal(contract.authority.globalIngredientAliasIndexMutationAuthorized,false);
  assert.equal(contract.authority.otherSourceCohortReuseAuthorized,false);
});

test("safe qualifier/plural mapping resolves through the protected overlay",()=>{
  const result=resolveWithReviewedUnitoolsAlias({id:"water",name:{en:"Warm water"}},contract);
  assert.equal(result.status,"RESOLVED");
  assert.equal(result.resolutionState,"REVIEWED_MAPPING");
  assert.equal(result.canonicalIngredientId,"water");
});

test("ambiguous and composite top candidates remain fail-closed",()=>{
  assert.equal(resolveWithReviewedUnitoolsAlias({id:"cheese",name:{en:"Soft white cheese"}},contract).status,"UNRESOLVED");
  assert.equal(resolveWithReviewedUnitoolsAlias({id:"salt",name:{en:"Salt and pepper"}},contract).status,"UNRESOLVED");
});
