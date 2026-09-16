import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const encoder = new TextEncoder();
const bytes = value => encoder.encode(String(value)).byteLength;

function parseArgs(argv) {
  const args = {
    evidence: ".tmp/step8g-ora-turabi-v8006-prewrite/evidence.json",
    plan: ".tmp/step8g-ora-turabi-v8006-prewrite/population-plan-descriptors.json",
    output: ".tmp/step8g-ora-turabi-v8006-prewrite/prewrite-validation.json"
  };
  for (const arg of argv) {
    if (arg.startsWith("--evidence=")) args.evidence = arg.slice(11);
    else if (arg.startsWith("--plan=")) args.plan = arg.slice(7);
    else if (arg.startsWith("--out=")) args.output = arg.slice(6);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const [evidence, plan] = await Promise.all([
  readFile(resolve(args.evidence), "utf8").then(JSON.parse),
  readFile(resolve(args.plan), "utf8").then(JSON.parse)
]);

if (evidence?.pass !== true) throw new Error("PREWRITE_PASS_REQUIRED");
if (evidence?.composition?.activeCorpusVersion !== "v8006" || Number(evidence?.composition?.cumulativeRecipeCount) !== 2906) throw new Error("V8006_COMPOSITION_IDENTITY_MISMATCH");
if (evidence?.parent?.activeCorpusVersion !== "v8005" || Number(evidence?.parent?.composedRecipeCount) !== 2464) throw new Error("V8005_PARENT_IDENTITY_MISMATCH");
if (!Array.isArray(plan?.batches) || !plan.batches.length) throw new Error("POPULATION_BATCHES_REQUIRED");
if (plan.populationPlanSha256 !== evidence?.layer?.populationPlanSha256) throw new Error("POPULATION_PLAN_SHA_MISMATCH");
if (plan?.manifest?.manifestSha256 !== evidence?.layer?.manifestSha256) throw new Error("MANIFEST_SHA_MISMATCH");
if (plan?.parentFingerprint?.sha256 !== evidence?.parent?.fingerprintSha256) throw new Error("PARENT_FINGERPRINT_MISMATCH");

const routePayloads = plan.batches.map((batch, index) => {
  const entries = batch.entries.map(entry => ({
    recipeId: entry.recipeId,
    corpusVersion: "v8006",
    shardNumber: Number(batch.shardNumber),
    sourceCohortId: entry.sourceCohortId,
    bodySha256: entry.bodySha256,
    bodyBytes: Number(entry.bodyBytes)
  }));
  return {
    batchId: `route-v8006-s${String(batch.shardNumber).padStart(2, "0")}-b${String(index).padStart(6, "0")}`,
    rowCount: entries.length,
    requestBytes: bytes(JSON.stringify({ action: "write-route", batchId: `route-v8006-${batch.batchId}`, entries }))
  };
});

const maxRouteWriteRequestBytes = Math.max(...routePayloads.map(row => row.requestBytes));
const maxBodyWriteRequestBytes = Number(evidence.layer.maxWriteRequestBytes);
const maxAnyWriteRequestBytes = Math.max(maxBodyWriteRequestBytes, maxRouteWriteRequestBytes);
const maxAllowedWriteRequestBytes = Number(evidence.layer.maxAllowedWriteRequestBytes);
const requestEnvelopePass = maxAnyWriteRequestBytes <= maxAllowedWriteRequestBytes;

const operations = evidence?.layer?.operationBudget?.operations || {};
const operationEntries = Object.entries(operations);
if (!operationEntries.length) throw new Error("OPERATION_BUDGET_REQUIRED");
const overBudget = operationEntries.filter(([, value]) => Number(value) > 16);
const routeWriteCeilingExact = Number(operations.routeWriteFresh) === 16;
const d1EnvelopePass = overBudget.length === 0 && Number(evidence.layer.operationBudget.maxPlannedD1Subqueries) === 16 && routeWriteCeilingExact;

const boundaryPass = evidence?.boundaries?.liveD1WritesPerformed === 0 &&
  evidence?.boundaries?.publicRuntimeChanged === false &&
  evidence?.boundaries?.recommendationAdmissionPerformed === false &&
  evidence?.boundaries?.thirdShardUsed === false &&
  evidence?.boundaries?.d1BudgetExpansion === false &&
  evidence?.boundaries?.billingExpansion === false &&
  evidence?.boundaries?.nutritionLaneModified === false &&
  evidence?.boundaries?.youtubeCulinaryStateModified === false &&
  evidence?.boundaries?.knowledgeCoreWritePerformed === false &&
  evidence?.boundaries?.culturalAuthenticityAuthorityImported === false;

const pass = requestEnvelopePass && d1EnvelopePass && boundaryPass;
const result = {
  schema: "CORPUS_SCALE_STEP8G_ORA_TURABI_EFENDI_V8006_PREWRITE_VALIDATION_V1",
  pass,
  maxBodyWriteRequestBytes,
  maxRouteWriteRequestBytes,
  maxAnyWriteRequestBytes,
  maxAllowedWriteRequestBytes,
  requestEnvelopePass,
  operationBudget: evidence.layer.operationBudget,
  routeWriteCeilingExact,
  overBudgetOperations: overBudget.map(([name, value]) => ({ name, d1Subqueries: Number(value) })),
  d1EnvelopePass,
  boundaryPass,
  routeBatchCount: routePayloads.length,
  routeMaxRowsPerBatch: Math.max(...routePayloads.map(row => row.rowCount)),
  fullCorpusScans: 0,
  liveD1WritesPerformed: 0
};

await mkdir(dirname(resolve(args.output)), { recursive: true });
await writeFile(resolve(args.output), `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!pass) process.exitCode = 1;
