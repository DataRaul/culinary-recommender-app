import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createYoutubeApiPacer, classifyYoutubeSearchQuotaFailure } from "./run-youtube-culinary-adaptive-discovery.mjs";
import { getYoutubeQuotaDate } from "./youtube-culinary-daily-control-plane.mjs";
import {
  addCandidatePointers,
  buildBarbecueQueryPortfolio,
  createDurableCandidatePointer,
  createInitialBarbecueState,
  loadBarbecueConfig,
  pendingCandidateCount,
  selectBarbecueDailyQueries,
  validateBarbecueConfig,
  validateBarbecueState
} from "./barbecue-technique-corpus-control-plane.mjs";

const SEARCH_ENDPOINT="https://www.googleapis.com/youtube/v3/search";
const STATE_PATH=process.env.YT_BBQ_STATE_PATH || "data/generated/barbecue-technique-corpus-state.json";
const API_KEY_NAME="CULINARY_YOUTUBE_API_KEY";
const PROJECT_IDENTITY=process.env.CULINARY_YOUTUBE_PROJECT_IDENTITY || "culinary-youtube-discovery";
const DAILY_LIMIT=Number(process.env.CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT || 100);
const DRY_RUN=/^(1|true|yes)$/i.test(process.env.YT_BBQ_DRY_RUN || "false");
const THIS_DIR=dirname(fileURLToPath(import.meta.url));
const REPO_ROOT=join(THIS_DIR,"..");

function noBlueLagoon(value) {
  if (!value || /blue[ _-]*lagoon|music/i.test(value)) throw new Error("Culinary project identity is missing or violates Blue Lagoon isolation");
}

async function loadState(config) {
  try {
    return validateBarbecueState(JSON.parse(await readFile(join(REPO_ROOT,STATE_PATH),"utf8")),config);
  } catch (error) {
    if (error.code==="ENOENT") return createInitialBarbecueState(config);
    throw error;
  }
}

async function saveState(state,config) {
  validateBarbecueState(state,config);
  const path=join(REPO_ROOT,STATE_PATH);
  await mkdir(dirname(path),{recursive:true});
  await writeFile(path,`${JSON.stringify(state,null,2)}\n`,"utf8");
}

function policyFresh(date,maxAgeDays,now) {
  const ms=Date.parse(`${date}T12:00:00Z`);
  return Number.isFinite(ms) && now.getTime()>=ms-86400000 && now.getTime()-ms<=maxAgeDays*86400000;
}

function requestFor(query,apiKey) {
  const url=new URL(SEARCH_ENDPOINT);
  url.search=new URLSearchParams({part:"snippet",type:"video",maxResults:"10",safeSearch:"strict",q:query.queryText}).toString();
  return {url:url.toString(),init:{method:"GET",headers:{Accept:"application/json","X-Goog-Api-Key":apiKey},signal:AbortSignal.timeout(15000)}};
}

async function fetchSearch(fetchImpl,request,beforeYoutubeRequest) {
  await beforeYoutubeRequest();
  const response=await fetchImpl(request.url,request.init);
  let payload;
  try { payload=await response.json(); } catch { throw new Error(`search.list returned non-JSON HTTP ${response.status}`); }
  if (!response.ok) {
    const retryRaw=response.headers?.get?.("retry-after") ?? null;
    const safe={endpoint:"search.list",httpStatus:response.status,apiStatus:payload?.error?.status ?? null,apiReason:payload?.error?.errors?.[0]?.reason ?? null,retryAfterSeconds:/^\d+$/.test(String(retryRaw ?? ""))?Number(retryRaw):null};
    const error=new Error(`search.list failed: ${JSON.stringify(safe)}`);
    error.youtubeApiFailure=safe;
    throw error;
  }
  return payload;
}

function mapHold(classified) {
  if (classified.terminalState==="DAILY_SEARCH_HOLD_RATE_LIMIT") return "BARBECUE_SEARCH_HOLD_RATE_LIMIT";
  if (classified.terminalState==="DAILY_SEARCH_HOLD_POLICY_OR_QUOTA") return "BARBECUE_SEARCH_HOLD_POLICY_OR_QUOTA";
  if (classified.terminalState==="DAILY_DISCOVERY_PROVIDER_QUOTA_EXHAUSTED_SAFE_CLOSE") return "BARBECUE_PROVIDER_QUOTA_EXHAUSTED_SAFE_CLOSE";
  return "BARBECUE_SEARCH_HOLD_PROVIDER_OTHER";
}

export async function runBarbecueDiscovery({fetchImpl=fetch,now=new Date()}={}) {
  noBlueLagoon(PROJECT_IDENTITY);
  const config=validateBarbecueConfig(await loadBarbecueConfig(join(REPO_ROOT,"config/barbecue_technique_corpus_v1.json")));
  if (DAILY_LIMIT!==config.assignedDailySearchLimit) throw new Error("assigned Search limit does not match barbecue contract");
  let state=await loadState(config);
  const quotaDate=getYoutubeQuotaDate(now);
  if (state.pilotPass) return {result:"BARBECUE_TECHNIQUE_CORPUS_PILOT_PASS",quotaDate,dryRun:DRY_RUN,searchCallsExecuted:0,candidatePointersAdded:0};
  if (state.hardHold) return {result:state.hardHold,quotaDate,dryRun:DRY_RUN,searchCallsExecuted:0,candidatePointersAdded:0};
  if (!policyFresh(config.policyRecheckedAt,config.policyMaxAgeDays,now)) {
    state.hardHold="BARBECUE_SEARCH_HOLD_POLICY_OR_QUOTA";
    state.programmeStatus=state.hardHold;
    if (!DRY_RUN) await saveState(state,config);
    return {result:state.hardHold,quotaDate,dryRun:DRY_RUN,searchCallsExecuted:0,candidatePointersAdded:0};
  }
  if (state.lastCompletedQuotaDate===quotaDate) return {result:"BARBECUE_DAILY_ALREADY_COMPLETED",quotaDate,dryRun:DRY_RUN,searchCallsExecuted:0,candidatePointersAdded:0};
  if (pendingCandidateCount(state)>=config.candidateBacklogCap) {
    state.hardHold="BARBECUE_REVIEW_BACKLOG";
    state.programmeStatus=state.hardHold;
    if (!DRY_RUN) await saveState(state,config);
    return {result:state.hardHold,quotaDate,dryRun:DRY_RUN,searchCallsExecuted:0,candidatePointersAdded:0};
  }

  const queries=selectBarbecueDailyQueries(config,state,[]);
  if (DRY_RUN) return {result:"BARBECUE_DRY_RUN_PASS",quotaDate,dryRun:true,plannedSearchCalls:queries.length,queryClasses:[...new Set(queries.map(row=>row.queryClass))],searchCallsExecuted:0,candidatePointersAdded:0};

  const apiKey=process.env[API_KEY_NAME];
  if (!apiKey) throw new Error(`${API_KEY_NAME} is required for live barbecue discovery`);
  const beforeYoutubeRequest=createYoutubeApiPacer({minIntervalMs:config.minYoutubeRequestIntervalMs});
  let searchCallsExecuted=0;
  let candidatePointersAdded=0;
  const dailyPointers=[];
  let terminalState="BARBECUE_DAILY_DISCOVERY_CONTINUE";
  let providerFailure=null;

  for (const query of queries) {
    try {
      const payload=await fetchSearch(fetchImpl,requestFor(query,apiKey),beforeYoutubeRequest);
      searchCallsExecuted+=1;
      let retainedForQuery=0;
      for (const item of payload?.items ?? []) {
        const pointer=createDurableCandidatePointer(item,query,quotaDate);
        if (!pointer) continue;
        dailyPointers.push(pointer);
        retainedForQuery+=1;
        if (retainedForQuery>=3) break;
      }
    } catch (error) {
      searchCallsExecuted+=1;
      const classified=classifyYoutubeSearchQuotaFailure(error,{searchCallsUsed:searchCallsExecuted,searchCapacity:config.routineProviderSearchCapacity});
      if (!classified) throw error;
      terminalState=mapHold(classified);
      providerFailure={failureClass:classified.failureClass,httpStatus:classified.httpStatus,apiStatus:classified.apiStatus,apiReason:classified.apiReason,retryAfterSeconds:classified.retryAfterSeconds ?? null};
      if (!terminalState.includes("SAFE_CLOSE")) state.hardHold=terminalState;
      break;
    }
  }

  const beforeCount=state.leaves.reduce((sum,leaf)=>sum+leaf.candidatePointers.length,0);
  state=addCandidatePointers(state,config,dailyPointers);
  const afterCount=state.leaves.reduce((sum,leaf)=>sum+leaf.candidatePointers.length,0);
  candidatePointersAdded=afterCount-beforeCount;
  state.completedQuotaDays.push({quotaDate,completedAt:now.toISOString(),searchCalls:searchCallsExecuted,candidatePointersAdded,terminalState,providerFailure});
  state.lastCompletedQuotaDate=quotaDate;
  state.programmeStatus=state.hardHold ?? "ACTIVE_BOUNDED_DISCOVERY";
  await saveState(state,config);
  return {
    result:terminalState,quotaDate,dryRun:false,searchCallsExecuted,candidatePointersAdded,
    pendingCandidateBacklog:pendingCandidateCount(state),rawYoutubeApiDataDurable:false,
    automaticPublicationAuthorized:false,automaticAppAdmissionAuthorized:false,automaticKnowledgeCorePromotionAuthorized:false
  };
}

const isMain=process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1];
if (isMain) {
  runBarbecueDiscovery().then(summary=>console.log(JSON.stringify(summary))).catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
}
