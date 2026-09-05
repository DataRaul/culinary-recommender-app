import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

import { indexKeysForRecipe } from "./corpus-scale-step1-core.mjs";

export const PORTABLE_CORPUS_CONTRACT_VERSION = "PORTABLE_CORPUS_OBJECT_LAYOUT_V1";
export const PORTABLE_CORPUS_DEFAULT_VERSION = "v0001";
export const PORTABLE_CORPUS_DEFAULT_METADATA_SHARD_SIZE = 500;

const bytes = value => Buffer.byteLength(value, "utf8");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const gzipBytes = value => gzipSync(value).byteLength;

function assertRecipes(recipes) {
  if (!Array.isArray(recipes) || recipes.length === 0) {
    throw new Error("recipes must contain at least one canonical recipe record");
  }
}

function assertVersion(version) {
  if (!/^v[0-9]{4,}$/.test(version)) {
    throw new Error("corpus version must match vNNNN or a wider numeric version");
  }
}

function canonicalIndexPath(key) {
  const separator = key.indexOf(":");
  if (separator <= 0 || separator === key.length - 1) throw new Error(`invalid index key: ${key}`);
  const dimension = key.slice(0, separator);
  const value = key.slice(separator + 1);
  if (!/^[a-z0-9-]+$/.test(dimension) || !/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`index key is not portable: ${key}`);
  }
  return `indexes/${dimension}/${value}.json`;
}

function recipeSummary(recipe) {
  const ingredientIds = [...new Set((recipe.ingredients || [])
    .map(item => item?.canonicalIngredientId)
    .filter(Boolean))].sort();
  const provenance = recipe.provenance || {};

  return {
    ordinal: null,
    id: recipe.id,
    detailPath: null,
    detailSha256: null,
    detailBytes: null,
    title: recipe.identity?.canonicalTitle || recipe.title || recipe.id,
    cuisine: recipe.culinary?.cuisine || null,
    mealTypes: [...new Set(recipe.culinary?.mealTypes || [])].sort(),
    dietaryTags: [...new Set(recipe.dietaryTags || [])].sort(),
    totalMinutes: Number.isFinite(recipe.time?.totalMinutes) ? recipe.time.totalMinutes : null,
    difficulty: recipe.culinary?.difficulty != null && Number.isFinite(Number(recipe.culinary.difficulty)) ? Number(recipe.culinary.difficulty) : null,
    mainProtein: recipe.mainProtein || null,
    ingredientIds,
    recommendationState: recipe.governance?.recommendationState || null,
    rights: {
      license: provenance.license || null,
      sourceUrl: provenance.sourceUrl || null,
      sourceRevisionId: provenance.sourceRevisionId ?? null
    }
  };
}

function descriptorFor(path, content, extra = {}) {
  return {
    path,
    bytes: bytes(content),
    gzipBytes: gzipBytes(content),
    sha256: sha256(content),
    ...extra
  };
}

function renderMetadataShard(version, shardNumber, rows) {
  return JSON.stringify({
    contractVersion: PORTABLE_CORPUS_CONTRACT_VERSION,
    corpusVersion: version,
    shardNumber,
    firstOrdinal: rows[0].ordinal,
    lastOrdinal: rows[rows.length - 1].ordinal,
    rowCount: rows.length,
    rows
  });
}

function renderIndex(version, key, ordinals) {
  return JSON.stringify({
    contractVersion: PORTABLE_CORPUS_CONTRACT_VERSION,
    corpusVersion: version,
    key,
    count: ordinals.length,
    ordinals
  });
}

export function* createPortableCorpusArtifactStream(recipes, options = {}) {
  assertRecipes(recipes);
  const corpusVersion = options.version || PORTABLE_CORPUS_DEFAULT_VERSION;
  assertVersion(corpusVersion);
  const metadataShardSize = Math.max(1, Number(options.metadataShardSize) || PORTABLE_CORPUS_DEFAULT_METADATA_SHARD_SIZE);
  if (!Number.isInteger(metadataShardSize)) throw new Error("metadataShardSize must be an integer");

  const root = `corpus/${corpusVersion}`;
  const width = Math.max(6, String(recipes.length - 1).length);
  const seenIds = new Set();
  const postings = new Map();
  const metadataDescriptors = [];
  const indexDescriptors = [];
  const idsDigest = createHash("sha256");
  const recordsDigest = createHash("sha256");
  let detailBytesTotal = 0;
  let metadataRows = [];
  let metadataShardNumber = 0;

  const flushMetadata = function* () {
    if (!metadataRows.length) return;
    const path = `metadata/shard-${String(metadataShardNumber).padStart(5, "0")}.json`;
    const content = renderMetadataShard(corpusVersion, metadataShardNumber, metadataRows);
    const descriptor = descriptorFor(path, content, {
      shardNumber: metadataShardNumber,
      firstOrdinal: metadataRows[0].ordinal,
      lastOrdinal: metadataRows[metadataRows.length - 1].ordinal,
      rowCount: metadataRows.length
    });
    metadataDescriptors.push(descriptor);
    metadataShardNumber += 1;
    metadataRows = [];
    yield { kind: "metadata", path: `${root}/${path}`, content };
  };

  for (let ordinal = 0; ordinal < recipes.length; ordinal += 1) {
    const recipe = recipes[ordinal];
    if (!recipe || typeof recipe.id !== "string" || !recipe.id.trim()) {
      throw new Error(`recipe at ordinal ${ordinal} lacks a non-empty string id`);
    }
    if (seenIds.has(recipe.id)) throw new Error(`duplicate recipe id: ${recipe.id}`);
    seenIds.add(recipe.id);

    const detailContent = JSON.stringify(recipe);
    const detailPath = `recipes/${String(ordinal).padStart(width, "0")}.json`;
    const detailSha256 = sha256(detailContent);
    const detailBytes = bytes(detailContent);
    detailBytesTotal += detailBytes;
    idsDigest.update(`${recipe.id}\n`);
    recordsDigest.update(`${detailContent}\n`);

    const row = recipeSummary(recipe);
    row.ordinal = ordinal;
    row.detailPath = detailPath;
    row.detailSha256 = detailSha256;
    row.detailBytes = detailBytes;
    metadataRows.push(row);

    for (const key of indexKeysForRecipe(recipe)) {
      const list = postings.get(key) || [];
      list.push(ordinal);
      postings.set(key, list);
    }

    yield { kind: "detail", path: `${root}/${detailPath}`, content: detailContent };

    if (metadataRows.length >= metadataShardSize) yield* flushMetadata();
  }
  yield* flushMetadata();

  for (const [key, ordinals] of [...postings.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const path = canonicalIndexPath(key);
    const content = renderIndex(corpusVersion, key, ordinals);
    const descriptor = descriptorFor(path, content, { key, count: ordinals.length });
    indexDescriptors.push(descriptor);
    yield { kind: "index", path: `${root}/${path}`, content };
  }

  const manifest = {
    contractVersion: PORTABLE_CORPUS_CONTRACT_VERSION,
    corpusVersion,
    recipeCount: recipes.length,
    corpusFingerprint: {
      idsSha256: idsDigest.digest("hex"),
      recordsSha256: recordsDigest.digest("hex")
    },
    detailObjects: {
      objectCount: recipes.length,
      ordinalWidth: width,
      pathTemplate: `recipes/{ordinal:${width}d}.json`,
      totalBytes: detailBytesTotal,
      contentType: "application/json"
    },
    metadata: {
      shardSize: metadataShardSize,
      shardCount: metadataDescriptors.length,
      shards: metadataDescriptors
    },
    indexes: {
      keyCount: indexDescriptors.length,
      objects: indexDescriptors
    },
    invariants: {
      providerNeutral: true,
      immutableVersionRoot: root,
      indexValuesAreOrdinals: true,
      fullRecipeBodiesExcludedFromMetadata: true,
      nutritionAuthorityUnchanged: true,
      publicRuntimeSwitchAuthorized: false
    }
  };
  const manifestContent = JSON.stringify(manifest);
  yield { kind: "manifest", path: `${root}/manifest.json`, content: manifestContent };
}

export function materializePortableCorpusArtifacts(recipes, options = {}) {
  const files = new Map();
  const kinds = new Map();
  for (const artifact of createPortableCorpusArtifactStream(recipes, options)) {
    if (files.has(artifact.path)) throw new Error(`duplicate artifact path: ${artifact.path}`);
    files.set(artifact.path, artifact.content);
    kinds.set(artifact.path, artifact.kind);
  }
  return { files, kinds };
}

function assertDescriptor(files, root, descriptor) {
  const content = files.get(`${root}/${descriptor.path}`);
  if (content == null) throw new Error(`missing artifact: ${descriptor.path}`);
  if (bytes(content) !== descriptor.bytes) throw new Error(`byte count mismatch: ${descriptor.path}`);
  if (sha256(content) !== descriptor.sha256) throw new Error(`sha256 mismatch: ${descriptor.path}`);
  return content;
}

export function validatePortableCorpusArtifacts(files, options = {}) {
  if (!(files instanceof Map)) throw new Error("files must be a Map of artifact path to UTF-8 content");
  const version = options.version || PORTABLE_CORPUS_DEFAULT_VERSION;
  assertVersion(version);
  const root = `corpus/${version}`;
  const manifestPath = `${root}/manifest.json`;
  const manifestContent = files.get(manifestPath);
  if (manifestContent == null) throw new Error(`missing manifest: ${manifestPath}`);
  const manifest = JSON.parse(manifestContent);
  if (manifest.contractVersion !== PORTABLE_CORPUS_CONTRACT_VERSION) throw new Error("unexpected portable corpus contract version");
  if (manifest.corpusVersion !== version) throw new Error("manifest corpus version mismatch");

  const rows = [];
  for (const descriptor of manifest.metadata.shards) {
    const payload = JSON.parse(assertDescriptor(files, root, descriptor));
    if (payload.rowCount !== payload.rows.length) throw new Error(`metadata row count mismatch: ${descriptor.path}`);
    rows.push(...payload.rows);
  }
  if (rows.length !== manifest.recipeCount) throw new Error("metadata recipe count mismatch");

  const seenIds = new Set();
  const seenOrdinals = new Set();
  const expectedIndexes = new Map();
  const idsDigest = createHash("sha256");
  const recordsDigest = createHash("sha256");
  let totalDetailBytes = 0;

  for (const row of rows.sort((a, b) => a.ordinal - b.ordinal)) {
    if (!Number.isInteger(row.ordinal) || row.ordinal < 0 || row.ordinal >= manifest.recipeCount) throw new Error(`invalid metadata ordinal: ${row.ordinal}`);
    if (seenOrdinals.has(row.ordinal)) throw new Error(`duplicate metadata ordinal: ${row.ordinal}`);
    if (seenIds.has(row.id)) throw new Error(`duplicate metadata recipe id: ${row.id}`);
    seenOrdinals.add(row.ordinal);
    seenIds.add(row.id);

    const detailContent = files.get(`${root}/${row.detailPath}`);
    if (detailContent == null) throw new Error(`missing detail object: ${row.detailPath}`);
    if (bytes(detailContent) !== row.detailBytes) throw new Error(`detail byte count mismatch: ${row.id}`);
    if (sha256(detailContent) !== row.detailSha256) throw new Error(`detail sha256 mismatch: ${row.id}`);
    totalDetailBytes += row.detailBytes;

    const recipe = JSON.parse(detailContent);
    if (recipe.id !== row.id) throw new Error(`detail identity mismatch: ${row.id}`);
    idsDigest.update(`${recipe.id}\n`);
    recordsDigest.update(`${detailContent}\n`);
    for (const key of indexKeysForRecipe(recipe)) {
      const list = expectedIndexes.get(key) || [];
      list.push(row.ordinal);
      expectedIndexes.set(key, list);
    }
  }

  if (totalDetailBytes !== manifest.detailObjects.totalBytes) throw new Error("detail total byte count mismatch");
  if (idsDigest.digest("hex") !== manifest.corpusFingerprint.idsSha256) throw new Error("corpus id fingerprint mismatch");
  if (recordsDigest.digest("hex") !== manifest.corpusFingerprint.recordsSha256) throw new Error("corpus record fingerprint mismatch");
  if (manifest.indexes.keyCount !== manifest.indexes.objects.length) throw new Error("manifest index key count mismatch");
  if (manifest.indexes.keyCount !== expectedIndexes.size) throw new Error("expected index key count mismatch");

  for (const descriptor of manifest.indexes.objects) {
    const payload = JSON.parse(assertDescriptor(files, root, descriptor));
    if (payload.key !== descriptor.key) throw new Error(`index key mismatch: ${descriptor.path}`);
    if (payload.count !== payload.ordinals.length || payload.count !== descriptor.count) throw new Error(`index count mismatch: ${descriptor.key}`);
    const expected = expectedIndexes.get(descriptor.key);
    if (!expected) throw new Error(`unexpected index key: ${descriptor.key}`);
    if (JSON.stringify(payload.ordinals) !== JSON.stringify(expected)) throw new Error(`index postings mismatch: ${descriptor.key}`);
    let previous = -1;
    for (const ordinal of payload.ordinals) {
      if (!Number.isInteger(ordinal) || ordinal <= previous || ordinal >= manifest.recipeCount) throw new Error(`invalid ordered posting: ${descriptor.key}`);
      previous = ordinal;
    }
  }

  return {
    pass: true,
    recipeCount: manifest.recipeCount,
    metadataShardCount: manifest.metadata.shardCount,
    indexKeyCount: manifest.indexes.keyCount,
    detailBytes: manifest.detailObjects.totalBytes,
    manifestSha256: sha256(manifestContent)
  };
}
