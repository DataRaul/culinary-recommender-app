import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import { ORA_BW_SOURCE, parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";
import { ORA_TURABI_SOURCE } from "./corpus-scale-step8g-ora-turabi-core.mjs";
import { discoverOraNextSources, oraSourceKey } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

const ORA_EXPECTED_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const FORKRECIPE_EXPECTED_COMMIT = "c32255266af39bd77444d39452f3df8088ac8fd9";
const UNITOOLS_EXPECTED_COMMIT = "1d09e9548d957dd0375301146a86dddf5e269c1b";
const CC0_EXPECTED_COMMIT = "b12e481d1c220a13e0847a34e148d5872a16928e";
const UNITOOLS_DATA_FILE = "unitools-recipes-v1.json";
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
const EXPECTED_PROTECTED_COUNT = 2906;

function parseArgs(argv) {
  const options = { ora: null, forkrecipe: null, unitools: null, cc0: null, output: ".tmp/step8g-ora-next-source-discovery" };
  for (const arg of argv) {
    if (arg.startsWith("--ora=")) options.ora = arg.slice(6);
    else if (arg.startsWith("--forkrecipe=")) options.forkrecipe = arg.slice(13);
    else if (arg.startsWith("--unitools=")) options.unitools = arg.slice(11);
    else if (arg.startsWith("--cc0=")) options.cc0 = arg.slice(6);
    else if (arg.startsWith("--out=")) options.output = arg.slice(6) || options.output;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  for (const key of ["ora", "forkrecipe", "unitools", "cc0"]) if (!options[key]) throw new Error(`--${key} is required`);
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function readJsonl(path) {
  return (await readFile(path, "utf8")).split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
}

async function loadForkRecipes(root) {
  const files = (await readdir(resolve(root, "recipes")))
    .filter(file => file.endsWith(".js") && file !== "_template.js" && file !== "index.js")
    .sort();
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

function matchesIdentity(row, identity) {
  return row.collection === identity.collection &&
    row.source_url === identity.source_url &&
    row.source_title === identity.source_title &&
    row.author === identity.author &&
    String(row.source_year) === String(identity.source_year) &&
    row.license === identity.license;
}

function sourceIdentityRow(source) {
  return {
    collection: source.collection,
    source_url: source.sourceUrl,
    source_title: source.sourceTitle,
    author: source.sourceAuthor,
    source_year: source.sourceYear,
    license: source.license
  };
}

const args = parseArgs(process.argv.slice(2));
const roots = Object.fromEntries(Object.entries({ ora: args.ora, forkrecipe: args.forkrecipe, unitools: args.unitools, cc0: args.cc0 }).map(([k, v]) => [k, resolve(v)]));
const pins = Object.fromEntries(Object.entries(roots).map(([k, v]) => [k, commitAt(v)]));
if (pins.ora !== ORA_EXPECTED_COMMIT) throw new Error(`ORA_PIN_MISMATCH_${pins.ora}`);
if (pins.forkrecipe !== FORKRECIPE_EXPECTED_COMMIT) throw new Error(`FORKRECIPE_PIN_MISMATCH_${pins.forkrecipe}`);
if (pins.unitools !== UNITOOLS_EXPECTED_COMMIT) throw new Error(`UNITOOLS_PIN_MISMATCH_${pins.unitools}`);
if (pins.cc0 !== CC0_EXPECTED_COMMIT) throw new Error(`CC0_PIN_MISMATCH_${pins.cc0}`);

const [index, forkRecipes, unitoolsDataset, cc0Recipes] = await Promise.all([
  readFile(resolve(roots.ora, "index/collections.json"), "utf8").then(JSON.parse),
  loadForkRecipes(roots.forkrecipe),
  readFile(resolve(roots.unitools, UNITOOLS_DATA_FILE), "utf8").then(JSON.parse),
  loadCc0Recipes(roots.cc0)
]);
if (!Array.isArray(index) || index.length === 0) throw new Error("ORA_COLLECTION_INDEX_REQUIRED");
if (!Array.isArray(unitoolsDataset.recipes) || unitoolsDataset.recipes.length !== UNITOOLS_EXPECTED_COUNT) throw new Error("UNITOOLS_BASELINE_COUNT_MISMATCH");
if (forkRecipes.length !== FORKRECIPE_EXPECTED_COUNT) throw new Error("FORKRECIPE_BASELINE_COUNT_MISMATCH");
if (cc0Recipes.length !== CC0_EXPECTED_COUNT) throw new Error("CC0_BASELINE_COUNT_MISMATCH");

const allRows = [];
for (const entry of index) {
  const rows = await readJsonl(resolve(roots.ora, "collections", entry.slug, "recipes.jsonl"));
  allRows.push(...rows);
}

const abbottRows = allRows.filter(row => matchesIdentity(row, ABBOTT_IDENTITY));
const bwIdentity = sourceIdentityRow(ORA_BW_SOURCE);
const turabiIdentity = sourceIdentityRow(ORA_TURABI_SOURCE);
const bwRows = allRows.filter(row => matchesIdentity(row, bwIdentity));
const turabiRows = allRows.filter(row => matchesIdentity(row, turabiIdentity));
if (abbottRows.length !== ABBOTT_EXPECTED_COUNT) throw new Error(`ABBOTT_EXPECTED_${ABBOTT_EXPECTED_COUNT}_GOT_${abbottRows.length}`);
if (bwRows.length !== ORA_BW_SOURCE.expectedRecipeCount) throw new Error(`BOSSE_WATANNA_EXPECTED_${ORA_BW_SOURCE.expectedRecipeCount}_GOT_${bwRows.length}`);
if (turabiRows.length !== ORA_TURABI_SOURCE.expectedRecipeCount) throw new Error(`TURABI_EXPECTED_${ORA_TURABI_SOURCE.expectedRecipeCount}_GOT_${turabiRows.length}`);

const protectedBaseline = [
  ...unitoolsDataset.recipes,
  ...forkRecipes,
  ...cc0Recipes,
  ...abbottRows.map(parseOraJsonlRecipe),
  ...bwRows.map(parseOraJsonlRecipe),
  ...turabiRows.map(parseOraJsonlRecipe)
];
if (protectedBaseline.length !== EXPECTED_PROTECTED_COUNT) throw new Error(`V8006_PROTECTED_BASELINE_COUNT_${protectedBaseline.length}`);

const excludedSourceKeys = new Set([
  oraSourceKey(ABBOTT_IDENTITY),
  oraSourceKey(bwIdentity),
  oraSourceKey(turabiIdentity)
]);
const heldCollections = new Set(["cocina-espanola"]);
const result = discoverOraNextSources({
  collectionRows: allRows,
  baselineRecipes: [...PUBLIC_RUNTIME_RECIPES, ...protectedBaseline],
  excludedSourceKeys,
  heldCollections,
  activeProtectedVersion: "v8006",
  activeProtectedCount: EXPECTED_PROTECTED_COUNT
});

const output = {
  ...result,
  date: "2026-09-16",
  sourceRepository: "AdamBouhmad/open-recipe-archive",
  sourceCommit: pins.ora,
  collectionCount: index.length,
  sourcePins: {
    openRecipeArchive: pins.ora,
    forkrecipeBaseline: pins.forkrecipe,
    unitoolsBaseline: pins.unitools,
    cc0Baseline: pins.cc0
  },
  exclusions: {
    alreadyProtectedSources: 3,
    heldCollections: [...heldCollections],
    reason: "Previously protected exact sources are excluded. cocina-espanola remains excluded under the existing rights hold."
  },
  nextAuthority: result.rightsReviewEligibleCount > 0
    ? "SOURCE_SPECIFIC_DOCUMENTARY_RIGHTS_REVIEW_ONLY"
    : "NONE_STOP_OR_DISCOVER_OTHER_SOURCE_FAMILY"
};

await mkdir(resolve(args.output), { recursive: true });
await writeFile(resolve(args.output, "discovery.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  pass: output.pass,
  terminal: output.terminal,
  activeProtectedVersion: output.baseline.activeProtectedVersion,
  activeProtectedCount: output.baseline.activeProtectedCount,
  collectionCount: output.collectionCount,
  sourceGroupCount: output.sourceGroupCount,
  measuredCandidateCount: output.measuredCandidateCount,
  rightsReviewEligibleCount: output.rightsReviewEligibleCount,
  topCandidates: output.topRightsReviewCandidates.slice(0, 8).map(row => ({
    collection: row.collection,
    sourceTitle: row.sourceTitle,
    sourceAuthor: row.sourceAuthor,
    sourceYear: row.sourceYear,
    recipeCount: row.recipeCount,
    parseableRecipeRatio: row.parseableRecipeRatio,
    uniqueTitleRatio: row.uniqueTitleRatio,
    novelTitleRatio: row.novelTitleRatio,
    novelNormalizedTitleCount: row.novelNormalizedTitleCount,
    rightsReviewStatus: row.rightsReviewStatus
  })),
  nextAuthority: output.nextAuthority
}, null, 2)}\n`);
