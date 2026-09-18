import { STEP8B_RECIPE_TABLE, sha256Hex } from "./step8b-live.mjs";
import { STEP8G_POINTER_SCOPE, STEP8G_POINTER_TABLE, STEP8G_ROUTE_TABLE } from "./step8g-live-runtime.mjs";

const encoder = new TextEncoder();
const ALLOWED_VERSIONS = new Set(["v8001", "v8002", "v8003", "v8004", "v8005", "v8006", "v8007", "v8008"]);
const VERSIONS = [...ALLOWED_VERSIONS];
export const STEP8G_V8008_MAX_HYDRATED_CANDIDATES = 256;
export const STEP8G_V8008_LOOKUP_IDS_PER_QUERY = 97;
export const STEP8G_V8008_MAX_HYDRATION_D1_SUBQUERIES = 9;
const bytes = value => encoder.encode(String(value)).byteLength;
const chunks = (values, size) => { const out = []; for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size)); return out; };

async function lookupRoutes(controlDb, ids) {
  const routes = [];
  let q = 0;
  for (const chunk of chunks(ids, STEP8G_V8008_LOOKUP_IDS_PER_QUERY)) {
    const placeholders = chunk.map(() => "?").join(",");
    const rows = await controlDb.prepare(`SELECT r.recipe_id,r.corpus_version,r.shard_number,r.source_cohort_id,r.body_sha256,r.body_bytes FROM ${STEP8G_ROUTE_TABLE} r JOIN ${STEP8G_POINTER_TABLE} p ON p.scope=? AND p.active_version='v8008' WHERE r.composition_version='v8008' AND r.recipe_id IN (${placeholders})`).bind(STEP8G_POINTER_SCOPE, ...chunk).all();
    q++;
    for (const row of rows?.results || []) routes.push({
      recipeId: String(row.recipe_id),
      corpusVersion: String(row.corpus_version),
      shardNumber: Number(row.shard_number),
      sourceCohortId: String(row.source_cohort_id),
      bodySha256: String(row.body_sha256),
      bodyBytes: Number(row.body_bytes)
    });
  }
  return { routes, d1Subqueries: q };
}

async function lookupBodies(shardDbs, routes) {
  const byId = new Map();
  let q = 0;
  const byShard = new Map();
  for (const route of routes) {
    if (![0, 1].includes(route.shardNumber) || !ALLOWED_VERSIONS.has(route.corpusVersion)) return { pass: false, reason: "ROUTE_METADATA_INVALID", bodiesById: byId, shardQueries: q };
    if (!byShard.has(route.shardNumber)) byShard.set(route.shardNumber, []);
    byShard.get(route.shardNumber).push(route);
  }
  for (const [shardNumber, rows] of byShard) {
    for (const chunk of chunks(rows, STEP8G_V8008_LOOKUP_IDS_PER_QUERY)) {
      const clauses = [], args = [];
      for (const version of VERSIONS) {
        const subset = chunk.filter(route => route.corpusVersion === version);
        if (!subset.length) continue;
        clauses.push(`(corpus_version=? AND recipe_id IN (${subset.map(() => "?").join(",")}))`);
        args.push(version, ...subset.map(route => route.recipeId));
      }
      const result = await shardDbs[shardNumber].prepare(`SELECT corpus_version,recipe_id,body_json,body_bytes,body_sha256,source_cohort_id FROM ${STEP8B_RECIPE_TABLE} WHERE ${clauses.join(" OR ")}`).bind(...args).all();
      q++;
      for (const row of result?.results || []) byId.set(String(row.recipe_id), row);
    }
  }
  return { pass: true, bodiesById: byId, shardQueries: q };
}

export async function hydrateStep8GV8008ProtectedRecipesBounded(controlDb, shardDbs, recipeIds) {
  if (!Array.isArray(recipeIds) || !recipeIds.length) return { pass: false, reason: "RECIPE_IDS_REQUIRED", d1Subqueries: 0, routeQueries: 0, shardQueries: 0 };
  const ids = [...new Set(recipeIds.map(value => String(value || "")).filter(Boolean))];
  if (ids.length !== recipeIds.length) return { pass: false, reason: "DUPLICATE_OR_EMPTY_RECIPE_ID", d1Subqueries: 0, routeQueries: 0, shardQueries: 0 };
  if (ids.length > STEP8G_V8008_MAX_HYDRATED_CANDIDATES) return { pass: false, reason: "HYDRATION_CANDIDATE_LIMIT_EXCEEDED", d1Subqueries: 0, routeQueries: 0, shardQueries: 0 };
  const routes = await lookupRoutes(controlDb, ids), byRoute = new Map(routes.routes.map(route => [route.recipeId, route]));
  if (byRoute.size !== ids.length || ids.some(id => !byRoute.has(id))) return { pass: false, reason: "ROUTE_LOOKUP_INCOMPLETE_OR_COMPOSITION_INACTIVE", d1Subqueries: routes.d1Subqueries, routeQueries: routes.d1Subqueries, shardQueries: 0 };
  const bodies = await lookupBodies(shardDbs, routes.routes);
  if (!bodies.pass) return { pass: false, reason: bodies.reason, d1Subqueries: routes.d1Subqueries + bodies.shardQueries, routeQueries: routes.d1Subqueries, shardQueries: bodies.shardQueries };
  const packets = [];
  for (const id of ids) {
    const route = byRoute.get(id), row = bodies.bodiesById.get(id), body = String(row?.body_json || "");
    if (!route || !row || String(row.corpus_version) !== route.corpusVersion || Number(row.body_bytes) !== route.bodyBytes || String(row.body_sha256) !== route.bodySha256 || String(row.source_cohort_id) !== route.sourceCohortId || bytes(body) !== route.bodyBytes || await sha256Hex(body) !== route.bodySha256) return { pass: false, reason: "HYDRATED_BODY_INTEGRITY_MISMATCH", d1Subqueries: routes.d1Subqueries + bodies.shardQueries, routeQueries: routes.d1Subqueries, shardQueries: bodies.shardQueries };
    packets.push(JSON.parse(body));
  }
  return { pass: true, packets, d1Subqueries: routes.d1Subqueries + bodies.shardQueries, routeQueries: routes.d1Subqueries, shardQueries: bodies.shardQueries, maxInternalD1Subqueries: STEP8G_V8008_MAX_HYDRATION_D1_SUBQUERIES, fullCorpusScans: 0 };
}
