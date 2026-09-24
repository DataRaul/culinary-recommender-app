import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildRecipeImageRegistry,
  validateRecipeImageAssetRecord,
  validateRecipeImagesP0Config
} from "./recipe-images-p0.mjs";

export const RECIPE_IMAGES_P0_ASSET_PILOT_SCHEMA = "CULINARY_RECIPE_IMAGES_P0_ASSET_PILOT_V1";
export const RECIPE_IMAGES_P0_ASSET_PILOT_TERMINAL = "D3_RECIPE_IMAGES_P0_ASSET_PILOT_PASS";

const SHA256 = value => createHash("sha256").update(value).digest("hex");
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function validateAssetPilotConfig(pilot, design) {
  const errors = [];
  if (!isObject(pilot)) return ["asset pilot config must be an object"];
  if (pilot.schemaVersion !== RECIPE_IMAGES_P0_ASSET_PILOT_SCHEMA) errors.push("unexpected asset pilot schemaVersion");
  if (pilot.entryGate !== "D3_RECIPE_IMAGES_P0_DESIGN_CONTRACT_PASS") errors.push("asset pilot entry gate mismatch");
  if (pilot.designContract !== "config/recipe_images_p0.json") errors.push("asset pilot design contract path mismatch");
  if (pilot.assetClass !== "PROJECT_AUTHORED") errors.push("P0 asset pilot must remain PROJECT_AUTHORED");
  if (pilot.reuseState !== "PROJECT_OWNED_INTERNAL_AND_PUBLIC_APP_USE") errors.push("asset pilot reuseState mismatch");
  if (!isObject(pilot.provenance) || !pilot.provenance.origin || !pilot.provenance.rightsBasis) errors.push("pilot provenance is incomplete");
  if (!Array.isArray(pilot.assets) || pilot.assets.length !== design?.scope?.pilotRecipeCount) errors.push("asset pilot must cover the full design cohort");
  const ids = new Set();
  const recipes = new Set();
  for (const row of pilot.assets || []) {
    if (!row?.assetId || ids.has(row.assetId)) errors.push("asset pilot asset IDs must be unique");
    if (!row?.recipeId || recipes.has(row.recipeId)) errors.push("asset pilot recipe IDs must be unique");
    ids.add(row?.assetId);
    recipes.add(row?.recipeId);
    if (!design?.scope?.pilotRecipeIds?.includes(row?.recipeId)) errors.push(`asset recipe is outside design cohort: ${row?.recipeId || "missing"}`);
    if (row?.repositoryPath !== `assets/recipes/${row?.recipeId}.svg`) errors.push(`unexpected repositoryPath for ${row?.recipeId}`);
    if (row?.assetPath !== `/assets/recipes/${row?.recipeId}.svg`) errors.push(`unexpected assetPath for ${row?.recipeId}`);
    if (row?.format !== "svg") errors.push(`${row?.recipeId}: P0 asset format must be svg`);
    if (row?.width !== 960 || row?.height !== 720) errors.push(`${row?.recipeId}: P0 SVG dimensions must be 960x720`);
    if (!row?.altText || row.altText.length > design?.presentationContract?.altTextMaxChars) errors.push(`${row?.recipeId}: invalid altText`);
  }
  for (const recipeId of design?.scope?.pilotRecipeIds || []) {
    if (!recipes.has(recipeId)) errors.push(`missing pilot asset for ${recipeId}`);
  }
  const security = pilot.svgSecurity || {};
  for (const key of ["scriptElementsAllowed","foreignObjectAllowed","externalHrefAllowed","eventHandlerAttributesAllowed","embeddedRasterDataAllowed"]) {
    if (security[key] !== false) errors.push(`svgSecurity.${key} must remain false`);
  }
  const boundary = pilot.publicationBoundary || {};
  if (boundary.exactPilotAssetFilesMayShipAsStaticPublicFiles !== true) errors.push("exact pilot files must be explicitly public-static eligible");
  for (const key of ["publicUiActivationAuthorized","recipeRuntimeBehaviorChanged","externalMediaAdmissionAuthorized","protectedCorpusMutationAuthorized"]) {
    if (boundary[key] !== false) errors.push(`publicationBoundary.${key} must remain false`);
  }
  for (const key of ["paidMediaServiceAuthorized","protectedD1WriteAuthorized","thirdD1ShardAuthorized","knowledgeCoreWriteAuthorized","barbecueMutationAuthorized"]) {
    if (pilot.authority?.[key] !== false) errors.push(`authority.${key} must remain false`);
  }
  if (pilot.nextGate !== "D3_RECIPE_IMAGES_P0_BROWSER_INTEGRATION") errors.push("unexpected asset pilot nextGate");
  return errors;
}

export function validateSvgAssetText(svg, metadata) {
  const errors = [];
  if (typeof svg !== "string" || !svg.trim().startsWith("<svg")) errors.push(`${metadata.recipeId}: SVG root missing`);
  const width = Number(svg.match(/\bwidth="([0-9]+)"/)?.[1]);
  const height = Number(svg.match(/\bheight="([0-9]+)"/)?.[1]);
  const viewBox = svg.match(/\bviewBox="([^"]+)"/)?.[1] || "";
  if (width !== metadata.width || height !== metadata.height) errors.push(`${metadata.recipeId}: SVG dimensions mismatch metadata`);
  if (viewBox !== `0 0 ${metadata.width} ${metadata.height}`) errors.push(`${metadata.recipeId}: SVG viewBox mismatch metadata`);
  if (/<script\b/i.test(svg)) errors.push(`${metadata.recipeId}: script element forbidden`);
  if (/<foreignObject\b/i.test(svg)) errors.push(`${metadata.recipeId}: foreignObject forbidden`);
  if (/\son[a-z]+\s*=/i.test(svg)) errors.push(`${metadata.recipeId}: event handler attribute forbidden`);
  if (/\b(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/)/i.test(svg)) errors.push(`${metadata.recipeId}: external href forbidden`);
  if (/\b(?:href|xlink:href)\s*=\s*["']data:image\//i.test(svg)) errors.push(`${metadata.recipeId}: embedded raster data forbidden`);
  if (/<image\b/i.test(svg)) errors.push(`${metadata.recipeId}: image element forbidden in project-authored vector pilot`);
  return errors;
}

export function buildAssetRecord(metadata, svg, pilot) {
  const content = Buffer.from(svg, "utf8");
  return {
    assetId: metadata.assetId,
    recipeId: metadata.recipeId,
    assetClass: pilot.assetClass,
    reuseState: pilot.reuseState,
    provenance: structuredClone(pilot.provenance),
    contentSha256: SHA256(content),
    assetPath: metadata.assetPath,
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    bytes: content.byteLength,
    altText: metadata.altText
  };
}

export async function buildRecipeImagesP0AssetPilot(options = {}) {
  const root = resolve(options.root || process.cwd());
  const designPath = resolve(root, options.designPath || "config/recipe_images_p0.json");
  const pilotPath = resolve(root, options.pilotPath || "config/recipe_images_p0_asset_pilot.json");
  const design = JSON.parse(await readFile(designPath, "utf8"));
  const pilot = JSON.parse(await readFile(pilotPath, "utf8"));

  const designErrors = validateRecipeImagesP0Config(design);
  if (designErrors.length) throw new Error(`Invalid Recipe Images P0 design:\n- ${designErrors.join("\n- ")}`);
  const pilotErrors = validateAssetPilotConfig(pilot, design);
  if (pilotErrors.length) throw new Error(`Invalid Recipe Images P0 asset pilot:\n- ${pilotErrors.join("\n- ")}`);

  const records = [];
  const fileEvidence = [];
  for (const metadata of pilot.assets) {
    const absolutePath = resolve(root, metadata.repositoryPath);
    const svg = await readFile(absolutePath, "utf8");
    const svgErrors = validateSvgAssetText(svg, metadata);
    if (svgErrors.length) throw new Error(`Invalid P0 SVG asset:\n- ${svgErrors.join("\n- ")}`);
    const record = buildAssetRecord(metadata, svg, pilot);
    const recordErrors = validateRecipeImageAssetRecord(record, design);
    if (recordErrors.length) throw new Error(`Invalid P0 asset record:\n- ${recordErrors.join("\n- ")}`);
    records.push(record);
    fileEvidence.push({
      recipeId: record.recipeId,
      repositoryPath: metadata.repositoryPath,
      bytes: record.bytes,
      contentSha256: record.contentSha256,
      width: record.width,
      height: record.height
    });
  }

  const registry = buildRecipeImageRegistry(records, design);
  if (!registry.completePilotCoverage) throw new Error("asset pilot does not cover the full six-recipe cohort");

  const evidenceBase = {
    schemaVersion: RECIPE_IMAGES_P0_ASSET_PILOT_SCHEMA,
    pass: true,
    terminal: RECIPE_IMAGES_P0_ASSET_PILOT_TERMINAL,
    assetCount: registry.assetCount,
    totalBytes: registry.totalBytes,
    registrySha256: registry.registrySha256,
    allAssetsProjectAuthored: records.every(row => row.assetClass === "PROJECT_AUTHORED"),
    publicUiActivationAuthorized: false,
    runtimeBehaviorChanged: false,
    externalMediaAdmissionAuthorized: false,
    protectedCorpusMutationAuthorized: false,
    paidMediaServiceAuthorized: false,
    knowledgeCoreWriteAuthorized: false,
    barbecueMutationAuthorized: false,
    nextGate: pilot.nextGate,
    files: fileEvidence.sort((a,b) => a.recipeId.localeCompare(b.recipeId))
  };
  return {
    design,
    pilot,
    registry,
    evidence: {
      ...evidenceBase,
      evidenceSha256: SHA256(JSON.stringify(evidenceBase))
    }
  };
}
