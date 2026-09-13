import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  STEP8D_EXPECTED_RECORD_COUNT,
  buildStep8DArtifacts,
  validateStep8DPreWriteArtifacts
} from "./corpus-scale-step8d-core.mjs";

const contract = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8d_contract.json", import.meta.url), "utf8"));
const source = contract.source;
const outputDir = resolve(process.env.STEP8D_ARTIFACT_DIR || "artifacts/step8d-prewrite");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function gitBlobSha(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

function compactPlan(plan) {
  return {
    contractVersion: plan.contractVersion,
    manifestSha256: plan.manifest.manifestSha256,
    populationPlanSha256: plan.populationPlanSha256,
    batches: plan.batches.map(batch => ({
      batchId: batch.batchId,
      shardNumber: batch.shardNumber,
      batchNumber: batch.batchNumber,
      rowCount: batch.rowCount,
      totalBodyBytes: batch.totalBodyBytes,
      plannedStatements: batch.plannedStatements,
      expectedSha256: batch.expectedSha256,
      entries: batch.entries.map(entry => ({
        ordinal: entry.ordinal,
        recipeId: entry.recipeId,
        bodySha256: entry.bodySha256,
        bodyBytes: entry.bodyBytes,
        sourceCohortId: entry.sourceCohortId
      }))
    }))
  };
}

function scalingValues(dataset) {
  const values = new Set();
  for (const recipe of dataset.recipes || []) {
    for (const ingredient of recipe.ingredients || []) {
      if (ingredient.scaling != null) values.add(String(ingredient.scaling));
    }
  }
  return [...values].sort();
}

const rawUrl = `https://raw.githubusercontent.com/${source.repository}/${source.commit}/${source.dataPath}`;
const response = await fetch(rawUrl, {
  headers: { "user-agent": "culinary-recommender-step8d-prewrite-verifier" }
});
if (!response.ok) throw new Error(`Pinned UniTools fetch failed with HTTP ${response.status}`);

const sourceBytes = Buffer.from(await response.arrayBuffer());
const observedBlobSha = gitBlobSha(sourceBytes);
if (observedBlobSha !== source.dataBlobSha) {
  throw new Error(`Pinned UniTools Git blob mismatch: expected ${source.dataBlobSha}, observed ${observedBlobSha}`);
}

const dataset = JSON.parse(sourceBytes.toString("utf8"));
if (dataset.version !== source.datasetVersion) throw new Error("Pinned UniTools dataset version mismatch");
if (Number(dataset.counts?.recipes) !== STEP8D_EXPECTED_RECORD_COUNT) throw new Error("Pinned UniTools metadata count mismatch");
if (!Array.isArray(dataset.recipes) || dataset.recipes.length !== STEP8D_EXPECTED_RECORD_COUNT) {
  throw new Error("Pinned UniTools recipe array must contain exactly 501 records");
}

const first = buildStep8DArtifacts(dataset, contract);
const second = buildStep8DArtifacts(JSON.parse(JSON.stringify(dataset)), JSON.parse(JSON.stringify(contract)));
const acceptance = validateStep8DPreWriteArtifacts(first);
if (!acceptance.pass || acceptance.liveWritesAllowed !== true) {
  throw new Error(`Step 8D pre-write acceptance failed: ${acceptance.errors.join(", ")}`);
}
if (first.manifest.manifestSha256 !== second.manifest.manifestSha256) throw new Error("Step 8D manifest is not deterministic");
if (first.populationPlan.populationPlanSha256 !== second.populationPlan.populationPlanSha256) throw new Error("Step 8D population plan is not deterministic");

const firstPacketFingerprint = sha256(first.packets.map(packet => JSON.stringify(packet)).join("\n"));
const secondPacketFingerprint = sha256(second.packets.map(packet => JSON.stringify(packet)).join("\n"));
if (firstPacketFingerprint !== secondPacketFingerprint) throw new Error("Step 8D packet transformation is not deterministic");

const shardRows = first.manifest.routing.descriptors.map(descriptor => ({
  shardNumber: descriptor.shardNumber,
  rowCount: descriptor.rowCount,
  totalBodyBytes: descriptor.totalBodyBytes,
  entriesSha256: descriptor.entriesSha256
}));
const batchCount = first.populationPlan.batches.length;
const maxRowsPerBatch = Math.max(...first.populationPlan.batches.map(batch => batch.rowCount));
const scaling = scalingValues(dataset);

const evidence = {
  contractVersion: contract.contractVersion,
  evidenceType: "STEP8D_PINNED_SOURCE_PREWRITE_VERIFICATION",
  pass: true,
  terminalCandidate: "STEP8D_PREWRITE_ACCEPTANCE_PASS",
  liveWritesAllowedByPrewriteContract: true,
  liveWritesPerformed: false,
  source: {
    repository: source.repository,
    commit: source.commit,
    dataPath: source.dataPath,
    expectedGitBlobSha: source.dataBlobSha,
    observedGitBlobSha: observedBlobSha,
    sourceBytes: sourceBytes.length,
    datasetVersion: dataset.version,
    recipeCount: dataset.recipes.length,
    metadataRecipeCount: Number(dataset.counts.recipes)
  },
  transformation: {
    packetSchemaVersion: first.manifest.packetSchemaVersion,
    packetCount: first.packets.length,
    packetSetSha256: firstPacketFingerprint,
    manifestSchemaVersion: first.manifest.manifestSchemaVersion,
    manifestSha256: first.manifest.manifestSha256,
    populationPlanSha256: first.populationPlan.populationPlanSha256,
    scalingValuesObservedVerbatim: scaling,
    mediaExcluded: true,
    sourceAuthorityFirewallPass: true
  },
  routing: {
    shardCount: first.manifest.routing.shardCount,
    shardRows,
    batchCount,
    maxRowsPerBatch,
    maxAllowedRowsPerBatch: contract.topology.maxRowsPerWriteBatch
  },
  acceptance,
  boundaries: {
    publicRuntimeChanged: false,
    d1WritesPerformed: 0,
    thirdShardUsed: false,
    billingExpansion: false,
    knowledgeCoreWritePerformed: false,
    nutritionLaneModified: false,
    youtubeCulinaryStateModified: false
  }
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "manifest.json"), `${JSON.stringify(first.manifest, null, 2)}\n`);
writeFileSync(resolve(outputDir, "population-plan-descriptors.json"), `${JSON.stringify(compactPlan(first.populationPlan), null, 2)}\n`);
writeFileSync(resolve(outputDir, "prewrite-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(JSON.stringify(evidence, null, 2));
