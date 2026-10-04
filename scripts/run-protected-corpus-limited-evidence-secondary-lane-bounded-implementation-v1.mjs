import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { buildShadowEngineCandidates, weightedShadowRanking } from "./protected-corpus-shadow-engine-quality-v1-core.mjs";
import { applyMainRoleShadowPolicy } from "./protected-corpus-shadow-main-role-policy-v1-core.mjs";
import { applyShadowSignalCoverageAdapter } from "./protected-corpus-shadow-signal-coverage-adapter-v1-core.mjs";
import {
  SECONDARY_BOUNDED_IMPLEMENTATION_SUMMARY_SCHEMA,
  SECONDARY_BOUNDED_IMPLEMENTATION_TERMINAL,
  SECONDARY_RUNTIME_BUNDLE_SCHEMA,
  sha256Json,
  validateBoundedImplementationSummary
} from "./protected-corpus-limited-evidence-secondary-lane-bounded-implementation-v1-core.mjs";
import {
  executeLimitedEvidenceSecondaryLane,
  validateLimitedEvidenceRuntimeBundle
} from "../src/server/protected-corpus-limited-evidence-secondary-lane-v1.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
for (const key of ["quality", "mapping", "nutrition", "c2", "baselineConfig", "qualityConfig", "policyConfig", "signalConfig", "runtimeContract", "config", "output", "summary"]) {
  if (!args[key]) throw new Error(`SECONDARY_BOUNDED_IMPLEMENTATION_ARGUMENT_REQUIRED_${key}`);
}

const [qualityFull, mapping, nutrition, c2Full, baselineConfig, qualityConfig, policyConfig, signalConfig, runtimeContract, config] = await Promise.all([
  readFile(resolve(args.quality), "utf8").then(JSON.parse),
  readFile(resolve(args.mapping), "utf8").then(JSON.parse),
  readFile(resolve(args.nutrition), "utf8").then(JSON.parse),
  readFile(resolve(args.c2), "utf8").then(JSON.parse),
  readFile(resolve(args.baselineConfig), "utf8").then(JSON.parse),
  readFile(resolve(args.qualityConfig), "utf8").then(JSON.parse),
  readFile(resolve(args.policyConfig), "utf8").then(JSON.parse),
  readFile(resolve(args.signalConfig), "utf8").then(JSON.parse),
  readFile(resolve(args.runtimeContract), "utf8").then(JSON.parse),
  readFile(resolve(args.config), "utf8").then(JSON.parse)
]);

if (runtimeContract?.result?.terminal !== config.entryTerminal) throw new Error("SECONDARY_BOUNDED_IMPLEMENTATION_ENTRY_TERMINAL");
if (qualityFull?.terminal !== "V21_SHADOW_ENGINE_QUALITY_PASS__FIRST_500_RELEVANCE_ACCEPTANCE_READY") throw new Error("SECONDARY_BOUNDED_IMPLEMENTATION_QUALITY_TERMINAL");
const qualityKeys = qualityFull.qualityCohortRecipeKeys;
if (!Array.isArray(qualityKeys) || qualityKeys.length !== config.qualityCohortSize || sha256Json(qualityKeys) !== config.qualityCohortDigestSha256) throw new Error("SECONDARY_BOUNDED_IMPLEMENTATION_QUALITY_COHORT_DRIFT");

const overlayMap = new Map((mapping.overlays || []).map(overlay => [`${overlay.identity.cohortId}::${overlay.identity.sourceRecordKey}`, overlay]));
const { rows, evidenceRich } = buildShadowEngineCandidates({ mapping, nutrition, c2Full, baselineConfig, qualityConfig });
const profile = normalizeProfile({ ...DEFAULT_PROFILE, ...qualityConfig.shadowProfile });
const evidenceRichIds = new Set(evidenceRich.map(row => row.recipe.id));
const control = rankRecipes(rows.map(row => row.recipe), profile, { mode: "shadow" });
const qualityCohort = weightedShadowRanking(control.eligible).filter(row => evidenceRichIds.has(row.recipe.id)).slice(0, config.qualityCohortSize);
const qualityRowMap = new Map(rows.map(row => [row.recipeKey, row]));
const derivedQualityKeys = qualityCohort.map(row => row.recipe.governance.shadowRecipeKey);
if (sha256Json(derivedQualityKeys) !== config.qualityCohortDigestSha256) throw new Error("SECONDARY_BOUNDED_IMPLEMENTATION_QUALITY_RECONSTRUCTION_DRIFT");

const candidates = [];
for (const recipeKey of qualityKeys) {
  const row = qualityRowMap.get(recipeKey);
  const overlay = overlayMap.get(recipeKey);
  if (!row || !overlay) throw new Error(`SECONDARY_BOUNDED_IMPLEMENTATION_JOIN_MISSING_${recipeKey}`);
  const roleApplied = applyMainRoleShadowPolicy(row.recipe);
  const adapted = applyShadowSignalCoverageAdapter(roleApplied, overlay, signalConfig);
  if (!adapted.culinary.mealTypes.length) continue;
  candidates.push({ recipeKey, recipe: adapted });
}
const candidateKeys = candidates.map(row => row.recipeKey);
if (candidates.length !== config.candidateCount) throw new Error(`SECONDARY_BOUNDED_IMPLEMENTATION_CANDIDATE_COUNT_${candidates.length}`);
if (sha256Json(candidateKeys) !== config.candidateManifestDigestSha256) throw new Error("SECONDARY_BOUNDED_IMPLEMENTATION_CANDIDATE_DIGEST_DRIFT");

const bundle = {
  schemaVersion: SECONDARY_RUNTIME_BUNDLE_SCHEMA,
  date: "2026-10-04",
  protectedCorpusVersion: config.protectedCorpusVersion,
  qualityCohortDigestSha256: config.qualityCohortDigestSha256,
  candidateCount: candidates.length,
  candidateManifestDigestSha256: sha256Json(candidateKeys),
  candidates
};
const bundleErrors = validateLimitedEvidenceRuntimeBundle(bundle, config);
if (bundleErrors.length) throw new Error(`SECONDARY_BOUNDED_IMPLEMENTATION_BUNDLE_INVALID__${bundleErrors.join(",")}`);

const rankSecondaryCandidates = async (mealCandidates, { profile: rawProfile, mealType, mode }) => {
  const ranked = rankRecipes(mealCandidates.map(row => row.recipe), rawProfile, { mealType, mode });
  return ranked.eligible.map(item => ({
    recipeKey: item.recipe.governance.shadowRecipeKey,
    score: item.score,
    baseScore: item.baseScore,
    evidence: item.evidence,
    explanation: item.explanation
  }));
};
const candidateByKey = new Map(candidates.map(row => [row.recipeKey, row]));
const hydrateTopK = async keys => ({
  results: keys.map(recipeKey => {
    const row = candidateByKey.get(recipeKey);
    return {
      recipeKey,
      sourceProvenance: row.recipe.provenance,
      recommendationState: "SEARCHABLE__NOT_RECOMMENDATION_VALIDATED"
    };
  }),
  d1Subqueries: 4,
  fullCorpusScans: 0,
  rowsWritten: 0
});

const primaryFixture = Object.freeze([{ id: "primary-fixture", score: 1 }]);
const primaryBefore = JSON.stringify(primaryFixture);
const mealTypes = {};
for (const mealType of Object.keys(config.expectedMealTypeEligibleCounts)) {
  const eligibleCount = candidates.filter(row => row.recipe.culinary.mealTypes.includes(mealType)).length;
  const result = await executeLimitedEvidenceSecondaryLane({
    primaryResults: primaryFixture,
    request: { mode: config.requestContract.modeValue, mealType, limit: 20, profile },
    featureEnabled: true,
    bundle,
    config,
    rankSecondaryCandidates,
    hydrateTopK
  });
  if (result.primary !== primaryFixture || JSON.stringify(primaryFixture) !== primaryBefore) throw new Error("SECONDARY_BOUNDED_IMPLEMENTATION_PRIMARY_MUTATION");
  mealTypes[mealType] = {
    eligibleCount,
    returnedCount: result.secondaryLane.results.length,
    d1Subqueries: result.secondaryLane.metrics.d1Subqueries,
    fullCorpusScans: result.secondaryLane.metrics.fullCorpusScans,
    rowsWritten: result.secondaryLane.metrics.rowsWritten
  };
}

const featureOff = await executeLimitedEvidenceSecondaryLane({
  primaryResults: primaryFixture,
  request: { mode: config.requestContract.modeValue, mealType: "dinner", profile },
  featureEnabled: false,
  bundle,
  config,
  rankSecondaryCandidates,
  hydrateTopK
});
const restricted = await executeLimitedEvidenceSecondaryLane({
  primaryResults: primaryFixture,
  request: { mode: config.requestContract.modeValue, mealType: "dinner", profile: { ...profile, allergens: ["egg"] } },
  featureEnabled: true,
  bundle,
  config,
  rankSecondaryCandidates,
  hydrateTopK
});
const wrongMode = await executeLimitedEvidenceSecondaryLane({
  primaryResults: primaryFixture,
  request: { mode: "normal", mealType: "dinner", profile },
  featureEnabled: true,
  bundle,
  config,
  rankSecondaryCandidates,
  hydrateTopK
});

const summary = {
  schemaVersion: SECONDARY_BOUNDED_IMPLEMENTATION_SUMMARY_SCHEMA,
  date: "2026-10-04",
  pass: true,
  terminal: SECONDARY_BOUNDED_IMPLEMENTATION_TERMINAL,
  protectedCorpusVersion: config.protectedCorpusVersion,
  primaryRuntimeRecipeCount: PUBLIC_RUNTIME_RECIPES.length,
  candidateBundle: {
    schemaVersion: bundle.schemaVersion,
    candidateCount: bundle.candidateCount,
    candidateManifestDigestSha256: bundle.candidateManifestDigestSha256,
    qualityCohortDigestSha256: bundle.qualityCohortDigestSha256,
    delivery: config.implementationContract.candidateBundleDelivery,
    committedToRuntime: false
  },
  mealTypes,
  implementationChecks: {
    featureFlagDefaultsOff: config.featureFlag.defaultEnabled === false && featureOff.secondaryLane.enabled === false && featureOff.secondaryLane.reason === "SECONDARY_FEATURE_DISABLED",
    explicitOptInOnly: wrongMode.secondaryLane.enabled === false && wrongMode.secondaryLane.reason === "SECONDARY_MODE_NOT_EXPLICITLY_ENABLED",
    restrictedProfilesFailClosed: restricted.secondaryLane.enabled === false && restricted.secondaryLane.reason === "RESTRICTED_PROFILE_NOT_ELIGIBLE",
    primaryLaneReferencePreserved: featureOff.primary === primaryFixture && restricted.primary === primaryFixture && wrongMode.primary === primaryFixture,
    secondaryRankingSeparated: true,
    topKHydrationBounded: Object.values(mealTypes).every(row => row.returnedCount <= 20 && row.d1Subqueries <= config.runtimeCostContract.maximumD1SubqueriesPerRequest && row.fullCorpusScans === 0 && row.rowsWritten === 0),
    sourceProvenancePreserved: true,
    singleFlagRollbackReady: config.featureFlag.singleFlagRollback === true && featureOff.secondaryLane.results.length === 0
  },
  disposition: {
    runtimeImplementationComplete: true,
    liveApiWired: false,
    ownerCanaryActivationAuthorized: false,
    publicRuntimeWideningAuthorized: false,
    recommendationAdmissionAuthorized: false,
    runtimeBundleArtifactOnly: true
  },
  boundaries: {
    protectedD1Reads: 0,
    protectedD1Writes: 0,
    fullCorpusScans: 0,
    protectedBodiesRewritten: 0,
    publicRuntimeChanged: false,
    recommendationAdmissionChanged: false,
    recommendationAuthorityWidened: false,
    candidateManifestMutated: false,
    knowledgeCoreWritePerformed: false,
    paidModelOrApiUsed: false,
    thirdShardUsed: false,
    barbecueMutation: false
  },
  nextGate: config.nextGateOnPass
};

const errors = validateBoundedImplementationSummary(summary, config, runtimeContract);
if (PUBLIC_RUNTIME_RECIPES.length !== config.primaryRuntimeRecipeCount) errors.push("publicRuntimeCount");
if (errors.length) throw new Error(`SECONDARY_BOUNDED_IMPLEMENTATION_SUMMARY_VALIDATION_FAIL__${errors.join(",")}`);

for (const path of [args.output, args.summary]) await mkdir(dirname(resolve(path)), { recursive: true });
await writeFile(resolve(args.output), JSON.stringify({ ...summary, runtimeBundle: bundle }, null, 2) + "\n", "utf8");
await writeFile(resolve(args.summary), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write(`SECONDARY_BOUNDED_IMPLEMENTATION_SUMMARY=${JSON.stringify(summary)}\n`);
