import { clearSessionCookie, currentSessionAccount, jsonResponse } from "../../../src/server/auth-core.mjs";
import {
  STEP8G_V8003_EXPECTED_RECIPE_COUNT,
  STEP8G_V8003_EXPECTED_ROUTE_COUNT,
  STEP8G_V8003_LIVE_SHARD_SPECS,
  STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES,
  activateStep8GV8003Pointer,
  copyStep8GV8003ParentRoutes,
  ensureStep8GV8003ShardSchema,
  expectedStep8GV8003BodyBatchIds,
  expectedStep8GV8003RouteBatchIds,
  initializeStep8GV8003ControlSchema,
  materializeStep8GV8003IncomingBodyBatch,
  publicStep8GV8003BodyBatch,
  publicStep8GV8003RouteBatch,
  publicStep8GV8003Summary,
  readStep8GV8003BodyProgress,
  readStep8GV8003RouteProgress,
  rollbackStep8GV8003Pointer,
  writeStep8GV8003BodyBatch,
  writeStep8GV8003RouteBatch
} from "../../../src/server/step8g-v8003-live-runtime.mjs";
import { hydrateStep8GV8003ProtectedRecipesBounded } from "../../../src/server/step8g-v8003-hydration-runtime.mjs";
import { readStep8GPointer } from "../../../src/server/step8g-live-runtime.mjs";

const MAX_REQUEST_BYTES = 256 * 1024;
function rejectedSession(current) {
  const headers = current.reason === "NO_SESSION" ? {} : { "set-cookie": clearSessionCookie() };
  return jsonResponse({ ok:false, step:"8G-V8003", error:"UNAUTHORIZED", reason:current.reason || "SESSION_REJECTED", protectedDataReturned:false, shardQueries:0 }, 401, headers);
}
async function authorize(request, env) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) return { response: jsonResponse({ ok:false, step:"8G-V8003", error:"AUTH_NOT_CONFIGURED", protectedDataReturned:false, shardQueries:0 }, 503) };
  const current = await currentSessionAccount({ request, env });
  if (!current.pass) return { response: rejectedSession(current) };
  return { authD1Subqueries: 1 };
}
function boundShardDbs(env) { return [env?.CULINARY_RECIPE_SHARD_00_DB, env?.CULINARY_RECIPE_SHARD_01_DB]; }
function missingBindings(env) { return STEP8G_V8003_LIVE_SHARD_SPECS.filter(spec => !env?.[spec.bindingName]).map(spec => spec.bindingName); }
function metrics(d1Subqueries, shardQueries=0, controlQueries=0) { return { d1Subqueries, shardQueries, controlQueries, maxAllowedD1Subqueries:STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES, withinBudget:d1Subqueries <= STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES }; }
function requestTooLarge(request) { const raw=request.headers.get("content-length"); if(!raw) return false; const value=Number(raw); return Number.isFinite(value) && value>MAX_REQUEST_BYTES; }

export async function onRequestGet({ request, env }) {
  const authorized = await authorize(request, env); if (authorized.response) return authorized.response;
  const auth = authorized.authD1Subqueries; const url = new URL(request.url);
  if (url.searchParams.get("simulate") === "free-limit") return jsonResponse({ ok:false, step:"8G-V8003", error:"STEP8G_V8003_FREE_LIMIT_FAIL_CLOSED", simulated:true, protectedDataReturned:false, publicRuntimeChanged:false, fullCorpusScans:0, metrics:metrics(auth) }, 503);
  const missing = missingBindings(env); if (missing.length) return jsonResponse({ ok:false, step:"8G-V8003", error:"STEP8G_V8003_BINDINGS_NOT_CONFIGURED", missingBindings:missing, protectedDataReturned:false, metrics:metrics(auth) }, 503);
  const shardDbs = boundShardDbs(env); const action = url.searchParams.get("action") || "status";
  if (action === "status") return jsonResponse({ ok:true, step:"8G-V8003", action, phase:"LIVE_PROTECTED_LAYER_IMPLEMENTATION_READY", plan:publicStep8GV8003Summary(), bodyBatchIds:expectedStep8GV8003BodyBatchIds(), routeBatchIds:expectedStep8GV8003RouteBatchIds(), protectedDataReturned:false, publicRuntimeChanged:false, fullCorpusScans:0, metrics:metrics(auth) });
  if (action === "bindings") {
    const checks=[]; let q=0; for(let i=0;i<shardDbs.length;i++){const row=await shardDbs[i].prepare("SELECT 1 AS ok").first();q++;checks.push({shardNumber:i,ok:Number(row?.ok||0)===1});}
    const total=auth+q; const pass=checks.every(c=>c.ok)&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES; return jsonResponse({ok:pass,step:"8G-V8003",action,bindingVerification:checks,boundShardBindings:pass?2:0,protectedDataReturned:false,fullCorpusScans:0,metrics:metrics(total,q)},pass?200:503);
  }
  if (action === "body-batch") { const batch=publicStep8GV8003BodyBatch(url.searchParams.get("batchId")); return batch ? jsonResponse({ok:true,step:"8G-V8003",action,batch,protectedDataReturned:false,metrics:metrics(auth)}) : jsonResponse({ok:false,step:"8G-V8003",action,error:"UNKNOWN_BODY_BATCH_ID",protectedDataReturned:false,metrics:metrics(auth)},404); }
  if (action === "route-batch") { const batch=publicStep8GV8003RouteBatch(url.searchParams.get("batchId")); return batch ? jsonResponse({ok:true,step:"8G-V8003",action,batch,protectedDataReturned:false,metrics:metrics(auth)}) : jsonResponse({ok:false,step:"8G-V8003",action,error:"UNKNOWN_ROUTE_BATCH_ID",protectedDataReturned:false,metrics:metrics(auth)},404); }
  if (action === "progress") {
    const [body,routes,pointer]=await Promise.all([readStep8GV8003BodyProgress(shardDbs),readStep8GV8003RouteProgress(env.CULINARY_CONTROL_DB),readStep8GPointer(env.CULINARY_CONTROL_DB)]);
    const total=auth+body.d1Subqueries+routes.d1Subqueries+pointer.d1Subqueries; const pass=body.pass&&routes.pass&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8003",action,body,routes,pointer:{activeVersion:pointer.activeVersion,previousVersion:pointer.previousVersion,manifestSha256:pointer.manifestSha256},protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,body.d1Subqueries,routes.d1Subqueries+pointer.d1Subqueries)},pass?200:409);
  }
  if (action === "evidence") {
    const [body,routes,pointer]=await Promise.all([readStep8GV8003BodyProgress(shardDbs),readStep8GV8003RouteProgress(env.CULINARY_CONTROL_DB),readStep8GPointer(env.CULINARY_CONTROL_DB)]);
    const pointerStatePass=pointer.activeVersion==="v8003" || (pointer.activeVersion==="v8002" && pointer.previousVersion==="v8003");
    const total=auth+body.d1Subqueries+routes.d1Subqueries+pointer.d1Subqueries; const pass=body.completeVerified&&body.verifiedRowCount===STEP8G_V8003_EXPECTED_RECIPE_COUNT&&routes.completeVerified&&routes.totalRouteCount===STEP8G_V8003_EXPECTED_ROUTE_COUNT&&pointerStatePass&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES;
    return jsonResponse({ok:pass,step:"8G-V8003",action,exactLayerPass:body.completeVerified,exactCompositionRoutesPass:routes.completeVerified,composedRecipeCount:routes.completeVerified?routes.totalRouteCount:null,pointerStatePass,pointer:{activeVersion:pointer.activeVersion,previousVersion:pointer.previousVersion,manifestSha256:pointer.manifestSha256},bodyBatchesVerified:body.verifiedBatchCount,routeBatchesVerified:routes.verifiedBatchCount,fullCorpusScans:0,publicRuntimeChanged:false,recommendationAdmissionChanged:false,thirdShardUsed:false,billingExpansion:false,protectedDataReturned:false,metrics:metrics(total,body.d1Subqueries,routes.d1Subqueries+pointer.d1Subqueries)},pass?200:409);
  }
  return jsonResponse({ok:false,step:"8G-V8003",error:"UNKNOWN_ACTION",protectedDataReturned:false},400);
}

export async function onRequestPost({ request, env }) {
  const authorized=await authorize(request,env); if(authorized.response)return authorized.response; const auth=authorized.authD1Subqueries;
  const missing=missingBindings(env); if(missing.length)return jsonResponse({ok:false,step:"8G-V8003",error:"STEP8G_V8003_BINDINGS_NOT_CONFIGURED",missingBindings:missing,protectedDataReturned:false,metrics:metrics(auth)},503);
  if(requestTooLarge(request))return jsonResponse({ok:false,step:"8G-V8003",error:"REQUEST_TOO_LARGE",protectedDataReturned:false},413);
  let payload; try{payload=await request.json();}catch{return jsonResponse({ok:false,step:"8G-V8003",error:"INVALID_JSON",protectedDataReturned:false},400);} const action=String(payload?.action||""); const shardDbs=boundShardDbs(env);
  if(action==="initialize") { let sq=0; for(const db of shardDbs){const r=await ensureStep8GV8003ShardSchema(db);sq+=r.d1Subqueries;} const control=await initializeStep8GV8003ControlSchema(env.CULINARY_CONTROL_DB); const total=auth+sq+control.d1Subqueries; return jsonResponse({ok:total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES,step:"8G-V8003",action,protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,sq,control.d1Subqueries)},total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES?200:409); }
  if(action==="copy-parent-routes") { const r=await copyStep8GV8003ParentRoutes(env.CULINARY_CONTROL_DB); const total=auth+r.d1Subqueries; const pass=r.pass&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES; return jsonResponse({ok:pass,step:"8G-V8003",action,result:r,protectedDataReturned:false,publicRuntimeChanged:false,metrics:metrics(total,0,r.d1Subqueries)},pass?200:409); }
  if(action==="write-body") { const materialized=await materializeStep8GV8003IncomingBodyBatch(payload.batch||{}); if(!materialized.pass)return jsonResponse({ok:false,step:"8G-V8003",action,error:"STEP8G_V8003_BODY_BATCH_REJECTED",reason:materialized.reason,protectedDataReturned:false,metrics:metrics(auth)},400); const r=await writeStep8GV8003BodyBatch(shardDbs[materialized.batch.shardNumber],materialized.batch); const total=auth+r.d1Subqueries; const pass=r.pass&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES; return jsonResponse({ok:pass,step:"8G-V8003",action,batchId:materialized.batch.batchId,shardNumber:materialized.batch.shardNumber,result:r,routeEntries:materialized.batch.entries.map(e=>({recipeId:e.recipeId,corpusVersion:"v8003",shardNumber:materialized.batch.shardNumber,sourceCohortId:e.sourceCohortId,bodySha256:e.bodySha256,bodyBytes:e.bodyBytes})),protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,r.d1Subqueries)},pass?200:r.status==="WRITE_ERROR_UNKNOWN_COMMIT_STATE"?503:409); }
  if(action==="write-route") { const r=await writeStep8GV8003RouteBatch(env.CULINARY_CONTROL_DB,shardDbs,payload); const total=auth+r.d1Subqueries; const pass=r.pass&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES; return jsonResponse({ok:pass,step:"8G-V8003",action,batchId:String(payload.batchId||""),result:r,protectedDataReturned:false,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,0,r.d1Subqueries)},pass?200:r.status==="WRITE_ERROR_UNKNOWN_COMMIT_STATE"?503:409); }
  if(action==="activate") { const [body,routes]=await Promise.all([readStep8GV8003BodyProgress(shardDbs),readStep8GV8003RouteProgress(env.CULINARY_CONTROL_DB)]); if(!body.completeVerified||!routes.completeVerified)return jsonResponse({ok:false,step:"8G-V8003",action,error:"STEP8G_V8003_COMPOSITION_NOT_EXACTLY_VERIFIED",bodyComplete:body.completeVerified,routesComplete:routes.completeVerified,protectedDataReturned:false,publicRuntimeChanged:false,metrics:metrics(auth+body.d1Subqueries+routes.d1Subqueries)},409); const r=await activateStep8GV8003Pointer(env.CULINARY_CONTROL_DB); const total=auth+body.d1Subqueries+routes.d1Subqueries+r.d1Subqueries; const pass=r.pass&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES; return jsonResponse({ok:pass,step:"8G-V8003",action,result:r,protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:metrics(total)},pass?200:409); }
  if(action==="rollback") { const r=await rollbackStep8GV8003Pointer(env.CULINARY_CONTROL_DB); const total=auth+r.d1Subqueries; const pass=r.pass&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES; return jsonResponse({ok:pass,step:"8G-V8003",action,result:r,protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:metrics(total)},pass?200:409); }
  if(action==="hydrate") { const ids=Array.isArray(payload.recipeIds)?payload.recipeIds:[]; const r=await hydrateStep8GV8003ProtectedRecipesBounded(env.CULINARY_CONTROL_DB,shardDbs,ids); const total=auth+r.d1Subqueries; const pass=r.pass&&total<=STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES; return jsonResponse({ok:pass,step:"8G-V8003",action,result:r,protectedDataReturned:pass,publicRuntimeChanged:false,fullCorpusScans:0,metrics:metrics(total,r.shardQueries,r.routeQueries)},pass?200:409); }
  return jsonResponse({ok:false,step:"8G-V8003",error:"UNKNOWN_ACTION",protectedDataReturned:false},400);
}
