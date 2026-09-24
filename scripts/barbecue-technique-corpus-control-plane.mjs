import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { assertPolicySafeDurableObject } from "./youtube-culinary-discovery-control-plane.mjs";

export const BARBECUE_PROGRAMME_ID = "BARBECUE_TECHNIQUE_CORPUS_V1";
export const BARBECUE_WORKFLOW_PATH = ".github/workflows/barbecue-technique-corpus-daily.yml";
export const BARBECUE_STATE_SCHEMA = "barbecue-technique-corpus-state-v1";
export const BARBECUE_WORK_UNIT_SCHEMA = "barbecue-technique-corpus-work-unit-state-v1";

const REQUIRED_PRODUCTS = new Set(["poultry","beef","pork","fish_seafood","vegetables"]);
const ALLOWED_QUERY_CLASSES = new Set(["WORLD_CHAMPION_DISCOVERY","COMPETITION_CHAMPION_DISCOVERY","SPECIALIST_FALLBACK_DISCOVERY"]);
const FORBIDDEN_SCOPE_RE = /underground|earth[ _-]*oven|buried|ash[ _-]*buried|ember[ _-]*buried|fire[ _-]*pit|campfire|open[ _-]*hearth/i;
const FORBIDDEN_REVIEW_KEYS = new Set(["transcript","recipeProse","creatorInstructions","image","images","audio","video","rawPayload","rawYoutubePayload"]);
const hash = value => createHash("sha256").update(String(value)).digest("hex");
const clone = value => structuredClone(value);

export async function loadBarbecueConfig(path = "config/barbecue_technique_corpus_v1.json") {
  return JSON.parse(await readFile(path, "utf8"));
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function assertNoForbiddenKeys(value, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((entry,index)=>assertNoForbiddenKeys(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key,nested] of Object.entries(value)) {
    if (FORBIDDEN_REVIEW_KEYS.has(key)) throw new Error(`forbidden durable review field at ${path}.${key}`);
    assertNoForbiddenKeys(nested, `${path}.${key}`);
  }
}

export function validateBarbecueConfig(config) {
  if (!config || typeof config !== "object") throw new Error("barbecue config is required");
  if (config.programmeId !== BARBECUE_PROGRAMME_ID) throw new Error("invalid barbecue programme id");
  if (config.activationState !== "BARBECUE_TECHNIQUE_CORPUS_ACTIVATION_READY") throw new Error("barbecue activation is not ready");
  if (config.assignedDailySearchLimit !== 100) throw new Error("barbecue pilot is armed only for assigned Search limit 100/day");
  if (!Number.isInteger(config.protectedReserveCalls) || config.protectedReserveCalls < 5) throw new Error("protected reserve must be >=5");
  if (!Number.isInteger(config.dailySearchBudget) || config.dailySearchBudget < 1 || config.dailySearchBudget > 32) throw new Error("daily Search budget must be 1..32 for the pilot");
  if (!Number.isInteger(config.routineProviderSearchCapacity) || config.routineProviderSearchCapacity < config.dailySearchBudget || config.routineProviderSearchCapacity > config.assignedDailySearchLimit - config.protectedReserveCalls) throw new Error("routine provider Search capacity must cover the pilot budget while preserving the protected reserve");
  if (config.dailySearchBudget > config.assignedDailySearchLimit - config.protectedReserveCalls) throw new Error("daily Search budget violates protected reserve");
  if (!Number.isFinite(config.minYoutubeRequestIntervalMs) || config.minYoutubeRequestIntervalMs < 1000) throw new Error("provider pacing must be at least 1000 ms");
  if (!Array.isArray(config.pilotLeaves) || config.pilotLeaves.length !== 5) throw new Error("pilot must freeze exactly five leaves");
  const products = new Set(config.pilotLeaves.map(row=>row.product));
  if ([...REQUIRED_PRODUCTS].some(product=>!products.has(product))) throw new Error("pilot leaves must cover poultry, beef, pork, fish/seafood and vegetables");
  if (new Set(config.pilotLeaves.map(row=>row.tradition)).size < 2) throw new Error("pilot must include at least two materially different traditions");
  const leafIds = new Set();
  for (const leaf of config.pilotLeaves) {
    if (!nonEmpty(leaf.leafId) || leafIds.has(leaf.leafId)) throw new Error("pilot leaf ids must be unique non-empty strings");
    leafIds.add(leaf.leafId);
    const boundaryText = [leaf.product,leaf.cutForm,leaf.tradition,leaf.method,leaf.equipmentBoundary].join(" ");
    if (FORBIDDEN_SCOPE_RE.test(boundaryText)) throw new Error(`pilot leaf ${leaf.leafId} crosses excluded fire-cooking scope`);
    if (!nonEmpty(leaf.searchTerm)) throw new Error(`pilot leaf ${leaf.leafId} requires searchTerm`);
  }
  if (config.requiredQualifiedIndependentSourcesPerLeaf !== 5) throw new Error("each completed leaf must require five qualified independent sources");
  if (!Array.isArray(config.queryClassOrder) || config.queryClassOrder.some(x=>!ALLOWED_QUERY_CLASSES.has(x))) throw new Error("invalid query class order");
  if (config.queryClassOrder[0] !== "WORLD_CHAMPION_DISCOVERY") throw new Error("world-champion discovery must be first");
  if (!Array.isArray(config.adjustmentAxes) || config.adjustmentAxes.length < 8) throw new Error("adjustment axes are incomplete");
  if (!config.authority || Object.values(config.authority).some(value=>value !== false)) throw new Error("barbecue authority flags must remain false");
  return config;
}

export function createInitialBarbecueState(config) {
  validateBarbecueConfig(config);
  const state = {
    schemaVersion: BARBECUE_STATE_SCHEMA,
    programmeId: BARBECUE_PROGRAMME_ID,
    programmeStatus: "ACTIVE_BOUNDED_DISCOVERY",
    activationState: config.activationState,
    queryVintage: config.queryVintage,
    policyRecheckedAt: config.policyRecheckedAt,
    assignedDailySearchLimit: config.assignedDailySearchLimit,
    protectedReserveCalls: config.protectedReserveCalls,
    dailySearchBudget: config.dailySearchBudget,
    minYoutubeRequestIntervalMs: config.minYoutubeRequestIntervalMs,
    candidateBacklogCap: config.candidateBacklogCap,
    maxCandidatesPerLeaf: config.maxCandidatesPerLeaf,
    lastCompletedQuotaDate: null,
    completedQuotaDays: [],
    hardHold: null,
    pilotPass: false,
    leaves: config.pilotLeaves.map(leaf=>({
      leafId: leaf.leafId,
      product: leaf.product,
      cutForm: leaf.cutForm,
      tradition: leaf.tradition,
      method: leaf.method,
      status: "DISCOVERY_PENDING",
      championshipSearchExhausted: false,
      candidatePointers: [],
      qualifiedSources: [],
      synthesis: null
    })),
    authority: clone(config.authority)
  };
  return validateBarbecueState(state, config);
}

export function validateBarbecueState(state, config) {
  validateBarbecueConfig(config);
  if (!state || typeof state !== "object" || state.schemaVersion !== BARBECUE_STATE_SCHEMA) throw new Error("invalid barbecue state");
  if (state.programmeId !== BARBECUE_PROGRAMME_ID) throw new Error("barbecue state programme mismatch");
  if (!Array.isArray(state.leaves) || state.leaves.length !== config.pilotLeaves.length) throw new Error("barbecue state leaf count mismatch");
  if (state.authority?.automaticPublicationAuthorized !== false || state.authority?.automaticAppAdmissionAuthorized !== false || state.authority?.automaticKnowledgeCorePromotionAuthorized !== false || state.authority?.paidQuotaAuthorized !== false || state.authority?.secondProjectAuthorized !== false) throw new Error("barbecue state authority widened");
  assertNoForbiddenKeys(state);
  assertPolicySafeDurableObject(state);
  return state;
}

function fillTemplate(template, term) {
  return template.replaceAll("{term}", term).replace(/\s+/g," ").trim();
}

export function buildBarbecueQueryPortfolio(config, state) {
  validateBarbecueState(state, config);
  const out=[];
  for (const leaf of state.leaves) {
    if (leaf.status === "COMPLETE") continue;
    const spec=config.pilotLeaves.find(row=>row.leafId===leaf.leafId);
    const templates=leaf.championshipSearchExhausted ? config.specialistFallbackTemplates : config.worldChampionTemplates;
    for (const row of templates) {
      out.push({
        queryId:`bbq-${hash(`${leaf.leafId}|${row.queryClass}|${row.template}`).slice(0,18)}`,
        leafId:leaf.leafId,
        queryClass:row.queryClass,
        queryText:fillTemplate(row.template,spec.searchTerm),
        resourceType:"video"
      });
    }
    if (!leaf.championshipSearchExhausted) {
      for (const text of spec.localizedChampionQueries ?? []) {
        out.push({
          queryId:`bbq-${hash(`${leaf.leafId}|localized|${text}`).slice(0,18)}`,
          leafId:leaf.leafId,
          queryClass:"COMPETITION_CHAMPION_DISCOVERY",
          queryText:text,
          resourceType:"video"
        });
      }
    }
  }
  return out;
}

export function selectBarbecueDailyQueries(config, state, usedQueryIds = []) {
  const used=new Set(usedQueryIds);
  const portfolio=buildBarbecueQueryPortfolio(config,state).filter(row=>!used.has(row.queryId));
  const byLeaf=new Map();
  for (const row of portfolio) {
    if (!byLeaf.has(row.leafId)) byLeaf.set(row.leafId,[]);
    byLeaf.get(row.leafId).push(row);
  }
  const selected=[];
  while (selected.length < config.dailySearchBudget) {
    let advanced=false;
    for (const leaf of state.leaves) {
      const queue=byLeaf.get(leaf.leafId) ?? [];
      if (queue.length && selected.length < config.dailySearchBudget) {
        selected.push(queue.shift());
        advanced=true;
      }
    }
    if (!advanced) break;
  }
  return selected;
}

export function createDurableCandidatePointer(rawItem, query, quotaDate) {
  const youtubeVideoRef=rawItem?.id?.videoId;
  const creatorChannelRef=rawItem?.snippet?.channelId;
  if (!nonEmpty(youtubeVideoRef) || !nonEmpty(creatorChannelRef)) return null;
  const pointer={
    sourceRef:`youtube:${youtubeVideoRef}`,
    youtubeVideoRef,
    canonicalReference:`https://www.youtube.com/watch?v=${youtubeVideoRef}`,
    creatorChannelRef,
    leafId:query.leafId,
    queryClass:query.queryClass,
    discoveredQuotaDate:quotaDate,
    qualificationStatus:"PENDING_REVIEW",
    automaticQualificationAuthorized:false
  };
  assertNoForbiddenKeys(pointer);
  return pointer;
}

export function addCandidatePointers(state, config, pointers) {
  const next=clone(state);
  for (const pointer of pointers.filter(Boolean)) {
    const leaf=next.leaves.find(row=>row.leafId===pointer.leafId);
    if (!leaf || leaf.status==="COMPLETE") continue;
    if (leaf.candidatePointers.some(row=>row.sourceRef===pointer.sourceRef)) continue;
    if (leaf.candidatePointers.length >= config.maxCandidatesPerLeaf) continue;
    leaf.candidatePointers.push(clone(pointer));
    if (leaf.candidatePointers.length) leaf.status="REVIEW_PENDING";
  }
  return validateBarbecueState(next,config);
}

export function applySourceQualification(state, config, leafId, sourceRef, review) {
  const next=clone(state);
  const leaf=next.leaves.find(row=>row.leafId===leafId);
  if (!leaf) throw new Error("unknown barbecue leaf");
  const pointer=leaf.candidatePointers.find(row=>row.sourceRef===sourceRef);
  if (!pointer) throw new Error("candidate pointer not found");
  assertNoForbiddenKeys(review);
  if (!nonEmpty(review?.independenceKey)) throw new Error("qualification review requires independenceKey");
  if (!nonEmpty(review?.projectAuthoredRationale)) throw new Error("qualification review requires project-authored rationale");
  const evidenceRef=review?.credentialEvidenceRef ?? review?.domainCompetenceEvidenceRef ?? null;
  if (!nonEmpty(evidenceRef)) throw new Error("title wording alone cannot qualify a source; independent credential/domain evidence is required");
  if (leaf.qualifiedSources.some(row=>row.independenceKey===review.independenceKey)) throw new Error("qualified source independence key already used for this leaf");
  leaf.qualifiedSources.push({
    sourceRef:pointer.sourceRef,
    canonicalReference:pointer.canonicalReference,
    creatorChannelRef:pointer.creatorChannelRef,
    queryClass:pointer.queryClass,
    independenceKey:review.independenceKey,
    qualificationEvidenceRef:evidenceRef,
    projectAuthoredRationale:review.projectAuthoredRationale,
    normalizedObservations:clone(review.normalizedObservations ?? {})
  });
  pointer.qualificationStatus="QUALIFIED";
  return validateBarbecueState(next,config);
}

export function setLeafSynthesis(state, config, leafId, synthesis) {
  const next=clone(state);
  const leaf=next.leaves.find(row=>row.leafId===leafId);
  if (!leaf) throw new Error("unknown barbecue leaf");
  assertNoForbiddenKeys(synthesis);
  if (synthesis?.projectAuthored !== true) throw new Error("leaf synthesis must be project-authored");
  if (!Array.isArray(synthesis?.safetyAuthorityRefs) || synthesis.safetyAuthorityRefs.length < 1) throw new Error("leaf synthesis requires separate safety-authority references");
  if (!synthesis?.adjustmentAxes || typeof synthesis.adjustmentAxes !== "object") throw new Error("leaf synthesis requires structured adjustment axes");
  leaf.synthesis=clone(synthesis);
  leaf.status=evaluateLeafCompletion(leaf,config) ? "COMPLETE" : "SYNTHESIS_HOLD";
  next.pilotPass=evaluatePilotPass(next,config);
  if (next.pilotPass) next.programmeStatus="BARBECUE_TECHNIQUE_CORPUS_PILOT_PASS";
  return validateBarbecueState(next,config);
}

export function evaluateLeafCompletion(leaf, config) {
  const qualified=leaf?.qualifiedSources ?? [];
  if (qualified.length < config.requiredQualifiedIndependentSourcesPerLeaf) return false;
  if (new Set(qualified.map(row=>row.independenceKey)).size < config.requiredQualifiedIndependentSourcesPerLeaf) return false;
  if (!leaf?.synthesis?.projectAuthored) return false;
  if (!Array.isArray(leaf.synthesis.safetyAuthorityRefs) || leaf.synthesis.safetyAuthorityRefs.length < 1) return false;
  const axes=leaf.synthesis.adjustmentAxes ?? {};
  const present=config.adjustmentAxes.filter(axis=>Object.hasOwn(axes,axis));
  return present.length >= 6;
}

export function evaluatePilotPass(state, config) {
  if (state.leaves.length !== 5) return false;
  if (new Set(state.leaves.map(row=>row.tradition)).size < 2) return false;
  return state.leaves.every(leaf=>evaluateLeafCompletion(leaf,config));
}

export function pendingCandidateCount(state) {
  return state.leaves.reduce((sum,leaf)=>sum+leaf.candidatePointers.filter(row=>row.qualificationStatus==="PENDING_REVIEW").length,0);
}
