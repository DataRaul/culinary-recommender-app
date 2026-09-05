import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { CORPUS_SCALE_TARGETS } from "./corpus-scale-step1-core.mjs";
import { runStep4Benchmark } from "./corpus-scale-step4-core.mjs";

export const STEP4_GOLDEN_BASELINE = Object.freeze({
  sourceMainSha: "7696a5994bc32c7893a5af06e0f2de13d88b9036",
  expectedRecipeCount: 84,
  scope: "ALL_RECIPES = 76 curated authored + 8 Gate-F external records"
});

function argumentValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find(value => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function parseSizes() {
  const raw = argumentValue("sizes");
  if (!raw) return CORPUS_SCALE_TARGETS;
  const sizes = raw.split(",").map(value => Number(value.trim())).filter(Boolean);
  if (!sizes.length || sizes.some(value => !Number.isInteger(value) || value <= 0)) {
    throw new Error("--sizes must be a comma-separated list of positive integers");
  }
  return sizes;
}

function parseRepetitions() {
  const raw = argumentValue("repetitions");
  if (raw == null) return 12;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error("--repetitions must be a positive integer");
  return value;
}

function rankCandidateRecipes(recipes, scenario) {
  const mealKey = (scenario.keys || []).find(key => key.startsWith("meal:"));
  const mealType = mealKey ? mealKey.slice("meal:".length) : "dinner";
  return rankRecipes(recipes, DEFAULT_PROFILE, { mealType, mode: "search" });
}

async function main() {
  if (ALL_RECIPES.length !== STEP4_GOLDEN_BASELINE.expectedRecipeCount) {
    throw new Error(
      `Step 4 golden baseline drift: expected ${STEP4_GOLDEN_BASELINE.expectedRecipeCount} recipes from ${STEP4_GOLDEN_BASELINE.sourceMainSha}, found ${ALL_RECIPES.length}. Reconcile and explicitly refreeze before benchmarking.`
    );
  }

  const sizes = parseSizes();
  const repetitions = parseRepetitions();
  const report = runStep4Benchmark(ALL_RECIPES, rankCandidateRecipes, { sizes, repetitions });
  const output = {
    generatedBy: "scripts/run-corpus-scale-step4.mjs",
    goldenBaseline: STEP4_GOLDEN_BASELINE,
    interpretation: {
      pass: "R2-style provider-neutral pre-built index retrieval satisfies the frozen Step 4 local gates. D1 is not earned by this proof.",
      fail: "A failed retrieval gate requires evidence review. It does not automatically authorize D1, paid infrastructure, a larger candidate cap, weaker hard filters, or public behavior changes.",
      productionBoundary: "This local synthetic proof does not authorize Cloudflare provisioning or real-source population. Real R2 latency, operations and free-tier fit remain a later production-shaped pilot gate."
    },
    ...report
  };
  const json = `${JSON.stringify(output, null, 2)}\n`;

  const outputPath = argumentValue("output");
  if (outputPath) {
    const resolved = resolve(outputPath);
    await mkdir(dirname(resolved), { recursive: true });
    await writeFile(resolved, json, "utf8");
  }
  process.stdout.write(json);
  if (!report.pass) process.exitCode = 1;
}

main().catch(error => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
