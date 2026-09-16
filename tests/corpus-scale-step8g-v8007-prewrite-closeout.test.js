import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALL_RECIPES, ACTIVATED_EXTERNAL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-rigaud-v8007-prewrite-evidence.json", import.meta.url), "utf8"));
const validation = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-rigaud-v8007-prewrite-validation.json", import.meta.url), "utf8"));
const measurement = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-rigaud-1785-measurement.json", import.meta.url), "utf8"));

test("Rigaud v8007 prewrite is frozen against exact v8006 parent and source measurement", () => {
  assert.equal(measurement.pass, true);
  assert.equal(evidence.pass, true);
  assert.equal(validation.pass, true);
  assert.equal(evidence.source.cohortId, "ORA_RIGAUD_1785_PORTUGUESE_SOURCE_AE3BD2C");
  assert.equal(evidence.source.recordCount, 789);
  assert.equal(evidence.parent.activeCorpusVersion, "v8006");
  assert.equal(evidence.parent.composedRecipeCount, 2906);
  assert.equal(evidence.parent.fingerprintSha256, "345db0d7d8fd664807431de604596b6a685b48f382a0179c5c264a8758b4464b");
  assert.equal(evidence.layer.corpusVersion, "v8007");
  assert.equal(evidence.layer.recipeCount, 789);
  assert.equal(evidence.layer.manifestSha256, "1b840b2d0c0ccd5e64309206a4e3640c6e51e9d7f505ab9e976414361c526d02");
  assert.equal(evidence.layer.populationPlanSha256, "e30f5ffb8c914e3138eae7375236daf3507210c2f4182e1c824b78fd3db1a7fd");
  assert.equal(evidence.layer.batchCount, 79);
  assert.deepEqual(evidence.layer.shardDescriptors.map(row => row.rowCount), [399, 390]);
  assert.equal(evidence.composition.cumulativeRecipeCount, 3695);
});

test("v8007 prewrite preserves the two-shard and exact 16-query fail-closed envelope", () => {
  assert.equal(evidence.composition.routing.shardCount, 2);
  assert.equal(evidence.layer.maxRowsPerBatch, 10);
  assert.equal(evidence.layer.operationBudget.operations.routeWriteFresh, 16);
  assert.equal(evidence.layer.operationBudget.maxPlannedD1Subqueries, 16);
  assert.equal(evidence.layer.operationBudget.maxAllowedD1Subqueries, 16);
  assert.equal(evidence.layer.operationBudget.headroomAssumed, false);
  assert.equal(evidence.layer.maxWriteRequestBytes, 16790);
  assert.equal(evidence.gates.capacityPass, true);
  assert.equal(evidence.gates.requestSizePass, true);
});

test("prewrite is no-write and does not widen public or cost authority", () => {
  assert.equal(evidence.boundaries.liveD1WritesPerformed, 0);
  assert.equal(evidence.boundaries.publicRuntimeChanged, false);
  assert.equal(evidence.boundaries.recommendationAdmissionPerformed, false);
  assert.equal(evidence.boundaries.thirdShardUsed, false);
  assert.equal(evidence.boundaries.d1BudgetExpansion, false);
  assert.equal(evidence.boundaries.billingExpansion, false);
  assert.equal(evidence.boundaries.nutritionLaneModified, false);
  assert.equal(evidence.boundaries.youtubeCulinaryStateModified, false);
  assert.equal(evidence.boundaries.knowledgeCoreWritePerformed, false);
  assert.equal(evidence.boundaries.culturalAuthenticityAuthorityImported, false);
  assert.equal(ALL_RECIPES.length, 84);
  assert.equal(ACTIVATED_EXTERNAL_RECIPES.length, 1);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 85);
});
