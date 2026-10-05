import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  OWNER_SECONDARY_CANDIDATE_SLUGS_V1,
  OWNER_SECONDARY_ROLLOUT_META_V1
} from "../src/server/protected-corpus-limited-evidence-secondary-lane-owner-rollout-manifest-v1.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
for (const key of ["sourceRoot", "config", "output"]) {
  if (!args[key]) throw new Error("V21_RECIPE_DETAIL_ARGUMENT_REQUIRED_" + key);
}

const cfg = JSON.parse(await readFile(resolve(args.config), "utf8"));
const sourceRoot = resolve(args.sourceRoot);
const commit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding:"utf8" }).trim();
if (commit !== cfg.source.commit) throw new Error("V21_RECIPE_DETAIL_SOURCE_PIN_MISMATCH");

const dataset = JSON.parse(await readFile(resolve(sourceRoot, cfg.source.dataPath), "utf8"));
if (dataset.version !== cfg.source.datasetVersion) throw new Error("V21_RECIPE_DETAIL_DATASET_VERSION_MISMATCH");
if (!Array.isArray(dataset.recipes) || dataset.recipes.length !== cfg.source.expectedDatasetRecipeCount) {
  throw new Error("V21_RECIPE_DETAIL_SOURCE_COUNT_MISMATCH");
}
if (Number(dataset.counts?.recipes) !== cfg.source.expectedDatasetRecipeCount) {
  throw new Error("V21_RECIPE_DETAIL_SOURCE_METADATA_COUNT_MISMATCH");
}
if (OWNER_SECONDARY_CANDIDATE_SLUGS_V1.length !== cfg.candidateUniverseCount) {
  throw new Error("V21_RECIPE_DETAIL_CANDIDATE_COUNT_MISMATCH");
}

const sha256Json = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const candidateKeys = OWNER_SECONDARY_CANDIDATE_SLUGS_V1.map(slug => cfg.source.cohortId + "::" + slug);
const manifestDigest = sha256Json(candidateKeys);
if (manifestDigest !== cfg.candidateManifestDigestSha256 || manifestDigest !== OWNER_SECONDARY_ROLLOUT_META_V1.candidateManifestDigestSha256) {
  throw new Error("V21_RECIPE_DETAIL_CANDIDATE_DIGEST_MISMATCH");
}

const bySlug = new Map(dataset.recipes.map(recipe => [String(recipe.slug || ""), recipe]));
const localized = value => {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return String(value.en || value.ru || Object.values(value).find(Boolean) || "").trim();
};
const rows = OWNER_SECONDARY_CANDIDATE_SLUGS_V1.map(slug => {
  const recipe = bySlug.get(slug);
  if (!recipe) throw new Error("V21_RECIPE_DETAIL_SOURCE_RECIPE_MISSING_" + slug);
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  const directionTextChars = steps.reduce((total, step) => total + localized(step?.text).length, 0);
  return {
    slug,
    ingredientCount: ingredients.length,
    directionStepCount: steps.length,
    directionTextChars,
    summaryTextChars: localized(recipe.summary).length
  };
});

const stat = values => {
  const sorted = [...values].sort((a,b) => a-b);
  const at = p => sorted[Math.floor((sorted.length - 1) * p)];
  return {
    min: sorted[0],
    p25: at(0.25),
    median: at(0.5),
    p75: at(0.75),
    max: sorted.at(-1),
    average: Number((sorted.reduce((a,b) => a+b, 0) / sorted.length).toFixed(2))
  };
};
const directionDistribution = Object.fromEntries(
  [...new Set(rows.map(row => row.directionStepCount))].sort((a,b)=>a-b)
    .map(count => [String(count), rows.filter(row => row.directionStepCount === count).length])
);
const structuralPartialCount = rows.filter(row => row.ingredientCount === 0 || row.directionStepCount === 0).length;
const measured = {
  ingredientCount: stat(rows.map(row => row.ingredientCount)),
  directionStepCount: {
    ...stat(rows.map(row => row.directionStepCount)),
    distribution: directionDistribution,
    atMost3: rows.filter(row => row.directionStepCount <= 3).length
  },
  directionTextChars: stat(rows.map(row => row.directionTextChars)),
  summaryTextChars: stat(rows.map(row => row.summaryTextChars)),
  structuralPartialCount
};

const expected = cfg.measuredPinnedSourceStructure;
const expectedDirectionDistribution = expected.directionStepCount.distribution;
const pass =
  rows.length === cfg.candidateUniverseCount &&
  measured.ingredientCount.min === expected.ingredientCount.min &&
  measured.ingredientCount.median === expected.ingredientCount.median &&
  measured.ingredientCount.max === expected.ingredientCount.max &&
  measured.directionStepCount.min === expected.directionStepCount.min &&
  measured.directionStepCount.median === expected.directionStepCount.median &&
  measured.directionStepCount.max === expected.directionStepCount.max &&
  measured.directionStepCount.atMost3 === expected.directionStepCount.atMost3 &&
  JSON.stringify(measured.directionStepCount.distribution) === JSON.stringify(expectedDirectionDistribution) &&
  measured.structuralPartialCount === expected.structuralPartialCount;

const result = {
  schemaVersion: "CULINARY_V21_RECIPE_DETAIL_COMPLETENESS_SUMMARY_V1",
  date: "2026-10-05",
  pass,
  terminal: pass ? cfg.targetTerminal : "V21_RECIPE_DETAIL_COMPLETENESS_AUDIT_FAIL",
  protectedCorpusVersion: cfg.protectedCorpusVersion,
  candidateUniverseCount: rows.length,
  candidateManifestDigestSha256: manifestDigest,
  source: {
    cohortId: cfg.source.cohortId,
    repository: cfg.source.repository,
    commit,
    datasetVersion: dataset.version,
    datasetRecipeCount: dataset.recipes.length
  },
  measured,
  sourceCohortDistribution: {
    [cfg.source.cohortId]: rows.length
  },
  interpretation: {
    sourceSparseDirectionsExplainThreeSentenceExperience: measured.directionStepCount.atMost3 > 0,
    projectionOrSurfaceLossWouldBeMaterialIfFewerThanSourceStepsRender: true,
    rawRecipeTextCopiedIntoEvidence: false
  },
  boundaries: {
    protectedD1Reads: 0,
    protectedD1Writes: 0,
    fullCorpusScans: 0,
    publicRuntimeChanged: false,
    recommendationAdmissionChanged: false,
    dietaryAllergenAuthorityChanged: false,
    knowledgeCoreWritePerformed: false,
    paidApiOrModelUsed: false,
    thirdShardUsed: false,
    barbecueMutation: false
  }
};

await mkdir(dirname(resolve(args.output)), { recursive:true });
await writeFile(resolve(args.output), JSON.stringify(result, null, 2) + "\n", "utf8");
process.stdout.write("V21_RECIPE_DETAIL_COMPLETENESS_SUMMARY=" + JSON.stringify(result) + "\n");
if (!pass) process.exitCode = 1;
