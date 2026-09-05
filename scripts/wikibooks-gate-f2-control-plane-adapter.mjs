import {
  assertValidGateF2Ledger,
  wikibooksPageUrl,
  wikibooksRevisionUrl
} from "./wikibooks-gate-f2-contract.mjs";
import {
  createControlPlaneSnapshot
} from "./corpus-source-control-plane.mjs";

export const WIKIBOOKS_GATE_F2_CONTROL_ADAPTER_ID = "wikibooks-gate-f2-control-adapter-v1";

export function gateF2SourceContract(ledger) {
  assertValidGateF2Ledger(ledger);
  return {
    id: ledger.source.id,
    name: ledger.source.name,
    adapterId: WIKIBOOKS_GATE_F2_CONTROL_ADAPTER_ID,
    sourceFamily: "WIKIMEDIA_WIKIBOOKS",
    versioningMode: "EXACT_REVISION_ID",
    rightsEvidenceMode: "SOURCE_LEVEL_CC_BY_SA_WITH_EXACT_REVISION_PROVENANCE",
    license: ledger.source.license,
    licenseUrl: ledger.source.licenseUrl,
    attributionPolicy: ledger.source.attribution,
    runtimeFetch: false,
    mediaState: "EXCLUDED",
    sourceNutritionImportedAsAuthority: false,
    automaticAdmissionAuthorized: false
  };
}

function rightsStateForGateF2Record(_record) {
  // Gate F/F2 already completed the bounded source-rights audit for the exact
  // Wikibooks revision model. A content/quality rejection does not erase the
  // independently established CC BY-SA rights state for the tracked revision.
  return "ADMIT_RIGHTS_VERIFIED";
}

function canonicalRecipeId(record) {
  return record.reviewState === "ADMITTED"
    ? record.runtimeArtifact?.recipeId || record.id
    : null;
}

export function adaptGateF2Record(record, ledger) {
  const source = gateF2SourceContract(ledger);
  const timestamp = record.timestamp ?? null;
  const provenance = {
    sourceName: ledger.source.name,
    sourceItemId: String(record.pageid),
    sourceVersionId: String(record.revid),
    sourceVersionTimestamp: timestamp,
    sourceVersionTimestampState: record.revisionTimestampState ?? (timestamp ? "EXACT_RECORDED" : null),
    sourcePageTitle: record.title,
    sourceUrl: wikibooksPageUrl(record.title),
    immutableLocator: wikibooksRevisionUrl(record.revid),
    attribution: ledger.source.attribution,
    license: ledger.source.license,
    licenseUrl: ledger.source.licenseUrl,
    mediaIncluded: false,
    sourceNutritionImportedAsAuthority: false
  };

  const reviewState = record.reviewState;
  return {
    controlId: `${source.id}:${record.pageid}:${record.revid}`,
    externalRecordId: record.id,
    sourceId: source.id,
    sourceItemId: String(record.pageid),
    sourceVersionId: String(record.revid),
    title: record.title,
    reviewState,
    rightsState: rightsStateForGateF2Record(record),
    admissionState: reviewState === "ADMITTED" ? record.admissionState : null,
    canonicalRecipeId: canonicalRecipeId(record),
    nutritionState: reviewState === "ADMITTED"
      ? "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED"
      : "NOT_APPLICABLE",
    mediaState: "EXCLUDED",
    holdReason: null,
    rejectionReason: reviewState === "REJECTED" ? record.rejectionReason : null,
    recommendationState: record.recommendationState,
    hardMetadataState: record.hardMetadataState,
    ingredientMappingState: record.ingredientMappingState,
    coverage: record.coverage ? structuredClone(record.coverage) : null,
    provenance,
    runtimeArtifact: reviewState === "ADMITTED" && record.runtimeArtifact
      ? structuredClone(record.runtimeArtifact)
      : null,
    runtimeActivationAuthorized: false,
    legacyGateF2ReviewState: record.reviewState
  };
}

export function adaptGateF2LedgerToControlPlane(ledger) {
  assertValidGateF2Ledger(ledger);
  const source = gateF2SourceContract(ledger);
  const records = ledger.records.map(record => adaptGateF2Record(record, ledger));
  return createControlPlaneSnapshot(source, records, {
    sourceUniverseState: "GATE_F2_REVIEW_LEDGER_SNAPSHOT"
  });
}
