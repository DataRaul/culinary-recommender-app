import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { recipeDatabaseShardForId } from "./corpus-scale-step7a-core.mjs";
import { STEP8G_V8006_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8006-runtime-descriptor.mjs";
import {
  STEP8G_V8006_EXPECTED_RECIPE_COUNT,
  expectedStep8GV8006BodyBatchIds,
  expectedStep8GV8006RouteBatchIds,
  materializeStep8GV8006IncomingBodyBatch
} from "../src/server/step8g-v8006-live-runtime.mjs";
import { sha256Hex } from "../src/server/step8b-live.mjs";

const COLLECTION="ottoman-turkish";
const TITLE="A Turkish Cookery Book";
const AUTHOR="Turabi Efendi";
const YEAR="1864";
const SOURCE_URL="https://archive.org/details/b21527830";

function parseArgs(argv){const out={candidate:null};for(const arg of argv)if(arg.startsWith("--candidate="))out.candidate=arg.slice(12);if(!out.candidate)throw new Error("--candidate=<checked-out source path> is required");return out;}
function commitAt(path){return execFileSync("git",["-C",path,"rev-parse","HEAD"],{encoding:"utf8"}).trim();}
function slug(value){return String(value??"").normalize("NFKD").replace(/\p{M}+/gu,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
function chunk(values,size){const out=[];for(let offset=0;offset<values.length;offset+=size)out.push(values.slice(offset,offset+size));return out;}

const args=parseArgs(process.argv.slice(2)),root=resolve(args.candidate);
if(commitAt(root)!==STEP8G_V8006_RUNTIME_DESCRIPTOR.sourceCommit)throw new Error("ORA_SOURCE_PIN_MISMATCH");
const path=resolve(root,`collections/${COLLECTION}/recipes.jsonl`),rawLines=(await readFile(path,"utf8")).split(/\r?\n/).filter(Boolean),rows=[];
for(const [ordinal,rawJson] of rawLines.entries()){
  const row=JSON.parse(rawJson);
  if(String(row.collection??"")!==COLLECTION||String(row.source_title??"")!==TITLE||String(row.author??"")!==AUTHOR||String(row.source_year??"")!==YEAR||String(row.source_url??"")!==SOURCE_URL||String(row.license??"")!=="public-domain")throw new Error(`TURABI_SOURCE_IDENTITY_MISMATCH_${ordinal}`);
  const sourceSlug=slug(row.slug||row.title||String(ordinal)),recipeId=`ora_turabi_1864_${sourceSlug}`;
  rows.push({ordinal,rawJson,recipeId,shardNumber:recipeDatabaseShardForId(recipeId,2)});
}
if(rows.length!==STEP8G_V8006_EXPECTED_RECIPE_COUNT)throw new Error(`TURABI_EXPECTED_${STEP8G_V8006_EXPECTED_RECIPE_COUNT}_GOT_${rows.length}`);
if(new Set(rows.map(row=>row.recipeId)).size!==rows.length)throw new Error("SOURCE_RECIPE_ID_UNIVERSE_NOT_UNIQUE");
const byShard=[rows.filter(row=>row.shardNumber===0),rows.filter(row=>row.shardNumber===1)],bodyBatches=[];
for(const shardNumber of [0,1])for(const [batchNumber,batchRows] of chunk(byShard[shardNumber],10).entries())bodyBatches.push({batchId:`s${String(shardNumber).padStart(2,"0")}-b${String(batchNumber).padStart(6,"0")}`,shardNumber,rows:batchRows});
if(JSON.stringify(bodyBatches.map(batch=>batch.batchId))!==JSON.stringify(expectedStep8GV8006BodyBatchIds()))throw new Error("BODY_BATCH_LAYOUT_MISMATCH");
const routes=[];
for(const batch of bodyBatches){
  const result=await materializeStep8GV8006IncomingBodyBatch({batchId:batch.batchId,sourceEntries:batch.rows.map(({ordinal,rawJson})=>({ordinal,rawJson}))});
  if(!result.pass)throw new Error(`${batch.batchId}:${result.reason}`);
  routes.push(...result.batch.entries.map(entry=>({recipeId:entry.recipeId,corpusVersion:"v8006",shardNumber:batch.shardNumber,sourceCohortId:entry.sourceCohortId,bodySha256:entry.bodySha256,bodyBytes:entry.bodyBytes})));
}
if(routes.length!==STEP8G_V8006_EXPECTED_RECIPE_COUNT||new Set(routes.map(route=>route.recipeId)).size!==STEP8G_V8006_EXPECTED_RECIPE_COUNT)throw new Error("ROUTE_UNIVERSE_MISMATCH");
const frozenRouteHashes=STEP8G_V8006_RUNTIME_DESCRIPTOR.routeHashHexByShard.map(value=>value.match(/.{64}/g)||[]),routeBatchIds=[];
for(const shardNumber of [0,1]){
  const shardRoutes=routes.filter(route=>route.shardNumber===shardNumber).sort((a,b)=>a.recipeId.localeCompare(b.recipeId));
  for(const [batchNumber,entries] of chunk(shardRoutes,10).entries()){
    const batchId=`route-v8006-s${String(shardNumber).padStart(2,"0")}-b${String(batchNumber).padStart(6,"0")}`,expected=frozenRouteHashes[shardNumber]?.[batchNumber];
    if(!expected)throw new Error(`UNKNOWN_FROZEN_ROUTE_BATCH_${batchId}`);
    const observed=await sha256Hex(JSON.stringify({compositionVersion:"v8006",corpusVersion:"v8006",shardNumber,entries}));
    if(observed!==expected)throw new Error(`ROUTE_BATCH_FINGERPRINT_MISMATCH_${batchId}`);
    routeBatchIds.push(batchId);
  }
}
if(JSON.stringify(routeBatchIds)!==JSON.stringify(expectedStep8GV8006RouteBatchIds()))throw new Error("ROUTE_BATCH_LAYOUT_MISMATCH");
process.stdout.write(`${JSON.stringify({pass:true,sourceCommit:STEP8G_V8006_RUNTIME_DESCRIPTOR.sourceCommit,recipeCount:rows.length,bodyBatchCount:bodyBatches.length,routeBatchCount:routeBatchIds.length,shardRows:byShard.map(items=>items.length),bodyFingerprintsFrozen:true,routeFingerprintsFrozen:true,parentRouteCount:STEP8G_V8006_RUNTIME_DESCRIPTOR.parentCompositionRouteCount,composedRouteCount:STEP8G_V8006_RUNTIME_DESCRIPTOR.composedRouteCount,terminal:"STEP_8G_ORA_TURABI_V8006_LIVE_PAYLOAD_PARITY_PASS"},null,2)}\n`);
