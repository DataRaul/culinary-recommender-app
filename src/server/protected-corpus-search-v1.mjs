import { STEP8B_RECIPE_TABLE, sha256Hex } from "./step8b-live.mjs";
import { STEP8G_POINTER_SCOPE, STEP8G_ROUTE_TABLE, readStep8GPointer } from "./step8g-live-runtime.mjs";
import { hydrateStep8GV8018ProtectedRecipesBounded } from "./step8g-v8018-hydration-runtime.mjs";

export const PROTECTED_SEARCH_CORPUS_VERSION = "v8018";
export const PROTECTED_SEARCH_EXPECTED_COUNT = 19268;
export const PROTECTED_SEARCH_INDEX_TABLE = "culinary_protected_recipe_search_v1";
export const PROTECTED_SEARCH_FTS_TABLE = "culinary_protected_recipe_search_fts_v1";
export const PROTECTED_SEARCH_MAX_PAGE_SIZE = 50;
export const PROTECTED_SEARCH_INDEX_BATCH_SIZE = 40;
export const PROTECTED_SEARCH_TARGET_MAX_D1 = 8;
export const PROTECTED_SEARCH_HARD_MAX_D1 = 16;

const ALLOWED_BODY_VERSIONS = new Set(Array.from({ length: 18 }, (_, index) => `v${8001 + index}`));
const encoder = new TextEncoder();
const bytes = value => encoder.encode(String(value)).byteLength;
const nonEmpty = value => typeof value === "string" && value.trim() ? value.trim() : null;
const firstString = (...values) => values.map(nonEmpty).find(Boolean) || null;

export const PROTECTED_SEARCH_INDEX_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${PROTECTED_SEARCH_INDEX_TABLE} (
  recipe_id TEXT PRIMARY KEY,
  corpus_version TEXT NOT NULL,
  body_corpus_version TEXT NOT NULL,
  shard_number INTEGER NOT NULL,
  source_cohort_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_work TEXT,
  source_author TEXT,
  source_year TEXT,
  source_url TEXT,
  source_license TEXT,
  attribution_text TEXT,
  structural_state TEXT NOT NULL,
  indexed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (corpus_version='v8018'),
  CHECK (shard_number IN (0,1)),
  CHECK (structural_state IN ('PARSEABLE','PARTIAL'))
)`;

export const PROTECTED_SEARCH_FTS_TABLE_SQL = `
CREATE VIRTUAL TABLE IF NOT EXISTS ${PROTECTED_SEARCH_FTS_TABLE}
USING fts5(
  recipe_id UNINDEXED,
  title,
  source_work,
  source_author,
  tokenize='unicode61 remove_diacritics 2'
)`;

function routeFromRow(row) {
  return {
    recipeId: String(row.recipe_id || ""),
    corpusVersion: String(row.corpus_version || ""),
    shardNumber: Number(row.shard_number),
    sourceCohortId: String(row.source_cohort_id || ""),
    bodySha256: String(row.body_sha256 || ""),
    bodyBytes: Number(row.body_bytes)
  };
}

function localizedText(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return firstString(value.en, value.ru, ...Object.values(value)) || "";
}

function stringList(value) {
  return Array.isArray(value) ? value.map(item => String(item ?? "").trim()).filter(Boolean) : [];
}

function ingredientText(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  const name = localizedText(value.name) || firstString(value.title, value.ingredient, value.id) || "";
  const quantity = Number.isFinite(Number(value.quantity)) ? String(value.quantity) : "";
  const unit = firstString(value.unit) || "";
  const note = localizedText(value.note);
  return [quantity, unit, name, note ? `(${note})` : ""].filter(Boolean).join(" ").trim();
}

function directionText(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return localizedText(value.text) || firstString(value.instruction, value.description, value.name) || "";
}

function packetTitle(packet) {
  return firstString(
    localizedText(packet?.recipe?.name),
    packet?.recipe?.nativeName,
    packet?.sourceRecord?.title,
    packet?.sourceRecord?.name,
    packet?.sourceContent?.title,
    packet?.sourceContent?.slug,
    packet?.title
  );
}

function packetIngredients(packet) {
  const candidates = [
    packet?.recipe?.ingredients,
    packet?.sourceRecord?.ingredients,
    packet?.sourceContent?.parsedIngredientsNonAuthoritative
  ];
  const source = candidates.find(Array.isArray) || [];
  return source.map(ingredientText).filter(Boolean);
}

function packetDirections(packet) {
  const candidates = [
    packet?.recipe?.steps,
    packet?.sourceRecord?.processNodes,
    packet?.sourceRecord?.steps,
    packet?.sourceContent?.parsedDirectionsNonAuthoritative
  ];
  const source = candidates.find(Array.isArray) || [];
  return source.map(directionText).filter(Boolean);
}

function packetSource(packet, route) {
  const provenance = packet?.provenance || {};
  const source = packet?.source || {};
  const rights = packet?.rights || {};
  return {
    sourceCohortId: firstString(provenance.sourceCohortId, source.cohortId, packet?.sourceId, route?.sourceCohortId) || "",
    sourceWork: firstString(source.sourceWork, packet?.sourceRecord?.sourceWork, provenance.datasetVersion),
    sourceAuthor: firstString(source.sourceAuthorDisplay, source.sourceAuthor, packet?.sourceRecord?.author),
    sourceYear: firstString(source.sourceYear, source.digitizedEditionYear),
    sourceUrl: firstString(provenance.sourceRecipeUrl, source.sourceUrl, packet?.sourceUrl, packet?.immutableLocator),
    sourceLicense: firstString(provenance.licenseId, source.licenseId, rights.license, packet?.sourceRecord?.license),
    attributionText: firstString(provenance.attributionText, rights.attribution)
  };
}

export function projectProtectedPacketForIndex(packet, route = {}) {
  const recipeId = firstString(
    packet?.identity?.recipeId,
    packet?.canonicalRecipeId,
    route?.recipeId
  );
  const title = packetTitle(packet);
  if (!recipeId || recipeId !== route.recipeId) throw new Error("PROTECTED_INDEX_IDENTITY_MISMATCH");
  if (!title) throw new Error("PROTECTED_INDEX_TITLE_REQUIRED");
  const source = packetSource(packet, route);
  if (!source.sourceCohortId || source.sourceCohortId !== route.sourceCohortId) throw new Error("PROTECTED_INDEX_SOURCE_COHORT_MISMATCH");
  const ingredients = packetIngredients(packet);
  const directions = packetDirections(packet);
  return {
    recipeId,
    corpusVersion: PROTECTED_SEARCH_CORPUS_VERSION,
    bodyCorpusVersion: route.corpusVersion,
    shardNumber: route.shardNumber,
    sourceCohortId: source.sourceCohortId,
    title,
    sourceWork: source.sourceWork,
    sourceAuthor: source.sourceAuthor,
    sourceYear: source.sourceYear,
    sourceUrl: source.sourceUrl,
    sourceLicense: source.sourceLicense,
    attributionText: source.attributionText,
    structuralState: ingredients.length > 0 && directions.length > 0 ? "PARSEABLE" : "PARTIAL"
  };
}

export function projectProtectedPacketForDetail(packet, route = {}) {
  const index = projectProtectedPacketForIndex(packet, route);
  return {
    ...index,
    ingredients: packetIngredients(packet),
    directions: packetDirections(packet),
    authority: {
      protectedBrowseOnly: true,
      recommendationEligible: false,
      publicRuntimeActivated: false,
      nutritionAuthorityGranted: false,
      dietaryAllergenAuthorityGranted: false
    }
  };
}

export function normalizeProtectedSearchQuery(value) {
  const normalized = String(value || "").normalize("NFKC").trim().slice(0, 80);
  const tokens = normalized.split(/[^\p{L}\p{N}]+/u).map(token => token.trim()).filter(Boolean).slice(0, 6);
  if (!tokens.length) return null;
  return tokens.map(token => `"${token.replaceAll('"', '""').slice(0, 32)}"*`).join(" AND ");
}

export function boundedPageSize(value, fallback = 24) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(PROTECTED_SEARCH_MAX_PAGE_SIZE, parsed);
}

export async function initializeProtectedSearchIndex(controlDb) {
  await controlDb.prepare(PROTECTED_SEARCH_INDEX_TABLE_SQL).run();
  await controlDb.prepare(PROTECTED_SEARCH_FTS_TABLE_SQL).run();
  return { pass: true, d1Subqueries: 2 };
}

async function readRoutePage(controlDb, cursor = "", limit = PROTECTED_SEARCH_INDEX_BATCH_SIZE) {
  const sql = `
    SELECT recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes
    FROM (
      SELECT recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes
      FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8015'
      UNION ALL
      SELECT recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes
      FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8016' AND corpus_version='v8016'
      UNION ALL
      SELECT recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes
      FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8017' AND corpus_version='v8017'
      UNION ALL
      SELECT recipe_id,corpus_version,shard_number,source_cohort_id,body_sha256,body_bytes
      FROM ${STEP8G_ROUTE_TABLE} WHERE composition_version='v8018' AND corpus_version='v8018'
    )
    WHERE recipe_id > ?
    ORDER BY recipe_id
    LIMIT ?`;
  const rows = await controlDb.prepare(sql).bind(String(cursor || ""), limit).all();
  const routes = (rows?.results || []).map(routeFromRow);
  const ids = routes.map(route => route.recipeId);
  if (new Set(ids).size !== ids.length) return { pass: false, reason: "PROTECTED_ROUTE_DUPLICATE_IN_PAGE", routes: [], d1Subqueries: 1 };
  if (routes.some(route => !route.recipeId || !ALLOWED_BODY_VERSIONS.has(route.corpusVersion) || ![0,1].includes(route.shardNumber) || !route.sourceCohortId || !/^[0-9a-f]{64}$/.test(route.bodySha256) || route.bodyBytes <= 0)) {
    return { pass: false, reason: "PROTECTED_ROUTE_METADATA_INVALID", routes: [], d1Subqueries: 1 };
  }
  return { pass: true, routes, d1Subqueries: 1 };
}

async function readBodiesForRoutes(shardDbs, routes) {
  const bodiesById = new Map();
  let q = 0;
  for (const shardNumber of [0,1]) {
    const shardRoutes = routes.filter(route => route.shardNumber === shardNumber);
    if (!shardRoutes.length) continue;
    const clauses = [];
    const args = [];
    for (const version of [...ALLOWED_BODY_VERSIONS]) {
      const subset = shardRoutes.filter(route => route.corpusVersion === version);
      if (!subset.length) continue;
      clauses.push(`(corpus_version=? AND recipe_id IN (${subset.map(() => "?").join(",")}))`);
      args.push(version, ...subset.map(route => route.recipeId));
    }
    const rows = await shardDbs[shardNumber].prepare(
      `SELECT corpus_version,recipe_id,body_json,body_bytes,body_sha256,source_cohort_id FROM ${STEP8B_RECIPE_TABLE} WHERE ${clauses.join(" OR ")}`
    ).bind(...args).all();
    q++;
    for (const row of rows?.results || []) bodiesById.set(String(row.recipe_id), row);
  }
  if (bodiesById.size !== routes.length) return { pass: false, reason: "PROTECTED_BODY_LOOKUP_INCOMPLETE", bodiesById, d1Subqueries: q };
  return { pass: true, bodiesById, d1Subqueries: q };
}

async function verifyAndProject(routes, bodiesById) {
  const rows = [];
  for (const route of routes) {
    const body = bodiesById.get(route.recipeId);
    const bodyJson = String(body?.body_json || "");
    if (
      !body
      || String(body.corpus_version) !== route.corpusVersion
      || Number(body.body_bytes) !== route.bodyBytes
      || String(body.body_sha256) !== route.bodySha256
      || String(body.source_cohort_id) !== route.sourceCohortId
      || bytes(bodyJson) !== route.bodyBytes
      || await sha256Hex(bodyJson) !== route.bodySha256
    ) throw new Error("PROTECTED_BODY_INTEGRITY_MISMATCH");
    let packet;
    try { packet = JSON.parse(bodyJson); }
    catch { throw new Error("PROTECTED_BODY_JSON_INVALID"); }
    rows.push(projectProtectedPacketForIndex(packet, route));
  }
  return rows;
}

async function writeIndexRows(controlDb, rows) {
  if (!rows.length) return { pass: true, d1Subqueries: 0 };
  const summaryValues = rows.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)").join(",");
  const summaryArgs = rows.flatMap(row => [
    row.recipeId,row.corpusVersion,row.bodyCorpusVersion,row.shardNumber,row.sourceCohortId,row.title,
    row.sourceWork,row.sourceAuthor,row.sourceYear,row.sourceUrl,row.sourceLicense,row.attributionText,row.structuralState
  ]);
  const ids = rows.map(row => row.recipeId);
  const ftsValues = rows.map(() => "(?,?,?,?)").join(",");
  const ftsArgs = rows.flatMap(row => [row.recipeId,row.title,row.sourceWork || "",row.sourceAuthor || ""]);
  const statements = [
    controlDb.prepare(`INSERT INTO ${PROTECTED_SEARCH_INDEX_TABLE}
      (recipe_id,corpus_version,body_corpus_version,shard_number,source_cohort_id,title,source_work,source_author,source_year,source_url,source_license,attribution_text,structural_state,indexed_at)
      VALUES ${summaryValues}
      ON CONFLICT(recipe_id) DO UPDATE SET
        corpus_version=excluded.corpus_version,
        body_corpus_version=excluded.body_corpus_version,
        shard_number=excluded.shard_number,
        source_cohort_id=excluded.source_cohort_id,
        title=excluded.title,
        source_work=excluded.source_work,
        source_author=excluded.source_author,
        source_year=excluded.source_year,
        source_url=excluded.source_url,
        source_license=excluded.source_license,
        attribution_text=excluded.attribution_text,
        structural_state=excluded.structural_state,
        indexed_at=CURRENT_TIMESTAMP`).bind(...summaryArgs),
    controlDb.prepare(`DELETE FROM ${PROTECTED_SEARCH_FTS_TABLE} WHERE recipe_id IN (${ids.map(() => "?").join(",")})`).bind(...ids),
    controlDb.prepare(`INSERT INTO ${PROTECTED_SEARCH_FTS_TABLE} (recipe_id,title,source_work,source_author) VALUES ${ftsValues}`).bind(...ftsArgs)
  ];
  await controlDb.batch(statements);
  return { pass: true, d1Subqueries: statements.length };
}

export async function indexProtectedCorpusBatch(controlDb, shardDbs, cursor = "") {
  const pointer = await readStep8GPointer(controlDb);
  let q = pointer.d1Subqueries;
  if (pointer.activeVersion !== PROTECTED_SEARCH_CORPUS_VERSION) {
    return { pass: false, reason: "V8018_NOT_ACTIVE", activeVersion: pointer.activeVersion, indexedCount: 0, nextCursor: String(cursor || ""), done: false, d1Subqueries: q, fullCorpusScans: 0 };
  }
  const page = await readRoutePage(controlDb, cursor, PROTECTED_SEARCH_INDEX_BATCH_SIZE);
  q += page.d1Subqueries;
  if (!page.pass) return { pass: false, reason: page.reason, indexedCount: 0, nextCursor: String(cursor || ""), done: false, d1Subqueries: q, fullCorpusScans: 0 };
  if (!page.routes.length) return { pass: true, indexedCount: 0, nextCursor: String(cursor || ""), done: true, d1Subqueries: q, fullCorpusScans: 0 };

  const bodies = await readBodiesForRoutes(shardDbs, page.routes);
  q += bodies.d1Subqueries;
  if (!bodies.pass) return { pass: false, reason: bodies.reason, indexedCount: 0, nextCursor: String(cursor || ""), done: false, d1Subqueries: q, fullCorpusScans: 0 };

  let rows;
  try { rows = await verifyAndProject(page.routes, bodies.bodiesById); }
  catch (error) { return { pass: false, reason: String(error?.message || error), indexedCount: 0, nextCursor: String(cursor || ""), done: false, d1Subqueries: q, fullCorpusScans: 0 }; }

  const written = await writeIndexRows(controlDb, rows);
  q += written.d1Subqueries;
  return {
    pass: written.pass && q <= PROTECTED_SEARCH_TARGET_MAX_D1,
    reason: q > PROTECTED_SEARCH_TARGET_MAX_D1 ? "TARGET_D1_BUDGET_EXCEEDED" : null,
    indexedCount: rows.length,
    partialCount: rows.filter(row => row.structuralState === "PARTIAL").length,
    nextCursor: rows.at(-1)?.recipeId || String(cursor || ""),
    done: rows.length < PROTECTED_SEARCH_INDEX_BATCH_SIZE,
    d1Subqueries: q,
    fullCorpusScans: 0
  };
}

export async function protectedSearchIndexStatus(controlDb) {
  const pointer = await readStep8GPointer(controlDb);
  const summary = await controlDb.prepare(`SELECT COUNT(*) AS c, SUM(CASE WHEN structural_state='PARTIAL' THEN 1 ELSE 0 END) AS partial_count FROM ${PROTECTED_SEARCH_INDEX_TABLE} WHERE corpus_version='v8018'`).first();
  const fts = await controlDb.prepare(`SELECT COUNT(*) AS c FROM ${PROTECTED_SEARCH_FTS_TABLE}`).first();
  const summaryCount = Number(summary?.c || 0);
  const ftsCount = Number(fts?.c || 0);
  return {
    pass: pointer.activeVersion === PROTECTED_SEARCH_CORPUS_VERSION && summaryCount <= PROTECTED_SEARCH_EXPECTED_COUNT && ftsCount === summaryCount,
    ready: pointer.activeVersion === PROTECTED_SEARCH_CORPUS_VERSION && summaryCount === PROTECTED_SEARCH_EXPECTED_COUNT && ftsCount === PROTECTED_SEARCH_EXPECTED_COUNT,
    activeVersion: pointer.activeVersion,
    indexedRecipeCount: summaryCount,
    ftsRecipeCount: ftsCount,
    structuralPartialCount: Number(summary?.partial_count || 0),
    expectedRecipeCount: PROTECTED_SEARCH_EXPECTED_COUNT,
    d1Subqueries: pointer.d1Subqueries + 2,
    fullCorpusScans: 0
  };
}

function publicSummaryRow(row) {
  return {
    recipeId: String(row.recipe_id),
    title: String(row.title),
    sourceCohortId: String(row.source_cohort_id),
    sourceWork: row.source_work == null ? null : String(row.source_work),
    sourceAuthor: row.source_author == null ? null : String(row.source_author),
    sourceYear: row.source_year == null ? null : String(row.source_year),
    structuralState: String(row.structural_state)
  };
}

export async function browseProtectedCorpus(controlDb, { cursor = "", limit = 24 } = {}) {
  const bounded = boundedPageSize(limit);
  const rows = await controlDb.prepare(`SELECT recipe_id,title,source_cohort_id,source_work,source_author,source_year,structural_state
    FROM ${PROTECTED_SEARCH_INDEX_TABLE}
    WHERE corpus_version='v8018' AND recipe_id > ?
    ORDER BY recipe_id
    LIMIT ?`).bind(String(cursor || ""), bounded).all();
  const items = (rows?.results || []).map(publicSummaryRow);
  return {
    pass: true,
    items,
    nextCursor: items.length === bounded ? items.at(-1).recipeId : null,
    d1Subqueries: 1,
    fullCorpusScans: 0
  };
}

export async function searchProtectedCorpus(controlDb, { query, cursor = "", limit = 24 } = {}) {
  const ftsQuery = normalizeProtectedSearchQuery(query);
  if (!ftsQuery) return { pass: false, reason: "SEARCH_QUERY_REQUIRED", items: [], nextCursor: null, d1Subqueries: 0, fullCorpusScans: 0 };
  const bounded = boundedPageSize(limit);
  const rows = await controlDb.prepare(`SELECT s.recipe_id,s.title,s.source_cohort_id,s.source_work,s.source_author,s.source_year,s.structural_state
    FROM ${PROTECTED_SEARCH_FTS_TABLE}
    JOIN ${PROTECTED_SEARCH_INDEX_TABLE} s ON s.recipe_id=${PROTECTED_SEARCH_FTS_TABLE}.recipe_id
    WHERE ${PROTECTED_SEARCH_FTS_TABLE} MATCH ? AND s.corpus_version='v8018' AND s.recipe_id > ?
    ORDER BY s.recipe_id
    LIMIT ?`).bind(ftsQuery, String(cursor || ""), bounded).all();
  const items = (rows?.results || []).map(publicSummaryRow);
  return {
    pass: true,
    items,
    nextCursor: items.length === bounded ? items.at(-1).recipeId : null,
    d1Subqueries: 1,
    fullCorpusScans: 0
  };
}

export async function detailProtectedCorpusRecipe(controlDb, shardDbs, recipeId) {
  const id = String(recipeId || "").trim();
  if (!id || id.length > 240) return { pass: false, reason: "RECIPE_ID_REQUIRED", item: null, d1Subqueries: 0, fullCorpusScans: 0 };
  const hydrated = await hydrateStep8GV8018ProtectedRecipesBounded(controlDb, shardDbs, [id]);
  if (!hydrated.pass || hydrated.packets.length !== 1) return { pass: false, reason: hydrated.reason || "DETAIL_HYDRATION_FAILED", item: null, d1Subqueries: hydrated.d1Subqueries, fullCorpusScans: 0 };
  const routeRow = await controlDb.prepare(`SELECT recipe_id,body_corpus_version,shard_number,source_cohort_id FROM ${PROTECTED_SEARCH_INDEX_TABLE} WHERE corpus_version='v8018' AND recipe_id=? LIMIT 1`).bind(id).first();
  const d1Subqueries = hydrated.d1Subqueries + 1;
  if (!routeRow) return { pass: false, reason: "DETAIL_NOT_INDEXED", item: null, d1Subqueries, fullCorpusScans: 0 };
  const route = {
    recipeId: String(routeRow.recipe_id),
    corpusVersion: String(routeRow.body_corpus_version),
    shardNumber: Number(routeRow.shard_number),
    sourceCohortId: String(routeRow.source_cohort_id)
  };
  try {
    return { pass: true, item: projectProtectedPacketForDetail(hydrated.packets[0], route), d1Subqueries, fullCorpusScans: 0 };
  } catch (error) {
    return { pass: false, reason: String(error?.message || error), item: null, d1Subqueries, fullCorpusScans: 0 };
  }
}
