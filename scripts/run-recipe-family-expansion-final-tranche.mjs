import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { synthesizeFamily } from "./recipe-family-synthesis-core.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [k, ...rest] = arg.replace(/^--/, "").split("=");
  return [k, rest.join("=")];
}));
const configPath = args.config || "config/recipe_family_synthesis_p0.json";
const observationsPath = args.observations || "data/generated/recipe-family-expansion-final-tranche-source-observations.json";
const outputPath = args.output || ".tmp/recipe-family-expansion-final-tranche.json";

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
    familyId: "basic_tomato_pasta_sauce",
    requiredIngredientRoles: ["pasta", "tomato", "olive_oil", "allium", "basil"],
    requiredTechniques: [
      "cook_tomato_to_sauce",
      "cook_pasta_al_dente",
      "finish_pasta_with_tomato_sauce"
    ],
    requiredQuantitativeRoles: [
      { roleId: "tomato", allowedBases: ["TOMATO_MASS_PERCENT_OF_DRY_PASTA_MASS"] }
    ],
    projectCandidate: candidate(
      "basic_tomato_pasta_sauce",
      { ingredient: "dry_pasta", value: 100, unit: "g" },
      [
        "Cook tomato with olive oil and an allium aromatic until it becomes a cohesive sauce.",
        "Cook the pasta until al dente while reserving a little cooking water.",
        "Finish the pasta in the tomato sauce so the sauce coats the pasta evenly.",
        "Add fresh basil near the end and adjust salt to taste."
      ]
    )
  },
  {
    ...basePolicy,
    familyId: "ragu_bolognese_family",
    requiredIngredientRoles: ["beef", "pancetta", "onion", "carrot", "celery", "tomato", "wine"],
    requiredTechniques: [
      "render_pancetta",
      "soften_soffritto",
      "brown_beef",
      "deglaze_with_wine",
      "slow_simmer_ragu"
    ],
    requiredQuantitativeRoles: [
      { roleId: "tomato", allowedBases: ["TOMATO_PUREE_MASS_PERCENT_OF_BEEF_MASS"] }
    ],
    projectCandidate: candidate(
      "ragu_bolognese_family",
      { ingredient: "ground_beef", value: 100, unit: "g" },
      [
        "Render the pancetta gently, then soften finely cut onion, carrot and celery in the cooking fat.",
        "Add the beef and cook until its raw moisture has evaporated and the meat has browned.",
        "Deglaze with wine and let the alcohol aroma dissipate before adding tomato.",
        "Simmer gently for an extended period, using broth as needed to maintain a slow braise-like consistency.",
        "Treat milk as a documented family variant rather than an automatic requirement."
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

const expectedDispositionPass =
  families.length === 2 &&
  families.every(row => row.appAuthoringEligible === true);

const pass = allSourcesPass && protectedExpressionPersisted === 0 && expectedDispositionPass;
const summary = {
  schemaVersion: "CULINARY_RECIPE_FAMILY_EXPANSION_FINAL_TRANCHE_RESULT_V1",
  date: "2026-09-24",
  pass,
  terminal: pass
    ? "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_FINAL_TRANCHE_PASS"
    : "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_FINAL_TRANCHE_HOLD",
  tranche: "FINAL",
  familiesAttempted: families.length,
  familyIds: families.map(row => row.familyId),
  eligibleFamilyIds: families.filter(row => row.appAuthoringEligible).map(row => row.familyId),
  heldFamilyIds: families.filter(row => !row.appAuthoringEligible).map(row => row.familyId),
  observationCount: packet.observations.length,
  sourceComplianceSummary: {
    allSourcesPass,
    protectedSourceExpressionPersistedCount: protectedExpressionPersisted,
    publisherLedgerKeys: [...new Set(packet.observations.map(row => row.source.publisherLedgerKey))].sort(),
    materiallyNewSourceClassIntroduced: false,
    uiLegalConformanceRetriggerRequired: false
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
  completedExpansionFamilies: [
    "guacamole",
    "pancakes",
    "tortilla_espanola",
    "cacio_e_pepe",
    "pesto_genovese",
    "basic_tomato_pasta_sauce",
    "ragu_bolognese_family"
  ],
  heldExpansionFamilies: ["pizza_margherita"],
  preservedPrototypeFamilies: ["carbonara", "hummus"],
  remainingFrozenFamilies: [],
  publicActivationAuthorized: false,
  nextAction: pass
    ? "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_CLOSEOUT_REVIEW"
    : "RECIPE_FAMILY_FINAL_TRANCHE_TARGETED_REPAIR"
};

await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), JSON.stringify(summary, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
if (!pass) process.exitCode = 1;
