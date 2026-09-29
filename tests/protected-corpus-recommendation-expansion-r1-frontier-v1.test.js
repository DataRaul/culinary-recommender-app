import test from "node:test";
import assert from "node:assert/strict";
import { existsSync,readFileSync } from "node:fs";
import { buildR1FrontierMeasurement,rankFrontierRows,validateR1MeasurementContract } from "../scripts/protected-corpus-recommendation-expansion-r1-frontier-core.mjs";

const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const contract=read("config/protected_corpus_recommendation_expansion_v1.json");
const aliasContract=read("config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json");

test("R1 measurement is authorized candidate-only and preserves runtime firewalls",()=>{
  assert.deepEqual(validateR1MeasurementContract(contract),[]);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized,false);
  assert.equal(contract.authority.automaticRecommendationAdmissionAuthorized,false);
  assert.equal(contract.r1FrontierMeasurement.candidateTrancheMaxRecipes,10);
});

test("frontier ranking prefers fewer unresolved identities and excludes activated/public duplicates",()=>{
  const rows=[
    {sourceSlug:"pao-de-queijo",requiredHardMetadataReady:true,conflictIngredientOccurrenceCount:0,uniqueUnresolvedIngredientKeyCount:0,unresolvedIngredientOccurrenceCount:0},
    {sourceSlug:"tortilla-espanola",requiredHardMetadataReady:true,conflictIngredientOccurrenceCount:0,uniqueUnresolvedIngredientKeyCount:0,unresolvedIngredientOccurrenceCount:0},
    {sourceSlug:"two-gap",requiredHardMetadataReady:true,conflictIngredientOccurrenceCount:0,uniqueUnresolvedIngredientKeyCount:2,unresolvedIngredientOccurrenceCount:2},
    {sourceSlug:"one-gap-b",requiredHardMetadataReady:true,conflictIngredientOccurrenceCount:0,uniqueUnresolvedIngredientKeyCount:1,unresolvedIngredientOccurrenceCount:1},
    {sourceSlug:"one-gap-a",requiredHardMetadataReady:true,conflictIngredientOccurrenceCount:0,uniqueUnresolvedIngredientKeyCount:1,unresolvedIngredientOccurrenceCount:1},
    {sourceSlug:"conflict",requiredHardMetadataReady:true,conflictIngredientOccurrenceCount:1,uniqueUnresolvedIngredientKeyCount:0,unresolvedIngredientOccurrenceCount:0}
  ];
  assert.deepEqual(rankFrontierRows(rows,contract).map(row=>row.sourceSlug),["one-gap-a","one-gap-b","two-gap"]);
});

test("exact pinned UniTools R1 measurement remains reproducible when source checkout is present",{skip:!existsSync(".tmp/unitools/unitools-recipes-v1.json")},()=>{
  const dataset=JSON.parse(readFileSync(".tmp/unitools/unitools-recipes-v1.json","utf8"));
  const summary=buildR1FrontierMeasurement({contract,aliasContract,dataset});
  assert.equal(summary.pass,true);
  assert.equal(summary.terminal,"PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R1_FRONTIER_PASS__R2_REPAIR_TRANCHE_READY");
  assert.equal(summary.sourceCohort.recipeCount,501);
  assert.equal(summary.frozenCandidateTranche.recipeCount,10);
  assert.equal(summary.runtimeAdmissionChanged,false);
  assert.equal(summary.publicRuntimeChanged,false);
});
