import { createHash } from "node:crypto";

export const C1_FREEZE_SCHEMA_VERSION = "CULINARY_BRAIN_C1_EXACT_SAMPLE_FREEZE_V1";
export const C1_FREEZE_SEED = "CULINARY_BRAIN_C1_V1_2026_09_27";

export function stableHash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function collectStates(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (typeof node.state === "string") {
    out.push(node.state);
    return out;
  }
  for (const value of Object.values(node)) collectStates(value, out);
  return out;
}

export function metadataProfile(overlay) {
  const states = collectStates(overlay?.canonical || {});
  const knownCount = states.filter(state => state === "EXACT_SOURCE_NORMALIZATION" || state === "REVIEWED_MAPPING").length;
  const ambiguousCount = states.filter(state => state === "AMBIGUOUS").length;
  const unknownCount = states.filter(state => state === "UNKNOWN").length;
  const metadataBand = knownCount >= 4 ? "KNOWN_HIGH" : knownCount >= 1 ? "KNOWN_SOME" : "KNOWN_NONE";
  const dishCategory = overlay?.canonical?.culinary?.dishCategory?.value || "UNKNOWN";
  const mealRolesValue = overlay?.canonical?.culinary?.mealRoles?.value;
  const mealRoles = Array.isArray(mealRolesValue) && mealRolesValue.length ? [...mealRolesValue].sort().join("+") : "UNKNOWN";
  return { knownCount, ambiguousCount, unknownCount, metadataBand, dishCategory, mealRoles };
}

export function buildCandidate({ overlay, diagnostic, runtimeRecipeId, structuralException = false }) {
  if (!runtimeRecipeId) throw new Error("C1_RUNTIME_RECIPE_ID_REQUIRED");
  if (overlay?.identity?.cohortId !== diagnostic?.cohortId || overlay?.identity?.sourceRecordKey !== diagnostic?.sourceRecordKey) {
    throw new Error("C1_MAPPING_NUTRITION_IDENTITY_MISMATCH");
  }
  const metadata = metadataProfile(overlay);
  const sourceSystem = String(overlay.identity.sourceSystem || "");
  const sourceContext = sourceSystem.startsWith("OPEN_RECIPE_ARCHIVE") ? "HISTORICAL_SOURCE" : "MODERN_OR_CONTEMPORARY_DATASET";
  const ingredientIdentityReadiness = diagnostic.allIngredientIdentitiesResolved === true ? "ALL_IDENTITIES_RESOLVED" : "IDENTITY_GAPS_PRESENT";
  const structuralBoundary = structuralException ? "STRUCTURAL_EXCEPTION" : "STRUCTURAL_PARSEABLE";
  const stratum = [
    ingredientIdentityReadiness,
    metadata.metadataBand,
    metadata.dishCategory,
    metadata.mealRoles,
    structuralBoundary
  ].join("|");
  return {
    recipeId: runtimeRecipeId,
    layer: overlay.identity.layer,
    cohortId: overlay.identity.cohortId,
    sourceSystem,
    sourceRecordKey: overlay.identity.sourceRecordKey,
    ingredientIdentityReadiness,
    metadataBand: metadata.metadataBand,
    metadataKnownCount: metadata.knownCount,
    metadataAmbiguousCount: metadata.ambiguousCount,
    metadataUnknownCount: metadata.unknownCount,
    dishCategory: metadata.dishCategory,
    mealRoles: metadata.mealRoles,
    sourceContext,
    structuralBoundary,
    stratum
  };
}

function deterministicOrder(values, seed, keyFn) {
  return [...values].sort((a,b) => {
    const ah = stableHash(seed + "|" + keyFn(a));
    const bh = stableHash(seed + "|" + keyFn(b));
    return ah.localeCompare(bh) || keyFn(a).localeCompare(keyFn(b));
  });
}

export function selectCohortSample(candidates, quota, { seed = C1_FREEZE_SEED } = {}) {
  if (!Number.isInteger(quota) || quota < 1 || quota > candidates.length) throw new Error("C1_INVALID_COHORT_QUOTA");
  const unique = new Map(candidates.map(row => [row.recipeId,row]));
  if (unique.size !== candidates.length) throw new Error("C1_DUPLICATE_RECIPE_ID_IN_COHORT");

  const forced = deterministicOrder(candidates.filter(row => row.structuralBoundary === "STRUCTURAL_EXCEPTION"), seed + "|forced", row => row.recipeId);
  if (forced.length > quota) throw new Error("C1_STRUCTURAL_EXCEPTION_COUNT_EXCEEDS_QUOTA");
  const selected = [...forced];
  const selectedIds = new Set(selected.map(row => row.recipeId));

  const groups = new Map();
  for (const row of candidates) {
    if (selectedIds.has(row.recipeId)) continue;
    if (!groups.has(row.stratum)) groups.set(row.stratum,[]);
    groups.get(row.stratum).push(row);
  }
  const orderedGroups = deterministicOrder([...groups.entries()].map(([stratum,rows]) => ({
    stratum,
    rows: deterministicOrder(rows, seed + "|" + stratum, row => row.recipeId)
  })), seed + "|strata", row => row.stratum);

  let round = 0;
  while (selected.length < quota) {
    let added = 0;
    for (const group of orderedGroups) {
      const row = group.rows[round];
      if (!row) continue;
      selected.push(row);
      added++;
      if (selected.length === quota) break;
    }
    if (!added) throw new Error("C1_SAMPLE_SELECTION_EXHAUSTED");
    round++;
  }
  return selected;
}

export function freezeC1Sample(candidates, allocations, { seed = C1_FREEZE_SEED } = {}) {
  const byCohort = new Map();
  for (const row of candidates) {
    if (!byCohort.has(row.cohortId)) byCohort.set(row.cohortId,[]);
    byCohort.get(row.cohortId).push(row);
  }
  const selected = [];
  for (const allocation of allocations) {
    const rows = byCohort.get(allocation.cohortId) || [];
    if (rows.length !== allocation.universeCount) throw new Error("C1_COHORT_UNIVERSE_MISMATCH_" + allocation.cohortId);
    selected.push(...selectCohortSample(rows, allocation.quota, {seed: seed + "|" + allocation.cohortId}));
  }
  if (selected.length !== 500 || new Set(selected.map(row=>row.recipeId)).size !== 500) throw new Error("C1_EXACT_SAMPLE_SIZE_OR_UNIQUENESS_FAIL");
  const recipeIds = selected.map(row=>row.recipeId).sort();
  const digest = stableHash(JSON.stringify(recipeIds));
  return { selected, recipeIds, digest };
}

export function summarizeC1Freeze(selected, allocations, digest) {
  const countBy = (key) => Object.fromEntries([...selected.reduce((m,row)=>{
    const value=row[key]; m.set(value,(m.get(value)||0)+1); return m;
  },new Map()).entries()].sort(([a],[b])=>String(a).localeCompare(String(b))));
  const cohortCounts = countBy("cohortId");
  for (const allocation of allocations) {
    if (cohortCounts[allocation.cohortId] !== allocation.quota) throw new Error("C1_COHORT_QUOTA_MISMATCH_" + allocation.cohortId);
  }
  return {
    sampleDigestSha256:digest,
    targetRecipeCount:500,
    selectedRecipeCount:selected.length,
    uniqueRecipeIdCount:new Set(selected.map(row=>row.recipeId)).size,
    structuralExceptionCount:selected.filter(row=>row.structuralBoundary==="STRUCTURAL_EXCEPTION").length,
    ingredientIdentityReadinessCounts:countBy("ingredientIdentityReadiness"),
    metadataBandCounts:countBy("metadataBand"),
    dishCategoryCounts:countBy("dishCategory"),
    mealRoleCounts:countBy("mealRoles"),
    sourceContextCounts:countBy("sourceContext"),
    cohortCounts
  };
}
