import { STEP8G_V8016_RUNTIME_DESCRIPTOR as descriptor } from "../../data/generated/step8g/v8016-runtime-descriptor.mjs";
import { STEP8G_V8015_RUNTIME_DESCRIPTOR } from "../../data/generated/step8g/v8015-runtime-descriptor.mjs";
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
  STEP8G_ROUTE_RECEIPT_TABLE,
  STEP8G_ROUTE_RECEIPT_TABLE_SQL,
  STEP8G_ROUTE_TABLE,
  STEP8G_ROUTE_TABLE_SQL,
  readStep8GPointer
} from "./step8g-live-runtime.mjs";

const encoder = new TextEncoder();
export const STEP8G_V8016_CORPUS_VERSION = "v8016";
export const STEP8G_V8016_PARENT_VERSION = "v8015";
export const STEP8G_V8016_EXPECTED_RECIPE_COUNT = 501;
export const STEP8G_V8016_EXPECTED_BODY_BATCH_COUNT = 51;
export const STEP8G_V8016_EXPECTED_ROUTE_COUNT = 17011;
export const STEP8G_V8016_EXPECTED_PARENT_ROUTE_COUNT = 16510;
export const STEP8G_V8016_MAX_ROWS_PER_BATCH = 10;
export const STEP8G_V8016_MAX_PROTECTED_D1_SUBQUERIES = 16;
export const STEP8G_V8016_LIVE_SHARD_SPECS = STEP8B_LIVE_SHARD_SPECS;

const SOURCE_REPOSITORY = "AdamBouhmad/open-recipe-archive";
const SOURCE_COLLECTION = "indian-kitchen";
export const STEP8G_V8016_ROUTE_STORAGE_MODE = "PARENT_V8015_REFERENCE_PLUS_V8016_DELTA";
const SOURCES = Object.freeze([
  Object.freeze({
    cohortId: "ORA_KENNEY_HERBERT_1885_CULINARY_JOTTINGS_CULINARYJOTTINGS00KENN",
    sourceUrl: "https://archive.org/details/culinaryjottings00kenn",
    sourceTitle: "Culinary Jottings for Madras",
    author: "Wyvern (A.R. Kenney-Herbert)",
    authorDisplay: "Arthur Robert Kenney-Herbert",
    authorClassification: "IDENTIFIED_AUTHOR",
    sourceYearSemantics: "EXACT_DIGITIZED_FIFTH_EDITION_YEAR",
    workFirstPublicationYear: "1878",
    digitizedEditionYear: "1885",
    digitizedEditionLabel: "5th edition",
    sourceYear: "1885",
    license: "public-domain",
    idPrefix: "ora_kenney_herbert_1885_",
    packetSchema: "STEP8G_ORA_KENNEY_HERBERT_1885_PROTECTED_SOURCE_PACKET_V1"
  })
]);
const SOURCE_COHORT_IDS = new Set(SOURCES.map(source => source.cohortId));

const bodyHashes = descriptor.bodyHashHexByShard.map(value => value.match(/.{64}/g) || []);
const routeHashes = descriptor.routeHashHexByShard.map(value => value.match(/.{64}/g) || []);
const bodyBatches = bodyHashes.flatMap((list, shardNumber) => list.map((expectedSha256, batchNumber) => {
  const remaining = Number(descriptor.bodyShardRows[shardNumber]) - batchNumber * STEP8G_V8016_MAX_ROWS_PER_BATCH;
  return {
    batchId: `s${String(shardNumber).padStart(2, "0")}-b${String(batchNumber).padStart(6, "0")}`,
    shardNumber,
    batchNumber,
    rowCount: Math.min(STEP8G_V8016_MAX_ROWS_PER_BATCH, remaining),
    expectedSha256
  };
}));
const routeBatches = descriptor.bodyShardRows.flatMap((rowCount, shardNumber) => Array.from(
  { length: Math.ceil(Number(rowCount) / STEP8G_V8016_MAX_ROWS_PER_BATCH) },
  (_, batchNumber) => ({
    batchId: `route-v8016-s${String(shardNumber).padStart(2, "0")}-b${String(batchNumber).padStart(6, "0")}`,
    shardNumber,
    batchNumber,
    rowCount: Math.min(STEP8G_V8016_MAX_ROWS_PER_BATCH, Number(rowCount) - batchNumber * STEP8G_V8016_MAX_ROWS_PER_BATCH),
    expectedSha256: routeHashes[shardNumber]?.[batchNumber]
  })
));
const bodyBatchById = new Map(bodyBatches.map(batch => [batch.batchId, batch]));
const routeBatchById = new Map(routeBatches.map(batch => [batch.batchId, batch]));
const bytes = value => encoder.encode(String(value)).byteLength;
const bodyDescriptor = entry => ({
  ordinal: Number(entry.ordinal),
  recipeId: String(entry.recipeId),
  bodySha256: String(entry.bodySha256),
  bodyBytes: Number(entry.bodyBytes),
  sourceCohortId: String(entry.sourceCohortId)
});
const routeDescriptor = entry => ({
  recipeId: String(entry.recipeId),
  corpusVersion: String(entry.corpusVersion),
  shardNumber: Number(entry.shardNumber),
  sourceCohortId: String(entry.sourceCohortId),
  bodySha256: String(entry.bodySha256),
  bodyBytes: Number(entry.bodyBytes)
});

function section(body, heading) {
  const match = new RegExp(`^##\\s+${heading}\\s*$`, "im").exec(body);
  if (!match) return "";
  const rest = body.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

function parseSourceRow(row = {}) {
  const body = String(row.body ?? "");
  const ingredients = section(body, "Ingredients")
    .split(/\r?\n/)
    .filter(line => /^\s*[-*+]\s+/.test(line))
    .map(line => line.replace(/^\s*[-*+]\s+/, "").trim())
    .filter(Boolean);
  const directions = section(body, "(?:Directions|Instructions|Method)")
    .split(/\r?\n/)
    .filter(line => /^\s*(?:\d+[.)]|[-*+])\s+/.test(line))
    .map(line => line.replace(/^\s*(?:\d+[.)]|[-*+])\s+/, "").trim())
    .filter(Boolean);
  return { title: String(row.title ?? ""), slug: String(row.slug ?? ""), ingredients, directions };
}

function slug(value) {
  return String(value ?? "").normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function sourceForRow(row = {}) {
  return SOURCES.find(source =>
    String(row.collection ?? "") === SOURCE_COLLECTION &&
    String(row.source_url ?? "") === source.sourceUrl &&
    String(row.source_title ?? "") === source.sourceTitle &&
    String(row.author ?? "") === source.author &&
    String(row.source_year ?? "") === source.sourceYear &&
    String(row.license ?? "") === source.license
  ) || null;
}

async function buildBody(rawJson, ordinal, sourceOrdinal) {
  let row;
  try { row = JSON.parse(String(rawJson ?? "")); }
  catch { throw new Error("SOURCE_JSON_INVALID"); }
  const source = sourceForRow(row);
  const parsed = parseSourceRow(row);
  if (!source || !parsed.title || !parsed.ingredients.length || !parsed.directions.length) throw new Error("SOURCE_RECORD_RIGHTS_OR_STRUCTURE_MISMATCH");
  if (!Number.isInteger(sourceOrdinal) || sourceOrdinal < 0) throw new Error("SOURCE_ROW_ORDINAL_INVALID");
  const sourceSlug = slug(parsed.slug || parsed.title || String(sourceOrdinal));
  const recipeId = `${source.idPrefix}${sourceSlug}`;
  if (!sourceSlug) throw new Error("SOURCE_RECIPE_ID_INVALID");
  const packet = {
    schema: source.packetSchema,
    canonicalRecipeId: recipeId,
    source: {
      cohortId: source.cohortId,
      repository: SOURCE_REPOSITORY,
      commit: descriptor.sourceCommit,
      path: `collections/${SOURCE_COLLECTION}/recipes.jsonl`,
      rowOrdinal: sourceOrdinal,
      sourceContentSha256: await sha256Hex(rawJson),
      sourceWork: source.sourceTitle,
      sourceAuthor: source.author,
      sourceAuthorClassification: source.authorClassification,
      sourceAuthorDisplay: source.authorDisplay || source.author || "author not identified",
      workFirstPublicationYear: source.workFirstPublicationYear,
      sourceYearSemantics: source.sourceYearSemantics,
      digitizedEditionYear: source.digitizedEditionYear,
      digitizedEditionLabel: source.digitizedEditionLabel,
      sourceYear: source.sourceYear,
      sourceUrl: source.sourceUrl,
      licenseId: source.license,
      historicalCollectionLabel: SOURCE_COLLECTION,
      repositoryLayerLicense: "Unlicense"
    },
    sourceContent: {
      rawJson: String(rawJson),
      title: parsed.title,
      slug: parsed.slug,
      parsedIngredientsNonAuthoritative: parsed.ingredients,
      parsedDirectionsNonAuthoritative: parsed.directions
    },
    authority: {
      recommendationAdmissionAuthorized: false,
      publicRuntimeActivationAuthorized: false,
      ingredientOntologyAuthority: false,
      nutritionAuthority: false,
      dietaryAllergenAuthority: false,
      scalingAuthority: false,
      culturalAuthenticityAuthority: false,
      historicalSourceLabelOnly: true,
      knowledgeCoreWriteAuthorized: false
    }
  };
  const bodyJson = JSON.stringify(packet);
  return {
    recipeId,
    bodyJson,
    bodySha256: await sha256Hex(bodyJson),
    bodyBytes: bytes(bodyJson),
    sourceCohortId: source.cohortId
  };
}

export function publicStep8GV8016Summary() {
  return {
    contractVersion: "CORPUS_SCALE_STEP8G_KENNEY_HERBERT_V8016_LIVE_V1",
    corpusVersion: STEP8G_V8016_CORPUS_VERSION,
    parentCorpusVersion: STEP8G_V8016_PARENT_VERSION,
    sourceCohortIds: [...SOURCE_COHORT_IDS],
    sourceCommit: descriptor.sourceCommit,
    recipeCount: STEP8G_V8016_EXPECTED_RECIPE_COUNT,
    cumulativeRecipeCount: STEP8G_V8016_EXPECTED_ROUTE_COUNT,
    bodyBatchCount: bodyBatches.length,
    newRouteBatchCount: routeBatches.length,
    shardCount: 2,
    maxRowsPerBatch: STEP8G_V8016_MAX_ROWS_PER_BATCH,
    maxProtectedD1Subqueries: STEP8G_V8016_MAX_PROTECTED_D1_SUBQUERIES,
    layerManifestSha256: descriptor.layerManifestSha256,
    populationPlanSha256: descriptor.populationPlanSha256,
    publicRuntimeActivationAuthorized: false,
    recommendationAdmissionAuthorized: false,
    billingExpansionAuthorized: false,
    thirdShardAuthorized: false,
    culturalAuthenticityAuthorityImported: false,
    restartSafeResume: true,
    sourceAuthorHandling: "IDENTIFIED_AUTHOR",
    routeStorageMode: STEP8G_V8016_ROUTE_STORAGE_MODE,
    parentRouteRowsCopied: 0,
    deltaRouteRowsExpected: STEP8G_V8016_EXPECTED_RECIPE_COUNT
  };
}

export const expectedStep8GV8016BodyBatchIds = () => bodyBatches.map(batch => batch.batchId);
export const expectedStep8GV8016RouteBatchIds = () => routeBatches.map(batch => batch.batchId);
export function publicStep8GV8016BodyBatch(id) { const batch = bodyBatchById.get(String(id || "")); return batch ? { ...batch } : null; }
export function publicStep8GV8016RouteBatch(id) { const batch = routeBatchById.get(String(id || "")); return batch ? { ...batch } : null; }

export async function materializeStep8GV8016IncomingBodyBatch(payload = {}) {
  const expected = bodyBatchById.get(String(payload.batchId || ""));
  if (!expected) return { pass: false, reason: "UNKNOWN_BODY_BATCH_ID" };
  if (!Array.isArray(payload.sourceEntries) || payload.sourceEntries.length !== expected.rowCount) return { pass: false, reason: "BODY_BATCH_ROW_COUNT_MISMATCH" };
  const entries = [];
  const ids = new Set();
  for (const incoming of payload.sourceEntries) {
    const ordinal = Number(incoming?.ordinal);
    const sourceOrdinal = Number(incoming?.sourceOrdinal);
    if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= STEP8G_V8016_EXPECTED_RECIPE_COUNT) return { pass: false, reason: "SOURCE_ORDINAL_INVALID" };
    let built;
    try { built = await buildBody(String(incoming?.rawJson || ""), ordinal, sourceOrdinal); }
    catch (error) { return { pass: false, reason: error.message || "SOURCE_RECORD_REJECTED" }; }
    if (ids.has(built.recipeId)) return { pass: false, reason: "DUPLICATE_SOURCE_RECIPE_ID" };
    ids.add(built.recipeId);
    entries.push({ ordinal, ...built });
  }
  const observed = await sha256Hex(JSON.stringify({
    shardNumber: expected.shardNumber,
    batchNumber: expected.batchNumber,
    entries: entries.map(bodyDescriptor)
  }));
  if (observed !== expected.expectedSha256) return { pass: false, reason: "BODY_BATCH_FINGERPRINT_MISMATCH" };
  return { pass: true, batch: { ...expected, entries } };
}

export async function ensureStep8GV8016ShardSchema(db) {
  await db.prepare(STEP8B_RECIPE_TABLE_SQL).run();
  await db.prepare(STEP8B_RECEIPT_TABLE_SQL).run();
  return { initialized: true, d1Subqueries: 2 };
}

export async function initializeStep8GV8016ControlSchema(db) {
  await db.prepare(STEP8G_POINTER_TABLE_SQL).run();
  await db.prepare(STEP8G_ROUTE_TABLE_SQL).run();
  await db.prepare(STEP8G_ROUTE_RECEIPT_TABLE_SQL).run();
  return { initialized: true, d1Subqueries: 3 };
}

async function verifyBodyRows(db, batch) {
  const ids = batch.entries.map(entry => entry.recipeId);
  const placeholders = ids.map(() => "?").join(",");
  const rows = await db.prepare(`SELECT ordinal,recipe_id,body_bytes,body_sha256,source_cohort_id FROM ${STEP8B_RECIPE_TABLE} WHERE corpus_version=? AND recipe_id IN (${placeholders})`).bind(STEP8G_V8016_CORPUS_VERSION, ...ids).all();
  const byId = new Map((rows?.results || []).map(row => [String(row.recipe_id), row]));
  return {
    pass: byId.size === batch.entries.length && batch.entries.every(entry => {
      const row = byId.get(entry.recipeId);
      return row && Number(row.ordinal) === entry.ordinal && Number(row.body_bytes) === entry.bodyBytes && String(row.body_sha256) === entry.bodySha256 && String(row.source_cohort_id) === entry.sourceCohortId;
    }),
    rowCount: byId.size,
    d1Subqueries: 1
  };
}

export async function writeStep8GV8016BodyBatch(db, batch) {
  const prior = await db.prepare(`SELECT expected_sha256,row_count,verified FROM ${STEP8B_RECEIPT_TABLE} WHERE corpus_version=? AND batch_id=? LIMIT 1`).bind(STEP8G_V8016_CORPUS_VERSION, batch.batchId).first();
  let q = 1;
  if (prior) {
    if (String(prior.expected_sha256) !== batch.expectedSha256 || Number(prior.row_count) !== batch.rowCount) return { pass: false, status: "BODY_RECEIPT_CONFLICT", d1Subqueries: q };
    const rows = await verifyBodyRows(db, batch); q += rows.d1Subqueries;
    if (!rows.pass) return { pass: false, status: "BODY_RECEIPT_ROW_MISMATCH", d1Subqueries: q };
    if (Number(prior.verified) === 1) return { pass: true, skipped: true, status: "VERIFIED_IDEMPOTENT_SKIP", rowCount: rows.rowCount, d1Subqueries: q };
    const promoted = await db.prepare(`UPDATE ${STEP8B_RECEIPT_TABLE} SET verified=1 WHERE corpus_version=? AND batch_id=? AND expected_sha256=? AND row_count=? AND verified=0`).bind(STEP8G_V8016_CORPUS_VERSION, batch.batchId, batch.expectedSha256, batch.rowCount).run(); q++;
    return { pass: Number(promoted?.meta?.changes ?? 0) === 1, status: "RECOVERED_UNKNOWN_COMMIT_AND_VERIFIED", rowCount: rows.rowCount, d1Subqueries: q };
  }
  if (typeof db.batch !== "function") return { pass: false, status: "D1_BATCH_UNAVAILABLE", d1Subqueries: q };
  const valueSql = batch.entries.map(() => "(?,?,?,?,?,?,?)").join(",");
  const valueArgs = batch.entries.flatMap(entry => [STEP8G_V8016_CORPUS_VERSION, entry.ordinal, entry.recipeId, entry.bodyJson, entry.bodyBytes, entry.bodySha256, entry.sourceCohortId]);
  const statements = [
    db.prepare(`INSERT OR ABORT INTO ${STEP8B_RECIPE_TABLE} (corpus_version,ordinal,recipe_id,body_json,body_bytes,body_sha256,source_cohort_id) VALUES ${valueSql}`).bind(...valueArgs),
    db.prepare(`INSERT OR ABORT INTO ${STEP8B_RECEIPT_TABLE} (corpus_version,batch_id,expected_sha256,row_count,verified) VALUES (?,?,?,?,0)`).bind(STEP8G_V8016_CORPUS_VERSION, batch.batchId, batch.expectedSha256, batch.rowCount)
  ];
  try { await db.batch(statements); }
  catch { return { pass: false, status: "WRITE_ERROR_UNKNOWN_COMMIT_STATE", d1Subqueries: q + statements.length }; }
  q += statements.length;
  const rows = await verifyBodyRows(db, batch); q += rows.d1Subqueries;
  if (!rows.pass) return { pass: false, status: "POST_WRITE_ROW_VERIFICATION_MISMATCH", d1Subqueries: q };
  const promoted = await db.prepare(`UPDATE ${STEP8B_RECEIPT_TABLE} SET verified=1 WHERE corpus_version=? AND batch_id=? AND expected_sha256=? AND row_count=? AND verified=0`).bind(STEP8G_V8016_CORPUS_VERSION, batch.batchId, batch.expectedSha256, batch.rowCount).run(); q++;
  return { pass: Number(promoted?.meta?.changes ?? 0) === 1, status: "WRITTEN_AND_EXACTLY_VERIFIED", rowCount: rows.rowCount, d1Subqueries: q };
}

export async function readStep8GV8016BodyProgress(shardDbs) {
  const completed = [], pending = [], conflicts = [];
  let q = 0;
  for (const spec of STEP8G_V8016_LIVE_SHARD_SPECS) {
    const rows = await shardDbs[spec.shardNumber].prepare(`SELECT batch_id,expected_sha256,row_count,verified FROM ${STEP8B_RECEIPT_TABLE} WHERE corpus_version=? ORDER BY batch_id`).bind(STEP8G_V8016_CORPUS_VERSION).all(); q++;
    for (const row of rows?.results || []) {
      const id = String(row.batch_id || ""), expected = bodyBatchById.get(id);
      if (!expected || expected.shardNumber !== spec.shardNumber || String(row.expected_sha256) !== expected.expectedSha256 || Number(row.row_count) !== expected.rowCount) conflicts.push({ batchId: id, reason: "BODY_RECEIPT_MISMATCH" });
      else if (Number(row.verified) === 1) completed.push(id);
      else pending.push(id);
    }
  }
  const seen = new Set([...completed, ...pending]);
  const missing = bodyBatches.map(batch => batch.batchId).filter(id => !seen.has(id));
  const verifiedRowCount = completed.reduce((sum, id) => sum + bodyBatchById.get(id).rowCount, 0);
  return {
    pass: conflicts.length === 0,
    completeVerified: conflicts.length === 0 && !pending.length && !missing.length && completed.length === STEP8G_V8016_EXPECTED_BODY_BATCH_COUNT && verifiedRowCount === STEP8G_V8016_EXPECTED_RECIPE_COUNT,
    completedBatchIds: completed.sort(),
    pendingVerificationBatchIds: pending.sort(),
    missingBatchIds: missing,
    conflicts,
    verifiedBatchCount: completed.length,
    verifiedRowCount,
    expectedBatchCount: STEP8G_V8016_EXPECTED_BODY_BATCH_COUNT,
    expectedRecipeCount: STEP8G_V8016_EXPECTED_RECIPE_COUNT,
    fullCorpusScans: 0,
    d1Subqueries: q
  };
}

export async function copyStep8GV8016ParentRoutes(controlDb) {
  const pointer = await readStep8GPointer(controlDb);
  let q = pointer.d1Subqueries;
  if (![STEP8G_V8016_PARENT_VERSION, STEP8G_V8016_CORPUS_VERSION].includes(pointer.activeVersion)) return { pass: false, status: "V8015_PARENT_OR_V8016_ACTIVE_REQUIRED", activeVersion: pointer.activeVersion, d1Subqueries: q };
  const parent = await controlDb.prepare(`SELECT COUNT(*) AS c FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8015'`).first(); q++;
  const parentCount = Number(parent?.c || 0);
  if (parentCount !== STEP8G_V8016_EXPECTED_PARENT_ROUTE_COUNT) return { pass: false, status: "V8015_ROUTE_BASELINE_NOT_EXACT", rowCount: parentCount, physicalRowsWritten: 0, d1Subqueries: q };
  const copiedParent = await controlDb.prepare(`SELECT COUNT(*) AS c FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8016' AND corpus_version<>'v8016'`).first(); q++;
  const copiedParentCount = Number(copiedParent?.c || 0);
  if (copiedParentCount !== 0) return { pass: false, status: "V8016_PARENT_ROUTE_COPY_FORBIDDEN", rowCount: parentCount, staleCopiedParentRows: copiedParentCount, physicalRowsWritten: 0, d1Subqueries: q };
  return { pass: true, skipped: true, status: "PARENT_ROUTES_REFERENCED_FROM_V8015", rowCount: parentCount, physicalRowsWritten: 0, routeStorageMode: STEP8G_V8016_ROUTE_STORAGE_MODE, d1Subqueries: q };
}

async function verifyRoutes(controlDb, entries) {
  const ids = entries.map(entry => entry.recipeId), placeholders = ids.map(() => "?").join(",");
  const rows = await controlDb.prepare(`SELECT recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8016' AND recipe_id IN (${placeholders})`).bind(...ids).all();
  const byId = new Map((rows?.results || []).map(row => [String(row.recipe_id), row]));
  return {
    pass: byId.size === entries.length && entries.every(entry => {
      const row = byId.get(entry.recipeId);
      return row && String(row.corpus_version) === entry.corpusVersion && Number(row.shard_number) === entry.shardNumber && String(row.source_cohort_id) === entry.sourceCohortId && String(row.body_sha256) === entry.bodySha256 && Number(row.body_bytes) === entry.bodyBytes;
    }),
    rowCount: byId.size,
    d1Subqueries: 1
  };
}

export async function writeStep8GV8016RouteBatch(controlDb, shardDbs, payload = {}) {
  const batch = routeBatchById.get(String(payload.batchId || ""));
  if (!batch) return { pass: false, status: "UNKNOWN_ROUTE_BATCH_ID", d1Subqueries: 0 };
  if (!Array.isArray(payload.entries) || payload.entries.length !== batch.rowCount) return { pass: false, status: "ROUTE_BATCH_ROW_COUNT_MISMATCH", d1Subqueries: 0 };
  const entries = payload.entries.map(routeDescriptor), ids = entries.map(entry => entry.recipeId);
  if (new Set(ids).size !== ids.length || JSON.stringify(ids) !== JSON.stringify([...ids].sort()) || entries.some(entry => entry.corpusVersion !== STEP8G_V8016_CORPUS_VERSION || entry.shardNumber !== batch.shardNumber || !entry.recipeId || !SOURCE_COHORT_IDS.has(entry.sourceCohortId) || !/^[0-9a-f]{64}$/.test(entry.bodySha256) || entry.bodyBytes <= 0)) return { pass: false, status: "ROUTE_BATCH_DESCRIPTOR_INVALID", d1Subqueries: 0 };
  const observed = await sha256Hex(JSON.stringify({ compositionVersion: STEP8G_V8016_CORPUS_VERSION, corpusVersion: STEP8G_V8016_CORPUS_VERSION, shardNumber: batch.shardNumber, entries }));
  if (observed !== batch.expectedSha256) return { pass: false, status: "ROUTE_BATCH_FINGERPRINT_MISMATCH", d1Subqueries: 0 };
  const placeholders = ids.map(() => "?").join(",");
  const bodies = await shardDbs[batch.shardNumber].prepare(`SELECT recipe_id,body_sha256,body_bytes,source_cohort_id FROM ${STEP8B_RECIPE_TABLE} WHERE corpus_version='v8016' AND recipe_id IN (${placeholders})`).bind(...ids).all();
  let q = 1;
  const byId = new Map((bodies?.results || []).map(row => [String(row.recipe_id), row]));
  if (byId.size !== entries.length || !entries.every(entry => {
    const row = byId.get(entry.recipeId);
    return row && String(row.body_sha256) === entry.bodySha256 && Number(row.body_bytes) === entry.bodyBytes && String(row.source_cohort_id) === entry.sourceCohortId;
  })) return { pass: false, status: "ROUTE_BODY_INTEGRITY_MISMATCH", d1Subqueries: q };
  const prior = await controlDb.prepare(`SELECT expected_sha256,row_count,verified FROM ${STEP8G_ROUTE_RECEIPT_TABLE} WHERE composition_version='v8016' AND batch_id=? LIMIT 1`).bind(batch.batchId).first(); q++;
  if (prior) {
    if (String(prior.expected_sha256) !== observed || Number(prior.row_count) !== batch.rowCount) return { pass: false, status: "ROUTE_RECEIPT_CONFLICT", d1Subqueries: q };
    const verified = await verifyRoutes(controlDb, entries); q += verified.d1Subqueries;
    if (!verified.pass) return { pass: false, status: "ROUTE_RECEIPT_ROW_MISMATCH", d1Subqueries: q };
    if (Number(prior.verified) === 1) return { pass: true, skipped: true, status: "VERIFIED_IDEMPOTENT_SKIP", rowCount: verified.rowCount, d1Subqueries: q };
    const promoted = await controlDb.prepare(`UPDATE ${STEP8G_ROUTE_RECEIPT_TABLE} SET verified=1 WHERE composition_version='v8016' AND batch_id=? AND expected_sha256=? AND row_count=? AND verified=0`).bind(batch.batchId, observed, batch.rowCount).run(); q++;
    return { pass: Number(promoted?.meta?.changes ?? 0) === 1, status: "RECOVERED_UNKNOWN_COMMIT_AND_VERIFIED", rowCount: verified.rowCount, d1Subqueries: q };
  }
  const valueSql = entries.map(() => "(\'v8016\',?,?,?,?,?,?)").join(",");
  const valueArgs = entries.flatMap(entry => [entry.recipeId, entry.corpusVersion, entry.shardNumber, entry.sourceCohortId, entry.bodySha256, entry.bodyBytes]);
  const statements = [
    controlDb.prepare(`INSERT OR ABORT INTO ${STEP8G_ROUTE_TABLE} (composition_version,recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes) VALUES ${valueSql}`).bind(...valueArgs),
    controlDb.prepare(`INSERT OR ABORT INTO ${STEP8G_ROUTE_RECEIPT_TABLE} (composition_version,batch_id,expected_sha256,row_count,verified) VALUES (\'v8016\',?,?,?,0)`).bind(batch.batchId, observed, batch.rowCount)
  ];
  try { await controlDb.batch(statements); }
  catch { return { pass: false, status: "WRITE_ERROR_UNKNOWN_COMMIT_STATE", d1Subqueries: q + statements.length }; }
  q += statements.length;
  const verified = await verifyRoutes(controlDb, entries); q += verified.d1Subqueries;
  if (!verified.pass) return { pass: false, status: "POST_WRITE_ROUTE_VERIFICATION_MISMATCH", d1Subqueries: q };
  const promoted = await controlDb.prepare(`UPDATE ${STEP8G_ROUTE_RECEIPT_TABLE} SET verified=1 WHERE composition_version='v8016' AND batch_id=? AND expected_sha256=? AND row_count=? AND verified=0`).bind(batch.batchId, observed, batch.rowCount).run(); q++;
  return { pass: Number(promoted?.meta?.changes ?? 0) === 1, status: "WRITTEN_AND_EXACTLY_VERIFIED", rowCount: verified.rowCount, d1Subqueries: q };
}

export async function readStep8GV8016RouteProgress(controlDb) {
  const parent = await controlDb.prepare(`SELECT COUNT(*) AS c FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version=\'v8015\'`).first();
  const child = await controlDb.prepare(`SELECT COUNT(*) AS c FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8016' AND corpus_version='v8016'`).first();
  const receipts = await controlDb.prepare(`SELECT batch_id,expected_sha256,row_count,verified FROM ${STEP8G_ROUTE_RECEIPT_TABLE} WHERE composition_version='v8016' ORDER BY batch_id`).all();
  const completed = [], pending = [], conflicts = [];
  for (const row of receipts?.results || []) {
    const id = String(row.batch_id || ""), expected = routeBatchById.get(id);
    if (!expected || String(row.expected_sha256) !== expected.expectedSha256 || Number(row.row_count) !== expected.rowCount) conflicts.push({ batchId: id, reason: "ROUTE_RECEIPT_MISMATCH" });
    else if (Number(row.verified) === 1) completed.push(id);
    else pending.push(id);
  }
  const seen = new Set([...completed, ...pending]);
  const missing = routeBatches.map(batch => batch.batchId).filter(id => !seen.has(id));
  const receiptRows = completed.reduce((sum, id) => sum + routeBatchById.get(id).rowCount, 0);
  const parentRows = Number(parent?.c || 0), childRows = Number(child?.c || 0);
  return {
    pass: conflicts.length === 0,
    parentRouteCount: parentRows,
    newRouteCount: childRows,
    verifiedReceiptRowCount: receiptRows,
    verifiedBatchCount: completed.length,
    completeVerified: conflicts.length === 0 && !pending.length && !missing.length && parentRows === STEP8G_V8016_EXPECTED_PARENT_ROUTE_COUNT && childRows === STEP8G_V8016_EXPECTED_RECIPE_COUNT && receiptRows === STEP8G_V8016_EXPECTED_RECIPE_COUNT && completed.length === STEP8G_V8016_EXPECTED_BODY_BATCH_COUNT,
    totalRouteCount: parentRows + childRows,
    missingBatchIds: missing,
    conflicts,
    fullCorpusScans: 0,
    d1Subqueries: 3
  };
}

export async function activateStep8GV8016Pointer(controlDb) {
  const pointer = await readStep8GPointer(controlDb); let q = pointer.d1Subqueries;
  if (pointer.activeVersion === STEP8G_V8016_CORPUS_VERSION) return { pass: true, skipped: true, status: "ALREADY_ACTIVE", previousVersion: pointer.previousVersion, d1Subqueries: q };
  if (pointer.activeVersion !== STEP8G_V8016_PARENT_VERSION) return { pass: false, status: "PARENT_NOT_ACTIVE", activeVersion: pointer.activeVersion, d1Subqueries: q };
  const result = await controlDb.prepare(`UPDATE ${STEP8G_POINTER_TABLE} SET previous_version=active_version,active_version='v8016',manifest_sha256=?,updated_at=CURRENT_TIMESTAMP WHERE scope=? AND active_version='v8015'`).bind(descriptor.layerManifestSha256, STEP8G_POINTER_SCOPE).run(); q++;
  return { pass: Number(result?.meta?.changes ?? 0) === 1, status: "ACTIVATED_V8016", previousVersion: STEP8G_V8016_PARENT_VERSION, d1Subqueries: q };
}

export async function rollbackStep8GV8016Pointer(controlDb) {
  const pointer = await readStep8GPointer(controlDb); let q = pointer.d1Subqueries;
  if (pointer.activeVersion === STEP8G_V8016_PARENT_VERSION) return { pass: true, skipped: true, status: "ALREADY_ROLLED_BACK", d1Subqueries: q };
  if (pointer.activeVersion !== STEP8G_V8016_CORPUS_VERSION) return { pass: false, status: "ROLLBACK_SOURCE_NOT_ACTIVE", activeVersion: pointer.activeVersion, d1Subqueries: q };
  const result = await controlDb.prepare(`UPDATE ${STEP8G_POINTER_TABLE} SET previous_version=active_version,active_version='v8015',manifest_sha256=?,updated_at=CURRENT_TIMESTAMP WHERE scope=? AND active_version='v8016'`).bind(STEP8G_V8015_RUNTIME_DESCRIPTOR.layerManifestSha256, STEP8G_POINTER_SCOPE).run(); q++;
  return { pass: Number(result?.meta?.changes ?? 0) === 1, status: "ROLLED_BACK_TO_V8015", d1Subqueries: q };
}
