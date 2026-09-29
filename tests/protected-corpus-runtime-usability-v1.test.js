import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  summarizeProtectedCorpusRuntimeUsability,
  validateProtectedCorpusRuntimeUsability
} from "../scripts/protected-corpus-runtime-usability-v1.mjs";

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const config = await readJson("../config/protected_corpus_runtime_usability_v1.json");
const normalization = await readJson("../data/generated/corpus-normalization-baseline-v1.json");
const nutrition = await readJson("../data/generated/nutrition-vitamin-applicability-audit-v1.json");
const recommendation = await readJson("../data/generated/recommendation-readiness-audit-v1.json");
const evidence = { normalization, nutrition, recommendation };

test("real-v8018 usability baseline matches canonical generated evidence", () => {
  assert.deepEqual(validateProtectedCorpusRuntimeUsability(config, evidence), []);
  const summary = summarizeProtectedCorpusRuntimeUsability(config, evidence);
  assert.equal(summary.pass, true);
  assert.equal(summary.terminal, "PROTECTED_CORPUS_RUNTIME_USABILITY_P0_EVIDENCE_AUDIT_PASS");
  assert.equal(summary.protectedRecipeCount, 19268);
  assert.equal(summary.structurallyParseableCount, 19265);
  assert.equal(summary.allIngredientIdentityReadyRecipes, 112);
  assert.equal(summary.protectedAutomaticRecommendationReadyCount, 0);
});

test("programme fails closed if protected evidence drifts", () => {
  const mutated = structuredClone(config);
  mutated.currentFacts.protectedRecipeCount = 19267;
  assert.ok(validateProtectedCorpusRuntimeUsability(mutated, evidence).some(error => error.includes("recipe count")));
});

test("programme preserves C3/C4 history and advances through bounded P3 activation to P4", () => {
  assert.match(config.state, /^P1_PASS__P2_PASS__C1_PASS__C2_PASS__C3_PASS__C4_/);
  assert.equal(config.gates.find(gate => gate.id === "P0_EVIDENCE_AND_CONTRACT_AUDIT").state, "PASS");
  assert.equal(config.gates.find(gate => gate.id === "P1_PRIVATE_BROWSE_SEARCH_CANARY").state, "PASS");
  assert.equal(config.gates.find(gate => gate.id === "P1_PRIVATE_BROWSE_SEARCH_CANARY").liveOwnerCanary, "PROTECTED_CORPUS_P1_LIVE_OWNER_CANARY_PASS");
  assert.equal(config.nextExecutionSequence[0], "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE");
  assert.equal(config.brainCalibration.state, "C4_BOUNDED_PASS__P3_BOUNDED_ACTIVATION_PASS__P4_READY");
  assert.equal(config.brainCalibration.c1Evaluation.entireFrozen500Evaluated, true);
  assert.equal(config.brainCalibration.c1Evaluation.independentHistoricalSemanticGeneralizationDemonstrated, false);
  assert.equal(config.brainCalibration.c1Evaluation.c2AuthorizedScope, "CANDIDATE_ONLY__ABSTENTION_DEFAULT");
  assert.equal(config.gates.find(gate => gate.id === "P3_PROGRESSIVE_RECOMMENDATION_ADMISSION").state, "BOUNDED_ACTIVATION_PASS__ONE_RECIPE_ADMITTED");
  assert.equal(config.p3TapiocaPreactivation.terminal, "CULINARY_BRAIN_C4_TAPIOCA_BOUNDED_P3_CONTRACT_PASS__PREACTIVATION_READY");
  assert.equal(config.p3TapiocaPreactivation.runtimeActivationAuthorized, false);
  assert.equal(config.p3TapiocaPreactivation.ownerActivationAuthorizationRequired, true);
  assert.equal(config.p3TapiocaActivation.terminal, "CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_PASS__P4_READY");
  assert.equal(config.p3TapiocaActivation.ownerActivationAuthorized, true);
  assert.equal(config.p3TapiocaActivation.publicRuntimeRecipeCountAfter, 86);
  assert.equal(config.p3TapiocaActivation.publicExternalRecipeCountAfter, 10);
  assert.equal(config.p3TapiocaActivation.activatedRecipeCount, 1);
  assert.equal(config.p3TapiocaActivation.automaticRecommendationAdmissionAuthorized, false);
  assert.equal(config.gates.find(gate => gate.id === "P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE").state, "READY");
  assert.equal(config.brainCalibration.c4Closeout.distinctCandidateCount,1);
  assert.equal(config.brainCalibration.c4Closeout.protectedRecommendationAdmissionCount,0);
  assert.equal(config.brainCalibration.c3Calibration.terminal, "CULINARY_BRAIN_C3_PRIOR_CALIBRATION_PASS__NO_NEW_RUNTIME_PRIOR_PROMOTION__C4_READY");
  assert.equal(config.brainCalibration.c3Calibration.profileCaseCount, 12);
  assert.equal(config.brainCalibration.c3Calibration.promotedPriorCount, 0);
  assert.equal(config.brainCalibration.c3Calibration.c2CandidatesPromoted, false);
  if (config.brainCalibration.c4FailureMatrix) {
    assert.equal(config.brainCalibration.c4FailureMatrix.terminal, "CULINARY_BRAIN_C4_FAILURE_MATRIX_PASS__112_IDENTITY_READY_REPAIR_COHORT_FROZEN");
    assert.equal(config.brainCalibration.c4FailureMatrix.identityReadyRepairCohortCount, 112);
    assert.equal(config.brainCalibration.c4FailureMatrix.unresolvedIdentityRecipeCount, 19156);
    assert.equal(config.brainCalibration.c4FailureMatrix.automaticRecommendationReadyCount, 0);
  }
  assert.equal(config.gates.find(gate => gate.id === "P2_METADATA_USABILITY_MEASUREMENT").state, "PASS");
  assert.equal(config.gates.find(gate => gate.id === "P2_METADATA_USABILITY_MEASUREMENT").liveAlignmentState, "PASS");
  assert.equal(config.gates.find(gate => gate.id === "P2_METADATA_USABILITY_MEASUREMENT").liveAlignmentTerminal, "PROTECTED_CORPUS_P2_LIVE_ALIGNMENT_PASS");

  const reopenedP1 = structuredClone(config);
  reopenedP1.gates.find(gate => gate.id === "P1_PRIVATE_BROWSE_SEARCH_CANARY").state = "IMPLEMENTATION_CI_PASS__LIVE_OWNER_CANARY_PENDING";
  assert.ok(validateProtectedCorpusRuntimeUsability(reopenedP1, evidence).some(error => error.includes("execution sequence")));

  const mutated = structuredClone(config);
  mutated.ownerPriority.deferD5BehaviorAfterPrototype = false;
  assert.ok(validateProtectedCorpusRuntimeUsability(mutated, evidence).some(error => error.includes("D5 behavior")));

  const reopenedD5 = structuredClone(config);
  reopenedD5.ownerPriority.d5SafeAdapterPrototypeState = "BUILT_VALIDATION_PENDING";
  assert.ok(validateProtectedCorpusRuntimeUsability(reopenedD5, evidence).some(error => error.includes("closed PASS")));

  const undeferredD5 = structuredClone(config);
  undeferredD5.ownerPriority.d5BehaviorDisposition = "ACTIVE";
  assert.ok(validateProtectedCorpusRuntimeUsability(undeferredD5, evidence).some(error => error.includes("DEFERRED")));

  const brainRuntime = structuredClone(config);
  brainRuntime.brainCalibration.liveRuntimeDependencyAuthorized = true;
  assert.ok(validateProtectedCorpusRuntimeUsability(brainRuntime, evidence).some(error => error.includes("live Brain runtime")));

  const browseBlocked = structuredClone(config);
  browseBlocked.brainCalibration.browseSearchBlocksOnBrain = true;
  assert.ok(validateProtectedCorpusRuntimeUsability(browseBlocked, evidence).some(error => error.includes("browse/search")));

  const disagreementVote = structuredClone(config);
  disagreementVote.brainCalibration.disagreementOutcome = "MAJORITY_VOTE";
  assert.ok(validateProtectedCorpusRuntimeUsability(disagreementVote, evidence).some(error => error.includes("fail closed")));
});

test("programme cannot silently widen public, billing, shard, KC or Barbecue authority", () => {
  for (const key of [
    "publicRuntimeWideningAuthorized",
    "automaticRecommendationAdmissionAuthorized",
    "thirdShardAuthorized",
    "paidInfrastructureAuthorized",
    "knowledgeCoreWriteAuthorized",
    "barbecueMutationAuthorized"
  ]) {
    const mutated = structuredClone(config);
    mutated.authority[key] = true;
    assert.ok(validateProtectedCorpusRuntimeUsability(mutated, evidence).some(error => error.includes(key)));
  }
});
