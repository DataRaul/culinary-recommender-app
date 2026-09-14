import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { FORKRECIPE_STEP7E_EXPECTED_COMMIT, FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT } from "./forkrecipe-step7e-core.mjs";
import { measureStep8GForkRecipeMarginalValue } from "./corpus-scale-step8g-core.mjs";

const UNITOOLS_EXPECTED_COMMIT = "1d09e9548d957dd0375301146a86dddf5e269c1b";
const UNITOOLS_DATA_FILE = "unitools-recipes-v1.json";
const UNITOOLS_EXPECTED_COUNT = 501;

function parseArgs(argv) {
  const options = { forkrecipe: null, unitools: null, auditSummary: null, output: ".tmp/step8g-forkrecipe-measurement" };
  for (const arg of argv) {
    if (arg.startsWith("--forkrecipe=")) options.forkrecipe = arg.slice("--forkrecipe=".length);
    else if (arg.startsWith("--unitools=")) options.unitools = arg.slice("--unitools=".length);
    else if (arg.startsWith("--audit-summary=")) options.auditSummary = arg.slice("--audit-summary=".length);
    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length) || options.output;
  }
  if (!options.forkrecipe || !options.unitools || !options.auditSummary) {
    throw new Error("--forkrecipe, --unitools and --audit-summary are required");
  }
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function loadForkEntries(root) {
  const recipesDir = resolve(root, "recipes");
  const files = (await readdir(recipesDir))
    .filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js")
    .sort();
  const entries = [];
  for (const fileName of files) {
    const mod = await import(pathToFileURL(resolve(recipesDir, fileName)).href);
    entries.push({ fileName, recipe: mod.default });
  }
  return entries;
}

const args = parseArgs(process.argv.slice(2));
const forkRoot = resolve(args.forkrecipe);
const unitoolsRoot = resolve(args.unitools);
const outputRoot = resolve(args.output);

const forkCommit = commitAt(forkRoot);
const unitoolsCommit = commitAt(unitoolsRoot);
if (forkCommit !== FORKRECIPE_STEP7E_EXPECTED_COMMIT) throw new Error(`FORKRECIPE_PIN_MISMATCH_${forkCommit}`);
if (unitoolsCommit !== UNITOOLS_EXPECTED_COMMIT) throw new Error(`UNITOOLS_PIN_MISMATCH_${unitoolsCommit}`);

const [forkEntries, unitoolsDataset, audit] = await Promise.all([
  loadForkEntries(forkRoot),
  readFile(resolve(unitoolsRoot, UNITOOLS_DATA_FILE), "utf8").then(JSON.parse),
  readFile(resolve(args.auditSummary), "utf8").then(JSON.parse)
]);

if (forkEntries.length !== FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT) {
  throw new Error(`FORKRECIPE_EXPECTED_${FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT}_GOT_${forkEntries.length}`);
}
if (!Array.isArray(unitoolsDataset.recipes) || unitoolsDataset.recipes.length !== UNITOOLS_EXPECTED_COUNT) {
  throw new Error(`UNITOOLS_EXPECTED_${UNITOOLS_EXPECTED_COUNT}_RECIPES`);
}

const rightsAuditPass = audit?.rightsEvidence?.pass === true;
const sourceQualityPass = audit?.decisions?.admittedProtectedSourcePilotOnly === FORKRECIPE_STEP7E_EXPECTED_RECIPE_COUNT
  && audit?.decisions?.held === 0
  && audit?.decisions?.rejected === 0;

const measurement = measureStep8GForkRecipeMarginalValue({
  forkEntries,
  unitoolsDataset,
  publicRecipes: ALL_RECIPES,
  rightsAuditPass,
  sourceQualityPass
});

const result = {
  ...measurement,
  date: "2026-09-14",
  sourcePins: {
    forkrecipe: { repository: "futurechef/forkrecipe-recipes", commit: forkCommit, recordCount: forkEntries.length },
    unitools: { repository: "farcrak/unitools-recipes", commit: unitoolsCommit, recordCount: unitoolsDataset.recipes.length }
  },
  interpretation: measurement.pass
    ? "ForkRecipe adds sufficient measured marginal coverage to advance to a separately governed protected-ingestion design. This result does not itself authorize D1 writes or Step 8F."
    : "ForkRecipe does not currently justify protected ingestion under the Step 8G marginal-value gate. This is a valid stop outcome and does not authorize Step 8F."
};

await mkdir(outputRoot, { recursive: true });
await writeFile(resolve(outputRoot, "measurement.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
