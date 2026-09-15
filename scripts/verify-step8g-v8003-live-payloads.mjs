import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { recipeDatabaseShardForId } from "./corpus-scale-step7a-core.mjs";
import {
  STEP8G_V8003_SOURCE_COMMIT,
  expectedStep8GV8003BodyBatchIds,
  expectedStep8GV8003RouteBatchIds,
  materializeStep8GV8003IncomingBodyBatch,
  publicStep8GV8003RouteBatch
} from "../src/server/step8g-v8003-live-runtime.mjs";
import { sha256Hex } from "../src/server/step8b-live.mjs";

function parseArgs(argv) {
  const options = { candidate: null };
  for (const arg of argv) if (arg.startsWith("--candidate=")) options.candidate = arg.slice("--candidate=".length);
  if (!options.candidate) throw new Error("--candidate=<checked-out source path> is required");
  return options;
}
function commitAt(path) { return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding:"utf8" }).trim(); }
function slugFromFile(fileName) { return String(fileName).replace(/\.md$/i, "").normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
function chunk(values, size) { const out=[]; for(let offset=0;offset<values.length;offset+=size) out.push(values.slice(offset,offset+size)); return out; }

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.candidate);
if (commitAt(root) !== STEP8G_V8003_SOURCE_COMMIT) throw new Error("CC0_SOURCE_PIN_MISMATCH");
const dir = resolve(root, "src");
const files = (await readdir(dir)).filter(file => file.endsWith(".md")).sort((a,b)=>a.localeCompare(b));
if (files.length !== 226) throw new Error(`CC0_EXPECTED_226_GOT_${files.length}`);
const rows = [];
for (let ordinal=0; ordinal<files.length; ordinal += 1) {
  const fileName = files[ordinal];
  const rawMarkdown = await readFile(resolve(dir,fileName),"utf8");
  const recipeId = `cc0_sgauthier_${slugFromFile(fileName)}`;
  rows.push({ ordinal, fileName, rawMarkdown, recipeId, shardNumber:recipeDatabaseShardForId(recipeId,2) });
}
const byShard=[rows.filter(r=>r.shardNumber===0),rows.filter(r=>r.shardNumber===1)];
const bodyBatches=[];
for(const shardNumber of [0,1]) for(const [batchNumber,batchRows] of chunk(byShard[shardNumber],10).entries()) bodyBatches.push({batchId:`s${String(shardNumber).padStart(2,"0")}-b${String(batchNumber).padStart(6,"0")}`,shardNumber,rows:batchRows});
if (JSON.stringify(bodyBatches.map(b=>b.batchId)) !== JSON.stringify(expectedStep8GV8003BodyBatchIds())) throw new Error("BODY_BATCH_LAYOUT_MISMATCH");
const routes=[];
for(const batch of bodyBatches){const result=await materializeStep8GV8003IncomingBodyBatch({batchId:batch.batchId,sourceEntries:batch.rows.map(({ordinal,fileName,rawMarkdown})=>({ordinal,fileName,rawMarkdown}))});if(!result.pass)throw new Error(`${batch.batchId}:${result.reason}`);routes.push(...result.batch.entries.map(entry=>({recipeId:entry.recipeId,corpusVersion:"v8003",shardNumber:batch.shardNumber,sourceCohortId:entry.sourceCohortId,bodySha256:entry.bodySha256,bodyBytes:entry.bodyBytes})));}
if(routes.length!==226||new Set(routes.map(r=>r.recipeId)).size!==226)throw new Error("ROUTE_UNIVERSE_MISMATCH");
const routeBatches=[];
for(const shardNumber of [0,1]){const shardRoutes=routes.filter(r=>r.shardNumber===shardNumber).sort((a,b)=>a.recipeId.localeCompare(b.recipeId));for(const [batchNumber,entries] of chunk(shardRoutes,10).entries()){const batchId=`route-v8003-s${String(shardNumber).padStart(2,"0")}-b${String(batchNumber).padStart(6,"0")}`;const expected=publicStep8GV8003RouteBatch(batchId);if(!expected)throw new Error(`UNKNOWN_EXPECTED_ROUTE_BATCH_${batchId}`);const observedSha=await sha256Hex(JSON.stringify({compositionVersion:"v8003",corpusVersion:"v8003",shardNumber,entries}));if(observedSha!==expected.expectedSha256)throw new Error(`ROUTE_BATCH_FINGERPRINT_MISMATCH_${batchId}`);routeBatches.push(batchId);}}
if(JSON.stringify(routeBatches)!==JSON.stringify(expectedStep8GV8003RouteBatchIds()))throw new Error("ROUTE_BATCH_LAYOUT_MISMATCH");
process.stdout.write(`${JSON.stringify({pass:true,sourceCommit:STEP8G_V8003_SOURCE_COMMIT,recipeCount:226,bodyBatchCount:bodyBatches.length,routeBatchCount:routeBatches.length,shardRows:byShard.map(rows=>rows.length),terminal:"STEP_8G_CC0_V8003_LIVE_PAYLOAD_PARITY_PASS"},null,2)}\n`);
