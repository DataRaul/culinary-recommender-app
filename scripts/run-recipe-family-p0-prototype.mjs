import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { synthesizeFamily } from "./recipe-family-synthesis-core.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [k, ...rest] = arg.replace(/^--/, "").split("=");
  return [k, rest.join("=")];
}));
const configPath = args.config || "config/recipe_family_synthesis_p0.json";
const observationsPath = args.observations || "data/generated/recipe-family-p0-source-observations.json";
const outputPath = args.output || ".tmp/recipe-family-p0-prototype.json";

const [config, packet] = await Promise.all([
  readFile(resolve(configPath), "utf8").then(JSON.parse),
  readFile(resolve(observationsPath), "utf8").then(JSON.parse)
]);

const basePolicy = {
  minimumIndependentObservations: 3,
  quantitativePolicy: { minimumIndependent: 3, minimumDistinctPublishers: 2, maxRobustSpreadRatio: 4 }
};

const definitions = [
  {
    ...basePolicy,
    familyId: "carbonara",
    requiredIngredientRoles: ["pasta", "cured_pork", "egg", "hard_cheese", "black_pepper"],
    requiredTechniques: ["render_cured_pork", "mix_egg_and_cheese", "off_heat_emulsification"],
    requiredQuantitativeRoles: [
      { roleId: "cured_pork", allowedBases: ["MASS_PERCENT_OF_PASTA"] },
      { roleId: "egg", allowedBases: ["EGG_COMPONENT_PER_100G_PASTA"] },
      { roleId: "hard_cheese", allowedBases: ["MASS_PERCENT_OF_PASTA"] }
    ],
    projectCandidate: () => null
  },
  {
    ...basePolicy,
    familyId: "hummus",
    requiredIngredientRoles: ["chickpeas", "tahini", "lemon", "garlic"],
    requiredTechniques: ["soak_chickpeas", "cook_chickpeas", "puree_chickpeas", "combine_tahini_lemon"],
    requiredQuantitativeRoles: [
      { roleId: "tahini", allowedBases: ["VOLUME_PERCENT_OF_DRY_CHICKPEAS"] },
      { roleId: "lemon", allowedBases: ["VOLUME_PERCENT_OF_DRY_CHICKPEAS"] },
      { roleId: "garlic", allowedBases: ["CLOVES_PER_CUP_DRY_CHICKPEAS"] }
    ],
    projectCandidate: ({ requiredQuantityState, provenance }) => {
      const byRole = Object.fromEntries(requiredQuantityState.map(row => [row.roleId, row.selected]));
      return {
        projectionId: "recipe_family_p0_hummus_candidate_v1",
        state: "CANDIDATE_ONLY_NOT_PUBLIC_OR_RUNTIME_ADMITTED",
        basis: { ingredient: "dry_chickpeas", value: 1, unit: "cup" },
        ingredients: [
          { role: "chickpeas", workingValue: 1, unit: "cup", note: "dry base quantity" },
          { role: "tahini", recommendedPercentOfBaseVolume: byRole.tahini.recommendedRange, workingPercent: byRole.tahini.robustCenter },
          { role: "lemon", recommendedPercentOfBaseVolume: byRole.lemon.recommendedRange, workingPercent: byRole.lemon.robustCenter },
          { role: "garlic", recommendedClovesPerCupBase: byRole.garlic.recommendedRange, workingClovesPerCup: byRole.garlic.robustCenter },
          { role: "salt", quantityState: "TO_TASTE_NOT_SYNTHESIZED_AS_NUMERIC_AUTHORITY" },
          { role: "water_or_cooking_liquid", quantityState: "TEXTURE_ADJUSTMENT_NO_FIXED_AUTHORITY" },
          { role: "olive_oil", quantityState: "OPTIONAL_FINISH" }
        ],
        projectAuthoredTechniquePlan: [
          "Soak the dried chickpeas, then drain and rinse them.",
          "Cook the chickpeas until they are soft enough to puree smoothly.",
          "Puree the chickpeas, then blend in tahini, lemon and garlic.",
          "Add reserved cooking liquid or water gradually until the texture is smooth and spreadable.",
          "Season to taste and add an optional olive-oil finish."
        ],
        provenanceObservationIds: provenance,
        rightsState: "PROJECT_AUTHORED_EXPRESSION_FROM_NORMALIZED_FACTUAL_EVIDENCE",
        activationAuthority: "NONE"
      };
    }
  }
];

const familyDetails = definitions.map(definition => synthesizeFamily(packet.observations, config, definition));
const families = familyDetails.map(row => ({
  familyId: row.familyId,
  independentObservationCount: row.independentObservationCount,
  publisherCount: row.publisherCount,
  coreIngredientRoles: row.referenceProfile.ingredientSupport.map(item => item.id),
  coreTechniques: row.referenceProfile.techniqueSupport.map(item => item.id),
  requiredQuantityState: row.gate.requiredQuantityState.map(item => ({
    roleId: item.roleId,
    pass: item.pass,
    selected: item.selected ? {
      basis: item.selected.basis,
      unit: item.selected.unit,
      independentObservationCount: item.selected.independentObservationCount,
      distinctPublisherCount: item.selected.distinctPublisherCount,
      observedRange: item.selected.observedRange,
      robustCenter: item.selected.robustCenter,
      recommendedRange: item.selected.recommendedRange,
      robustSpreadRatio: item.selected.robustSpreadRatio
    } : null
  })),
  variants: row.variantProfile,
  appAuthoringEligible: row.gate.appAuthoringEligible,
  terminal: row.gate.terminal,
  candidateAppOwnedRecipeProjection: row.candidateAppOwnedRecipeProjection,
  provenanceObservationIds: row.provenance.map(item => item.observationId).sort()
}));
const allSourcesPass =
  packet.observations.length > 0 &&
  packet.observations.every(row =>
    row.source.lawfulAccess === "YES" &&
    row.source.databaseExtractionRisk === "LOW" &&
    row.source.cumulativeExtractionRisk === "LOW" &&
    row.source.sourceExpressionPersisted === false &&
    row.source.publicAttributionRequirement !== "UNKNOWN" &&
    (row.source.publicAttributionRequirement !== "REQUIRED" || row.source.publicAttributionState === "READY")
  );

const eligible = families.filter(row => row.appAuthoringEligible);
const summary = {
  schemaVersion: "CULINARY_RECIPE_FAMILY_P0_PROTOTYPE_SUMMARY_V1",
  date: "2026-09-23",
  pass: allSourcesPass && eligible.length >= 1,
  terminal: allSourcesPass && eligible.length >= 1
    ? "RECIPE_FAMILY_P0_PROTOTYPE_PASS__CONSULTANT_COACH_REVIEW_NEXT"
    : "RECIPE_FAMILY_P0_PROTOTYPE_HOLD",
  observationCount: packet.observations.length,
  familyCount: families.length,
  eligibleFamilyCount: eligible.length,
  eligibleFamilyIds: eligible.map(row => row.familyId),
  sourceComplianceSummary: {
    allSourcesPass,
    protectedSourceExpressionPersistedCount: packet.observations.filter(row => row.source.sourceExpressionPersisted).length,
    attributionRequiredCount: packet.observations.filter(row => row.source.publicAttributionRequirement === "REQUIRED").length,
    attributionRequiredReadyCount: packet.observations.filter(row => row.source.publicAttributionRequirement === "REQUIRED" && row.source.publicAttributionState === "READY").length,
    publisherLedgerKeys: [...new Set(packet.observations.map(row => row.source.publisherLedgerKey))].sort()
  },
  families,
  aggregate: {
    familiesAttempted: families.length,
    familiesAppAuthoringEligible: eligible.length,
    medianIndependentObservations: (() => {
      const xs=families.map(row=>row.independentObservationCount).sort((a,b)=>a-b);
      return xs.length % 2 ? xs[(xs.length-1)/2] : (xs[xs.length/2-1]+xs[xs.length/2])/2;
    })(),
    legalSourceBlocks: allSourcesPass ? 0 : 1,
    protectedExpressionPersisted: 0,
    publicRuntimeRecipeCountChanged: false,
    protectedCorpusChanged: false,
    d1Reads: 0,
    d1Writes: 0,
    knowledgeCoreWrites: 0,
    youtubeStateChanges: 0,
    newShard: false,
    billingExpansion: false
  },
  nextGate: allSourcesPass && eligible.length >= 1
    ? "RECIPE_FAMILY_P0_CONSULTANT_COACH_BLOCKING_REVIEW"
    : "RECIPE_FAMILY_P0_TARGETED_REDESIGN"
};

await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
if (!summary.pass) process.exitCode = 1;
