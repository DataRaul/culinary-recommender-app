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
