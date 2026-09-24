import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { synthesizeFamily } from "./recipe-family-synthesis-core.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [k, ...rest] = arg.replace(/^--/, "").split("=");
  return [k, rest.join("=")];
}));
const configPath = args.config || "config/recipe_family_synthesis_p0.json";
const observationsPath = args.observations || "data/generated/recipe-family-expansion-tranche-1-source-observations.json";
const outputPath = args.output || ".tmp/recipe-family-expansion-tranche-1.json";

const [config, packet] = await Promise.all([
  readFile(resolve(configPath), "utf8").then(JSON.parse),
  readFile(resolve(observationsPath), "utf8").then(JSON.parse)
]);

const basePolicy = {
  minimumIndependentObservations: 3,
  minimumDistinctPublishers: 3,
  quantitativePolicy: { minimumIndependent: 3, minimumDistinctPublishers: 2, maxRobustSpreadRatio: 4 }
};

const projectCandidate = (familyId, basis, techniquePlan) => ({ requiredQuantityState, provenance }) => ({
  projectionId: `recipe_family_expansion_${familyId}_candidate_v1`,
  state: "CANDIDATE_ONLY_NOT_PUBLIC_OR_RUNTIME_ADMITTED",
  familyId,
  basis,
  synthesizedQuantities: Object.fromEntries(requiredQuantityState.map(row => [
    row.roleId,
    row.selected ? {
      basis: row.selected.basis,
      unit: row.selected.unit,
      observedRange: row.selected.observedRange,
      recommendedRange: row.selected.recommendedRange,
      robustCenter: row.selected.robustCenter
    } : null
  ])),
  projectAuthoredTechniquePlan: techniquePlan,
  provenanceObservationIds: provenance,
  rightsState: "PROJECT_AUTHORED_EXPRESSION_FROM_NORMALIZED_FACTUAL_EVIDENCE",
  activationAuthority: "NONE"
});

const definitions = [
  {
    ...basePolicy,
    familyId: "guacamole",
    requiredIngredientRoles: ["avocado", "lime"],
    requiredTechniques: ["mash_avocado", "combine_fresh_aromatics"],
    requiredQuantitativeRoles: [
      { roleId: "lime", allowedBases: ["LIME_UNITS_PER_AVOCADO"] }
    ],
    projectCandidate: projectCandidate(
      "guacamole",
      { ingredient: "avocado", value: 1, unit: "whole_avocado" },
      [
        "Mash ripe avocado to the desired balance of creamy and chunky texture.",
        "Fold in fresh aromatic ingredients and lime after mashing.",
        "Season gradually and serve promptly."
      ]
    )
  },
  {
    ...basePolicy,
    familyId: "pancakes",
    requiredIngredientRoles: ["flour", "cultured_or_milk_liquid", "egg", "chemical_leavener"],
    requiredTechniques: ["mix_dry_ingredients", "combine_wet_and_dry_minimally", "griddle_cook", "flip_after_surface_bubbles"],
    requiredQuantitativeRoles: [
      { roleId: "cultured_or_milk_liquid", allowedBases: ["CUPS_LIQUID_PER_CUP_FLOUR"] },
      { roleId: "egg", allowedBases: ["EGGS_PER_CUP_FLOUR"] }
    ],
    projectCandidate: projectCandidate(
      "pancakes",
      { ingredient: "flour", value: 1, unit: "cup" },
      [
        "Combine the dry ingredients evenly before adding liquid.",
        "Mix the wet ingredients into the dry mixture only until a thick batter forms; avoid prolonged mixing.",
        "Cook portions on a heated, lightly greased griddle.",
        "Turn each pancake after bubbles develop across the surface and the first side has set, then finish the second side."
      ]
    )
  },
  {
    ...basePolicy,
    familyId: "tortilla_espanola",
    requiredIngredientRoles: ["potato", "egg", "olive_oil"],
    requiredTechniques: ["gently_cook_potato_in_oil", "combine_potato_with_beaten_egg", "pan_set_first_side", "flip_and_finish_second_side"],
    requiredQuantitativeRoles: [
      { roleId: "egg", allowedBases: ["EGGS_PER_100G_POTATO"] }
    ],
    projectCandidate: projectCandidate(
      "tortilla_espanola",
      { ingredient: "potato", value: 500, unit: "g" },
      [
        "Cook the potato gently in oil until tender rather than crisp.",
        "Drain excess oil and combine the warm potato with beaten egg.",
        "Set the mixture in a pan over controlled heat.",
        "Invert the tortilla safely and finish the second side to the preferred degree of set."
      ]
    )
  }
];

const familyDetails = definitions.map(definition => synthesizeFamily(packet.observations, config, definition));
const families = familyDetails.map(row => ({
  familyId: row.familyId,
  independentObservationCount: row.independentObservationCount,
  publisherCount: row.publisherCount,
  publisherDiversityPass: row.gate.publisherDiversityPass,
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

const protectedExpressionPersisted = packet.observations.filter(row => row.source.sourceExpressionPersisted).length;
const allSourcesPass = packet.observations.length > 0 && packet.observations.every(row =>
  row.source.lawfulAccess === "YES" &&
  row.source.databaseExtractionRisk === "LOW" &&
  row.source.cumulativeExtractionRisk === "LOW" &&
  row.source.sourceExpressionPersisted === false &&
  row.source.publicAttributionRequirement !== "UNKNOWN" &&
  (row.source.publicAttributionRequirement !== "REQUIRED" || row.source.publicAttributionState === "READY")
);
const eligible = families.filter(row => row.appAuthoringEligible);
const pass = allSourcesPass && protectedExpressionPersisted === 0 && eligible.length === families.length;

const summary = {
  schemaVersion: "CULINARY_RECIPE_FAMILY_EXPANSION_TRANCHE_1_RESULT_V1",
  date: "2026-09-24",
  pass,
  terminal: pass
    ? "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_TRANCHE_1_PASS"
    : "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_TRANCHE_1_HOLD",
  tranche: 1,
  familiesAttempted: families.length,
  familyIds: families.map(row => row.familyId),
  eligibleFamilyCount: eligible.length,
  eligibleFamilyIds: eligible.map(row => row.familyId),
  observationCount: packet.observations.length,
  sourceComplianceSummary: {
    allSourcesPass,
    protectedSourceExpressionPersistedCount: protectedExpressionPersisted,
    publisherLedgerKeys: [...new Set(packet.observations.map(row => row.source.publisherLedgerKey))].sort()
  },
  families,
  aggregate: {
    publicRuntimeRecipeCountChanged: false,
    protectedCorpusChanged: false,
    d1Reads: 0,
    d1Writes: 0,
    knowledgeCoreWrites: 0,
    youtubeStateChanges: 0,
    newShard: false,
    billingExpansion: false
  },
  remainingFrozenFamilies: [
    "pizza_margherita",
    "cacio_e_pepe",
    "pesto_genovese",
    "basic_tomato_pasta_sauce",
    "ragu_bolognese_family"
  ],
  preservedPrototypeFamilies: ["carbonara", "hummus"],
  nextAction: pass
    ? "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_TRANCHE_2_NONPUBLIC"
    : "RECIPE_FAMILY_TRANCHE_1_TARGETED_REPAIR"
};

await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
if (!pass) process.exitCode = 1;
