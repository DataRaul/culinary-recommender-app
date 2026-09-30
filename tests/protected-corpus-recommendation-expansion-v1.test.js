import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarizeProtectedCorpusRecommendationExpansion, validateProtectedCorpusRecommendationExpansion } from "../scripts/protected-corpus-recommendation-expansion-v1.mjs";

const read = path => JSON.parse(readFileSync(new URL("../"+path, import.meta.url), "utf8"));
const contract = read("config/protected_corpus_recommendation_expansion_v1.json");
const evidence = read("data/generated/protected-corpus-recommendation-expansion-r0-baseline-v1.json");
const p4 = read("data/generated/protected-corpus-p4-owner-live-product-acceptance-v1.json");

test("authorized successor preserves terminal P4 baseline through iteration V5 and reopens frontier work", () => {
  assert.deepEqual(validateProtectedCorpusRecommendationExpansion(contract,evidence,p4),[]);
  const summary = summarizeProtectedCorpusRecommendationExpansion(contract,evidence,p4);
  assert.equal(summary.pass,true);
  assert.equal(summary.terminal,"PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R0_PASS__FRONTIER_MEASUREMENT_READY");
  assert.equal(summary.publicRuntimeRecipeCount,86);
  assert.equal(summary.activatedProtectedOriginCount,1);
  assert.equal(summary.nextExecutionSequence[0],"R1_NEXT_FRONTIER_ITERATION_V6");
  assert.equal(contract.iterationV2.terminal,"PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V2_PASS__JASHA_MAROO_HELD__NEXT_FRONTIER_V3_READY");
  assert.equal(contract.iterationV2.admissionReadyCandidateCount,0);
  assert.equal(contract.iterationV2.ownerAdmissionGateOpen,false);
  assert.equal(contract.iterationV3.terminal,"PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V3_PASS__NO_IDENTITY_READY_CANDIDATE__NEXT_FRONTIER_V4_READY");
  assert.deepEqual(contract.iterationV3.identityReadySourceSlugs,[]);
  assert.equal(contract.iterationV3.admissionReadyCandidateCount,0);
  assert.equal(contract.iterationV3.ownerAdmissionGateOpen,false);
  assert.equal(contract.iterationV4.terminal,"PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V4_PASS__NO_IDENTITY_READY_CANDIDATE__NEXT_FRONTIER_V5_READY");
  assert.deepEqual(contract.iterationV4.identityReadySourceSlugs,[]);
  assert.equal(contract.iterationV4.admissionReadyCandidateCount,0);
  assert.equal(contract.iterationV4.ownerAdmissionGateOpen,false);
  assert.equal(contract.iterationV5.terminal,"PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V5_PASS__NO_IDENTITY_READY_CANDIDATE__NEXT_FRONTIER_V6_READY");
  assert.deepEqual(contract.iterationV5.identityReadySourceSlugs,[]);
  assert.equal(contract.iterationV5.admissionReadyCandidateCount,0);
  assert.equal(contract.iterationV5.ownerAdmissionGateOpen,false);
  assert.equal(contract.gates.find(g=>g.id==="R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR").state,"PASS");
  assert.equal(contract.gates.find(g=>g.id==="R3_RECOMMENDATION_AND_PLANNER_MACHINE_ACCEPTANCE").state,"PASS_WITH_HOLD__NO_R4_CANDIDATE");
  assert.equal(contract.gates.find(g=>g.id==="R4_OWNER_BOUNDED_ADMISSION").state,"BLOCKED__NO_ADMISSION_READY_CANDIDATE");
});

test("successor remains fail-closed on runtime widening and automatic admission", () => {
  for (const key of ["publicRuntimeWideningAuthorized","automaticRecommendationAdmissionAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","thirdShardAuthorized","paidInfrastructureAuthorized","knowledgeCoreWriteAuthorized","barbecueMutationAuthorized"]) {
    const mutated = structuredClone(contract);
    mutated.authority[key] = true;
    assert.ok(validateProtectedCorpusRecommendationExpansion(mutated,evidence,p4).some(error => error.includes(key)));
  }
  const widened = structuredClone(contract);
  widened.ownerAuthorization.runtimeActivationRequiresSeparateOwnerAuthorization = false;
  assert.ok(validateProtectedCorpusRecommendationExpansion(widened,evidence,p4).includes("admissionGate"));
});

test("a future activation cannot silently expand beyond one exact recipe per owner gate", () => {
  const mutated = structuredClone(contract);
  mutated.ownerAuthorization.maxRecipesPerOwnerActivationGate = 2;
  assert.ok(validateProtectedCorpusRecommendationExpansion(mutated,evidence,p4).includes("admissionGate"));
});
