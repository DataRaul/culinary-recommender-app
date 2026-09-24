import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildRecipeImageRegistry,
  validateRecipeImageAssetRecord,
  validateRecipeImagesP0Config
} from "../scripts/recipe-images-p0.mjs";

const config = JSON.parse(
  await readFile(new URL("../config/recipe_images_p0.json", import.meta.url), "utf8")
);

function asset(overrides = {}) {
  return {
    assetId: "img_spanish_tortilla_p0",
    recipeId: "spanish_potato_onion_tortilla",
    assetClass: "PROJECT_AUTHORED",
    reuseState: "PROJECT_OWNED_INTERNAL_AND_PUBLIC_APP_USE",
    provenance: {
      origin: "Project-authored P0 fixture",
      rightsBasis: "Project-owned test fixture; not sourced from a recipe provider"
    },
    contentSha256: "a".repeat(64),
    assetPath: "/assets/recipes/spanish_potato_onion_tortilla.webp",
    format: "webp",
    width: 960,
    height: 720,
    bytes: 120000,
    altText: "Potato and onion tortilla cut into wedges on a serving plate.",
    ...overrides
  };
}

test("Recipe Images P0 design contract passes against the current public runtime", () => {
  assert.deepEqual(validateRecipeImagesP0Config(config), []);
  assert.equal(config.scope.pilotRecipeCount, 6);
  assert.equal(config.scope.projectAuthoredRecipesOnly, true);
  assert.equal(config.authority.assetPublicationAuthorized, false);
  assert.equal(config.authority.publicRuntimeChangeAuthorized, false);
  assert.equal(config.nextGate, "D3_RECIPE_IMAGES_P0_ASSET_PILOT");
});

test("valid P0 asset records require same-origin provenance, alt text and bounded dimensions/bytes", () => {
  assert.deepEqual(validateRecipeImageAssetRecord(asset(), config), []);
  const registry = buildRecipeImageRegistry([asset()], config);
  assert.equal(registry.assetCount, 1);
  assert.equal(registry.completePilotCoverage, false);
  assert.equal(registry.runtimeActivationAuthorized, false);
  assert.equal(registry.externalMediaAdmissionAuthorized, false);
  assert.match(registry.registrySha256, /^[a-f0-9]{64}$/);
});

test("P0 rejects external or remote source-media authority", () => {
  for (const mutation of [
    { assetPath: "https://example.test/tortilla.webp" },
    { sourceImageUrl: "https://example.test/source.webp" },
    { remoteUrl: "https://example.test/source.webp" }
  ]) {
    const errors = validateRecipeImageAssetRecord(asset(mutation), config);
    assert.ok(errors.some(error => /same-origin|external\/remote/.test(error)));
  }
});

test("P0 rejects assets outside the selected authored pilot cohort", () => {
  const errors = validateRecipeImageAssetRecord(asset({ recipeId: "unitools_tortilla_espanola" }), config);
  assert.ok(errors.some(error => error.includes("pilot cohort")));
});

test("P0 enforces per-card and total transfer budgets deterministically", () => {
  assert.ok(validateRecipeImageAssetRecord(asset({ bytes: config.performanceBudgets.maxBytesPerCardAsset + 1 }), config)
    .some(error => error.includes("bytes exceed")));

  const records = config.scope.pilotRecipeIds.map((recipeId, index) => asset({
    assetId: `asset_${index}`,
    recipeId,
    assetPath: `/assets/recipes/${recipeId}.webp`,
    contentSha256: String(index + 1).padStart(64, "0"),
    bytes: 170000
  }));
  const first = buildRecipeImageRegistry(records, config);
  const second = buildRecipeImageRegistry([...records].reverse(), config);
  assert.equal(first.completePilotCoverage, true);
  assert.equal(first.totalBytes, 1020000);
  assert.equal(first.registrySha256, second.registrySha256);
});

test("images never become ranking, eligibility, nutrition, identity or source-rights authority", () => {
  for (const [key, value] of Object.entries(config.behaviorFirewalls)) {
    assert.equal(value, false, key);
  }
  for (const key of [
    "assetPublicationAuthorized",
    "publicRuntimeChangeAuthorized",
    "newExternalMediaAdmissionAuthorized",
    "protectedD1WriteAuthorized",
    "thirdD1ShardAuthorized",
    "paidMediaServiceAuthorized",
    "knowledgeCoreWriteAuthorized",
    "barbecueMutationAuthorized"
  ]) {
    const mutated = structuredClone(config);
    mutated.authority[key] = true;
    assert.ok(validateRecipeImagesP0Config(mutated).some(error => error.includes(key)));
  }
});
