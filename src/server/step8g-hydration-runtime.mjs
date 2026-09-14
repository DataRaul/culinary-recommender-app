import {
  STEP8G_COMPOSITION_VERSION,
  STEP8G_CORPUS_VERSION,
  STEP8G_MAX_HYDRATED_CANDIDATES,
  STEP8G_PARENT_VERSION,
  STEP8G_POINTER_SCOPE,
  STEP8G_POINTER_TABLE,
  STEP8G_ROUTE_TABLE
} from "./step8g-live-runtime.mjs";
import { STEP8B_RECIPE_TABLE, sha256Hex } from "./step8b-live.mjs";

const encoder = new TextEncoder();
export const STEP8G_D1_MAX_BOUND_PARAMETERS = 100;
export const STEP8G_ROUTE_LOOKUP_IDS_PER_QUERY = 97;
export const STEP8G_BODY_LOOKUP_IDS_PER_QUERY = 98;
export const STEP8G_MAX_HYDRATION_D1_SUBQUERIES = 8;

function utf8Bytes(value) {
  return encoder.encode(String(value)).byteLength;
}

function chunks(values, size) {
  const output = [];
  for (let offset = 0; offset < values.length; offset += size) output.push(values.slice(offset, offset + size));
  return output;
}

async function lookupRoutes(controlDb, ids) {
  const routes = [];
  let d1Subqueries = 0;
  for (const idChunk of chunks(ids, STEP8G_ROUTE_LOOKUP_IDS_PER_QUERY)) {
    const placeholders = idChunk.map(() => "?").join(",");
    const rows = await controlDb.prepare(
      `SELECT r.recipe_id, r.corpus_version, r.shard_number, r.source_cohort_id, r.body_sha256, r.body_bytes
       FROM ${STEP8G_ROUTE_TABLE} r
       JOIN ${STEP8G_POINTER_TABLE} p ON p.scope = ? AND p.active_version = ?
       WHERE r.composition_version = ? AND r.recipe_id IN (${placeholders})`
    ).bind(STEP8G_POINTER_SCOPE, STEP8G_CORPUS_VERSION, STEP8G_COMPOSITION_VERSION, ...idChunk).all();
    d1Subqueries += 1;
    for (const row of rows?.results || []) {
      routes.push({
        recipeId: String(row.recipe_id),
        corpusVersion: String(row.corpus_version),
        shardNumber: Number(row.shard_number),
        sourceCohortId: String(row.source_cohort_id),
        bodySha256: String(row.body_sha256),
        bodyBytes: Number(row.body_bytes)
      });
    }
  }
  return { routes, d1Subqueries };
}

async function lookupBodies(shardDbs, routes) {
  const bodiesById = new Map();
  let shardQueries = 0;
  const byShard = new Map();
  for (const route of routes) {
    if (![0, 1].includes(route.shardNumber) || ![STEP8G_PARENT_VERSION, STEP8G_CORPUS_VERSION].includes(route.corpusVersion)) {
      return { pass: false, reason: "ROUTE_METADATA_INVALID", bodiesById, shardQueries };
    }
    if (!byShard.has(route.shardNumber)) byShard.set(route.shardNumber, []);
    byShard.get(route.shardNumber).push(route);
  }

  for (const [shardNumber, shardRoutes] of byShard) {
    for (const routeChunk of chunks(shardRoutes, STEP8G_BODY_LOOKUP_IDS_PER_QUERY)) {
      const clauses = [];
      const args = [];
      for (const corpusVersion of [STEP8G_PARENT_VERSION, STEP8G_CORPUS_VERSION]) {
        const subset = routeChunk.filter(route => route.corpusVersion === corpusVersion);
        if (!subset.length) continue;
        clauses.push(`(corpus_version = ? AND recipe_id IN (${subset.map(() => "?").join(",")}))`);
        args.push(corpusVersion, ...subset.map(route => route.recipeId));
      }
      const rows = await shardDbs[shardNumber].prepare(
        `SELECT corpus_version, recipe_id, body_json, body_bytes, body_sha256, source_cohort_id
         FROM ${STEP8B_RECIPE_TABLE} WHERE ${clauses.join(" OR ")}`
      ).bind(...args).all();
      shardQueries += 1;
      for (const row of rows?.results || []) bodiesById.set(String(row.recipe_id), row);
    }
  }
  return { pass: true, bodiesById, shardQueries };
}

export function step8gHydrationQueryBudget(candidateCount, shardSplit = [candidateCount, 0]) {
  const count = Number(candidateCount);
  if (!Number.isInteger(count) || count < 1 || count > STEP8G_MAX_HYDRATED_CANDIDATES) throw new Error("candidateCount out of range");
  const routeQueries = Math.ceil(count / STEP8G_ROUTE_LOOKUP_IDS_PER_QUERY);
  const bodyQueries = shardSplit.filter(value => value > 0).reduce(
    (sum, value) => sum + Math.ceil(Number(value) / STEP8G_BODY_LOOKUP_IDS_PER_QUERY), 0
  );
  return {
    authQueries: 1,
    routeQueries,
    bodyQueries,
    d1Subqueries: 1 + routeQueries + bodyQueries,
    maxAllowedD1Subqueries: STEP8G_MAX_HYDRATION_D1_SUBQUERIES
  };
}

export async function hydrateStep8GProtectedRecipesBounded(controlDb, shardDbs, recipeIds) {
  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    return { pass: false, reason: "RECIPE_IDS_REQUIRED", d1Subqueries: 0, routeQueries: 0, shardQueries: 0 };
  }
  const ids = [...new Set(recipeIds.map(value => String(value || "")).filter(Boolean))];
  if (ids.length !== recipeIds.length) {
    return { pass: false, reason: "DUPLICATE_OR_EMPTY_RECIPE_ID", d1Subqueries: 0, routeQueries: 0, shardQueries: 0 };
  }
  if (ids.length > STEP8G_MAX_HYDRATED_CANDIDATES) {
    return { pass: false, reason: "HYDRATION_CANDIDATE_LIMIT_EXCEEDED", d1Subqueries: 0, routeQueries: 0, shardQueries: 0 };
  }

  const routeLookup = await lookupRoutes(controlDb, ids);
  const byRouteId = new Map(routeLookup.routes.map(route => [route.recipeId, route]));
  if (byRouteId.size !== ids.length || ids.some(id => !byRouteId.has(id))) {
    return {
      pass: false,
      reason: "ROUTE_LOOKUP_INCOMPLETE_OR_COMPOSITION_INACTIVE",
      d1Subqueries: routeLookup.d1Subqueries,
      routeQueries: routeLookup.d1Subqueries,
      shardQueries: 0
    };
  }

  const bodyLookup = await lookupBodies(shardDbs, routeLookup.routes);
  if (!bodyLookup.pass) {
    return {
      pass: false,
      reason: bodyLookup.reason,
      d1Subqueries: routeLookup.d1Subqueries + bodyLookup.shardQueries,
      routeQueries: routeLookup.d1Subqueries,
      shardQueries: bodyLookup.shardQueries
    };
  }

  const packets = [];
  for (const recipeId of ids) {
    const route = byRouteId.get(recipeId);
    const row = bodyLookup.bodiesById.get(recipeId);
    const bodyJson = String(row?.body_json || "");
    if (!route || !row
      || String(row.corpus_version) !== route.corpusVersion
      || Number(row.body_bytes) !== route.bodyBytes
      || String(row.body_sha256) !== route.bodySha256
      || String(row.source_cohort_id) !== route.sourceCohortId
      || utf8Bytes(bodyJson) !== route.bodyBytes
      || await sha256Hex(bodyJson) !== route.bodySha256) {
      return {
        pass: false,
        reason: "HYDRATED_BODY_INTEGRITY_MISMATCH",
        d1Subqueries: routeLookup.d1Subqueries + bodyLookup.shardQueries,
        routeQueries: routeLookup.d1Subqueries,
        shardQueries: bodyLookup.shardQueries
      };
    }
    packets.push(JSON.parse(bodyJson));
  }

  return {
    pass: true,
    packets,
    d1Subqueries: routeLookup.d1Subqueries + bodyLookup.shardQueries,
    routeQueries: routeLookup.d1Subqueries,
    shardQueries: bodyLookup.shardQueries,
    maxInternalD1Subqueries: STEP8G_MAX_HYDRATION_D1_SUBQUERIES - 1,
    maxD1BoundParameters: STEP8G_D1_MAX_BOUND_PARAMETERS,
    fullCorpusScans: 0
  };
}
