import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildC4P3DuplicateSafeAdmission, validateC4P3DuplicateSafeContract, validateC4P3DuplicateSafeSummary } from "../scripts/culinary-brain-c4-bounded-p3-duplicate-safe-admission-core.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const contract=read("config/culinary_brain_c4_bounded_p3_duplicate_safe_admission_contract_v1.json");
const reuseReview=read("data/generated/culinary-brain-c4-unitools-difficulty-adapter-reuse-review-summary-v1.json");
const step8f=read("data/generated/step8f/public-runtime-activation-pass.json");

test("P3 duplicate-safe contract forbids widening",()=>{
  assert.deepEqual(validateC4P3DuplicateSafeContract(contract),[]);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
});

test("already-public protected identity aligns without creating a second runtime recipe",()=>{
  const summary=buildC4P3DuplicateSafeAdmission({contract,reuseReview,step8f});
  assert.deepEqual(validateC4P3DuplicateSafeSummary(summary),[]);
  assert.equal(summary.canonicalAlignment.netNewPublicRecipeCount,0);
  assert.equal(summary.canonicalAlignment.publicRuntimeRecipeCountAfter,85);
  assert.equal(summary.p3.newlyAdmittedRuntimeRecipeCount,0);
  assert.equal(summary.p3.remainingPolicyCompleteBlockedCount,99);
});

test("runtime baseline drift fails closed",()=>{
  const changed=structuredClone(step8f);
  changed.publicRuntime.recipeCountAfter=86;
  assert.throws(()=>buildC4P3DuplicateSafeAdmission({contract,reuseReview,step8f:changed}),/STEP8F_BASELINE_REQUIRED/);
});
