import test from "node:test";
import assert from "node:assert/strict";

import {
  FORKRECIPE_STEP7E_EXPECTED_COMMIT,
  FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT,
  buildForkRecipePilotPacket,
  buildForkRecipeStep7ePilot,
  forkRecipeDataErrors,
  forkRecipeSourceContract,
  sanitizeForkRecipeSourceRecord
} from "../scripts/forkrecipe-step7e-core.mjs";

function sourceRecipe(index = 0, overrides = {}) {
  const slug = overrides.slug || `test-recipe-${String(index).padStart(4, "0")}`;
  return {
    repoId: `master_test_${index}`,
    parentRepoId: null,
    slug,
    author: "ForkRecipe Kitchen",
    title: overrides.title || `Test Recipe ${index}`,
    description: "Pinned source recipe used only to test the Step 7E adapter.",
    cuisine: "Test",
    culture: "Test",
    category: "proteins",
    tags: ["test"],
    difficulty: 2,
    activeTime: "20 min",
    totalTime: "40 min",
    ratioSystem: "parts",
    stars: 0,
    forks: 0,
    contributors: 1,
    license: "CC-BY-SA",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    flavorRadar: { sweet: 0, salty: 1, sour: 0, bitter: 0, umami: 1, heat: 0 },
    ingredients: [
      { ingId: "ing_01", role: "Protein", name: "Test ingredient", ratioValue: 100, defaultUnit: "parts", substitutions: [] }
    ],
    processNodes: [
      { nodeId: "step_1", action: "Cook", inputs: ["ing_01"], outputState: "done", instructions: "Cook until done." }
    ],
    ...overrides
  };
}

function expectedEntries() {
  return Array.from({ length: FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT }, (_, index) => {
    const recipe = sourceRecipe(index);
    return { fileName: `${recipe.slug}.js`, recipe };
  });
}

test("ForkRecipe Step 7E source contract is pinned, offline-at-runtime and cannot auto-admit", () => {
  const source = forkRecipeSourceContract();
  assert.equal(source.versioningMode, "PINNED_GIT_COMMIT");
  assert.equal(source.runtimeFetch, false);
  assert.equal(source.mediaState, "EXCLUDED");
  assert.equal(source.sourceNutritionImportedAsAuthority, false);
  assert.equal(source.automaticAdmissionAuthorized, false);
});

test("ForkRecipe source packet strips ungoverned nutrition/media fields and never promotes ratios", () => {
  const recipe = sourceRecipe(1, {
    nutrition: { calories: 999 },
    image: "https://example.invalid/image.jpg"
  });
  const sanitized = sanitizeForkRecipeSourceRecord(recipe);
  assert.equal("nutrition" in sanitized, false);
  assert.equal("image" in sanitized, false);

  const packet = buildForkRecipePilotPacket(recipe, {
    fileName: `${recipe.slug}.js`,
    sourceRightsVerified: true
  });
  assert.equal(packet.boundaries.sourceNutritionImportedAsAuthority, false);
  assert.equal(packet.boundaries.dietaryOrAllergenClaimsDerived, false);
  assert.equal(packet.boundaries.recommendationEligible, false);
  assert.equal(packet.boundaries.publicRuntimeActivationAuthorized, false);
  assert.equal(packet.boundaries.ratioValuesPromotedToAbsoluteQuantities, false);
  assert.equal(packet.rights.mediaIncluded, false);
  assert.match(packet.packetSha256, /^[0-9a-f]{64}$/);
});

test("ForkRecipe record validation fails closed on source-license or ratio-schema drift", () => {
  const recipe = sourceRecipe(2, { license: "UNKNOWN", ratioSystem: "mystery" });
  const errors = forkRecipeDataErrors(recipe, `${recipe.slug}.js`);
  assert.ok(errors.some(error => error.includes("unexpected record license")));
  assert.ok(errors.some(error => error.includes("unsupported ratioSystem")));
});

test("exact 915-record pinned cohort can pass only as protected source-pilot admission", () => {
  assert.equal(FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT, 915);
  const pilot = buildForkRecipeStep7ePilot(expectedEntries(), {
    commit: FORKRECIPE_STEP7E_EXPECTED_COMMIT,
    sourceRightsVerified: true,
    publicTitles: ["Test Recipe 0"]
  });
  assert.equal(pilot.pass, true);
  assert.equal(pilot.audit.terminalState, "STEP_7E_FORKRECIPE_PINNED_SOURCE_AUDIT_PASS_LIVE_PILOT_PENDING");
  assert.equal(pilot.audit.decisions.admittedProtectedSourcePilotOnly, FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT);
  assert.equal(pilot.audit.decisions.recommendationEligible, 0);
  assert.equal(pilot.audit.decisions.publicRuntimeActivated, 0);
  assert.equal(pilot.audit.dataQuality.publicTitleCollisionCount, 1);
  assert.equal(pilot.audit.dataQuality.ratioValuesPromotedToAbsoluteQuantities, false);
  assert.equal(pilot.audit.boundaries.futureRecipeBodyD1ShardsCreated, false);
  assert.equal(pilot.controlPlane.runtimeActivationAuthorized, false);
  assert.equal(pilot.controlPlane.automaticAdmissionAuthorized, false);
  assert.equal(pilot.pipeline.runtimeActivationAuthorized, false);
  assert.equal(pilot.packets.length, FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT);

  for (const record of pilot.controlPlane.records) {
    assert.equal(record.reviewState, "ADMITTED");
    assert.equal(record.rightsState, "ADMIT_RIGHTS_VERIFIED");
    assert.equal(record.admissionState, "ADMIT_PROTECTED_SOURCE_PILOT_ONLY");
    assert.equal(record.nutritionState, "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
    assert.equal(record.runtimeActivationAuthorized, false);
    assert.equal(record.runtimeArtifact.recommendationState, "SOURCE_PILOT_ONLY_NOT_RECOMMENDATION_ELIGIBLE");
  }
});

test("unverified source-level rights hold the entire cohort instead of admitting it", () => {
  const pilot = buildForkRecipeStep7ePilot(expectedEntries(), {
    sourceRightsVerified: false
  });
  assert.equal(pilot.pass, false);
  assert.equal(pilot.audit.decisions.admittedProtectedSourcePilotOnly, 0);
  assert.equal(pilot.audit.decisions.held, FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT);
  assert.equal(pilot.audit.terminalState, "STEP_7E_FORKRECIPE_SOURCE_AUDIT_HOLD");
  assert.ok(pilot.controlPlane.records.every(record => record.reviewState === "HELD"));
  assert.ok(pilot.controlPlane.records.every(record => record.rightsState === "HOLD_RIGHTS_AMBIGUOUS"));
});

test("wrong upstream commit is rejected before a pilot can be constructed", () => {
  assert.throws(() => buildForkRecipeStep7ePilot(expectedEntries(), {
    commit: "0000000000000000000000000000000000000000",
    sourceRightsVerified: true
  }), /requires pinned commit/);
});
