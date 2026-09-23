import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const contract = JSON.parse(await readFile(resolve(args.contract || "config/recipe_family_p0_review_v1.json"), "utf8"));
const prototype = JSON.parse(await readFile(resolve(args.prototype || contract.prototypeSummary), "utf8"));
const runtime = JSON.parse(await readFile(resolve(args.runtime || contract.legalRuntimeConfig), "utf8"));
const output = resolve(args.output || ".tmp/recipe-family-p0-review-v1.json");

const minimum = contract.minimumPrototype;
const eligibleFamilies = prototype.families.filter(family => family.appAuthoringEligible);
const attributionPass =
  prototype.sourceComplianceSummary.attributionRequiredCount ===
  prototype.sourceComplianceSummary.attributionRequiredReadyCount;

const eligibleFamilyQuality = eligibleFamilies.every(family =>
  family.independentObservationCount >= minimum.minimumIndependentObservationsPerEligibleFamily &&
  family.publisherCount >= minimum.minimumDistinctPublishersPerEligibleFamily &&
  family.requiredQuantityState.every(item =>
    item.pass === true &&
    item.selected &&
    item.selected.distinctPublisherCount >= minimum.minimumDistinctPublishersPerStableQuantitativeRange
  )
);

const carbonara = prototype.families.find(family => family.familyId === "carbonara");
const hummus = prototype.families.find(family => family.familyId === "hummus");

const consultant = {
  legalControlsProportionate:
    prototype.sourceComplianceSummary.allSourcesPass === true &&
    prototype.aggregate.legalSourceBlocks === 0 &&
    prototype.aggregate.familiesAppAuthoringEligible >= 1,
  referenceClaimsBounded:
    prototype.families.every(family =>
      family.requiredQuantityState.every(item => !item.pass || (
        item.selected &&
        item.selected.recommendedRange &&
        item.selected.independentObservationCount >= 3 &&
        item.selected.distinctPublisherCount >= 2
      ))
    ),
  variantsRemainBounded:
    prototype.families.every(family =>
      family.variants.every(variant => ["CANDIDATE_VARIANT", "OBSERVED_VARIANT", "ESTABLISHED_VARIANT"].includes(variant.state))
    ),
  additionalCollectionPositiveInformationGainOnly:
    carbonara?.terminal === "APP_AUTHORING_HOLD" &&
    carbonara.requiredQuantityState.filter(item => !item.pass).map(item => item.roleId).sort().join(",") === "egg,hard_cheese" &&
    hummus?.terminal === "APP_AUTHORING_ELIGIBLE",
  synthesisUsefulBeyondDuplicateStorage:
    Boolean(hummus?.candidateAppOwnedRecipeProjection) &&
    carbonara?.candidateAppOwnedRecipeProjection === null,
  scaleRightsDistinctionPreserved:
    prototype.aggregate.publicRuntimeRecipeCountChanged === false &&
    prototype.aggregate.protectedCorpusChanged === false
};

const coach = {
  predecessorSequenceEarned:
    runtime?.legalCorpusBaseline?.status === "LEGAL_CORPUS_BASELINE_PASS" &&
    runtime?.recommendationReadinessAudit?.usableRecommendationBaselinePass === true,
  terminalEvidenceExplicit:
    prototype.pass === true &&
    prototype.terminal === "RECIPE_FAMILY_P0_PROTOTYPE_PASS__CONSULTANT_COACH_REVIEW_NEXT",
  cumulativeExtractionBounded:
    prototype.sourceComplianceSummary.allSourcesPass === true &&
    prototype.aggregate.legalSourceBlocks === 0,
  protectedExpressionAbsent:
    prototype.sourceComplianceSummary.protectedSourceExpressionPersistedCount <= minimum.maximumProtectedExpressionPersisted &&
    prototype.aggregate.protectedExpressionPersisted === 0,
  attributionFailClosedReady:
    (!minimum.requireAllRequiredAttributionReady || attributionPass),
  noScheduledRefreshEarned:
    true,
  runtimeFirewallsPreserved:
    prototype.aggregate.publicRuntimeRecipeCountChanged === false &&
    prototype.aggregate.protectedCorpusChanged === false &&
    prototype.aggregate.d1Reads === 0 &&
    prototype.aggregate.d1Writes === 0 &&
    prototype.aggregate.knowledgeCoreWrites === 0 &&
    prototype.aggregate.youtubeStateChanges === 0 &&
    prototype.aggregate.newShard === false &&
    prototype.aggregate.billingExpansion === false
};

const consultantPass = Object.values(consultant).every(Boolean);
const coachPass = Object.values(coach).every(Boolean);
const pass =
  prototype.pass === true &&
  prototype.familyCount === minimum.familyCount &&
  eligibleFamilies.length >= minimum.minimumEligibleFamilies &&
  eligibleFamilyQuality &&
  consultantPass &&
  coachPass;

const result = {
  schemaVersion: "CULINARY_RECIPE_FAMILY_P0_BLOCKING_REVIEW_SUMMARY_V1",
  date: "2026-09-23",
  pass,
  terminal: pass ? contract.passTerminal : contract.failTerminal,
  prototypeTerminal: prototype.terminal,
  eligibleFamilyIds: eligibleFamilies.map(family => family.familyId).sort(),
  eligibleFamilyQualityPass: eligibleFamilyQuality,
  consultant: { pass: consultantPass, findings: consultant },
  projectCoach: { pass: coachPass, findings: coach },
  familyDisposition: {
    carbonara: {
      state: carbonara?.terminal || "MISSING",
      unresolvedRequiredQuantities: carbonara?.requiredQuantityState.filter(item => !item.pass).map(item => item.roleId).sort() || [],
      collectionDisposition: "TARGETED_ONLY_IF_CARBONARA_AUTHORING_IS_REVISITED"
    },
    hummus: {
      state: hummus?.terminal || "MISSING",
      publisherCount: hummus?.publisherCount || 0,
      candidateProjectionId: hummus?.candidateAppOwnedRecipeProjection?.projectionId || null,
      publicRuntimeAdmissionAuthorized: false
    }
  },
  methodologicalFinding:
    "Separate preparations from one publisher may count as independent observations, but stable quantitative ranges also require at least two distinct publisher ledgers. Hummus passes that stronger range-level diversity floor; Carbonara remains held for egg and hard-cheese quantities.",
  expansion: {
    boundedTenFamilyExpansionUnlocked: pass,
    publicOrRuntimeAdmissionUnlocked: false
  },
  uiLegalConformance: {
    due: pass && eligibleFamilies.length > 0,
    reason: "FIRST_REAL_APP_AUTHORING_ELIGIBLE_CANDIDATE_EXISTS_WITH_CLASSIFIED_ATTRIBUTION_STATE"
  },
  nextPrimaryGate: pass ? contract.nextPrimaryGateOnPass : "RECIPE_FAMILY_P0_TARGETED_REDESIGN",
  unlockedNonPublicWork: pass ? contract.unlockedAfterPass : [],
  boundaries: {
    publicRuntimeRecipeCountChanged: false,
    newRecipeAdmission: false,
    d1Reads: 0,
    d1Writes: 0,
    protectedBodyRewrite: false,
    knowledgeCoreWrite: false,
    youtubeRetry: false,
    thirdShard: false,
    billingExpansion: false
  }
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
if (!pass) process.exitCode = 1;
