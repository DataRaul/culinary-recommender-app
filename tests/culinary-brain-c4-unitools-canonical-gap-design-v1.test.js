import test from "node:test";
import assert from "node:assert/strict";
import { inventoryUnitoolsCanonicalGaps, validateC4UnitoolsCanonicalGapContract } from "../scripts/culinary-brain-c4-unitools-canonical-gap-design-core.mjs";

const contract={
  schemaVersion:"CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_V1",
  protectedCorpusVersion:"v8018",
  entryTerminal:"CULINARY_BRAIN_C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_PASS",
  sourceCohortId:"unitools-world-recipes-v1_1_0",
  expectedSourceRecipeCount:501,
  expectedPostAliasBaseline:{resolvedIngredientOccurrences:2638,unresolvedIngredientOccurrences:2693,conflictingIngredientOccurrences:73,fullyMappedRecipeCount:1},
  ranking:{excludeRecipesWithIdentityConflicts:true},
  authority:{canonicalIngredientCreationAuthorized:false,additionalAliasMappingAuthorized:false,hardDietaryAllergenAuthorityPromoted:false,recommendationAdmissionAuthorized:false,publicRuntimeWideningAuthorized:false,protectedD1ReadAuthorized:false,protectedD1WriteAuthorized:false,protectedBodyRewriteAuthorized:false,knowledgeCoreWriteAuthorized:false,paidModelOrApiAuthorized:false,thirdShardAuthorized:false,barbecueMutationAuthorized:false},
  targetTerminal:"CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_PASS__REVIEW_READY",
  nextGate:"C4_UNITOOLS_CANONICAL_GAP_REVIEW_V1"
};

test("canonical gap design contract remains measurement-only",()=>{
  assert.deepEqual(validateC4UnitoolsCanonicalGapContract(contract),[]);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
});

test("gap inventory ranks recipes by distinct unresolved identity count",()=>{
  const alias={decisions:[]};
  const dataset={recipes:[
    {slug:"two",ingredients:[{id:"x",name:{en:"X"}},{id:"y",name:{en:"Y"}}]},
    {slug:"one",ingredients:[{id:"x",name:{en:"X"}}]}
  ]};
  const inv=inventoryUnitoolsCanonicalGaps(dataset,alias);
  assert.equal(inv.minDistinctGapCount,1);
  assert.equal(inv.minRows[0].sourceSlug,"one");
});
