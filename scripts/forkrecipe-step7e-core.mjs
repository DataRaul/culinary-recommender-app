import { createHash } from "node:crypto";

import {
  createControlPlaneSnapshot,
  stableStringify
} from "./corpus-source-control-plane.mjs";
import {
  createIngestionPipelineSnapshot,
  createPipelineRecord
} from "./corpus-ingestion-pipeline.mjs";

export const FORKRECIPE_STEP7E_SCHEMA = "forkrecipe-step7e-pilot-v1";
export const FORKRECIPE_STEP7E_PACKET_SCHEMA = "forkrecipe-step7e-source-packet-v1";
export const FORKRECIPE_STEP7E_SOURCE_ID = "FORKRECIPE_PINNED_STEP7E";
export const FORKRECIPE_STEP7E_ADAPTER_ID = "forkrecipe-step7e-control-adapter-v1";
export const FORKRECIPE_STEP7E_EXPECTED_COMMIT = "c32255266af39bd77444d39452f3df8088ac8fd9";
export const FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT = 915;
export const FORKRECIPE_STEP7E_COMMIT_TIMESTAMP = "2026-07-17T00:40:36Z";
export const FORKRECIPE_STEP7E_LICENSE = "CC-BY-SA-4.0";
export const FORKRECIPE_STEP7E_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";
export const FORKRECIPE_STEP7E_SOURCE_REPO = "futurechef/forkrecipe-recipes";
export const FORKRECIPE_STEP7E_MIN_PILOT = 500;
export const FORKRECIPE_STEP7E_MAX_PILOT = 1000;

const SOURCE_RECIPE_KEYS = Object.freeze([
  "repoId",
  "parentRepoId",
  "slug",
  "author",
  "title",
  "description",
  "cuisine",
  "culture",
  "category",
  "tags",
  "difficulty",
  "activeTime",
  "totalTime",
  "ratioSystem",
  "stars",
  "forks",
  "contributors",
  "license",
  "createdAt",
  "updatedAt",
  "flavorRadar",
  "ingredients",
  "processNodes",
  "parentSlug",
  "forkNote",
  "changes"
]);

const VALID_RATIO_SYSTEMS = new Set(["parts", "weight", "bakers_percentage"]);
const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(value).digest("hex");
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const nonEmpty = value => typeof value === "string" && value.trim().length > 0;
const canonicalPublicTitle = value => String(value || "")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export function forkRecipeSourceContract() {
  return {
    id: FORKRECIPE_STEP7E_SOURCE_ID,
    name: "ForkRecipe open recipe dataset",
    adapterId: FORKRECIPE_STEP7E_ADAPTER_ID,
    sourceFamily: "FORKRECIPE_OPEN_DATASET",
    versioningMode: "PINNED_GIT_COMMIT",
    rightsEvidenceMode: "SOURCE_LEVEL_CC_BY_SA_4_WITH_PINNED_FILE_PROVENANCE",
    license: FORKRECIPE_STEP7E_LICENSE,
    licenseUrl: FORKRECIPE_STEP7E_LICENSE_URL,
    attributionPolicy: "Attribute ForkRecipe and the record author from the pinned source file; preserve CC BY-SA 4.0 share-alike obligations.",
    runtimeFetch: false,
    mediaState: "EXCLUDED",
    sourceNutritionImportedAsAuthority: false,
    automaticAdmissionAuthorized: false
  };
}

export function sanitizeForkRecipeSourceRecord(recipe) {
  const output = {};
  for (const key of SOURCE_RECIPE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(recipe || {}, key)) output[key] = structuredClone(recipe[key]);
  }
  return output;
}

export function forkRecipeDataErrors(recipe, fileName) {
  const errors = [];
  if (!isObject(recipe)) return ["recipe must be an object"];
  const expectedSlug = String(fileName || "").replace(/\.js$/i, "");
  if (!nonEmpty(recipe.slug)) errors.push("missing slug");
  else if (expectedSlug && recipe.slug !== expectedSlug) errors.push(`slug ${recipe.slug} does not match file ${expectedSlug}`);
  if (!nonEmpty(recipe.repoId)) errors.push("missing repoId");
  if (!nonEmpty(recipe.author)) errors.push("missing author");
  if (!nonEmpty(recipe.title)) errors.push("missing title");
  if (recipe.license !== "CC-BY-SA") errors.push(`unexpected record license ${String(recipe.license)}`);
  if (!VALID_RATIO_SYSTEMS.has(recipe.ratioSystem)) errors.push(`unsupported ratioSystem ${String(recipe.ratioSystem)}`);
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) errors.push("ingredients must be non-empty");
  if (!Array.isArray(recipe.processNodes) || recipe.processNodes.length === 0) errors.push("processNodes must be non-empty");
  for (const [index, ingredient] of (recipe.ingredients || []).entries()) {
    if (!isObject(ingredient)) {
      errors.push(`ingredient ${index} must be an object`);
      continue;
    }
    if (!nonEmpty(ingredient.ingId)) errors.push(`ingredient ${index} missing ingId`);
    if (!nonEmpty(ingredient.name)) errors.push(`ingredient ${index} missing name`);
    if (!Number.isFinite(Number(ingredient.ratioValue))) errors.push(`ingredient ${index} ratioValue must be finite`);
  }
  for (const [index, node] of (recipe.processNodes || []).entries()) {
    if (!isObject(node)) {
      errors.push(`process node ${index} must be an object`);
      continue;
    }
    if (!nonEmpty(node.nodeId)) errors.push(`process node ${index} missing nodeId`);
    if (!nonEmpty(node.instructions)) errors.push(`process node ${index} missing instructions`);
  }
  return errors;
}

export function buildForkRecipePilotPacket(recipe, {
  fileName,
  commit = FORKRECIPE_STEP7E_EXPECTED_COMMIT,
  sourceRightsVerified = true
} = {}) {
  const sourceRecord = sanitizeForkRecipeSourceRecord(recipe);
  const sourcePath = `recipes/${fileName}`;
  const sourceUrl = `https://github.com/${FORKRECIPE_STEP7E_SOURCE_REPO}/blob/${commit}/${sourcePath}`;
  const packetBase = {
    schemaVersion: FORKRECIPE_STEP7E_PACKET_SCHEMA,
    sourceId: FORKRECIPE_STEP7E_SOURCE_ID,
    sourceItemId: String(recipe.slug || ""),
    sourceVersionId: commit,
    canonicalRecipeId: `forkrecipe_${String(recipe.slug || "").replace(/-/g, "_")}`,
    sourcePath,
    sourceUrl,
    immutableLocator: sourceUrl,
    rights: {
      sourceRightsVerified: sourceRightsVerified === true,
      license: FORKRECIPE_STEP7E_LICENSE,
      licenseUrl: FORKRECIPE_STEP7E_LICENSE_URL,
      recordLicenseDeclaration: recipe.license ?? null,
      attribution: `ForkRecipe / ${String(recipe.author || "unknown author")}; pinned source file ${sourcePath}`,
      mediaIncluded: false
    },
    boundaries: {
      sourceNutritionImportedAsAuthority: false,
      dietaryOrAllergenClaimsDerived: false,
      recommendationEligible: false,
      publicRuntimeActivationAuthorized: false,
      automaticAdmissionAuthorized: false,
      ratioValuesPromotedToAbsoluteQuantities: false
    },
    sourceRecord
  };
  const packetJson = stableStringify(packetBase);
  return {
    ...packetBase,
    packetSha256: sha256(packetJson),
    packetBytes: encoder.encode(packetJson).byteLength
  };
}

function controlRecordFor(recipe, fileName, options) {
  const source = forkRecipeSourceContract();
  const packet = buildForkRecipePilotPacket(recipe, { fileName, ...options });
  const dataErrors = forkRecipeDataErrors(recipe, fileName);
  const sourceRightsVerified = options?.sourceRightsVerified === true;
  let reviewState;
  let rightsState;
  let admissionState = null;
  let canonicalRecipeId = null;
  let nutritionState = "NOT_APPLICABLE";
  let holdReason = null;
  let rejectionReason = null;
  let runtimeArtifact = null;

  if (!sourceRightsVerified) {
    reviewState = "HELD";
    rightsState = "HOLD_RIGHTS_AMBIGUOUS";
    holdReason = "FORKRECIPE_SOURCE_LEVEL_RIGHTS_NOT_VERIFIED";
  } else if (dataErrors.length) {
    reviewState = "REJECTED";
    rightsState = "ADMIT_RIGHTS_VERIFIED";
    rejectionReason = `FORKRECIPE_DATA_QUALITY_REJECT: ${dataErrors.join("; ")}`;
  } else {
    reviewState = "ADMITTED";
    rightsState = "ADMIT_RIGHTS_VERIFIED";
    admissionState = "ADMIT_PROTECTED_SOURCE_PILOT_ONLY";
    canonicalRecipeId = packet.canonicalRecipeId;
    nutritionState = "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED";
    runtimeArtifact = {
      schemaVersion: FORKRECIPE_STEP7E_PACKET_SCHEMA,
      canonicalRecipeId,
      packetSha256: packet.packetSha256,
      packetBytes: packet.packetBytes,
      recommendationState: "SOURCE_PILOT_ONLY_NOT_RECOMMENDATION_ELIGIBLE",
      publicRuntimeActivationAuthorized: false
    };
  }

  const provenance = {
    sourceName: source.name,
    sourceItemId: packet.sourceItemId,
    sourceVersionId: packet.sourceVersionId,
    sourceVersionTimestamp: FORKRECIPE_STEP7E_COMMIT_TIMESTAMP,
    sourceUrl: packet.sourceUrl,
    immutableLocator: packet.immutableLocator,
    license: FORKRECIPE_STEP7E_LICENSE,
    licenseUrl: FORKRECIPE_STEP7E_LICENSE_URL,
    attribution: packet.rights.attribution,
    mediaIncluded: false,
    sourceNutritionImportedAsAuthority: false
  };

  return {
    packet,
    dataErrors,
    controlRecord: {
      controlId: `${source.id}:${packet.sourceItemId}:${packet.sourceVersionId}`,
      externalRecordId: packet.sourceItemId,
      sourceId: source.id,
      sourceItemId: packet.sourceItemId,
      sourceVersionId: packet.sourceVersionId,
      title: String(recipe.title || recipe.slug || fileName),
      reviewState,
      rightsState,
      admissionState,
      canonicalRecipeId,
      nutritionState,
      mediaState: "EXCLUDED",
      holdReason,
      rejectionReason,
      provenance,
      runtimeArtifact,
      runtimeActivationAuthorized: false,
      sourceRatioSystem: recipe.ratioSystem ?? null,
      sourceAuthor: recipe.author ?? null
    }
  };
}

function pipelineStagesFor(controlRecord) {
  if (controlRecord.reviewState === "ADMITTED") {
    return {
      provenance: "VERIFIED",
      parse: "PASS",
      normalize: "PARTIAL",
      deduplicate: "PARTIAL",
      ingredientQuantityMapping: "PARTIAL",
      hardMetadata: "PARTIAL",
      nutrition: "FIREWALLED",
      decision: "PASS",
      portableArtifact: "READY"
    };
  }
  if (controlRecord.reviewState === "HELD") {
    return {
      provenance: "VERIFIED",
      parse: "PASS",
      normalize: "NOT_STARTED",
      deduplicate: "NOT_STARTED",
      ingredientQuantityMapping: "NOT_STARTED",
      hardMetadata: "NOT_STARTED",
      nutrition: "NOT_STARTED",
      decision: "HOLD",
      portableArtifact: "NOT_STARTED"
    };
  }
  return {
    provenance: "VERIFIED",
    parse: "REJECT",
    normalize: "NOT_APPLICABLE",
    deduplicate: "NOT_APPLICABLE",
    ingredientQuantityMapping: "NOT_APPLICABLE",
    hardMetadata: "REJECT",
    nutrition: "NOT_APPLICABLE",
    decision: "REJECT",
    portableArtifact: "NOT_APPLICABLE"
  };
}

export function buildForkRecipeStep7ePilot(entries, {
  commit = FORKRECIPE_STEP7E_EXPECTED_COMMIT,
  sourceRightsVerified = false,
  publicTitles = []
} = {}) {
  if (!Array.isArray(entries)) throw new Error("ForkRecipe Step 7E entries must be an array");
  if (commit !== FORKRECIPE_STEP7E_EXPECTED_COMMIT) {
    throw new Error(`ForkRecipe Step 7E requires pinned commit ${FORKRECIPE_STEP7E_EXPECTED_COMMIT}`);
  }
  const source = forkRecipeSourceContract();
  const rows = entries.map(entry => controlRecordFor(entry.recipe, entry.fileName, { commit, sourceRightsVerified }));
  const controlPlane = createControlPlaneSnapshot(source, rows.map(row => row.controlRecord), {
    sourceUniverseState: "PINNED_FORKRECIPE_STEP7E_SOURCE_PILOT"
  });
  const pipeline = createIngestionPipelineSnapshot(
    controlPlane,
    controlPlane.records.map(record => createPipelineRecord(record, pipelineStagesFor(record)))
  );

  const publicTitleSet = new Set(publicTitles.map(canonicalPublicTitle).filter(Boolean));
  const sourceTitles = new Map();
  const sourceTitleDuplicates = [];
  const publicTitleCollisions = [];
  const ratioSystemCounts = {};
  let forkCount = 0;
  let sourceNutritionFieldsPresent = 0;
  let sourceMediaFieldsPresent = 0;

  for (const entry of entries) {
    const recipe = entry.recipe || {};
    ratioSystemCounts[recipe.ratioSystem || "UNKNOWN"] = (ratioSystemCounts[recipe.ratioSystem || "UNKNOWN"] || 0) + 1;
    if (recipe.parentSlug || recipe.parentRepoId) forkCount += 1;
    if (["nutrition", "nutritionFacts", "calories"].some(key => Object.prototype.hasOwnProperty.call(recipe, key))) sourceNutritionFieldsPresent += 1;
    if (["image", "images", "photo", "photos", "media", "video", "videos"].some(key => Object.prototype.hasOwnProperty.call(recipe, key))) sourceMediaFieldsPresent += 1;
    const normalizedTitle = canonicalPublicTitle(recipe.title);
    if (normalizedTitle) {
      if (sourceTitles.has(normalizedTitle)) sourceTitleDuplicates.push([sourceTitles.get(normalizedTitle), recipe.slug]);
      else sourceTitles.set(normalizedTitle, recipe.slug);
      if (publicTitleSet.has(normalizedTitle)) publicTitleCollisions.push(recipe.slug);
    }
  }

  const admitted = controlPlane.records.filter(record => record.reviewState === "ADMITTED");
  const held = controlPlane.records.filter(record => record.reviewState === "HELD");
  const rejected = controlPlane.records.filter(record => record.reviewState === "REJECTED");
  const packets = rows
    .filter(row => row.controlRecord.reviewState === "ADMITTED")
    .map(row => row.packet)
    .sort((a, b) => a.sourceItemId.localeCompare(b.sourceItemId));
  const totalPacketBytes = packets.reduce((sum, packet) => sum + packet.packetBytes, 0);
  const withinPilotRange = entries.length >= FORKRECIPE_STEP7E_MIN_PILOT && entries.length <= FORKRECIPE_STEP7E_MAX_PILOT;
  const exactPinnedCount = entries.length === FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT;
  const pass = sourceRightsVerified === true && withinPilotRange && exactPinnedCount && held.length === 0 && rejected.length === 0 && admitted.length === entries.length;

  const audit = {
    schemaVersion: FORKRECIPE_STEP7E_SCHEMA,
    sourceId: source.id,
    upstream: {
      repository: FORKRECIPE_STEP7E_SOURCE_REPO,
      commit,
      commitTimestamp: FORKRECIPE_STEP7E_COMMIT_TIMESTAMP,
      expectedRecipeCount: FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT,
      actualRecipeCount: entries.length,
      sourceRightsVerified: sourceRightsVerified === true
    },
    decisions: {
      admittedProtectedSourcePilotOnly: admitted.length,
      held: held.length,
      rejected: rejected.length,
      recommendationEligible: 0,
      publicRuntimeActivated: 0
    },
    dataQuality: {
      ratioSystemCounts,
      forkCount,
      sourceTitleDuplicateCount: sourceTitleDuplicates.length,
      sourceTitleDuplicates,
      publicTitleCollisionCount: publicTitleCollisions.length,
      publicTitleCollisions: [...new Set(publicTitleCollisions)].sort(),
      sourceNutritionFieldsPresent,
      sourceMediaFieldsPresent,
      ratioValuesPromotedToAbsoluteQuantities: false,
      dietaryOrAllergenClaimsDerived: false
    },
    artifact: {
      packetCount: packets.length,
      totalPacketBytes,
      packetFingerprintSha256: sha256(packets.map(packet => packet.packetSha256).join("\n")),
      controlPlaneSha256: controlPlane.snapshotSha256,
      pipelineSha256: pipeline.pipelineSha256
    },
    boundaries: {
      runtimeFetch: false,
      mediaExcluded: true,
      nutritionAuthorityImported: false,
      publicRuntimeSwitchAuthorized: false,
      automaticAdmissionAuthorized: false,
      futureRecipeBodyD1ShardsCreated: false,
      existingAuthenticatedFailClosedArchitecturePreserved: true
    },
    terminalState: pass
      ? "STEP_7E_FORKRECIPE_PINNED_SOURCE_AUDIT_PASS_LIVE_PILOT_PENDING"
      : "STEP_7E_FORKRECIPE_SOURCE_AUDIT_HOLD"
  };

  return {
    pass,
    source,
    audit,
    controlPlane,
    pipeline,
    packets,
    pilotSha256: sha256(stableStringify({ audit, packets }))
  };
}
