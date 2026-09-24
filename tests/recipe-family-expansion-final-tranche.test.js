import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const observations = "data/generated/recipe-family-expansion-final-tranche-source-observations.json";

function run() {
  const dir = mkdtempSync(join(tmpdir(), "culinary-recipe-family-final-tranche-"));
  const output = join(dir, "result.json");
  execFileSync(process.execPath, [
    "scripts/run-recipe-family-expansion-final-tranche.mjs",
    `--output=${output}`
  ], { encoding: "utf8" });
  return JSON.parse(readFileSync(output, "utf8"));
}

test("final tranche source packet passes the frozen source-compliance validator", () => {
  const stdout = execFileSync(process.execPath, [
    "scripts/validate-recipe-family-source-compliance.mjs",
    observations
  ], { encoding: "utf8" });
  const result = JSON.parse(stdout);
  assert.equal(result.pass, true);
  assert.equal(result.eligibleObservations, 8);
  assert.equal(result.protectedSourceExpressionPersisted, false);
});

test("final tranche earns tomato pasta sauce and ragu Bolognese candidate-only eligibility", () => {
  const result = run();
  assert.equal(result.pass, true);
  assert.equal(result.terminal, "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_FINAL_TRANCHE_PASS");
  assert.deepEqual(result.eligibleFamilyIds, [
    "basic_tomato_pasta_sauce",
    "ragu_bolognese_family"
  ]);
  assert.deepEqual(result.heldFamilyIds, []);

  const tomato = result.families.find(row => row.familyId === "basic_tomato_pasta_sauce");
  assert.equal(tomato.publisherCount, 3);
  assert.equal(tomato.publisherDiversityPass, true);
  assert.equal(tomato.requiredIngredientPass, true);
  assert.equal(tomato.requiredTechniquePass, true);
  assert.equal(tomato.appAuthoringEligible, true);
  const tomatoRatio = tomato.requiredQuantityState.find(row => row.roleId === "tomato").selected;
  assert.deepEqual(tomatoRatio.observedRange, { lower: 222.222222, upper: 266.666667 });
  assert.deepEqual(tomatoRatio.recommendedRange, { lower: 226.984127, upper: 254.166667 });
  assert.equal(tomatoRatio.robustCenter, 239.285715);
  assert.equal(tomatoRatio.distinctPublisherCount, 3);
  assert.equal(tomato.candidateAppOwnedRecipeProjection.activationAuthority, "NONE");

  const ragu = result.families.find(row => row.familyId === "ragu_bolognese_family");
  assert.equal(ragu.publisherCount, 3);
  assert.equal(ragu.publisherDiversityPass, true);
  assert.equal(ragu.requiredIngredientPass, true);
  assert.equal(ragu.requiredTechniquePass, true);
  assert.equal(ragu.appAuthoringEligible, true);
  const raguRatio = ragu.requiredQuantityState.find(row => row.roleId === "tomato").selected;
  assert.deepEqual(raguRatio.observedRange, { lower: 36.363636, upper: 100 });
  assert.deepEqual(raguRatio.recommendedRange, { lower: 84.090909, upper: 100 });
  assert.equal(raguRatio.robustCenter, 100);
  assert.equal(raguRatio.distinctPublisherCount, 3);
  assert.equal(ragu.candidateAppOwnedRecipeProjection.activationAuthority, "NONE");
});

test("final tranche closes the frozen expansion set without changing runtime firewalls", () => {
  const result = run();
  assert.equal(result.aggregate.publicRuntimeRecipeCountChanged, false);
  assert.equal(result.aggregate.protectedCorpusChanged, false);
  assert.equal(result.aggregate.d1Reads, 0);
  assert.equal(result.aggregate.d1Writes, 0);
  assert.equal(result.aggregate.knowledgeCoreWrites, 0);
  assert.equal(result.aggregate.youtubeStateChanges, 0);
  assert.equal(result.aggregate.newShard, false);
  assert.equal(result.aggregate.billingExpansion, false);
  assert.equal(result.sourceComplianceSummary.materiallyNewSourceClassIntroduced, false);
  assert.equal(result.sourceComplianceSummary.uiLegalConformanceRetriggerRequired, false);
  assert.deepEqual(result.completedExpansionFamilies, [
    "guacamole",
    "pancakes",
    "tortilla_espanola",
    "cacio_e_pepe",
    "pesto_genovese",
    "basic_tomato_pasta_sauce",
    "ragu_bolognese_family"
  ]);
  assert.deepEqual(result.heldExpansionFamilies, ["pizza_margherita"]);
  assert.deepEqual(result.preservedPrototypeFamilies, ["carbonara", "hummus"]);
  assert.deepEqual(result.remainingFrozenFamilies, []);
  assert.equal(result.publicActivationAuthorized, false);
  assert.equal(result.nextAction, "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_CLOSEOUT_REVIEW");
});
