import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import { ORA_BW_SOURCE, parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";
import { ORA_TURABI_SOURCE } from "./corpus-scale-step8g-ora-turabi-core.mjs";
import { ORA_RIGAUD_SOURCE } from "./corpus-scale-step8g-ora-rigaud-core.mjs";
import { ORA_MENON_1801_SOURCE, measureOraMenon1801Candidate } from "./corpus-scale-step8g-ora-menon-1801-core.mjs";

const ORA_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const FORKRECIPE_COMMIT = "c32255266af39bd77444d39452f3df8088ac8fd9";
const UNITOOLS_COMMIT = "1d09e9548d957dd0375301146a86dddf5e269c1b";
const CC0_COMMIT = "b12e481d1c220a13e0847a34e148d5872a16928e";
const EXPECTED_V8008_COUNT = 10171;

const ABBOTT = Object.freeze({
  collection: "australian-table",
  source_url: "https://archive.org/details/b21505524",
  source_title: "The English and Australian Cookery Book",
  author: "Edward Abbott",
  source_year: "1864",
  license: "public-domain",
  expectedRecipeCount: 713
});

const COCINA_SOURCES = Object.freeze([
  Object.freeze({
    collection: "cocina-mexicana",
    source_url: "https://archive.org/details/bub_gb_NdQqAAAAYAAJ",
    source_title: "Diccionario de cocina, ó El nuevo cocinero mexicano",
    author: "Mariano Galván Rivera",
    source_year: "1845",
    license: "public-domain",
    expectedRecipeCount: 4347
  }),
  Object.freeze({
    collection: "cocina-mexicana",
    source_url: "https://archive.org/details/lacocinerapobla00unkngoog",
    source_title: "La cocinera poblana",
    author: "",
    source_year: "1890",
    license: "public-domain",
    expectedRecipeCount: 2129
  })
]);

function parseArgs(argv) {
  const out = { ora: null, forkrecipe: null, unitools: null, cc0: null, rightsDoc: null, output: ".tmp/step8g-menon-1801-measurement" };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) out.ora = arg.slice(6);
    else if (arg.startsWith("--forkrecipe=")) out.forkrecipe = arg.slice(13);
    else if (arg.startsWith("--unitools=")) out.unitools = arg.slice(11);
    else if (arg.startsWith("--cc0=")) out.cc0 = arg.slice(6);
    else if (arg.startsWith("--rights-doc=")) out.rightsDoc = arg.slice(13);
    else if (arg.startsWith("--out=")) out.output = arg.slice(6) || out.output;
    else throw new Error(`UNKNOWN_ARGUMENT_${arg}`);
  }
  for (const key of ["ora", "forkrecipe", "unitools", "cc0", "rightsDoc"]) if (!out[key]) throw new Error(`REQUIRED_${key.toUpperCase()}`);
  return out;
}

function commitAt(root) { return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
async function readJsonl(path) { return (await readFile(path, "utf8")).split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)); }
async function loadFork(root) {
  const files = (await readdir(resolve(root, "recipes"))).filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js").sort();
  const out = [];
  for (const file of files) out.push((await import(pathToFileURL(resolve(root, "recipes", file)).href)).default);
  return out;
}
async function loadCc0(root) {
  const files = (await readdir(resolve(root, "src"))).filter(file => file.endsWith(".md")).sort();
  const out = [];
  for (const file of files) out.push(parseCc0MarkdownRecipe(await readFile(resolve(root, "src", file), "utf8"), { fileName: file }));
  return out;
}
function exact(row, source) {
  return row.collection === source.collection &&
    row.source_url === (source.sourceUrl ?? source.source_url) &&
    row.source_title === (source.sourceTitle ?? source.source_title) &&
    row.author === (source.sourceAuthor ?? source.author) &&
    String(row.source_year) === String(source.sourceYear ?? source.source_year) &&
    row.license === source.license;
}

const options = parseArgs(process.argv.slice(2));
const roots = Object.fromEntries(Object.entries({ ora: options.ora, forkrecipe: options.forkrecipe, unitools: options.unitools, cc0: options.cc0 }).map(([key, value]) => [key, resolve(value)]));
const pins = Object.fromEntries(Object.entries(roots).map(([key, root]) => [key, commitAt(root)]));
if (pins.ora !== ORA_COMMIT) throw new Error(`ORA_PIN_${pins.ora}`);
if (pins.forkrecipe !== FORKRECIPE_COMMIT) throw new Error(`FORKRECIPE_PIN_${pins.forkrecipe}`);
if (pins.unitools !== UNITOOLS_COMMIT) throw new Error(`UNITOOLS_PIN_${pins.unitools}`);
if (pins.cc0 !== CC0_COMMIT) throw new Error(`CC0_PIN_${pins.cc0}`);

const [
  forkRecipes,
  unitoolsDataset,
  cc0Recipes,
  australianRows,
  japaneseRows,
  turabiRows,
  portugueseRows,
  cocinaRows,
  frenchRows,
  rightsDoc,
  oraLicense
] = await Promise.all([
  loadFork(roots.forkrecipe),
  readFile(resolve(roots.unitools, "unitools-recipes-v1.json"), "utf8").then(JSON.parse),
  loadCc0(roots.cc0),
  readJsonl(resolve(roots.ora, "collections/australian-table/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/japanese-kitchen/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/ottoman-turkish/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/cozinha-portuguesa/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/cocina-mexicana/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/cuisine-francaise/recipes.jsonl")),
  readFile(resolve(options.rightsDoc), "utf8"),
  readFile(resolve(roots.ora, "LICENSE.md"), "utf8")
]);

if (!Array.isArray(unitoolsDataset.recipes) || unitoolsDataset.recipes.length !== 501) throw new Error("UNITOOLS_BASELINE_COUNT");
if (forkRecipes.length !== 915) throw new Error("FORKRECIPE_BASELINE_COUNT");
if (cc0Recipes.length !== 226) throw new Error("CC0_BASELINE_COUNT");

const abbottRows = australianRows.filter(row => exact(row, ABBOTT));
const bwRows = japaneseRows.filter(row => exact(row, ORA_BW_SOURCE));
const turabiExact = turabiRows.filter(row => exact(row, ORA_TURABI_SOURCE));
const rigaudRows = portugueseRows.filter(row => exact(row, ORA_RIGAUD_SOURCE));
const cocinaExact = COCINA_SOURCES.flatMap(source => cocinaRows.filter(row => exact(row, source)));
const candidateRows = frenchRows.filter(row => exact(row, ORA_MENON_1801_SOURCE));

if (abbottRows.length !== ABBOTT.expectedRecipeCount) throw new Error(`ABBOTT_${abbottRows.length}`);
if (bwRows.length !== ORA_BW_SOURCE.expectedRecipeCount) throw new Error(`BW_${bwRows.length}`);
if (turabiExact.length !== ORA_TURABI_SOURCE.expectedRecipeCount) throw new Error(`TURABI_${turabiExact.length}`);
if (rigaudRows.length !== ORA_RIGAUD_SOURCE.expectedRecipeCount) throw new Error(`RIGAUD_${rigaudRows.length}`);
if (cocinaExact.length !== COCINA_SOURCES.reduce((sum, source) => sum + source.expectedRecipeCount, 0)) throw new Error(`COCINA_${cocinaExact.length}`);
if (candidateRows.length !== ORA_MENON_1801_SOURCE.expectedRecipeCount) throw new Error(`MENON_${candidateRows.length}`);

const protectedBaseline = [
  ...unitoolsDataset.recipes,
  ...forkRecipes,
  ...cc0Recipes,
  ...abbottRows.map(parseOraJsonlRecipe),
  ...bwRows.map(parseOraJsonlRecipe),
  ...turabiExact.map(parseOraJsonlRecipe),
  ...rigaudRows.map(parseOraJsonlRecipe),
  ...cocinaExact.map(parseOraJsonlRecipe)
];
if (protectedBaseline.length !== EXPECTED_V8008_COUNT) throw new Error(`V8008_BASELINE_${protectedBaseline.length}`);

const baselineRecipes = [...PUBLIC_RUNTIME_RECIPES, ...protectedBaseline];
const repositoryReusePass = /unlicense/i.test(oraLicense) && /free and unencumbered software released into the public domain/i.test(oraLicense);
const attributionClassified = rightsDoc.includes("CLASSIFIED_READY_FOR_PRIVATE_CORPUS__UI_DISPLAY_STILL_DOWNSTREAM_TEST_REQUIRED");
const rightsDocumented = rightsDoc.includes(ORA_MENON_1801_SOURCE.rightsMarker);

const result = measureOraMenon1801Candidate({
  candidateRows,
  baselineRecipes,
  rightsDocumented,
  repositoryReusePass,
  attributionClassified
});

const output = {
  ...result,
  date: "2026-09-18",
  sourceRepository: "AdamBouhmad/open-recipe-archive",
  sourceCommit: ORA_COMMIT,
  sourcePins: {
    openRecipeArchive: pins.ora,
    forkrecipeBaseline: pins.forkrecipe,
    unitoolsBaseline: pins.unitools,
    cc0Baseline: pins.cc0
  },
  publicRuntimeRecipeCount: PUBLIC_RUNTIME_RECIPES.length
};

await mkdir(resolve(options.output), { recursive: true });
await writeFile(resolve(options.output, "measurement.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  pass: output.pass,
  terminal: output.terminal,
  baseline: output.baseline,
  candidate: output.candidate,
  gates: output.gates,
  nextAuthority: output.nextAuthority,
  boundaries: output.boundaries
}, null, 2)}\n`);
