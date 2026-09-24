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

test("programme records D5 prototype/defer closeout and makes real-corpus P1 first remaining priority", () => {
  assert.equal(config.state, "P0_EVIDENCE_AUDIT_PASS__P1_READY");
  assert.equal(config.gates.find(gate => gate.id === "P0_EVIDENCE_AND_CONTRACT_AUDIT").state, "PASS");
  assert.equal(config.gates.find(gate => gate.id === "P1_PRIVATE_BROWSE_SEARCH_CANARY").state, "READY");
  assert.equal(config.nextExecutionSequence[0], "PROTECTED_CORPUS_RUNTIME_USABILITY_P1_PRIVATE_BROWSE_SEARCH_CANARY");

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
