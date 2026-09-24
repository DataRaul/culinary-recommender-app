import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const observations = "data/generated/recipe-family-expansion-tranche-1-source-observations.json";

test("tranche 1 source packet passes the frozen source-compliance validator", () => {
  const stdout = execFileSync(process.execPath, [
    "scripts/validate-recipe-family-source-compliance.mjs",
    observations
  ], { encoding: "utf8" });
  const result = JSON.parse(stdout);
  assert.equal(result.pass, true);
  assert.equal(result.eligibleObservations, 12);
  assert.equal(result.protectedSourceExpressionPersisted, false);
});

test("tranche 1 deterministically earns three nonpublic app-authoring candidates", () => {
  const dir = mkdtempSync(join(tmpdir(), "culinary-recipe-family-tranche-1-"));
  const output = join(dir, "result.json");
  execFileSync(process.execPath, [
    "scripts/run-recipe-family-expansion-tranche-1.mjs",
    `--output=${output}`
  ], { encoding: "utf8" });
  const result = JSON.parse(readFileSync(output, "utf8"));

  assert.equal(result.pass, true);
  assert.equal(result.terminal, "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_TRANCHE_1_PASS");
  assert.deepEqual(result.eligibleFamilyIds, ["guacamole", "pancakes", "tortilla_espanola"]);
  assert.equal(result.observationCount, 12);

  for (const family of result.families) {
    assert.equal(family.publisherDiversityPass, true);
    assert.ok(family.publisherCount >= 3);
    assert.equal(family.appAuthoringEligible, true);
    assert.equal(family.candidateAppOwnedRecipeProjection.activationAuthority, "NONE");
    assert.equal(family.candidateAppOwnedRecipeProjection.state, "CANDIDATE_ONLY_NOT_PUBLIC_OR_RUNTIME_ADMITTED");
  }

  const guacamole = result.families.find(row => row.familyId === "guacamole");
  const guacLime = guacamole.requiredQuantityState.find(row => row.roleId === "lime").selected;
  assert.deepEqual(guacLime.observedRange, { lower: 0.125, upper: 0.75 });
  assert.deepEqual(guacLime.recommendedRange, { lower: 0.1875, upper: 0.5 });
  assert.equal(guacLime.robustCenter, 0.25);
  assert.equal(guacLime.distinctPublisherCount, 2);

  const pancakes = result.families.find(row => row.familyId === "pancakes");
  const pancakeLiquid = pancakes.requiredQuantityState.find(row => row.roleId === "cultured_or_milk_liquid").selected;
  const pancakeEgg = pancakes.requiredQuantityState.find(row => row.roleId === "egg").selected;
  assert.deepEqual(pancakeLiquid.recommendedRange, { lower: 1, upper: 1 });
  assert.deepEqual(pancakeEgg.recommendedRange, { lower: 1, upper: 1 });
  assert.equal(pancakeLiquid.distinctPublisherCount, 2);
  assert.equal(pancakeEgg.distinctPublisherCount, 2);

  const tortilla = result.families.find(row => row.familyId === "tortilla_espanola");
  const tortillaEgg = tortilla.requiredQuantityState.find(row => row.roleId === "egg").selected;
  assert.deepEqual(tortillaEgg.observedRange, { lower: 0.8, upper: 1.333333 });
  assert.deepEqual(tortillaEgg.recommendedRange, { lower: 1, upper: 1.266667 });
  assert.equal(tortillaEgg.robustCenter, 1.2);
  assert.equal(tortillaEgg.distinctPublisherCount, 2);

  assert.equal(result.aggregate.publicRuntimeRecipeCountChanged, false);
  assert.equal(result.aggregate.protectedCorpusChanged, false);
  assert.equal(result.aggregate.d1Reads, 0);
  assert.equal(result.aggregate.d1Writes, 0);
  assert.equal(result.aggregate.newShard, false);
  assert.equal(result.aggregate.billingExpansion, false);
});

test("tranche 1 leaves the frozen remaining cohort explicit", () => {
  const dir = mkdtempSync(join(tmpdir(), "culinary-recipe-family-tranche-1-next-"));
  const output = join(dir, "result.json");
  execFileSync(process.execPath, [
    "scripts/run-recipe-family-expansion-tranche-1.mjs",
    `--output=${output}`
  ], { encoding: "utf8" });
  const result = JSON.parse(readFileSync(output, "utf8"));
  assert.deepEqual(result.remainingFrozenFamilies, [
    "pizza_margherita",
    "cacio_e_pepe",
    "pesto_genovese",
    "basic_tomato_pasta_sauce",
    "ragu_bolognese_family"
  ]);
  assert.deepEqual(result.preservedPrototypeFamilies, ["carbonara", "hummus"]);
  assert.equal(result.nextAction, "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_TRANCHE_2_NONPUBLIC");
});
