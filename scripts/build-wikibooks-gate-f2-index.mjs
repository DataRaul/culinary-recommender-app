import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildGateF2CompactIndex } from "./wikibooks-gate-f2-contract.mjs";

const DEFAULT_OUTPUT = "data/generated/wikibooks-gate-f2-index-v1.json";
const outputArg = process.argv.find(arg => arg.startsWith("--output="));
const outputPath = resolve(outputArg ? outputArg.slice("--output=".length) : DEFAULT_OUTPUT);

const ledger = JSON.parse(
  await readFile(new URL("./wikibooks-gate-f2-review-ledger.json", import.meta.url), "utf8")
);
const index = buildGateF2CompactIndex(ledger);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  output: outputPath,
  admittedRecordCount: index.admittedRecordCount,
  rejectedRecordCount: index.rejectedRecordCount,
  runtimeActivationAuthorized: index.runtimeActivationAuthorized
}, null, 2));
