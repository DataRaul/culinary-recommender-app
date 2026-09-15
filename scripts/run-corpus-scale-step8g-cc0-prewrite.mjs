import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import {
  STEP8G_CC0_EXPECTED_RECIPE_COUNT,
  STEP8G_CC0_SOURCE_COMMIT,
  buildStep8GCc0V8003Prewrite
} from "./corpus-scale-step8g-cc0-prewrite-core.mjs";
import {
  FORKRECIPE_STEP7E_EXPECTED_COMMIT,
  FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT
} from "./forkrecipe-step7e-core.mjs";
import { STEP8G_MAX_PROTECTED_D1_SUBQUERIES } from "./corpus-scale-step8g-population-core.mjs";

const MAX_WRITE_REQUEST_BYTES = 262_144;

function parseArgs(argv) {
  const options = {
    candidate: null,
    forkrecipe: null,
    parentManifest: "data/generated/step8d/manifest.json",
    measurement: "data/generated/step8g/cc0-markdown-measurement.json",
    output: ".tmp/step8g-cc0-v8003-prewrite"
  };
  for (const arg of argv) {
    if (arg.startsWith("--candidate=")) options.candidate = arg.slice("--candidate=".length);
    else if (arg.startsWith("--forkrecipe=")) options.forkrecipe = arg.slice("--forkrecipe=".length);
    else if (arg.startsWith("--parent-manifest=")) options.parentManifest = arg.slice("--parent-manifest=".length);
    else if (arg.startsWith("--measurement=")) options.measurement = arg.slice("--measurement=".length);
    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length) || options.output;
  }
  if (!options.candidate || !options.forkrecipe) throw new Error("--candidate and --forkrecipe are required");
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function loadCandidateEntries(root) {
  const dir = resolve(root, "src");
  const files = (await readdir(dir)).filter(file => file.endsWith(".md")).sort();
  return Promise.all(files.map(async fileName => {
    const rawMarkdown = await readFile(resolve(dir, fileName), "utf8");
    return { fileName, rawMarkdown, parsed: parseCc0MarkdownRecipe(rawMarkdown, { fileName }) };
  }));
}

async function loadForkEntries(root) {
  const dir = resolve(root, "recipes");
  const files = (await readdir(dir))
    .filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js")
    .sort();
  const entries = [];
  for (const fileName of files) {
    const mod = await import(pathToFileURL(resolve(dir, fileName)).href);
    entries.push({ fileName, recipe: mod.default });
  }
  return entries;
}

const utf8Bytes = value => Buffer.byteLength(String(value), "utf8");

const args = parseArgs(process.argv.slice(2));
const candidateRoot = resolve(args.candidate);
const forkRoot = resolve(args.forkrecipe);
const outputRoot = resolve(args.output);
if (commitAt(candidateRoot) !== STEP8G_CC0_SOURCE_COMMIT) throw new Error("CC0_CANDIDATE_PIN_MISMATCH");
if (commitAt(forkRoot) !== FORKRECIPE_STEP7E_EXPECTED_COMMIT) throw new Error("FORKRECIPE_PIN_MISMATCH");

const [candidateEntries, forkEntries, step8dParentManifest, measurementEvidence] = await Promise.all([
  loadCandidateEntries(candidateRoot),
  loadForkEntries(forkRoot),
  readFile(resolve(args.parentManifest), "utf8").then(JSON.parse),
  readFile(resolve(args.measurement), "utf8").then(JSON.parse)
]);
if (candidateEntries.length !== STEP8G_CC0_EXPECTED_RECIPE_COUNT) {
  throw new Error(`CC0_EXPECTED_${STEP8G_CC0_EXPECTED_RECIPE_COUNT}_GOT_${candidateEntries.length}`);
}
if (forkEntries.length !== FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT) {
  throw new Error(`FORKRECIPE_EXPECTED_${FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT}_GOT_${forkEntries.length}`);
}

const publicTitles = ALL_RECIPES.map(recipe => recipe.identity?.canonicalTitle || recipe.title || recipe.id);
const result = buildStep8GCc0V8003Prewrite({
  candidateEntries,
  forkEntries,
  publicTitles,
  step8dParentManifest,
  measurementEvidence
});
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
  terminalCandidate: pass ? result.terminalCandidate : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
  date: "2026-09-15",
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
    ? "EARN_V8003_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_ON_EXISTING_TWO_SHARD_TOPOLOGY"
    : "STOP_FOR_SCALE_OR_COST_REDESIGN",
  notes: [
    "v8003 is an immutable incremental CC0 markdown layer whose active parent is v8002; no v8001/v8002 bodies are rewritten or duplicated.",
    "The v8003 route index is reconstructed from the exact frozen v8001 + v8002 source pins, then appends 226 exact routes.",
    "Raw source markdown is preserved in protected packets; parsed ingredients/tags are explicitly non-authoritative measurement metadata.",
    "This evidence performs zero D1 writes and keeps Step 8F parked."
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
