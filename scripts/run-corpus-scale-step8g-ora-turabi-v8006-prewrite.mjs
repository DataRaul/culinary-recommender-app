import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { STEP8G_V8005_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8005-runtime-descriptor.mjs";
import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";
import {
  STEP8G_MAX_DATABASE_BYTES,
  STEP8G_MAX_ROWS_PER_WRITE_BATCH,
  STEP8G_MAX_TOTAL_BYTES,
  STEP8G_SHARD_COUNT
} from "./corpus-scale-step8g-population-core.mjs";
import { ORA_TURABI_SOURCE, ORA_TURABI_CANDIDATE_TERMINAL, parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-turabi-core.mjs";
import {
  STEP8G_TURABI_V8006_CHILD_COUNT,
  STEP8G_TURABI_V8006_COMPOSED_COUNT,
  STEP8G_TURABI_V8006_LAYER_VERSION,
  STEP8G_TURABI_V8006_MAX_D1_SUBQUERIES,
  STEP8G_TURABI_V8006_MAX_REQUEST_BYTES,
  STEP8G_TURABI_V8006_MAX_ROWS_PER_BATCH,
  STEP8G_TURABI_V8006_PARENT_COUNT,
  STEP8G_TURABI_V8006_PARENT_VERSION,
  assertV8006PrewriteBoundaries,
  buildV8005ParentFingerprint,
  plannedV8006OperationBudget
} from "./corpus-scale-step8g-ora-turabi-v8006-prewrite-core.mjs";

const PREWRITE_PASS_TERMINAL = "STEP_8G_ORA_TURABI_EFENDI_V8006_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED";
const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(value).digest("hex");
const utf8Bytes = value => encoder.encode(String(value)).byteLength;

function parseArgs(argv) {
  const args = {
    ora: null,
    measurement: "data/generated/step8g/ora-turabi-1864-measurement.json",
    parentPrewrite: "data/generated/step8g/ora-bosse-watanna-v8005-prewrite-evidence.json",
    parentLive: "data/generated/step8g/ora-bosse-watanna-v8005-live-pass.json",
    output: ".tmp/step8g-ora-turabi-v8006-prewrite"
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

function slug(value) {
  return String(value ?? "").normalize("NFKD").replace(/\p{M}+/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

async function loadCandidate(root) {
  const path = resolve(root, `collections/${ORA_TURABI_SOURCE.collection}/recipes.jsonl`);
  const lines = (await readFile(path, "utf8")).split(/\r?\n/).filter(Boolean);
  return lines.map((rawJson, ordinal) => {
    const sourceRow = JSON.parse(rawJson);
    return { ordinal, rawJson, sourceRow, parsed: parseOraJsonlRecipe(sourceRow) };
  });
}

function assertSourceRow(row) {
  const source = row.parsed.source;
  if (source.collection !== ORA_TURABI_SOURCE.collection ||
      source.sourceUrl !== ORA_TURABI_SOURCE.sourceUrl ||
      source.sourceTitle !== ORA_TURABI_SOURCE.sourceTitle ||
      source.author !== ORA_TURABI_SOURCE.sourceAuthor ||
      source.sourceYear !== ORA_TURABI_SOURCE.sourceYear ||
      source.license !== ORA_TURABI_SOURCE.license) {
    throw new Error(`TURABI_SOURCE_RIGHTS_METADATA_MISMATCH_${row.ordinal}`);
  }
  if (!row.parsed.quality.hasTitle || !row.parsed.quality.hasIngredients || !row.parsed.quality.hasDirections) {
    throw new Error(`TURABI_STRUCTURAL_SOURCE_MISMATCH_${row.ordinal}`);
  }
}

function buildPackets(rows) {
  if (rows.length !== STEP8G_TURABI_V8006_CHILD_COUNT) {
    throw new Error(`TURABI_EXPECTED_${STEP8G_TURABI_V8006_CHILD_COUNT}_GOT_${rows.length}`);
  }
  const seen = new Set();
  return rows.map(row => {
    assertSourceRow(row);
    const sourceSlug = slug(row.parsed.slug || row.parsed.title || String(row.ordinal));
    const recipeId = `ora_turabi_1864_${sourceSlug}`;
    if (!sourceSlug || seen.has(recipeId)) throw new Error(`DUPLICATE_OR_INVALID_RECIPE_ID_${recipeId}`);
    seen.add(recipeId);
    const packet = {
      schema: "STEP8G_ORA_TURABI_EFENDI_1864_PROTECTED_SOURCE_PACKET_V1",
      canonicalRecipeId: recipeId,
      source: {
        cohortId: ORA_TURABI_SOURCE.cohortId,
        repository: ORA_TURABI_SOURCE.repository,
        commit: ORA_TURABI_SOURCE.commit,
        path: `collections/${ORA_TURABI_SOURCE.collection}/recipes.jsonl`,
        rowOrdinal: row.ordinal,
        sourceContentSha256: sha256(row.rawJson),
        sourceWork: ORA_TURABI_SOURCE.sourceTitle,
        sourceAuthor: ORA_TURABI_SOURCE.sourceAuthor,
        sourceYear: ORA_TURABI_SOURCE.sourceYear,
        sourceUrl: ORA_TURABI_SOURCE.sourceUrl,
        licenseId: ORA_TURABI_SOURCE.license,
        historicalCollectionLabel: ORA_TURABI_SOURCE.collection
      },
      sourceContent: {
        rawJson: row.rawJson,
        title: row.parsed.title,
        slug: row.parsed.slug,
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
      ordinal: row.ordinal,
      recipeId,
      sourceCohortId: ORA_TURABI_SOURCE.cohortId,
      bodyJson,
      bodySha256: sha256(bodyJson),
      bodyBytes: utf8Bytes(bodyJson)
    };
  });
}

function buildPlan(packets) {
  const bodyById = new Map(packets.map(row => [row.recipeId, row.bodyJson]));
  const plan = buildStep8APopulationPlan({
    corpusVersion: STEP8G_TURABI_V8006_LAYER_VERSION,
    parentCorpusVersion: STEP8G_TURABI_V8006_PARENT_VERSION,
    sourceCohorts: [{
      id: ORA_TURABI_SOURCE.cohortId,
      sourceName: `${ORA_TURABI_SOURCE.sourceTitle} (bounded 442-record historical shelf cohort)`,
      sourceVersion: ORA_TURABI_SOURCE.commit,
      admissionState: ORA_TURABI_CANDIDATE_TERMINAL,
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        "data/generated/step8g/ora-turabi-1864-measurement.json",
        "docs/CORPUS_SCALE_STEP8G_ORA_TURABI_1864_RIGHTS_AND_MEASUREMENT.md",
        `https://github.com/${ORA_TURABI_SOURCE.repository}/tree/${ORA_TURABI_SOURCE.commit}/collections/${ORA_TURABI_SOURCE.collection}`
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
  if (parentPrewrite?.pass !== true || parentPrewrite?.composition?.activeCorpusVersion !== "v8005" || Number(parentPrewrite?.composition?.cumulativeRecipeCount) !== STEP8G_TURABI_V8006_PARENT_COUNT) {
    throw new Error("VALID_V8005_PARENT_PREWRITE_EVIDENCE_REQUIRED");
  }
  const prior = parentCapacity?.perShard || [];
  if (prior.length !== STEP8G_SHARD_COUNT) throw new Error("V8005_PARENT_SHARD_CAPACITY_MISSING");
  const added = plan.manifest.recipeBodyShards.descriptors;
  const perShard = Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) => {
    const before = prior.find(row => Number(row.shardNumber) === shardNumber);
    const delta = added.find(row => Number(row.shardNumber) === shardNumber);
    if (!before) throw new Error(`V8005_PARENT_SHARD_${shardNumber}_MISSING`);
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
if (commitAt(oraRoot) !== ORA_TURABI_SOURCE.commit) throw new Error("ORA_PIN_MISMATCH");

const [candidate, measurement, parentPrewrite, parentLive] = await Promise.all([
  loadCandidate(oraRoot),
  readFile(resolve(args.measurement), "utf8").then(JSON.parse),
  readFile(resolve(args.parentPrewrite), "utf8").then(JSON.parse),
  readFile(resolve(args.parentLive), "utf8").then(JSON.parse)
]);

if (measurement?.pass !== true || measurement?.terminal !== ORA_TURABI_CANDIDATE_TERMINAL || Number(measurement?.candidate?.recipeCount) !== STEP8G_TURABI_V8006_CHILD_COUNT) {
  throw new Error("EARNED_TURABI_MEASUREMENT_REQUIRED");
}
if (measurement?.candidate?.sourceWork !== ORA_TURABI_SOURCE.sourceTitle || measurement?.candidate?.sourceUrl !== ORA_TURABI_SOURCE.sourceUrl) {
  throw new Error("MEASUREMENT_SOURCE_IDENTITY_MISMATCH");
}
if (measurement?.boundaries?.liveD1WritesAuthorized !== false || measurement?.boundaries?.protectedPopulationAuthorized !== false) {
  throw new Error("MEASUREMENT_PREWRITE_ONLY_AUTHORITY_REQUIRED");
}

const parentFingerprint = buildV8005ParentFingerprint({
  prewriteEvidence: parentPrewrite,
  liveEvidence: parentLive,
  runtimeDescriptor: STEP8G_V8005_RUNTIME_DESCRIPTOR
});
const packets = buildPackets(candidate);
const plan = buildPlan(packets);
const capacity = computeCapacity(parentPrewrite, plan);
const operationBudget = plannedV8006OperationBudget({ maxRowsPerBatch: STEP8G_MAX_ROWS_PER_WRITE_BATCH });

const maxBodyBytes = Math.max(...packets.map(row => row.bodyBytes));
const maxBatchBodyBytes = Math.max(...plan.batches.map(row => row.totalBodyBytes));
const maxRowsPerBatch = Math.max(...plan.batches.map(row => row.rowCount));
const maxWriteRequestBytes = Math.max(...plan.batches.map(batch => utf8Bytes(JSON.stringify({
  action: "write-body",
  batch: {
    batchId: batch.batchId,
    sourceEntries: batch.entries.map(entry => ({ ordinal: entry.ordinal, rawJson: candidate[entry.ordinal].rawJson }))
  }
}))));

const requestSizePass = maxWriteRequestBytes <= STEP8G_TURABI_V8006_MAX_REQUEST_BYTES;
const operationBudgetPass = operationBudget.pass && operationBudget.maxPlannedD1Subqueries <= STEP8G_TURABI_V8006_MAX_D1_SUBQUERIES;
const capacityPass = capacity.cumulativeBodyBytesWithinProjectTotalBudget && capacity.perShard.every(row => row.withinProjectDatabaseBudget);
const topologyPass = plan.manifest.recipeBodyShards.shardCount === STEP8G_SHARD_COUNT;
const countPass = STEP8G_TURABI_V8006_PARENT_COUNT + plan.manifest.recipeCount === STEP8G_TURABI_V8006_COMPOSED_COUNT;
const batchSizePass = maxRowsPerBatch <= STEP8G_TURABI_V8006_MAX_ROWS_PER_BATCH;
const pass = requestSizePass && operationBudgetPass && capacityPass && topologyPass && countPass && batchSizePass;

const evidence = {
  schema: "CORPUS_SCALE_STEP8G_ORA_TURABI_EFENDI_V8006_PREWRITE_V1",
  pass,
  terminalCandidate: pass ? PREWRITE_PASS_TERMINAL : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
  date: "2026-09-16",
  source: {
    cohortId: ORA_TURABI_SOURCE.cohortId,
    repository: ORA_TURABI_SOURCE.repository,
    commit: ORA_TURABI_SOURCE.commit,
    collection: ORA_TURABI_SOURCE.collection,
    sourceWork: ORA_TURABI_SOURCE.sourceTitle,
    sourceAuthor: ORA_TURABI_SOURCE.sourceAuthor,
    sourceYear: ORA_TURABI_SOURCE.sourceYear,
    sourceUrl: ORA_TURABI_SOURCE.sourceUrl,
    recordCount: packets.length,
    licenseId: ORA_TURABI_SOURCE.license,
    measurementTerminal: measurement.terminal,
    ontologyResolvedOccurrenceRatio: measurement.candidate.ontologyResolvedOccurrenceRatio,
    culturalAuthenticityAuthorityImported: false
  },
  parent: {
    activeCorpusVersion: STEP8G_TURABI_V8006_PARENT_VERSION,
    composedRecipeCount: STEP8G_TURABI_V8006_PARENT_COUNT,
    fingerprintSha256: parentFingerprint.sha256,
    fingerprintMaterial: parentFingerprint.material
  },
  layer: {
    corpusVersion: STEP8G_TURABI_V8006_LAYER_VERSION,
    parentCorpusVersion: STEP8G_TURABI_V8006_PARENT_VERSION,
    recipeCount: plan.manifest.recipeCount,
    manifestSha256: plan.manifest.manifestSha256,
    populationPlanSha256: plan.populationPlanSha256,
    batchCount: plan.batches.length,
    maxRowsPerBatch,
    maxBodyBytes,
    maxBatchBodyBytes,
    maxWriteRequestBytes,
    maxAllowedWriteRequestBytes: STEP8G_TURABI_V8006_MAX_REQUEST_BYTES,
    requestSizePass,
    operationBudget,
    shardDescriptors: plan.manifest.recipeBodyShards.descriptors
  },
  composition: {
    activeCorpusVersion: STEP8G_TURABI_V8006_LAYER_VERSION,
    parentCorpusVersion: STEP8G_TURABI_V8006_PARENT_VERSION,
    cumulativeRecipeCount: STEP8G_TURABI_V8006_COMPOSED_COUNT,
    capacity,
    routing: {
      shardCount: STEP8G_SHARD_COUNT,
      mode: "CONTROL_INDEX_EXACT_ROUTE_THEN_BATCH_HYDRATE_BY_SHARD",
      fullCorpusScans: 0,
      maxProtectedD1Subqueries: STEP8G_TURABI_V8006_MAX_D1_SUBQUERIES,
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
    ? "EARN_V8006_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_ON_EXISTING_TWO_SHARD_AND_16_QUERY_ENVELOPE"
    : "STOP_FOR_SCALE_COST_OR_QUERY_BUDGET_REDESIGN"
};

assertV8006PrewriteBoundaries(evidence);
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
