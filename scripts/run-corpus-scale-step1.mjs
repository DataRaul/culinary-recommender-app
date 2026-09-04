import { writeFile } from "node:fs/promises";
import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import {
  CORPUS_SCALE_ACCEPTANCE,
  CORPUS_SCALE_TARGETS,
  fingerprintGoldenCorpus,
  runStep1Benchmark
} from "./corpus-scale-step1-core.mjs";

export const STEP1_GOLDEN_BASELINE = Object.freeze({
  sourceMainSha: "8625cbb6457442229aa1dedee67d94c9a0727d7a",
  expectedRecipeCount: 84,
  scope: "ALL_RECIPES = 76 curated authored + 8 Gate-F external records"
});

function parseArgs(argv) {
  const options = { sizes: CORPUS_SCALE_TARGETS, repetitions: 12, output: null };
  for (const arg of argv) {
    if (arg.startsWith("--sizes=")) {
      options.sizes = arg.slice("--sizes=".length).split(",").map(Number).filter(Number.isInteger);
    } else if (arg.startsWith("--repetitions=")) {
      options.repetitions = Math.max(1, Number(arg.slice("--repetitions=".length)) || 12);
    } else if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length) || null;
    }
  }
  if (!options.sizes.length || options.sizes.some(size => size <= 0)) throw new Error("--sizes must contain positive integers");
  return options;
}

const args = parseArgs(process.argv.slice(2));
if (ALL_RECIPES.length !== STEP1_GOLDEN_BASELINE.expectedRecipeCount) {
  throw new Error(`Golden corpus drift: expected ${STEP1_GOLDEN_BASELINE.expectedRecipeCount} recipes from ${STEP1_GOLDEN_BASELINE.sourceMainSha}, found ${ALL_RECIPES.length}. Re-baseline explicitly before benchmarking.`);
}

const goldenFingerprint = fingerprintGoldenCorpus(ALL_RECIPES);
const report = runStep1Benchmark(
  ALL_RECIPES,
  recipes => rankRecipes(recipes, DEFAULT_PROFILE, { mealType: "dinner", mode: "search" }),
  {
    sizes: args.sizes,
    repetitions: args.repetitions,
    thresholds: CORPUS_SCALE_ACCEPTANCE,
    memorySampleEvery: 1_000
  }
);

const output = {
  ...report,
  goldenBaseline: STEP1_GOLDEN_BASELINE,
  goldenFingerprint,
  interpretation: report.pass
    ? "PASS: Step 1 measured thresholds are satisfied for the requested sizes. This does not authorize real-corpus ingestion, production Cloudflare provisioning, D1, or public behavior changes."
    : "FAIL: One or more Step 1 measured thresholds were not satisfied. Do not advance the corpus-scale architecture until the failing metrics are reconciled."
};
const rendered = `${JSON.stringify(output, null, 2)}\n`;
if (args.output) await writeFile(args.output, rendered, "utf8");
process.stdout.write(rendered);
process.exitCode = report.pass ? 0 : 1;
