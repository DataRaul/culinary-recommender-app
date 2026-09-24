import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { synthesizeFamily } from "./recipe-family-synthesis-core.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [k, ...rest] = arg.replace(/^--/, "").split("=");
  return [k, rest.join("=")];
}));
const configPath = args.config || "config/recipe_family_synthesis_p0.json";
const observationsPath = args.observations || "data/generated/recipe-family-expansion-tranche-2-source-observations.json";
const outputPath = args.output || ".tmp/recipe-family-expansion-tranche-2.json";

const [config, packet] = await Promise.all([
  readFile(resolve(configPath), "utf8").then(JSON.parse),
  readFile(resolve(observationsPath), "utf8").then(JSON.parse)
]);

const basePolicy = {
  minimumIndependentObservations: 3,
  minimumDistinctPublishers: 3,
  quantitativePolicy: { minimumIndependent: 3, minimumDistinctPublishers: 2, maxRobustSpreadRatio: 4 }
};

const candidate = (familyId, basis, techniquePlan) => ({ requiredQuantityState, provenance }) => ({
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
    familyId: "cacio_e_pepe",
    requiredIngredientRoles: ["pasta", "pecorino", "black_pepper"],
    requiredTechniques: [
      "cook_pasta_al_dente",
      "use_starchy_pasta_water_for_cheese_emulsion",
      "finish_pasta_with_pecorino_emulsion"
    ],
    requiredQuantitativeRoles: [
      { roleId: "pecorino", allowedBases: ["CHEESE_MASS_PERCENT_OF_PASTA_MASS"] }
    ],
    projectCandidate: candidate(
      "cacio_e_pepe",
      { ingredient: "dry_pasta", value: 100, unit: "g" },
      [
        "Cook the pasta until al dente and reserve concentrated starchy cooking water.",
        "Combine finely grated Pecorino with starchy pasta water gradually to form a smooth cheese emulsion.",
        "Finish the hot pasta with the cheese emulsion away from aggressive heat, adding pasta water only as needed.",
        "Season generously with freshly ground black pepper and serve immediately."
      ]
    )
  },
  {
    ...basePolicy,
    familyId: "pesto_genovese",
    requiredIngredientRoles: ["basil", "garlic", "pine_nuts", "parmigiano", "pecorino", "olive_oil", "salt"],
    requiredTechniques: [
      "combine_basil_garlic_pine_nuts",
      "incorporate_hard_cheeses",
      "incorporate_olive_oil_without_cooking"
    ],
    requiredQuantitativeRoles: [
      { roleId: "garlic", allowedBases: ["GARLIC_CLOVES_PER_100G_BASIL"] }
    ],
    projectCandidate: candidate(
      "pesto_genovese",
      { ingredient: "fresh_basil", value: 100, unit: "g" },
      [
        "Work garlic, pine nuts and basil into a fresh paste while limiting heat and oxidation.",
        "Incorporate the grated hard cheeses after the basil mixture has broken down.",
        "Blend in extra-virgin olive oil without cooking the sauce.",
        "Adjust salt conservatively and use the pesto fresh."
      ]
    )
  },
  {
    ...basePolicy,
    familyId: "pizza_margherita",
    requiredIngredientRoles: ["pizza_dough", "tomato", "mozzarella", "basil", "olive_oil"],
    requiredTechniques: [
      "hand_stretch_dough_preserve_rim",
      "spread_tomato_leave_rim",
      "distribute_mozzarella_and_basil",
      "bake_high_heat"
    ],
    requiredQuantitativeRoles: [
      { roleId: "mozzarella", allowedBases: ["GRAMS_PER_PIZZA"] },
      { roleId: "bake_temperature", allowedBases: ["HOME_OVEN_BAKE_TEMPERATURE_C"] }
    ],
    projectCandidate: candidate(
      "pizza_margherita",
      { ingredient: "pizza_dough", value: 1, unit: "dough_ball" },
      []
    )
  }
];

const familyDetails = definitions.map(definition => synthesizeFamily(packet.observations, config, definition));
const families = familyDetails.map(row => ({
  familyId: row.familyId,
  independentObservationCount: row.independentObservationCount,
  publisherCount: row.publisherCount,
  publisherDiversityPass: row.gate.publisherDiversityPass,
  requiredIngredientPass: row.gate.requiredIngredientState.every(item => item.pass),
  requiredTechniquePass: row.gate.requiredTechniqueState.every(item => item.pass),
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

const byId = Object.fromEntries(families.map(row => [row.familyId, row]));
const pizzaTemperature = byId.pizza_margherita.requiredQuantityState.find(row => row.roleId === "bake_temperature");
const expectedDispositionPass =
  byId.cacio_e_pepe.appAuthoringEligible === true &&
  byId.pesto_genovese.appAuthoringEligible === true &&
  byId.pizza_margherita.appAuthoringEligible === false &&
  pizzaTemperature?.pass === false &&
  pizzaTemperature?.selected === null;

const pass = allSourcesPass && protectedExpressionPersisted === 0 && expectedDispositionPass;
const summary = {
  schemaVersion: "CULINARY_RECIPE_FAMILY_EXPANSION_TRANCHE_2_RESULT_V1",
  date: "2026-09-24",
  pass,
  terminal: pass
    ? "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_TRANCHE_2_PASS_WITH_EXPLICIT_PIZZA_HOLD"
    : "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_TRANCHE_2_HOLD",
  tranche: 2,
  familiesAttempted: families.length,
  familyIds: families.map(row => row.familyId),
  eligibleFamilyIds: families.filter(row => row.appAuthoringEligible).map(row => row.familyId),
  heldFamilyIds: families.filter(row => !row.appAuthoringEligible).map(row => row.familyId),
  observationCount: packet.observations.length,
  sourceComplianceSummary: {
    allSourcesPass,
    protectedSourceExpressionPersistedCount: protectedExpressionPersisted,
    publisherLedgerKeys: [...new Set(packet.observations.map(row => row.source.publisherLedgerKey))].sort()
  },
  families,
  explicitHolds: {
    pizza_margherita: {
      state: "APP_AUTHORING_HOLD",
      reason: "HOME_OVEN_TIME_TEMPERATURE_EQUIPMENT_CONTEXT_NOT_YET_STABLE_ACROSS_THREE_INDEPENDENT_PREPARATIONS",
      stableMozzarellaRangeEarned: byId.pizza_margherita.requiredQuantityState.find(row => row.roleId === "mozzarella")?.pass === true,
      homeOvenTemperatureRangeEarned: pizzaTemperature?.pass === true,
      woodFiredAndHomeOvenSemanticsKeptSeparate: true,
      collectionDisposition: "TARGETED_ONLY_IF_PIZZA_AUTHORING_IS_REVISITED"
    }
  },
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
  completedExpansionFamilies: ["guacamole", "pancakes", "tortilla_espanola", "cacio_e_pepe", "pesto_genovese"],
  remainingFrozenFamilies: ["basic_tomato_pasta_sauce", "ragu_bolognese_family"],
  preservedPrototypeFamilies: ["carbonara", "hummus"],
  nextAction: pass
    ? "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_FINAL_TRANCHE_NONPUBLIC"
    : "RECIPE_FAMILY_TRANCHE_2_TARGETED_REPAIR"
};

await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
if (!pass) process.exitCode = 1;
