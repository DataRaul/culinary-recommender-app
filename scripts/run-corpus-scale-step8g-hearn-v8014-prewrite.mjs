import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { STEP8G_V8013_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8013-runtime-descriptor.mjs";
import { buildStep8APopulationPlan } from "./corpus-scale-step8a-core.mjs";
import { STEP8G_MAX_DATABASE_BYTES, STEP8G_MAX_ROWS_PER_WRITE_BATCH, STEP8G_MAX_TOTAL_BYTES, STEP8G_SHARD_COUNT } from "./corpus-scale-step8g-population-core.mjs";
import { parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";
import {
  STEP8G_HEARN_V8014_CHILD_COUNT,
  STEP8G_HEARN_V8014_COMPOSED_COUNT,
  STEP8G_HEARN_V8014_LAYER_VERSION,
  STEP8G_HEARN_V8014_MAX_D1_SUBQUERIES,
  STEP8G_HEARN_V8014_MAX_REQUEST_BYTES,
  STEP8G_HEARN_V8014_MAX_ROWS_PER_BATCH,
  STEP8G_HEARN_V8014_PARENT_COUNT,
  STEP8G_HEARN_V8014_PARENT_VERSION,
  assertV8014PrewriteBoundaries,
  buildV8013ParentFingerprint,
  plannedV8014OperationBudget
} from "./corpus-scale-step8g-hearn-v8014-prewrite-core.mjs";
import { ORA_VIARD_1806_SOURCE } from "./corpus-scale-step8g-ora-hearn-1806-core.mjs";

const ORA_REPOSITORY = "AdamBouhmad/open-recipe-archive";
const ORA_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const PREWRITE_PASS_TERMINAL = "STEP_8G_HEARN_V8014_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED";
const encoder = new TextEncoder();
const sha256 = value => createHash("sha256").update(String(value)).digest("hex");
const utf8Bytes = value => encoder.encode(String(value)).byteLength;

const SOURCE = Object.freeze({
  ...ORA_VIARD_1806_SOURCE,
  authorClassification: "IDENTIFIED_AUTHOR",
  idPrefix: "ora_hearn_1885_",
  packetSchema: "STEP8G_ORA_HEARN_1885_PROTECTED_SOURCE_PACKET_V1"
});

function parseArgs(argv) {
  const args = {
    ora: null,
    measurement: "data/generated/step8g/hearn-1885-v8013-measurement.json",
    parentPrewrite: "data/generated/step8g/viard-v8013-prewrite-evidence.json",
    parentLive: "data/generated/step8g/viard-v8013-live-pass.json",
    output: ".tmp/step8g-hearn-v8014-prewrite"
  };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) args.ora = arg.slice(6);
    else if (arg.startsWith("--measurement=")) args.measurement = arg.slice(14);
    else if (arg.startsWith("--parent-prewrite=")) args.parentPrewrite = arg.slice(18);
    else if (arg.startsWith("--parent-live=")) args.parentLive = arg.slice(14);
    else if (arg.startsWith("--out=")) args.output = arg.slice(6) || args.output;
    else throw new Error(`UNKNOWN_ARGUMENT_${arg}`);
  }
  if (!args.ora) throw new Error("ORA_ROOT_REQUIRED");
  return args;
}

function commitAt(root) {
  return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function slug(value) {
  return String(value ?? "").normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function sourceForRaw(row) {
  return row.collection === SOURCE.collection &&
    row.source_url === SOURCE.sourceUrl &&
    row.source_title === SOURCE.sourceTitle &&
    String(row.author ?? "") === SOURCE.sourceAuthor &&
    String(row.source_year ?? "") === SOURCE.sourceYear &&
    row.license === SOURCE.license;
}

async function loadCandidate(root) {
  const path = resolve(root, `collections/${SOURCE.collection}/recipes.jsonl`);
  const lines = (await readFile(path, "utf8")).split(/\r?\n/).filter(Boolean);
  const rows = [];
  for (const [sourceOrdinal, rawJson] of lines.entries()) {
    const sourceRow = JSON.parse(rawJson);
    if (!sourceForRaw(sourceRow)) continue;
    rows.push({ ordinal: rows.length, sourceOrdinal, rawJson, sourceRow, parsed: parseOraJsonlRecipe(sourceRow) });
  }
  return rows;
}

function assertSourceRow(row) {
  if (!sourceForRaw(row.sourceRow)) throw new Error(`SOURCE_RIGHTS_METADATA_MISMATCH_${row.sourceOrdinal}`);
  if (!row.parsed.quality.hasTitle || !row.parsed.quality.hasIngredients || !row.parsed.quality.hasDirections) throw new Error(`STRUCTURAL_SOURCE_MISMATCH_${row.sourceOrdinal}`);
}

function buildPackets(rows) {
  if (rows.length !== STEP8G_HEARN_V8014_CHILD_COUNT) throw new Error(`EXPECTED_${STEP8G_HEARN_V8014_CHILD_COUNT}_GOT_${rows.length}`);
  const seen = new Set();
  return rows.map(row => {
    assertSourceRow(row);
    const sourceSlug = slug(row.parsed.slug || row.parsed.title || String(row.sourceOrdinal));
    const recipeId = `${SOURCE.idPrefix}${sourceSlug}`;
    if (!sourceSlug || seen.has(recipeId)) throw new Error(`DUPLICATE_OR_INVALID_RECIPE_ID_${recipeId}`);
    seen.add(recipeId);
    const packet = {
      schema: SOURCE.packetSchema,
      canonicalRecipeId: recipeId,
      source: {
        cohortId: SOURCE.cohortId,
        repository: ORA_REPOSITORY,
        commit: ORA_COMMIT,
        path: `collections/${SOURCE.collection}/recipes.jsonl`,
        rowOrdinal: row.sourceOrdinal,
        sourceContentSha256: sha256(row.rawJson),
        sourceWork: SOURCE.sourceTitle,
        sourceAuthor: SOURCE.sourceAuthor,
        sourceAuthorClassification: SOURCE.authorClassification,
        sourceAuthorDisplay: "Lafcadio Hearn",
        workFirstPublicationYear: SOURCE.workFirstPublicationYear,
        sourceYearSemantics: SOURCE.sourceYearSemantics,
        digitizedEditionYear: SOURCE.digitizedEditionYear,
        digitizedEditionLabel: SOURCE.digitizedEditionLabel,
        sourceYear: SOURCE.sourceYear,
        sourceUrl: SOURCE.sourceUrl,
        licenseId: SOURCE.license,
        historicalCollectionLabel: SOURCE.collection,
        repositoryLayerLicense: "Unlicense"
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
      sourceOrdinal: row.sourceOrdinal,
      recipeId,
      sourceCohortId: SOURCE.cohortId,
      bodyJson,
      bodySha256: sha256(bodyJson),
      bodyBytes: utf8Bytes(bodyJson)
    };
  });
}

function buildPlan(packets) {
  const bodyById = new Map(packets.map(row => [row.recipeId, row.bodyJson]));
  const plan = buildStep8APopulationPlan({
    corpusVersion: STEP8G_HEARN_V8014_LAYER_VERSION,
    parentCorpusVersion: STEP8G_HEARN_V8014_PARENT_VERSION,
    sourceCohorts: [{
      id: SOURCE.cohortId,
      sourceName: `${SOURCE.sourceTitle} (${SOURCE.expectedRecipeCount}-record rights-cleared historical cohort)`,
      sourceVersion: ORA_COMMIT,
      admissionState: "STEP_8G_ORA_HEARN_1885_MEASUREMENT_EARNED_COHORT_CANDIDATE",
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: [
        "data/generated/step8g/hearn-1885-v8013-measurement.json",
        "docs/CORPUS_SCALE_STEP8G_VIARD_1806_RIGHTS_AND_MEASUREMENT.md",
        SOURCE.sourceUrl,
        `https://github.com/${ORA_REPOSITORY}/tree/${ORA_COMMIT}/collections/${SOURCE.collection}`
      ]
    }],
    entries: packets.map(({ bodyJson, sourceOrdinal, ...descriptor }) => descriptor),
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
  if (parentPrewrite?.pass !== true || parentPrewrite?.composition?.activeCorpusVersion !== "v8013" || Number(parentPrewrite?.composition?.cumulativeRecipeCount) !== STEP8G_HEARN_V8014_PARENT_COUNT) throw new Error("VALID_V8013_PARENT_PREWRITE_REQUIRED");
  const parentCapacity = parentPrewrite?.composition?.capacity;
  const prior = parentCapacity?.perShard || [];
  if (prior.length !== STEP8G_SHARD_COUNT) throw new Error("V8013_PARENT_SHARD_CAPACITY_MISSING");
  const added = plan.manifest.recipeBodyShards.descriptors;
  const perShard = Array.from({ length: STEP8G_SHARD_COUNT }, (_, shardNumber) => {
    const before = prior.find(row => Number(row.shardNumber) === shardNumber);
    const delta = added.find(row => Number(row.shardNumber) === shardNumber);
    if (!before) throw new Error(`V8013_PARENT_SHARD_${shardNumber}_MISSING`);
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

function batchRequestBytes(plan, candidateByOrdinal) {
  return plan.batches.map(batch => utf8Bytes(JSON.stringify({
    action: "write-body",
    batch: {
      batchId: batch.batchId,
      sourceEntries: batch.entries.map(entry => {
        const source = candidateByOrdinal.get(entry.ordinal);
        return { ordinal: entry.ordinal, sourceOrdinal: source.sourceOrdinal, rawJson: source.rawJson };
      })
    }
  })));
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

if (measurement?.pass !== true || measurement?.terminal !== "STEP_8G_ORA_HEARN_1885_MEASUREMENT_EARNED_COHORT_CANDIDATE" || Number(measurement?.candidate?.recipeCount) !== STEP8G_HEARN_V8014_CHILD_COUNT) throw new Error("EARNED_VIARD_MEASUREMENT_REQUIRED");
if (measurement?.nextAuthority !== "SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY") throw new Error("MEASUREMENT_PREWRITE_ONLY_AUTHORITY_REQUIRED");
if (measurement?.boundaries?.liveD1WritesPerformed !== 0 || measurement?.boundaries?.protectedPopulationAuthorized !== false || measurement?.boundaries?.thirdShardAuthorized !== false || measurement?.boundaries?.billingExpansionAuthorized !== false) throw new Error("MEASUREMENT_BOUNDARY_MISMATCH");

const parentFingerprint = buildV8013ParentFingerprint({ prewriteEvidence: parentPrewrite, liveEvidence: parentLive, runtimeDescriptor: STEP8G_V8013_RUNTIME_DESCRIPTOR });
const packets = buildPackets(candidate);
const plan = buildPlan(packets);
const capacity = computeCapacity(parentPrewrite, plan);
const operationBudget = plannedV8014OperationBudget({ maxRowsPerBatch: STEP8G_MAX_ROWS_PER_WRITE_BATCH });
const candidateByOrdinal = new Map(candidate.map(row => [row.ordinal, row]));
const requestBytes = batchRequestBytes(plan, candidateByOrdinal);
const maxBodyBytes = Math.max(...packets.map(row => row.bodyBytes));
const maxBatchBodyBytes = Math.max(...plan.batches.map(row => row.totalBodyBytes));
const maxRowsPerBatch = Math.max(...plan.batches.map(row => row.rowCount));
const maxWriteRequestBytes = Math.max(...requestBytes);
const allIds = packets.map(row => row.recipeId);
const packetDescriptorSha256 = sha256(JSON.stringify(packets.map(({ recipeId, bodySha256, bodyBytes }) => ({ recipeId, bodySha256, bodyBytes })).sort((a,b)=>a.recipeId.localeCompare(b.recipeId))));
const requestSizePass = maxWriteRequestBytes <= STEP8G_HEARN_V8014_MAX_REQUEST_BYTES;
const operationBudgetPass = operationBudget.pass && operationBudget.maxPlannedD1Subqueries <= STEP8G_HEARN_V8014_MAX_D1_SUBQUERIES;
const capacityPass = capacity.cumulativeBodyBytesWithinProjectTotalBudget && capacity.perShard.every(row => row.withinProjectDatabaseBudget);
const topologyPass = plan.manifest.recipeBodyShards.shardCount === STEP8G_SHARD_COUNT;
const countPass = STEP8G_HEARN_V8014_PARENT_COUNT + plan.manifest.recipeCount === STEP8G_HEARN_V8014_COMPOSED_COUNT;
const batchSizePass = maxRowsPerBatch <= STEP8G_HEARN_V8014_MAX_ROWS_PER_BATCH;
const uniqueIdsPass = allIds.length === new Set(allIds).size;
const bodySizePass = maxBodyBytes < 2 * 1024 * 1024;
const pass = requestSizePass && operationBudgetPass && capacityPass && topologyPass && countPass && batchSizePass && uniqueIdsPass && bodySizePass;

const evidence = {
  schema: "CORPUS_SCALE_STEP8G_HEARN_V8014_PREWRITE_V1",
  pass,
  terminalCandidate: pass ? PREWRITE_PASS_TERMINAL : "STEP_8G_CAPACITY_OR_COST_GATE_REACHED",
  date: "2026-09-20",
  source: {
    repository: ORA_REPOSITORY,
    commit: ORA_COMMIT,
    collection: SOURCE.collection,
    recordCount: packets.length,
    measurementTerminal: measurement.terminal,
    sourceCohort: {
      cohortId: SOURCE.cohortId,
      sourceWork: SOURCE.sourceTitle,
      sourceAuthor: SOURCE.sourceAuthor,
      sourceAuthorClassification: SOURCE.authorClassification,
      sourceYear: SOURCE.sourceYear,
      sourceYearSemantics: SOURCE.sourceYearSemantics,
      sourceUrl: SOURCE.sourceUrl,
      digitizedEditionYear: SOURCE.digitizedEditionYear,
      digitizedEditionLabel: SOURCE.digitizedEditionLabel,
      workFirstPublicationYear: SOURCE.workFirstPublicationYear,
      recordCount: SOURCE.expectedRecipeCount,
      licenseId: SOURCE.license,
      packetDescriptorSha256
    },
    repositoryLayerLicense: "Unlicense",
    culturalAuthenticityAuthorityImported: false
  },
  parent: {
    activeCorpusVersion: STEP8G_HEARN_V8014_PARENT_VERSION,
    composedRecipeCount: STEP8G_HEARN_V8014_PARENT_COUNT,
    fingerprintSha256: parentFingerprint.sha256,
    fingerprintMaterial: parentFingerprint.material
  },
  layer: {
    corpusVersion: STEP8G_HEARN_V8014_LAYER_VERSION,
    parentCorpusVersion: STEP8G_HEARN_V8014_PARENT_VERSION,
    recipeCount: plan.manifest.recipeCount,
    manifestSha256: plan.manifest.manifestSha256,
    populationPlanSha256: plan.populationPlanSha256,
    batchCount: plan.batches.length,
    maxRowsPerBatch,
    maxBodyBytes,
    maxBatchBodyBytes,
    maxWriteRequestBytes,
    maxAllowedWriteRequestBytes: STEP8G_HEARN_V8014_MAX_REQUEST_BYTES,
    requestSizePass,
    operationBudget,
    shardDescriptors: plan.manifest.recipeBodyShards.descriptors,
    batchIdsSha256: sha256(JSON.stringify(plan.batches.map(batch => batch.batchId)))
  },
  composition: {
    activeCorpusVersion: STEP8G_HEARN_V8014_LAYER_VERSION,
    parentCorpusVersion: STEP8G_HEARN_V8014_PARENT_VERSION,
    cumulativeRecipeCount: STEP8G_HEARN_V8014_COMPOSED_COUNT,
    capacity,
    routing: {
      shardCount: STEP8G_SHARD_COUNT,
      mode: "CONTROL_INDEX_EXACT_ROUTE_THEN_BATCH_HYDRATE_BY_SHARD",
      fullCorpusScans: 0,
      maxProtectedD1Subqueries: STEP8G_HEARN_V8014_MAX_D1_SUBQUERIES,
      d1BudgetHeadroomAssumed: false
    }
  },
  gates: { requestSizePass, operationBudgetPass, capacityPass, topologyPass, countPass, batchSizePass, uniqueIdsPass, bodySizePass },
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
  decision: pass ? "EARN_V8014_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_ON_EXISTING_TWO_SHARD_AND_16_QUERY_ENVELOPE" : "STOP_CAPACITY_OR_COST_GATE"
};
assertV8014PrewriteBoundaries(evidence);

const validation = {
  schema: "CORPUS_SCALE_STEP8G_HEARN_V8014_PREWRITE_VALIDATION_V1",
  date: "2026-09-20",
  pass,
  parentFingerprintSha256: parentFingerprint.sha256,
  childDescriptorUniverseSha256: packetDescriptorSha256,
  manifestSha256: plan.manifest.manifestSha256,
  populationPlanSha256: plan.populationPlanSha256,
  countContract: { parent: STEP8G_HEARN_V8014_PARENT_COUNT, child: STEP8G_HEARN_V8014_CHILD_COUNT, composed: STEP8G_HEARN_V8014_COMPOSED_COUNT },
  gates: evidence.gates,
  boundaries: evidence.boundaries
};

await mkdir(resolve(args.output), { recursive: true });
await writeFile(resolve(args.output, "prewrite-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await writeFile(resolve(args.output, "prewrite-validation.json"), `${JSON.stringify(validation, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
