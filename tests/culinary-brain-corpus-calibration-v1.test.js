import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCulinaryBrainCorpusCalibration } from "../scripts/culinary-brain-corpus-calibration-v1.mjs";

const config = JSON.parse(
  await readFile(new URL("../config/culinary_brain_corpus_calibration_v1.json", import.meta.url), "utf8")
);

test("Culinary Brain calibration follows the Fitness Brain pattern without live runtime coupling", () => {
  assert.deepEqual(validateCulinaryBrainCorpusCalibration(config), []);
  assert.equal(config.executionRelationship.browseSearchBlocksOnBrain, false);
  assert.equal(config.executionRelationship.runsParallelWithMetadataUsability, true);
  assert.equal(config.executionRelationship.goldenCalibrationRecipeCount, 85);
  assert.equal(config.executionRelationship.initialProtectedPilotTarget, 500);
  assert.equal(config.executionRelationship.fullCorpus.recipeCount, 19268);
});

test("Brain/model disagreement cannot become majority-vote authority", () => {
  const mutated = structuredClone(config);
  mutated.disagreementOutcome = "MAJORITY_VOTE";
  assert.ok(validateCulinaryBrainCorpusCalibration(mutated).some(error => error.includes("fail closed")));
});

test("Brain cannot silently gain hard safety, nutrition, admission or live-runtime authority", () => {
  const runtime = structuredClone(config);
  runtime.authority.liveLlmRecommendationRuntimeAuthorized = true;
  assert.ok(validateCulinaryBrainCorpusCalibration(runtime).some(error => error.includes("liveLlmRecommendationRuntimeAuthorized")));

  const hard = structuredClone(config);
  hard.neverGrantedByBrainOrModelAlone = hard.neverGrantedByBrainOrModelAlone.filter(x => x !== "ALLERGEN_SAFETY");
  assert.ok(validateCulinaryBrainCorpusCalibration(hard).some(error => error.includes("ALLERGEN_SAFETY")));
});

test("C2 terminal classification advances Brain only to bounded C3",()=>{
  assert.equal(config.state,"C0_PASS__P2_PASS__C1_PASS_WITH_REFERENCE_COVERAGE_LIMIT__C2_PASS__C3_READY");
  const c2=config.postP1Execution.c2Classification;
  assert.equal(c2.state,"PASS");
  assert.equal(c2.terminal,"CULINARY_BRAIN_C2_FULL_V8018_CANDIDATE_CLASSIFICATION_PASS");
  assert.equal(c2.recipeCount,19268);
  assert.equal(c2.uniqueRecipeKeyCount,19268);
  assert.equal(c2.candidateOnly,true);
  assert.equal(c2.abstentionDefault,true);
  assert.equal(c2.invariants.knownReferenceOverrideAttempts,0);
  assert.equal(c2.invariants.highConfidenceCells,0);
  assert.equal(c2.invariants.hardAuthorityViolations,0);
  assert.deepEqual(config.postP1Execution.next,["C3_DETERMINISTIC_RECOMMENDATION_PRIOR_CALIBRATION"]);
});
