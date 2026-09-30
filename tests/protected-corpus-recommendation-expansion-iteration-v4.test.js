import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { buildIterationV4Summary, resolveIterationV4Identity, validateIterationV4Contract } from "../scripts/protected-corpus-recommendation-expansion-iteration-v4-core.mjs";
const read=path => JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const contract=read("config/protected_corpus_recommendation_expansion_iteration_v4.json");
const aliasContract=read("config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json");
const committed=read("data/generated/protected-corpus-recommendation-expansion-iteration-v4-summary-v1.json");

test("iteration V4 remains candidate-only and preserves runtime/cost firewalls", () => {
  assert.deepEqual(validateIterationV4Contract(contract),[]);
  assert.equal(contract.authority.runtimeActivationAuthorized,false);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized,false);
  assert.equal(contract.authority.automaticRecommendationAdmissionAuthorized,false);
  assert.equal(contract.authority.ownerAdmissionGateOpen,false);
  assert.equal(contract.authority.protectedD1WriteAuthorized,false);
  assert.equal(contract.authority.barbecueMutationAuthorized,false);
});
test("V4 bounded exact mappings preserve conservative identity semantics", () => {
  assert.equal(resolveIterationV4Identity({id:"greenchili",name:{en:"Green chillies"}},aliasContract,contract).canonicalIngredientId,"chilli");
  assert.equal(resolveIterationV4Identity({id:"rice",name:{en:"Red rice"}},aliasContract,contract).canonicalIngredientId,"rice");
  assert.equal(resolveIterationV4Identity({id:"piripiri",name:{en:"Piri-piri chillies"}},aliasContract,contract).canonicalIngredientId,"chilli");
  assert.equal(resolveIterationV4Identity({id:"mint",name:{en:"Dried mint"}},aliasContract,contract).canonicalIngredientId,"mint");
  assert.equal(resolveIterationV4Identity({id:"bread",name:{en:"Corn bread"}},aliasContract,contract).status,"UNRESOLVED");
  assert.equal(resolveIterationV4Identity({id:"salt",name:{en:"Salt and pepper"}},aliasContract,contract).status,"UNRESOLVED");
});
test("committed V4 evidence records no identity-ready or admission-ready candidate", () => {
  assert.deepEqual(committed.frontier.sourceSlugs,contract.frontier.expectedSourceSlugs);
  assert.deepEqual(committed.identityReview.identityReadySourceSlugs,[]);
  assert.equal(committed.identityReview.reviewedDecisionCount,24);
  assert.equal(committed.identityReview.mappedExistingDecisionCount,5);
  assert.equal(committed.machineAcceptance.executed,false);
  assert.equal(committed.machineAcceptance.admissionReadyCandidateCount,0);
  assert.equal(committed.machineAcceptance.ownerAdmissionGateOpen,false);
  assert.equal(committed.publicRuntimeRecipeCount,86);
  assert.equal(committed.nextGate,"R1_NEXT_FRONTIER_ITERATION_V5");
});
test("exact pinned V4 iteration remains reproducible when source checkout is present",{skip:!existsSync(".tmp/unitools/unitools-recipes-v1.json")},() => {
  const dataset=JSON.parse(readFileSync(".tmp/unitools/unitools-recipes-v1.json","utf8"));
  assert.deepEqual(buildIterationV4Summary({contract,aliasContract,dataset}),committed);
});
