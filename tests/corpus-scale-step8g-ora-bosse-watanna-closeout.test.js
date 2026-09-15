import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-bosse-watanna-1914-measurement.json", import.meta.url), "utf8"));

test("Bosse Watanna 1914 measurement evidence freezes the exact v8004-based PASS", () => {
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminal, "STEP_8G_ORA_BOSSE_WATANNA_1914_MEASUREMENT_EARNED_COHORT_CANDIDATE");
  assert.equal(evidence.baseline.protectedComposedRecipeCount, 2355);
  assert.equal(evidence.baseline.expectedActiveProtectedVersion, "v8004");
  assert.equal(evidence.candidate.recipeCount, 109);
  assert.equal(evidence.candidate.parseableRecipeCount, 109);
  assert.ok(evidence.candidate.uniqueTitleRatio >= 0.8);
  assert.equal(evidence.candidate.exactBaselineTitleOverlapCount, 0);
  assert.ok(evidence.candidate.novelTitleRatio >= 0.5);
  assert.equal(evidence.gates.rightsAuditPass, true);
  assert.equal(evidence.gates.structuralQualityPass, true);
  assert.equal(evidence.gates.culinaryCoveragePass, true);
});

test("measurement PASS earns prewrite only and preserves all live/public/cost firewalls", () => {
  assert.equal(evidence.interpretation.prewriteEarned, true);
  assert.equal(evidence.interpretation.liveProtectedPopulationAuthorized, false);
  assert.equal(evidence.interpretation.recommendationAdmissionAuthorized, false);
  assert.equal(evidence.boundaries.liveD1WritesAuthorized, false);
  assert.equal(evidence.boundaries.protectedPopulationAuthorized, false);
  assert.equal(evidence.boundaries.publicRuntimeChangeAuthorized, false);
  assert.equal(evidence.boundaries.recommendationAdmissionAuthorized, false);
  assert.equal(evidence.boundaries.thirdShardAuthorized, false);
  assert.equal(evidence.boundaries.d1BudgetExpansionAuthorized, false);
  assert.equal(evidence.boundaries.billingExpansionAuthorized, false);
  assert.equal(evidence.boundaries.culturalAuthenticityAuthorityImported, false);
  assert.equal(evidence.boundaries.nutritionLaneModified, false);
  assert.equal(evidence.boundaries.youtubeCulinaryStateModified, false);
  assert.equal(evidence.boundaries.knowledgeCoreWriteAuthorized, false);
});

test("low ontology resolution remains explicit rather than silently promoted", () => {
  assert.ok(evidence.candidate.ontologyResolvedOccurrenceRatio < 0.2);
  assert.equal(evidence.candidate.culturalAuthorityImported, false);
  assert.equal(evidence.candidate.historicalSourceLabelOnly, true);
  assert.match(evidence.interpretation.ontologyReviewCostSignal, /^HIGH__/);
});
