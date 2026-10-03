import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { evaluateRecipe } from "../src/domain/recommendation.js";
import {
  protectedReadinessFromFrozenSummaries,
  summarizePublicReadiness
} from "./recommendation-readiness-core.mjs";

function argsOf(argv) {
  const out = {
    contract: "config/recommendation_readiness_audit_v1.json",
    legal: "config/legal_corpus_first_private_runtime.json",
    mapping: "data/generated/corpus-normalization-mapping-v1.json",
    nutrition: "data/generated/nutrition-vitamin-applicability-audit-v1.json",
    output: ".tmp/recommendation-readiness-audit-v1.json"
  };
  for (const arg of argv) {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    if (!Object.hasOwn(out, key)) throw new Error("UNKNOWN_ARGUMENT_" + arg);
    out[key] = rest.join("=");
  }
  return out;
}

const args = argsOf(process.argv.slice(2));
const [contract, legal, mapping, nutrition] = await Promise.all([
  readFile(resolve(args.contract), "utf8").then(JSON.parse),
  readFile(resolve(args.legal), "utf8").then(JSON.parse),
  readFile(resolve(args.mapping), "utf8").then(JSON.parse),
  readFile(resolve(args.nutrition), "utf8").then(JSON.parse)
]);

const permissiveProfile = normalizeProfile({
  ...DEFAULT_PROFILE,
  maxMinutes: 180,
  skill: 4,
  budget: 4,
  cuisinePreferences: [],
  nutritionPriority: 1,
  proteinEmphasis: 1,
  priorityPacks: [],
  dietaryMode: "unrestricted",
  allergens: [],
  excludedIngredientIds: [],
  unavailableIngredientIds: []
});

const evaluations = new Map(PUBLIC_RUNTIME_RECIPES.map(recipe => [
  recipe.id,
  evaluateRecipe(recipe, permissiveProfile, {})
]));

const publicRuntime = summarizePublicReadiness(PUBLIC_RUNTIME_RECIPES, evaluations);
const protectedCorpus = protectedReadinessFromFrozenSummaries(mapping, nutrition);

const auditExecutionPass =
  legal?.legalCorpusBaseline?.status === "LEGAL_CORPUS_BASELINE_PASS" &&
  legal?.legalCorpusBaseline?.activeProtectedVersion === contract.protectedCorpusVersion &&
  Number(legal?.legalCorpusBaseline?.protectedRecipeCount) === contract.expectedProtectedRecipeCount &&
  mapping?.pass === true &&
  nutrition?.pass === true &&
  publicRuntime.recipeCount === contract.expectedPublicRuntimeRecipeCount &&
  protectedCorpus.recipeCount === contract.expectedProtectedRecipeCount;

const publicHardMetadataPass =
  publicRuntime.hardMetadataReadyRecommendationEligibleCount === publicRuntime.recommendationEligibleStateCount &&
  publicRuntime.evaluatorEligibleCount === publicRuntime.recommendationEligibleStateCount;

const unknownNutritionSemanticsPass =
  publicRuntime.unknownNutritionZeroCoercionCount === 0 &&
  publicRuntime.unknownNutritionSafeCount === publicRuntime.unknownNutritionRecommendationEligibleCount;

const protectedFailClosedPass =
  protectedCorpus.automaticRecommendationReadyCount === 0 &&
  protectedCorpus.automaticAdmissionState === "HELD_FAIL_CLOSED";

const usableRecommendationBaselinePass =
  auditExecutionPass &&
  publicHardMetadataPass &&
  unknownNutritionSemanticsPass &&
  protectedFailClosedPass;

const summary = {
  schemaVersion: "CULINARY_RECOMMENDATION_READINESS_AUDIT_SUMMARY_V1",
  date: "2026-09-23",
  auditExecutionPass,
  usableRecommendationBaselinePass,
  terminal: usableRecommendationBaselinePass
    ? "USABLE_RECOMMENDATION_BASELINE_PASS"
    : "RECOMMENDATION_READINESS_AUDIT_PASS_REMEDIATION_REQUIRED",
  protectedCorpusVersion: contract.protectedCorpusVersion,
  publicRuntime,
  protectedCorpus,
  gates: {
    legalCorpusBaselinePass: legal?.legalCorpusBaseline?.status === "LEGAL_CORPUS_BASELINE_PASS",
    normalizationMappingPass: mapping?.pass === true,
    nutritionApplicabilityPass: nutrition?.pass === true,
    publicHardMetadataPass,
    unknownNutritionSemanticsPass,
    protectedFailClosedPass
  },
  finding: unknownNutritionSemanticsPass
    ? "NO_MATERIAL_RECOMMENDATION_READINESS_DEFECT"
    : "ELIGIBLE_UNKNOWN_NUTRITION_IS_COERCED_TO_NUMERIC_ZERO_IN_SOFT_RECOMMENDATION_COMPONENTS",
  boundaries: {
    d1ReadsPerformed: 0,
    d1WritesPerformed: 0,
    protectedBodiesExported: 0,
    protectedBodiesRewritten: 0,
    publicRuntimeChanged: false,
    publicCorpusWidened: false,
    recommendationBehaviorChanged: false,
    newRecipeAdmission: false,
    knowledgeCoreWritePerformed: false,
    youtubeStateModified: false,
    billingExpansion: false,
    thirdShardUsed: false
  },
  nextGate: usableRecommendationBaselinePass
    ? contract.nextGateOnUsableBaselinePass
    : contract.nextActionOnReadinessDefect
};

await mkdir(dirname(resolve(args.output)), { recursive: true });
await writeFile(resolve(args.output), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
if (!auditExecutionPass) process.exitCode = 1;
