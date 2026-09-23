import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";
import { ORA_BW_SOURCE, parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";
import { ORA_TURABI_SOURCE } from "./corpus-scale-step8g-ora-turabi-core.mjs";
import { ORA_RIGAUD_SOURCE } from "./corpus-scale-step8g-ora-rigaud-core.mjs";
import { ORA_HEARN_1885_SOURCE } from "./corpus-scale-step8g-ora-hearn-1885-core.mjs";
import { ORA_CHAN_1917_SOURCE } from "./corpus-scale-step8g-ora-chan-1917-core.mjs";
import { ORA_KENNEY_HERBERT_1885_SOURCE } from "./corpus-scale-step8g-ora-kenney-herbert-1885-core.mjs";
import { ORA_FANNIE_FARMER_1910_SOURCE } from "./corpus-scale-step8g-ora-fannie-farmer-1910-core.mjs";
import { ORA_ATRUTEL_1874_SOURCE } from "./corpus-scale-step8g-ora-atrutel-1874-core.mjs";
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
const RIGAUD_EXPECTED_COUNT = 789;
const MENON_EXPECTED_COUNT = 752;
const MENON_IDENTITY = Object.freeze({
  collection: "cuisine-francaise",
  source_url: "https://archive.org/details/b22019935",
  source_title: "La Cuisinière bourgeoise",
  author: "Menon",
  source_year: "1801",
  license: "public-domain"
});
const ARTUSI_EXPECTED_COUNT = 829;
const FROKEN_JENSEN_EXPECTED_COUNT = 1372;
const SELESKOWITZ_EXPECTED_COUNT = 1722;
const VIARD_EXPECTED_COUNT = 807;
const ARTUSI_IDENTITY = Object.freeze({
  collection: "cucina-italiana",
  source_url: "https://www.gutenberg.org/ebooks/59047",
  source_title: "La scienza in cucina e l'arte di mangiar bene",
  author: "Pellegrino Artusi",
  source_year: "1891",
  license: "public-domain"
});
const FROKEN_JENSEN_IDENTITY = Object.freeze({
  collection: "danske-kokken",
  source_url: "https://archive.org/details/frkenjensensko00jens",
  source_title: "Frøken Jensens kogebog",
  author: "Kristine Marie Jensen",
  source_year: "1921",
  license: "public-domain"
});
const SELESKOWITZ_IDENTITY = Object.freeze({
  collection: "wiener-kueche",
  source_url: "https://archive.org/details/bub_gb_oP8yAQAAMAAJ",
  source_title: "Wiener Kochbuch",
  author: "Louise Seleskowitz",
  source_year: "1883",
  license: "public-domain"
});
const VIARD_IDENTITY = Object.freeze({
  collection: "cuisine-francaise",
  source_url: "https://archive.org/details/lecuisinierimpe00viargoog",
  source_title: "Le Cuisinier impérial",
  author: "A. Viard",
  source_year: "1806",
  license: "public-domain"
});
const CESKA_KUCHARKA_PROVENANCE_HOLD = Object.freeze({
  collection: "ceska-kuchyne",
  source_url: "https://archive.org/details/ceska_kucharka-dumkova",
  source_title: "Česká kuchařka",
  author: "Marie Dumková",
  source_year: "1883",
  license: "public-domain"
});
const MAGYAR_KONYHA_PROVENANCE_HOLD = Object.freeze({
  collection: "magyar-konyha",
  source_url: "https://archive.org/details/b28112982",
  source_title: "Képes budapesti szakácskönyv",
  author: "Rézi néni",
  source_year: "1901",
  license: "public-domain"
});
const ANNA_DORN_1825_PROVENANCE_HOLD = Object.freeze({
  collection: "wiener-kueche",
  source_url: "https://archive.org/details/b21525936",
  source_title: "Allgemeines österreichisches oder neuestes Wiener Kochbuch",
  author: "Anna Dorn",
  source_year: "1825",
  license: "public-domain"
});
const WANNEE_PROVENANCE_RIGHTS_HOLD = Object.freeze({
  collection: "hollandse-keuken",
  source_url: "https://archive.org/details/bwb_Y0-BXP-037",
  source_title: "Kookboek van de Amsterdamse Huishoudschool",
  author: "C.J. Wannée",
  source_year: "1910",
  license: "public-domain"
});
const SCHILLER_PROVENANCE_HOLD = Object.freeze({
  collection: "german-kitchen",
  source_url: "https://www.gutenberg.org/ebooks/52879",
  source_title: "Neuestes Süddeutsches Kochbuch",
  author: "Viktorine Schiller",
  source_year: "1858",
  license: "public-domain"
});
const INDIAN_COOKERY_PROVENANCE_HOLD = Object.freeze({
  collection: "indian-kitchen",
  source_url: "https://archive.org/details/cu31924059630735",
  source_title: "Indian Cookery and Confectionery",
  author: "E.P. Veerasawmy",
  source_year: "1900",
  license: "public-domain"
});
const HEYL_1905_CONTRIBUTOR_RIGHTS_HOLD = Object.freeze({
  collection: "german-kitchen",
  source_url: "https://www.gutenberg.org/ebooks/13921",
  source_title: "Volks-Kochbuch",
  author: "Hedwig Heyl",
  source_year: "1905",
  license: "public-domain"
});
const GORRITI_1890_CONTRIBUTOR_RIGHTS_HOLD = Object.freeze({
  collection: "cocina-argentina",
  source_url: "https://archive.org/details/cocina-eclectica-juana-manuela-gorriti",
  source_title: "Cocina Ecléctica",
  author: "Juana Manuela Gorriti",
  source_year: "1890",
  license: "public-domain"
});
const AMERICAN_COOKERY_1796_TRANSCRIBER_PROVENANCE_HOLD = Object.freeze({
  collection: "ye-old-american",
  source_url: "https://www.gutenberg.org/ebooks/12815",
  source_title: "American Cookery",
  author: "Amelia Simmons",
  source_year: "1796",
  license: "public-domain"
});
const BEETON_1861_CONTRIBUTOR_PROVENANCE_HOLD = Object.freeze({
  collection: "victorian-britain",
  source_url: "https://www.gutenberg.org/ebooks/10136",
  source_title: "The Book of Household Management",
  author: "Isabella Beeton",
  source_year: "1861",
  license: "public-domain"
});
const LESLIE_1851_EDITION_PROVENANCE_HOLD = Object.freeze({
  collection: "ye-old-american",
  source_url: "https://www.gutenberg.org/ebooks/60025",
  source_title: "Miss Leslie's Complete Cookery",
  author: "Eliza Leslie",
  source_year: "1851",
  license: "public-domain"
});
const WHITEHOUSE_1887_COAUTHOR_PROVENANCE_HOLD = Object.freeze({
  collection: "ye-old-american",
  source_url: "https://www.gutenberg.org/ebooks/13923",
  source_title: "The Whitehouse Cookbook",
  author: "F.L. Gillette",
  source_year: "1887",
  license: "public-domain"
});
const GREENBAUM_1918_SPAIN_TERM_HOLD = Object.freeze({
  collection: "jewish-kitchen",
  source_url: "https://archive.org/details/cu31924003580952",
  source_title: "The International Jewish Cook Book",
  author: "Florence Kreisler Greenbaum",
  source_year: "1918",
  license: "public-domain"
});
const RANDOLPH_1824_EDITION_PROVENANCE_HOLD = Object.freeze({
  collection: "ye-old-american",
  source_url: "https://www.gutenberg.org/ebooks/12519",
  source_title: "The Virginia Housewife; Or, Methodical Cook",
  author: "Mary Randolph",
  source_year: "1824",
  license: "public-domain"
});
const HARLAND_COMMON_SENSE_1871_PROVENANCE_HOLD = Object.freeze({
  collection: "ye-old-american",
  source_url: "https://www.gutenberg.org/ebooks/48804",
  source_title: "Common Sense in the Household",
  author: "Marion Harland",
  source_year: "1871",
  license: "public-domain"
});
const CREOLE_COOKERY_1885_CONTRIBUTOR_PROVENANCE_HOLD = Object.freeze({
  collection: "louisiana-creole",
  source_url: "https://archive.org/details/creolecookerybo00unkngoog",
  source_title: "The Creole Cookery Book",
  author: "Christian Woman's Exchange",
  source_year: "1885",
  license: "public-domain"
});
const ART_OF_LIVING_1893_WICKEN_ATTRIBUTION_HOLD = Object.freeze({
  collection: "australian-table",
  source_url: "https://archive.org/details/artoflivinginaus00muskiala",
  source_title: "The Art of Living in Australia",
  author: "Philip E. Muskett",
  source_year: "1893",
  license: "public-domain"
});
const COCINA_SOURCES = Object.freeze([
  Object.freeze({
    collection: "cocina-mexicana",
    sourceUrl: "https://archive.org/details/bub_gb_NdQqAAAAYAAJ",
    sourceTitle: "Diccionario de cocina, ó El nuevo cocinero mexicano",
    sourceAuthor: "Mariano Galván Rivera",
    sourceYear: "1845",
    license: "public-domain",
    expectedRecipeCount: 4347
  }),
  Object.freeze({
    collection: "cocina-mexicana",
    sourceUrl: "https://archive.org/details/lacocinerapobla00unkngoog",
    sourceTitle: "La cocinera poblana",
    sourceAuthor: "",
    sourceYear: "1890",
    license: "public-domain",
    expectedRecipeCount: 2129
  })
]);
const CHAN_EXPECTED_COUNT = 145;
const KENNEY_HERBERT_EXPECTED_COUNT = 501;
const FANNIE_FARMER_EXPECTED_COUNT = 1776;
const ATRUTEL_EXPECTED_COUNT = 481;
const EXPECTED_PROTECTED_COUNT = 19268;

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
const rigaudIdentity = sourceIdentityRow(ORA_RIGAUD_SOURCE);
const hearnIdentity = sourceIdentityRow(ORA_HEARN_1885_SOURCE);
const chanIdentity = sourceIdentityRow(ORA_CHAN_1917_SOURCE);
const kenneyHerbertIdentity = sourceIdentityRow(ORA_KENNEY_HERBERT_1885_SOURCE);
const fannieFarmerIdentity = sourceIdentityRow(ORA_FANNIE_FARMER_1910_SOURCE);
const atrutelIdentity = sourceIdentityRow(ORA_ATRUTEL_1874_SOURCE);
const cocinaIdentities = COCINA_SOURCES.map(sourceIdentityRow);
const bwRows = allRows.filter(row => matchesIdentity(row, bwIdentity));
const turabiRows = allRows.filter(row => matchesIdentity(row, turabiIdentity));
const rigaudRows = allRows.filter(row => matchesIdentity(row, rigaudIdentity));
const menonRows = allRows.filter(row => matchesIdentity(row, MENON_IDENTITY));
const artusiRows = allRows.filter(row => matchesIdentity(row, ARTUSI_IDENTITY));
const frokenJensenRows = allRows.filter(row => matchesIdentity(row, FROKEN_JENSEN_IDENTITY));
const seleskowitzRows = allRows.filter(row => matchesIdentity(row, SELESKOWITZ_IDENTITY));
const viardRows = allRows.filter(row => matchesIdentity(row, VIARD_IDENTITY));
const hearnRows = allRows.filter(row => matchesIdentity(row, hearnIdentity));
const chanRows = allRows.filter(row => matchesIdentity(row, chanIdentity));
const kenneyHerbertRows = allRows.filter(row => matchesIdentity(row, kenneyHerbertIdentity));
const fannieFarmerRows = allRows.filter(row => matchesIdentity(row, fannieFarmerIdentity));
const atrutelRows = allRows.filter(row => matchesIdentity(row, atrutelIdentity));
const cocinaRows = cocinaIdentities.map(identity => allRows.filter(row => matchesIdentity(row, identity)));
if (abbottRows.length !== ABBOTT_EXPECTED_COUNT) throw new Error(`ABBOTT_EXPECTED_${ABBOTT_EXPECTED_COUNT}_GOT_${abbottRows.length}`);
if (bwRows.length !== ORA_BW_SOURCE.expectedRecipeCount) throw new Error(`BOSSE_WATANNA_EXPECTED_${ORA_BW_SOURCE.expectedRecipeCount}_GOT_${bwRows.length}`);
if (turabiRows.length !== ORA_TURABI_SOURCE.expectedRecipeCount) throw new Error(`TURABI_EXPECTED_${ORA_TURABI_SOURCE.expectedRecipeCount}_GOT_${turabiRows.length}`);
if (rigaudRows.length !== RIGAUD_EXPECTED_COUNT) throw new Error(`RIGAUD_EXPECTED_${RIGAUD_EXPECTED_COUNT}_GOT_${rigaudRows.length}`);
if (menonRows.length !== MENON_EXPECTED_COUNT) throw new Error(`MENON_EXPECTED_${MENON_EXPECTED_COUNT}_GOT_${menonRows.length}`);
if (artusiRows.length !== ARTUSI_EXPECTED_COUNT) throw new Error(`ARTUSI_EXPECTED_${ARTUSI_EXPECTED_COUNT}_GOT_${artusiRows.length}`);
if (frokenJensenRows.length !== FROKEN_JENSEN_EXPECTED_COUNT) throw new Error(`FROKEN_JENSEN_EXPECTED_${FROKEN_JENSEN_EXPECTED_COUNT}_GOT_${frokenJensenRows.length}`);
if (seleskowitzRows.length !== SELESKOWITZ_EXPECTED_COUNT) throw new Error(`SELESKOWITZ_EXPECTED_${SELESKOWITZ_EXPECTED_COUNT}_GOT_${seleskowitzRows.length}`);
if (viardRows.length !== VIARD_EXPECTED_COUNT) throw new Error(`VIARD_EXPECTED_${VIARD_EXPECTED_COUNT}_GOT_${viardRows.length}`);
if (hearnRows.length !== ORA_HEARN_1885_SOURCE.expectedRecipeCount) throw new Error(`HEARN_EXPECTED_${ORA_HEARN_1885_SOURCE.expectedRecipeCount}_GOT_${hearnRows.length}`);
if (chanRows.length !== CHAN_EXPECTED_COUNT) throw new Error(`CHAN_EXPECTED_${CHAN_EXPECTED_COUNT}_GOT_${chanRows.length}`);
if (kenneyHerbertRows.length !== KENNEY_HERBERT_EXPECTED_COUNT) throw new Error(`KENNEY_HERBERT_EXPECTED_${KENNEY_HERBERT_EXPECTED_COUNT}_GOT_${kenneyHerbertRows.length}`);
if (fannieFarmerRows.length !== FANNIE_FARMER_EXPECTED_COUNT) throw new Error(`FANNIE_FARMER_EXPECTED_${FANNIE_FARMER_EXPECTED_COUNT}_GOT_${fannieFarmerRows.length}`);
if (atrutelRows.length !== ATRUTEL_EXPECTED_COUNT) throw new Error(`ATRUTEL_EXPECTED_${ATRUTEL_EXPECTED_COUNT}_GOT_${atrutelRows.length}`);
for (let i = 0; i < COCINA_SOURCES.length; i++) {
  if (cocinaRows[i].length !== COCINA_SOURCES[i].expectedRecipeCount) {
    throw new Error(`COCINA_SOURCE_${i}_EXPECTED_${COCINA_SOURCES[i].expectedRecipeCount}_GOT_${cocinaRows[i].length}`);
  }
}

const protectedBaseline = [
  ...unitoolsDataset.recipes,
  ...forkRecipes,
  ...cc0Recipes,
  ...abbottRows.map(parseOraJsonlRecipe),
  ...bwRows.map(parseOraJsonlRecipe),
  ...turabiRows.map(parseOraJsonlRecipe),
  ...rigaudRows.map(parseOraJsonlRecipe),
  ...cocinaRows.flat().map(parseOraJsonlRecipe),
  ...menonRows.map(parseOraJsonlRecipe),
  ...artusiRows.map(parseOraJsonlRecipe),
  ...frokenJensenRows.map(parseOraJsonlRecipe),
  ...seleskowitzRows.map(parseOraJsonlRecipe),
  ...viardRows.map(parseOraJsonlRecipe),
  ...hearnRows.map(parseOraJsonlRecipe),
  ...chanRows.map(parseOraJsonlRecipe),
  ...kenneyHerbertRows.map(parseOraJsonlRecipe),
  ...fannieFarmerRows.map(parseOraJsonlRecipe),
  ...atrutelRows.map(parseOraJsonlRecipe)
];
if (protectedBaseline.length !== EXPECTED_PROTECTED_COUNT) throw new Error(`V8018_PROTECTED_BASELINE_COUNT_${protectedBaseline.length}`);

const excludedSourceKeys = new Set([
  oraSourceKey(ABBOTT_IDENTITY),
  oraSourceKey(bwIdentity),
  oraSourceKey(turabiIdentity),
  oraSourceKey(rigaudIdentity),
  ...cocinaIdentities.map(oraSourceKey),
  oraSourceKey(MENON_IDENTITY),
  oraSourceKey(ARTUSI_IDENTITY),
  oraSourceKey(FROKEN_JENSEN_IDENTITY),
  oraSourceKey(SELESKOWITZ_IDENTITY),
  oraSourceKey(VIARD_IDENTITY),
  oraSourceKey(hearnIdentity),
  oraSourceKey(chanIdentity),
  oraSourceKey(kenneyHerbertIdentity),
  oraSourceKey(fannieFarmerIdentity),
  oraSourceKey(atrutelIdentity)
]);
const heldSourceKeys = new Set([
  oraSourceKey(MAGYAR_KONYHA_PROVENANCE_HOLD),
  oraSourceKey(CESKA_KUCHARKA_PROVENANCE_HOLD),
  oraSourceKey(ANNA_DORN_1825_PROVENANCE_HOLD),
  oraSourceKey(WANNEE_PROVENANCE_RIGHTS_HOLD),
  oraSourceKey(SCHILLER_PROVENANCE_HOLD),
  oraSourceKey(INDIAN_COOKERY_PROVENANCE_HOLD),
  oraSourceKey(HEYL_1905_CONTRIBUTOR_RIGHTS_HOLD),
  oraSourceKey(GORRITI_1890_CONTRIBUTOR_RIGHTS_HOLD),
  oraSourceKey(AMERICAN_COOKERY_1796_TRANSCRIBER_PROVENANCE_HOLD),
  oraSourceKey(BEETON_1861_CONTRIBUTOR_PROVENANCE_HOLD),
  oraSourceKey(LESLIE_1851_EDITION_PROVENANCE_HOLD),
  oraSourceKey(WHITEHOUSE_1887_COAUTHOR_PROVENANCE_HOLD),
  oraSourceKey(GREENBAUM_1918_SPAIN_TERM_HOLD),
  oraSourceKey(RANDOLPH_1824_EDITION_PROVENANCE_HOLD),
  oraSourceKey(HARLAND_COMMON_SENSE_1871_PROVENANCE_HOLD),
  oraSourceKey(CREOLE_COOKERY_1885_CONTRIBUTOR_PROVENANCE_HOLD),
  oraSourceKey(ART_OF_LIVING_1893_WICKEN_ATTRIBUTION_HOLD)
]);
const heldCollections = new Set(["cocina-espanola"]);
const result = discoverOraNextSources({
  collectionRows: allRows,
  baselineRecipes: [...PUBLIC_RUNTIME_RECIPES, ...protectedBaseline],
  excludedSourceKeys,
  heldSourceKeys,
  heldCollections,
  activeProtectedVersion: "v8018",
  activeProtectedCount: EXPECTED_PROTECTED_COUNT
});

const output = {
  ...result,
  date: "2026-09-23",
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
    alreadyProtectedSources: 16,
    heldSources: [
      {
        collection: MAGYAR_KONYHA_PROVENANCE_HOLD.collection,
        sourceUrl: MAGYAR_KONYHA_PROVENANCE_HOLD.source_url,
        sourceTitle: MAGYAR_KONYHA_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: MAGYAR_KONYHA_PROVENANCE_HOLD.author,
        sourceYear: MAGYAR_KONYHA_PROVENANCE_HOLD.source_year,
        reason: "ORA_AUTHOR_METADATA_CONFLICTS_WITH_EXACT_1901_SOURCE_BIBLIOGRAPHY"
      },
      {
        collection: CESKA_KUCHARKA_PROVENANCE_HOLD.collection,
        sourceUrl: CESKA_KUCHARKA_PROVENANCE_HOLD.source_url,
        sourceTitle: CESKA_KUCHARKA_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: CESKA_KUCHARKA_PROVENANCE_HOLD.author,
        sourceYear: CESKA_KUCHARKA_PROVENANCE_HOLD.source_year,
        reason: "ORA_AUTHOR_METADATA_CONFLICTS_WITH_CZECH_NATIONAL_LIBRARY_1883_MONOGRAPH"
      },
      {
        collection: ANNA_DORN_1825_PROVENANCE_HOLD.collection,
        sourceUrl: ANNA_DORN_1825_PROVENANCE_HOLD.source_url,
        sourceTitle: ANNA_DORN_1825_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: ANNA_DORN_1825_PROVENANCE_HOLD.author,
        sourceYear: ANNA_DORN_1825_PROVENANCE_HOLD.source_year,
        reason: "ORA_AUTHOR_METADATA_CONFLICTS_WITH_EXACT_1825_SOURCE_BIBLIOGRAPHY_ANNA_HOFBAUER"
      },
      {
        collection: WANNEE_PROVENANCE_RIGHTS_HOLD.collection,
        sourceUrl: WANNEE_PROVENANCE_RIGHTS_HOLD.source_url,
        sourceTitle: WANNEE_PROVENANCE_RIGHTS_HOLD.source_title,
        sourceAuthorAsInOra: WANNEE_PROVENANCE_RIGHTS_HOLD.author,
        sourceYear: WANNEE_PROVENANCE_RIGHTS_HOLD.source_year,
        reason: "ORA_1910_WORK_YEAR_POINTS_TO_1958_14TH_EDITION_WITH_LATER_EDITORIAL_RIGHTS_LAYER"
      },
      {
        collection: SCHILLER_PROVENANCE_HOLD.collection,
        sourceUrl: SCHILLER_PROVENANCE_HOLD.source_url,
        sourceTitle: SCHILLER_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: SCHILLER_PROVENANCE_HOLD.author,
        sourceYear: SCHILLER_PROVENANCE_HOLD.source_year,
        reason: "ORA_SOURCE_YEAR_1858_CONFLICTS_WITH_EXACT_GUTENBERG_1843_TITLE_PAGE_AND_BIBLIOGRAPHY"
      },
      {
        collection: INDIAN_COOKERY_PROVENANCE_HOLD.collection,
        sourceUrl: INDIAN_COOKERY_PROVENANCE_HOLD.source_url,
        sourceTitle: INDIAN_COOKERY_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: INDIAN_COOKERY_PROVENANCE_HOLD.author,
        sourceYear: INDIAN_COOKERY_PROVENANCE_HOLD.source_year,
        reason: "ORA_AUTHOR_METADATA_E_P_VEERASAWMY_CONFLICTS_WITH_EXACT_ARCHIVE_ITEM_MRS_I_R_DEY"
      },
      {
        collection: HEYL_1905_CONTRIBUTOR_RIGHTS_HOLD.collection,
        sourceUrl: HEYL_1905_CONTRIBUTOR_RIGHTS_HOLD.source_url,
        sourceTitle: HEYL_1905_CONTRIBUTOR_RIGHTS_HOLD.source_title,
        sourceAuthorAsInOra: HEYL_1905_CONTRIBUTOR_RIGHTS_HOLD.author,
        sourceYear: HEYL_1905_CONTRIBUTOR_RIGHTS_HOLD.source_year,
        reason: "EXACT_1905_EDITION_CREDITS_UNIDENTIFIED_FRAU_DR_ENGELKEN_WITH_NEW_ORDERING_AND_ADDITIONS__CONTRIBUTOR_TERM_UNRESOLVED"
      },
      {
        collection: GORRITI_1890_CONTRIBUTOR_RIGHTS_HOLD.collection,
        sourceUrl: GORRITI_1890_CONTRIBUTOR_RIGHTS_HOLD.source_url,
        sourceTitle: GORRITI_1890_CONTRIBUTOR_RIGHTS_HOLD.source_title,
        sourceAuthorAsInOra: GORRITI_1890_CONTRIBUTOR_RIGHTS_HOLD.author,
        sourceYear: GORRITI_1890_CONTRIBUTOR_RIGHTS_HOLD.source_year,
        reason: "COMMUNITY_COOKBOOK_SEPARATELY_ATTRIBUTED_CONTRIBUTOR_TERMS_UNRESOLVED_SPAIN_FACING"
      },
      {
        collection: AMERICAN_COOKERY_1796_TRANSCRIBER_PROVENANCE_HOLD.collection,
        sourceUrl: AMERICAN_COOKERY_1796_TRANSCRIBER_PROVENANCE_HOLD.source_url,
        sourceTitle: AMERICAN_COOKERY_1796_TRANSCRIBER_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: AMERICAN_COOKERY_1796_TRANSCRIBER_PROVENANCE_HOLD.author,
        sourceYear: AMERICAN_COOKERY_1796_TRANSCRIBER_PROVENANCE_HOLD.source_year,
        reason: "EXACT_1796_EDITION_UNNAMED_PRESS_PREPARER_ALTERATIONS__ORA_EXTRACT_PRESERVES_UNCORRECTED_RECIPE_VALUES"
      },
      {
        collection: BEETON_1861_CONTRIBUTOR_PROVENANCE_HOLD.collection,
        sourceUrl: BEETON_1861_CONTRIBUTOR_PROVENANCE_HOLD.source_url,
        sourceTitle: BEETON_1861_CONTRIBUTOR_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: BEETON_1861_CONTRIBUTOR_PROVENANCE_HOLD.author,
        sourceYear: BEETON_1861_CONTRIBUTOR_PROVENANCE_HOLD.source_year,
        reason: "BEETON_1861_RECIPE_MATTER_FROM_UNNAMED_CORRESPONDENTS_PRIVATE_CIRCLE_AND_OTHER_WRITERS__ORA_FLATTENS_TO_BEETON"
      },
      {
        collection: LESLIE_1851_EDITION_PROVENANCE_HOLD.collection,
        sourceUrl: LESLIE_1851_EDITION_PROVENANCE_HOLD.source_url,
        sourceTitle: LESLIE_1851_EDITION_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: LESLIE_1851_EDITION_PROVENANCE_HOLD.author,
        sourceYear: LESLIE_1851_EDITION_PROVENANCE_HOLD.source_year,
        reason: "ORA_SOURCE_YEAR_1851_CONFLICTS_WITH_EXACT_GUTENBERG_1853_FORTY_NINTH_REVISED_EDITION"
      },
      {
        collection: WHITEHOUSE_1887_COAUTHOR_PROVENANCE_HOLD.collection,
        sourceUrl: WHITEHOUSE_1887_COAUTHOR_PROVENANCE_HOLD.source_url,
        sourceTitle: WHITEHOUSE_1887_COAUTHOR_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: WHITEHOUSE_1887_COAUTHOR_PROVENANCE_HOLD.author,
        sourceYear: WHITEHOUSE_1887_COAUTHOR_PROVENANCE_HOLD.source_year,
        reason: "ORA_SINGLE_AUTHOR_GILLETTE_CONFLICTS_WITH_EXACT_TWO_AUTHOR_GILLETTE_AND_ZIEMANN"
      },
      {
        collection: GREENBAUM_1918_SPAIN_TERM_HOLD.collection,
        sourceUrl: GREENBAUM_1918_SPAIN_TERM_HOLD.source_url,
        sourceTitle: GREENBAUM_1918_SPAIN_TERM_HOLD.source_title,
        sourceAuthorAsInOra: GREENBAUM_1918_SPAIN_TERM_HOLD.author,
        sourceYear: GREENBAUM_1918_SPAIN_TERM_HOLD.source_year,
        reason: "VERIFIED_AUTHOR_DEATH_DATE_ABSENT__SPAIN_TERM_UNCOMPUTABLE"
      },
      {
        collection: RANDOLPH_1824_EDITION_PROVENANCE_HOLD.collection,
        sourceUrl: RANDOLPH_1824_EDITION_PROVENANCE_HOLD.source_url,
        sourceTitle: RANDOLPH_1824_EDITION_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: RANDOLPH_1824_EDITION_PROVENANCE_HOLD.author,
        sourceYear: RANDOLPH_1824_EDITION_PROVENANCE_HOLD.source_year,
        reason: "ORA_SOURCE_YEAR_1824_CONFLICTS_WITH_EXACT_GUTENBERG_1860_EDITION"
      },
      {
        collection: HARLAND_COMMON_SENSE_1871_PROVENANCE_HOLD.collection,
        sourceUrl: HARLAND_COMMON_SENSE_1871_PROVENANCE_HOLD.source_url,
        sourceTitle: HARLAND_COMMON_SENSE_1871_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: HARLAND_COMMON_SENSE_1871_PROVENANCE_HOLD.author,
        sourceYear: HARLAND_COMMON_SENSE_1871_PROVENANCE_HOLD.source_year,
        reason: "ORA_SOURCE_YEAR_1871_CONFLICTS_WITH_EXACT_GUTENBERG_1883_REVISED_EDITION__UNNAMED_FRIEND_HOUSEWIFE_RECIPE_CONTRIBUTIONS"
      },
      {
        collection: CREOLE_COOKERY_1885_CONTRIBUTOR_PROVENANCE_HOLD.collection,
        sourceUrl: CREOLE_COOKERY_1885_CONTRIBUTOR_PROVENANCE_HOLD.source_url,
        sourceTitle: CREOLE_COOKERY_1885_CONTRIBUTOR_PROVENANCE_HOLD.source_title,
        sourceAuthorAsInOra: CREOLE_COOKERY_1885_CONTRIBUTOR_PROVENANCE_HOLD.author,
        sourceYear: CREOLE_COOKERY_1885_CONTRIBUTOR_PROVENANCE_HOLD.source_year,
        reason: "EXACT_1885_TITLE_PAGE_IDENTIFIES_EXCHANGE_AS_EDITOR_AND_RECIPES_AS_HOUSEKEEPER_CONTRIBUTIONS__ORA_FLATTENS_TO_EXCHANGE_AUTHOR"
      },
      {
        collection: ART_OF_LIVING_1893_WICKEN_ATTRIBUTION_HOLD.collection,
        sourceUrl: ART_OF_LIVING_1893_WICKEN_ATTRIBUTION_HOLD.source_url,
        sourceTitle: ART_OF_LIVING_1893_WICKEN_ATTRIBUTION_HOLD.source_title,
        sourceAuthorAsInOra: ART_OF_LIVING_1893_WICKEN_ATTRIBUTION_HOLD.author,
        sourceYear: ART_OF_LIVING_1893_WICKEN_ATTRIBUTION_HOLD.source_year,
        reason: "ORA_ATTRIBUTES_RECIPE_COHORT_TO_PHILIP_MUSKETT__EXACT_1893_WORK_CREDITS_COOKERY_RECIPES_TO_HARRIETT_WICKEN"
      }
    ],
    heldCollections: [...heldCollections],
    reason: "All exact sources protected through v8018 are excluded, including Menon 1801, Artusi 1891, Frøken Jensen 1921, Seleskowitz 1883, Viard 1806, Hearn 1885, Chan 1917, Kenney-Herbert 1885, the exact Fannie Farmer 1910 revised edition represented by the ORA work-year tuple 1896, and Estella Atrutel 1874. The exact 1901 magyar-konyha and 1883 Česká kuchařka source keys remain held for provenance/author mismatch; the ORA Anna Dorn 1825 source tuple is held because independent bibliography identifies the exact work as Anna Hofbauer; the Wannée source is held because its ORA 1910 work-year points to a later 1958 revised digitized edition with a separate editorial rights layer; the Schiller source is held because ORA source_year=1858 conflicts with the exact Gutenberg 1843 title page; the Indian Cookery and Confectionery tuple is held because ORA author E.P. Veerasawmy conflicts with the exact Internet Archive/Open Library attribution to Mrs I.R. Dey; the 1905 Volks-Kochbuch source is held because the exact edition credits an unidentified Frau Dr. Engelken with new ordering and additions and her contribution term cannot be resolved; Cocina Ecléctica 1890 is held because its community-contributor layer contains separately attributed recipe contributions whose Spain-facing terms have not been established cohort-wide; American Cookery 1796 is held because its exact errata attributes material recipe alterations to an unnamed press preparer and the pinned ORA extraction demonstrably preserves uncorrected altered values; The Book of Household Management 1861 is held because its own preface documents recipe matter from unnamed correspondents, a private circle and other cookery writers while the pinned ORA cohort flattens all recipe attribution to Isabella Beeton; Miss Leslie's Complete Cookery is held because ORA source_year 1851 conflicts with the exact Gutenberg 1853 forty-ninth edition marked thoroughly revised with additions; The Whitehouse Cookbook 1887 is held because ORA assigns sole authorship to F.L. Gillette while the exact title page names both Gillette and Hugo Ziemann; The International Jewish Cook Book 1918 is held because the exact work identity is established but an authoritative Greenbaum death date needed to compute the Spain-facing author term is not; The Virginia Housewife ORA source_year 1824 is held because the exact Gutenberg source reproduces an 1860 edition; Common Sense in the Household is held because ORA source_year 1871 points to an exact Gutenberg representation printed in 1883 with an expressly revised 1880 editorial layer and the book itself documents receipts obtained from unnamed friends and trustworthy housewives; The Creole Cookery Book 1885 is held because the exact title-page/bibliographic record identifies the Christian Woman's Exchange as editor and the recipes as contributions from multiple housekeepers while ORA flattens the cohort to the Exchange as author; The Art of Living in Australia 1893 is held because the exact work explicitly assigns the cookery recipes to Mrs. H. Wicken while ORA assigns the recipe cohort to Philip E. Muskett; and cocina-espanola remains under its existing collection rights hold."
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
    sourceUrl: row.sourceUrl,
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
