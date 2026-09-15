import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { STEP8G_V8004_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8004-runtime-descriptor.mjs";
import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";
import {
  STEP8G_MAX_DATABASE_BYTES,
  STEP8G_MAX_ROWS_PER_WRITE_BATCH,
  STEP8G_MAX_TOTAL_BYTES,
  STEP8G_SHARD_COUNT
} from "./corpus-scale-step8g-population-core.mjs";
import {
  STEP8G_BW_V8005_CHILD_COUNT,
  STEP8G_BW_V8005_COMPOSED_COUNT,
  STEP8G_BW_V8005_LAYER_VERSION,
  STEP8G_BW_V8005_MAX_D1_SUBQUERIES,
  STEP8G_BW_V8005_MAX_REQUEST_BYTES,
  STEP8G_BW_V8005_MAX_ROWS_PER_BATCH,
  STEP8G_BW_V8005_PARENT_COUNT,
  STEP8G_BW_V8005_PARENT_VERSION,
  assertV8005PrewriteBoundaries,
  buildV8004ParentFingerprint,
  plannedV8005OperationBudget
} from "./corpus-scale-step8g-ora-bosse-watanna-prewrite-core.mjs";

const ORA_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const SOURCE_REPOSITORY = "AdamBouhmad/open-recipe-archive";
const SOURCE_COLLECTION = "japanese-kitchen";
const SOURCE_URL = "https://archive.org/details/chinesejapanesec00boss_0";
const SOURCE_TITLE = "Chinese-Japanese Cook Book";
const SOURCE_AUTHOR = "Sara Bosse & Onoto Watanna";
const SOURCE_YEAR = "1914";
const SOURCE_COHORT_ID = "ORA_BOSSE_WATANNA_1914_JAPANESE_SHELF_AE3BD2C";
const MEASUREMENT_TERMINAL = "STEP_8G_ORA_BOSSE_WATANNA_1914_MEASUREMENT_EARNED_COHORT_CANDIDATE";
const PREWRITE_PASS_TERMINAL = "STEP_8G_ORA_BOSSE_WATANNA_V8005_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED";

const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(value).digest("hex");
const utf8Bytes = value => encoder.encode(String(value)).byteLength;

function parseArgs(argv) {
  const args = {
    ora: null,
    measurement: "data/generated/step8g/ora-bosse-watanna-1914-measurement.json",
    parentPrewrite: "data/generated/step8g/ora-abbott-v8004-prewrite-evidence.json",
    parentLive: "data/generated/step8g/ora-abbott-v8004-live-pass.json",
    output: ".tmp/step8g-ora-bosse-watanna-v8005-prewrite"
  };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) args.ora = arg.slice(6);
    else if (arg.startsWith("--measurement=")) args.measurement = arg.slice(14);
    else if (arg.startsWith("--parent-prewrite=")) args.parentPrewrite = arg.slice(18);
    else if (arg.startsWith("--parent-live=")) args.parentLive = arg.slice(14);
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
  return String(fileName).replace(/\.md$/i, "").normalize("NFKD").replace(/\p{M}+/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function isExactSource(meta) {
  return meta.collection === SOURCE_COLLECTION &&
    meta.source_title === SOURCE_TITLE &&
    meta.author === SOURCE_AUTHOR &&
    meta.source_year === SOURCE_YEAR &&
    meta.source_url === SOURCE_URL &&
    meta.license === "public-domain";
}

async function loadCandidate(root) {
  const dir = resolve(root, `collections/${SOURCE_COLLECTION}/recipes`);
  const files = (await readdir(dir)).filter(file => file.endsWith(".md")).sort();
  const rows = [];
  for (const fileName of files) {
    const rawMarkdown = await readFile(resolve(dir, fileName), "utf8");
    const parsed = parseRecipe(rawMarkdown);
    if (isExactSource(parsed.meta)) rows.push({ fileName, rawMarkdown, parsed });
  }
  return rows;
}

function assertSourceRow(row) {
  if (!isExactSource(row.parsed.meta)) throw new Error(`${row.fileName}: SOURCE_RIGHTS_METADATA_MISMATCH`);
  if (!row.parsed.meta.title || !row.parsed.ingredients.length || !row.parsed.directions.length) {
    throw new Error(`${row.fileName}: STRUCTURAL_SOURCE_MISMATCH`);
  }
}

function buildPackets(rows) {
  if (rows.length !== STEP8G_BW_V8005_CHILD_COUNT) {
    throw new Error(`BOSSE_WATANNA_EXPECTED_${STEP8G_BW_V8005_CHILD_COUNT}_GOT_${rows.length}`);
  }
  const seen = new Set();
  return rows.map((row, ordinal) => {
    assertSourceRow(row);
    const recipeId = `ora_bosse_watanna_1914_${slug(row.fileName)}`;
    if (!recipeId || recipeId === "ora_bosse_watanna_1914_" || seen.has(recipeId)) throw new Error(`DUPLICATE_OR_INVALID_RECIPE_ID_${recipeId}`);
    seen.add(recipeId);
    const packet = {
      schema: "STEP8G_ORA_BOSSE_WATANNA_1914_PROTECTED_SOURCE_PACKET_V1",
      canonicalRecipeId: recipeId,
      source: {
        cohortId: SOURCE_COHORT_ID,
        repository: SOURCE_REPOSITORY,
        commit: ORA_COMMIT,
        path: `collections/${SOURCE_COLLECTION}/recipes/${row.fileName}`,
        sourceContentSha256: sha256(row.rawMarkdown),
        sourceWork: SOURCE_TITLE,
        sourceAuthor: SOURCE_AUTHOR,
        sourceYear: SOURCE_YEAR,
        sourceUrl: SOURCE_URL,
        licenseId: "public-domain",
        historicalCollectionLabel: SOURCE_COLLECTION
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
        culturalAuthenticityAuthority: false,
        historicalSourceLabelOnly: true,
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
      bodyBytes: utf8Bytes(bodyJson)
    };
  });
}

function buildPlan(packets) {
  const bodyById = new Map(packets.map(row => [row.recipeId, row.bodyJson]));
  const plan = buildStep8APopulationPlan({
    corpusVersion: STEP8G_BW_V8005_LAYER_VERSION,
    parentCorpusVersion: STEP8G_BW_V8005_PARENT_VERSION,
    sourceCohorts: [{
      id: SOURCE_COHORT_ID,
      sourceName: `${SOURCE_TITLE} (bounded 109-record historical shelf cohort)`,
      sourceVersion: ORA_COMMIT,
      admissionState: MEASUREMENT_TERMINAL,
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        "data/generated/step8g/ora-bosse-watanna-1914-measurement.json",
        "docs/CORPUS_SCALE_STEP8G_ORA_BOSSE_WATANNA_1914_RIGHTS_AND_MEASUREMENT.md",
        `https://github.com/${SOURCE_REPOSITORY}/tree/${ORA_COMMIT}/collections/${SOURCE_COLLECTION}`
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

function computeCapacity(parentPrewrite, plan) {
  const parentCapacity = parentPrewrite?.composition?.capacity;
  if (parentPrewrite?.pass !== true || parentPrewrite?.composition?.activeCorpusVersion !== "v8004" || Number(parentPrewrite?.composition?.cumulativeRecipeCount) !== STEP8G_BW_V8005_PARENT_COUNT) {
    throw new Error("VALID_V8004_PARENT_PREWRITE_EVIDENCE_REQUIRED");
  }
  const prior = parentCapacity?.perShard || [];
  if (prior.length !== STEP8G_SHARD_COUNT) throw new Error("V8004_PARENT_SHARD_CAPACITY_MISSING");
  const added = plan.manifest.recipeBodyShards.descriptors;
  const perShard = Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) => {
    const before = prior.find(row => Number(row.shardNumber) === shardNumber);
    const delta = added.find(row => Number(row.shardNumber) === shardNumber);
    if (!before) throw new Error(`V8004_PARENT_SHARD_${shardNumber}_MISSING`);
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
  const parentBytes = Number(parentCapacity?.layeredPhysicalBodyBytes || 0);
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

const [candidate, measurement, parentPrewrite, parentLive] = await Promise.all([
  loadCandidate(oraRoot),
  readFile(resolve(args.measurement), "utf8").then(JSON.parse),
  readFile(resolve(args.parentPrewrite), "utf8").then(JSON.parse),
  readFile(resolve(args.parentLive), "utf8").then(JSON.parse)
]);

if (measurement?.pass !== true || measurement?.terminal !== MEASUREMENT_TERMINAL || Number(measurement?.candidate?.recipeCount) !== STEP8G_BW_V8005_CHILD_COUNT) {
  throw new Error("EARNED_BOSSE_WATANNA_MEASUREMENT_REQUIRED");
}
if (measurement?.candidate?.sourceCommit !== ORA_COMMIT) throw new Error("MEASUREMENT_SOURCE_PIN_MISMATCH");
if (measurement?.interpretation?.prewriteEarned !== true || measurement?.boundaries?.liveD1WritesAuthorized !== false) {
  throw new Error("MEASUREMENT_PREWRITE_ONLY_AUTHORITY_REQUIRED");
}

const parentFingerprint = buildV8004ParentFingerprint({
  prewriteEvidence: parentPrewrite,
  liveEvidence: parentLive,
  runtimeDescriptor: STEP8G_V8004_RUNTIME_DESCRIPTOR
});
const packets = buildPackets(candidate);
const plan = buildPlan(packets);
const capacity = computeCapacity(parentPrewrite, plan);
const operationBudget = plannedV8005OperationBudget({ maxRowsPerBatch: STEP8G_MAX_ROWS_PER_WRITE_BATCH });

const maxBodyBytes = Math.max(...packets.map(row => row.bodyBytes));
const maxBatchBodyBytes = Math.max(...plan.batches.map(row => row.totalBodyBytes));
const maxRowsPerBatch = Math.max(...plan.batches.map(row => row.rowCount));
const maxWriteRequestBytes = Math.max(...plan.batches.map(batch => utf8Bytes(JSON.stringify({
  action: "write-body",
  batch: {
    batchId: batch.batchId,
    sourceEntries: batch.entries.map(entry => ({ ordinal: entry.ordinal, fileName: candidate[entry.ordinal].fileName, rawMarkdown: candidate[entry.ordinal].rawMarkdown }))
  }
}))));

const requestSizePass = maxWriteRequestBytes <= STEP8G_BW_V8005_MAX_REQUEST_BYTES;
const operationBudgetPass = operationBudget.pass && operationBudget.maxPlannedD1Subqueries <= STEP8G_BW_V8005_MAX_D1_SUBQUERIES;
const capacityPass = capacity.cumulativeBodyBytesWithinProjectTotalBudget && capacity.perShard.every(row => row.withinProjectDatabaseBudget);
const topologyPass = plan.manifest.recipeBodyShards.shardCount === STEP8G_SHARD_COUNT;
const countPass = STEP8G_BW_V8005_PARENT_COUNT + plan.manifest.recipeCount === STEP8G_BW_V8005_COMPOSED_COUNT;
const batchSizePass = maxRowsPerBatch <= STEP8G_BW_V8005_MAX_ROWS_PER_BATCH;
const pass = requestSizePass && operationBudgetPass && capacityPass && topologyPass && countPass && batchSizePass;

const evidence = {
  schema: "CORPUS_SCALE_STEP8G_ORA_BOSSE_WATANNA_V8005_PREWRITE_V1",
  pass,
  terminalCandidate: pass ? PREWRITE_PASS_TERMINAL : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
  date: "2026-09-15",
  source: {
    cohortId: SOURCE_COHORT_ID,
    repository: SOURCE_REPOSITORY,
    commit: ORA_COMMIT,
    collection: SOURCE_COLLECTION,
    sourceWork: SOURCE_TITLE,
    sourceAuthor: SOURCE_AUTHOR,
    sourceYear: SOURCE_YEAR,
    sourceUrl: SOURCE_URL,
    recordCount: packets.length,
    licenseId: "public-domain",
    measurementTerminal: measurement.terminal,
    ontologyResolvedOccurrenceRatio: measurement.candidate.ontologyResolvedOccurrenceRatio,
    culturalAuthenticityAuthorityImported: false
  },
  parent: {
    activeCorpusVersion: STEP8G_BW_V8005_PARENT_VERSION,
    composedRecipeCount: STEP8G_BW_V8005_PARENT_COUNT,
    fingerprintSha256: parentFingerprint.sha256,
    fingerprintMaterial: parentFingerprint.material
  },
  layer: {
    corpusVersion: STEP8G_BW_V8005_LAYER_VERSION,
    parentCorpusVersion: STEP8G_BW_V8005_PARENT_VERSION,
    recipeCount: plan.manifest.recipeCount,
    manifestSha256: plan.manifest.manifestSha256,
    populationPlanSha256: plan.populationPlanSha256,
    batchCount: plan.batches.length,
    maxRowsPerBatch,
    maxBodyBytes,
    maxBatchBodyBytes,
    maxWriteRequestBytes,
    maxAllowedWriteRequestBytes: STEP8G_BW_V8005_MAX_REQUEST_BYTES,
    requestSizePass,
    operationBudget,
    shardDescriptors: plan.manifest.recipeBodyShards.descriptors
  },
  composition: {
    activeCorpusVersion: STEP8G_BW_V8005_LAYER_VERSION,
    parentCorpusVersion: STEP8G_BW_V8005_PARENT_VERSION,
    cumulativeRecipeCount: STEP8G_BW_V8005_COMPOSED_COUNT,
    capacity,
    routing: {
      shardCount: STEP8G_SHARD_COUNT,
      mode: "CONTROL_INDEX_EXACT_ROUTE_THEN_BATCH_HYDRATE_BY_SHARD",
      fullCorpusScans: 0,
      maxProtectedD1Subqueries: STEP8G_BW_V8005_MAX_D1_SUBQUERIES,
      d1BudgetHeadroomAssumed: false
    }
  },
  gates: {
    requestSizePass,
    operationBudgetPass,
    capacityPass,
    topologyPass,
    countPass,
    batchSizePass
  },
  boundaries: {
    liveD1WritesPerformed: 0,
    publicRuntimeChanged: false,
    recommendationAdmissionPerformed: false,
    thirdShardUsed: false,
    d1BudgetExpansion: false,
    billingExpansion: false,
    nutritionLaneModified: false,
    youtubeCulinaryStateModified: false,
    knowledgeCoreWritePerformed: false,
    culturalAuthenticityAuthorityImported: false,
    step8fReopened: false
  },
  decision: pass
    ? "EARN_V8005_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_ON_EXISTING_TWO_SHARD_AND_16_QUERY_ENVELOPE"
    : "STOP_FOR_SCALE_COST_OR_QUERY_BUDGET_REDESIGN"
};

assertV8005PrewriteBoundaries(evidence);
const outputRoot = resolve(args.output);
await mkdir(outputRoot, { recursive: true });
await Promise.all([
  writeFile(resolve(outputRoot, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputRoot, "population-plan-descriptors.json"), `${JSON.stringify({
    contractVersion: plan.contractVersion,
    manifest: plan.manifest,
    batches: plan.batches.map(batch => ({ ...batch, entries: batch.entries.map(({ bodyJson, ...entry }) => entry) })),
    populationPlanSha256: plan.populationPlanSha256,
    parentFingerprint
  }, null, 2)}\n`, "utf8")
]);
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!pass) process.exitCode = 1;
