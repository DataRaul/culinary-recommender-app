import test from "node:test";
import assert from "node:assert/strict";

import {
  executeLimitedEvidenceSecondaryLane,
  normalizeLimitedEvidenceSecondaryRequest,
  validateLimitedEvidenceRuntimeBundle
} from "../src/server/protected-corpus-limited-evidence-secondary-lane-v1.mjs";

const config = {
  protectedCorpusVersion: "v8018",
  candidateCount: 3,
  candidateManifestDigestSha256: "fixture-digest",
  requestContract: {
    modeValue: "limited_evidence_secondary",
    dietaryModeRequired: "unrestricted",
    maximumSecondaryResults: 2
  },
  responseContract: {
    requiredLaneLabel: "Limited-evidence suggestions",
    requiredDisclosure: "Incomplete metadata.",
    requiredUnknownSoftSignals: ["nutrition", "protein", "budget", "mealPrep", "novelty"],
    recommendationValidationState: "LIMITED_EVIDENCE_NOT_PRIMARY_VALIDATED"
  },
  runtimeCostContract: {
    maximumD1SubqueriesPerRequest: 8,
    maximumHydratedResults: 2
  }
};
const profile = { dietaryMode: "unrestricted", allergens: [], excludedIngredientIds: [], unavailableIngredientIds: [] };
const bundle = {
  schemaVersion: "CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_BUNDLE_V1",
  protectedCorpusVersion: "v8018",
  candidateCount: 3,
  candidateManifestDigestSha256: "fixture-digest",
  candidates: [
    { recipeKey: "a", recipe: { governance: { recommendationState: "SHADOW_CANDIDATE_ONLY" }, culinary: { mealTypes: ["dinner"] } } },
    { recipeKey: "b", recipe: { governance: { recommendationState: "SHADOW_CANDIDATE_ONLY" }, culinary: { mealTypes: ["dinner", "lunch"] } } },
    { recipeKey: "c", recipe: { governance: { recommendationState: "SHADOW_CANDIDATE_ONLY" }, culinary: { mealTypes: ["snack"] } } }
  ]
};
const ranker = async rows => rows.map((row, index) => ({ recipeKey: row.recipeKey, score: 10 - index }));
const hydrator = async keys => ({
  results: keys.map(recipeKey => ({ recipeKey, sourceProvenance: { sourceName: "fixture" } })),
  d1Subqueries: 3,
  fullCorpusScans: 0,
  rowsWritten: 0
});

test("request normalization fails closed unless flag, mode, unrestricted profile and meal type all pass", () => {
  assert.equal(normalizeLimitedEvidenceSecondaryRequest({ mode: "limited_evidence_secondary", mealType: "dinner", profile }, config).reason, "SECONDARY_FEATURE_DISABLED");
  assert.equal(normalizeLimitedEvidenceSecondaryRequest({ mode: "normal", mealType: "dinner", profile }, config, { featureEnabled: true }).reason, "SECONDARY_MODE_NOT_EXPLICITLY_ENABLED");
  assert.equal(normalizeLimitedEvidenceSecondaryRequest({ mode: "limited_evidence_secondary", mealType: "dinner", profile: { ...profile, allergens: ["egg"] } }, config, { featureEnabled: true }).reason, "RESTRICTED_PROFILE_NOT_ELIGIBLE");
  assert.equal(normalizeLimitedEvidenceSecondaryRequest({ mode: "limited_evidence_secondary", mealType: "dessert", profile }, config, { featureEnabled: true }).reason, "UNSUPPORTED_MEAL_TYPE");
  assert.equal(normalizeLimitedEvidenceSecondaryRequest({ mode: "limited_evidence_secondary", mealType: "dinner", profile }, config, { featureEnabled: true }).eligible, true);
});

test("bundle validation enforces exact frozen count, digest, governance and meal targeting", () => {
  assert.deepEqual(validateLimitedEvidenceRuntimeBundle(bundle, config), []);
  assert.ok(validateLimitedEvidenceRuntimeBundle({ ...bundle, candidateCount: 4 }, config).includes("candidateCount"));
  assert.ok(validateLimitedEvidenceRuntimeBundle({ ...bundle, candidateManifestDigestSha256: "drift" }, config).includes("candidateManifestDigestSha256"));
});

test("feature-off rollback preserves primary lane and performs no secondary hydration", async () => {
  let hydrated = false;
  const primary = [{ id: "p" }];
  const result = await executeLimitedEvidenceSecondaryLane({
    primaryResults: primary,
    request: { mode: "limited_evidence_secondary", mealType: "dinner", profile },
    featureEnabled: false,
    bundle,
    config,
    rankSecondaryCandidates: ranker,
    hydrateTopK: async () => { hydrated = true; return hydrator([]); }
  });
  assert.equal(result.primary, primary);
  assert.equal(result.secondaryLane.enabled, false);
  assert.equal(result.secondaryLane.results.length, 0);
  assert.equal(hydrated, false);
});

test("eligible request ranks only secondary candidates, hydrates top K and keeps lanes separated", async () => {
  const primary = [{ id: "p" }];
  const result = await executeLimitedEvidenceSecondaryLane({
    primaryResults: primary,
    request: { mode: "limited_evidence_secondary", mealType: "dinner", limit: 2, profile },
    featureEnabled: true,
    bundle,
    config,
    rankSecondaryCandidates: ranker,
    hydrateTopK: hydrator
  });
  assert.equal(result.primary, primary);
  assert.equal(result.secondaryLane.enabled, true);
  assert.deepEqual(result.secondaryLane.results.map(row => row.recipeKey), ["a", "b"]);
  assert.equal(result.secondaryLane.mayDisplacePrimary, false);
  assert.equal(result.secondaryLane.results.every(row => row.detail.sourceProvenance.sourceName === "fixture"), true);
  assert.equal(result.secondaryLane.metrics.d1Subqueries, 3);
});

test("runtime rejects ranker scope leaks and over-budget hydration", async () => {
  await assert.rejects(() => executeLimitedEvidenceSecondaryLane({
    primaryResults: [], request: { mode: "limited_evidence_secondary", mealType: "dinner", profile }, featureEnabled: true,
    bundle, config, rankSecondaryCandidates: async () => [{ recipeKey: "c", score: 1 }], hydrateTopK: hydrator
  }), /RANKER_SCOPE_LEAK/);
  await assert.rejects(() => executeLimitedEvidenceSecondaryLane({
    primaryResults: [], request: { mode: "limited_evidence_secondary", mealType: "dinner", profile }, featureEnabled: true,
    bundle, config, rankSecondaryCandidates: ranker,
    hydrateTopK: async keys => ({ results: keys.map(recipeKey => ({ recipeKey, sourceProvenance: {} })), d1Subqueries: 9, fullCorpusScans: 0, rowsWritten: 0 })
  }), /D1_BUDGET/);
});
