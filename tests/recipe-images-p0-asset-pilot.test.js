import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  RECIPE_IMAGES_P0_ASSET_PILOT_TERMINAL,
  buildAssetRecord,
  buildRecipeImagesP0AssetPilot,
  validateAssetPilotConfig,
  validateSvgAssetText
} from "../scripts/recipe-images-p0-asset-pilot.mjs";

const design = JSON.parse(
  await readFile(new URL("../config/recipe_images_p0.json", import.meta.url), "utf8")
);
const pilot = JSON.parse(
  await readFile(new URL("../config/recipe_images_p0_asset_pilot.json", import.meta.url), "utf8")
);

test("asset pilot config covers exactly the six P0 project-authored recipes", () => {
  assert.deepEqual(validateAssetPilotConfig(pilot, design), []);
  assert.equal(pilot.assets.length, 6);
  assert.deepEqual(
    [...pilot.assets.map(row => row.recipeId)].sort(),
    [...design.scope.pilotRecipeIds].sort()
  );
  assert.equal(pilot.publicationBoundary.publicUiActivationAuthorized, false);
  assert.equal(pilot.publicationBoundary.externalMediaAdmissionAuthorized, false);
  assert.equal(pilot.authority.barbecueMutationAuthorized, false);
});

test("all six project-authored SVG assets validate and build a deterministic complete registry", async () => {
  const first = await buildRecipeImagesP0AssetPilot();
  const second = await buildRecipeImagesP0AssetPilot();

  assert.equal(first.evidence.pass, true);
  assert.equal(first.evidence.terminal, RECIPE_IMAGES_P0_ASSET_PILOT_TERMINAL);
  assert.equal(first.evidence.assetCount, 6);
  assert.equal(first.registry.completePilotCoverage, true);
  assert.equal(first.registry.externalMediaAdmissionAuthorized, false);
  assert.equal(first.registry.runtimeActivationAuthorized, false);
  assert.equal(first.registry.registrySha256, second.registry.registrySha256);
  assert.equal(first.evidence.evidenceSha256, second.evidence.evidenceSha256);
  assert.ok(first.evidence.totalBytes > 0);
  assert.ok(first.evidence.totalBytes <= design.performanceBudgets.maxPilotBytes);
  assert.ok(first.evidence.files.every(row => row.bytes <= design.performanceBudgets.maxBytesPerCardAsset));
  assert.ok(first.evidence.files.every(row => /^[a-f0-9]{64}$/.test(row.contentSha256)));
});

test("SVG security gate rejects active, remote and embedded-media constructs", () => {
  const metadata = pilot.assets[0];
  const valid = '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720"><rect width="960" height="720"/></svg>';
  assert.deepEqual(validateSvgAssetText(valid, metadata), []);

  const bad = [
    '<svg width="960" height="720" viewBox="0 0 960 720"><script>alert(1)</script></svg>',
    '<svg width="960" height="720" viewBox="0 0 960 720"><foreignObject/></svg>',
    '<svg width="960" height="720" viewBox="0 0 960 720"><rect onclick="x()"/></svg>',
    '<svg width="960" height="720" viewBox="0 0 960 720"><use href="https://example.test/a.svg#x"/></svg>',
    '<svg width="960" height="720" viewBox="0 0 960 720"><image href="data:image/png;base64,AAAA"/></svg>'
  ];
  for (const svg of bad) assert.ok(validateSvgAssetText(svg, metadata).length > 0);
});

test("asset record hash changes when the SVG bytes change", () => {
  const metadata = pilot.assets[0];
  const a = buildAssetRecord(metadata, '<svg width="960" height="720" viewBox="0 0 960 720"></svg>', pilot);
  const b = buildAssetRecord(metadata, '<svg width="960" height="720" viewBox="0 0 960 720"><rect/></svg>', pilot);
  assert.notEqual(a.contentSha256, b.contentSha256);
  assert.notEqual(a.bytes, b.bytes);
});

test("asset pilot remains non-authoritative and cannot mutate protected/runtime state", async () => {
  const { evidence } = await buildRecipeImagesP0AssetPilot();
  for (const key of [
    "publicUiActivationAuthorized",
    "runtimeBehaviorChanged",
    "externalMediaAdmissionAuthorized",
    "protectedCorpusMutationAuthorized",
    "paidMediaServiceAuthorized",
    "knowledgeCoreWriteAuthorized",
    "barbecueMutationAuthorized"
  ]) {
    assert.equal(evidence[key], false, key);
  }
  assert.equal(evidence.nextGate, "D3_RECIPE_IMAGES_P0_BROWSER_INTEGRATION");
});
