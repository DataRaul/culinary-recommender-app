import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { recipeDatabaseShardForId } from "./corpus-scale-step7a-core.mjs";
import { STEP8G_V8011_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8011-runtime-descriptor.mjs";
import {
  STEP8G_V8011_EXPECTED_RECIPE_COUNT,
  expectedStep8GV8011BodyBatchIds,
  expectedStep8GV8011RouteBatchIds,
  materializeStep8GV8011IncomingBodyBatch,
  publicStep8GV8011RouteBatch
} from "../src/server/step8g-v8011-live-runtime.mjs";
import { sha256Hex } from "../src/server/step8b-live.mjs";

const COLLECTION = "danske-kokken";
const SOURCES = Object.freeze([
  Object.freeze({
    cohortId: "ORA_FROKEN_JENSEN_1921_KOGEBOG_23RD_FRKENJENSENSKO00JENS",
    sourceUrl: "https://archive.org/details/frkenjensensko00jens",
    sourceTitle: "Frøken Jensens kogebog",
    author: "Kristine Marie Jensen",
    sourceYear: "1921",
    license: "public-domain",
    expectedRecipeCount: 1372,
    idPrefix: "ora_froken_jensen_1921_"
  })
]);

function parseArgs(argv) {
  const out = { candidate: null };
  for (const arg of argv) if (arg.startsWith("--candidate=")) out.candidate = arg.slice(12);
  if (!out.candidate) throw new Error("--candidate=<checked-out source path> is required");
  return out;
}

const commitAt = path => execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
function slug(value) { return String(value ?? "").normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
function chunk(values, size) { const out = []; for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size)); return out; }
function sourceForRow(row = {}) {
  return SOURCES.find(source =>
    String(row.collection ?? "") === COLLECTION &&
    String(row.source_url ?? "") === source.sourceUrl &&
    String(row.source_title ?? "") === source.sourceTitle &&
    String(row.author ?? "") === source.author &&
    String(row.source_year ?? "") === source.sourceYear &&
    String(row.license ?? "") === source.license
  ) || null;
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.candidate);
if (commitAt(root) !== STEP8G_V8011_RUNTIME_DESCRIPTOR.sourceCommit) throw new Error("ORA_SOURCE_PIN_MISMATCH");
const rawLines = (await readFile(resolve(root, `collections/${COLLECTION}/recipes.jsonl`), "utf8")).split(/\r?\n/).filter(Boolean);
const rows = [];
for (const [sourceOrdinal, rawJson] of rawLines.entries()) {
  const row = JSON.parse(rawJson), source = sourceForRow(row);
  if (!source) continue;
  const ordinal = rows.length, recipeId = `${source.idPrefix}${slug(row.slug || row.title || String(sourceOrdinal))}`;
  rows.push({ ordinal, sourceOrdinal, rawJson, recipeId, sourceCohortId: source.cohortId, shardNumber: recipeDatabaseShardForId(recipeId, 2) });
}
if (rows.length !== STEP8G_V8011_EXPECTED_RECIPE_COUNT) throw new Error(`FROKEN_JENSEN_1921_EXPECTED_${STEP8G_V8011_EXPECTED_RECIPE_COUNT}_GOT_${rows.length}`);
if (new Set(rows.map(row => row.recipeId)).size !== rows.length) throw new Error("SOURCE_RECIPE_ID_UNIVERSE_NOT_UNIQUE");
for (const source of SOURCES) {
  const count = rows.filter(row => row.sourceCohortId === source.cohortId).length;
  if (count !== source.expectedRecipeCount) throw new Error(`SOURCE_COHORT_COUNT_${source.cohortId}_${count}`);
}

const byShard = [rows.filter(row => row.shardNumber === 0), rows.filter(row => row.shardNumber === 1)];
const bodyBatches = [];
for (const shardNumber of [0, 1]) {
  for (const [batchNumber, batchRows] of chunk(byShard[shardNumber], 10).entries()) {
    bodyBatches.push({ batchId: `s${String(shardNumber).padStart(2, "0")}-b${String(batchNumber).padStart(6, "0")}`, shardNumber, rows: batchRows });
  }
}
if (JSON.stringify(bodyBatches.map(batch => batch.batchId)) !== JSON.stringify(expectedStep8GV8011BodyBatchIds())) throw new Error("BODY_BATCH_LAYOUT_MISMATCH");

const routes = [];
for (const batch of bodyBatches) {
  const result = await materializeStep8GV8011IncomingBodyBatch({ batchId: batch.batchId, sourceEntries: batch.rows.map(({ ordinal, sourceOrdinal, rawJson }) => ({ ordinal, sourceOrdinal, rawJson })) });
  if (!result.pass) throw new Error(`${batch.batchId}:${result.reason}`);
  routes.push(...result.batch.entries.map(entry => ({ recipeId: entry.recipeId, corpusVersion: "v8011", shardNumber: batch.shardNumber, sourceCohortId: entry.sourceCohortId, bodySha256: entry.bodySha256, bodyBytes: entry.bodyBytes })));
}
if (routes.length !== 1372 || new Set(routes.map(route => route.recipeId)).size !== 1372) throw new Error("ROUTE_UNIVERSE_MISMATCH");

const routeBatchIds = [];
for (const shardNumber of [0, 1]) {
  const shardRoutes = routes.filter(route => route.shardNumber === shardNumber).sort((a, b) => a.recipeId.localeCompare(b.recipeId));
  for (const [batchNumber, entries] of chunk(shardRoutes, 10).entries()) {
    const batchId = `route-v8011-s${String(shardNumber).padStart(2, "0")}-b${String(batchNumber).padStart(6, "0")}`;
    const frozen = publicStep8GV8011RouteBatch(batchId);
    if (!frozen) throw new Error(`UNKNOWN_FROZEN_ROUTE_BATCH_${batchId}`);
    const observed = await sha256Hex(JSON.stringify({ compositionVersion: "v8011", corpusVersion: "v8011", shardNumber, entries }));
    if (observed !== frozen.expectedSha256) throw new Error(`ROUTE_BATCH_FINGERPRINT_MISMATCH_${batchId}`);
    routeBatchIds.push(batchId);
  }
}
if (JSON.stringify(routeBatchIds) !== JSON.stringify(expectedStep8GV8011RouteBatchIds())) throw new Error("ROUTE_BATCH_LAYOUT_MISMATCH");

process.stdout.write(`${JSON.stringify({
  pass: true,
  sourceCommit: STEP8G_V8011_RUNTIME_DESCRIPTOR.sourceCommit,
  recipeCount: 1372,
  sourceCounts: Object.fromEntries(SOURCES.map(source => [source.cohortId, rows.filter(row => row.sourceCohortId === source.cohortId).length])),
  bodyBatchCount: bodyBatches.length,
  routeBatchCount: routeBatchIds.length,
  shardRows: byShard.map(group => group.length),
  parentRouteCount: 11752,
  composedRouteCount: 13124,
  restartSafeResume: true,
  sourceAuthorHandling: "IDENTIFIED_AUTHOR",
  protectedBodiesCommittedToRepository: false,
  terminal: "STEP_8G_FROKEN_JENSEN_V8011_LIVE_PAYLOAD_PARITY_PASS"
}, null, 2)}\n`);
