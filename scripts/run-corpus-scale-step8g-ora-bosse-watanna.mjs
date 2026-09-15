import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import {
  ORA_BW_SOURCE,
  ORA_BW_CANDIDATE_TERMINAL,
  measureOraBosseWatannaCandidate,
  parseOraJsonlRecipe
} from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";

const FORKRECIPE_EXPECTED_COMMIT = "c32255266af39bd77444d39452f3df8088ac8fd9";
const UNITOOLS_EXPECTED_COMMIT = "1d09e9548d957dd0375301146a86dddf5e269c1b";
const SYLGAUTHIER_EXPECTED_COMMIT = "b12e481d1c220a13e0847a34e148d5872a16928e";
const UNITOOLS_DATA_FILE = "unitools-recipes-v1.json";
const UNITOOLS_EXPECTED_COUNT = 501;
const FORKRECIPE_EXPECTED_COUNT = 915;
const CC0_EXPECTED_COUNT = 226;
const ABBOTT_EXPECTED_COUNT = 713;
const ABBOTT_SOURCE_URL = "https://archive.org/details/b21505524";
const ABBOTT_SOURCE_TITLE = "The English and Australian Cookery Book";
const ABBOTT_SOURCE_AUTHOR = "Edward Abbott";
const ABBOTT_SOURCE_YEAR = "1864";

function parseArgs(argv) {
  const options = {
    ora: null,
    forkrecipe: null,
    unitools: null,
    cc0: null,
    rightsDoc: null,
    output: ".tmp/step8g-ora-bosse-watanna-measurement"
  };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) options.ora = arg.slice("--ora=".length);
    else if (arg.startsWith("--forkrecipe=")) options.forkrecipe = arg.slice("--forkrecipe=".length);
    else if (arg.startsWith("--unitools=")) options.unitools = arg.slice("--unitools=".length);
    else if (arg.startsWith("--cc0=")) options.cc0 = arg.slice("--cc0=".length);
    else if (arg.startsWith("--rights-doc=")) options.rightsDoc = arg.slice("--rights-doc=".length);
    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length) || options.output;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  for (const required of ["ora", "forkrecipe", "unitools", "cc0", "rightsDoc"]) {
    if (!options[required]) throw new Error(`--${required === "rightsDoc" ? "rights-doc" : required} is required`);
  }
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function readJsonl(path) {
  return (await readFile(path, "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

async function loadCandidateAndAbbottBaseline(oraRoot) {
  const candidateRows = await readJsonl(resolve(oraRoot, "collections/japanese-kitchen/recipes.jsonl"));
  const candidateRecipes = candidateRows.map(parseOraJsonlRecipe);

  const australianRows = await readJsonl(resolve(oraRoot, "collections/australian-table/recipes.jsonl"));
  const abbottRecipes = australianRows
    .filter(row =>
      row.source_url === ABBOTT_SOURCE_URL &&
      row.source_title === ABBOTT_SOURCE_TITLE &&
      row.author === ABBOTT_SOURCE_AUTHOR &&
      String(row.source_year) === ABBOTT_SOURCE_YEAR &&
      row.license === "public-domain"
    )
    .map(parseOraJsonlRecipe);

  return { candidateRecipes, abbottRecipes };
}

async function loadForkRecipes(root) {
  const recipesDir = resolve(root, "recipes");
  const files = (await readdir(recipesDir))
    .filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js")
    .sort();
  const recipes = [];
  for (const fileName of files) {
    const mod = await import(pathToFileURL(resolve(recipesDir, fileName)).href);
    recipes.push(mod.default);
  }
  return recipes;
}

async function loadCc0Recipes(root) {
  const sourceDir = resolve(root, "src");
  const files = (await readdir(sourceDir)).filter(file => file.endsWith(".md")).sort();
  const recipes = [];
  for (const fileName of files) {
    const markdown = await readFile(resolve(sourceDir, fileName), "utf8");
    recipes.push(parseCc0MarkdownRecipe(markdown, { fileName }));
  }
  return recipes;
}

const args = parseArgs(process.argv.slice(2));
const oraRoot = resolve(args.ora);
const forkRoot = resolve(args.forkrecipe);
const unitoolsRoot = resolve(args.unitools);
const cc0Root = resolve(args.cc0);
const rightsDocPath = resolve(args.rightsDoc);
const outputRoot = resolve(args.output);

const pins = {
  ora: commitAt(oraRoot),
  forkrecipe: commitAt(forkRoot),
  unitools: commitAt(unitoolsRoot),
  cc0: commitAt(cc0Root)
};
if (pins.ora !== ORA_BW_SOURCE.commit) throw new Error(`ORA_PIN_MISMATCH_${pins.ora}`);
if (pins.forkrecipe !== FORKRECIPE_EXPECTED_COMMIT) throw new Error(`FORKRECIPE_PIN_MISMATCH_${pins.forkrecipe}`);
if (pins.unitools !== UNITOOLS_EXPECTED_COMMIT) throw new Error(`UNITOOLS_PIN_MISMATCH_${pins.unitools}`);
if (pins.cc0 !== SYLGAUTHIER_EXPECTED_COMMIT) throw new Error(`CC0_PIN_MISMATCH_${pins.cc0}`);

const [oraLayers, forkRecipes, unitoolsDataset, cc0Recipes, rightsDoc] = await Promise.all([
  loadCandidateAndAbbottBaseline(oraRoot),
  loadForkRecipes(forkRoot),
  readFile(resolve(unitoolsRoot, UNITOOLS_DATA_FILE), "utf8").then(JSON.parse),
  loadCc0Recipes(cc0Root),
  readFile(rightsDocPath, "utf8")
]);

if (!Array.isArray(unitoolsDataset.recipes) || unitoolsDataset.recipes.length !== UNITOOLS_EXPECTED_COUNT) throw new Error(`UNITOOLS_EXPECTED_${UNITOOLS_EXPECTED_COUNT}_RECIPES`);
if (forkRecipes.length !== FORKRECIPE_EXPECTED_COUNT) throw new Error(`FORKRECIPE_EXPECTED_${FORKRECIPE_EXPECTED_COUNT}_RECIPES`);
if (cc0Recipes.length !== CC0_EXPECTED_COUNT) throw new Error(`CC0_EXPECTED_${CC0_EXPECTED_COUNT}_RECIPES`);
if (oraLayers.abbottRecipes.length !== ABBOTT_EXPECTED_COUNT) throw new Error(`ABBOTT_EXPECTED_${ABBOTT_EXPECTED_COUNT}_RECIPES`);
if (oraLayers.candidateRecipes.length !== ORA_BW_SOURCE.expectedRecipeCount) throw new Error(`BOSSE_WATANNA_EXPECTED_${ORA_BW_SOURCE.expectedRecipeCount}_RECIPES`);

const rightsDocumented = rightsDoc.includes(ORA_BW_SOURCE.rightsMarker);
const measurement = measureOraBosseWatannaCandidate({
  candidateRecipes: oraLayers.candidateRecipes,
  publicRecipes: PUBLIC_RUNTIME_RECIPES,
  unitoolsRecipes: unitoolsDataset.recipes,
  forkRecipes,
  cc0Recipes,
  abbottRecipes: oraLayers.abbottRecipes,
  rightsDocumented
});

if (measurement.baseline.protectedComposedRecipeCount !== 2355 || measurement.baseline.expectedActiveProtectedVersion !== "v8004") {
  throw new Error("V8004_BASELINE_RECONCILIATION_FAILED");
}

const result = {
  ...measurement,
  date: "2026-09-15",
  sourcePins: {
    openRecipeArchive: { repository: ORA_BW_SOURCE.repository, commit: pins.ora },
    forkrecipeBaseline: { repository: "futurechef/forkrecipe-recipes", commit: pins.forkrecipe, recipeCount: forkRecipes.length },
    unitoolsBaseline: { repository: "farcrak/unitools-recipes", commit: pins.unitools, recipeCount: unitoolsDataset.recipes.length },
    cc0Baseline: { repository: "sylGauthier/recipes", commit: pins.cc0, recipeCount: cc0Recipes.length },
    abbottBaseline: { repository: ORA_BW_SOURCE.repository, commit: pins.ora, recipeCount: oraLayers.abbottRecipes.length }
  },
  interpretation: measurement.pass
    ? "The exact 109-record Bosse/Watanna 1914 Japanese-shelf cohort clears the no-write Step 8G marginal-value measurement against active protected v8004. A separate v8005 prewrite/capacity gate remains mandatory; cultural source labels stay non-authoritative."
    : "The exact Bosse/Watanna 1914 Japanese-shelf cohort does not clear the Step 8G measurement gate. No D1 mutation, public admission, topology expansion, D1-budget expansion or billing expansion is authorized."
};

await mkdir(outputRoot, { recursive: true });
await writeFile(resolve(outputRoot, "measurement.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

if (measurement.pass && measurement.terminal !== ORA_BW_CANDIDATE_TERMINAL) throw new Error("UNEXPECTED_PASS_TERMINAL");
