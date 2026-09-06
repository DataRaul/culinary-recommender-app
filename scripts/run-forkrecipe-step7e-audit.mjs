import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  FORKRECIPE_STEP7E_EXPECTED_COMMIT,
  FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT,
  FORKRECIPE_STEP7E_LICENSE,
  FORKRECIPE_STEP7E_LICENSE_URL,
  buildForkRecipeStep7ePilot
} from "./forkrecipe-step7e-core.mjs";

function parseArgs(argv) {
  const options = {
    source: null,
    output: ".tmp/step7e-forkrecipe-audit"
  };
  for (const arg of argv) {
    if (arg.startsWith("--source=")) options.source = arg.slice("--source=".length);
    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length) || options.output;
  }
  if (!options.source) throw new Error("--source=<checked-out forkrecipe-recipes path> is required");
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function sourceRightsEvidence(sourceRoot) {
  const [readme, license, contributing] = await Promise.all([
    readFile(resolve(sourceRoot, "README.md"), "utf8"),
    readFile(resolve(sourceRoot, "LICENSE"), "utf8"),
    readFile(resolve(sourceRoot, "CONTRIBUTING.md"), "utf8")
  ]);
  const checks = {
    readmeDatasetContentDeclaration: /data layer[^\n]*recipe content itself|recipe content itself, structured and open/i.test(readme),
    readmeAllRecipesCcBySa4: /All recipes here are licensed \*\*CC BY-SA 4\.0\*\*/i.test(readme),
    readmeOriginalOrPublicDomain: /originally authored[^\n]*adapted from public-domain sources/i.test(readme),
    licenseIsCcBySa4: /Creative Commons Attribution-ShareAlike 4\.0 International/i.test(license),
    contributingAcceptedContentCcBySa4: /All accepted content is licensed CC BY-SA 4\.0/i.test(contributing),
    contributingNoCopyrightedCommercialCopy: /Don't paste in copyrighted[\s\S]*commercial site or cookbook still under copyright/i.test(contributing)
  };
  return {
    pass: Object.values(checks).every(Boolean),
    checks,
    declaration: FORKRECIPE_STEP7E_LICENSE,
    licenseUrl: FORKRECIPE_STEP7E_LICENSE_URL
  };
}

async function loadRecipes(sourceRoot) {
  const recipesDir = resolve(sourceRoot, "recipes");
  const files = (await readdir(recipesDir))
    .filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js")
    .sort();
  const entries = [];
  for (const fileName of files) {
    const moduleUrl = pathToFileURL(resolve(recipesDir, fileName)).href;
    const mod = await import(moduleUrl);
    entries.push({ fileName, recipe: mod.default });
  }
  return entries;
}

const args = parseArgs(process.argv.slice(2));
const sourceRoot = resolve(args.source);
const outputRoot = resolve(args.output);
const commit = commitAt(sourceRoot);
if (commit !== FORKRECIPE_STEP7E_EXPECTED_COMMIT) {
  throw new Error(`ForkRecipe checkout must be pinned to ${FORKRECIPE_STEP7E_EXPECTED_COMMIT}; got ${commit}`);
}

const rights = await sourceRightsEvidence(sourceRoot);
const entries = await loadRecipes(sourceRoot);
const publicTitles = ALL_RECIPES.map(recipe => recipe.identity?.canonicalTitle || recipe.title || recipe.id);
const pilot = buildForkRecipeStep7ePilot(entries, {
  commit,
  sourceRightsVerified: rights.pass,
  publicTitles
});

const [readme, contributing] = await Promise.all([
  readFile(resolve(sourceRoot, "README.md"), "utf8"),
  readFile(resolve(sourceRoot, "CONTRIBUTING.md"), "utf8")
]);
const readmeDeclaredCount = Number(readme.match(/(?:^|\n)\s*(\d+)\s+recipes as schema-valid JS modules/i)?.[1] || 0) || null;
const contributingDeclaredCount = Number(contributing.match(/✓\s+(\d+)\s+recipe\(s\) valid/i)?.[1] || 0) || null;
const documentationCountDrift = [readmeDeclaredCount, contributingDeclaredCount]
  .filter(value => value !== null)
  .some(value => value !== entries.length);

const summary = {
  ...pilot.audit,
  rightsEvidence: rights,
  sourceValidation: {
    upstreamValidatorMustPassSeparately: true,
    expectedRecipeCount: FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT,
    loadedRecipeCount: entries.length,
    uniqueFileCount: new Set(entries.map(entry => basename(entry.fileName))).size,
    readmeDeclaredCount,
    contributingDeclaredCount,
    documentationCountDrift,
    documentationCountDriftBlocking: false,
    note: documentationCountDrift
      ? "Pinned source documentation is internally inconsistent about recipe count. The checked-out tree and passing upstream validator are authoritative for this bounded audit; the discrepancy is retained as provenance drift rather than silently corrected."
      : null
  },
  pilotSha256: pilot.pilotSha256
};

await mkdir(outputRoot, { recursive: true });
await Promise.all([
  writeFile(resolve(outputRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "control-plane.json"), `${JSON.stringify(pilot.controlPlane, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "pipeline.json"), `${JSON.stringify(pilot.pipeline, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "pilot-packets.json"), `${JSON.stringify({
    schemaVersion: "forkrecipe-step7e-pilot-packets-v1",
    sourceId: pilot.source.id,
    upstreamCommit: commit,
    runtimeActivationAuthorized: false,
    recommendationEligible: false,
    sourceNutritionImportedAsAuthority: false,
    packetCount: pilot.packets.length,
    pilotSha256: pilot.pilotSha256,
    packets: pilot.packets
  }, null, 2)}\n`, "utf8")
]);

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (!pilot.pass) process.exitCode = 1;
