import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const observations = "data/generated/recipe-family-expansion-tranche-2-source-observations.json";

function run() {
  const dir = mkdtempSync(join(tmpdir(), "culinary-recipe-family-tranche-2-"));
  const output = join(dir, "result.json");
  execFileSync(process.execPath, [
    "scripts/run-recipe-family-expansion-tranche-2.mjs",
    `--output=${output}`
  ], { encoding: "utf8" });
  return JSON.parse(readFileSync(output, "utf8"));
}

test("tranche 2 source packet passes the frozen source-compliance validator", () => {
  const stdout = execFileSync(process.execPath, [
    "scripts/validate-recipe-family-source-compliance.mjs",
    observations
  ], { encoding: "utf8" });
  const result = JSON.parse(stdout);
  assert.equal(result.pass, true);
  assert.equal(result.eligibleObservations, 12);
  assert.equal(result.protectedSourceExpressionPersisted, false);
});

test("tranche 2 earns cacio e pepe and pesto while holding pizza on execution context", () => {
  const result = run();
  assert.equal(result.pass, true);
  assert.equal(result.terminal, "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_TRANCHE_2_PASS_WITH_EXPLICIT_PIZZA_HOLD");
  assert.deepEqual(result.eligibleFamilyIds, ["cacio_e_pepe", "pesto_genovese"]);
  assert.deepEqual(result.heldFamilyIds, ["pizza_margherita"]);

  const cacio = result.families.find(row => row.familyId === "cacio_e_pepe");
  assert.equal(cacio.publisherCount, 3);
  assert.equal(cacio.publisherDiversityPass, true);
  assert.equal(cacio.appAuthoringEligible, true);
  const cacioCheese = cacio.requiredQuantityState.find(row => row.roleId === "pecorino").selected;
  assert.deepEqual(cacioCheese.observedRange, { lower: 31.25, upper: 41.666667 });
  assert.deepEqual(cacioCheese.recommendedRange, { lower: 32.291667, upper: 37.5 });
  assert.equal(cacioCheese.robustCenter, 33.333333);
  assert.equal(cacioCheese.distinctPublisherCount, 2);
  assert.equal(cacio.candidateAppOwnedRecipeProjection.activationAuthority, "NONE");

  const pesto = result.families.find(row => row.familyId === "pesto_genovese");
  assert.equal(pesto.publisherCount, 4);
  assert.equal(pesto.publisherDiversityPass, true);
  assert.equal(pesto.appAuthoringEligible, true);
  const pestoGarlic = pesto.requiredQuantityState.find(row => row.roleId === "garlic").selected;
  assert.deepEqual(pestoGarlic.observedRange, { lower: 2, upper: 4 });
  assert.deepEqual(pestoGarlic.recommendedRange, { lower: 2.928572, upper: 3.5 });
  assert.equal(pestoGarlic.robustCenter, 3);
  assert.equal(pestoGarlic.distinctPublisherCount, 3);
  assert.equal(pesto.candidateAppOwnedRecipeProjection.activationAuthority, "NONE");

  const pizza = result.families.find(row => row.familyId === "pizza_margherita");
  assert.equal(pizza.publisherCount, 4);
  assert.equal(pizza.publisherDiversityPass, true);
  assert.equal(pizza.appAuthoringEligible, false);
  assert.equal(pizza.candidateAppOwnedRecipeProjection, null);
  const mozzarella = pizza.requiredQuantityState.find(row => row.roleId === "mozzarella").selected;
  assert.deepEqual(mozzarella.observedRange, { lower: 66.666667, upper: 80 });
  assert.deepEqual(mozzarella.recommendedRange, { lower: 73.333334, upper: 80 });
  assert.equal(mozzarella.robustCenter, 80);
  assert.equal(mozzarella.distinctPublisherCount, 3);
  const bakeTemperature = pizza.requiredQuantityState.find(row => row.roleId === "bake_temperature");
  assert.equal(bakeTemperature.pass, false);
  assert.equal(bakeTemperature.selected, null);

  assert.equal(result.explicitHolds.pizza_margherita.homeOvenTemperatureRangeEarned, false);
  assert.equal(result.explicitHolds.pizza_margherita.woodFiredAndHomeOvenSemanticsKeptSeparate, true);
  assert.match(result.explicitHolds.pizza_margherita.reason, /HOME_OVEN_TIME_TEMPERATURE_EQUIPMENT_CONTEXT/);
});

test("tranche 2 preserves runtime firewalls and advances only to the final frozen pair", () => {
  const result = run();
  assert.equal(result.aggregate.publicRuntimeRecipeCountChanged, false);
  assert.equal(result.aggregate.protectedCorpusChanged, false);
  assert.equal(result.aggregate.d1Reads, 0);
  assert.equal(result.aggregate.d1Writes, 0);
  assert.equal(result.aggregate.knowledgeCoreWrites, 0);
  assert.equal(result.aggregate.youtubeStateChanges, 0);
  assert.equal(result.aggregate.newShard, false);
  assert.equal(result.aggregate.billingExpansion, false);
  assert.deepEqual(result.completedExpansionFamilies, [
    "guacamole",
    "pancakes",
    "tortilla_espanola",
    "cacio_e_pepe",
    "pesto_genovese"
  ]);
  assert.deepEqual(result.remainingFrozenFamilies, [
    "basic_tomato_pasta_sauce",
    "ragu_bolognese_family"
  ]);
  assert.deepEqual(result.preservedPrototypeFamilies, ["carbonara", "hummus"]);
  assert.equal(result.nextAction, "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_FINAL_TRANCHE_NONPUBLIC");
});
