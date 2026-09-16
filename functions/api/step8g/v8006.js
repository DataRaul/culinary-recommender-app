import { clearSessionCookie, currentSessionAccount, jsonResponse } from "../../../src/server/auth-core.mjs";
import {
  STEP8G_V8006_EXPECTED_RECIPE_COUNT,
  STEP8G_V8006_EXPECTED_ROUTE_COUNT,
  STEP8G_V8006_LIVE_SHARD_SPECS,
  STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES,
  activateStep8GV8006Pointer,
  copyStep8GV8006ParentRoutes,
  ensureStep8GV8006ShardSchema,
  expectedStep8GV8006BodyBatchIds,
  expectedStep8GV8006RouteBatchIds,
  initializeStep8GV8006ControlSchema,
  materializeStep8GV8006IncomingBodyBatch,
  publicStep8GV8006BodyBatch,
  publicStep8GV8006RouteBatch,
  publicStep8GV8006Summary,
  readStep8GV8006BodyProgress,
  readStep8GV8006RouteProgress,
  rollbackStep8GV8006Pointer,
  writeStep8GV8006BodyBatch,
  writeStep8GV8006RouteBatch
} from "../../../src/server/step8g-v8006-live-runtime.mjs";
import { hydrateStep8GV8006ProtectedRecipesBounded } from "../../../src/server/step8g-v8006-hydration-runtime.mjs";
import { readStep8GPointer } from "../../../src/server/step8g-live-runtime.mjs";

const MAX_REQUEST_BYTES = 256 * 1024;
function rejectedSession(current) {
  const headers = current.reason === "NO_SESSION" ? {} : { "set-cookie": clearSessionCookie() };
  return jsonResponse({ ok:false, step:"8G-V8006", error:"UNAUTHORIZED", reason:current.reason||"SESSION_REJECTED", protectedDataReturned:false, shardQueries:0 }, 401, headers);
}
async function authorize(request, env) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) return { response: jsonResponse({ ok:false, step:"8G-V8006", error:"AUTH_NOT_CONFIGURED", protectedDataReturned:false, shardQueries:0 }, 503) };
  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return { response: rejectedSession(current) };
  return { authD1Subqueries: 1 };
}
function shardDbs(env) { return [env?.CULINARY_RECIPE_SHARD_00_DB, env?.CULINARY_RECIPE_SHARD_01_DB]; }
function missingBindings(env) { return STEP8G_V8006_LIVE_SHARD_SPECS.filter(spec => !env?.[spec.bindingName]).map(spec => spec.bindingName); }
function metrics(d1Subqueries, shardQueries=0, controlQueries=0) { return { d1Subqueries, shardQueries, controlQueries, maxAllowedD1Subqueries:STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES, withinBudget:d1Subqueries<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES }; }
function requestTooLarge(request) { const raw=request.headers.get("content-length"); if(!raw) return false; const value=Number(raw); return Number.isFinite(value)&&value>MAX_REQUEST_BYTES; }

export async function onRequestGet({ request, env }) {
  const authorized=await authorize(request,env); if(authorized.response) return authorized.response;
  const auth=authorized.authD1Subqueries,url=new URL(request.url);
  if(url.searchParams.get("simulate")==="free-limit") return jsonResponse({ok:false,step:"8G-V8006",error:"STEP8G_V8006_FREE_LIMIT_FAIL_CLOSED",simulated:true,protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(auth)},503);
  const missing=missingBindings(env);
  if(missing.length) return jsonResponse({ok:false,step:"8G-V8006",error:"STEP8G_V8006_BINDINGS_NOT_CONFIGURED",missingBindings:missing,protectedDataReturned:false,metrics:metrics(auth)},503);
  const dbs=shardDbs(env),action=url.searchParams.get("action")||"status";
  if(action==="status") return jsonResponse({ok:true,step:"8G-V8006",action,phase:"LIVE_PROTECTED_LAYER_IMPLEMENTATION_READY",plan:publicStep8GV8006Summary(),bodyBatchIds:expectedStep8GV8006BodyBatchIds(),routeBatchIds:expectedStep8GV8006RouteBatchIds(),protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(auth)});
  if(action==="bindings") {
    const checks=[]; let q=0;
    for(let i=0;i<dbs.length;i++){const row=await dbs[i].prepare("SELECT 1 AS ok").first();q++;checks.push({shardNumber:i,ok:Number(row?.ok||0)===1});}
    const total=auth+q,pass=checks.every(check=>check.ok)&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,bindingVerification:checks,boundShardBindings:pass?2:0,protectedDataReturned:false,fullCorpusScans:0,metrics:metrics(total,q)},pass?200:503);
  }
  if(action==="body-batch") { const batch=publicStep8GV8006BodyBatch(url.searchParams.get("batchId")); return batch?jsonResponse({ok:true,step:"8G-V8006",action,batch,protectedDataReturned:false,metrics:metrics(auth)}):jsonResponse({ok:false,step:"8G-V8006",action,error:"UNKNOWN_BODY_BATCH_ID",protectedDataReturned:false,metrics:metrics(auth)},404); }
  if(action==="route-batch") { const batch=publicStep8GV8006RouteBatch(url.searchParams.get("batchId")); return batch?jsonResponse({ok:true,step:"8G-V8006",action,batch,protectedDataReturned:false,metrics:metrics(auth)}):jsonResponse({ok:false,step:"8G-V8006",action,error:"UNKNOWN_ROUTE_BATCH_ID",protectedDataReturned:false,metrics:metrics(auth)},404); }
  if(action==="progress") {
    const [body,routes,pointer]=await Promise.all([readStep8GV8006BodyProgress(dbs),readStep8GV8006RouteProgress(env.CULINARY_CONTROL_DB),readStep8GPointer(env.CULINARY_CONTROL_DB)]);
    const total=auth+body.d1Subqueries+routes.d1Subqueries+pointer.d1Subqueries,pass=body.pass&&routes.pass&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,body,routes,pointer:{activeVersion:pointer.activeVersion,previousVersion:pointer.previousVersion,manifestSha256:pointer.manifestSha256},protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,body.d1Subqueries,routes.d1Subqueries+pointer.d1Subqueries)},pass?200:409);
  }
  if(action==="evidence") {
    const [body,routes,pointer]=await Promise.all([readStep8GV8006BodyProgress(dbs),readStep8GV8006RouteProgress(env.CULINARY_CONTROL_DB),readStep8GPointer(env.CULINARY_CONTROL_DB)]);
    const pointerStatePass=pointer.activeVersion==="v8006"||(pointer.activeVersion==="v8005"&&pointer.previousVersion==="v8006");
    const total=auth+body.d1Subqueries+routes.d1Subqueries+pointer.d1Subqueries;
    const pass=body.completeVerified&&body.verifiedRowCount===STEP8G_V8006_EXPECTED_RECIPE_COUNT&&routes.completeVerified&&routes.totalRouteCount===STEP8G_V8006_EXPECTED_ROUTE_COUNT&&pointerStatePass&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,exactLayerPass:body.completeVerified,exactCompositionRoutesPass:routes.completeVerified,composedRecipeCount:routes.completeVerified?routes.totalRouteCount:null,pointerStatePass,pointer:{activeVersion:pointer.activeVersion,previousVersion:pointer.previousVersion,manifestSha256:pointer.manifestSha256},bodyBatchesVerified:body.verifiedBatchCount,routeBatchesVerified:routes.verifiedBatchCount,fullCorpusScans:0,publicRuntimeChanged:false,recommendationAdmissionChanged:false,thirdShardUsed:false,billingExpansion:false,culturalAuthenticityAuthorityImported:false,protectedDataReturned:false,metrics:metrics(total,body.d1Subqueries,routes.d1Subqueries+pointer.d1Subqueries)},pass?200:409);
  }
  return jsonResponse({ok:false,step:"8G-V8006",error:"UNKNOWN_ACTION",protectedDataReturned:false},400);
}

export async function onRequestPost({ request, env }) {
  const authorized=await authorize(request,env); if(authorized.response) return authorized.response;
  const auth=authorized.authD1Subqueries,missing=missingBindings(env);
  if(missing.length) return jsonResponse({ok:false,step:"8G-V8006",error:"STEP8G_V8006_BINDINGS_NOT_CONFIGURED",missingBindings:missing,protectedDataReturned:false,metrics:metrics(auth)},503);
  if(requestTooLarge(request)) return jsonResponse({ok:false,step:"8G-V8006",error:"REQUEST_TOO_LARGE",protectedDataReturned:false},413);
  let payload; try{payload=await request.json();}catch{return jsonResponse({ok:false,step:"8G-V8006",error:"INVALID_JSON",protectedDataReturned:false},400);}
  const action=String(payload?.action||""),dbs=shardDbs(env);
  if(action==="initialize") {
    let shardQueries=0; for(const db of dbs){const result=await ensureStep8GV8006ShardSchema(db);shardQueries+=result.d1Subqueries;}
    const control=await initializeStep8GV8006ControlSchema(env.CULINARY_CONTROL_DB),total=auth+shardQueries+control.d1Subqueries,pass=total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,shardQueries,control.d1Subqueries)},pass?200:409);
  }
  if(action==="copy-parent-routes") {
    const result=await copyStep8GV8006ParentRoutes(env.CULINARY_CONTROL_DB),total=auth+result.d1Subqueries,pass=result.pass&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,result,protectedDataReturned:false,publicRuntimeChanged:false,metrics:metrics(total,0,result.d1Subqueries)},pass?200:409);
  }
  if(action==="write-body") {
    const materialized=await materializeStep8GV8006IncomingBodyBatch(payload.batch||{});
    if(!materialized.pass) return jsonResponse({ok:false,step:"8G-V8006",action,error:"STEP8G_V8006_BODY_BATCH_REJECTED",reason:materialized.reason,protectedDataReturned:false,metrics:metrics(auth)},400);
    const result=await writeStep8GV8006BodyBatch(dbs[materialized.batch.shardNumber],materialized.batch),total=auth+result.d1Subqueries,pass=result.pass&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,batchId:materialized.batch.batchId,shardNumber:materialized.batch.shardNumber,result,routeEntries:materialized.batch.entries.map(entry=>({recipeId:entry.recipeId,corpusVersion:"v8006",shardNumber:materialized.batch.shardNumber,sourceCohortId:entry.sourceCohortId,bodySha256:entry.bodySha256,bodyBytes:entry.bodyBytes})),protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,result.d1Subqueries)},pass?200:result.status==="WRITE_ERROR_UNKNOWN_COMMIT_STATE"?503:409);
  }
  if(action==="write-route") {
    const result=await writeStep8GV8006RouteBatch(env.CULINARY_CONTROL_DB,dbs,payload),total=auth+result.d1Subqueries,pass=result.pass&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,batchId:String(payload.batchId||""),result,protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,0,result.d1Subqueries)},pass?200:result.status==="WRITE_ERROR_UNKNOWN_COMMIT_STATE"?503:409);
  }
  if(action==="activate") {
    const [body,routes]=await Promise.all([readStep8GV8006BodyProgress(dbs),readStep8GV8006RouteProgress(env.CULINARY_CONTROL_DB)]);
    if(!body.completeVerified||!routes.completeVerified) return jsonResponse({ok:false,step:"8G-V8006",action,error:"STEP8G_V8006_COMPOSITION_NOT_EXACTLY_VERIFIED",bodyComplete:body.completeVerified,routesComplete:routes.completeVerified,protectedDataReturned:false,publicRuntimeChanged:false,metrics:metrics(auth+body.d1Subqueries+routes.d1Subqueries)},409);
    const result=await activateStep8GV8006Pointer(env.CULINARY_CONTROL_DB),total=auth+body.d1Subqueries+routes.d1Subqueries+result.d1Subqueries,pass=result.pass&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,result,protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:metrics(total)},pass?200:409);
  }
  if(action==="rollback") {
    const result=await rollbackStep8GV8006Pointer(env.CULINARY_CONTROL_DB),total=auth+result.d1Subqueries,pass=result.pass&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,result,protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:metrics(total)},pass?200:409);
  }
  if(action==="hydrate") {
    const ids=Array.isArray(payload.recipeIds)?payload.recipeIds:[],result=await hydrateStep8GV8006ProtectedRecipesBounded(env.CULINARY_CONTROL_DB,dbs,ids),total=auth+result.d1Subqueries,pass=result.pass&&total<=STEP8G_V8006_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8006",action,result,protectedDataReturned:pass,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,result.shardQueries,result.routeQueries)},pass?200:409);
  }
  return jsonResponse({ok:false,step:"8G-V8006",error:"UNKNOWN_ACTION",protectedDataReturned:false},400);
}
