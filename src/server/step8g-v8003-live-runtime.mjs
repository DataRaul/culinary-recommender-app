import { STEP8G_V8003_RUNTIME_DESCRIPTOR as runtimeDescriptor } from "../../data/generated/step8g/v8003-runtime-descriptor.mjs";
import {
  STEP8B_LIVE_SHARD_SPECS,
  STEP8B_RECEIPT_TABLE,
  STEP8B_RECEIPT_TABLE_SQL,
  STEP8B_RECIPE_TABLE,
  STEP8B_RECIPE_TABLE_SQL,
  sha256Hex
} from "./step8b-live.mjs";
import {
  STEP8G_POINTER_SCOPE,
  STEP8G_POINTER_TABLE,
  STEP8G_POINTER_TABLE_SQL,
  STEP8G_ROUTE_TABLE,
  STEP8G_ROUTE_TABLE_SQL,
  STEP8G_ROUTE_RECEIPT_TABLE,
  STEP8G_ROUTE_RECEIPT_TABLE_SQL,
  readStep8GPointer,
  readStep8GRouteProgress
} from "./step8g-live-runtime.mjs";

const encoder = new TextEncoder();
export const STEP8G_V8003_CONTRACT_VERSION = "CORPUS_SCALE_STEP8G_CC0_V8003_LIVE_V1";
export const STEP8G_V8003_CORPUS_VERSION = "v8003";
export const STEP8G_V8003_PARENT_VERSION = "v8002";
export const STEP8G_V8003_SOURCE_COHORT_ID = "SGAUTHIER_RECIPES_CC0_B12E481D";
export const STEP8G_V8003_SOURCE_COMMIT = runtimeDescriptor.sourceCommit;
export const STEP8G_V8003_EXPECTED_RECIPE_COUNT = 226;
export const STEP8G_V8003_EXPECTED_BODY_BATCH_COUNT = 23;
export const STEP8G_V8003_EXPECTED_PARENT_ROUTE_COUNT = 1416;
export const STEP8G_V8003_EXPECTED_ROUTE_COUNT = 1642;
export const STEP8G_V8003_MAX_ROWS_PER_BATCH = 10;
export const STEP8G_V8003_MAX_PROTECTED_D1_SUBQUERIES = 16;
export const STEP8G_V8003_LIVE_SHARD_SPECS = STEP8B_LIVE_SHARD_SPECS;

const bodyBatches = runtimeDescriptor.bodyBatches.map(value => Object.freeze({ ...value }));
const routeBatches = runtimeDescriptor.newRouteBatches.map(value => Object.freeze({ ...value }));
const bodyBatchById = new Map(bodyBatches.map(batch => [batch.batchId, batch]));
const routeBatchById = new Map(routeBatches.map(batch => [batch.batchId, batch]));
const utf8Bytes = value => encoder.encode(String(value)).byteLength;

function markdownText(value) {
  return String(value ?? "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}
function cleanIngredientLine(line) {
  let value = markdownText(String(line ?? "").replace(/^\s*[-*+]\s+/, ""));
  value = value.replace(/^~\s*/, "");
  value = value.replace(/^\d+\s+\d+\/\d+\s+/, "");
  value = value.replace(/^\d+\/\d+\s+/, "");
  value = value.replace(/^\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*(?:kg|g|mg|lb|lbs|oz|l|ml|cl|dl|tsp|tbsp|cup|cups|can|cans|jar|jars|package|packages|piece|pieces)?\b\s*/i, "");
  value = value.replace(/^\([^)]*\)\s*/, "");
  value = value.replace(/^(?:of\s+)/i, "");
  return value.trim();
}
function sectionBody(markdown, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$`, "im");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const rest = markdown.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}
function parseMarkdown(markdown) {
  const text = String(markdown ?? "");
  const titleMatch = /^#\s+(.+)$/m.exec(text);
  const ingredientsBody = sectionBody(text, "Ingredients");
  const directionsBody = sectionBody(text, "(?:Directions|Instructions|Method)");
  const tagsMatch = /^;tags:\s*(.+)$/mi.exec(text);
  return {
    title: markdownText(titleMatch?.[1] ?? ""),
    ingredients: ingredientsBody.split(/\r?\n/).filter(line => /^\s*[-*+]\s+/.test(line)).map(cleanIngredientLine).filter(Boolean),
    directions: directionsBody.split(/\r?\n/).map(line => line.replace(/^\s*(?:\d+[.)]|[-*+])\s*/, "").trim()).filter(Boolean),
    tags: tagsMatch ? tagsMatch[1].split(/\s+/).map(markdownText).filter(Boolean) : []
  };
}
function slugFromFile(fileName) {
  return String(fileName || "").replace(/\.md$/i, "").normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
async function buildBody(incoming) {
  const fileName = String(incoming?.fileName || "");
  const rawMarkdown = String(incoming?.rawMarkdown ?? "");
  const slug = slugFromFile(fileName);
  if (!fileName.endsWith(".md") || !slug || !rawMarkdown.trim()) throw new Error("SOURCE_RECORD_SCHEMA_MISMATCH");
  const parsed = parseMarkdown(rawMarkdown);
  if (!parsed.title) throw new Error("SOURCE_RECORD_SCHEMA_MISMATCH");
  const canonicalRecipeId = `cc0_sgauthier_${slug}`;
  const packet = {
    schema: "STEP8G_CC0_PROTECTED_SOURCE_PACKET_V1",
    canonicalRecipeId,
    source: {
      cohortId: STEP8G_V8003_SOURCE_COHORT_ID,
      repository: "sylGauthier/recipes",
      commit: STEP8G_V8003_SOURCE_COMMIT,
      path: `src/${fileName}`,
      sourceContentSha256: await sha256Hex(rawMarkdown),
      licenseId: "CC0-1.0"
    },
    sourceContent: {
      rawMarkdown,
      title: parsed.title,
      parsedIngredientsNonAuthoritative: parsed.ingredients,
      parsedDirectionsNonAuthoritative: parsed.directions,
      tagsNonAuthoritative: parsed.tags
    },
    authority: {
      recommendationAdmissionAuthorized: false,
      publicRuntimeActivationAuthorized: false,
      ingredientOntologyAuthority: false,
      nutritionAuthority: false,
      dietaryAllergenAuthority: false,
      scalingAuthority: false,
      knowledgeCoreWriteAuthorized: false
    }
  };
  const bodyJson = JSON.stringify(packet);
  return { recipeId: canonicalRecipeId, bodyJson, bodySha256: await sha256Hex(bodyJson), bodyBytes: utf8Bytes(bodyJson), sourceCohortId: STEP8G_V8003_SOURCE_COHORT_ID };
}
function bodyDescriptor(entry) {
  return { ordinal: Number(entry.ordinal), recipeId: String(entry.recipeId), bodySha256: String(entry.bodySha256), bodyBytes: Number(entry.bodyBytes), sourceCohortId: String(entry.sourceCohortId) };
}
function routeDescriptor(entry) {
  return { recipeId: String(entry.recipeId), corpusVersion: String(entry.corpusVersion), shardNumber: Number(entry.shardNumber), sourceCohortId: String(entry.sourceCohortId), bodySha256: String(entry.bodySha256), bodyBytes: Number(entry.bodyBytes) };
}
export function publicStep8GV8003Summary() {
  return {
    contractVersion: STEP8G_V8003_CONTRACT_VERSION,
    corpusVersion: STEP8G_V8003_CORPUS_VERSION,
    parentCorpusVersion: STEP8G_V8003_PARENT_VERSION,
    sourceCohortId: STEP8G_V8003_SOURCE_COHORT_ID,
    sourceCommit: STEP8G_V8003_SOURCE_COMMIT,
    recipeCount: STEP8G_V8003_EXPECTED_RECIPE_COUNT,
    parentRouteCount: STEP8G_V8003_EXPECTED_PARENT_ROUTE_COUNT,
    cumulativeRecipeCount: STEP8G_V8003_EXPECTED_ROUTE_COUNT,
    bodyBatchCount: bodyBatches.length,
    newRouteBatchCount: routeBatches.length,
    shardCount: STEP8G_V8003_LIVE_SHARD_SPECS.length,
    layerManifestSha256: runtimeDescriptor.layerManifestSha256,
    populationPlanSha256: runtimeDescriptor.populationPlanSha256,
    parentRouteIndexSha256: runtimeDescriptor.parentRouteIndexSha256,
    routeIndexSha256: runtimeDescriptor.routeIndexSha256,
    compositionSha256: runtimeDescriptor.compositionSha256,
    publicRuntimeActivationAuthorized: false,
    recommendationAdmissionAuthorized: false,
    billingExpansionAuthorized: false,
    thirdShardAuthorized: false
  };
}
export const expectedStep8GV8003BodyBatchIds = () => bodyBatches.map(batch => batch.batchId);
export const expectedStep8GV8003RouteBatchIds = () => routeBatches.map(batch => batch.batchId);
export function publicStep8GV8003BodyBatch(batchId) { const b = bodyBatchById.get(String(batchId || "")); return b ? { ...b } : null; }
export function publicStep8GV8003RouteBatch(batchId) { const b = routeBatchById.get(String(batchId || "")); return b ? { ...b } : null; }

export async function materializeStep8GV8003IncomingBodyBatch(payload = {}) {
  const expected = bodyBatchById.get(String(payload.batchId || ""));
  if (!expected) return { pass: false, reason: "UNKNOWN_BODY_BATCH_ID" };
  if (!Array.isArray(payload.sourceEntries) || payload.sourceEntries.length !== expected.rowCount) return { pass: false, reason: "BODY_BATCH_ROW_COUNT_MISMATCH" };
  const entries = [];
  const seen = new Set();
  for (const incoming of payload.sourceEntries) {
    const ordinal = Number(incoming?.ordinal);
    if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= STEP8G_V8003_EXPECTED_RECIPE_COUNT) return { pass: false, reason: "SOURCE_ORDINAL_INVALID" };
    try {
      const built = await buildBody(incoming);
      if (seen.has(built.recipeId)) return { pass: false, reason: "DUPLICATE_SOURCE_RECIPE_ID" };
      seen.add(built.recipeId);
      entries.push({ ordinal, ...built });
    } catch (error) { return { pass: false, reason: error?.message || "SOURCE_RECORD_REJECTED" }; }
  }
  const observed = await sha256Hex(JSON.stringify({ shardNumber: expected.shardNumber, batchNumber: expected.batchNumber, entries: entries.map(bodyDescriptor) }));
  if (observed !== expected.expectedSha256) return { pass: false, reason: "BODY_BATCH_FINGERPRINT_MISMATCH" };
  return { pass: true, batch: { ...expected, entries } };
}

export async function ensureStep8GV8003ShardSchema(db) {
  await db.prepare(STEP8B_RECIPE_TABLE_SQL).run();
  await db.prepare(STEP8B_RECEIPT_TABLE_SQL).run();
  return { initialized: true, d1Subqueries: 2 };
}
export async function initializeStep8GV8003ControlSchema(controlDb) {
  await controlDb.prepare(STEP8G_POINTER_TABLE_SQL).run();
  await controlDb.prepare(STEP8G_ROUTE_TABLE_SQL).run();
  await controlDb.prepare(STEP8G_ROUTE_RECEIPT_TABLE_SQL).run();
  return { initialized: true, d1Subqueries: 3 };
}
async function verifyBodyRows(db, batch) {
  const ids = batch.entries.map(entry => entry.recipeId); const placeholders = ids.map(() => "?").join(",");
  const rows = await db.prepare(`SELECT ordinal,recipe_id,body_bytes,body_sha256,source_cohort_id FROM ${STEP8B_RECIPE_TABLE} WHERE corpus_version=? AND recipe_id IN (${placeholders})`).bind(STEP8G_V8003_CORPUS_VERSION, ...ids).all();
  const byId = new Map((rows?.results || []).map(row => [String(row.recipe_id), row]));
  const pass = byId.size === batch.entries.length && batch.entries.every(entry => { const row = byId.get(entry.recipeId); return row && Number(row.ordinal)===entry.ordinal && Number(row.body_bytes)===entry.bodyBytes && String(row.body_sha256)===entry.bodySha256 && String(row.source_cohort_id)===entry.sourceCohortId; });
  return { pass, rowCount: byId.size, d1Subqueries: 1 };
}
export async function writeStep8GV8003BodyBatch(db, batch) {
  const prior = await db.prepare(`SELECT expected_sha256,row_count,verified FROM ${STEP8B_RECEIPT_TABLE} WHERE corpus_version=? AND batch_id=? LIMIT 1`).bind(STEP8G_V8003_CORPUS_VERSION,batch.batchId).first();
  let q=1;
  if (prior) {
    if (String(prior.expected_sha256)!==batch.expectedSha256 || Number(prior.row_count)!==batch.rowCount) return {pass:false,status:"BODY_RECEIPT_CONFLICT",d1Subqueries:q};
    const rows=await verifyBodyRows(db,batch); q+=rows.d1Subqueries; if(!rows.pass)return{pass:false,status:"BODY_RECEIPT_ROW_MISMATCH",d1Subqueries:q};
    if(Number(prior.verified)===1)return{pass:true,skipped:true,status:"VERIFIED_IDEMPOTENT_SKIP",rowCount:rows.rowCount,d1Subqueries:q};
    const promoted=await db.prepare(`UPDATE ${STEP8B_RECEIPT_TABLE} SET verified=1 WHERE corpus_version=? AND batch_id=? AND expected_sha256=? AND row_count=? AND verified=0`).bind(STEP8G_V8003_CORPUS_VERSION,batch.batchId,batch.expectedSha256,batch.rowCount).run(); q++;
    return {pass:Number(promoted?.meta?.changes??0)===1,recovered:true,status:"RECOVERED_UNKNOWN_COMMIT_AND_VERIFIED",rowCount:rows.rowCount,d1Subqueries:q};
  }
  if(typeof db.batch!=="function")return{pass:false,status:"D1_BATCH_UNAVAILABLE",d1Subqueries:q};
  const statements=batch.entries.map(entry=>db.prepare(`INSERT OR ABORT INTO ${STEP8B_RECIPE_TABLE} (corpus_version,ordinal,recipe_id,body_json,body_bytes,body_sha256,source_cohort_id) VALUES (?,?,?,?,?,?,?)`).bind(STEP8G_V8003_CORPUS_VERSION,entry.ordinal,entry.recipeId,entry.bodyJson,entry.bodyBytes,entry.bodySha256,entry.sourceCohortId));
  statements.push(db.prepare(`INSERT OR ABORT INTO ${STEP8B_RECEIPT_TABLE} (corpus_version,batch_id,expected_sha256,row_count,verified) VALUES (?,?,?,?,0)`).bind(STEP8G_V8003_CORPUS_VERSION,batch.batchId,batch.expectedSha256,batch.rowCount));
  try{await db.batch(statements);}catch{return{pass:false,status:"WRITE_ERROR_UNKNOWN_COMMIT_STATE",d1Subqueries:q+statements.length};} q+=statements.length;
  const rows=await verifyBodyRows(db,batch); q+=1; if(!rows.pass)return{pass:false,status:"POST_WRITE_ROW_VERIFICATION_MISMATCH",d1Subqueries:q};
  const promoted=await db.prepare(`UPDATE ${STEP8B_RECEIPT_TABLE} SET verified=1 WHERE corpus_version=? AND batch_id=? AND expected_sha256=? AND row_count=? AND verified=0`).bind(STEP8G_V8003_CORPUS_VERSION,batch.batchId,batch.expectedSha256,batch.rowCount).run(); q++;
  return {pass:Number(promoted?.meta?.changes??0)===1,status:"WRITTEN_AND_EXACTLY_VERIFIED",rowCount:rows.rowCount,d1Subqueries:q};
}
export async function readStep8GV8003BodyProgress(shardDbs) {
  const completed=[]; const pending=[]; const conflicts=[]; let q=0;
  for(const spec of STEP8G_V8003_LIVE_SHARD_SPECS){const rows=await shardDbs[spec.shardNumber].prepare(`SELECT batch_id,expected_sha256,row_count,verified FROM ${STEP8B_RECEIPT_TABLE} WHERE corpus_version=? ORDER BY batch_id`).bind(STEP8G_V8003_CORPUS_VERSION).all();q++;for(const row of rows?.results||[]){const id=String(row.batch_id||"");const e=bodyBatchById.get(id);if(!e||e.shardNumber!==spec.shardNumber||String(row.expected_sha256)!==e.expectedSha256||Number(row.row_count)!==e.rowCount)conflicts.push({batchId:id,reason:"BODY_RECEIPT_MISMATCH"});else if(Number(row.verified)===1)completed.push(id);else pending.push(id);}}
  const seen=new Set([...completed,...pending]); const missing=bodyBatches.map(b=>b.batchId).filter(id=>!seen.has(id)); const verifiedRowCount=completed.reduce((s,id)=>s+bodyBatchById.get(id).rowCount,0);
  return {pass:conflicts.length===0,completeVerified:conflicts.length===0&&!pending.length&&!missing.length&&completed.length===23&&verifiedRowCount===226,completedBatchIds:completed.sort(),pendingVerificationBatchIds:pending.sort(),missingBatchIds:missing,conflicts,verifiedBatchCount:completed.length,verifiedRowCount,expectedBatchCount:23,expectedRecipeCount:226,fullCorpusScans:0,d1Subqueries:q};
}

export async function copyStep8GV8003ParentRoutes(controlDb) {
  const old = await readStep8GRouteProgress(controlDb); let q=old.d1Subqueries;
  if(!old.completeVerified||old.verifiedRowCount!==1416)return{pass:false,status:"V8002_ROUTE_BASELINE_NOT_VERIFIED",d1Subqueries:q};
  const existing=await controlDb.prepare(`SELECT COUNT(*) AS c FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version=? AND corpus_version IN ('v8001','v8002')`).bind(STEP8G_V8003_CORPUS_VERSION).first(); q++;
  if(Number(existing?.c||0)===1416)return{pass:true,skipped:true,status:"PARENT_ROUTES_IDEMPOTENT_SKIP",rowCount:1416,d1Subqueries:q};
  if(Number(existing?.c||0)!==0)return{pass:false,status:"PARENT_ROUTE_PARTIAL_CONFLICT",rowCount:Number(existing?.c||0),d1Subqueries:q};
  const result=await controlDb.prepare(`INSERT OR ABORT INTO ${STEP8G_ROUTE_TABLE} (composition_version,recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes) SELECT ?,recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version=?`).bind(STEP8G_V8003_CORPUS_VERSION,"v8002").run(); q++;
  const after=await controlDb.prepare(`SELECT COUNT(*) AS c FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version=? AND corpus_version IN ('v8001','v8002')`).bind(STEP8G_V8003_CORPUS_VERSION).first(); q++;
  const count=Number(after?.c||0); return {pass:count===1416,status:count===1416?"PARENT_ROUTES_COPIED_AND_VERIFIED":"PARENT_ROUTE_COPY_MISMATCH",rowCount:count,changes:Number(result?.meta?.changes??0),d1Subqueries:q};
}
async function verifyNewRoutes(controlDb, entries) {
  const ids=entries.map(e=>e.recipeId);const ph=ids.map(()=>"?").join(",");const rows=await controlDb.prepare(`SELECT recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version=? AND recipe_id IN (${ph})`).bind(STEP8G_V8003_CORPUS_VERSION,...ids).all();
  const byId=new Map((rows?.results||[]).map(r=>[String(r.recipe_id),r])); const pass=byId.size===entries.length&&entries.every(e=>{const r=byId.get(e.recipeId);return r&&String(r.corpus_version)===e.corpusVersion&&Number(r.shard_number)===e.shardNumber&&String(r.source_cohort_id)===e.sourceCohortId&&String(r.body_sha256)===e.bodySha256&&Number(r.body_bytes)===e.bodyBytes;}); return{pass,rowCount:byId.size,d1Subqueries:1};
}
export async function writeStep8GV8003RouteBatch(controlDb, shardDbs, payload={}) {
  const batch=routeBatchById.get(String(payload.batchId||""));if(!batch)return{pass:false,status:"UNKNOWN_ROUTE_BATCH_ID",d1Subqueries:0};
  if(!Array.isArray(payload.entries)||payload.entries.length!==batch.rowCount)return{pass:false,status:"ROUTE_BATCH_ROW_COUNT_MISMATCH",d1Subqueries:0};
  const entries=payload.entries.map(routeDescriptor);if(entries.some(e=>e.corpusVersion!=="v8003"||e.shardNumber!==batch.shardNumber||!e.recipeId||!e.sourceCohortId||!/^[0-9a-f]{64}$/.test(e.bodySha256)||e.bodyBytes<=0))return{pass:false,status:"ROUTE_BATCH_DESCRIPTOR_INVALID",d1Subqueries:0};
  const observed=await sha256Hex(JSON.stringify({compositionVersion:"v8003",corpusVersion:"v8003",shardNumber:batch.shardNumber,entries}));if(observed!==batch.expectedSha256)return{pass:false,status:"ROUTE_BATCH_FINGERPRINT_MISMATCH",d1Subqueries:0};
  const ids=entries.map(e=>e.recipeId);const ph=ids.map(()=>"?").join(",");const bodyRows=await shardDbs[batch.shardNumber].prepare(`SELECT recipe_id,body_sha256,body_bytes,source_cohort_id FROM ${STEP8B_RECIPE_TABLE} WHERE corpus_version='v8003' AND recipe_id IN (${ph})`).bind(...ids).all();let q=1;const bodyById=new Map((bodyRows?.results||[]).map(r=>[String(r.recipe_id),r]));if(bodyById.size!==entries.length||!entries.every(e=>{const r=bodyById.get(e.recipeId);return r&&String(r.body_sha256)===e.bodySha256&&Number(r.body_bytes)===e.bodyBytes&&String(r.source_cohort_id)===e.sourceCohortId;}))return{pass:false,status:"ROUTE_BODY_INTEGRITY_MISMATCH",d1Subqueries:q};
  const prior=await controlDb.prepare(`SELECT expected_sha256,row_count,verified FROM ${STEP8G_ROUTE_RECEIPT_TABLE} WHERE composition_version='v8003' AND batch_id=? LIMIT 1`).bind(batch.batchId).first();q++;
  if(prior){if(String(prior.expected_sha256)!==observed||Number(prior.row_count)!==batch.rowCount)return{pass:false,status:"ROUTE_RECEIPT_CONFLICT",d1Subqueries:q};const vr=await verifyNewRoutes(controlDb,entries);q++;if(!vr.pass)return{pass:false,status:"ROUTE_RECEIPT_ROW_MISMATCH",d1Subqueries:q};if(Number(prior.verified)===1)return{pass:true,skipped:true,status:"VERIFIED_IDEMPOTENT_SKIP",rowCount:vr.rowCount,d1Subqueries:q};const p=await controlDb.prepare(`UPDATE ${STEP8G_ROUTE_RECEIPT_TABLE} SET verified=1 WHERE composition_version='v8003' AND batch_id=? AND expected_sha256=? AND row_count=? AND verified=0`).bind(batch.batchId,observed,batch.rowCount).run();q++;return{pass:Number(p?.meta?.changes??0)===1,status:"RECOVERED_UNKNOWN_COMMIT_AND_VERIFIED",d1Subqueries:q};}
  const statements=entries.map(e=>controlDb.prepare(`INSERT OR ABORT INTO ${STEP8G_ROUTE_TABLE} (composition_version,recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes) VALUES ('v8003',?,?,?,?,?,?)`).bind(e.recipeId,e.corpusVersion,e.shardNumber,e.sourceCohortId,e.bodySha256,e.bodyBytes));statements.push(controlDb.prepare(`INSERT OR ABORT INTO ${STEP8G_ROUTE_RECEIPT_TABLE} (composition_version,batch_id,expected_sha256,row_count,verified) VALUES ('v8003',?,?,?,0)`).bind(batch.batchId,observed,batch.rowCount));
  try{await controlDb.batch(statements);}catch{return{pass:false,status:"WRITE_ERROR_UNKNOWN_COMMIT_STATE",d1Subqueries:q+statements.length};}q+=statements.length;const vr=await verifyNewRoutes(controlDb,entries);q++;if(!vr.pass)return{pass:false,status:"POST_WRITE_ROUTE_VERIFICATION_MISMATCH",d1Subqueries:q};const p=await controlDb.prepare(`UPDATE ${STEP8G_ROUTE_RECEIPT_TABLE} SET verified=1 WHERE composition_version='v8003' AND batch_id=? AND expected_sha256=? AND row_count=? AND verified=0`).bind(batch.batchId,observed,batch.rowCount).run();q++;return{pass:Number(p?.meta?.changes??0)===1,status:"WRITTEN_AND_EXACTLY_VERIFIED",rowCount:vr.rowCount,d1Subqueries:q};
}
export async function readStep8GV8003RouteProgress(controlDb) {
  const parent=await controlDb.prepare(`SELECT COUNT(*) AS c FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8003' AND corpus_version IN ('v8001','v8002')`).first();
  const receipts=await controlDb.prepare(`SELECT batch_id,expected_sha256,row_count,verified FROM ${STEP8G_ROUTE_RECEIPT_TABLE} WHERE composition_version='v8003' ORDER BY batch_id`).all();let q=2;const completed=[];const pending=[];const conflicts=[];for(const row of receipts?.results||[]){const id=String(row.batch_id||"");const e=routeBatchById.get(id);if(!e||String(row.expected_sha256)!==e.expectedSha256||Number(row.row_count)!==e.rowCount)conflicts.push({batchId:id,reason:"ROUTE_RECEIPT_MISMATCH"});else if(Number(row.verified)===1)completed.push(id);else pending.push(id);}const seen=new Set([...completed,...pending]);const missing=routeBatches.map(b=>b.batchId).filter(id=>!seen.has(id));const newRows=completed.reduce((s,id)=>s+routeBatchById.get(id).rowCount,0);const parentRows=Number(parent?.c||0);return{pass:conflicts.length===0,parentRouteCount:parentRows,newRouteCount:newRows,verifiedBatchCount:completed.length,completeVerified:conflicts.length===0&&!pending.length&&!missing.length&&parentRows===1416&&newRows===226&&completed.length===23,totalRouteCount:parentRows+newRows,missingBatchIds:missing,conflicts,fullCorpusScans:0,d1Subqueries:q};
}
export async function activateStep8GV8003Pointer(controlDb) {
  const pointer=await readStep8GPointer(controlDb);let q=pointer.d1Subqueries;if(pointer.activeVersion==="v8003")return{pass:true,skipped:true,status:"ALREADY_ACTIVE",previousVersion:pointer.previousVersion,d1Subqueries:q};if(pointer.activeVersion!=="v8002")return{pass:false,status:"PARENT_NOT_ACTIVE",activeVersion:pointer.activeVersion,d1Subqueries:q};
  const result=await controlDb.prepare(`UPDATE ${STEP8G_POINTER_TABLE} SET previous_version=active_version,active_version='v8003',manifest_sha256=?,updated_at=CURRENT_TIMESTAMP WHERE scope=? AND active_version='v8002'`).bind(runtimeDescriptor.layerManifestSha256,STEP8G_POINTER_SCOPE).run();q++;return{pass:Number(result?.meta?.changes??0)===1,status:"ACTIVATED_V8003",previousVersion:"v8002",d1Subqueries:q};
}
export async function rollbackStep8GV8003Pointer(controlDb) {
  const pointer=await readStep8GPointer(controlDb);let q=pointer.d1Subqueries;if(pointer.activeVersion==="v8002")return{pass:true,skipped:true,status:"ALREADY_ROLLED_BACK",d1Subqueries:q};if(pointer.activeVersion!=="v8003")return{pass:false,status:"ROLLBACK_SOURCE_NOT_ACTIVE",d1Subqueries:q};const result=await controlDb.prepare(`UPDATE ${STEP8G_POINTER_TABLE} SET previous_version=active_version,active_version='v8002',manifest_sha256=?,updated_at=CURRENT_TIMESTAMP WHERE scope=? AND active_version='v8003'`).bind(runtimeDescriptor.parentLayerManifestSha256,STEP8G_POINTER_SCOPE).run();q++;return{pass:Number(result?.meta?.changes??0)===1,status:"ROLLED_BACK_TO_V8002",d1Subqueries:q};
}
