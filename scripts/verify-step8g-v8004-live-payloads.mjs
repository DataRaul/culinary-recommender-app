import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { recipeDatabaseShardForId } from "./corpus-scale-step7a-core.mjs";
import { STEP8G_V8004_RUNTIME_DESCRIPTOR } from "../data/generated/step8g/v8004-runtime-descriptor.mjs";
import {
  STEP8G_V8004_EXPECTED_RECIPE_COUNT,
  expectedStep8GV8004BodyBatchIds,
  expectedStep8GV8004RouteBatchIds,
  materializeStep8GV8004IncomingBodyBatch,
  publicStep8GV8004RouteBatch
} from "../src/server/step8g-v8004-live-runtime.mjs";
import { sha256Hex } from "../src/server/step8b-live.mjs";

const SOURCE_URL="https://archive.org/details/b21505524";
const SOURCE_DIR="collections/australian-table/recipes";
function parseArgs(argv){const out={candidate:null};for(const arg of argv)if(arg.startsWith("--candidate="))out.candidate=arg.slice(12);if(!out.candidate)throw new Error("--candidate=<checked-out source path> is required");return out;}
function commitAt(path){return execFileSync("git",["-C",path,"rev-parse","HEAD"],{encoding:"utf8"}).trim();}
function frontMatter(markdown){const match=/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(String(markdown??""));if(!match)return{};const meta={};for(const line of match[1].split(/\r?\n/)){const field=/^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);if(field)meta[field[1]]=field[2].trim().replace(/^(["'])(.*)\1$/,"$2");}return meta;}
function slug(fileName){return String(fileName).replace(/\.md$/i,"").normalize("NFKD").replace(/\p{M}+/gu,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
function chunk(values,size){const out=[];for(let offset=0;offset<values.length;offset+=size)out.push(values.slice(offset,offset+size));return out;}

const args=parseArgs(process.argv.slice(2));
const root=resolve(args.candidate);
if(commitAt(root)!==STEP8G_V8004_RUNTIME_DESCRIPTOR.sourceCommit)throw new Error("ORA_SOURCE_PIN_MISMATCH");
const dir=resolve(root,SOURCE_DIR);
const files=(await readdir(dir)).filter(file=>file.endsWith(".md")).sort();
const rows=[];
for(const fileName of files){const rawMarkdown=await readFile(resolve(dir,fileName),"utf8");if(frontMatter(rawMarkdown).source_url===SOURCE_URL){const ordinal=rows.length,recipeId=`ora_abbott_1864_${slug(fileName)}`;rows.push({ordinal,fileName,rawMarkdown,recipeId,shardNumber:recipeDatabaseShardForId(recipeId,2)});}}
if(rows.length!==STEP8G_V8004_EXPECTED_RECIPE_COUNT)throw new Error(`ORA_ABBOTT_EXPECTED_${STEP8G_V8004_EXPECTED_RECIPE_COUNT}_GOT_${rows.length}`);
if(new Set(rows.map(row=>row.recipeId)).size!==rows.length)throw new Error("SOURCE_RECIPE_ID_UNIVERSE_NOT_UNIQUE");
const byShard=[rows.filter(row=>row.shardNumber===0),rows.filter(row=>row.shardNumber===1)];
const bodyBatches=[];
for(const shardNumber of [0,1])for(const [batchNumber,batchRows] of chunk(byShard[shardNumber],10).entries())bodyBatches.push({batchId:`s${String(shardNumber).padStart(2,"0")}-b${String(batchNumber).padStart(6,"0")}`,shardNumber,rows:batchRows});
if(JSON.stringify(bodyBatches.map(batch=>batch.batchId))!==JSON.stringify(expectedStep8GV8004BodyBatchIds()))throw new Error("BODY_BATCH_LAYOUT_MISMATCH");
const routes=[];
for(const batch of bodyBatches){const result=await materializeStep8GV8004IncomingBodyBatch({batchId:batch.batchId,sourceEntries:batch.rows.map(({ordinal,fileName,rawMarkdown})=>({ordinal,fileName,rawMarkdown}))});if(!result.pass)throw new Error(`${batch.batchId}:${result.reason}`);routes.push(...result.batch.entries.map(entry=>({recipeId:entry.recipeId,corpusVersion:"v8004",shardNumber:batch.shardNumber,sourceCohortId:entry.sourceCohortId,bodySha256:entry.bodySha256,bodyBytes:entry.bodyBytes})));}
if(routes.length!==STEP8G_V8004_EXPECTED_RECIPE_COUNT||new Set(routes.map(route=>route.recipeId)).size!==STEP8G_V8004_EXPECTED_RECIPE_COUNT)throw new Error("ROUTE_UNIVERSE_MISMATCH");
const routeBatchIds=[];
for(const shardNumber of [0,1]){const shardRoutes=routes.filter(route=>route.shardNumber===shardNumber).sort((a,b)=>a.recipeId.localeCompare(b.recipeId));for(const [batchNumber,entries] of chunk(shardRoutes,10).entries()){const batchId=`route-v8004-s${String(shardNumber).padStart(2,"0")}-b${String(batchNumber).padStart(6,"0")}`;const expected=publicStep8GV8004RouteBatch(batchId);if(!expected)throw new Error(`UNKNOWN_EXPECTED_ROUTE_BATCH_${batchId}`);const observed=await sha256Hex(JSON.stringify({compositionVersion:"v8004",corpusVersion:"v8004",shardNumber,entries}));if(observed!==expected.expectedSha256)throw new Error(`ROUTE_BATCH_FINGERPRINT_MISMATCH_${batchId}`);routeBatchIds.push(batchId);}}
if(JSON.stringify(routeBatchIds)!==JSON.stringify(expectedStep8GV8004RouteBatchIds()))throw new Error("ROUTE_BATCH_LAYOUT_MISMATCH");
process.stdout.write(`${JSON.stringify({pass:true,sourceCommit:STEP8G_V8004_RUNTIME_DESCRIPTOR.sourceCommit,recipeCount:rows.length,bodyBatchCount:bodyBatches.length,routeBatchCount:routeBatchIds.length,shardRows:byShard.map(items=>items.length),terminal:"STEP_8G_ORA_ABBOTT_V8004_LIVE_PAYLOAD_PARITY_PASS"},null,2)}\n`);
