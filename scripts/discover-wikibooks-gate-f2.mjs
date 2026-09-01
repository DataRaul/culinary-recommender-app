import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { GATE_F2_SOURCE } from "./wikibooks-gate-f2-contract.mjs";

const DEFAULT_LIMIT = 5000;
const DEFAULT_OUTPUT = ".cache/wikibooks-gate-f2-discovery.json";

function parseArgs(argv) {
  const args = { limit: DEFAULT_LIMIT, output: DEFAULT_OUTPUT };
  for (const arg of argv) {
    if (arg.startsWith("--limit=")) {
      const value = Number.parseInt(arg.slice("--limit=".length), 10);
      if (!Number.isInteger(value) || value <= 0 || value > 10000) {
        throw new Error("--limit must be an integer between 1 and 10000");
      }
      args.limit = value;
    } else if (arg.startsWith("--output=")) {
      const value = arg.slice("--output=".length).trim();
      if (!value) throw new Error("--output cannot be empty");
      args.output = value;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "culinary-recommender-gate-f2-metadata-discovery/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Wikibooks API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function buildUrl(continuation = null) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "categorymembers",
    gcmtitle: GATE_F2_SOURCE.category,
    gcmtype: "page",
    gcmlimit: "max",
    prop: "revisions",
    rvprop: "ids|timestamp"
  });
  if (continuation?.gcmcontinue) params.set("gcmcontinue", continuation.gcmcontinue);
  if (continuation?.continue) params.set("continue", continuation.continue);
  return `${GATE_F2_SOURCE.api}?${params}`;
}

function normalizePage(page) {
  const revision = page.revisions?.[0];
  if (!Number.isInteger(page.pageid) ||
      typeof page.title !== "string" ||
      !page.title.startsWith("Cookbook:") ||
      !Number.isInteger(revision?.revid) ||
      !revision?.timestamp) {
    return null;
  }

  return {
    id: `wikibooks_discovery_${page.pageid}`,
    pageid: page.pageid,
    title: page.title,
    revid: revision.revid,
    timestamp: revision.timestamp,
    reviewState: "DISCOVERED_UNREVIEWED",
    recommendationState: "NOT_APPLICABLE",
    hardMetadataState: "NOT_REVIEWED",
    ingredientMappingState: "NOT_REVIEWED",
    nutritionState: "NOT_APPLICABLE",
    runtimeArtifact: null,
    coverage: null
  };
}

export async function discoverWikibooksGateF2({ limit = DEFAULT_LIMIT } = {}) {
  const records = [];
  let continuation = null;

  do {
    const payload = await fetchJson(buildUrl(continuation));
    for (const page of payload.query?.pages || []) {
      const record = normalizePage(page);
      if (record) records.push(record);
      if (records.length >= limit) break;
    }
    continuation = payload.continue || null;
  } while (continuation && records.length < limit);

  records.sort((a, b) => a.pageid - b.pageid || a.revid - b.revid);

  const sourceUniverseComplete = continuation === null;
  const sourceUniverseState = sourceUniverseComplete ? "SOURCE_EXHAUSTED" : "LIMIT_REACHED";

  return {
    schemaVersion: "wikibooks-gate-f2-discovery-v1",
    source: GATE_F2_SOURCE,
    acquiredAt: new Date().toISOString(),
    acquisitionMode: "METADATA_AND_EXACT_REVISION_IDS_ONLY",
    requestedLimit: limit,
    returnedRecordCount: records.length,
    sourceUniverseState,
    sourceUniverseComplete,
    runtimeActivationAuthorized: false,
    records
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = resolve(args.output);
  const snapshot = await discoverWikibooksGateF2({ limit: args.limit });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: outputPath,
    returnedRecordCount: snapshot.returnedRecordCount,
    sourceUniverseState: snapshot.sourceUniverseState,
    sourceUniverseComplete: snapshot.sourceUniverseComplete,
    runtimeActivationAuthorized: snapshot.runtimeActivationAuthorized
  }, null, 2));
}
