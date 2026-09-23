import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

function argsOf(argv) {
  const out = { input: null, output: null };
  for (const arg of argv) {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    if (Object.hasOwn(out, key)) out[key] = rest.join("=");
    else throw new Error("UNKNOWN_ARGUMENT_" + arg);
  }
  if (!out.input || !out.output) throw new Error("INPUT_AND_OUTPUT_REQUIRED");
  return out;
}

function coverageView(raw) {
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, {
    recordCoverageCount: value.recordCoverageCount,
    recordCoverageRatio: value.recordCoverageRatio,
    ...(value.distinctNormalizedValueCount == null ? {} : { distinctNormalizedValueCount: value.distinctNormalizedValueCount }),
    ...(value.singletonValueCount == null ? {} : { singletonValueCount: value.singletonValueCount })
  }]));
}

const args = argsOf(process.argv.slice(2));
const full = JSON.parse(await readFile(resolve(args.input), "utf8"));
const category = full.corpus.rawSignalCoverage.category;
const difficulty = full.corpus.rawSignalCoverage.difficulty;

const summary = {
  schemaVersion: "CULINARY_CORPUS_NORMALIZATION_BASELINE_SUMMARY_V1",
  date: full.date,
  pass: full.pass,
  terminal: full.terminal,
  protectedCorpusVersion: full.protectedCorpusVersion,
  expectedRecipeCount: full.expectedRecipeCount,
  observedRecipeCount: full.observedRecipeCount,
  sourcePins: full.sourcePins,
  structural: {
    titleKnownCount: full.corpus.titleKnownCount,
    titleKnownRatio: full.corpus.titleKnownRatio,
    structurallyParseableCount: full.corpus.structurallyParseableCount,
    structurallyParseableRatio: full.corpus.structurallyParseableRatio,
    allCohortThresholdsPass: full.structuralThresholds.every(row => row.pass),
    nonPerfectCohorts: full.structuralThresholds.filter(row => row.observedStructuralRatio !== 1 || row.minimumStructuralRatio !== 1),
    exceptions: full.structuralExceptions
  },
  rawSignalCoverage: coverageView(full.corpus.rawSignalCoverage),
  taxonomyPressure: {
    categoryValues: category.topValues,
    difficultyValues: difficulty.topValues,
    cultureDistinctNormalizedValueCount: full.corpus.rawSignalCoverage.culture.distinctNormalizedValueCount,
    cultureSingletonValueCount: full.corpus.rawSignalCoverage.culture.singletonValueCount,
    cuisineDistinctNormalizedValueCount: full.corpus.rawSignalCoverage.cuisine.distinctNormalizedValueCount,
    cuisineSingletonValueCount: full.corpus.rawSignalCoverage.cuisine.singletonValueCount,
    tagDistinctNormalizedValueCount: full.corpus.rawSignalCoverage.tags.distinctNormalizedValueCount,
    tagSingletonValueCount: full.corpus.rawSignalCoverage.tags.singletonValueCount,
    crossSignalCollisionSampleCount: full.corpus.crossSignalNormalizedValueCollisions.length
  },
  canonicalTaxonomyAuthorityCoverage: full.canonicalTaxonomyAuthorityCoverage,
  interpretation: full.interpretation,
  nextGate: full.proposedNextGate,
  boundaries: full.boundaries
};

await mkdir(dirname(resolve(args.output)), { recursive: true });
await writeFile(resolve(args.output), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify({ pass: summary.pass, terminal: summary.terminal, observedRecipeCount: summary.observedRecipeCount, nextGate: summary.nextGate.id }, null, 2) + "\n");
