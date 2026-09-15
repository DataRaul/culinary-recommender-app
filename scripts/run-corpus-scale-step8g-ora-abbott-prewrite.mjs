import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";
import {
  STEP8G_MAX_DATABASE_BYTES,
  STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
  STEP8G_MAX_ROWS_PER_WRITE_BATCH,
  STEP8G_MAX_TOTAL_BYTES,
  STEP8G_SHARD_COUNT
} from "./corpus-scale-step8g-population-core.mjs";

const ORA_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const SOURCE_REPOSITORY = "AdamBouhmad/open-recipe-archive";
const SOURCE_URL = "https://archive.org/details/b21505524";
const SOURCE_TITLE = "The English and Australian Cookery Book";
const SOURCE_AUTHOR = "Edward Abbott";
const SOURCE_YEAR = "1864";
const SOURCE_COHORT_ID = "ORA_ABBOTT_1864_AE3BD2C";
const PARENT_VERSION = "v8003";
const LAYER_VERSION = "v8004";
const PARENT_COUNT = 1642;
const CANDIDATE_COUNT = 713;
const COMPOSED_COUNT = PARENT_COUNT + CANDIDATE_COUNT;
const MEASUREMENT_TERMINAL = "STEP_8G_ORA_ABBOTT_MEASUREMENT_EARNED_COHORT_CANDIDATE";
const MAX_WRITE_REQUEST_BYTES = 262_144;

const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(value).digest("hex");
const utf8Bytes = value => encoder.encode(String(value)).byteLength;

function parseArgs(argv) {
  const args = {
    ora: null,
    measurement: "data/generated/step8g/ora-abbott-1864-measurement.json",
    parentEvidence: "data/generated/step8g/cc0-v8003-prewrite-evidence.json",
    output: ".tmp/step8g-ora-abbott-v8004-prewrite"
  };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) args.ora = arg.slice(6);
    else if (arg.startsWith("--measurement=")) args.measurement = arg.slice(14);
    else if (arg.startsWith("--parent-evidence=")) args.parentEvidence = arg.slice(18);
    else if (arg.startsWith("--out=")) args.output = arg.slice(6) || args.output;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.ora) throw new Error("--ora is required");
  return args;
}

function commitAt(root) {
  return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function frontMatter(markdown) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(String(markdown ?? ""));
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);
    if (field) meta[field[1]] = field[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return meta;
}

function section(markdown, headingPattern) {
  const pattern = new RegExp(`^##\\s+${headingPattern}\\s*$`, "im");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const rest = markdown.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

function parseRecipe(markdown) {
  const text = String(markdown ?? "");
  const meta = frontMatter(text);
  const ingredients = section(text, "Ingredients")
    .split(/\r?\n/)
    .filter(line => /^\s*[-*+]\s+/.test(line))
    .map(line => line.replace(/^\s*[-*+]\s+/, "").trim())
    .filter(Boolean);
  const directions = section(text, "(?:Directions|Instructions|Method)")
    .split(/\r?\n/)
    .filter(line => /^\s*(?:\d+[.)]|[-*+])\s+/.test(line))
    .map(line => line.replace(/^\s*(?:\d+[.)]|[-*+])\s+/, "").trim())
    .filter(Boolean);
  return { meta, ingredients, directions };
}

function slug(fileName) {
  return fileName.replace(/\.md$/i, "").normalize("NFKD").replace(/\p{M}+/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

async function loadCandidate(root) {
  const dir = resolve(root, "collections/australian-table/recipes");
  const files = (await readdir(dir)).filter(file => file.endsWith(".md")).sort();
  const rows = [];
  for (const fileName of files) {
    const rawMarkdown = await readFile(resolve(dir, fileName), "utf8");
    const parsed = parseRecipe(rawMarkdown);
    if (parsed.meta.source_url === SOURCE_URL) rows.push({ fileName, rawMarkdown, parsed });
  }
  return rows;
}

function assertRights(row) {
  const meta = row.parsed.meta;
  if (meta.source_title !== SOURCE_TITLE) throw new Error(`${row.fileName}: SOURCE_TITLE_MISMATCH`);
  if (meta.author !== SOURCE_AUTHOR) throw new Error(`${row.fileName}: SOURCE_AUTHOR_MISMATCH`);
  if (meta.source_year !== SOURCE_YEAR) throw new Error(`${row.fileName}: SOURCE_YEAR_MISMATCH`);
  if (meta.source_url !== SOURCE_URL) throw new Error(`${row.fileName}: SOURCE_URL_MISMATCH`);
  if (meta.license !== "public-domain") throw new Error(`${row.fileName}: SOURCE_LICENSE_MISMATCH`);
  if (!meta.title || !row.parsed.ingredients.length || !row.parsed.directions.length) {
    throw new Error(`${row.fileName}: STRUCTURAL_SOURCE_MISMATCH`);
  }
}

function buildPackets(rows) {
  if (rows.length !== CANDIDATE_COUNT) throw new Error(`ORA_ABBOTT_EXPECTED_${CANDIDATE_COUNT}_GOT_${rows.length}`);
  const seen = new Set();
  return rows.map((row, ordinal) => {
    assertRights(row);
    const recipeId = `ora_abbott_1864_${slug(row.fileName)}`;
    if (!recipeId || seen.has(recipeId)) throw new Error(`DUPLICATE_OR_INVALID_RECIPE_ID_${recipeId}`);
    seen.add(recipeId);
    const packet = {
      schema: "STEP8G_ORA_ABBOTT_1864_PROTECTED_SOURCE_PACKET_V1",
      canonicalRecipeId: recipeId,
      source: {
        cohortId: SOURCE_COHORT_ID,
        repository: SOURCE_REPOSITORY,
        commit: ORA_COMMIT,
        path: `collections/australian-table/recipes/${row.fileName}`,
        sourceContentSha256: sha256(row.rawMarkdown),
        sourceWork: SOURCE_TITLE,
        sourceAuthor: SOURCE_AUTHOR,
        sourceYear: SOURCE_YEAR,
        sourceUrl: SOURCE_URL,
        licenseId: "public-domain"
      },
      sourceContent: {
        rawMarkdown: row.rawMarkdown,
        title: row.parsed.meta.title,
        parsedIngredientsNonAuthoritative: row.parsed.ingredients,
        parsedDirectionsNonAuthoritative: row.parsed.directions
      },
      authority: {
        recommendationAdmissionAuthorized: false,
        publicRuntimeActivationAuthorized: false,
        ingredientOntologyAuthority: false,
        nutritionAuthority: false,
        dietaryAllergenAuthority: false,
        scalingAuthority: false,
        knowledgeCoreWriteAuthorized: false
      }
    };
    const bodyJson = JSON.stringify(packet);
    return { ordinal, recipeId, sourceCohortId: SOURCE_COHORT_ID, bodyJson, bodySha256: sha256(bodyJson), bodyBytes: utf8Bytes(bodyJson) };
  });
}

function buildPlan(packets) {
  const bodyById = new Map(packets.map(row => [row.recipeId, row.bodyJson]));
  const plan = buildStep8APopulationPlan({
    corpusVersion: LAYER_VERSION,
    parentCorpusVersion: PARENT_VERSION,
    sourceCohorts: [{
      id: SOURCE_COHORT_ID,
      sourceName: `${SOURCE_TITLE} (bounded Open Recipe Archive source-work cohort)`,
      sourceVersion: ORA_COMMIT,
      admissionState: MEASUREMENT_TERMINAL,
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        "data/generated/step8g/ora-abbott-1864-measurement.json",
        "docs/CORPUS_SCALE_STEP8G_ORA_ABBOTT_RIGHTS_AND_MEASUREMENT.md",
        `https://github.com/${SOURCE_REPOSITORY}/tree/${ORA_COMMIT}/collections/australian-table`
      ]
    }],
    entries: packets.map(({ bodyJson, ...descriptor }) => descriptor),
    recipeShardCount: STEP8G_SHARD_COUNT,
    rowsPerWriteBatch: STEP8G_MAX_ROWS_PER_WRITE_BATCH
  });
  return {
    ...plan,
    batches: plan.batches.map(batch => ({ ...batch, entries: batch.entries.map(entry => ({ ...entry, bodyJson: bodyById.get(entry.recipeId) })) }))
  };
}

function computeCapacity(parentEvidence, plan) {
  const parent = parentEvidence?.composition;
  if (parentEvidence?.pass !== true || parent?.activeCorpusVersion !== PARENT_VERSION || parent?.cumulativeRecipeCount !== PARENT_COUNT) {
    throw new Error("VALID_V8003_PARENT_EVIDENCE_REQUIRED");
  }
  const prior = parent.capacity?.perShard || [];
  if (prior.length !== STEP8G_SHARD_COUNT) throw new Error("V8003_PARENT_SHARD_CAPACITY_MISSING");
  const added = plan.manifest.recipeBodyShards.descriptors;
  const perShard = Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) => {
    const before = prior.find(row => Number(row.shardNumber) === shardNumber);
    const delta = added.find(row => Number(row.shardNumber) === shardNumber);
    const rowCount = Number(before.rowCount) + Number(delta?.rowCount || 0);
    const totalBodyBytes = Number(before.totalBodyBytes) + Number(delta?.totalBodyBytes || 0);
    return {
      shardNumber,
      parentRowCount: Number(before.rowCount),
      addedRowCount: Number(delta?.rowCount || 0),
      rowCount,
      parentBodyBytes: Number(before.totalBodyBytes),
      addedBodyBytes: Number(delta?.totalBodyBytes || 0),
      totalBodyBytes,
      withinProjectDatabaseBudget: totalBodyBytes <= STEP8G_MAX_DATABASE_BYTES
    };
  });
  const parentBytes = Number(parent.capacity?.layeredPhysicalBodyBytes || 0);
  const addedBytes = added.reduce((sum, row) => sum + Number(row.totalBodyBytes || 0), 0);
  return {
    parentLayeredPhysicalBodyBytes: parentBytes,
    addedLayerBodyBytes: addedBytes,
    layeredPhysicalBodyBytes: parentBytes + addedBytes,
    cumulativeBodyBytesWithinProjectTotalBudget: parentBytes + addedBytes <= STEP8G_MAX_TOTAL_BYTES,
    perShard
  };
}

const args = parseArgs(process.argv.slice(2));
const oraRoot = resolve(args.ora);
if (commitAt(oraRoot) !== ORA_COMMIT) throw new Error("ORA_PIN_MISMATCH");

const [candidate, measurement, parentEvidence] = await Promise.all([
  loadCandidate(oraRoot),
  readFile(resolve(args.measurement), "utf8").then(JSON.parse),
  readFile(resolve(args.parentEvidence), "utf8").then(JSON.parse)
]);
if (measurement?.pass !== true || measurement?.terminal !== MEASUREMENT_TERMINAL || measurement?.candidate?.recipeCount !== CANDIDATE_COUNT) {
  throw new Error("EARNED_ABBOTT_MEASUREMENT_REQUIRED");
}
if (measurement?.sourcePins?.openRecipeArchive?.commit !== ORA_COMMIT) throw new Error("MEASUREMENT_SOURCE_PIN_MISMATCH");

const packets = buildPackets(candidate);
const plan = buildPlan(packets);
const capacity = computeCapacity(parentEvidence, plan);
const maxBodyBytes = Math.max(...packets.map(row => row.bodyBytes));
const maxBatchBodyBytes = Math.max(...plan.batches.map(row => row.totalBodyBytes));
const maxRowsPerBatch = Math.max(...plan.batches.map(row => row.rowCount));
const maxWriteRequestBytes = Math.max(...plan.batches.map(batch => utf8Bytes(JSON.stringify({ action: "write-batch", batchId: batch.batchId, entries: batch.entries }))));
const maxWriteD1Subqueries = 1 + 1 + (maxRowsPerBatch + 1) + 1 + 1;
const requestSizePass = maxWriteRequestBytes <= MAX_WRITE_REQUEST_BYTES;
const writeQueryBudgetPass = maxWriteD1Subqueries <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
const capacityPass = capacity.cumulativeBodyBytesWithinProjectTotalBudget && capacity.perShard.every(row => row.withinProjectDatabaseBudget);
const topologyPass = plan.manifest.recipeBodyShards.shardCount === STEP8G_SHARD_COUNT;
const countPass = PARENT_COUNT + plan.manifest.recipeCount === COMPOSED_COUNT;
const pass = requestSizePass && writeQueryBudgetPass && capacityPass && topologyPass && countPass;

const evidence = {
  schema: "CORPUS_SCALE_STEP8G_ORA_ABBOTT_V8004_PREWRITE_V1",
  pass,
  terminalCandidate: pass ? "STEP_8G_ORA_ABBOTT_V8004_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED" : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
  date: "2026-09-15",
  source: { cohortId: SOURCE_COHORT_ID, repository: SOURCE_REPOSITORY, commit: ORA_COMMIT, sourceWork: SOURCE_TITLE, sourceAuthor: SOURCE_AUTHOR, sourceYear: SOURCE_YEAR, recordCount: packets.length, licenseId: "public-domain", measurementTerminal: measurement.terminal },
  parent: { activeCorpusVersion: PARENT_VERSION, composedRecipeCount: PARENT_COUNT, compositionSha256: parentEvidence.composition.compositionSha256 },
  layer: {
    corpusVersion: LAYER_VERSION,
    parentCorpusVersion: PARENT_VERSION,
    recipeCount: plan.manifest.recipeCount,
    manifestSha256: plan.manifest.manifestSha256,
    populationPlanSha256: plan.populationPlanSha256,
    batchCount: plan.batches.length,
    maxRowsPerBatch,
    maxBodyBytes,
    maxBatchBodyBytes,
    maxWriteRequestBytes,
    maxAllowedWriteRequestBytes: MAX_WRITE_REQUEST_BYTES,
    requestSizePass,
    maxWriteD1Subqueries,
    maxAllowedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
    writeQueryBudgetPass,
    shardDescriptors: plan.manifest.recipeBodyShards.descriptors
  },
  composition: {
    activeCorpusVersion: LAYER_VERSION,
    parentCorpusVersion: PARENT_VERSION,
    cumulativeRecipeCount: COMPOSED_COUNT,
    capacity,
    routing: { shardCount: STEP8G_SHARD_COUNT, mode: "CONTROL_INDEX_EXACT_ROUTE_THEN_BATCH_HYDRATE_BY_SHARD", fullCorpusScans: 0, maxProtectedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES }
  },
  boundaries: { liveD1WritesPerformed: 0, publicRuntimeChanged: false, recommendationAdmissionPerformed: false, thirdShardUsed: false, billingExpansion: false, nutritionLaneModified: false, youtubeCulinaryStateModified: false, knowledgeCoreWritePerformed: false, step8fReopened: false },
  decision: pass ? "EARN_V8004_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_ON_EXISTING_TWO_SHARD_TOPOLOGY" : "STOP_FOR_SCALE_OR_COST_REDESIGN"
};

const outputRoot = resolve(args.output);
await mkdir(outputRoot, { recursive: true });
await Promise.all([
  writeFile(resolve(outputRoot, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "population-plan-descriptors.json"), `${JSON.stringify({ contractVersion: plan.contractVersion, manifest: plan.manifest, batches: plan.batches.map(batch => ({ ...batch, entries: batch.entries.map(({ bodyJson, ...entry }) => entry) })), populationPlanSha256: plan.populationPlanSha256 }, null, 2)}\n`, "utf8")
]);
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!pass) process.exitCode = 1;
