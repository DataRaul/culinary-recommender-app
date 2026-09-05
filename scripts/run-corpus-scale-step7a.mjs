import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { fingerprintGoldenCorpus } from "./corpus-scale-step1-core.mjs";
import {
  STEP7A_BUDGETS,
  STEP7A_TARGETS,
  runStep7ABenchmark
} from "./corpus-scale-step7a-core.mjs";

export const STEP7A_GOLDEN_BASELINE = Object.freeze({
  sourceMainSha: "df1f9baf63f5d54e15e3613862d2a80f577f079f",
  expectedRecipeCount: 84,
  scope: "ALL_RECIPES = 76 curated authored + 8 Gate-F external records"
});

function argumentValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find(value => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function parseSizes() {
  const raw = argumentValue("sizes");
  if (!raw) return STEP7A_TARGETS;
  const tokens = raw.split(",").map(value => value.trim());
  const sizes = tokens.map(Number);
  if (!tokens.length || tokens.some(value => !value) || sizes.some(value => !Number.isInteger(value) || value <= 0)) {
    throw new Error("--sizes must be a comma-separated list of positive integers");
  }
  return sizes;
}

function parseRepetitions() {
  const raw = argumentValue("repetitions");
  if (raw == null) return 8;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error("--repetitions must be a positive integer");
  return value;
}

async function main() {
  if (ALL_RECIPES.length !== STEP7A_GOLDEN_BASELINE.expectedRecipeCount) {
    throw new Error(
      `Step 7A golden baseline drift: expected ${STEP7A_GOLDEN_BASELINE.expectedRecipeCount} recipes from ${STEP7A_GOLDEN_BASELINE.sourceMainSha}, found ${ALL_RECIPES.length}. Reconcile and explicitly refreeze before benchmarking.`
    );
  }

  const sizes = parseSizes();
  const repetitions = parseRepetitions();
  const report = runStep7ABenchmark(ALL_RECIPES, { sizes, repetitions });
  const output = {
    generatedBy: "scripts/run-corpus-scale-step7a.mjs",
    goldenBaseline: STEP7A_GOLDEN_BASELINE,
    goldenFingerprint: fingerprintGoldenCorpus(ALL_RECIPES),
    projectBudgets: STEP7A_BUDGETS,
    interpretation: report.acceptance.pass
      ? "PASS: the provider-neutral 170k required / 250k stress model satisfies the no-billing-authorization architecture budgets. This earns only the human Step 7B Free-resource provisioning check; it does not authorize billing, paid plans, D1 population, identity-provider production activation or real-source corpus admission."
      : "FAIL: the no-billing-authorization architecture does not satisfy one or more Step 7A gates. Do not provision D1, identity-provider resources or paid/usage-authorized infrastructure. Reconcile the failing dimensions first.",
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
  if (!report.acceptance.pass) process.exitCode = 1;
}

main().catch(error => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
