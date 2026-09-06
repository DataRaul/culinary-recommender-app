import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP7E_EXPECTED_CHUNK_COUNT,
  STEP7E_EXPECTED_FINGERPRINT,
  STEP7E_EXPECTED_RECIPE_COUNT,
  expectedStep7eChunk,
  loadStep7eChunk,
  publicStep7eManifest,
  step7ePilotFingerprintSha256,
  validateStoredStep7eChunkMetadata
} from "../src/server/step7e-pilot.mjs";
import { onRequestPost as bootstrapStep7e } from "../functions/api/step7e/bootstrap.js";
import { onRequestGet as readStep7e } from "../functions/api/step7e/pilot.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";

test("Step 7E generated live manifest is exactly the bounded 500-record / 50-chunk pilot", () => {
  const manifest = publicStep7eManifest();
  assert.equal(STEP7E_EXPECTED_RECIPE_COUNT, 500);
  assert.equal(STEP7E_EXPECTED_CHUNK_COUNT, 50);
  assert.equal(manifest.liveRecipeCount, 500);
  assert.equal(manifest.chunkSize, 10);
  assert.equal(manifest.chunkCount, 50);
  assert.equal(manifest.boundaries.existingCulinaryControlD1Only, true);
  assert.equal(manifest.boundaries.futureRecipeBodyD1ShardsCreated, false);
  assert.equal(manifest.boundaries.publicRuntimeActivationAuthorized, false);
  assert.equal(manifest.boundaries.recommendationEligible, false);
  assert.equal(manifest.boundaries.nutritionAuthorityImported, false);
  assert.equal(manifest.boundaries.dietaryOrAllergenClaimsDerived, false);
  assert.equal(manifest.boundaries.ratioValuesPromotedToAbsoluteQuantities, false);
  assert.match(STEP7E_EXPECTED_FINGERPRINT, /^[0-9a-f]{64}$/);
});

test("all generated Step 7E chunks decompress, validate and reconstruct the exact manifest totals", async () => {
  let rows = 0;
  let bodyBytes = 0;
  const storedMetadata = [];
  for (let chunkIndex = 0; chunkIndex < STEP7E_EXPECTED_CHUNK_COUNT; chunkIndex += 1) {
    const loaded = await loadStep7eChunk(chunkIndex);
    const expected = expectedStep7eChunk(chunkIndex);
    assert.equal(loaded.rows.length, 10);
    assert.equal(loaded.fingerprint, expected.chunkSha256);
    rows += loaded.rows.length;
    bodyBytes += loaded.rows.reduce((sum, row) => sum + row.bodyBytes, 0);
    storedMetadata.push({
      chunk_index: expected.chunkIndex,
      first_ordinal: expected.firstOrdinal,
      recipe_count: expected.recipeCount,
      chunk_sha256: expected.chunkSha256,
      total_body_bytes: expected.bodyBytes,
      source_commit: publicStep7eManifest().sourceCommit
    });
  }
  assert.equal(rows, STEP7E_EXPECTED_RECIPE_COUNT);
  assert.equal(bodyBytes, publicStep7eManifest().totalBodyBytes);
  assert.equal(validateStoredStep7eChunkMetadata(storedMetadata).pass, true);
  assert.equal(await step7ePilotFingerprintSha256(storedMetadata), STEP7E_EXPECTED_FINGERPRINT);
});

test("generated first chunk is pinned to expected protected source identity", async () => {
  const first = await loadStep7eChunk(0);
  assert.equal(first.rows[0].ordinal, 0);
  assert.equal(first.rows[0].sourceItemId, "ackee-saltfish");
  const packet = JSON.parse(first.rows[0].bodyJson);
  assert.equal(packet.sourceItemId, "ackee-saltfish");
  assert.equal(packet.boundaries.recommendationEligible, false);
  assert.equal(packet.boundaries.publicRuntimeActivationAuthorized, false);
  assert.equal(packet.boundaries.sourceNutritionImportedAsAuthority, false);
  assert.equal(packet.boundaries.dietaryOrAllergenClaimsDerived, false);
  assert.equal(packet.boundaries.ratioValuesPromotedToAbsoluteQuantities, false);
});

test("Step 7E route modules fail closed when auth/runtime configuration is absent", async () => {
  const read = await readStep7e({
    request: new Request(`${ORIGIN}/api/step7e/pilot`),
    env: {}
  });
  assert.equal(read.status, 503);
  assert.equal((await read.json()).error, "AUTH_NOT_CONFIGURED");

  const write = await bootstrapStep7e({
    request: new Request(`${ORIGIN}/api/step7e/bootstrap?chunk=0`, { method: "POST", headers: { origin: ORIGIN } }),
    env: {}
  });
  assert.equal(write.status, 503);
  assert.equal((await write.json()).error, "AUTH_NOT_CONFIGURED");
});

test("Step 7E bootstrap rejects invalid chunk indexes before any pilot work", async () => {
  assert.equal(expectedStep7eChunk(-1), null);
  assert.equal(expectedStep7eChunk(50), null);
  await assert.rejects(() => loadStep7eChunk(50), /STEP7E_CHUNK_INDEX_INVALID/);
});
