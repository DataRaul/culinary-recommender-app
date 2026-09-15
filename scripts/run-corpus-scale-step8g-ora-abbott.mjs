import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import { parseCc0MarkdownRecipe } from "./corpus-scale-step8g-cc0-core.mjs";

const ORA_EXPECTED_COMMIT = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8";
const FORKRECIPE_EXPECTED_COMMIT = "c32255266af39bd77444d39452f3df8088ac8fd9";
const UNITOOLS_EXPECTED_COMMIT = "1d09e9548d957dd0375301146a86dddf5e269c1b";
const SYLGAUTHIER_EXPECTED_COMMIT = "b12e481d1c220a13e0847a34e148d5872a16928e";
const SOURCE_URL = "https://archive.org/details/b21505524";
const SOURCE_TITLE = "The English and Australian Cookery Book";
const SOURCE_AUTHOR = "Edward Abbott";
const SOURCE_YEAR = "1864";
const RIGHTS_MARKER = "PASS_RIGHTS_VERIFIED_BOUNDED_ABBOTT_1864";
const UNITOOLS_DATA_FILE = "unitools-recipes-v1.json";
const UNITOOLS_EXPECTED_COUNT = 501;

const normalize = value => String(value ?? "")
  .normalize("NFKD")
  .replace(/\p{M}+/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function parseArgs(argv) {
  const options = {
    ora: null,
    forkrecipe: null,
    unitools: null,
    cc0: null,
    rightsDoc: null,
    output: ".tmp/step8g-ora-abbott-measurement"
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

function parseFrontMatter(markdown) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(String(markdown ?? ""));
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);
    if (!field) continue;
    result[field[1]] = field[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return result;
}

function sectionBody(markdown, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$`, "im");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const rest = markdown.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

export function parseOraAbbottRecipe(markdown, { fileName = "unknown.md" } = {}) {
  const text = String(markdown ?? "");
  const meta = parseFrontMatter(text);
  const ingredients = sectionBody(text, "Ingredients")
    .split(/\r?\n/)
    .filter(line => /^\s*[-*+]\s+/.test(line))
    .map(line => line.replace(/^\s*[-*+]\s+/, "").trim())
    .filter(Boolean);
  const directions = sectionBody(text, "(?:Directions|Instructions|Method)")
    .split(/\r?\n/)
    .filter(line => /^\s*(?:\d+[.)]|[-*+])\s+/.test(line))
    .map(line => line.replace(/^\s*(?:\d+[.)]|[-*+])\s+/, "").trim())
    .filter(Boolean);

  return {
    fileName,
    title: meta.title || "",
    ingredients,
    directions,
    source: {
      collection: meta.collection || "",
      author: meta.author || "",
      sourceTitle: meta.source_title || "",
      sourceUrl: meta.source_url || "",
      sourceYear: meta.source_year || "",
      license: meta.license || ""
    },
    quality: {
      hasTitle: Boolean(meta.title),
      hasIngredients: ingredients.length > 0,
      hasDirections: directions.length > 0
    }
  };
}

async function loadOraSourceWork(root) {
  const recipesDir = resolve(root, "collections/australian-table/recipes");
  const files = (await readdir(recipesDir)).filter(file => file.endsWith(".md")).sort();
  const sourceRows = [];
  for (const fileName of files) {
    const markdown = await readFile(resolve(recipesDir, fileName), "utf8");
    const recipe = parseOraAbbottRecipe(markdown, { fileName });
    if (recipe.source.sourceUrl === SOURCE_URL) sourceRows.push(recipe);
  }
  return sourceRows;
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

function addNormalized(set, value) {
  const normalized = normalize(value);
  if (normalized) set.add(normalized);
}

function publicTitle(recipe) {
  return recipe?.identity?.canonicalTitle || recipe?.title || recipe?.id || "";
}
function publicIngredients(recipe) {
  return (recipe?.ingredients || []).flatMap(ingredient => [
    ingredient?.name?.en,
    typeof ingredient?.name === "string" ? ingredient.name : null,
    ingredient?.label
  ]).filter(Boolean);
}
function unitoolsTitle(recipe) { return recipe?.name?.en || recipe?.nativeName || recipe?.slug || ""; }
function unitoolsIngredients(recipe) { return (recipe?.ingredients || []).flatMap(row => [row?.name?.en, row?.name?.ru]).filter(Boolean); }
function forkTitle(recipe) { return recipe?.title || recipe?.slug || recipe?.id || ""; }
function forkIngredients(recipe) { return (recipe?.ingredients || []).map(row => row?.name).filter(Boolean); }

function buildSet(values, getter) {
  const set = new Set();
  for (const value of values) for (const item of getter(value)) addNormalized(set, item);
  return set;
}
function buildTitleSet(values, getter) {
  const set = new Set();
  for (const value of values) addNormalized(set, getter(value));
  return set;
}
function union(...sets) { return new Set(sets.flatMap(set => [...set])); }
function difference(a, b) { return [...a].filter(value => !b.has(value)); }
function intersection(a, b) { return [...a].filter(value => b.has(value)); }

function candidateOntology(recipes) {
  let occurrences = 0;
  let resolved = 0;
  const ids = new Set();
  const unresolved = new Set();
  for (const recipe of recipes) {
    for (const phrase of recipe.ingredients) {
      occurrences += 1;
      const id = normalizeIngredient(phrase);
      if (id) {
        resolved += 1;
        ids.add(id);
      } else {
        addNormalized(unresolved, phrase);
      }
    }
  }
  return {
    occurrences,
    resolved,
    resolvedRatio: occurrences ? resolved / occurrences : 0,
    ids,
    unresolved
  };
}

export function measureOraAbbottCandidate({ candidateRecipes, publicRecipes, unitoolsRecipes, forkRecipes, cc0Recipes, rightsDocumented }) {
  if (!candidateRecipes.length) throw new Error("ORA_ABBOTT_CANDIDATE_EMPTY");

  const rightsViolations = candidateRecipes.filter(recipe =>
    recipe.source.sourceUrl !== SOURCE_URL ||
    recipe.source.sourceTitle !== SOURCE_TITLE ||
    recipe.source.author !== SOURCE_AUTHOR ||
    recipe.source.sourceYear !== SOURCE_YEAR ||
    recipe.source.license !== "public-domain"
  );
  const rightsAuditPass = rightsDocumented === true && rightsViolations.length === 0;

  const candidateTitles = buildTitleSet(candidateRecipes, recipe => recipe.title);
  const baselineTitles = union(
    buildTitleSet(publicRecipes, publicTitle),
    buildTitleSet(unitoolsRecipes, unitoolsTitle),
    buildTitleSet(forkRecipes, forkTitle),
    buildTitleSet(cc0Recipes, recipe => recipe.title)
  );
  const candidatePhrases = buildSet(candidateRecipes, recipe => recipe.ingredients);
  const baselinePhrases = union(
    buildSet(publicRecipes, publicIngredients),
    buildSet(unitoolsRecipes, unitoolsIngredients),
    buildSet(forkRecipes, forkIngredients),
    buildSet(cc0Recipes, recipe => recipe.ingredients)
  );

  const parseableCount = candidateRecipes.filter(recipe => recipe.quality.hasTitle && recipe.quality.hasIngredients && recipe.quality.hasDirections).length;
  const parseableRatio = parseableCount / candidateRecipes.length;
  const uniqueTitleRatio = candidateTitles.size / candidateRecipes.length;
  const novelTitles = difference(candidateTitles, baselineTitles);
  const titleOverlaps = intersection(candidateTitles, baselineTitles);
  const novelTitleRatio = candidateTitles.size ? novelTitles.length / candidateTitles.size : 0;
  const novelPhrases = difference(candidatePhrases, baselinePhrases);
  const ontology = candidateOntology(candidateRecipes);

  const thresholds = { minParseableRatio: 0.95, minUniqueTitleRatio: 0.8, minNovelTitleRatio: 0.5 };
  const structuralQualityPass = parseableRatio >= thresholds.minParseableRatio;
  const culinaryCoveragePass = uniqueTitleRatio >= thresholds.minUniqueTitleRatio && novelTitleRatio >= thresholds.minNovelTitleRatio;
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: "CORPUS_SCALE_STEP8G_ORA_ABBOTT_1864_MARGINAL_VALUE_V1",
    pass,
    terminal: pass ? "STEP_8G_ORA_ABBOTT_MEASUREMENT_EARNED_COHORT_CANDIDATE" : "STEP_8G_STOP_ORA_ABBOTT_MARGINAL_VALUE_OR_RIGHTS_FAIL",
    baseline: {
      publicRecipeCount: publicRecipes.length,
      protectedUnitoolsCount: unitoolsRecipes.length,
      protectedForkRecipeCount: forkRecipes.length,
      protectedCc0Count: cc0Recipes.length,
      protectedComposedRecipeCount: unitoolsRecipes.length + forkRecipes.length + cc0Recipes.length,
      distinctNormalizedTitles: baselineTitles.size
    },
    candidate: {
      sourceWork: SOURCE_TITLE,
      sourceAuthor: SOURCE_AUTHOR,
      sourceYear: SOURCE_YEAR,
      sourceUrl: SOURCE_URL,
      recipeCount: candidateRecipes.length,
      parseableRecipeCount: parseableCount,
      parseableRecipeRatio: parseableRatio,
      distinctNormalizedTitles: candidateTitles.size,
      uniqueTitleRatio,
      exactBaselineTitleOverlapCount: titleOverlaps.length,
      novelNormalizedTitleCount: novelTitles.length,
      novelTitleRatio,
      distinctIngredientPhraseCount: candidatePhrases.size,
      novelIngredientPhraseCount: novelPhrases.length,
      ontologyResolvedOccurrenceRatio: ontology.resolvedRatio,
      ontologyResolvedCanonicalIngredientCount: ontology.ids.size,
      ontologyUnresolvedPhraseCount: ontology.unresolved.size
    },
    thresholds,
    gates: {
      rightsDocumented: rightsDocumented === true,
      rightsMetadataPass: rightsViolations.length === 0,
      rightsAuditPass,
      structuralQualityPass,
      culinaryCoveragePass
    },
    rightsViolations: rightsViolations.slice(0, 20).map(row => ({ fileName: row.fileName, source: row.source })),
    evidenceSamples: {
      overlappingTitles: titleOverlaps.slice(0, 25),
      novelTitles: novelTitles.slice(0, 25),
      novelIngredientPhrases: novelPhrases.slice(0, 50),
      unresolvedIngredientPhrases: [...ontology.unresolved].sort().slice(0, 50)
    },
    boundaries: {
      liveD1WritesAuthorized: false,
      publicRuntimeChangeAuthorized: false,
      recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false,
      billingExpansionAuthorized: false,
      nutritionAuthorityImported: false,
      knowledgeCoreWriteAuthorized: false
    }
  };
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
if (pins.ora !== ORA_EXPECTED_COMMIT) throw new Error(`ORA_PIN_MISMATCH_${pins.ora}`);
if (pins.forkrecipe !== FORKRECIPE_EXPECTED_COMMIT) throw new Error(`FORKRECIPE_PIN_MISMATCH_${pins.forkrecipe}`);
if (pins.unitools !== UNITOOLS_EXPECTED_COMMIT) throw new Error(`UNITOOLS_PIN_MISMATCH_${pins.unitools}`);
if (pins.cc0 !== SYLGAUTHIER_EXPECTED_COMMIT) throw new Error(`CC0_PIN_MISMATCH_${pins.cc0}`);

const [candidateRecipes, forkRecipes, unitoolsDataset, cc0Recipes, rightsDoc] = await Promise.all([
  loadOraSourceWork(oraRoot),
  loadForkRecipes(forkRoot),
  readFile(resolve(unitoolsRoot, UNITOOLS_DATA_FILE), "utf8").then(JSON.parse),
  loadCc0Recipes(cc0Root),
  readFile(rightsDocPath, "utf8")
]);
if (!Array.isArray(unitoolsDataset.recipes) || unitoolsDataset.recipes.length !== UNITOOLS_EXPECTED_COUNT) {
  throw new Error(`UNITOOLS_EXPECTED_${UNITOOLS_EXPECTED_COUNT}_RECIPES`);
}
const rightsDocumented = rightsDoc.includes(RIGHTS_MARKER);

const measurement = measureOraAbbottCandidate({
  candidateRecipes,
  publicRecipes: ALL_RECIPES,
  unitoolsRecipes: unitoolsDataset.recipes,
  forkRecipes,
  cc0Recipes,
  rightsDocumented
});

const result = {
  ...measurement,
  date: "2026-09-15",
  sourcePins: {
    openRecipeArchive: { repository: "AdamBouhmad/open-recipe-archive", commit: pins.ora },
    forkrecipeBaseline: { repository: "futurechef/forkrecipe-recipes", commit: pins.forkrecipe, recipeCount: forkRecipes.length },
    unitoolsBaseline: { repository: "farcrak/unitools-recipes", commit: pins.unitools, recipeCount: unitoolsDataset.recipes.length },
    cc0Baseline: { repository: "sylGauthier/recipes", commit: pins.cc0, recipeCount: cc0Recipes.length }
  },
  interpretation: measurement.pass
    ? "The bounded Edward Abbott 1864 source-work cohort clears the no-write Step 8G marginal-value measurement against the full v8003 protected baseline. A separate prewrite/population gate is still required before any D1 mutation."
    : "The bounded Edward Abbott 1864 source-work cohort does not clear the Step 8G measurement gate. No D1 mutation, public admission, topology expansion, or billing expansion is authorized."
};

await mkdir(outputRoot, { recursive: true });
await writeFile(resolve(outputRoot, "measurement.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
