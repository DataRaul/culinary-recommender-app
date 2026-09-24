import { writeFile } from "node:fs/promises";
import { ALL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import {
  CORPUS_SCALE_ACCEPTANCE,
  CORPUS_SCALE_CONTRACT_VERSION,
  CORPUS_SCALE_TARGETS,
  fingerprintGoldenCorpus,
  runStep1Benchmark
} from "./corpus-scale-step1-core.mjs";

export const STEP1_BASELINES = Object.freeze({
  historicalGoldenOracle: Object.freeze({
    sourceMainSha: "8625cbb6457442229aa1dedee67d94c9a0727d7a",
    expectedRecipeCount: 84,
    expectedFingerprint: Object.freeze({
      idsSha256: "062105fae761ce06357fdd2b068ed41c89590b9b89d984fbbe3ebb76d1b1407a",
      recordsSha256: "4b876f65ca0aa2ab6db3c2e4f1ca6c0af9e91f03e3923dfd3bfd9da2bcfe2f41"
    }),
    scope: "ALL_RECIPES = frozen 84-record historical behavioral oracle"
  }),
  currentBenchmarkSeed: Object.freeze({
    sourceMainSha: "ca6a1129e52b45cac3b39f61402c7466f71d6761",
    expectedRecipeCount: 85,
    expectedFingerprint: Object.freeze({
      idsSha256: "fbd3e7121f741db2f637fcea917d07ad410c189a0d6c2f1394c23f83ed5bc025",
      recordsSha256: "d866a89b0182d15707a9377ff827af4f235b87d1e324e4e37298e85626ffe1c5"
    }),
    scope: "PUBLIC_RUNTIME_RECIPES = current 85-record public runtime benchmark seed"
  })
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

function assertCorpusBaseline(recipes, baseline, label) {
  if (recipes.length !== baseline.expectedRecipeCount) {
    throw new Error(`${label} drift: expected ${baseline.expectedRecipeCount} recipes from ${baseline.sourceMainSha}, found ${recipes.length}. Re-baseline explicitly before benchmarking.`);
  }
  const fingerprint = fingerprintGoldenCorpus(recipes);
  if (baseline.expectedFingerprint) {
    if (fingerprint.idsSha256 !== baseline.expectedFingerprint.idsSha256 ||
        fingerprint.recordsSha256 !== baseline.expectedFingerprint.recordsSha256) {
      throw new Error(`${label} fingerprint drift. Reconcile the recipe change and explicitly re-baseline Step 1 before benchmarking.`);
    }
  }
  return fingerprint;
}

const args = parseArgs(process.argv.slice(2));
const historicalGoldenFingerprint = assertCorpusBaseline(
  ALL_RECIPES,
  STEP1_BASELINES.historicalGoldenOracle,
  "Historical golden oracle"
);
const benchmarkSeedFingerprint = assertCorpusBaseline(
  PUBLIC_RUNTIME_RECIPES,
  STEP1_BASELINES.currentBenchmarkSeed,
  "Current public benchmark seed"
);

const report = runStep1Benchmark(
  PUBLIC_RUNTIME_RECIPES,
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
  contractVersion: CORPUS_SCALE_CONTRACT_VERSION,
  baselines: STEP1_BASELINES,
  historicalGoldenFingerprint,
  benchmarkSeedFingerprint,
  benchmarkSeed: "PUBLIC_RUNTIME_RECIPES",
  interpretation: report.pass
    ? "PASS: Step 1 measured thresholds are satisfied for the requested sizes. This does not authorize real-corpus ingestion, production Cloudflare provisioning, D1, or public behavior changes."
    : "FAIL: One or more Step 1 measured thresholds were not satisfied. Do not advance the corpus-scale architecture until the failing metrics are reconciled."
};
const rendered = `${JSON.stringify(output, null, 2)}\n`;
if (args.output) await writeFile(args.output, rendered, "utf8");
process.stdout.write(rendered);
process.exitCode = report.pass ? 0 : 1;
