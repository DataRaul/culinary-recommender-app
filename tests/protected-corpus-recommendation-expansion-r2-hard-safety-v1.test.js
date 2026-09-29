import test from "node:test";
import assert from "node:assert/strict";
import { existsSync,readFileSync } from "node:fs";
import { buildR2HardSafetyReview,validateR2HardSafetyContract } from "../scripts/protected-corpus-recommendation-expansion-r2-hard-safety-core.mjs";
const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const contract=read("config/protected_corpus_recommendation_expansion_r2_hard_safety_policy_v1.json");
const identity=read("data/generated/protected-corpus-recommendation-expansion-r2-identity-compact-v1.json");

test("chimichurri hard-safety proposal is explicit candidate-only and complete for current mapped profile tokens",()=>{
  assert.deepEqual(validateR2HardSafetyContract(contract,identity),[]);
  assert.equal(contract.ingredientPolicies.length,8);
  assert.equal(contract.authority.runtimeHardSafetyAuthorityPromotionAuthorized,false);
  assert.equal(contract.authority.recommendationAdmissionAuthorized,false);
});

test("exact pinned hard-safety review is reproducible when source checkout is present",{skip:!existsSync(".tmp/unitools/unitools-recipes-v1.json")},()=>{
  const dataset=JSON.parse(readFileSync(".tmp/unitools/unitools-recipes-v1.json","utf8"));
  const summary=buildR2HardSafetyReview({contract,identity,dataset});
  assert.equal(summary.pass,true);
  assert.deepEqual(summary.candidate.candidateDeclaredAllergens,[]);
  assert.deepEqual(summary.candidate.candidateDietaryTags,["unrestricted","vegetarian","vegan"]);
  assert.equal(summary.recommendationAdmissionChanged,false);
  assert.equal(summary.publicRuntimeChanged,false);
});
