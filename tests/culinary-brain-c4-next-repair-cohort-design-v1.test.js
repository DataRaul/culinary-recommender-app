import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rankUnitoolsAliasLeverage, validateC4NextRepairDesignContract } from "../scripts/culinary-brain-c4-next-repair-cohort-design-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c4_next_repair_cohort_design_v1.json","utf8"));

test("next repair design remains measurement-only and fail-closed",()=>{
  assert.deepEqual(validateC4NextRepairDesignContract(contract),[]);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
});

test("alias leverage prioritizes recipes unlocked by a single unresolved name",()=>{
  const ranked=rankUnitoolsAliasLeverage({recipeRows:[
    {ingredientMappings:[{sourceId:"a",sourceName:"Alpha",status:"UNRESOLVED"},{sourceId:"ok",sourceName:"Known",status:"RESOLVED"}]},
    {ingredientMappings:[{sourceId:"a",sourceName:"Alpha",status:"UNRESOLVED"}]},
    {ingredientMappings:[{sourceId:"b",sourceName:"Beta",status:"UNRESOLVED"},{sourceId:"c",sourceName:"Gamma",status:"UNRESOLVED"}]},
    {ingredientMappings:[{sourceId:"z",sourceName:"Conflict",status:"CONFLICT"}]}
  ]});
  assert.equal(ranked[0].sourceId,"a");
  assert.equal(ranked[0].singleAliasRecipesPotentiallyUnlocked,2);
  assert.equal(ranked.some(row=>row.status==="CONFLICT"),false);
});
