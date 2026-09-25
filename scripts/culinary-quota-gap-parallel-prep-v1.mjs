export const CULINARY_QUOTA_GAP_PARALLEL_PREP_SCHEMA = "CULINARY_QUOTA_GAP_PARALLEL_PREP_V1";

const REQUIRED_BLOCKS = [
  "C1_EXACT_PROTECTED_RECIPE_ID_SELECTION_AND_EXECUTION",
  "P2_LIVE_FULL_V8018_RUNTIME_MEASUREMENT",
  "C2_FROZEN_FULL_V8018_CLASSIFICATION",
  "P3_PROGRESSIVE_RECOMMENDATION_ADMISSION"
];

export function validateQuotaGapParallelPrep(config) {
  const errors = [];
  if (!config || typeof config !== "object") return ["config must be an object"];
  if (config.schemaVersion !== CULINARY_QUOTA_GAP_PARALLEL_PREP_SCHEMA) errors.push("unexpected schemaVersion");
  if (config.state !== "AUTHORIZED_ACTIVE") errors.push("quota-gap preparation must be explicitly active");
  if (config.frozenInputs?.expectedPublicRuntimeRecipeCount !== 85) errors.push("public golden set must remain 85");
  if (config.frozenInputs?.expectedProtectedCorpusVersion !== "v8018" || config.frozenInputs?.expectedProtectedRecipeCount !== 19268) errors.push("protected frozen input must remain v8018 / 19268");
  if (config.c1?.targetRecipeCount !== 500) errors.push("C1 target must remain 500");
  if (config.c1?.minimumPerSourceCohort !== 1) errors.push("C1 must retain at least one slot per source cohort");
  if (config.c1?.exactProtectedRecipeIdsMayBeSelectedBeforeP1Pass !== false) errors.push("exact protected recipe selection must remain blocked before P1 pass");
  const blocked = new Set(config.blockedUntilP1TerminalPass || []);
  for (const item of REQUIRED_BLOCKS) if (!blocked.has(item)) errors.push(`missing pre-P1 block: ${item}`);
  const b = config.boundaries || {};
  if (b.protectedD1Reads !== 0 || b.protectedD1Writes !== 0) errors.push("quota-gap preparation must use zero protected D1 reads/writes");
  if (b.protectedBodiesReadOrExported !== 0 || b.protectedBodiesRewritten !== 0) errors.push("quota-gap preparation cannot read/export/rewrite protected bodies");
  for (const key of ["publicRuntimeChanged","recommendationBehaviorChanged","recommendationAuthorityWidened","knowledgeCoreWritePerformed","paidInfrastructureAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]) {
    if (b[key] !== false) errors.push(`boundaries.${key} must remain false`);
  }
  return errors;
}

export function summarizeGolden85(recipes) {
  if (!Array.isArray(recipes)) throw new TypeError("recipes must be an array");
  const ids = recipes.map(recipe => recipe?.id).filter(Boolean);
  const stateCounts = {};
  for (const recipe of recipes) {
    const state = recipe?.governance?.recommendationState || "ELIGIBLE_OR_LEGACY_DEFAULT";
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  }
  const fieldCoverage = {
    canonicalTitle: recipes.filter(r => typeof r?.identity?.canonicalTitle === "string" && r.identity.canonicalTitle.trim()).length,
    provenance: recipes.filter(r => r?.provenance?.sourceReference && r?.provenance?.license).length,
    ingredients: recipes.filter(r => Array.isArray(r?.ingredients) && r.ingredients.length > 0).length,
    cuisine: recipes.filter(r => typeof r?.culinary?.cuisine === "string" && r.culinary.cuisine.trim()).length,
    mealTypes: recipes.filter(r => Array.isArray(r?.culinary?.mealTypes) && r.culinary.mealTypes.length > 0).length,
    totalMinutes: recipes.filter(r => Number.isFinite(r?.time?.totalMinutes)).length,
    servings: recipes.filter(r => Number.isFinite(r?.serving?.servings)).length
  };
  return {
    pass: recipes.length === 85 && new Set(ids).size === 85,
    recipeCount: recipes.length,
    uniqueRecipeIdCount: new Set(ids).size,
    recommendationStateCounts: stateCounts,
    fieldCoverage,
    protectedD1Reads: 0,
    protectedD1Writes: 0
  };
}

export function buildP2MetadataBlockerTable(mapping, dimensionPriority) {
  if (mapping?.pass !== true || mapping?.protectedCorpusVersion !== "v8018" || mapping?.observedRecipeCount !== 19268) {
    throw new Error("frozen v8018 mapping summary is required");
  }
  const total = mapping.observedRecipeCount;
  return dimensionPriority.map((dimension, index) => {
    const row = mapping.canonicalAuthorityCoverage?.[dimension];
    if (!row) throw new Error(`missing canonical authority coverage: ${dimension}`);
    const exact = Number(row.EXACT_SOURCE_NORMALIZATION || 0);
    const reviewed = Number(row.REVIEWED_MAPPING || 0);
    const ambiguous = Number(row.AMBIGUOUS || 0);
    const unknown = Number(row.UNKNOWN || 0);
    if (exact + reviewed + ambiguous + unknown !== total) throw new Error(`coverage accounting mismatch: ${dimension}`);
    const authoritative = exact + reviewed;
    return {
      priority: index + 1,
      dimension,
      authoritativeCount: authoritative,
      authoritativeCoverage: Number((authoritative / total).toFixed(6)),
      ambiguousCount: ambiguous,
      unknownCount: unknown,
      unresolvedCount: ambiguous + unknown,
      executionState: "FROZEN_SUMMARY_ONLY__NO_D1"
    };
  });
}

export function buildC1CohortQuotaPlan(mapping, targetRecipeCount = 500) {
  if (mapping?.pass !== true || mapping?.protectedCorpusVersion !== "v8018") throw new Error("frozen v8018 mapping summary is required");
  const cohorts = (mapping.cohortChecks || []).map(row => ({
    cohortId: row.cohortId,
    universeCount: Number(row.observedCount)
  })).filter(row => row.cohortId && Number.isInteger(row.universeCount) && row.universeCount > 0);
  const universeCount = cohorts.reduce((sum, row) => sum + row.universeCount, 0);
  if (universeCount !== 19268) throw new Error("source cohort universe must sum to 19268");
  if (!Number.isInteger(targetRecipeCount) || targetRecipeCount < cohorts.length || targetRecipeCount > universeCount) throw new Error("invalid C1 target");

  const remaining = targetRecipeCount - cohorts.length;
  const provisional = cohorts.map(row => {
    const raw = remaining * row.universeCount / universeCount;
    return {...row, quota: 1 + Math.floor(raw), remainder: raw - Math.floor(raw)};
  });
  let assigned = provisional.reduce((sum, row) => sum + row.quota, 0);
  const byRemainder = [...provisional].sort((a,b) => b.remainder - a.remainder || a.cohortId.localeCompare(b.cohortId));
  for (let i = 0; assigned < targetRecipeCount; i++, assigned++) byRemainder[i].quota += 1;

  const quotaById = new Map(byRemainder.map(row => [row.cohortId, row.quota]));
  const allocations = provisional.map(row => ({
    cohortId: row.cohortId,
    universeCount: row.universeCount,
    quota: quotaById.get(row.cohortId)
  }));
  if (allocations.reduce((sum, row) => sum + row.quota, 0) !== targetRecipeCount) throw new Error("C1 quota allocation mismatch");

  return {
    pass: true,
    protectedCorpusVersion: "v8018",
    universeCount,
    targetRecipeCount,
    sourceCohortCount: allocations.length,
    allocations,
    exactProtectedRecipeIdsSelected: false,
    protectedD1Reads: 0,
    protectedD1Writes: 0,
    nextGate: "P1_TERMINAL_PASS_THEN_FREEZE_EXACT_C1_IDENTITIES_WITH_SECONDARY_STRATA"
  };
}
