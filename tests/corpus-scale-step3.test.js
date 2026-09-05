import test from "node:test";
import assert from "node:assert/strict";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { indexKeysForRecipe } from "../scripts/corpus-scale-step1-core.mjs";
import {
  PORTABLE_CORPUS_CONTRACT_VERSION,
  createPortableCorpusArtifactStream,
  materializePortableCorpusArtifacts,
  validatePortableCorpusArtifacts
} from "../scripts/corpus-scale-step3-core.mjs";

const VERSION = "v0001";
const ROOT = `corpus/${VERSION}`;

function materialized(options = {}) {
  return materializePortableCorpusArtifacts(ALL_RECIPES, { version: VERSION, ...options });
}

function manifestFrom(files) {
  return JSON.parse(files.get(`${ROOT}/manifest.json`));
}

function metadataRows(files, manifest) {
  return manifest.metadata.shards.flatMap(descriptor =>
    JSON.parse(files.get(`${ROOT}/${descriptor.path}`)).rows
  );
}

test("Step 3 portable artifact build is deterministic over the 84-record golden corpus", () => {
  const first = materialized();
  const second = materialized();
  assert.equal(ALL_RECIPES.length, 84);
  assert.deepEqual([...first.files.entries()], [...second.files.entries()]);
  assert.deepEqual([...first.kinds.entries()], [...second.kinds.entries()]);

  const manifest = manifestFrom(first.files);
  assert.equal(manifest.contractVersion, PORTABLE_CORPUS_CONTRACT_VERSION);
  assert.equal(manifest.recipeCount, 84);
  assert.equal(manifest.detailObjects.objectCount, 84);
  assert.equal(manifest.metadata.shardCount, 1);
  assert.ok(manifest.indexes.keyCount > 0);
  assert.equal(manifest.invariants.providerNeutral, true);
  assert.equal(manifest.invariants.publicRuntimeSwitchAuthorized, false);
});

test("artifact stream emits immutable recipe bodies before corpus-wide index finalization", () => {
  const stream = createPortableCorpusArtifactStream(ALL_RECIPES, { version: VERSION, metadataShardSize: 10 });
  const first = stream.next();
  assert.equal(first.done, false);
  assert.equal(first.value.kind, "detail");
  assert.equal(first.value.path, `${ROOT}/recipes/000000.json`);
  assert.deepEqual(JSON.parse(first.value.content), ALL_RECIPES[0]);

  const remaining = [...stream];
  assert.equal(remaining.filter(item => item.kind === "detail").length, 83);
  assert.equal(remaining.filter(item => item.kind === "metadata").length, 9);
  assert.ok(remaining.some(item => item.kind === "index"));
  assert.equal(remaining.at(-1).kind, "manifest");
});

test("metadata shards are lightweight retrieval rows and details reconstruct RecipeSource order exactly", () => {
  const { files } = materialized({ metadataShardSize: 11 });
  const manifest = manifestFrom(files);
  const rows = metadataRows(files, manifest).sort((a, b) => a.ordinal - b.ordinal);

  assert.equal(manifest.metadata.shardCount, 8);
  assert.equal(rows.length, ALL_RECIPES.length);
  assert.deepEqual(rows.map(row => row.id), ALL_RECIPES.map(recipe => recipe.id));

  const reconstructed = rows.map(row => JSON.parse(files.get(`${ROOT}/${row.detailPath}`)));
  assert.deepEqual(reconstructed, ALL_RECIPES);

  for (const row of rows) {
    assert.equal(Object.hasOwn(row, "instructions"), false);
    assert.equal(Object.hasOwn(row, "ingredients"), false);
    assert.ok(Array.isArray(row.ingredientIds));
    assert.match(row.detailPath, /^recipes\/\d{6}\.json$/);
    assert.match(row.detailSha256, /^[a-f0-9]{64}$/);
    assert.ok(row.detailBytes > 0);
  }
});

test("pre-built index objects preserve Step 1 retrieval keys and ordered ordinal postings", () => {
  const { files } = materialized();
  const manifest = manifestFrom(files);
  const expected = new Map();
  for (let ordinal = 0; ordinal < ALL_RECIPES.length; ordinal += 1) {
    for (const key of indexKeysForRecipe(ALL_RECIPES[ordinal])) {
      const ordinals = expected.get(key) || [];
      ordinals.push(ordinal);
      expected.set(key, ordinals);
    }
  }

  assert.equal(manifest.indexes.keyCount, expected.size);
  for (const descriptor of manifest.indexes.objects) {
    const payload = JSON.parse(files.get(`${ROOT}/${descriptor.path}`));
    assert.equal(payload.key, descriptor.key);
    assert.deepEqual(payload.ordinals, expected.get(descriptor.key));
    assert.equal(payload.count, payload.ordinals.length);
    assert.match(descriptor.path, /^indexes\/[a-z0-9-]+\/[a-z0-9-]+\.json$/);
  }
});

test("manifest and canonical artifacts contain no Cloudflare-specific storage dependency", () => {
  const { files } = materialized();
  const manifest = manifestFrom(files);
  const manifestText = files.get(`${ROOT}/manifest.json`).toLowerCase();
  assert.doesNotMatch(manifestText, /"(?:cloudflare|r2|worker|d1)"/);
  assert.equal(manifest.invariants.providerNeutral, true);
  assert.equal(manifest.detailObjects.contentType, "application/json");
  assert.equal(manifest.detailObjects.pathTemplate, "recipes/{ordinal:6d}.json");
});

test("portable artifact validator verifies hashes, details, metadata and all index postings", () => {
  const { files } = materialized({ metadataShardSize: 17 });
  const result = validatePortableCorpusArtifacts(files, { version: VERSION });
  assert.equal(result.pass, true);
  assert.equal(result.recipeCount, 84);
  assert.equal(result.metadataShardCount, 5);
  assert.ok(result.indexKeyCount > 0);
  assert.ok(result.detailBytes > 0);
  assert.match(result.manifestSha256, /^[a-f0-9]{64}$/);
});

test("portable artifact validator fails closed after detail tampering", () => {
  const { files } = materialized();
  const tampered = new Map(files);
  tampered.set(`${ROOT}/recipes/000000.json`, `${files.get(`${ROOT}/recipes/000000.json`)} `);
  assert.throws(
    () => validatePortableCorpusArtifacts(tampered, { version: VERSION }),
    /detail byte count mismatch|detail sha256 mismatch/
  );
});

test("portable build rejects invalid versions, invalid records and duplicate identities", () => {
  assert.throws(() => [...createPortableCorpusArtifactStream(ALL_RECIPES, { version: "latest" })], /corpus version/);
  assert.throws(() => [...createPortableCorpusArtifactStream([{ id: "" }], { version: VERSION })], /non-empty string id/);
  assert.throws(
    () => [...createPortableCorpusArtifactStream([{ id: "same" }, { id: "same" }], { version: VERSION })],
    /duplicate recipe id: same/
  );
  assert.throws(() => [...createPortableCorpusArtifactStream([], { version: VERSION })], /at least one canonical recipe/);
});
