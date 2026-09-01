import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EXTERNAL_RECIPES } from "../src/data/corpus-v1.js";
import {
  buildGateF2CompactIndex,
  gateF2CoverageReport,
  validateGateF2Ledger
} from "../scripts/wikibooks-gate-f2-contract.mjs";

const ledger = JSON.parse(
  await readFile(new URL("../scripts/wikibooks-gate-f2-review-ledger.json", import.meta.url), "utf8")
);

test("Gate F2 review ledger preserves the accepted Gate F floor without authorizing runtime expansion", () => {
  assert.deepEqual(validateGateF2Ledger(ledger), []);
  const report = gateF2CoverageReport(ledger);

  assert.equal(report.runtimeActivationAuthorized, false);
  assert.equal(report.sourceMeasuredRecipePages, 3792);
  assert.equal(report.trackedRecordCount, 13);
  assert.equal(report.admittedCount, 8);
  assert.equal(report.rejectedCount, 5);
  assert.equal(report.searchOnlyCount, 2);
  assert.equal(report.referenceOnlyCount, 6);
  assert.equal(report.nutritionFirewallCount, 8);
  assert.equal(report.exactRevisionPinnedCount, 13);
  assert.deepEqual(report.missingRecipeRoles, ["contemporary_modern", "genuinely_new_trending"]);
});

test("Gate F2 admitted seed records remain synchronized with the accepted Gate F runtime lane", () => {
  const admitted = ledger.records.filter(record => record.reviewState === "ADMITTED");
  const byId = new Map(admitted.map(record => [record.id, record]));

  assert.equal(admitted.length, EXTERNAL_RECIPES.length);
  assert.deepEqual(
    [...byId.keys()].sort(),
    EXTERNAL_RECIPES.map(recipe => recipe.id).sort()
  );

  for (const recipe of EXTERNAL_RECIPES) {
    const record = byId.get(recipe.id);
    assert.ok(record, `missing Gate F2 ledger row for ${recipe.id}`);
    assert.equal(record.pageid, recipe.provenance.sourcePageId);
    assert.equal(record.title, recipe.provenance.sourcePageTitle);
    assert.equal(record.revid, recipe.provenance.sourceRevisionId);
    assert.equal(record.timestamp, recipe.provenance.sourceRevisionTimestamp);
    assert.equal(record.dishFamilyId, recipe.corpusMetadata.dishFamilyId);
    assert.equal(record.admissionState, recipe.corpusMetadata.admissionState);
    assert.equal(record.recommendationState, recipe.governance.recommendationState);
    assert.equal(record.nutritionState, recipe.nutrition.estimationState);
  }
});

test("Gate F2 compact index is metadata-only and retains exact per-record provenance", async () => {
  const index = buildGateF2CompactIndex(ledger);
  const generated = await readFile(
    new URL("../data/generated/wikibooks-gate-f2-index-v1.json", import.meta.url),
    "utf8"
  );
  assert.equal(generated, `${JSON.stringify(index)}\n`);

  assert.equal(index.runtimeActivationAuthorized, false);
  assert.equal(index.admittedRecordCount, 8);
  assert.equal(index.rejectedRecordCount, 5);

  for (const record of index.records) {
    assert.match(record.provenance.sourcePageTitle, /^Cookbook:/);
    assert.ok(Number.isInteger(record.provenance.sourcePageId));
    assert.ok(Number.isInteger(record.provenance.sourceRevisionId));
    assert.match(record.provenance.sourceRevisionUrl, /oldid=\d+$/);
    assert.equal(record.provenance.license, "CC-BY-SA-4.0");
    assert.equal(record.provenance.mediaIncluded, false);
    assert.equal(record.provenance.sourceNutritionImportedAsAuthority, false);
    assert.equal(record.nutritionState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
    assert.equal("ingredients" in record, false);
    assert.equal("instructions" in record, false);
    assert.equal("sourceText" in record, false);
  }
});

test("Gate F2 generated control-plane index is not imported by the runtime corpus", async () => {
  const corpusModule = await readFile(new URL("../src/data/corpus-v1.js", import.meta.url), "utf8");
  assert.equal(corpusModule.includes("wikibooks-gate-f2"), false);
  assert.equal(corpusModule.includes("data/generated"), false);
  assert.equal(ledger.runtimeActivationAuthorized, false);
});

test("Gate F2 accepts future exact-revision discovery metadata without granting admission", () => {
  const candidate = structuredClone(ledger);
  candidate.records.push({
    id: "wikibooks_discovery_example",
    pageid: 999999999,
    title: "Cookbook:Discovery Example",
    revid: 999999999,
    timestamp: "2026-09-01T10:00:00Z",
    reviewState: "DISCOVERED_UNREVIEWED",
    recommendationState: "NOT_APPLICABLE",
    hardMetadataState: "NOT_REVIEWED",
    ingredientMappingState: "NOT_REVIEWED",
    nutritionState: "NOT_APPLICABLE",
    runtimeArtifact: null,
    coverage: null
  });

  assert.deepEqual(validateGateF2Ledger(candidate), []);
  const report = gateF2CoverageReport(candidate);
  assert.equal(report.discoveryUnreviewedCount, 1);
  assert.equal(report.admittedCount, 8);
  assert.equal(report.searchOnlyCount, 2);
});

test("Gate F2 fails closed when an unreviewed discovery row tries to become runtime-active", () => {
  const candidate = structuredClone(ledger);
  candidate.records.push({
    id: "wikibooks_invalid_runtime_candidate",
    pageid: 999999998,
    title: "Cookbook:Invalid Runtime Candidate",
    revid: 999999998,
    timestamp: "2026-09-01T10:00:00Z",
    reviewState: "DISCOVERED_UNREVIEWED",
    recommendationState: "SEARCH_ONLY",
    hardMetadataState: "NOT_REVIEWED",
    ingredientMappingState: "NOT_REVIEWED",
    nutritionState: "NOT_APPLICABLE",
    runtimeArtifact: { module: "future.js", recipeId: "bad" },
    coverage: null
  });

  const errors = validateGateF2Ledger(candidate);
  assert.ok(errors.some(error => error.includes("unadmitted record runtimeArtifact must be null")));
  assert.ok(errors.some(error => error.includes("recommendationState must be NOT_APPLICABLE")));
});
