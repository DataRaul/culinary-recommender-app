import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { GATE_F2_SOURCE } from "./wikibooks-gate-f2-contract.mjs";
import { assertValidGateF2DiscoverySnapshot } from "./wikibooks-gate-f2-review-queue.mjs";

export const GATE_F2_CATEGORY_HINT_SCHEMA = "wikibooks-gate-f2-category-hints-v1";
export const GATE_F2_CATEGORY_HINT_MODE = "CURRENT_PAGE_CATEGORY_HINTS_ONLY";
export const GATE_F2_CATEGORY_HINT_ROLE = "DISCOVERY_PRIORITIZATION_HINTS_ONLY";

const DEFAULT_INPUT = ".cache/wikibooks-gate-f2-discovery.json";
const DEFAULT_OUTPUT = ".cache/wikibooks-gate-f2-category-hints.json";
const DEFAULT_BATCH_SIZE = 50;
const DISCOVERY_UNIVERSE_STATES = new Set(["SOURCE_EXHAUSTED", "LIMIT_REACHED"]);
const PAGE_STATES = new Set([
  "PRESENT",
  "MISSING_AT_CATEGORY_ACQUISITION",
  "INVALID_AT_CATEGORY_ACQUISITION",
  "NOT_RETURNED_BY_CATEGORY_QUERY"
]);

const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const isIsoDateTime = value => isNonEmptyString(value) && Number.isFinite(Date.parse(value));

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, output: DEFAULT_OUTPUT, batchSize: DEFAULT_BATCH_SIZE };
  for (const arg of argv) {
    if (arg.startsWith("--input=")) {
      const value = arg.slice("--input=".length).trim();
      if (!value) throw new Error("--input cannot be empty");
      args.input = value;
    } else if (arg.startsWith("--output=")) {
      const value = arg.slice("--output=".length).trim();
      if (!value) throw new Error("--output cannot be empty");
      args.output = value;
    } else if (arg.startsWith("--batch-size=")) {
      const value = Number.parseInt(arg.slice("--batch-size=".length), 10);
      if (!Number.isInteger(value) || value <= 0 || value > 50) {
        throw new Error("--batch-size must be an integer between 1 and 50");
      }
      args.batchSize = value;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function continuationSignature(continuation) {
  return JSON.stringify(Object.entries(continuation || {}).sort(([a], [b]) => a.localeCompare(b)));
}

function buildCategoryUrl(pageids, continuation = null) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    pageids: pageids.join("|"),
    prop: "categories",
    cllimit: "max"
  });
  for (const [key, value] of Object.entries(continuation || {})) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  return `${GATE_F2_SOURCE.api}?${params}`;
}

function pageState(page) {
  if (page?.missing) return "MISSING_AT_CATEGORY_ACQUISITION";
  if (page?.invalid) return "INVALID_AT_CATEGORY_ACQUISITION";
  return "PRESENT";
}

function categoryTitles(page) {
  if (page?.categories !== undefined && !Array.isArray(page.categories)) {
    throw new Error(`Category query returned malformed categories for pageid ${page?.pageid ?? "missing"}`);
  }
  return (page?.categories || []).map(category => {
    const title = category?.title;
    if (!isNonEmptyString(title) || !title.startsWith("Category:")) {
      throw new Error(`Category query returned malformed category title for pageid ${page?.pageid ?? "missing"}`);
    }
    return title;
  });
}

function initializeRows(discovery) {
  return new Map(discovery.records.map(record => [record.pageid, {
    pageid: record.pageid,
    discoveryTitle: record.title,
    discoveryRevisionId: record.revid,
    discoveryRevisionTimestamp: record.timestamp,
    categoryQueryTitle: null,
    categoryFetchState: "NOT_RETURNED_BY_CATEGORY_QUERY",
    categories: new Set()
  }]));
}

function applyCategoryPage(rows, page) {
  if (!Number.isInteger(page?.pageid) || !rows.has(page.pageid)) {
    throw new Error(`Category query returned unexpected pageid: ${page?.pageid ?? "missing"}`);
  }

  const row = rows.get(page.pageid);
  const nextState = pageState(page);
  if (row.categoryFetchState !== "NOT_RETURNED_BY_CATEGORY_QUERY" && row.categoryFetchState !== nextState) {
    throw new Error(`Conflicting category-query state for pageid ${page.pageid}`);
  }
  row.categoryFetchState = nextState;

  if (nextState === "PRESENT") {
    if (!isNonEmptyString(page.title) || !page.title.startsWith("Cookbook:")) {
      throw new Error(`Category query returned invalid Cookbook title for pageid ${page.pageid}`);
    }
    if (row.categoryQueryTitle !== null && row.categoryQueryTitle !== page.title) {
      throw new Error(`Category query returned conflicting titles for pageid ${page.pageid}`);
    }
    row.categoryQueryTitle = page.title;
    for (const title of categoryTitles(page)) row.categories.add(title);
  } else if (page?.categories !== undefined && (!Array.isArray(page.categories) || page.categories.length !== 0)) {
    throw new Error(`Non-present category-query page returned categories for pageid ${page.pageid}`);
  }
}

export function buildGateF2CategoryHintSnapshot(discovery, categoryPages, { acquiredAt = new Date().toISOString() } = {}) {
  assertValidGateF2DiscoverySnapshot(discovery);
  if (!isIsoDateTime(acquiredAt)) throw new Error("acquiredAt must be an ISO date-time");
  if (!Array.isArray(categoryPages)) throw new Error("categoryPages must be an array");

  const rows = initializeRows(discovery);
  for (const page of categoryPages) applyCategoryPage(rows, page);

  const records = [...rows.values()]
    .map(row => {
      const categories = [...row.categories].sort((a, b) => a.localeCompare(b));
      return {
        pageid: row.pageid,
        discoveryTitle: row.discoveryTitle,
        discoveryRevisionId: row.discoveryRevisionId,
        discoveryRevisionTimestamp: row.discoveryRevisionTimestamp,
        categoryQueryTitle: row.categoryQueryTitle,
        titleChangedSinceDiscovery: row.categoryQueryTitle === null
          ? false
          : row.categoryQueryTitle !== row.discoveryTitle,
        categoryFetchState: row.categoryFetchState,
        categoryCount: categories.length,
        categories,
        categoryMetadataRevisionPinned: false,
        maySetCoverageMetadata: false,
        mayAuthorizeRecommendation: false,
        mayAuthorizeAuthenticityClaim: false,
        mayAuthorizeTrendClaim: false,
        runtimeActivationAuthorized: false
      };
    })
    .sort((a, b) => a.pageid - b.pageid || a.discoveryRevisionId - b.discoveryRevisionId);

  const snapshot = {
    schemaVersion: GATE_F2_CATEGORY_HINT_SCHEMA,
    sourceId: GATE_F2_SOURCE.id,
    acquiredAt,
    acquisitionMode: GATE_F2_CATEGORY_HINT_MODE,
    evidenceRole: GATE_F2_CATEGORY_HINT_ROLE,
    discoverySnapshotAcquiredAt: discovery.acquiredAt,
    discoverySourceUniverseState: discovery.sourceUniverseState,
    discoverySourceUniverseComplete: discovery.sourceUniverseComplete,
    discoveryRecordCount: discovery.records.length,
    categoryRecordCount: records.length,
    categoryMetadataRevisionPinned: false,
    hardMetadataInferenceAuthorized: false,
    authenticityInferenceAuthorized: false,
    trendInferenceAuthorized: false,
    nutritionAuthorityAuthorized: false,
    runtimeActivationAuthorized: false,
    categoryFetchAnomalyCount: records.filter(record => record.categoryFetchState !== "PRESENT").length,
    titleDriftCount: records.filter(record => record.titleChangedSinceDiscovery).length,
    totalCategoryHintCount: records.reduce((sum, record) => sum + record.categoryCount, 0),
    records
  };

  assertValidGateF2CategoryHintSnapshot(snapshot);
  return snapshot;
}

export function validateGateF2CategoryHintSnapshot(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== "object") return ["category-hint snapshot must be an object"];
  if (snapshot.schemaVersion !== GATE_F2_CATEGORY_HINT_SCHEMA) errors.push(`schemaVersion must be ${GATE_F2_CATEGORY_HINT_SCHEMA}`);
  if (snapshot.sourceId !== GATE_F2_SOURCE.id) errors.push(`sourceId must be ${GATE_F2_SOURCE.id}`);
  if (!isIsoDateTime(snapshot.acquiredAt)) errors.push("acquiredAt must be an ISO date-time");
  if (!isIsoDateTime(snapshot.discoverySnapshotAcquiredAt)) errors.push("discoverySnapshotAcquiredAt must be an ISO date-time");
  if (snapshot.acquisitionMode !== GATE_F2_CATEGORY_HINT_MODE) errors.push(`acquisitionMode must be ${GATE_F2_CATEGORY_HINT_MODE}`);
  if (snapshot.evidenceRole !== GATE_F2_CATEGORY_HINT_ROLE) errors.push(`evidenceRole must be ${GATE_F2_CATEGORY_HINT_ROLE}`);
  if (!DISCOVERY_UNIVERSE_STATES.has(snapshot.discoverySourceUniverseState)) errors.push("discoverySourceUniverseState must be SOURCE_EXHAUSTED or LIMIT_REACHED");

  for (const [field, expected] of Object.entries({
    categoryMetadataRevisionPinned: false,
    hardMetadataInferenceAuthorized: false,
    authenticityInferenceAuthorized: false,
    trendInferenceAuthorized: false,
    nutritionAuthorityAuthorized: false,
    runtimeActivationAuthorized: false
  })) {
    if (snapshot[field] !== expected) errors.push(`${field} must remain false`);
  }

  if (typeof snapshot.discoverySourceUniverseComplete !== "boolean") {
    errors.push("discoverySourceUniverseComplete must be boolean");
  } else if (snapshot.discoverySourceUniverseComplete !== (snapshot.discoverySourceUniverseState === "SOURCE_EXHAUSTED")) {
    errors.push("discoverySourceUniverseComplete must agree with discoverySourceUniverseState");
  }
  if (!Number.isInteger(snapshot.discoveryRecordCount) || snapshot.discoveryRecordCount < 0) errors.push("discoveryRecordCount must be a non-negative integer");
  if (!Array.isArray(snapshot.records)) return [...errors, "records must be an array"];
  if (snapshot.categoryRecordCount !== snapshot.records.length) errors.push("categoryRecordCount must equal records.length");
  if (snapshot.discoveryRecordCount !== snapshot.records.length) errors.push("category hints must retain one row per discovery record");

  const pageids = new Set();
  let anomalyCount = 0;
  let titleDriftCount = 0;
  let totalCategoryHintCount = 0;

  for (const record of snapshot.records) {
    const label = `pageid ${record?.pageid ?? "missing"}`;
    if (!Number.isInteger(record?.pageid) || record.pageid <= 0) errors.push(`${label}: positive integer pageid is required`);
    if (pageids.has(record?.pageid)) errors.push(`${label}: duplicate pageid`);
    pageids.add(record?.pageid);
    if (!isNonEmptyString(record?.discoveryTitle) || !record.discoveryTitle.startsWith("Cookbook:")) errors.push(`${label}: discoveryTitle must be a Cookbook title`);
    if (!Number.isInteger(record?.discoveryRevisionId) || record.discoveryRevisionId <= 0) errors.push(`${label}: discoveryRevisionId must be a positive integer`);
    if (!isIsoDateTime(record?.discoveryRevisionTimestamp)) errors.push(`${label}: discoveryRevisionTimestamp must be an ISO date-time`);
    if (!PAGE_STATES.has(record?.categoryFetchState)) errors.push(`${label}: invalid categoryFetchState`);

    if (record?.categoryFetchState === "PRESENT") {
      if (!isNonEmptyString(record?.categoryQueryTitle) || !record.categoryQueryTitle.startsWith("Cookbook:")) {
        errors.push(`${label}: PRESENT rows require a Cookbook categoryQueryTitle`);
      }
    } else if (record?.categoryQueryTitle !== null) {
      errors.push(`${label}: non-PRESENT rows must keep categoryQueryTitle null`);
    }

    const expectedTitleDrift = record?.categoryQueryTitle === null ? false : record.categoryQueryTitle !== record.discoveryTitle;
    if (record?.titleChangedSinceDiscovery !== expectedTitleDrift) errors.push(`${label}: titleChangedSinceDiscovery must match title comparison`);
    if (expectedTitleDrift) titleDriftCount += 1;
    if (record?.categoryFetchState !== "PRESENT") anomalyCount += 1;

    if (!Array.isArray(record?.categories)) {
      errors.push(`${label}: categories must be an array`);
      continue;
    }
    const expectedCategories = [...record.categories].sort((a, b) => String(a).localeCompare(String(b)));
    if (JSON.stringify(record.categories) !== JSON.stringify(expectedCategories)) errors.push(`${label}: categories must be sorted`);
    if (new Set(record.categories).size !== record.categories.length) errors.push(`${label}: categories must be unique`);
    for (const category of record.categories) {
      if (!isNonEmptyString(category) || !category.startsWith("Category:")) errors.push(`${label}: category hints must retain exact Category: titles`);
    }
    if (record.categoryCount !== record.categories.length) errors.push(`${label}: categoryCount must equal categories.length`);
    if (record?.categoryFetchState !== "PRESENT" && record.categories.length !== 0) errors.push(`${label}: non-PRESENT rows must not retain category hints`);
    totalCategoryHintCount += record.categories.length;

    for (const field of [
      "categoryMetadataRevisionPinned",
      "maySetCoverageMetadata",
      "mayAuthorizeRecommendation",
      "mayAuthorizeAuthenticityClaim",
      "mayAuthorizeTrendClaim",
      "runtimeActivationAuthorized"
    ]) {
      if (record?.[field] !== false) errors.push(`${label}: ${field} must remain false`);
    }
  }

  if (snapshot.categoryFetchAnomalyCount !== anomalyCount) errors.push("categoryFetchAnomalyCount must match record states");
  if (snapshot.titleDriftCount !== titleDriftCount) errors.push("titleDriftCount must match record title comparisons");
  if (snapshot.totalCategoryHintCount !== totalCategoryHintCount) errors.push("totalCategoryHintCount must match category arrays");

  return errors;
}

export function assertValidGateF2CategoryHintSnapshot(snapshot) {
  const errors = validateGateF2CategoryHintSnapshot(snapshot);
  if (errors.length) throw new Error(`Invalid Gate F2 category-hint snapshot:\n- ${errors.join("\n- ")}`);
  return snapshot;
}

export async function fetchGateF2CategoryHints(discovery, {
  fetchImpl = fetch,
  batchSize = DEFAULT_BATCH_SIZE,
  acquiredAt = new Date().toISOString()
} = {}) {
  assertValidGateF2DiscoverySnapshot(discovery);
  if (typeof fetchImpl !== "function") throw new Error("fetchImpl must be a function");
  if (!Number.isInteger(batchSize) || batchSize <= 0 || batchSize > 50) {
    throw new Error("batchSize must be an integer between 1 and 50");
  }

  const categoryPages = [];
  const pageids = discovery.records.map(record => record.pageid);

  for (let offset = 0; offset < pageids.length; offset += batchSize) {
    const batch = pageids.slice(offset, offset + batchSize);
    let continuation = null;
    const seenContinuations = new Set();

    do {
      const response = await fetchImpl(buildCategoryUrl(batch, continuation), {
        headers: {
          "user-agent": "culinary-recommender-gate-f2-category-hints/1.0"
        }
      });
      if (!response?.ok) {
        throw new Error(`Wikibooks category-hint request failed: ${response?.status ?? "unknown"} ${response?.statusText ?? ""}`.trim());
      }
      const payload = await response.json();
      for (const page of payload.query?.pages || []) categoryPages.push(page);

      const next = payload.continue || null;
      if (next) {
        const signature = continuationSignature(next);
        if (seenContinuations.has(signature)) {
          throw new Error(`Repeated Wikibooks category continuation for batch starting pageid ${batch[0]}`);
        }
        seenContinuations.add(signature);
      }
      continuation = next;
    } while (continuation);
  }

  return buildGateF2CategoryHintSnapshot(discovery, categoryPages, { acquiredAt });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const discovery = JSON.parse(await readFile(resolve(args.input), "utf8"));
  const snapshot = await fetchGateF2CategoryHints(discovery, { batchSize: args.batchSize });
  const outputPath = resolve(args.output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: outputPath,
    categoryRecordCount: snapshot.categoryRecordCount,
    totalCategoryHintCount: snapshot.totalCategoryHintCount,
    categoryFetchAnomalyCount: snapshot.categoryFetchAnomalyCount,
    titleDriftCount: snapshot.titleDriftCount,
    discoverySourceUniverseComplete: snapshot.discoverySourceUniverseComplete,
    runtimeActivationAuthorized: snapshot.runtimeActivationAuthorized
  }, null, 2));
}
