import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import { ORA_BW_SOURCE, parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";
import { ORA_TURABI_SOURCE } from "./corpus-scale-step8g-ora-turabi-core.mjs";
import {
  ORA_RIGAUD_SOURCE,
  ORA_RIGAUD_CANDIDATE_TERMINAL,
  measureOraRigaudCandidate
} from "./corpus-scale-step8g-ora-rigaud-core.mjs";

const FORKRECIPE_EXPECTED_COMMIT = "c32255266af39bd77444d39452f3df8088ac8fd9";
const UNITOOLS_EXPECTED_COMMIT = "1d09e9548d957dd0375301146a86dddf5e269c1b";
const CC0_EXPECTED_COMMIT = "b12e481d1c220a13e0847a34e148d5872a16928e";
const UNITOOLS_EXPECTED_COUNT = 501;
const FORKRECIPE_EXPECTED_COUNT = 915;
const CC0_EXPECTED_COUNT = 226;
const ABBOTT_EXPECTED_COUNT = 713;
const ABBOTT_IDENTITY = Object.freeze({
  collection: "australian-table",
  source_url: "https://archive.org/details/b21505524",
  source_title: "The English and Australian Cookery Book",
  author: "Edward Abbott",
  source_year: "1864",
  license: "public-domain"
});

function parseArgs(argv) {
  const options = { ora: null, forkrecipe: null, unitools: null, cc0: null, rightsDoc: null, output: ".tmp/step8g-ora-rigaud-measurement" };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) options.ora = arg.slice(6);
    else if (arg.startsWith("--forkrecipe=")) options.forkrecipe = arg.slice(13);
    else if (arg.startsWith("--unitools=")) options.unitools = arg.slice(11);
    else if (arg.startsWith("--cc0=")) options.cc0 = arg.slice(6);
    else if (arg.startsWith("--rights-doc=")) options.rightsDoc = arg.slice(13);
    else if (arg.startsWith("--out=")) options.output = arg.slice(6) || options.output;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  for (const key of ["ora", "forkrecipe", "unitools", "cc0", "rightsDoc"]) if (!options[key]) throw new Error(`--${key === "rightsDoc" ? "rights-doc" : key} is required`);
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}
async function readJsonl(path) { return (await readFile(path, "utf8")).split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)); }
async function loadForkRecipes(root) {
  const files = (await readdir(resolve(root, "recipes"))).filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js").sort();
  const recipes = [];
  for (const fileName of files) recipes.push((await import(pathToFileURL(resolve(root, "recipes", fileName)).href)).default);
  return recipes;
}
async function loadCc0Recipes(root) {
  const files = (await readdir(resolve(root, "src"))).filter(file => file.endsWith(".md")).sort();
  const recipes = [];
  for (const fileName of files) recipes.push(parseCc0MarkdownRecipe(await readFile(resolve(root, "src", fileName), "utf8"), { fileName }));
  return recipes;
}
function matches(row, source) {
  return row.collection === source.collection && row.source_url === source.sourceUrl && row.source_title === source.sourceTitle && row.author === source.sourceAuthor && String(row.source_year) === source.sourceYear && row.license === source.license;
}
function matchesRaw(row, identity) {
  return row.collection === identity.collection && row.source_url === identity.source_url && row.source_title === identity.source_title && row.author === identity.author && String(row.source_year) === identity.source_year && row.license === identity.license;
}

const args = parseArgs(process.argv.slice(2));
const roots = { ora: resolve(args.ora), forkrecipe: resolve(args.forkrecipe), unitools: resolve(args.unitools), cc0: resolve(args.cc0) };
const pins = Object.fromEntries(Object.entries(roots).map(([key, root]) => [key, commitAt(root)]));
if (pins.ora !== ORA_RIGAUD_SOURCE.commit) throw new Error(`ORA_PIN_MISMATCH_${pins.ora}`);
if (pins.forkrecipe !== FORKRECIPE_EXPECTED_COMMIT) throw new Error(`FORKRECIPE_PIN_MISMATCH_${pins.forkrecipe}`);
if (pins.unitools !== UNITOOLS_EXPECTED_COMMIT) throw new Error(`UNITOOLS_PIN_MISMATCH_${pins.unitools}`);
if (pins.cc0 !== CC0_EXPECTED_COMMIT) throw new Error(`CC0_PIN_MISMATCH_${pins.cc0}`);

const [forkRecipes, unitoolsDataset, cc0Recipes, australianRows, japaneseRows, turabiRows, portugueseRows, rightsDoc] = await Promise.all([
  loadForkRecipes(roots.forkrecipe),
  readFile(resolve(roots.unitools, "unitools-recipes-v1.json"), "utf8").then(JSON.parse),
  loadCc0Recipes(roots.cc0),
  readJsonl(resolve(roots.ora, "collections/australian-table/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/japanese-kitchen/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/ottoman-turkish/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/cozinha-portuguesa/recipes.jsonl")),
  readFile(resolve(args.rightsDoc), "utf8")
]);
if (!Array.isArray(unitoolsDataset.recipes) || unitoolsDataset.recipes.length !== UNITOOLS_EXPECTED_COUNT) throw new Error("UNITOOLS_BASELINE_COUNT_MISMATCH");
if (forkRecipes.length !== FORKRECIPE_EXPECTED_COUNT) throw new Error("FORKRECIPE_BASELINE_COUNT_MISMATCH");
if (cc0Recipes.length !== CC0_EXPECTED_COUNT) throw new Error("CC0_BASELINE_COUNT_MISMATCH");

const abbottRecipes = australianRows.filter(row => matchesRaw(row, ABBOTT_IDENTITY)).map(parseOraJsonlRecipe);
const bosseWatannaRecipes = japaneseRows.filter(row => matches(row, ORA_BW_SOURCE)).map(parseOraJsonlRecipe);
const turabiRecipes = turabiRows.filter(row => matches(row, ORA_TURABI_SOURCE)).map(parseOraJsonlRecipe);
const candidateRows = portugueseRows.filter(row => matches(row, ORA_RIGAUD_SOURCE));
if (abbottRecipes.length !== ABBOTT_EXPECTED_COUNT) throw new Error("ABBOTT_BASELINE_COUNT_MISMATCH");
if (bosseWatannaRecipes.length !== ORA_BW_SOURCE.expectedRecipeCount) throw new Error("BOSSE_WATANNA_BASELINE_COUNT_MISMATCH");
if (turabiRecipes.length !== ORA_TURABI_SOURCE.expectedRecipeCount) throw new Error("TURABI_BASELINE_COUNT_MISMATCH");
if (candidateRows.length !== ORA_RIGAUD_SOURCE.expectedRecipeCount) throw new Error(`RIGAUD_EXPECTED_${ORA_RIGAUD_SOURCE.expectedRecipeCount}_GOT_${candidateRows.length}`);

const protectedBaseline = [
  ...unitoolsDataset.recipes,
  ...forkRecipes,
  ...cc0Recipes,
  ...abbottRecipes,
  ...bosseWatannaRecipes,
  ...turabiRecipes
];
if (protectedBaseline.length !== 2906) throw new Error(`V8006_BASELINE_RECONCILIATION_FAILED_${protectedBaseline.length}`);
const rightsDocumented = rightsDoc.includes(ORA_RIGAUD_SOURCE.rightsMarker);
const measurement = measureOraRigaudCandidate({
  candidateRows,
  baselineRecipes: [...PUBLIC_RUNTIME_RECIPES, ...protectedBaseline],
  rightsDocumented
});
if (measurement.baseline.activeProtectedVersion !== "v8006" || measurement.baseline.activeProtectedCount !== 2906) throw new Error("V8006_BASELINE_RECONCILIATION_FAILED");

const result = {
  ...measurement,
  date: "2026-09-16",
  sourcePins: {
    openRecipeArchive: { repository: ORA_RIGAUD_SOURCE.repository, commit: pins.ora },
    forkrecipeBaseline: { repository: "futurechef/forkrecipe-recipes", commit: pins.forkrecipe, recipeCount: forkRecipes.length },
    unitoolsBaseline: { repository: "farcrak/unitools-recipes", commit: pins.unitools, recipeCount: unitoolsDataset.recipes.length },
    cc0Baseline: { repository: "sylGauthier/recipes", commit: pins.cc0, recipeCount: cc0Recipes.length },
    abbottBaseline: { recipeCount: abbottRecipes.length },
    bosseWatannaBaseline: { recipeCount: bosseWatannaRecipes.length },
    turabiBaseline: { recipeCount: turabiRecipes.length }
  },
  discoveryEvidence: {
    workflowRun: 35094233571,
    artifactId: 10445970646,
    artifactDigest: "sha256:aa915c0905c8c28190dd0a093b1d8646e36a43ad28b17c77416acd512bf4a05d"
  },
  interpretation: measurement.pass
    ? "The exact 789-record Lucas Rigaud 1785 source clears the bounded Step 8G rights and marginal-value measurement against active protected v8006. Only a separate v8007 prewrite/capacity gate is earned."
    : "The exact Lucas Rigaud 1785 source does not clear the bounded Step 8G rights and marginal-value measurement. No prewrite or protected mutation is earned."
};

await mkdir(resolve(args.output), { recursive: true });
await writeFile(resolve(args.output, "measurement.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (measurement.pass && measurement.terminal !== ORA_RIGAUD_CANDIDATE_TERMINAL) throw new Error("UNEXPECTED_PASS_TERMINAL");
