import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { BRAIN_PUBLIC_POLICY_V1 } from "../src/data/brain-public-policy-v1.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { normalizeProfile } from "../src/domain/profile.js";
import {
  C3_TERMINAL,
  runC3Calibration,
  validateC3Contract,
  validateC3Summary
} from "../scripts/culinary-brain-c3-prior-calibration-core.mjs";

const contract=JSON.parse(readFileSync("config/culinary_brain_c3_deterministic_prior_calibration_v1.json","utf8"));
const c2Summary=JSON.parse(readFileSync("data/generated/culinary-brain-c2-candidate-classification-summary-v1.json","utf8"));
const recommendationSource=readFileSync("src/domain/recommendation.js","utf8");

test("C3 contract is fail-closed and authorizes no runtime promotion",()=>{
  assert.deepEqual(validateC3Contract(contract),[]);
  assert.equal(contract.goldenPublicRuntimeRecipeCount,85);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
  assert.equal(contract.fieldCalibration.dishCategory.decision,"HOLD_NO_PRIOR_PROMOTION");
  assert.equal(contract.fieldCalibration.mealRole.decision,"HOLD_NO_PRIOR_PROMOTION");
});

test("C3 calibration is deterministic over exact current 85 and preserves hard boundaries",()=>{
  const a=runC3Calibration({
    recipes:PUBLIC_RUNTIME_RECIPES,contract,c2Summary,brainPolicy:BRAIN_PUBLIC_POLICY_V1,
    rankRecipes,normalizeProfile,recommendationSource
  });
  const b=runC3Calibration({
    recipes:PUBLIC_RUNTIME_RECIPES,contract,c2Summary,brainPolicy:BRAIN_PUBLIC_POLICY_V1,
    rankRecipes,normalizeProfile,recommendationSource
  });
  assert.deepEqual(a,b);
  assert.deepEqual(validateC3Summary(a),[]);
  assert.equal(a.terminal,C3_TERMINAL);
  assert.equal(a.calibration.profileCaseCount,12);
  assert.equal(a.calibration.deterministicMismatchCount,0);
  assert.equal(a.calibration.hardConstraintViolations,0);
  assert.equal(a.calibration.promotedPriorCount,0);
  assert.equal(a.calibration.scorerDisposition,"CURRENT_DETERMINISTIC_SCORER_RETAINED_UNCHANGED");
});

test("C3 fails closed if C2 terminal evidence is not exact",()=>{
  assert.throws(()=>runC3Calibration({
    recipes:PUBLIC_RUNTIME_RECIPES,
    contract,
    c2Summary:{...c2Summary,terminal:"C2_NOT_PASS"},
    brainPolicy:BRAIN_PUBLIC_POLICY_V1,
    rankRecipes,normalizeProfile,recommendationSource
  }),/C3_C2_TERMINAL_EVIDENCE_REQUIRED/);
});

test("C3 fails closed if Brain public policy becomes a runtime recommendation import",()=>{
  assert.throws(()=>runC3Calibration({
    recipes:PUBLIC_RUNTIME_RECIPES,contract,c2Summary,brainPolicy:BRAIN_PUBLIC_POLICY_V1,
    rankRecipes,normalizeProfile,
    recommendationSource:recommendationSource+"\n// import brain-public-policy-v1"
  }),/C3_RUNTIME_BRAIN_POLICY_IMPORT_DETECTED/);
});

test("C3 fails closed on any attempted field prior promotion",()=>{
  const mutated=structuredClone(contract);
  mutated.fieldCalibration.dishCategory.decision="PROMOTE";
  assert.ok(validateC3Contract(mutated).includes("fieldCalibration.dishCategory"));
});
