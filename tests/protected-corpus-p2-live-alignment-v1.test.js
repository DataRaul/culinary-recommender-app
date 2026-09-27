import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const frozenC1 = JSON.parse(readFileSync(new URL("../data/generated/culinary-brain-c1-exact-sample-freeze-v1.json", import.meta.url), "utf8"));
const frozenRecipeIds = frozenC1.recipeIds;
import {
  PROTECTED_P2_EXPECTED_MEMBERSHIP_QUERIES,
  PROTECTED_P2_FROZEN_SAMPLE_COUNT,
  PROTECTED_P2_ID_CHUNK_SIZE,
  PROTECTED_P2_INTERNAL_D1_SUBQUERY_TARGET,
  PROTECTED_P2_TERMINAL,
  verifyProtectedCorpusP2LiveAlignment
} from "../src/server/protected-corpus-p2-live-alignment-v1.mjs";

function exactDb({ dropLast = false, blankProvenance = false } = {}) {
  let firstCalls = 0;
  let membershipCalls = 0;
  const boundSizes = [];
  return {
    stats() { return { firstCalls, membershipCalls, boundSizes }; },
    prepare(sql) {
      const statement = {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          firstCalls += 1;
          assert.match(sql, /corpus_protected_active_version/);
          assert.match(sql, /culinary_protected_recipe_search_fts_v1/);
          return { active_version:"v8018", summary_count:19268, partial_count:3, fts_count:19268 };
        },
        async all() {
          membershipCalls += 1;
          assert.match(sql, /recipe_id IN/);
          assert.doesNotMatch(sql, /OFFSET|LIKE\s+['"]?%/i);
          const ids = this.args.slice(1);
          boundSizes.push(this.args.length);
          const selected = dropLast && membershipCalls === PROTECTED_P2_EXPECTED_MEMBERSHIP_QUERIES ? ids.slice(0,-1) : ids;
          return { results:selected.map(recipeId => ({
            recipe_id:recipeId,
            source_cohort_id:blankProvenance && membershipCalls === 1 ? "" : "TEST_COHORT"
          })) };
        }
      };
      return statement;
    }
  };
}

test("P2 live alignment verifies exact frozen 500 with seven internal D1 queries and zero writes", async () => {
  const db = exactDb();
  const result = await verifyProtectedCorpusP2LiveAlignment(db, frozenRecipeIds);
  assert.equal(result.pass, true);
  assert.equal(result.terminal, PROTECTED_P2_TERMINAL);
  assert.equal(result.frozenSampleRecipeCount, PROTECTED_P2_FROZEN_SAMPLE_COUNT);
  assert.equal(result.matchedFrozenRecipeCount, PROTECTED_P2_FROZEN_SAMPLE_COUNT);
  assert.equal(result.sourceProvenanceCount, PROTECTED_P2_FROZEN_SAMPLE_COUNT);
  assert.equal(result.membershipQueryCount, PROTECTED_P2_EXPECTED_MEMBERSHIP_QUERIES);
  assert.equal(result.maxFrozenIdChunkSize, PROTECTED_P2_ID_CHUNK_SIZE);
  assert.equal(result.d1Subqueries, PROTECTED_P2_INTERNAL_D1_SUBQUERY_TARGET);
  assert.equal(result.protectedBodyReads, 0);
  assert.equal(result.rowsWritten, 0);
  assert.equal(result.fullCorpusScans, 0);
  const stats = db.stats();
  assert.equal(stats.firstCalls, 1);
  assert.equal(stats.membershipCalls, PROTECTED_P2_EXPECTED_MEMBERSHIP_QUERIES);
  assert.ok(stats.boundSizes.every(size => size <= 91));
});

test("P2 live alignment fails closed on frozen-ID membership drift", async () => {
  const result = await verifyProtectedCorpusP2LiveAlignment(exactDb({ dropLast:true }), frozenRecipeIds);
  assert.equal(result.pass, false);
  assert.equal(result.terminal, "PROTECTED_CORPUS_P2_LIVE_ALIGNMENT_STOPPED_SAFE");
  assert.equal(result.checks.frozenSampleMembershipExact, false);
  assert.equal(result.rowsWritten, 0);
});

test("P2 live alignment fails closed when source-cohort provenance is absent", async () => {
  const result = await verifyProtectedCorpusP2LiveAlignment(exactDb({ blankProvenance:true }), frozenRecipeIds);
  assert.equal(result.pass, false);
  assert.equal(result.checks.sourceProvenancePresent, false);
  assert.equal(result.rowsWritten, 0);
});

test("P2 live alignment rejects a tampered frozen sample before any D1 query", async () => {
  const db = exactDb();
  const tampered = [...frozenRecipeIds];
  tampered[0] = "tampered:recipe-id";
  await assert.rejects(
    verifyProtectedCorpusP2LiveAlignment(db, tampered),
    /P2_FROZEN_C1_SAMPLE_DIGEST_MISMATCH/
  );
  const stats = db.stats();
  assert.equal(stats.firstCalls, 0);
  assert.equal(stats.membershipCalls, 0);
});

test("P2 live alignment source is bounded, read-only, and frozen-sample based", () => {
  const source = readFileSync(new URL("../src/server/protected-corpus-p2-live-alignment-v1.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /culinary-brain-c1-exact-sample-freeze-v1\.json/);
  assert.match(source, /PROTECTED_P2_FROZEN_SAMPLE_DIGEST_SHA256/);
  assert.match(source, /sha256Hex\(JSON\.stringify\(ids\)\)/);
  assert.match(source, /PROTECTED_P2_ID_CHUNK_SIZE = 90/);
  assert.match(source, /PROTECTED_P2_EXPECTED_MEMBERSHIP_QUERIES = 6/);
  assert.match(source, /protectedBodyReads:\s*0/);
  assert.match(source, /rowsWritten:\s*0/);
  assert.match(source, /fullCorpusScans:\s*0/);
  assert.doesNotMatch(source, /\bUPDATE\b|\bINSERT\b|\bDELETE\b/i);
});
