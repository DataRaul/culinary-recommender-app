import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  FORKRECIPE_STEP7E_EXPECTED_COMMIT,
  FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT
} from "./forkrecipe-step7e-core.mjs";
import {
  STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
  buildStep8GForkRecipePrewrite
} from "./corpus-scale-step8g-population-core.mjs";

const MAX_WRITE_REQUEST_BYTES = 262_144;

function parseArgs(argv) {
  const options = {
    forkrecipe: null,
    parentManifest: "data/generated/step8d/manifest.json",
    output: ".tmp/step8g-forkrecipe-prewrite"
  };
  for (const arg of argv) {
    if (arg.startsWith("--forkrecipe=")) options.forkrecipe = arg.slice("--forkrecipe=".length);
    else if (arg.startsWith("--parent-manifest=")) options.parentManifest = arg.slice("--parent-manifest=".length);
    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length) || options.output;
  }
  if (!options.forkrecipe) throw new Error("--forkrecipe=<checked-out source path> is required");
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function loadForkEntries(sourceRoot) {
  const recipesDir = resolve(sourceRoot, "recipes");
  const files = (await readdir(recipesDir))
    .filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js")
    .sort();
  const entries = [];
  for (const fileName of files) {
    const mod = await import(pathToFileURL(resolve(recipesDir, fileName)).href);
    entries.push({ fileName, recipe: mod.default });
  }
  return entries;
}

const utf8Bytes = value => Buffer.byteLength(String(value), "utf8");

const args = parseArgs(process.argv.slice(2));
const forkRoot = resolve(args.forkrecipe);
const outputRoot = resolve(args.output);
const forkCommit = commitAt(forkRoot);
if (forkCommit !== FORKRECIPE_STEP7E_EXPECTED_COMMIT) throw new Error(`FORKRECIPE_PIN_MISMATCH_${forkCommit}`);

const [forkEntries, parentManifest] = await Promise.all([
  loadForkEntries(forkRoot),
  readFile(resolve(args.parentManifest), "utf8").then(JSON.parse)
]);
if (forkEntries.length !== FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT) {
  throw new Error(`FORKRECIPE_EXPECTED_${FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT}_GOT_${forkEntries.length}`);
}

const publicTitles = ALL_RECIPES.map(recipe => recipe.identity?.canonicalTitle || recipe.title || recipe.id);
const result = buildStep8GForkRecipePrewrite({ forkEntries, publicTitles, parentManifest });
const batches = result.layerPlan.batches;
const writeRequestSizes = batches.map(batch => utf8Bytes(JSON.stringify({
  action: "write-batch",
  batchId: batch.batchId,
  entries: batch.entries
})));
const maxWriteRequestBytes = Math.max(...writeRequestSizes);
const maxBatchRows = Math.max(...batches.map(batch => batch.rowCount));
const maxWriteD1Subqueries = 1 + 1 + (maxBatchRows + 1) + 1 + 1;
const requestSizePass = maxWriteRequestBytes <= MAX_WRITE_REQUEST_BYTES;
const writeQueryBudgetPass = maxWriteD1Subqueries <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
const pass = result.pass && requestSizePass && writeQueryBudgetPass;

const descriptorBatches = batches.map(batch => ({
  ...batch,
  entries: batch.entries.map(({ bodyJson, ...descriptor }) => descriptor)
}));
const evidence = {
  schema: result.schema,
  pass,
  terminalCandidate: pass
    ? result.terminalCandidate
    : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
  date: "2026-09-14",
  source: result.source,
  parent: result.parent,
  layer: {
    ...result.layer,
    maxWriteRequestBytes,
    maxAllowedWriteRequestBytes: MAX_WRITE_REQUEST_BYTES,
    requestSizePass,
    maxWriteD1Subqueries,
    maxAllowedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
    writeQueryBudgetPass
  },
  composition: result.composition,
  hydrationProbe: result.hydrationProbe,
  boundaries: result.boundaries,
  decision: pass
    ? "EARN_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_ON_EXISTING_TWO_SHARD_TOPOLOGY"
    : "STOP_FOR_SCALE_OR_COST_REDESIGN",
  notes: [
    "v8002 is an immutable incremental ForkRecipe layer whose parent is v8001; the 501 UniTools parent rows are not rewritten.",
    "The route index maps exact recipe IDs to corpus version and shard, allowing mixed-layer hydration without scanning body tables.",
    "This evidence performs zero D1 writes and does not activate Step 8F or recommendation admission."
  ]
};

await mkdir(outputRoot, { recursive: true });
await Promise.all([
  writeFile(resolve(outputRoot, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "composition-manifest.json"), `${JSON.stringify(result.composition, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "route-index.json"), `${JSON.stringify(result.routeIndex, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "population-plan-descriptors.json"), `${JSON.stringify({
    contractVersion: result.layerPlan.contractVersion,
    manifest: result.layerPlan.manifest,
    batches: descriptorBatches,
    populationPlanSha256: result.layerPlan.populationPlanSha256
  }, null, 2)}\n`, "utf8")
]);

process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!pass) process.exitCode = 1;
