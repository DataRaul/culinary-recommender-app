import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PUBLIC_RUNTIME_RECIPES, PUBLIC_EXTERNAL_RECIPES } from "../src/data/corpus-v1.js";
import {
  P4_TERMINAL,
  P4_NEXT_GATE,
  validateP4Contract,
  measureCurrentV8018,
  buildP4MachineBaseline,
  validateP4Summary
} from "../scripts/protected-corpus-p4-real-20k-core.mjs";

const read = path => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const contract = read("config/protected_corpus_p4_real_20k_product_acceptance_v1.json");
const p1 = read("data/generated/protected-corpus-p1-live-owner-canary-v1.json");
const p2 = read("data/generated/protected-corpus-p2-live-alignment-v1.json");
const c4 = read("data/generated/culinary-brain-c4-real-v8018-failure-matrix-summary-v1.json");
const p3 = read("data/generated/culinary-brain-p3-tapioca-bounded-activation-summary-v1.json");
const committed = read("data/generated/protected-corpus-p4-real-20k-machine-baseline-v1.json");

test("P4 contract preserves the real-v8018 primary-product and fail-closed boundaries", () => {
  assert.deepEqual(validateP4Contract(contract), []);
  assert.equal(contract.protectedCorpusVersion, "v8018");
  assert.equal(contract.expectedProtectedRecipeCount, 19268);
  assert.equal(contract.expectedPreP3IdentityReadyRecipeCount, 112);
  assert.equal(contract.expectedCurrentIdentityReadyRecipeCount, 113);
  assert.equal(contract.expectedCurrentUnresolvedIdentityRecipeCount, 19155);
  assert.equal(contract.machineAcceptance.reconstructExactV8018FromPinnedSources, true);
  assert.equal(contract.machineAcceptance.reconcilePostP3IdentityDelta, true);
  assert.equal(contract.machineAcceptance.reuseTerminalP1P2LiveEvidence, true);
  assert.equal(contract.liveAcceptance.required, true);
  assert.equal(contract.liveAcceptance.ownerAuthenticationRequired, true);
  assert.equal(contract.authority.furtherProtectedRecipeAdmissionAuthorized, false);
  assert.equal(contract.authority.automaticRecommendationAdmissionAuthorized, false);
  assert.equal(contract.authority.barbecueMutationAuthorized, false);
  assert.equal(contract.targetTerminal, P4_TERMINAL);
  assert.equal(contract.nextGate, P4_NEXT_GATE);
});

test("P4 current-v8018 measurement recognizes the exact one-recipe identity delta created by bounded P3", () => {
  const diagnostics = Array.from({ length: 19268 }, (_, index) => ({
    allIngredientIdentitiesResolved: index < 113,
    ingredientOccurrenceCount: 1
  }));
  const mappingFull = {
    protectedCorpusVersion: "v8018",
    observedRecipeCount: 19268,
    structuralExceptions: [{}, {}, {}]
  };
  const nutritionFull = {
    protectedCorpusVersion: "v8018",
    observedRecipeCount: 19268,
    protectedCorpusRecipeDiagnostics: diagnostics
  };
  assert.deepEqual(measureCurrentV8018({ contract, mappingFull, nutritionFull }), {
    recipeCount: 19268,
    structuralExceptionCount: 3,
    identityReadyRecipeCount: 113,
    unresolvedIngredientIdentityRecipeCount: 19155
  });
});

test("P4 machine baseline exactly reconciles frozen pre-P3 C4 with current post-P3 v8018 and runtime", () => {
  const currentV8018 = {
    recipeCount: 19268,
    structuralExceptionCount: 3,
    identityReadyRecipeCount: 113,
    unresolvedIngredientIdentityRecipeCount: 19155
  };
  const summary = buildP4MachineBaseline({
    contract,
    p1,
    p2,
    c4,
    p3,
    currentV8018,
    publicRuntimeRecipeCount: PUBLIC_RUNTIME_RECIPES.length,
    publicExternalRecipeCount: PUBLIC_EXTERNAL_RECIPES.length,
    p3CandidatePresent: PUBLIC_RUNTIME_RECIPES.some(recipe => recipe.id === "unitools_pao_de_queijo")
  });
  assert.deepEqual(validateP4Summary(summary), []);
  assert.deepEqual(summary, committed);
  assert.equal(summary.realCorpus.recipeCount, 19268);
  assert.equal(summary.realCorpus.historicalPreP3IdentityReadyRecipeCount, 112);
  assert.equal(summary.realCorpus.currentPostP3IdentityReadyRecipeCount, 113);
  assert.equal(summary.realCorpus.currentIdentityReadyDeltaFromP3, 1);
  assert.equal(summary.realCorpus.currentUnresolvedIngredientIdentityRecipeCount, 19155);
  assert.equal(summary.currentRuntime.publicRuntimeRecipeCount, 86);
  assert.equal(summary.currentRuntime.publicExternalRecipeCount, 10);
  assert.equal(summary.currentRuntime.p3CandidatePresent, true);
  assert.equal(summary.regressionMatrix.runtimeRetrieval.maxObservedD1Subqueries, 8);
  assert.equal(summary.regressionMatrix.runtimeRetrieval.fullCorpusScans, 0);
  assert.equal(summary.regressionMatrix.hardSafetyEligibility.broaderAutomaticRecommendationAdmission, false);
  assert.equal(summary.regressionMatrix.recommendationPlannerCompatibility.broaderProtectedAdmission, false);
});

test("P4 machine PASS cannot be misrepresented as terminal product acceptance", () => {
  assert.equal(committed.terminal, P4_TERMINAL);
  assert.equal(committed.liveAcceptance.required, true);
  assert.equal(committed.liveAcceptance.state, "OWNER_AUTHENTICATED_PRODUCT_PROBE_REQUIRED");
  assert.equal(committed.regressionMatrix.performanceCost.state, "MACHINE_BASELINE_PASS__LIVE_LATENCY_BYTES_MEMORY_REQUIRED");
  assert.equal(committed.regressionMatrix.browserUx.ownerLiveProductProbeRequired, true);
  assert.equal(committed.nextGate, P4_NEXT_GATE);
});

test("P4 performs no protected mutation and does not widen recommendation authority", () => {
  const b = committed.boundaries;
  assert.equal(b.protectedD1ReadsThisGate, 0);
  assert.equal(b.protectedD1WritesThisGate, 0);
  assert.equal(b.protectedBodyReadsThisGate, 0);
  assert.equal(b.protectedBodyRewritesThisGate, 0);
  assert.equal(b.publicRuntimeChangedThisGate, false);
  assert.equal(b.recommendationAdmissionChangedThisGate, false);
  assert.equal(b.automaticRecommendationAdmissionAuthorized, false);
  assert.equal(b.knowledgeCoreWrites, 0);
  assert.equal(b.paidInfrastructureUsed, false);
  assert.equal(b.thirdShardUsed, false);
  assert.equal(b.barbecueMutation, false);
});
