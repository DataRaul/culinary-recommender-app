import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarizeProtectedCorpusRecommendationExpansion, validateProtectedCorpusRecommendationExpansion } from "../scripts/protected-corpus-recommendation-expansion-v1.mjs";

const read = path => JSON.parse(readFileSync(new URL("../"+path, import.meta.url), "utf8"));
const contract = read("config/protected_corpus_recommendation_expansion_v1.json");
const evidence = read("data/generated/protected-corpus-recommendation-expansion-r0-baseline-v1.json");
const p4 = read("data/generated/protected-corpus-p4-owner-live-product-acceptance-v1.json");

test("authorized successor starts from exact terminal P4 baseline and opens only R1 machine work", () => {
  assert.deepEqual(validateProtectedCorpusRecommendationExpansion(contract,evidence,p4),[]);
  const summary = summarizeProtectedCorpusRecommendationExpansion(contract,evidence,p4);
  assert.equal(summary.pass,true);
  assert.equal(summary.terminal,"PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R0_PASS__FRONTIER_MEASUREMENT_READY");
  assert.equal(summary.publicRuntimeRecipeCount,86);
  assert.equal(summary.activatedProtectedOriginCount,1);
  assert.equal(summary.nextExecutionSequence[0],"R1_POST_P3_FRONTIER_MEASUREMENT");
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
