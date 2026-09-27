import frozenC1 from "../../data/generated/culinary-brain-c1-exact-sample-freeze-v1.json" with { type: "json" };
import {
  PROTECTED_SEARCH_CORPUS_VERSION,
  PROTECTED_SEARCH_EXPECTED_COUNT,
  PROTECTED_SEARCH_EXPECTED_STRUCTURAL_PARTIAL_COUNT,
  PROTECTED_SEARCH_FTS_TABLE,
  PROTECTED_SEARCH_INDEX_TABLE
} from "./protected-corpus-search-v1.mjs";
import { STEP8G_POINTER_SCOPE, STEP8G_POINTER_TABLE } from "./step8g-live-runtime.mjs";

export const PROTECTED_P2_FROZEN_SAMPLE_COUNT = 500;
export const PROTECTED_P2_ID_CHUNK_SIZE = 90;
export const PROTECTED_P2_EXPECTED_MEMBERSHIP_QUERIES = 6;
export const PROTECTED_P2_INTERNAL_D1_SUBQUERY_TARGET = 7;
export const PROTECTED_P2_TERMINAL = "PROTECTED_CORPUS_P2_LIVE_ALIGNMENT_PASS";

function chunk(values, size) {
  const out = [];
  for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size));
  return out;
}

function frozenRecipeIds() {
  const ids = Array.isArray(frozenC1?.recipeIds) ? frozenC1.recipeIds.map(value => String(value || "").trim()).filter(Boolean) : [];
  if (
    frozenC1?.terminal !== "CULINARY_BRAIN_C1_EXACT_500_SAMPLE_FROZEN" ||
    frozenC1?.protectedCorpusVersion !== PROTECTED_SEARCH_CORPUS_VERSION ||
    ids.length !== PROTECTED_P2_FROZEN_SAMPLE_COUNT ||
    new Set(ids).size !== PROTECTED_P2_FROZEN_SAMPLE_COUNT
  ) throw new Error("P2_FROZEN_C1_SAMPLE_INVALID");
  return ids;
}

export async function verifyProtectedCorpusP2LiveAlignment(controlDb) {
  const ids = frozenRecipeIds();
  const groups = chunk(ids, PROTECTED_P2_ID_CHUNK_SIZE);
  if (groups.length !== PROTECTED_P2_EXPECTED_MEMBERSHIP_QUERIES) throw new Error("P2_FROZEN_C1_CHUNK_LAYOUT_INVALID");

  const status = await controlDb.prepare(`SELECT
      (SELECT active_version FROM ${STEP8G_POINTER_TABLE} WHERE scope=? LIMIT 1) AS active_version,
      COUNT(*) AS summary_count,
      SUM(CASE WHEN structural_state='PARTIAL' THEN 1 ELSE 0 END) AS partial_count,
      (SELECT COUNT(*) FROM ${PROTECTED_SEARCH_FTS_TABLE}) AS fts_count
    FROM ${PROTECTED_SEARCH_INDEX_TABLE}
    WHERE corpus_version=?`).bind(STEP8G_POINTER_SCOPE, PROTECTED_SEARCH_CORPUS_VERSION).first();

  let d1Subqueries = 1;
  const found = new Set();
  let sourceProvenanceCount = 0;

  for (const group of groups) {
    const placeholders = group.map(() => "?").join(",");
    const rows = await controlDb.prepare(`SELECT recipe_id,source_cohort_id
      FROM ${PROTECTED_SEARCH_INDEX_TABLE}
      WHERE corpus_version=? AND recipe_id IN (${placeholders})`)
      .bind(PROTECTED_SEARCH_CORPUS_VERSION, ...group)
      .all();
    d1Subqueries += 1;
    for (const row of rows?.results || []) {
      const recipeId = String(row?.recipe_id || "");
      if (recipeId) found.add(recipeId);
      if (recipeId && String(row?.source_cohort_id || "").trim()) sourceProvenanceCount += 1;
    }
  }

  const state = {
    activeVersion: status?.active_version ? String(status.active_version) : null,
    indexedRecipeCount: Number(status?.summary_count || 0),
    ftsRecipeCount: Number(status?.fts_count || 0),
    structuralPartialCount: Number(status?.partial_count || 0),
    expectedRecipeCount: PROTECTED_SEARCH_EXPECTED_COUNT,
    frozenSampleRecipeCount: ids.length,
    matchedFrozenRecipeCount: found.size,
    sourceProvenanceCount,
    frozenSampleDigestSha256: String(frozenC1?.summary?.sampleDigestSha256 || "")
  };

  const checks = {
    activeV8018: state.activeVersion === PROTECTED_SEARCH_CORPUS_VERSION,
    summaryCountExact: state.indexedRecipeCount === PROTECTED_SEARCH_EXPECTED_COUNT,
    ftsCountExact: state.ftsRecipeCount === PROTECTED_SEARCH_EXPECTED_COUNT,
    structuralPartialCountExact: state.structuralPartialCount === PROTECTED_SEARCH_EXPECTED_STRUCTURAL_PARTIAL_COUNT,
    frozenSampleCountExact: state.frozenSampleRecipeCount === PROTECTED_P2_FROZEN_SAMPLE_COUNT,
    frozenSampleMembershipExact: state.matchedFrozenRecipeCount === PROTECTED_P2_FROZEN_SAMPLE_COUNT,
    sourceProvenancePresent: state.sourceProvenanceCount === PROTECTED_P2_FROZEN_SAMPLE_COUNT,
    membershipQueryCountExact: groups.length === PROTECTED_P2_EXPECTED_MEMBERSHIP_QUERIES,
    internalD1WithinTarget: d1Subqueries <= PROTECTED_P2_INTERNAL_D1_SUBQUERY_TARGET
  };
  const pass = Object.values(checks).every(Boolean);

  return {
    pass,
    terminal: pass ? PROTECTED_P2_TERMINAL : "PROTECTED_CORPUS_P2_LIVE_ALIGNMENT_STOPPED_SAFE",
    reason: pass ? null : "P2_LIVE_ALIGNMENT_ACCEPTANCE_NOT_MET",
    ...state,
    checks,
    membershipQueryCount: groups.length,
    maxFrozenIdChunkSize: Math.max(...groups.map(group => group.length)),
    d1Subqueries,
    protectedBodyReads: 0,
    rowsWritten: 0,
    fullCorpusScans: 0,
    publicRuntimeChanged: false,
    recommendationAdmissionChanged: false
  };
}
