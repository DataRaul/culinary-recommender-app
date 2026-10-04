import { clearSessionCookie,currentSessionAccount,jsonResponse,normalizeInviteEmail } from "../../../src/server/auth-core.mjs";
import { hydrateStep8GV8018ProtectedRecipesBounded } from "../../../src/server/step8g-v8018-hydration-runtime.mjs";
import { projectProtectedPacketForDetail } from "../../../src/server/protected-corpus-search-v1.mjs";
import { executeOwnerSecondaryRollout,ownerSecondaryFeatureEnabled } from "../../../src/server/protected-corpus-limited-evidence-secondary-lane-owner-rollout-v1.mjs";
const STEP="V21-LIMITED-EVIDENCE-SECONDARY-FULL-OWNER-271";
const shardDbs=env=>[env?.CULINARY_RECIPE_SHARD_00_DB,env?.CULINARY_RECIPE_SHARD_01_DB];
const missingShards=env=>["CULINARY_RECIPE_SHARD_00_DB","CULINARY_RECIPE_SHARD_01_DB"].filter(name=>!env?.[name]);
function unauthorized(current){const headers=current?.reason==="NO_SESSION"?{}:{"set-cookie":clearSessionCookie()};return jsonResponse({ok:false,step:STEP,error:"UNAUTHORIZED",reason:current?.reason||"SESSION_REJECTED",protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:{d1Subqueries:0,rowsWritten:0}},401,headers);}
async function authorizeOwner(request,env){
  if(!env?.SESSION_SECRET||!env?.CULINARY_CONTROL_DB||!normalizeInviteEmail(env?.OWNER_BOOTSTRAP_EMAIL)) return {response:jsonResponse({ok:false,step:STEP,error:"OWNER_SECONDARY_AUTH_NOT_CONFIGURED",protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:{d1Subqueries:0,rowsWritten:0}},503)};
  const current=await currentSessionAccount({request,env});
  if(!current.pass) return {response:unauthorized(current)};
  if(normalizeInviteEmail(current.account?.email)!==normalizeInviteEmail(env.OWNER_BOOTSTRAP_EMAIL)) return {response:jsonResponse({ok:false,step:STEP,error:"OWNER_ONLY",protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:{d1Subqueries:1,rowsWritten:0}},403)};
  return {authD1Subqueries:1};
}
export async function onRequestPost({request,env}){
  const auth=await authorizeOwner(request,env);if(auth.response) return auth.response;
  const missing=missingShards(env);if(missing.length) return jsonResponse({ok:false,step:STEP,error:"SHARD_BINDINGS_NOT_CONFIGURED",missingBindings:missing,protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:{d1Subqueries:auth.authD1Subqueries,rowsWritten:0}},503);
  let payload;try{payload=await request.json();}catch{return jsonResponse({ok:false,step:STEP,error:"INVALID_JSON",protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,metrics:{d1Subqueries:auth.authD1Subqueries,rowsWritten:0}},400);}
  try{
    const result=await executeOwnerSecondaryRollout({request:payload,featureEnabled:ownerSecondaryFeatureEnabled(env),hydrateTopK:async ids=>{
      const hydrated=await hydrateStep8GV8018ProtectedRecipesBounded(env.CULINARY_CONTROL_DB,shardDbs(env),ids);
      if(!hydrated.pass) throw new Error("OWNER_SECONDARY_HYDRATION_FAILED__"+String(hydrated.reason||"UNKNOWN"));
      const routeById=new Map((hydrated.routes||[]).map(route=>[route.recipeId,route]));
      const packetById=new Map((hydrated.routes||[]).map((route,index)=>[route.recipeId,hydrated.packets?.[index]]));
      const results=ids.map(id=>{const route=routeById.get(id),packet=packetById.get(id);if(!route||!packet) throw new Error("OWNER_SECONDARY_ROUTE_PACKET_MISSING");const detail=projectProtectedPacketForDetail(packet,route);return {protectedRecipeId:id,title:detail.title,sourceProvenance:{sourceCohortId:detail.sourceCohortId,sourceWork:detail.sourceWork,sourceAuthor:detail.sourceAuthor,sourceYear:detail.sourceYear,sourceUrl:detail.sourceUrl,sourceLicense:detail.sourceLicense,attributionText:detail.attributionText}};});
      return {results,d1Subqueries:hydrated.d1Subqueries,fullCorpusScans:0,rowsWritten:0};
    }});
    const total=auth.authD1Subqueries+Number(result?.metrics?.d1Subqueries||0);if(total>8) throw new Error("OWNER_SECONDARY_TOTAL_D1_BUDGET");
    const status=result.pass?200:(result.reason==="OWNER_SECONDARY_FEATURE_DISABLED"?409:400);
    return jsonResponse({...result,ok:result.pass===true,step:STEP,protectedDataReturned:result.pass===true,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,protectedD1Writes:0,fullSecondaryLanePromoted:true,metrics:{...result.metrics,d1Subqueries:total}},status);
  }catch(error){return jsonResponse({ok:false,step:STEP,error:"OWNER_SECONDARY_FAILED",reason:String(error?.message||error).slice(0,240),protectedDataReturned:false,publicRuntimeChanged:false,recommendationAdmissionChanged:false,fullCorpusScans:0,protectedD1Writes:0,metrics:{d1Subqueries:auth.authD1Subqueries,rowsWritten:0}},409);}
}
