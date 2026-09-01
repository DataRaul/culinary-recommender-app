import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildGateF2ReviewQueue } from "./wikibooks-gate-f2-review-queue.mjs";

const DEFAULT_DISCOVERY = ".cache/wikibooks-gate-f2-discovery.json";
const DEFAULT_OUTPUT = ".cache/wikibooks-gate-f2-review-queue.json";

const valueArg = (name, fallback) => {
  const arg = process.argv.find(item => item.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : fallback;
};

const discoveryPath = resolve(valueArg("--discovery", DEFAULT_DISCOVERY));
const outputPath = resolve(valueArg("--output", DEFAULT_OUTPUT));

const ledger = JSON.parse(
  await readFile(new URL("./wikibooks-gate-f2-review-ledger.json", import.meta.url), "utf8")
);
const discovery = JSON.parse(await readFile(discoveryPath, "utf8"));
const queue = buildGateF2ReviewQueue(ledger, discovery);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  output: outputPath,
  discoveredRecordCount: queue.discoveredRecordCount,
  discoverySourceUniverseState: queue.discoverySourceUniverseState,
  discoverySourceUniverseComplete: queue.discoverySourceUniverseComplete,
  unchangedTrackedRevisionCount: queue.unchangedTrackedRevisionCount,
  reviewQueueCount: queue.reviewQueueCount,
  queueReasonCounts: queue.queueReasonCounts,
  runtimeActivationAuthorized: queue.runtimeActivationAuthorized,
  automaticAdmissionAuthorized: queue.automaticAdmissionAuthorized
}, null, 2));
