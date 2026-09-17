import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import { ORA_BW_SOURCE, parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";
import { ORA_TURABI_SOURCE } from "./corpus-scale-step8g-ora-turabi-core.mjs";
import { ORA_RIGAUD_SOURCE } from "./corpus-scale-step8g-ora-rigaud-core.mjs";
import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

const ORA_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const FORKRECIPE_COMMIT = "c32255266af39bd77444d39452f3df8088ac8fd9";
const UNITOOLS_COMMIT = "1d09e9548d957dd0375301146a86dddf5e269c1b";
const CC0_COMMIT = "b12e481d1c220a13e0847a34e148d5872a16928e";
const EXPECTED_V8007_COUNT = 3695;
const COLLECTION = "cocina-mexicana";
const EXPECTED_COLLECTION_COUNT = 6476;

const ABBOTT = Object.freeze({
  collection: "australian-table",
  source_url: "https://archive.org/details/b21505524",
  source_title: "The English and Australian Cookery Book",
  author: "Edward Abbott",
  source_year: "1864",
  license: "public-domain",
  expectedRecipeCount: 713
});

const SOURCES = Object.freeze([
  Object.freeze({
    cohortId: "ORA_GALVAN_RIVERA_1845_DICCIONARIO_COCINA_AE3BD2C",
    collection: COLLECTION,
    source_url: "https://archive.org/details/bub_gb_NdQqAAAAYAAJ",
    source_title: "Diccionario de cocina, ó El nuevo cocinero mexicano",
    author: "Mariano Galván Rivera",
    source_year: "1845",
    license: "public-domain",
    expectedRecipeCount: 4347,
    rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_GALVAN_RIVERA_1845_DICCIONARIO_COCINA",
    documentedAnonymous: false
  }),
  Object.freeze({
    cohortId: "ORA_COCINERA_POBLANA_1890_ANONYMOUS_AE3BD2C",
    collection: COLLECTION,
    source_url: "https://archive.org/details/lacocinerapobla00unkngoog",
    source_title: "La cocinera poblana",
    author: "",
    source_year: "1890",
    license: "public-domain",
    expectedRecipeCount: 2129,
    rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_COCINERA_POBLANA_1890_ANONYMOUS",
    documentedAnonymous: true
  })
]);

function parseArgs(argv) {
  const out = { ora: null, forkrecipe: null, unitools: null, cc0: null, rightsDoc: null, output: ".tmp/step8g-cocina-mexicana-measurement" };
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
  return row.collection === source.collection && row.source_url === (source.sourceUrl ?? source.source_url) && row.source_title === (source.sourceTitle ?? source.source_title) && row.author === (source.sourceAuthor ?? source.author) && String(row.source_year) === String(source.sourceYear ?? source.source_year) && row.license === source.license;
}
function publicIdentity(source) {
  return {
    cohortId: source.cohortId,
    collection: source.collection,
    sourceWork: source.source_title,
    sourceAuthor: source.documentedAnonymous ? "author not identified" : source.author,
    rawSourceAuthor: source.author,
    sourceYear: source.source_year,
    sourceUrl: source.source_url,
    license: source.license,
    expectedRecipeCount: source.expectedRecipeCount,
    documentedAnonymous: source.documentedAnonymous
  };
}

const options = parseArgs(process.argv.slice(2));
const roots = Object.fromEntries(Object.entries({ ora: options.ora, forkrecipe: options.forkrecipe, unitools: options.unitools, cc0: options.cc0 }).map(([key, value]) => [key, resolve(value)]));
const pins = Object.fromEntries(Object.entries(roots).map(([key, root]) => [key, commitAt(root)]));
if (pins.ora !== ORA_COMMIT) throw new Error(`ORA_PIN_${pins.ora}`);
if (pins.forkrecipe !== FORKRECIPE_COMMIT) throw new Error(`FORKRECIPE_PIN_${pins.forkrecipe}`);
if (pins.unitools !== UNITOOLS_COMMIT) throw new Error(`UNITOOLS_PIN_${pins.unitools}`);
if (pins.cc0 !== CC0_COMMIT) throw new Error(`CC0_PIN_${pins.cc0}`);

const [forkRecipes, unitoolsDataset, cc0Recipes, australianRows, japaneseRows, turabiRows, portugueseRows, candidateRows, rightsDoc, oraLicense] = await Promise.all([
  loadFork(roots.forkrecipe),
  readFile(resolve(roots.unitools, "unitools-recipes-v1.json"), "utf8").then(JSON.parse),
  loadCc0(roots.cc0),
  readJsonl(resolve(roots.ora, "collections/australian-table/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/japanese-kitchen/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/ottoman-turkish/recipes.jsonl")),
  readJsonl(resolve(roots.ora, "collections/cozinha-portuguesa/recipes.jsonl")),
  readJsonl(resolve(roots.ora, `collections/${COLLECTION}/recipes.jsonl`)),
  readFile(resolve(options.rightsDoc), "utf8"),
  readFile(resolve(roots.ora, "LICENSE.md"), "utf8")
]);

if (!Array.isArray(unitoolsDataset.recipes) || unitoolsDataset.recipes.length !== 501) throw new Error("UNITOOLS_BASELINE_COUNT");
if (forkRecipes.length !== 915) throw new Error("FORKRECIPE_BASELINE_COUNT");
if (cc0Recipes.length !== 226) throw new Error("CC0_BASELINE_COUNT");
if (candidateRows.length !== EXPECTED_COLLECTION_COUNT) throw new Error(`CANDIDATE_COLLECTION_COUNT_${candidateRows.length}`);

const abbottRows = australianRows.filter(row => exact(row, ABBOTT));
const bwRows = japaneseRows.filter(row => exact(row, ORA_BW_SOURCE));
const turabiExact = turabiRows.filter(row => exact(row, ORA_TURABI_SOURCE));
const rigaudRows = portugueseRows.filter(row => exact(row, ORA_RIGAUD_SOURCE));
if (abbottRows.length !== ABBOTT.expectedRecipeCount) throw new Error(`ABBOTT_${abbottRows.length}`);
if (bwRows.length !== ORA_BW_SOURCE.expectedRecipeCount) throw new Error(`BW_${bwRows.length}`);
if (turabiExact.length !== ORA_TURABI_SOURCE.expectedRecipeCount) throw new Error(`TURABI_${turabiExact.length}`);
if (rigaudRows.length !== ORA_RIGAUD_SOURCE.expectedRecipeCount) throw new Error(`RIGAUD_${rigaudRows.length}`);

const protectedBaseline = [
  ...unitoolsDataset.recipes,
  ...forkRecipes,
  ...cc0Recipes,
  ...abbottRows.map(parseOraJsonlRecipe),
  ...bwRows.map(parseOraJsonlRecipe),
  ...turabiExact.map(parseOraJsonlRecipe),
  ...rigaudRows.map(parseOraJsonlRecipe)
];
if (protectedBaseline.length !== EXPECTED_V8007_COUNT) throw new Error(`V8007_BASELINE_${protectedBaseline.length}`);
const baselineRecipes = [...PUBLIC_RUNTIME_RECIPES, ...protectedBaseline];
const repositoryReusePass = /unlicense/i.test(oraLicense) && /free and unencumbered software released into the public domain/i.test(oraLicense);
const attributionClassified = rightsDoc.includes("CLASSIFIED_READY_FOR_PRIVATE_CORPUS__UI_DISPLAY_STILL_DOWNSTREAM_TEST_REQUIRED");

const measured = [];
for (const source of SOURCES) {
  const rawRows = candidateRows.filter(row => exact(row, source));
  const exactCountPass = rawRows.length === source.expectedRecipeCount;
  const rawMetadataPass = rawRows.length > 0 && rawRows.every(row => exact(row, source));
  const rightsDocumented = rightsDoc.includes(source.rightsMarker);
  const measurementRows = source.documentedAnonymous ? rawRows.map(row => ({ ...row, author: "author not identified" })) : rawRows;
  const discovery = discoverOraNextSources({
    collectionRows: measurementRows,
    baselineRecipes,
    activeProtectedVersion: "v8007",
    activeProtectedCount: EXPECTED_V8007_COUNT
  });
  const candidate = discovery.allMeasuredCandidates[0] ?? null;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const rightsAuditPass = rightsDocumented && exactCountPass && rawMetadataPass && repositoryReusePass && attributionClassified;
  const pass = rightsAuditPass && singleSourcePass && structuralQualityPass && culinaryCoveragePass;
  measured.push({
    pass,
    ...publicIdentity(source),
    recipeCount: rawRows.length,
    candidateMetrics: candidate ? {
      parseableRecipeCount: candidate.parseableRecipeCount,
      parseableRecipeRatio: candidate.parseableRecipeRatio,
      distinctNormalizedTitles: candidate.distinctNormalizedTitles,
      uniqueTitleRatio: candidate.uniqueTitleRatio,
      exactBaselineTitleOverlapCount: candidate.exactBaselineTitleOverlapCount,
      novelNormalizedTitleCount: candidate.novelNormalizedTitleCount,
      novelTitleRatio: candidate.novelTitleRatio,
      distinctIngredientPhraseCount: candidate.distinctIngredientPhraseCount,
      novelIngredientPhraseCount: candidate.novelIngredientPhraseCount,
      ontologyResolvedOccurrenceRatio: candidate.ontologyResolvedOccurrenceRatio,
      ontologyResolvedCanonicalIngredientCount: candidate.ontologyResolvedCanonicalIngredientCount,
      ontologyUnresolvedPhraseCount: candidate.ontologyUnresolvedPhraseCount
    } : null,
    thresholds: discovery.thresholds,
    gates: { rightsDocumented, exactCountPass, rawMetadataPass, repositoryReusePass, attributionClassified, singleSourcePass, structuralQualityPass, culinaryCoveragePass, rightsAuditPass },
    evidenceSamples: candidate?.evidenceSamples ?? {},
    boundaries: {
      prewriteEarnedByThisMeasurement: pass,
      liveD1WritesAuthorized: false,
      protectedPopulationAuthorized: false,
      publicRuntimeChangeAuthorized: false,
      recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false,
      billingExpansionAuthorized: false,
      culturalAuthenticityAuthorityImported: false
    }
  });
}

if (measured.reduce((sum, row) => sum + row.recipeCount, 0) !== EXPECTED_COLLECTION_COUNT) throw new Error("SOURCE_SPLIT_DOES_NOT_COVER_COLLECTION");
const earned = measured.filter(row => row.pass);
const terminal = earned.length === SOURCES.length
  ? "STEP_8G_COCINA_MEXICANA_MEASUREMENT_EARNED_TWO_SOURCE_COHORTS"
  : earned.length
    ? "STEP_8G_COCINA_MEXICANA_MEASUREMENT_PARTIAL_SOURCE_COHORTS_EARNED"
    : "STEP_8G_COCINA_MEXICANA_MEASUREMENT_NO_SOURCE_COHORT_EARNED";
const result = {
  schema: "CORPUS_SCALE_STEP8G_COCINA_MEXICANA_V8007_MARGINAL_VALUE_V1",
  date: "2026-09-17",
  pass: earned.length > 0,
  terminal,
  baseline: {
    activeProtectedVersion: "v8007",
    activeProtectedCount: EXPECTED_V8007_COUNT,
    baselineRecipeObjectsIncludingPublic: baselineRecipes.length,
    publicRuntimeRecipeCount: PUBLIC_RUNTIME_RECIPES.length
  },
  sourceRepository: "AdamBouhmad/open-recipe-archive",
  sourceCommit: ORA_COMMIT,
  collection: COLLECTION,
  collectionRecipeCount: EXPECTED_COLLECTION_COUNT,
  measuredSourceCount: measured.length,
  earnedSourceCount: earned.length,
  earnedRecipeCount: earned.reduce((sum, row) => sum + row.recipeCount, 0),
  sourceMeasurements: measured,
  nextAuthority: earned.length ? "SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY" : "NONE_STOP_OR_SELECT_OTHER_SOURCE",
  boundaries: {
    liveD1WritesPerformed: 0,
    protectedPopulationAuthorized: false,
    publicRuntimeChangeAuthorized: false,
    recommendationAdmissionAuthorized: false,
    thirdShardAuthorized: false,
    billingExpansionAuthorized: false,
    nutritionLaneModified: false,
    youtubeCulinaryStateModified: false,
    knowledgeCoreWritePerformed: false,
    culturalAuthenticityAuthorityImported: false
  }
};

await mkdir(resolve(options.output), { recursive: true });
await writeFile(resolve(options.output, "measurement.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  pass: result.pass,
  terminal: result.terminal,
  baseline: result.baseline,
  earnedSourceCount: result.earnedSourceCount,
  earnedRecipeCount: result.earnedRecipeCount,
  sources: result.sourceMeasurements.map(row => ({ cohortId: row.cohortId, recipeCount: row.recipeCount, pass: row.pass, gates: row.gates, metrics: row.candidateMetrics })),
  nextAuthority: result.nextAuthority
}, null, 2)}\n`);
