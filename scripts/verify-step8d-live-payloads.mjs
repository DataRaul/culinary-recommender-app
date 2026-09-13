import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import plan from "../data/generated/step8d/population-plan-descriptors.json" with { type: "json" };
import { buildStep8DProtectedPacket } from "../src/shared/step8d-packet.mjs";
import { validateStep8DIncomingBatch } from "../src/server/step8d-live.mjs";

const contract = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8d_contract.json", import.meta.url), "utf8"));
const outputDir = resolve(process.env.STEP8D_LIVE_PREFLIGHT_ARTIFACT_DIR || "artifacts/step8d-live-preflight");
const encoder = new TextEncoder();

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function gitBlobSha(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

const source = contract.source;
const rawUrl = `https://raw.githubusercontent.com/${source.repository}/${source.commit}/${source.dataPath}`;
const response = await fetch(rawUrl, { headers: { "user-agent": "culinary-recommender-step8d-live-preflight" } });
if (!response.ok) throw new Error(`Pinned source fetch failed with HTTP ${response.status}`);
const cors = response.headers.get("access-control-allow-origin");
if (cors !== "*") throw new Error(`Pinned source browser CORS is not wildcard-enabled: ${cors || "<missing>"}`);
const sourceBytes = Buffer.from(await response.arrayBuffer());
const observedBlobSha = gitBlobSha(sourceBytes);
if (observedBlobSha !== source.dataBlobSha) throw new Error("Pinned source Git blob SHA mismatch");

const dataset = JSON.parse(sourceBytes.toString("utf8"));
if (dataset.version !== source.datasetVersion || dataset.recipes?.length !== 501 || Number(dataset.counts?.recipes) !== 501) {
  throw new Error("Pinned source version/count mismatch");
}

const packetById = new Map();
for (let ordinal = 0; ordinal < dataset.recipes.length; ordinal += 1) {
  const packet = buildStep8DProtectedPacket(dataset.recipes[ordinal], { source, ordinal });
  const bodyJson = JSON.stringify(packet);
  const descriptor = {
    ordinal,
    recipeId: packet.identity.recipeId,
    bodySha256: sha256(bodyJson),
    bodyBytes: encoder.encode(bodyJson).byteLength,
    sourceCohortId: source.sourceCohortId,
    bodyJson
  };
  if (packetById.has(descriptor.recipeId)) throw new Error(`Duplicate recipe ID ${descriptor.recipeId}`);
  packetById.set(descriptor.recipeId, descriptor);
}

let maxRequestBytes = 0;
let maxBatchBodyBytes = 0;
const batchEvidence = [];
for (const frozenBatch of plan.batches) {
  const batch = {
    batchId: frozenBatch.batchId,
    entries: frozenBatch.entries.map(expected => {
      const actual = packetById.get(expected.recipeId);
      if (!actual
        || actual.ordinal !== expected.ordinal
        || actual.bodySha256 !== expected.bodySha256
        || actual.bodyBytes !== expected.bodyBytes
        || actual.sourceCohortId !== expected.sourceCohortId) {
        throw new Error(`Shared live transformer differs from frozen descriptor for ${expected.recipeId}`);
      }
      return actual;
    })
  };
  const validated = await validateStep8DIncomingBatch(batch);
  if (!validated.pass) throw new Error(`Frozen batch ${frozenBatch.batchId} rejected by live validator: ${validated.reason}`);
  const requestBytes = Buffer.byteLength(JSON.stringify({ action: "write", batch }), "utf8");
  const batchBodyBytes = batch.entries.reduce((sum, entry) => sum + entry.bodyBytes, 0);
  maxRequestBytes = Math.max(maxRequestBytes, requestBytes);
  maxBatchBodyBytes = Math.max(maxBatchBodyBytes, batchBodyBytes);
  if (requestBytes > 256 * 1024) throw new Error(`Frozen batch ${frozenBatch.batchId} exceeds live request limit`);
  batchEvidence.push({
    batchId: frozenBatch.batchId,
    shardNumber: validated.batch.shardNumber,
    rowCount: validated.batch.rowCount,
    expectedSha256: validated.batch.expectedSha256,
    requestBytes
  });
}

const evidence = {
  contractVersion: "CORPUS_SCALE_STEP8D_LIVE_PREFLIGHT_V1",
  pass: true,
  source: {
    rawUrl,
    expectedBlobSha: source.dataBlobSha,
    observedBlobSha,
    browserCorsAllowOrigin: cors,
    recipeCount: dataset.recipes.length
  },
  payloads: {
    protectedPacketCount: packetById.size,
    batchCount: batchEvidence.length,
    maxRowsPerBatch: Math.max(...plan.batches.map(batch => batch.rowCount)),
    maxBatchBodyBytes,
    maxRequestBytes,
    requestLimitBytes: 256 * 1024,
    allFrozenBodyHashesMatched: true,
    allFrozenBatchFingerprintsAcceptedByLiveValidator: true,
    populationPlanSha256: plan.populationPlanSha256
  },
  boundaries: {
    d1WritesPerformed: 0,
    publicRuntimeChanged: false,
    thirdShardUsed: false,
    billingExpansion: false
  }
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
