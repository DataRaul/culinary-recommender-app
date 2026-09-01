import { readFile } from "node:fs/promises";
import { gateF2CoverageReport } from "./wikibooks-gate-f2-contract.mjs";

const ledger = JSON.parse(
  await readFile(new URL("./wikibooks-gate-f2-review-ledger.json", import.meta.url), "utf8")
);

console.log(JSON.stringify(gateF2CoverageReport(ledger), null, 2));
