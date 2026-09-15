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

const ORA_EXPECTED_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const SOURCE_URL = "https://archive.org/details/b21505524";
const SOURCE_TITLE = "The English and Australian Cookery Book";
const SOURCE_AUTHOR = "Edward Abbott";
const SOURCE_YEAR = "1864";
const SOURCE_COHORT_ID = "ORA_ABBOTT_1864_AE3BD2C";
const SOURCE_REPOSITORY = "AdamBouhmad/open-recipe-archive";
const PARENT_VERSION = "v8003";
const LAYER_VERSION = "v8004";
const EXPECTED_CANDIDATE_COUNT = 713;
const EXPECTED_PARENT_COUNT = 1642;
const EXPECTED_COMPOSED_COUNT = EXPECTED_PARENT_COUNT + EXPECTED_CANDIDATE_COUNT;
const EXPECTED_MEASUREMENT_TERMINAL = "STEP_8G_ORA_ABBOTT_MEASUREMENT_EARNED_COHORT_CANDIDATE";
const MAX_WRITE_REQUEST_BYTES = 262_144;

const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(value).digest("hex");
const bytes = value => encoder.encode(String(value)).byteLength;

function parseArgs(argv) {
  const options = {
    ora: null,
    measurement: "data/generated/step8g/ora-abbott-1864-measurement.json",
    parentEvidence: "data/generated/step8g/cc0-v8003-prewrite-evidence.json",
    output: ".tmp/step8g-ora-abbott-v8004-prewrite"
  };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) options.ora = arg.slice("--ora=".length);
    else if (arg.startsWith("--measurement=")) options.measurement = arg.slice("--measurement=".length);
    else if (arg.startsWith("--parent-evidence=")) options.parentEvidence = arg.slice("--parent-evidence=".length);
    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length) || options.output;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.ora) throw new Error("--ora is required");
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function parseFrontMatter(markdown) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(String(markdown ?? ""));
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);
    if (!field) continue;
    result[field[1]] = field[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return result;
}

function sectionBody(markdown, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$`, "im");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const rest = markdown.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

function parseSourceMarkdown(markdown) {
  const text = String(markdown ?? "");
  const meta = parseFrontMatter(text);
  const ingredients = sectionBody(text, "Ingredients")
    .split(/\r?\n/)
    .filter(line => /^\s*[-*+]\s+/.test(line))
    .map(line => line.replace(/^\s*[-*+]\s+/, "").trim())
    .filter(Boolean);
  const directions = sectionBody(text, "(?:Directions|Instructions|Method)")
    .split(/\r?\n/)
    .filter(line => /^\s*(?:\d+[.)]|[-*+])\s+/.test(line))
    .map(line => line.replace(/^\s*(?:\d+[.)]|[-*+])\s+/, "").trim())
    .filter(Boolean);
  return { meta, ingredients, directions };
}

function slugFromFile(fileName) {
  return String(fileName || "")
    .replace(/\.md$/i, "")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function loadCandidateEntries(root) {
  const dir = resolve(root, "collections/australian-table/recipes");
  const files = (await readdir(dir)).filter(file => file.endsWith(".md")).sort();
  const selected = [];
  for (const fileName of files) {
    const rawMarkdown = await readFile(resolve(dir, fileName), "utf8");
    const parsed = parseSourceMarkdown(rawMarkdown);
    if (parsed.meta.source_url !== SOURCE_URL) continue;
    selected.push({ fileName, rawMarkdown, parsed });
  }
  return selected;
}

function assertCandidateRights(entry) {
  const meta = entry.parsed.meta;
  if (meta.source_title !== SOURCE_TITLE) throw new Error(`${entry.fileName}: SOURCE_TITLE_MISMATCH`);
  if (meta.author !== SOURCE_AUTHOR) throw new Error(`${entry.fileName}: SOURCE_AUTHOR_MISMATCH`);
  if (meta.source_year !== SOURCE_YEAR) throw new Error(`${entry.fileName}: SOURCE_YEAR_MISMATCH`);
  if (meta.source_url !== SOURCE_URL) throw new Error(`${entry.fileName}: SOURCE_URL_MISMATCH`);
  if (meta.license !== "public-domain") throw new Error(`${entry.fileName}: SOURCE_LICENSE_MISMATCH`);
  if (!meta.title) throw new Error(`${entry.fileName}: SOURCE_TITLE_EMPTY`);
  if (!entry.parsed.ingredients.length) throw new Error(`${entry.fileName}: INGREDIENTS_EMPTY`);
  if (!entry.parsed.directions.length) throw new Error(`${entry.fileName}: DIRECTIONS_EMPTY`);
}

function buildBodyPackets(candidateEntries) {
  if (candidateEntries.length !== EXPECTED_CANDIDATE_COUNT) {
    throw new Error(`ORA_ABBOTT_EXPECTED_${EXPECTED_CANDIDATE_COUNT}_GOT_${candidateEntries.length}`);
  }
  const ids = new Set();
  return candidateEntries.map((entry, ordinal) => {
    assertCandidateRights(entry);
    const slug = slugFromFile(entry.fileName);
    if (!slug) throw new Error(`${entry.fileName}: INVALID_SLUG`);
    const recipeId = `ora_abbott_1864_${slug}`;
    if (ids.has(recipeId)) throw new Error(`DUPLICATE_RECIPE_ID_${recipeId}`);
    ids.add(recipeId);
    const packet = {
      schema: "STEP8G_ORA_ABBOTT_1864_PROTECTED_SOURCE_PACKET_V1",
      canonicalRecipeId: recipeId,
      source: {
        cohortId: SOURCE_COHORT_ID,
        repository: SOURCE_REPOSITORY,
        commit: ORA_EXPECTED_COMMIT,
        path: `collections/australian-table/recipes/${entry.fileName}`,
        sourceContentSha256: sha256(entry.rawMarkdown),
        sourceWork: SOURCE_TITLE,
        sourceAuthor: SOURCE_AUTHOR,
        sourceYear: SOURCE_YEAR,
        sourceUrl: SOURCE_URL,
        licenseId: "public-domain"
      },
      sourceContent: {
        rawMarkdown: entry.rawMarkdown,
        title: entry.parsed.meta.title,
        parsedIngredientsNonAuthoritative: entry.parsed.ingredients,
        parsedDirectionsNonAuthoritative: entry.parsed.directions
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
    return {
      ordinal,
      recipeId,
      sourceCohortId: SOURCE_COHORT_ID,
      bodyJson,
      bodySha256: sha256(bodyJson),
      bodyBytes: bytes(bodyJson)
    };
  });
}

function buildLayerPlan(packets) {
  const bodyById = new Map(packets.map(packet => [packet.recipeId, packet.bodyJson]));
  const plan = buildStep8APopulationPlan({
    corpusVersion: LAYER_VERSION,
    parentCorpusVersion: PARENT_VERSION,
    sourceCohorts: [{
      id: SOURCE_COHORT_ID,
      sourceName: `${SOURCE_TITLE} (Open Recipe Archive bounded source-work cohort)`,
      sourceVersion: ORA_EXPECTED_COMMIT,
      admissionState: EXPECTED_MEASUREMENT_TERMINAL,
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        "data/generated/step8g/ora-abbott-1864-measurement.json",
        "docs/CORPUS_SCALE_STEP8G_ORA_ABBOTT_RIGHTS_AND_MEASUREMENT.md",
        `https://github.com/${SOURCE_REPOSITORY}/tree/${ORA_EXPECTED_COMMIT}/collections/australian-table`
      ]
    }],
    entries: packets.map(({ bodyJson, ...descriptor }) => descriptor),
    recipeShardCount: STEP8G_SHARD_COUNT,
    rowsPerWriteBatch: STEP8G_MAX_ROWS_PER_WRITE_BATCH
  });
  return {
    ...plan,
    batches: plan.batches.map(batch => ({
      ...batch,
      entries: batch.entries.map(entry => ({ ...entry, bodyJson: bodyById.get(entry.recipeId) }))
    }))
  };
}

function buildCapacity(parentEvidence, layerPlan) {
  const parentComposition = parentEvidence?.composition;
  if (parentEvidence?.pass !== true || parentComposition?.activeCorpusVersion !== PARENT_VERSION) {
    throw new Error("VALID_V8003_PARENT_EVIDENCE_REQUIRED");
  }
  if (parentComposition.cumulativeRecipeCount !== EXPECTED_PARENT_COUNT) throw new Error("V8003_PARENT_COUNT_MISMATCH");
  const parentPerShard = parentComposition.capacity?.perShard || [];
  if (parentPerShard.length !== STEP8G_SHARD_COUNT) throw new Error("V8003_PARENT_SHARD_CAPACITY_MISSING");
  const layerPerShard = layerPlan.manifest.recipeBodyShards.descriptors;
  const perShard = Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) => {
    const prior = parentPerShard.find(row => Number(row.shardNumber) === shardNumber);
    const added = layerPerShard.find(row => Number(row.shardNumber) === shardNumber);
    const rowCount = Number(prior.rowCount) + Number(added?.rowCount || 0);
    const totalBodyBytes = Number(prior.totalBodyBytes) + Number(added?.totalBodyBytes || 0);
    return {
      shardNumber,
      parentRowCount: Number(prior.rowCount),
      addedRowCount: Number(added?.rowCount || 0),
      rowCount,
      parentBodyBytes: Number(prior.totalBodyBytes),
      addedBodyBytes: Number(added?.totalBodyBytes || 0),
      totalBodyBytes,
      withinProjectDatabaseBudget: totalBodyBytes <= STEP8G_MAX_DATABASE_BYTES
    };
  });
  const parentBytes = Number(parentComposition.capacity?.layeredPhysicalBodyBytes || 0);
  const addedBytes = layerPerShard.reduce((sum, row) => sum + Number(row.totalBodyBytes || 0), 0);
  return {
    parentLayeredPhysicalBodyBytes: parentBytes,
    addedLayerBodyBytes: addedBytes,
    layeredPhysicalBodyBytes: parentBytes + addedBytes,
    cumulativeBodyBytesWithinProjectTotalBudget: parentBytes + addedBytes <= STEP8G_MAX_TOTAL_BYTES,
    perShard
  };
}

function descriptorOnlyBatches(batches) {
  return batches.map(batch => ({
    ...batch,
    entries: batch.entries.map(({ bodyJson, ...entry }) => entry)
  }));
}

const args = parseArgs(process.argv.slice(2));
const oraRoot = resolve(args.ora);
const outputRoot = resolve(args.output);
if (commitAt(oraRoot) !== ORA_EXPECTED_COMMIT) throw new Error("ORA_PIN_MISMATCH");

const [candidateEntries, measurement, parentEvidence] = await Promise.all([
  loadCandidateEntries(oraRoot),
  readFile(resolve(args.measurement), "utf8").then(JSON.parse),
  readFile(resolve(args.parentEvidence), "utf8").then(JSON.parse)
]);
if (measurement?.pass !== true || measurement?.terminal !== EXPECTED_MEASUREMENT_TERMINAL) {
  throw new Error("EARNED_ABBOTT_MEASUREMENT_REQUIRED");
}
if (measurement?.candidate?.recipeCount !== EXPECTED_CANDIDATE_COUNT) throw new Error("MEASUREMENT_RECIPE_COUNT_MISMATCH");
if (measurement?.sourcePins?.openRecipeArchive?.commit !== ORA_EXPECTED_COMMIT) throw new Error("MEASUREMENT_SOURCE_PIN_MISMATCH");

const packets = buildBodyPackets(candidateEntries);
const layerPlan = buildLayerPlan(packets);
const capacity = buildCapacity(parentEvidence, layerPlan);
const maxBodyBytes = Math.max(...packets.map(row => row.bodyBytes));
const maxBatchBodyBytes = Math.max(...layerPlan.batches.map(batch => batch.totalBodyBytes));
const writeRequestSizes = layerPlan.batches.map(batch => bytes(JSON.stringify({
  action: "write-batch",
  batchId: batch.batchId,
  sourceEntries: batch.entries.map(entry => ({
    ordinal: entry.ordinal,
    recipeId: entry.recipeId,
    bodyJson: entry.bodyJson,
    bodySha256: entry.bodySha256,
    bodyBytes: entry.bodyBytes,
    sourceCohortId: entry.sourceCohortId
  }))
})));
const maxWriteRequestBytes = Math.max(...writeRequestSizes);
const maxBatchRows = Math.max(...layerPlan.batches.map(batch => batch.rowCount));
const maxWriteD1Subqueries = 1 + 1 + (maxBatchRows + 1) + 1 + 1;
const requestSizePass = maxWriteRequestBytes <= MAX_WRITE_REQUEST_BYTES;
const writeQueryBudgetPass = maxWriteD1Subqueries <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES;
const capacityPass = capacity.cumulativeBodyBytesWithinProjectTotalBudget && capacity.perShard.every(row => row.withinProjectDatabaseBudget);
const topologyPass = layerPlan.manifest.recipeBodyShards.shardCount === STEP8G_SHARD_COUNT;
const countPass = EXPECTED_PARENT_COUNT + layerPlan.manifest.recipeCount === EXPECTED_COMPOSED_COUNT;
const pass = requestSizePass && writeQueryBudgetPass && capacityPass && topologyPass && countPass;

const evidence = {
  schema: "CORPUS_SCALE_STEP8G_ORA_ABBOTT_V8004_PREWRITE_V1",
  pass,
  terminalCandidate: pass
    ? "STEP_8G_ORA_ABBOTT_V8004_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED"
    : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
  date: "2026-09-15",
  source: {
    cohortId: SOURCE_COHORT_ID,
    repository: SOURCE_REPOSITORY,
    commit: ORA_EXPECTED_COMMIT,
    sourceWork: SOURCE_TITLE,
    sourceAuthor: SOURCE_AUTHOR,
    sourceYear: SOURCE_YEAR,
    recordCount: packets.length,
    licenseId: "public-domain",
    measurementTerminal: measurement.terminal
  },
  parent: {
    activeCorpusVersion: PARENT_VERSION,
    composedRecipeCount: EXPECTED_PARENT_COUNT,
    compositionSha256: parentEvidence.composition.compositionSha256
  },
  layer: {
    corpusVersion: LAYER_VERSION,
    parentCorpusVersion: PARENT_VERSION,
    recipeCount: layerPlan.manifest.recipeCount,
    manifestSha256: layerPlan.manifest.manifestSha256,
    populationPlanSha256: layerPlan.populationPlanSha256,
    batchCount: layerPlan.batches.length,
    maxRowsPerBatch: maxBatchRows,
    maxBodyBytes,
    maxBatchBodyBytes,
    maxWriteRequestBytes,
    maxAllowedWriteRequestBytes: MAX_WRITE_REQUEST_BYTES,
    requestSizePass,
    maxWriteD1Subqueries,
    maxAllowedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
    writeQueryBudgetPass,
    shardDescriptors: layerPlan.manifest.recipeBodyShards.descriptors
  },
  composition: {
    activeCorpusVersion: LAYER_VERSION,
    parentCorpusVersion: PARENT_VERSION,
    cumulativeRecipeCount: EXPECTED_COMPOSED_COUNT,
    capacity,
    routing: {
      shardCount: STEP8G_SHARD_COUNT,
      mode: "CONTROL_INDEX_EXACT_ROUTE_THEN_BATCH_HYDRATE_BY_SHARD",
      fullCorpusScans: 0,
      maxProtectedD1Subqueries: STEP8G_MAX_PROTECTED_D1_SUBQUERIES
    }
  },
  boundaries: {
    liveD1WritesPerformed: 0,
    publicRuntimeChanged: false,
    recommendationAdmissionPerformed: false,
    thirdShardUsed: false,
    billingExpansion: false,
    nutritionLaneModified: false,
    youtubeCulinaryStateModified: false,
    knowledgeCoreWritePerformed: false,
    step8fReopened: false
  },
  decision: pass
    ? "EARN_V8004_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_ON_EXISTING_TWO_SHARD_TOPOLOGY"
    : "STOP_FOR_SCALE_OR_COST_REDESIGN",
  notes: [
    "v8004 is an immutable incremental protected source-work layer whose active parent is v8003; no v8001-v8003 bodies are rewritten or duplicated.",
    "Historical ingredient strings remain non-authoritative source content and are not promoted into hard dietary/allergen/nutrition metadata.",
    "This evidence performs zero D1 writes and does not change the 85-recipe public runtime or the historical 84-recipe golden benchmark."
  ]
};

await mkdir(outputRoot, { recursive: true });
await Promise.all([
  writeFile(resolve(outputRoot, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "population-plan-descriptors.json"), `${JSON.stringify({
    contractVersion: layerPlan.contractVersion,
    manifest: layerPlan.manifest,
    batches: descriptorOnlyBatches(layerPlan.batches),
    populationPlanSha256: layerPlan.populationPlanSha256
  }, null, 2)}\n`, "utf8")
]);
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!pass) process.exitCode = 1;
