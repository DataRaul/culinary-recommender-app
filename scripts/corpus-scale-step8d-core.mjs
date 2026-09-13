import { createHash } from "node:crypto";

import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";

export const STEP8D_CONTRACT_VERSION = "CORPUS_SCALE_STEP8D_CONTRACT_V1";
export const STEP8D_PACKET_SCHEMA_VERSION = "CORPUS_SCALE_STEP8D_PROTECTED_PACKET_V1";
export const STEP8D_MANIFEST_VERSION = "CORPUS_SCALE_STEP8D_MANIFEST_V1";
export const STEP8D_CORPUS_VERSION = "v8001";
export const STEP8D_SOURCE_COHORT_ID = "unitools-world-recipes-v1_1_0";
export const STEP8D_EXPECTED_RECORD_COUNT = 501;
export const STEP8D_RECIPE_SHARDS = 2;
export const STEP8D_MAX_ROWS_PER_BATCH = 10;

const SHA1_PATTERN = /^[a-f0-9]{40}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MEDIA_KEYS = new Set(["photo", "image", "images", "media", "thumbnail"]);
const encoder = new TextEncoder();

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function utf8Bytes(value) {
  return encoder.encode(value).byteLength;
}

function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} is required`);
  return value.trim();
}

function requireFiniteOrNull(value, label) {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite or null`);
  return value;
}

function localized(value, label) {
  if (value == null) return null;
  if (!isObject(value)) throw new Error(`${label} must be an object or null`);
  const result = {};
  if (value.ru != null) result.ru = String(value.ru);
  if (value.en != null) result.en = String(value.en);
  if (Object.keys(result).length === 0) throw new Error(`${label} must contain ru or en`);
  return result;
}

function normalizeSource(source) {
  if (!isObject(source)) throw new Error("Step 8D source contract is required");
  const normalized = {
    sourceCohortId: requireNonEmptyString(source.sourceCohortId, "sourceCohortId"),
    repository: requireNonEmptyString(source.repository, "repository"),
    commit: requireNonEmptyString(source.commit, "commit"),
    dataPath: requireNonEmptyString(source.dataPath, "dataPath"),
    dataBlobSha: requireNonEmptyString(source.dataBlobSha, "dataBlobSha"),
    datasetVersion: requireNonEmptyString(source.datasetVersion, "datasetVersion"),
    recordCount: Number(source.recordCount),
    licenseId: requireNonEmptyString(source.licenseId, "licenseId"),
    attributionText: requireNonEmptyString(source.attributionText, "attributionText")
  };
  if (!SHA1_PATTERN.test(normalized.commit)) throw new Error("Step 8D source commit must be a 40-char lowercase Git SHA-1");
  if (!SHA1_PATTERN.test(normalized.dataBlobSha)) throw new Error("Step 8D data blob SHA must be a 40-char lowercase Git SHA-1");
  if (normalized.sourceCohortId !== STEP8D_SOURCE_COHORT_ID) throw new Error("Unexpected Step 8D source cohort");
  if (normalized.recordCount !== STEP8D_EXPECTED_RECORD_COUNT) throw new Error("Step 8D source contract must freeze exactly 501 records");
  return normalized;
}

function assertNoMediaKeys(value, path = "packet") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoMediaKeys(entry, `${path}[${index}]`));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (MEDIA_KEYS.has(key.toLowerCase())) throw new Error(`${path}.${key} is forbidden media in Step 8D packet`);
    assertNoMediaKeys(nested, `${path}.${key}`);
  }
}

function normalizeIngredient(ingredient, index) {
  if (!isObject(ingredient)) throw new Error(`ingredient ${index} must be an object`);
  return {
    id: requireNonEmptyString(ingredient.id, `ingredient ${index} id`),
    name: localized(ingredient.name, `ingredient ${index} name`),
    quantity: requireFiniteOrNull(ingredient.quantity, `ingredient ${index} quantity`),
    unit: ingredient.unit == null ? null : String(ingredient.unit),
    note: localized(ingredient.note, `ingredient ${index} note`)
  };
}

function normalizeStep(step, index) {
  if (!isObject(step)) throw new Error(`step ${index} must be an object`);
  return {
    text: localized(step.text, `step ${index} text`),
    minutes: requireFiniteOrNull(step.minutes, `step ${index} minutes`)
  };
}

export function buildStep8DProtectedPacket(recipe, { source, ordinal } = {}) {
  if (!isObject(recipe)) throw new Error("UniTools recipe must be an object");
  if (!Number.isInteger(ordinal) || ordinal < 0) throw new Error("Step 8D ordinal must be a non-negative integer");
  const pinned = normalizeSource(source);
  const slug = requireNonEmptyString(recipe.slug, `recipe ${ordinal} slug`);
  const recipeId = `unitools:${slug}`;
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  const packet = {
    packetSchemaVersion: STEP8D_PACKET_SCHEMA_VERSION,
    identity: {
      recipeId,
      sourceOrdinal: ordinal,
      sourceSlug: slug
    },
    provenance: {
      sourceCohortId: pinned.sourceCohortId,
      repository: pinned.repository,
      commit: pinned.commit,
      dataPath: pinned.dataPath,
      dataBlobSha: pinned.dataBlobSha,
      datasetVersion: pinned.datasetVersion,
      sourceRecipeUrl: recipe.url == null ? null : String(recipe.url),
      licenseId: pinned.licenseId,
      attributionText: pinned.attributionText
    },
    recipe: {
      country: recipe.country == null ? null : String(recipe.country),
      name: localized(recipe.name, `recipe ${ordinal} name`),
      nativeName: recipe.nativeName == null ? null : String(recipe.nativeName),
      summary: localized(recipe.summary, `recipe ${ordinal} summary`),
      category: recipe.category == null ? null : String(recipe.category),
      difficulty: recipe.difficulty == null ? null : String(recipe.difficulty),
      baseServings: requireFiniteOrNull(recipe.baseServings, `recipe ${ordinal} baseServings`),
      prepMinutes: requireFiniteOrNull(recipe.prepMinutes, `recipe ${ordinal} prepMinutes`),
      cookMinutes: requireFiniteOrNull(recipe.cookMinutes, `recipe ${ordinal} cookMinutes`),
      ingredients: ingredients.map(normalizeIngredient),
      steps: steps.map(normalizeStep)
    },
    sourceMetadata: {
      diets: Array.isArray(recipe.diets) ? recipe.diets.map(value => String(value)) : [],
      nutritionPerServing: cloneJson(recipe.nutritionPerServing ?? null),
      ingredientScaling: ingredients.map((ingredient, index) => ({
        ingredientId: requireNonEmptyString(ingredient.id, `ingredient ${index} id`),
        scaling: ingredient.scaling == null ? null : String(ingredient.scaling)
      }))
    },
    authority: {
      storageState: "PROTECTED_STORED_ONLY",
      publicRecommendationEligible: false,
      automaticAppAdmissionAuthorized: false,
      nutritionAuthority: "SOURCE_METADATA_ONLY_UNTRUSTED",
      dietaryAllergenAuthority: "SOURCE_METADATA_ONLY_UNTRUSTED",
      scalingAuthority: "SOURCE_METADATA_ONLY_UNTRUSTED",
      knowledgeCoreWriteAuthorized: false
    }
  };

  assertNoMediaKeys(packet);
  validateStep8DProtectedPacket(packet);
  return packet;
}

export function validateStep8DProtectedPacket(packet) {
  if (!isObject(packet)) throw new Error("Step 8D packet must be an object");
  if (packet.packetSchemaVersion !== STEP8D_PACKET_SCHEMA_VERSION) throw new Error("Step 8D packet schema version mismatch");
  const recipeId = packet.identity?.recipeId;
  if (typeof recipeId !== "string" || !recipeId.startsWith("unitools:") || recipeId.length <= "unitools:".length) {
    throw new Error("Step 8D packet recipeId must use unitools:<slug>");
  }
  if (packet.provenance?.sourceCohortId !== STEP8D_SOURCE_COHORT_ID) throw new Error("Step 8D packet source cohort mismatch");
  const authority = packet.authority || {};
  if (authority.storageState !== "PROTECTED_STORED_ONLY") throw new Error("Step 8D packet must remain protected stored-only");
  if (authority.publicRecommendationEligible !== false) throw new Error("Step 8D packet cannot be public-recommendation eligible");
  if (authority.automaticAppAdmissionAuthorized !== false) throw new Error("Step 8D packet cannot authorize automatic app admission");
  if (authority.nutritionAuthority !== "SOURCE_METADATA_ONLY_UNTRUSTED") throw new Error("Step 8D nutrition authority firewall mismatch");
  if (authority.dietaryAllergenAuthority !== "SOURCE_METADATA_ONLY_UNTRUSTED") throw new Error("Step 8D diet/allergen authority firewall mismatch");
  if (authority.scalingAuthority !== "SOURCE_METADATA_ONLY_UNTRUSTED") throw new Error("Step 8D scaling authority firewall mismatch");
  if (authority.knowledgeCoreWriteAuthorized !== false) throw new Error("Step 8D packet cannot authorize Knowledge Core writes");
  assertNoMediaKeys(packet);
  return true;
}

export function buildStep8DArtifacts(dataset, contract) {
  if (!isObject(dataset)) throw new Error("Pinned UniTools dataset is required");
  if (!isObject(contract) || contract.contractVersion !== STEP8D_CONTRACT_VERSION) throw new Error("Step 8D contract version mismatch");
  const source = normalizeSource(contract.source);
  if (dataset.version !== source.datasetVersion) throw new Error(`Pinned dataset version mismatch: ${dataset.version || "<missing>"}`);
  if (!Array.isArray(dataset.recipes)) throw new Error("Pinned UniTools dataset recipes array is required");
  if (dataset.recipes.length !== STEP8D_EXPECTED_RECORD_COUNT) throw new Error(`Step 8D requires exactly ${STEP8D_EXPECTED_RECORD_COUNT} recipes`);
  if (Number(dataset.counts?.recipes) !== STEP8D_EXPECTED_RECORD_COUNT) throw new Error("Pinned dataset count metadata must also equal 501");

  const packets = dataset.recipes.map((recipe, ordinal) => buildStep8DProtectedPacket(recipe, { source, ordinal }));
  const seenIds = new Set();
  const entries = packets.map((packet, ordinal) => {
    const recipeId = packet.identity.recipeId;
    if (seenIds.has(recipeId)) throw new Error(`Duplicate stable Step 8D recipeId: ${recipeId}`);
    seenIds.add(recipeId);
    const bodyJson = JSON.stringify(packet);
    return {
      ordinal,
      recipeId,
      bodySha256: sha256(bodyJson),
      bodyBytes: utf8Bytes(bodyJson),
      sourceCohortId: source.sourceCohortId,
      bodyJson
    };
  });

  const populationPlan = buildStep8APopulationPlan({
    corpusVersion: contract.manifestSchema?.corpusVersion || STEP8D_CORPUS_VERSION,
    sourceCohorts: [{
      id: source.sourceCohortId,
      sourceName: "UniTools World Recipes Dataset",
      sourceVersion: `${source.datasetVersion}@${source.commit}:${source.dataBlobSha}`,
      admissionState: "STEP8C_RIGHTS_CLEAN_PROTECTED_POPULATION_INPUT",
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        `https://github.com/${source.repository}/blob/${source.commit}/${source.dataPath}`
      ]
    }],
    entries,
    recipeShardCount: STEP8D_RECIPE_SHARDS,
    rowsPerWriteBatch: STEP8D_MAX_ROWS_PER_BATCH
  });

  if (populationPlan.manifest.recipeCount !== STEP8D_EXPECTED_RECORD_COUNT) throw new Error("Step 8D manifest recipe count mismatch");
  if (populationPlan.manifest.recipeBodyShards.shardCount !== STEP8D_RECIPE_SHARDS) throw new Error("Step 8D must route across exactly two shards");
  if (populationPlan.manifest.recipeBodyShards.descriptors.some(descriptor => descriptor.rowCount <= 0)) {
    throw new Error("Step 8D requires both earned shards to receive at least one row");
  }
  if (populationPlan.batches.some(batch => batch.rowCount > STEP8D_MAX_ROWS_PER_BATCH)) {
    throw new Error("Step 8D write batch exceeds 10-row maximum");
  }

  const manifest = {
    manifestSchemaVersion: STEP8D_MANIFEST_VERSION,
    contractVersion: STEP8D_CONTRACT_VERSION,
    corpusVersion: populationPlan.manifest.corpusVersion,
    source,
    recipeCount: entries.length,
    packetSchemaVersion: STEP8D_PACKET_SCHEMA_VERSION,
    descriptorOnly: true,
    fullRecipeBodiesInManifest: false,
    authority: cloneJson(contract.packetSchema?.authority || packets[0].authority),
    routing: {
      shardCount: STEP8D_RECIPE_SHARDS,
      deterministicRouter: populationPlan.manifest.recipeBodyShards.deterministicRouter,
      descriptors: cloneJson(populationPlan.manifest.recipeBodyShards.descriptors)
    },
    writeContract: cloneJson(populationPlan.manifest.writeContract),
    entries: entries.map((entry, ordinal) => ({
      ordinal,
      recipeId: entry.recipeId,
      bodySha256: entry.bodySha256,
      bodyBytes: entry.bodyBytes,
      sourceCohortId: entry.sourceCohortId,
      shardNumber: populationPlan.batches.find(batch => batch.entries.some(candidate => candidate.recipeId === entry.recipeId))?.shardNumber
    }))
  };
  manifest.manifestSha256 = sha256(JSON.stringify(manifest));

  const packetById = new Map(entries.map((entry, index) => [entry.recipeId, { packet: packets[index], bodyJson: entry.bodyJson }]));
  const batches = populationPlan.batches.map(batch => ({
    ...batch,
    entries: batch.entries.map(entry => ({
      ...entry,
      bodyJson: packetById.get(entry.recipeId).bodyJson
    }))
  }));

  return {
    contractVersion: STEP8D_CONTRACT_VERSION,
    manifest,
    packets,
    populationPlan: {
      ...populationPlan,
      batches
    }
  };
}

export function validateStep8DPreWriteArtifacts(artifacts) {
  const errors = [];
  if (!isObject(artifacts) || artifacts.contractVersion !== STEP8D_CONTRACT_VERSION) errors.push("CONTRACT_VERSION_MISMATCH");
  const manifest = artifacts?.manifest;
  const packets = artifacts?.packets;
  const plan = artifacts?.populationPlan;
  if (!isObject(manifest) || manifest.manifestSchemaVersion !== STEP8D_MANIFEST_VERSION) errors.push("MANIFEST_SCHEMA_MISMATCH");
  if (manifest?.recipeCount !== STEP8D_EXPECTED_RECORD_COUNT) errors.push("EXACT_501_RECORD_COUNT_FAIL");
  if (!Array.isArray(packets) || packets.length !== STEP8D_EXPECTED_RECORD_COUNT) errors.push("PACKET_COUNT_FAIL");
  if (Array.isArray(packets)) {
    try { packets.forEach(validateStep8DProtectedPacket); } catch (error) { errors.push(`PACKET_SCHEMA_FAIL:${error.message}`); }
    const ids = packets.map(packet => packet?.identity?.recipeId);
    if (new Set(ids).size !== ids.length) errors.push("STABLE_UNIQUE_IDS_FAIL");
  }
  if (manifest?.descriptorOnly !== true || manifest?.fullRecipeBodiesInManifest !== false) errors.push("MANIFEST_DESCRIPTOR_ONLY_FAIL");
  if (manifest?.entries?.some(entry => Object.prototype.hasOwnProperty.call(entry, "bodyJson"))) errors.push("MANIFEST_BODY_LEAK_FAIL");
  if (manifest?.routing?.shardCount !== STEP8D_RECIPE_SHARDS) errors.push("EXACT_TWO_SHARD_ROUTING_FAIL");
  if (manifest?.routing?.descriptors?.some(descriptor => descriptor.rowCount <= 0)) errors.push("BOTH_SHARDS_NONEMPTY_FAIL");
  if (plan?.batches?.some(batch => batch.rowCount > STEP8D_MAX_ROWS_PER_BATCH)) errors.push("MAX_10_ROWS_PER_BATCH_FAIL");
  if (plan?.batches?.some(batch => !SHA256_PATTERN.test(batch.expectedSha256 || ""))) errors.push("BATCH_FINGERPRINT_FAIL");
  return {
    pass: errors.length === 0,
    terminalCandidate: errors.length === 0 ? "STEP8D_PREWRITE_ACCEPTANCE_PASS" : "STEP8D_PREWRITE_ACCEPTANCE_FAIL",
    liveWritesAllowed: errors.length === 0,
    errors
  };
}
