import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { buildIterationV3Summary, resolveIterationV3Identity, validateIterationV3Contract } from "../scripts/protected-corpus-recommendation-expansion-iteration-v3-core.mjs";

const read=path => JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const contract=read("config/protected_corpus_recommendation_expansion_iteration_v3.json");
const aliasContract=read("config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json");
const committed=read("data/generated/protected-corpus-recommendation-expansion-iteration-v3-summary-v1.json");

test("iteration V3 remains candidate-only and preserves runtime/cost firewalls", () => {
  assert.deepEqual(validateIterationV3Contract(contract),[]);
  assert.equal(contract.authority.runtimeActivationAuthorized,false);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized,false);
  assert.equal(contract.authority.automaticRecommendationAdmissionAuthorized,false);
  assert.equal(contract.authority.ownerAdmissionGateOpen,false);
  assert.equal(contract.authority.protectedD1WriteAuthorized,false);
  assert.equal(contract.authority.barbecueMutationAuthorized,false);
});

test("V3 maps only cold water while ambiguous or missing identities fail closed", () => {
  assert.equal(resolveIterationV3Identity({id:"water",name:{en:"Cold water"}},aliasContract,contract).canonicalIngredientId,"water");
  assert.equal(resolveIterationV3Identity({id:"yogurt",name:{en:"Bulgarian yoghurt"}},aliasContract,contract).status,"UNRESOLVED");
  assert.equal(resolveIterationV3Identity({id:"salt",name:{en:"Salt and pepper"}},aliasContract,contract).status,"UNRESOLVED");
  assert.equal(resolveIterationV3Identity({id:"plantain",name:{en:"Green plantains"}},aliasContract,contract).status,"UNRESOLVED");
});

test("committed V3 evidence records no identity-ready or admission-ready candidate", () => {
  assert.deepEqual(committed.frontier.sourceSlugs,contract.frontier.expectedSourceSlugs);
  assert.deepEqual(committed.identityReview.identityReadySourceSlugs,[]);
  assert.equal(committed.identityReview.reviewedDecisionCount,17);
  assert.equal(committed.identityReview.mappedExistingDecisionCount,1);
  assert.equal(committed.machineAcceptance.executed,false);
  assert.equal(committed.machineAcceptance.admissionReadyCandidateCount,0);
  assert.equal(committed.machineAcceptance.ownerAdmissionGateOpen,false);
  assert.equal(committed.publicRuntimeRecipeCount,86);
  assert.equal(committed.nextGate,"R1_NEXT_FRONTIER_ITERATION_V4");
});

test("exact pinned V3 iteration remains reproducible when source checkout is present",{skip:!existsSync(".tmp/unitools/unitools-recipes-v1.json")},() => {
  const dataset=JSON.parse(readFileSync(".tmp/unitools/unitools-recipes-v1.json","utf8"));
  assert.deepEqual(buildIterationV3Summary({contract,aliasContract,dataset}),committed);
});
