import { createHash } from "node:crypto";

import { PORTABLE_CORPUS_CONTRACT_VERSION } from "./corpus-scale-step3-core.mjs";

export const STEP6_INCREMENTAL_VALIDATION_CONTRACT = "CORPUS_SCALE_STEP6_INCREMENTAL_VALIDATION_V1";
export const STEP6_DEFAULT_MAX_CHANGED_RECORDS = 1_000;
export const STEP6_DEFAULT_MAX_CHANGE_FRACTION = 0.10;
export const STEP6_DEFAULT_SAMPLE_SIZE = 32;

const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const bytes = value => Buffer.byteLength(value, "utf8");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const slug = value => String(value ?? "unknown").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";

function assertVersion(version, label) {
  if (!/^v[0-9]{4,}$/.test(version)) throw new Error(`${label} must match vNNNN or wider numeric form`);
}

function rootFor(version) {
  assertVersion(version, "corpus version");
  return `corpus/${version}`;
}

function parseJson(files, path, label = path) {
  const content = files.get(path);
  if (content == null) throw new Error(`missing ${label}: ${path}`);
  try {
    return { content, value: JSON.parse(content) };
  } catch {
    throw new Error(`invalid JSON for ${label}: ${path}`);
  }
}

function assertDescriptorContent(files, root, descriptor, label) {
  const path = `${root}/${descriptor.path}`;
  const content = files.get(path);
  if (content == null) throw new Error(`missing ${label}: ${descriptor.path}`);
  if (bytes(content) !== descriptor.bytes) throw new Error(`${label} byte count mismatch: ${descriptor.path}`);
  if (sha256(content) !== descriptor.sha256) throw new Error(`${label} sha256 mismatch: ${descriptor.path}`);
  return content;
}

function loadMetadata(files, manifest, version) {
  const root = rootFor(version);
  const rows = [];
  const shardByOrdinal = new Map();
  for (const descriptor of manifest.metadata.shards) {
    const content = assertDescriptorContent(files, root, descriptor, "metadata shard");
    const payload = JSON.parse(content);
    if (payload.contractVersion !== manifest.contractVersion) throw new Error(`metadata contract mismatch: ${descriptor.path}`);
    if (payload.corpusVersion !== version) throw new Error(`metadata corpus version mismatch: ${descriptor.path}`);
    if (payload.rowCount !== payload.rows.length || payload.rowCount !== descriptor.rowCount) {
      throw new Error(`metadata row count mismatch: ${descriptor.path}`);
    }
    for (const row of payload.rows) {
      rows.push(row);
      shardByOrdinal.set(row.ordinal, descriptor.path);
    }
  }
  if (rows.length !== manifest.recipeCount) throw new Error("metadata recipe count mismatch");
  rows.sort((a, b) => a.ordinal - b.ordinal);
  const byId = new Map();
  for (const row of rows) {
    if (!Number.isInteger(row.ordinal) || row.ordinal < 0 || row.ordinal >= manifest.recipeCount) {
      throw new Error(`invalid metadata ordinal: ${row.ordinal}`);
    }
    if (!isNonEmptyString(row.id)) throw new Error(`metadata row at ordinal ${row.ordinal} lacks id`);
    if (byId.has(row.id)) throw new Error(`duplicate metadata recipe id: ${row.id}`);
    byId.set(row.id, row);
  }
  return { rows, byId, shardByOrdinal };
}

function loadIndexes(files, manifest, version) {
  const root = rootFor(version);
  const byKey = new Map();
  const descriptors = new Map();
  for (const descriptor of manifest.indexes.objects) {
    const content = assertDescriptorContent(files, root, descriptor, "index object");
    const payload = JSON.parse(content);
    if (payload.contractVersion !== manifest.contractVersion) throw new Error(`index contract mismatch: ${descriptor.path}`);
    if (payload.corpusVersion !== version) throw new Error(`index corpus version mismatch: ${descriptor.path}`);
    if (payload.key !== descriptor.key) throw new Error(`index key mismatch: ${descriptor.path}`);
    if (payload.count !== payload.ordinals.length || payload.count !== descriptor.count) throw new Error(`index count mismatch: ${descriptor.key}`);
    byKey.set(payload.key, payload.ordinals);
    descriptors.set(payload.key, descriptor);
  }
  if (byKey.size !== manifest.indexes.keyCount) throw new Error("manifest index key count mismatch");
  return { byKey, descriptors };
}

function loadPortableState(files, version, options = {}) {
  if (!(files instanceof Map)) throw new Error("portable files must be a Map");
  const root = rootFor(version);
  const { content: manifestContent, value: manifest } = parseJson(files, `${root}/manifest.json`, "manifest");
  if (manifest.contractVersion !== PORTABLE_CORPUS_CONTRACT_VERSION) throw new Error("unexpected portable corpus contract version");
  if (manifest.corpusVersion !== version) throw new Error("manifest corpus version mismatch");
  if (!isObject(manifest.metadata) || !Array.isArray(manifest.metadata.shards)) throw new Error("manifest metadata descriptor missing");
  if (!isObject(manifest.indexes) || !Array.isArray(manifest.indexes.objects)) throw new Error("manifest index descriptor missing");
  const metadata = loadMetadata(files, manifest, version);
  const indexes = options.loadIndexes === false ? null : loadIndexes(files, manifest, version);
  return { files, version, root, manifest, manifestContent, metadata, indexes };
}

function semanticRow(row) {
  const { ordinal: _ordinal, detailPath: _detailPath, detailSha256: _detailSha256, detailBytes: _detailBytes, ...rest } = row;
  return rest;
}

function rowsEqual(a, b) {
  return JSON.stringify(semanticRow(a)) === JSON.stringify(semanticRow(b));
}

function postingsEqual(a = [], b = []) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function changeThreshold(previousCount, nextCount, changedCount, options) {
  const maxChangedRecords = Math.max(1, Number(options.maxChangedRecords) || STEP6_DEFAULT_MAX_CHANGED_RECORDS);
  const maxChangeFraction = Math.max(0, Number(options.maxChangeFraction) || STEP6_DEFAULT_MAX_CHANGE_FRACTION);
  const denominator = Math.max(previousCount, nextCount, 1);
  const fraction = changedCount / denominator;
  return {
    maxChangedRecords,
    maxChangeFraction,
    observedChangedRecords: changedCount,
    observedChangeFraction: Number(fraction.toFixed(6)),
    exceeded: changedCount > maxChangedRecords || fraction > maxChangeFraction
  };
}

export function buildIncrementalValidationPlan(previousFiles, nextFiles, options = {}) {
  const previousVersion = options.previousVersion || "v0001";
  const nextVersion = options.nextVersion || "v0002";
  const previous = loadPortableState(previousFiles, previousVersion);
  const next = loadPortableState(nextFiles, nextVersion);

  const previousIds = new Set(previous.metadata.byId.keys());
  const nextIds = new Set(next.metadata.byId.keys());
  const addedRecipeIds = [...nextIds].filter(id => !previousIds.has(id)).sort();
  const removedRecipeIds = [...previousIds].filter(id => !nextIds.has(id)).sort();
  const changedRecipeIds = [];
  const metadataChangedRecipeIds = [];
  const unchangedRecipeIds = [];
  const ordinalDrift = [];

  for (const id of [...previousIds].filter(value => nextIds.has(value)).sort()) {
    const before = previous.metadata.byId.get(id);
    const after = next.metadata.byId.get(id);
    if (before.ordinal !== after.ordinal) ordinalDrift.push({ id, previousOrdinal: before.ordinal, nextOrdinal: after.ordinal });
    if (before.detailSha256 !== after.detailSha256 || before.detailBytes !== after.detailBytes) changedRecipeIds.push(id);
    else unchangedRecipeIds.push(id);
    if (!rowsEqual(before, after)) metadataChangedRecipeIds.push(id);
  }

  const changedIndexKeys = [];
  const allIndexKeys = new Set([
    ...previous.indexes.byKey.keys(),
    ...next.indexes.byKey.keys()
  ]);
  for (const key of [...allIndexKeys].sort()) {
    if (!postingsEqual(previous.indexes.byKey.get(key), next.indexes.byKey.get(key))) changedIndexKeys.push(key);
  }

  const affectedMetadataShards = new Set();
  const affectedRecipeIds = [...new Set([...addedRecipeIds, ...removedRecipeIds, ...changedRecipeIds, ...metadataChangedRecipeIds])].sort();
  for (const id of affectedRecipeIds) {
    const before = previous.metadata.byId.get(id);
    const after = next.metadata.byId.get(id);
    if (before) affectedMetadataShards.add(`${previousVersion}:${previous.metadata.shardByOrdinal.get(before.ordinal)}`);
    if (after) affectedMetadataShards.add(`${nextVersion}:${next.metadata.shardByOrdinal.get(after.ordinal)}`);
  }

  const threshold = changeThreshold(previous.manifest.recipeCount, next.manifest.recipeCount, affectedRecipeIds.length, options);
  const fullValidationReasons = [];
  if (previous.manifest.contractVersion !== next.manifest.contractVersion) fullValidationReasons.push("PORTABLE_CONTRACT_CHANGED");
  if (previous.manifest.metadata.shardSize !== next.manifest.metadata.shardSize) fullValidationReasons.push("METADATA_SHARD_SIZE_CHANGED");
  if (ordinalDrift.length) fullValidationReasons.push("EXISTING_RECIPE_ORDINAL_DRIFT");
  if (threshold.exceeded) fullValidationReasons.push("CHANGESET_EXCEEDS_INCREMENTAL_BUDGET");

  return {
    contract: STEP6_INCREMENTAL_VALIDATION_CONTRACT,
    previousVersion,
    nextVersion,
    previousManifestSha256: sha256(previous.manifestContent),
    nextManifestSha256: sha256(next.manifestContent),
    previousRecipeCount: previous.manifest.recipeCount,
    nextRecipeCount: next.manifest.recipeCount,
    mode: fullValidationReasons.length ? "FULL_VALIDATION_REQUIRED" : "INCREMENTAL",
    fullValidationReasons,
    threshold,
    addedRecipeIds,
    removedRecipeIds,
    changedRecipeIds,
    metadataChangedRecipeIds,
    unchangedRecipeIds,
    ordinalDrift,
    affectedRecipeIds,
    affectedMetadataShards: [...affectedMetadataShards].sort(),
    changedIndexKeys,
    invariants: {
      existingRecipeOrdinalsStable: ordinalDrift.length === 0,
      normalCiMayUseIncrementalPlan: fullValidationReasons.length === 0,
      full100kBenchmarkRemainsSeparate: true
    }
  };
}

export function indexKeysForMetadataRow(row) {
  const keys = new Set();
  for (const ingredientId of row.ingredientIds || []) keys.add(`ingredient:${slug(ingredientId)}`);
  if (row.cuisine) keys.add(`cuisine:${slug(row.cuisine)}`);
  for (const tag of row.dietaryTags || []) keys.add(`diet:${slug(tag)}`);
  for (const mealType of row.mealTypes || []) keys.add(`meal:${slug(mealType)}`);
  if (row.mainProtein) keys.add(`protein:${slug(row.mainProtein)}`);
  if (Number.isFinite(row.totalMinutes)) {
    if (row.totalMinutes <= 30) keys.add("time:under-30");
    if (row.totalMinutes <= 45) keys.add("time:under-45");
    if (row.totalMinutes <= 60) keys.add("time:under-60");
  }
  const difficulty = Number(row.difficulty);
  if (Number.isFinite(difficulty)) {
    for (let limit = Math.max(1, Math.ceil(difficulty)); limit <= 4; limit += 1) keys.add(`skill:lte-${limit}`);
  }
  return [...keys].sort();
}

export function validateCanonicalRecipeShape(recipe) {
  const errors = [];
  const label = recipe?.id || "recipe";
  if (!isObject(recipe)) return ["recipe must be an object"];
  if (!isNonEmptyString(recipe.id)) errors.push(`${label}: id is required`);
  if (!isObject(recipe.identity) || !isNonEmptyString(recipe.identity.canonicalTitle)) errors.push(`${label}: identity.canonicalTitle is required`);
  if (!Array.isArray(recipe.ingredients)) errors.push(`${label}: ingredients must be an array`);
  else for (const ingredient of recipe.ingredients) {
    if (!isNonEmptyString(ingredient?.canonicalIngredientId)) errors.push(`${label}: every ingredient requires canonicalIngredientId`);
  }
  if (!Array.isArray(recipe.instructions)) errors.push(`${label}: instructions must be an array`);
  if (!isObject(recipe.culinary)) errors.push(`${label}: culinary object is required`);
  if (!isObject(recipe.time)) errors.push(`${label}: time object is required`);
  if (!Array.isArray(recipe.dietaryTags)) errors.push(`${label}: dietaryTags must be an array`);
  if (!isObject(recipe.nutrition)) errors.push(`${label}: nutrition object is required`);
  if (!isObject(recipe.governance)) errors.push(`${label}: governance object is required`);
  return errors;
}

export function validateRecipeProvenanceInvariant(recipe) {
  const errors = [];
  const provenance = recipe?.provenance;
  const external = provenance?.sourceType?.startsWith?.("EXTERNAL") || recipe?.governance?.sourceNutritionIgnoredForAuthority === true;
  if (!external) return errors;
  const label = recipe.id || "external recipe";
  if (!isObject(provenance)) return [`${label}: external recipe provenance is required`];
  for (const field of ["sourceName", "sourceUrl", "license"]) {
    if (!isNonEmptyString(provenance[field])) errors.push(`${label}: external provenance.${field} is required`);
  }
  const immutableLocator = provenance.sourceRevisionUrl || provenance.immutableLocator || provenance.sourceSnapshotUrl;
  if (!isNonEmptyString(immutableLocator)) errors.push(`${label}: external provenance requires immutable source locator`);
  if (!("licenseUrl" in provenance)) errors.push(`${label}: external provenance.licenseUrl must be explicit`);
  if (recipe.governance?.sourceNutritionIgnoredForAuthority !== true) {
    errors.push(`${label}: external source nutrition must remain non-authoritative`);
  }
  if (recipe.governance?.mediaExcluded === false) errors.push(`${label}: media may not be implicitly admitted`);
  return errors;
}

function expectedPostingsForKey(rows, key) {
  return rows
    .filter(row => indexKeysForMetadataRow(row).includes(key))
    .map(row => row.ordinal);
}

export function validateIncrementalArtifacts(nextFiles, plan, options = {}) {
  if (!isObject(plan) || plan.contract !== STEP6_INCREMENTAL_VALIDATION_CONTRACT) throw new Error("invalid Step 6 validation plan");
  if (plan.mode !== "INCREMENTAL") {
    return {
      pass: false,
      status: "FULL_VALIDATION_REQUIRED",
      reasons: [...plan.fullValidationReasons],
      validatedRecipeIds: [],
      validatedMetadataShards: [],
      validatedIndexKeys: []
    };
  }

  const next = loadPortableState(nextFiles, plan.nextVersion);
  if (sha256(next.manifestContent) !== plan.nextManifestSha256) throw new Error("next manifest changed after validation plan was built");
  const errors = [];
  const validatedRecipeIds = [];

  for (const id of [...new Set([...plan.addedRecipeIds, ...plan.changedRecipeIds])]) {
    const row = next.metadata.byId.get(id);
    if (!row) {
      errors.push(`${id}: missing next metadata row`);
      continue;
    }
    const path = `${next.root}/${row.detailPath}`;
    const content = next.files.get(path);
    if (content == null) {
      errors.push(`${id}: missing detail object`);
      continue;
    }
    if (bytes(content) !== row.detailBytes) errors.push(`${id}: detail byte count mismatch`);
    if (sha256(content) !== row.detailSha256) errors.push(`${id}: detail sha256 mismatch`);
    let recipe;
    try { recipe = JSON.parse(content); } catch { errors.push(`${id}: detail JSON invalid`); continue; }
    if (recipe.id !== id) errors.push(`${id}: detail identity mismatch`);
    errors.push(...validateCanonicalRecipeShape(recipe));
    errors.push(...validateRecipeProvenanceInvariant(recipe));
    validatedRecipeIds.push(id);
  }

  const validatedMetadataShards = [];
  const nextShardPaths = new Set(plan.affectedMetadataShards
    .filter(value => value.startsWith(`${plan.nextVersion}:`))
    .map(value => value.slice(plan.nextVersion.length + 1)));
  const nextDescriptors = new Map(next.manifest.metadata.shards.map(descriptor => [descriptor.path, descriptor]));
  for (const path of [...nextShardPaths].sort()) {
    const descriptor = nextDescriptors.get(path);
    if (!descriptor) {
      errors.push(`missing metadata descriptor: ${path}`);
      continue;
    }
    try {
      const payload = JSON.parse(assertDescriptorContent(next.files, next.root, descriptor, "metadata shard"));
      if (payload.rowCount !== payload.rows.length) errors.push(`metadata row count mismatch: ${path}`);
      validatedMetadataShards.push(path);
    } catch (error) {
      errors.push(String(error.message || error));
    }
  }

  const validatedIndexKeys = [];
  for (const key of plan.changedIndexKeys) {
    const descriptor = next.indexes.descriptors.get(key);
    const expected = expectedPostingsForKey(next.metadata.rows, key);
    if (!descriptor) {
      if (expected.length) errors.push(`missing changed index object: ${key}`);
      validatedIndexKeys.push(key);
      continue;
    }
    try {
      const payload = JSON.parse(assertDescriptorContent(next.files, next.root, descriptor, "index object"));
      if (!postingsEqual(payload.ordinals, expected)) errors.push(`changed index postings mismatch: ${key}`);
      validatedIndexKeys.push(key);
    } catch (error) {
      errors.push(String(error.message || error));
    }
  }

  return {
    pass: errors.length === 0,
    status: errors.length ? "INCREMENTAL_VALIDATION_FAILED" : "INCREMENTAL_VALIDATION_PASS",
    errors,
    validatedRecipeIds: validatedRecipeIds.sort(),
    validatedMetadataShards,
    validatedIndexKeys,
    skippedUnchangedRecipeCount: plan.unchangedRecipeIds.length,
    full100kBenchmarkExecuted: false,
    runtimeActivationAuthorized: false
  };
}

export function validateGoldenRecipeRetention(goldenRecipes, nextFiles, options = {}) {
  if (!Array.isArray(goldenRecipes) || goldenRecipes.length === 0) throw new Error("goldenRecipes must contain at least one recipe");
  const nextVersion = options.nextVersion || "v0002";
  const next = loadPortableState(nextFiles, nextVersion, { loadIndexes: false });
  const errors = [];
  for (const golden of goldenRecipes) {
    const row = next.metadata.byId.get(golden.id);
    if (!row) {
      errors.push(`${golden.id}: golden recipe missing`);
      continue;
    }
    const actual = next.files.get(`${next.root}/${row.detailPath}`);
    const expected = JSON.stringify(golden);
    if (actual !== expected) errors.push(`${golden.id}: golden recipe changed`);
  }
  return {
    pass: errors.length === 0,
    goldenRecipeCount: goldenRecipes.length,
    errors
  };
}

export function selectDeterministicRegressionSample(ids, options = {}) {
  const sampleSize = Math.max(1, Number(options.sampleSize) || STEP6_DEFAULT_SAMPLE_SIZE);
  const seed = String(options.seed || "CULINARY_STEP6_REGRESSION_V1");
  return [...new Set(ids)]
    .map(id => ({ id, key: sha256(`${seed}\n${id}`) }))
    .sort((a, b) => a.key.localeCompare(b.key) || a.id.localeCompare(b.id))
    .slice(0, sampleSize)
    .map(row => row.id);
}

export function buildBoundedRegressionRecipeSet(nextFiles, plan, options = {}) {
  const next = loadPortableState(nextFiles, plan.nextVersion, { loadIndexes: false });
  const changedSample = selectDeterministicRegressionSample(plan.affectedRecipeIds.filter(id => next.metadata.byId.has(id)), {
    sampleSize: options.changedSampleSize || STEP6_DEFAULT_SAMPLE_SIZE,
    seed: "CULINARY_STEP6_CHANGED"
  });
  const stableSample = selectDeterministicRegressionSample(plan.unchangedRecipeIds, {
    sampleSize: options.stableSampleSize || STEP6_DEFAULT_SAMPLE_SIZE,
    seed: "CULINARY_STEP6_STABLE"
  });
  const ids = [...new Set([...changedSample, ...stableSample])];
  const recipes = ids.map(id => {
    const row = next.metadata.byId.get(id);
    if (!row) throw new Error(`regression sample recipe missing: ${id}`);
    return JSON.parse(next.files.get(`${next.root}/${row.detailPath}`));
  });
  return {
    maxRequestedRecipeCount: Number(options.changedSampleSize || STEP6_DEFAULT_SAMPLE_SIZE) + Number(options.stableSampleSize || STEP6_DEFAULT_SAMPLE_SIZE),
    changedSample,
    stableSample,
    recipeIds: ids,
    recipes
  };
}
