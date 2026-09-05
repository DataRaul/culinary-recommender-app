import test from "node:test";
import assert from "node:assert/strict";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { materializePortableCorpusArtifacts } from "../scripts/corpus-scale-step3-core.mjs";
import {
  buildBoundedRegressionRecipeSet,
  buildIncrementalValidationPlan,
  selectDeterministicRegressionSample,
  validateCanonicalRecipeShape,
  validateGoldenRecipeRetention,
  validateIncrementalArtifacts,
  validateRecipeProvenanceInvariant
} from "../scripts/corpus-scale-step6-core.mjs";

function cloneRecipes() {
  return structuredClone(ALL_RECIPES);
}

function artifacts(recipes, version, metadataShardSize = 20) {
  return materializePortableCorpusArtifacts(recipes, { version, metadataShardSize });
}

function appendedRecipe() {
  const recipe = structuredClone(ALL_RECIPES[0]);
  recipe.id = "step6_incremental_added_recipe";
  recipe.identity.canonicalTitle = "Step 6 Incremental Added Recipe";
  return recipe;
}

function changedInstructionRecipes() {
  const recipes = cloneRecipes();
  const recipe = recipes[0];
  const original = recipe.instructions[0];
  recipe.instructions[0] = typeof original === "string"
    ? `${original} Step6 deterministic edit.`
    : { ...original, text: `${original.text || "Instruction"} Step6 deterministic edit.` };
  return recipes;
}

test("append-only one-record change produces a bounded incremental validation plan", () => {
  const previous = artifacts(ALL_RECIPES, "v0001");
  const nextRecipes = [...cloneRecipes(), appendedRecipe()];
  const next = artifacts(nextRecipes, "v0002");
  const plan = buildIncrementalValidationPlan(previous.files, next.files, {
    previousVersion: "v0001",
    nextVersion: "v0002"
  });

  assert.equal(plan.mode, "INCREMENTAL");
  assert.deepEqual(plan.addedRecipeIds, ["step6_incremental_added_recipe"]);
  assert.deepEqual(plan.removedRecipeIds, []);
  assert.deepEqual(plan.ordinalDrift, []);
  assert.equal(plan.invariants.existingRecipeOrdinalsStable, true);
  assert.ok(plan.changedIndexKeys.length > 0);
  assert.ok(plan.affectedMetadataShards.some(value => value.startsWith("v0002:")));
  assert.equal(plan.invariants.full100kBenchmarkRemainsSeparate, true);

  const result = validateIncrementalArtifacts(next.files, plan);
  assert.equal(result.pass, true);
  assert.equal(result.status, "INCREMENTAL_VALIDATION_PASS");
  assert.deepEqual(result.validatedRecipeIds, ["step6_incremental_added_recipe"]);
  assert.equal(result.full100kBenchmarkExecuted, false);
  assert.equal(result.runtimeActivationAuthorized, false);
});

test("detail-only recipe change validates only the changed body and does not invent index changes", () => {
  const previous = artifacts(ALL_RECIPES, "v0001");
  const nextRecipes = changedInstructionRecipes();
  const next = artifacts(nextRecipes, "v0002");
  const plan = buildIncrementalValidationPlan(previous.files, next.files, {
    previousVersion: "v0001",
    nextVersion: "v0002"
  });

  assert.equal(plan.mode, "INCREMENTAL");
  assert.deepEqual(plan.changedRecipeIds, [ALL_RECIPES[0].id]);
  assert.deepEqual(plan.metadataChangedRecipeIds, []);
  assert.deepEqual(plan.changedIndexKeys, []);
  const result = validateIncrementalArtifacts(next.files, plan);
  assert.equal(result.pass, true);
  assert.deepEqual(result.validatedRecipeIds, [ALL_RECIPES[0].id]);
  assert.equal(result.skippedUnchangedRecipeCount, ALL_RECIPES.length - 1);
});

test("existing ordinal drift fails over to full validation instead of pretending incrementality", () => {
  const previous = artifacts(ALL_RECIPES, "v0001");
  const reordered = cloneRecipes();
  [reordered[0], reordered[1]] = [reordered[1], reordered[0]];
  const next = artifacts(reordered, "v0002");
  const plan = buildIncrementalValidationPlan(previous.files, next.files, {
    previousVersion: "v0001",
    nextVersion: "v0002"
  });

  assert.equal(plan.mode, "FULL_VALIDATION_REQUIRED");
  assert.ok(plan.fullValidationReasons.includes("EXISTING_RECIPE_ORDINAL_DRIFT"));
  assert.ok(plan.ordinalDrift.length >= 2);
  const result = validateIncrementalArtifacts(next.files, plan);
  assert.equal(result.pass, false);
  assert.equal(result.status, "FULL_VALIDATION_REQUIRED");
});

test("incremental budget is explicit and large relative churn fails over to full validation", () => {
  const previous = artifacts(ALL_RECIPES, "v0001");
  const next = artifacts([...cloneRecipes(), appendedRecipe()], "v0002");
  const plan = buildIncrementalValidationPlan(previous.files, next.files, {
    previousVersion: "v0001",
    nextVersion: "v0002",
    maxChangeFraction: 0.001
  });
  assert.equal(plan.mode, "FULL_VALIDATION_REQUIRED");
  assert.ok(plan.fullValidationReasons.includes("CHANGESET_EXCEEDS_INCREMENTAL_BUDGET"));
  assert.equal(plan.threshold.exceeded, true);
});

test("tampered changed detail fails closed against metadata hash/byte invariants", () => {
  const previous = artifacts(ALL_RECIPES, "v0001");
  const nextRecipes = changedInstructionRecipes();
  const next = artifacts(nextRecipes, "v0002");
  const plan = buildIncrementalValidationPlan(previous.files, next.files, {
    previousVersion: "v0001",
    nextVersion: "v0002"
  });
  const rowId = plan.changedRecipeIds[0];
  const manifest = JSON.parse(next.files.get("corpus/v0002/manifest.json"));
  const rows = manifest.metadata.shards.flatMap(descriptor =>
    JSON.parse(next.files.get(`corpus/v0002/${descriptor.path}`)).rows
  );
  const row = rows.find(item => item.id === rowId);
  const tampered = new Map(next.files);
  tampered.set(`corpus/v0002/${row.detailPath}`, `${tampered.get(`corpus/v0002/${row.detailPath}`)} `);

  const result = validateIncrementalArtifacts(tampered, plan);
  assert.equal(result.pass, false);
  assert.ok(result.errors.some(error => error.includes("detail byte count mismatch") || error.includes("detail sha256 mismatch")));
});

test("tampered changed index is detected fail-closed", () => {
  const previous = artifacts(ALL_RECIPES, "v0001");
  const next = artifacts([...cloneRecipes(), appendedRecipe()], "v0002");
  const plan = buildIncrementalValidationPlan(previous.files, next.files, {
    previousVersion: "v0001",
    nextVersion: "v0002"
  });
  assert.ok(plan.changedIndexKeys.length > 0);

  const manifest = JSON.parse(next.files.get("corpus/v0002/manifest.json"));
  const descriptor = manifest.indexes.objects.find(item => item.key === plan.changedIndexKeys[0]);
  const tampered = new Map(next.files);
  const path = `corpus/v0002/${descriptor.path}`;
  const payload = JSON.parse(tampered.get(path));
  payload.ordinals = payload.ordinals.slice(1);
  payload.count = payload.ordinals.length;
  tampered.set(path, JSON.stringify(payload));

  assert.throws(
    () => validateIncrementalArtifacts(tampered, plan),
    /index object (byte count|sha256) mismatch/
  );
});

test("external changed recipe requires immutable provenance and keeps source nutrition non-authoritative", () => {
  const externalIndex = ALL_RECIPES.findIndex(recipe => recipe.provenance?.sourceType === "EXTERNAL_OPEN_RECIPE");
  assert.ok(externalIndex >= 0);
  const valid = ALL_RECIPES[externalIndex];
  assert.deepEqual(validateCanonicalRecipeShape(valid), []);
  assert.deepEqual(validateRecipeProvenanceInvariant(valid), []);

  const previous = artifacts(ALL_RECIPES, "v0001");
  const nextRecipes = cloneRecipes();
  nextRecipes[externalIndex].provenance.sourceRevisionUrl = null;
  nextRecipes[externalIndex].governance.sourceNutritionIgnoredForAuthority = false;
  const next = artifacts(nextRecipes, "v0002");
  const plan = buildIncrementalValidationPlan(previous.files, next.files, {
    previousVersion: "v0001",
    nextVersion: "v0002"
  });
  const result = validateIncrementalArtifacts(next.files, plan);
  assert.equal(result.pass, false);
  assert.ok(result.errors.some(error => error.includes("immutable source locator")));
  assert.ok(result.errors.some(error => error.includes("source nutrition must remain non-authoritative")));
});

test("reviewed golden corpus must remain byte-equivalent inside a larger next corpus", () => {
  const next = artifacts([...cloneRecipes(), appendedRecipe()], "v0002");
  const pass = validateGoldenRecipeRetention(ALL_RECIPES, next.files, { nextVersion: "v0002" });
  assert.equal(pass.pass, true);
  assert.equal(pass.goldenRecipeCount, 84);

  const changed = artifacts(changedInstructionRecipes(), "v0002");
  const fail = validateGoldenRecipeRetention(ALL_RECIPES, changed.files, { nextVersion: "v0002" });
  assert.equal(fail.pass, false);
  assert.ok(fail.errors.includes(`${ALL_RECIPES[0].id}: golden recipe changed`));
});

test("deterministic regression sampling is bounded and seed-stable", () => {
  const ids = Array.from({ length: 1_000 }, (_, index) => `recipe_${String(index).padStart(4, "0")}`);
  const a = selectDeterministicRegressionSample(ids, { sampleSize: 32, seed: "same" });
  const b = selectDeterministicRegressionSample([...ids].reverse(), { sampleSize: 32, seed: "same" });
  const c = selectDeterministicRegressionSample(ids, { sampleSize: 32, seed: "different" });
  assert.deepEqual(a, b);
  assert.equal(a.length, 32);
  assert.notDeepEqual(a, c);
});

test("bounded changed/stable sample preserves deterministic ranking without 100k profile explosion", () => {
  const previous = artifacts(ALL_RECIPES, "v0001");
  const nextRecipes = [...cloneRecipes(), appendedRecipe()];
  const next = artifacts(nextRecipes, "v0002");
  const plan = buildIncrementalValidationPlan(previous.files, next.files, {
    previousVersion: "v0001",
    nextVersion: "v0002"
  });
  const sample = buildBoundedRegressionRecipeSet(next.files, plan, {
    changedSampleSize: 8,
    stableSampleSize: 16
  });
  assert.ok(sample.recipes.length <= 24);
  assert.ok(sample.recipeIds.includes("step6_incremental_added_recipe"));

  const profiles = [
    normalizeProfile(DEFAULT_PROFILE),
    normalizeProfile({ ...DEFAULT_PROFILE, maxMinutes: 180, skill: 4, budget: 4, cuisinePreferences: [], priorityPacks: [] })
  ];
  for (const profile of profiles) {
    const first = rankRecipes(sample.recipes, profile, { mealType: "dinner", mode: "search" });
    const second = rankRecipes(sample.recipes, profile, { mealType: "dinner", mode: "search" });
    assert.deepEqual(second, first);
  }
});
