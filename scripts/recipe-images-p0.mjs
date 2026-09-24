import { createHash } from "node:crypto";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

export const RECIPE_IMAGES_P0_SCHEMA = "CULINARY_RECIPE_IMAGES_P0_DESIGN_V1";
export const RECIPE_IMAGE_REGISTRY_SCHEMA = "CULINARY_RECIPE_IMAGE_REGISTRY_V1";

const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const sha256 = value => createHash("sha256").update(value).digest("hex");

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function validateRecipeImagesP0Config(config, recipes = PUBLIC_RUNTIME_RECIPES) {
  const errors = [];
  if (!isObject(config)) return ["config must be an object"];
  if (config.schemaVersion !== RECIPE_IMAGES_P0_SCHEMA) errors.push("unexpected schemaVersion");
  if (config.state !== "P0_DESIGN_CONTRACT") errors.push("state must be P0_DESIGN_CONTRACT");
  if (config.entryTerminal !== "FURTHER_PRODUCT_FEATURES_READINESS_PASS") errors.push("entry terminal mismatch");
  if (config.capabilityId !== "D3") errors.push("capabilityId must be D3");

  const scope = config.scope || {};
  if (!Array.isArray(scope.pilotRecipeIds) || scope.pilotRecipeIds.length !== scope.pilotRecipeCount) {
    errors.push("pilotRecipeIds must match pilotRecipeCount");
  }
  if (new Set(scope.pilotRecipeIds || []).size !== (scope.pilotRecipeIds || []).length) errors.push("pilot recipe ids must be unique");
  if (scope.projectAuthoredRecipesOnly !== true) errors.push("P0 must remain project-authored-recipes-only");
  if (scope.externalRecipeRecordsIncluded !== false) errors.push("external recipe records must remain excluded");
  if (scope.protectedCorpusRecordsIncluded !== false) errors.push("protected corpus records must remain excluded");

  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  for (const id of scope.pilotRecipeIds || []) {
    const recipe = byId.get(id);
    if (!recipe) {
      errors.push(`pilot recipe missing from public runtime: ${id}`);
      continue;
    }
    if (recipe.provenance?.sourceReference !== "data/project-authored-v1") {
      errors.push(`pilot recipe must be project-authored V1: ${id}`);
    }
  }

  const policy = config.assetPolicy || {};
  for (const key of [
    "thirdPartyRecipeSourceMediaAllowed",
    "remoteThirdPartyImageUrlsAllowed",
    "wikibooksCommonsMediaAllowed",
    "protectedCorpusSourceMediaAllowed",
    "stockMediaAllowed"
  ]) {
    if (policy[key] !== false) errors.push(`assetPolicy.${key} must remain false`);
  }
  if (!Array.isArray(policy.allowedAssetClasses) || policy.allowedAssetClasses.length < 1) errors.push("allowedAssetClasses are required");
  if (policy.assetReuseStateMustBeExplicit !== true) errors.push("asset reuse state must be explicit");
  if (policy.recordLevelProvenanceRequired !== true) errors.push("record-level provenance is required");
  if (policy.contentHashRequired !== true) errors.push("content hash is required");

  const presentation = config.presentationContract || {};
  if (presentation.aspectRatio !== "4:3") errors.push("P0 aspect ratio must remain 4:3");
  if (presentation.reservedLayoutSpaceRequired !== true) errors.push("reserved layout space is required");
  if (presentation.missingAssetFallbackRequired !== true) errors.push("missing-asset fallback is required");
  if (presentation.missingAssetFallbackMustNotBlockRecipeUse !== true) errors.push("missing image must not block recipe use");
  if (presentation.sameOriginStaticAssetsOnly !== true) errors.push("P0 assets must be same-origin static assets");
  if (!isNonEmptyString(presentation.sameOriginAssetPathPrefix) || !presentation.sameOriginAssetPathPrefix.startsWith("/")) {
    errors.push("same-origin asset path prefix is required");
  }
  if (presentation.altTextRequired !== true) errors.push("alt text is required");

  const budgets = config.performanceBudgets || {};
  if (!Number.isInteger(budgets.maxBytesPerCardAsset) || budgets.maxBytesPerCardAsset <= 0) errors.push("maxBytesPerCardAsset must be positive");
  if (!Number.isInteger(budgets.maxPilotBytes) || budgets.maxPilotBytes < budgets.maxBytesPerCardAsset) errors.push("maxPilotBytes is invalid");
  if (!Array.isArray(budgets.allowedFormats) || budgets.allowedFormats.length === 0) errors.push("allowedFormats are required");

  const firewalls = config.behaviorFirewalls || {};
  for (const [key, value] of Object.entries(firewalls)) if (value !== false) errors.push(`behaviorFirewalls.${key} must remain false`);

  const authority = config.authority || {};
  if (authority.designContractAuthorized !== true) errors.push("design contract must be explicitly authorized");
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
    if (authority[key] !== false) errors.push(`authority.${key} must remain false`);
  }
  if (config.nextGate !== "D3_RECIPE_IMAGES_P0_ASSET_PILOT") errors.push("unexpected nextGate");
  return errors;
}

export function validateRecipeImageAssetRecord(record, config) {
  const errors = [];
  if (!isObject(record)) return ["asset record must be an object"];
  const required = config?.assetRecordRequiredFields || [];
  for (const key of required) if (!(key in record)) errors.push(`missing required field: ${key}`);

  if (!isNonEmptyString(record.assetId)) errors.push("assetId must be non-empty");
  if (!config.scope?.pilotRecipeIds?.includes(record.recipeId)) errors.push("recipeId must belong to the P0 pilot cohort");
  if (!config.assetPolicy?.allowedAssetClasses?.includes(record.assetClass)) errors.push("assetClass is not allowed");
  if (!isNonEmptyString(record.reuseState)) errors.push("reuseState must be explicit");
  if (!isObject(record.provenance)) errors.push("provenance must be an object");
  else {
    if (!isNonEmptyString(record.provenance.origin)) errors.push("provenance.origin is required");
    if (!isNonEmptyString(record.provenance.rightsBasis)) errors.push("provenance.rightsBasis is required");
  }
  if (!/^[a-f0-9]{64}$/.test(record.contentSha256 || "")) errors.push("contentSha256 must be a SHA-256 hex digest");
  if (!config.performanceBudgets?.allowedFormats?.includes(record.format)) errors.push("asset format is not allowed");
  if (!Number.isInteger(record.width) || record.width <= 0 || record.width > config.performanceBudgets.maxWidthPx) errors.push("asset width exceeds P0 budget");
  if (!Number.isInteger(record.height) || record.height <= 0 || record.height > config.performanceBudgets.maxHeightPx) errors.push("asset height exceeds P0 budget");
  if (!Number.isInteger(record.bytes) || record.bytes <= 0 || record.bytes > config.performanceBudgets.maxBytesPerCardAsset) errors.push("asset bytes exceed P0 budget");
  if (!isNonEmptyString(record.altText)) errors.push("altText is required");
  if (String(record.altText || "").length > config.presentationContract.altTextMaxChars) errors.push("altText exceeds max length");
  const prefix = config.presentationContract.sameOriginAssetPathPrefix;
  if (!isNonEmptyString(record.assetPath) || !record.assetPath.startsWith(prefix) || /^https?:\/\//i.test(record.assetPath)) {
    errors.push("assetPath must be same-origin under the configured recipe asset prefix");
  }
  if ("sourceRecipeMediaUrl" in record || "remoteUrl" in record || "sourceImageUrl" in record) {
    errors.push("external/remote source media URLs are forbidden in P0 asset records");
  }
  return errors;
}

export function buildRecipeImageRegistry(records, config) {
  const configErrors = validateRecipeImagesP0Config(config);
  if (configErrors.length) throw new Error(`Invalid Recipe Images P0 config:\n- ${configErrors.join("\n- ")}`);
  if (!Array.isArray(records)) throw new Error("asset records must be an array");

  const assetIds = new Set();
  const recipeIds = new Set();
  let totalBytes = 0;
  for (const record of records) {
    const errors = validateRecipeImageAssetRecord(record, config);
    if (errors.length) throw new Error(`Invalid recipe image asset:\n- ${errors.join("\n- ")}`);
    if (assetIds.has(record.assetId)) throw new Error(`duplicate assetId: ${record.assetId}`);
    if (recipeIds.has(record.recipeId)) throw new Error(`P0 permits one primary card asset per recipe: ${record.recipeId}`);
    assetIds.add(record.assetId);
    recipeIds.add(record.recipeId);
    totalBytes += record.bytes;
  }
  if (totalBytes > config.performanceBudgets.maxPilotBytes) throw new Error("pilot asset bytes exceed total P0 budget");

  const ordered = records.map(record => structuredClone(record)).sort((a,b) => a.recipeId.localeCompare(b.recipeId));
  const registry = {
    schemaVersion: RECIPE_IMAGE_REGISTRY_SCHEMA,
    p0ConfigSchemaVersion: config.schemaVersion,
    assetCount: ordered.length,
    pilotRecipeCount: config.scope.pilotRecipeCount,
    completePilotCoverage: ordered.length === config.scope.pilotRecipeCount
      && config.scope.pilotRecipeIds.every(id => recipeIds.has(id)),
    totalBytes,
    runtimeActivationAuthorized: false,
    externalMediaAdmissionAuthorized: false,
    records: ordered
  };
  return { ...registry, registrySha256: sha256(stableStringify(registry)) };
}
