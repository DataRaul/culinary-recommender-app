import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import {
  validateQuotaGapParallelPrep,
  summarizeGolden85,
  buildP2MetadataBlockerTable,
  buildC1CohortQuotaPlan
} from "../scripts/culinary-quota-gap-parallel-prep-v1.mjs";

const config = JSON.parse(await readFile(new URL("../config/culinary_quota_gap_parallel_prep_v1.json", import.meta.url), "utf8"));
const mapping = JSON.parse(await readFile(new URL("../data/generated/corpus-normalization-mapping-v1.json", import.meta.url), "utf8"));

test("quota-gap contract keeps protected execution fail-closed and zero-D1", () => {
  assert.deepEqual(validateQuotaGapParallelPrep(config), []);
  assert.equal(config.boundaries.protectedD1Reads, 0);
  assert.equal(config.boundaries.protectedD1Writes, 0);
  assert.equal(config.c1.exactProtectedRecipeIdsMayBeSelectedBeforeP1Pass, false);
});

test("C0 Golden-85 harness exercises the exact current public runtime without protected access", () => {
  const summary = summarizeGolden85(PUBLIC_RUNTIME_RECIPES);
  assert.equal(summary.pass, true);
  assert.equal(summary.recipeCount, 85);
  assert.equal(summary.uniqueRecipeIdCount, 85);
  assert.equal(summary.protectedD1Reads, 0);
  assert.equal(summary.protectedD1Writes, 0);
});

test("P2 harness accounts for every v8018 recipe from frozen authority summaries", () => {
  const table = buildP2MetadataBlockerTable(mapping, config.p2DimensionPriority);
  assert.equal(table.length, config.p2DimensionPriority.length);
  for (const row of table) assert.equal(row.authoritativeCount + row.unresolvedCount, 19268);
  assert.equal(table.find(row => row.dimension === "dishCategory").authoritativeCount, 1079);
  assert.equal(table.find(row => row.dimension === "reviewedDietaryTags").authoritativeCount, 0);
  const totalMinutes = table.find(row => row.dimension === "totalMinutes");
  assert.equal(totalMinutes.authoritativeCount, 1371);
  assert.equal(totalMinutes.ambiguousCount, 45);
});

test("C1 design freezes exactly 500 source-cohort slots without selecting protected recipe IDs", () => {
  const plan = buildC1CohortQuotaPlan(mapping, config.c1.targetRecipeCount);
  assert.equal(plan.pass, true);
  assert.equal(plan.universeCount, 19268);
  assert.equal(plan.targetRecipeCount, 500);
  assert.equal(plan.allocations.reduce((sum, row) => sum + row.quota, 0), 500);
  assert.ok(plan.allocations.every(row => row.quota >= 1));
  assert.equal(plan.exactProtectedRecipeIdsSelected, false);
  assert.equal(plan.protectedD1Reads, 0);
  assert.equal(plan.protectedD1Writes, 0);
});
