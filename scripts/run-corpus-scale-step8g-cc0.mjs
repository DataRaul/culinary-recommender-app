import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  measureStep8GCc0MarkdownMarginalValue,
  parseCc0MarkdownRecipe
} from "./corpus-scale-step8g-cc0-core.mjs";

const CANDIDATE_REPOSITORY = "sylGauthier/recipes";
const CANDIDATE_EXPECTED_COMMIT = "b12e481d1c220a13e0847a34e148d5872a16928e";
const FORKRECIPE_EXPECTED_COMMIT = "c32255266af39bd77444d39452f3df8088ac8fd9";
const UNITOOLS_EXPECTED_COMMIT = "1d09e9548d957dd0375301146a86dddf5e269c1b";
const UNITOOLS_DATA_FILE = "unitools-recipes-v1.json";
const UNITOOLS_EXPECTED_COUNT = 501;

function parseArgs(argv) {
  const options = { candidate: null, forkrecipe: null, unitools: null, output: ".tmp/step8g-cc0-markdown-measurement" };
  for (const arg of argv) {
    if (arg.startsWith("--candidate=")) options.candidate = arg.slice("--candidate=".length);
    else if (arg.startsWith("--forkrecipe=")) options.forkrecipe = arg.slice("--forkrecipe=".length);
    else if (arg.startsWith("--unitools=")) options.unitools = arg.slice("--unitools=".length);
    else if (arg.startsWith("--out=")) options.output = arg.slice("--out=".length) || options.output;
  }
  if (!options.candidate || !options.forkrecipe || !options.unitools) {
    throw new Error("--candidate, --forkrecipe and --unitools are required");
  }
  return options;
}

function commitAt(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function loadCandidateRecipes(root) {
  const sourceDir = resolve(root, "src");
  const files = (await readdir(sourceDir)).filter(file => file.endsWith(".md")).sort();
  const recipes = [];
  for (const fileName of files) {
    const markdown = await readFile(resolve(sourceDir, fileName), "utf8");
    recipes.push(parseCc0MarkdownRecipe(markdown, { fileName }));
  }
  return recipes;
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

function assertRightsEvidence({ licenseText, readmeText }) {
  const cc0 = /CC0\s+1\.0\s+Universal/i.test(licenseText);
  const repositoryPublicDomain = /repository and all its content is in the public domain/i.test(readmeText);
  const upstreamLineage = /hard fork from Luke Smith's \[based\.cooking\]/i.test(readmeText)
    || /hard fork from Luke Smith's based\.cooking/i.test(readmeText);
  return {
    pass: cc0 && repositoryPublicDomain && upstreamLineage,
    cc0LegalCodePresent: cc0,
    repositoryContentPublicDomainStatementPresent: repositoryPublicDomain,
    upstreamBasedCookingLineageDeclared: upstreamLineage
  };
}

const args = parseArgs(process.argv.slice(2));
const candidateRoot = resolve(args.candidate);
const forkRoot = resolve(args.forkrecipe);
const unitoolsRoot = resolve(args.unitools);
const outputRoot = resolve(args.output);

const candidateCommit = commitAt(candidateRoot);
const forkCommit = commitAt(forkRoot);
const unitoolsCommit = commitAt(unitoolsRoot);
if (candidateCommit !== CANDIDATE_EXPECTED_COMMIT) throw new Error(`CC0_CANDIDATE_PIN_MISMATCH_${candidateCommit}`);
if (forkCommit !== FORKRECIPE_EXPECTED_COMMIT) throw new Error(`FORKRECIPE_PIN_MISMATCH_${forkCommit}`);
if (unitoolsCommit !== UNITOOLS_EXPECTED_COMMIT) throw new Error(`UNITOOLS_PIN_MISMATCH_${unitoolsCommit}`);

const [candidateRecipes, forkRecipes, unitoolsDataset, licenseText, readmeText] = await Promise.all([
  loadCandidateRecipes(candidateRoot),
  loadForkRecipes(forkRoot),
  readFile(resolve(unitoolsRoot, UNITOOLS_DATA_FILE), "utf8").then(JSON.parse),
  readFile(resolve(candidateRoot, "LICENSE"), "utf8"),
  readFile(resolve(candidateRoot, "README.md"), "utf8")
]);

if (!candidateRecipes.length) throw new Error("CC0_CANDIDATE_EMPTY_SOURCE");
if (!forkRecipes.length) throw new Error("FORKRECIPE_BASELINE_EMPTY");
if (!Array.isArray(unitoolsDataset.recipes) || unitoolsDataset.recipes.length !== UNITOOLS_EXPECTED_COUNT) {
  throw new Error(`UNITOOLS_EXPECTED_${UNITOOLS_EXPECTED_COUNT}_RECIPES`);
}

const rightsEvidence = assertRightsEvidence({ licenseText, readmeText });
const structurallyComplete = candidateRecipes.filter(recipe =>
  recipe.quality.hasTitle && recipe.quality.hasIngredients && recipe.quality.hasDirections
).length;
const sourceQualityPass = structurallyComplete / candidateRecipes.length >= 0.95;

const measurement = measureStep8GCc0MarkdownMarginalValue({
  candidateRecipes,
  publicRecipes: ALL_RECIPES,
  unitoolsRecipes: unitoolsDataset.recipes,
  forkRecipes,
  rightsAuditPass: rightsEvidence.pass,
  sourceQualityPass
});

const result = {
  ...measurement,
  date: "2026-09-15",
  sourcePins: {
    candidate: {
      repository: CANDIDATE_REPOSITORY,
      commit: candidateCommit,
      recipeFileCount: candidateRecipes.length,
      license: "CC0-1.0"
    },
    forkrecipeBaseline: {
      repository: "futurechef/forkrecipe-recipes",
      commit: forkCommit,
      recipeCount: forkRecipes.length
    },
    unitoolsBaseline: {
      repository: "farcrak/unitools-recipes",
      commit: unitoolsCommit,
      recipeCount: unitoolsDataset.recipes.length
    }
  },
  rightsEvidence,
  interpretation: measurement.pass
    ? "The pinned CC0 markdown cohort adds enough marginal protected-corpus value to earn a separately governed no-write prewrite/population design. This measurement does not authorize D1 writes, recommendation admission, Step 8F, a third shard, or billing expansion."
    : "The pinned CC0 markdown cohort does not currently clear the Step 8G marginal-value gate. This is a valid stop outcome and does not authorize D1 writes or Step 8F."
};

await mkdir(outputRoot, { recursive: true });
await writeFile(resolve(outputRoot, "measurement.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
