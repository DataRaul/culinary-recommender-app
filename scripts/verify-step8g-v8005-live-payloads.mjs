import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { recipeDatabaseShardForId } from "./corpus-scale-step7a-core.mjs";
import { STEP8G_V8005_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8005-runtime-descriptor.mjs";
import { STEP8G_V8005_EXPECTED_RECIPE_COUNT, expectedStep8GV8005BodyBatchIds, expectedStep8GV8005RouteBatchIds, materializeStep8GV8005IncomingBodyBatch } from "../src/server/step8g-v8005-live-runtime.mjs";
import { sha256Hex } from "../src/server/step8b-live.mjs";

const SOURCE_COLLECTION="japanese-kitchen",SOURCE_TITLE="Chinese-Japanese Cook Book",SOURCE_AUTHOR="Sara Bosse & Onoto Watanna",SOURCE_YEAR="1914",SOURCE_URL="https://archive.org/details/chinesejapanesec00boss_0";
function parseArgs(argv){const out={candidate:null};for(const arg of argv)if(arg.startsWith("--candidate="))out.candidate=arg.slice(12);if(!out.candidate)throw new Error("--candidate=<checked-out source path> is required");return out;}
function commitAt(path){return execFileSync("git",["-C",path,"rev-parse","HEAD"],{encoding:"utf8"}).trim();}
function frontMatter(markdown){const match=/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(String(markdown??""));if(!match)return{};const meta={};for(const line of match[1].split(/\r?\n/)){const field=/^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);if(field)meta[field[1]]=field[2].trim().replace(/^(["'])(.*)\1$/,"$2");}return meta;}
function exact(meta){return meta.collection===SOURCE_COLLECTION&&meta.source_title===SOURCE_TITLE&&meta.author===SOURCE_AUTHOR&&meta.source_year===SOURCE_YEAR&&meta.source_url===SOURCE_URL&&meta.license==="public-domain";}
function slug(fileName){return String(fileName).replace(/\.md$/i,"").normalize("NFKD").replace(/\p{M}+/gu,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
function chunk(values,size){const out=[];for(let offset=0;offset<values.length;offset+=size)out.push(values.slice(offset,offset+size));return out;}

const args=parseArgs(process.argv.slice(2)),root=resolve(args.candidate);
if(commitAt(root)!==STEP8G_V8005_RUNTIME_DESCRIPTOR.sourceCommit)throw new Error("ORA_SOURCE_PIN_MISMATCH");
const dir=resolve(root,`collections/${SOURCE_COLLECTION}/recipes`),files=(await readdir(dir)).filter(file=>file.endsWith(".md")).sort(),rows=[];
for(const fileName of files){const rawMarkdown=await readFile(resolve(dir,fileName),"utf8");if(exact(frontMatter(rawMarkdown))){const ordinal=rows.length,recipeId=`ora_bosse_watanna_1914_${slug(fileName)}`;rows.push({ordinal,fileName,rawMarkdown,recipeId,shardNumber:recipeDatabaseShardForId(recipeId,2)});}}
if(rows.length!==STEP8G_V8005_EXPECTED_RECIPE_COUNT)throw new Error(`BOSSE_WATANNA_EXPECTED_${STEP8G_V8005_EXPECTED_RECIPE_COUNT}_GOT_${rows.length}`);
if(new Set(rows.map(row=>row.recipeId)).size!==rows.length)throw new Error("SOURCE_RECIPE_ID_UNIVERSE_NOT_UNIQUE");
const byShard=[rows.filter(row=>row.shardNumber===0),rows.filter(row=>row.shardNumber===1)],bodyBatches=[];
for(const shardNumber of [0,1])for(const [batchNumber,batchRows] of chunk(byShard[shardNumber],10).entries())bodyBatches.push({batchId:`s${String(shardNumber).padStart(2,"0")}-b${String(batchNumber).padStart(6,"0")}`,shardNumber,rows:batchRows});
if(JSON.stringify(bodyBatches.map(batch=>batch.batchId))!==JSON.stringify(expectedStep8GV8005BodyBatchIds()))throw new Error("BODY_BATCH_LAYOUT_MISMATCH");
const routes=[];for(const batch of bodyBatches){const result=await materializeStep8GV8005IncomingBodyBatch({batchId:batch.batchId,sourceEntries:batch.rows.map(({ordinal,fileName,rawMarkdown})=>({ordinal,fileName,rawMarkdown}))});if(!result.pass)throw new Error(`${batch.batchId}:${result.reason}`);routes.push(...result.batch.entries.map(entry=>({recipeId:entry.recipeId,corpusVersion:"v8005",shardNumber:batch.shardNumber,sourceCohortId:entry.sourceCohortId,bodySha256:entry.bodySha256,bodyBytes:entry.bodyBytes})));}
if(routes.length!==STEP8G_V8005_EXPECTED_RECIPE_COUNT||new Set(routes.map(route=>route.recipeId)).size!==STEP8G_V8005_EXPECTED_RECIPE_COUNT)throw new Error("ROUTE_UNIVERSE_MISMATCH");
const frozenRouteHashes=STEP8G_V8005_RUNTIME_DESCRIPTOR.routeHashHexByShard.map(value=>value.match(/.{64}/g)||[]),routeBatchIds=[];
for(const shardNumber of [0,1]){const shardRoutes=routes.filter(route=>route.shardNumber===shardNumber).sort((a,b)=>a.recipeId.localeCompare(b.recipeId));for(const [batchNumber,entries] of chunk(shardRoutes,10).entries()){const batchId=`route-v8005-s${String(shardNumber).padStart(2,"0")}-b${String(batchNumber).padStart(6,"0")}`,expected=frozenRouteHashes[shardNumber]?.[batchNumber];if(!expected)throw new Error(`UNKNOWN_FROZEN_ROUTE_BATCH_${batchId}`);const observed=await sha256Hex(JSON.stringify({compositionVersion:"v8005",corpusVersion:"v8005",shardNumber,entries}));if(observed!==expected)throw new Error(`ROUTE_BATCH_FINGERPRINT_MISMATCH_${batchId}`);routeBatchIds.push(batchId);}}
if(JSON.stringify(routeBatchIds)!==JSON.stringify(expectedStep8GV8005RouteBatchIds()))throw new Error("ROUTE_BATCH_LAYOUT_MISMATCH");
process.stdout.write(`${JSON.stringify({pass:true,sourceCommit:STEP8G_V8005_RUNTIME_DESCRIPTOR.sourceCommit,recipeCount:rows.length,bodyBatchCount:bodyBatches.length,routeBatchCount:routeBatchIds.length,shardRows:byShard.map(items=>items.length),bodyFingerprintsFrozen:true,routeFingerprintsFrozen:true,terminal:"STEP_8G_ORA_BOSSE_WATANNA_V8005_LIVE_PAYLOAD_PARITY_PASS"},null,2)}\n`);
