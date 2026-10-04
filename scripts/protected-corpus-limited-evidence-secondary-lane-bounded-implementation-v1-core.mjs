import { createHash } from "node:crypto";

export const SECONDARY_BOUNDED_IMPLEMENTATION_SCHEMA = "CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_BOUNDED_IMPLEMENTATION_V1";
export const SECONDARY_BOUNDED_IMPLEMENTATION_SUMMARY_SCHEMA = "CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_BOUNDED_IMPLEMENTATION_SUMMARY_V1";
export const SECONDARY_BOUNDED_IMPLEMENTATION_TERMINAL = "V21_LIMITED_EVIDENCE_SECONDARY_LANE_BOUNDED_IMPLEMENTATION_PASS__OWNER_CANARY_AUTHORIZATION_REQUIRED";
export const SECONDARY_RUNTIME_BUNDLE_SCHEMA = "CULINARY_PROTECTED_CORPUS_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_BUNDLE_V1";

export const sha256Json = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function validateBoundedImplementationSummary(summary, config, runtimeContract) {
  const errors = [];
  if (config?.schemaVersion !== SECONDARY_BOUNDED_IMPLEMENTATION_SCHEMA) errors.push("configSchema");
  if (runtimeContract?.result?.terminal !== config?.entryTerminal) errors.push("entryTerminal");
  if (summary?.schemaVersion !== SECONDARY_BOUNDED_IMPLEMENTATION_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if (summary?.pass !== true || summary?.terminal !== SECONDARY_BOUNDED_IMPLEMENTATION_TERMINAL) errors.push("terminal");
  if (summary?.protectedCorpusVersion !== config?.protectedCorpusVersion) errors.push("protectedCorpusVersion");
  if (summary?.primaryRuntimeRecipeCount !== config?.primaryRuntimeRecipeCount) errors.push("primaryRuntimeRecipeCount");
  if (summary?.candidateBundle?.candidateCount !== config?.candidateCount) errors.push("candidateCount");
  if (summary?.candidateBundle?.candidateManifestDigestSha256 !== config?.candidateManifestDigestSha256) errors.push("candidateDigest");
  if (summary?.candidateBundle?.qualityCohortDigestSha256 !== config?.qualityCohortDigestSha256) errors.push("qualityDigest");
  for (const [mealType, count] of Object.entries(config?.expectedMealTypeEligibleCounts || {})) {
    if (summary?.mealTypes?.[mealType]?.eligibleCount !== count) errors.push(`mealType.${mealType}`);
    if (summary?.mealTypes?.[mealType]?.returnedCount !== Math.min(count, config.requestContract.maximumSecondaryResults)) errors.push(`returned.${mealType}`);
  }
  const checks = summary?.implementationChecks || {};
  for (const key of ["featureFlagDefaultsOff","explicitOptInOnly","restrictedProfilesFailClosed","primaryLaneReferencePreserved","secondaryRankingSeparated","topKHydrationBounded","sourceProvenancePreserved","singleFlagRollbackReady"]) {
    if (checks[key] !== true) errors.push(`implementationChecks.${key}`);
  }
  if (summary?.disposition?.runtimeImplementationComplete !== true) errors.push("runtimeImplementationComplete");
  if (summary?.disposition?.liveApiWired !== false) errors.push("liveApiWired");
  if (summary?.disposition?.ownerCanaryActivationAuthorized !== false) errors.push("ownerCanaryAuthority");
  if (summary?.disposition?.publicRuntimeWideningAuthorized !== false) errors.push("publicRuntimeAuthority");
  for (const [key, value] of Object.entries(summary?.boundaries || {})) {
    if (["protectedD1Reads", "protectedD1Writes", "fullCorpusScans", "protectedBodiesRewritten"].includes(key)) {
      if (value !== 0) errors.push(`boundaries.${key}`);
    } else if (value !== false) errors.push(`boundaries.${key}`);
  }
  return [...new Set(errors)].sort();
}
