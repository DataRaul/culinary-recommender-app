const SOURCE_ID = "WIKIBOOKS_COOKBOOK_GATE_F2";
const SOURCE_NAME = "English Wikibooks Cookbook";
const LICENSE = "CC-BY-SA-4.0";
const LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

export const GATE_F2_REVIEW_STATES = Object.freeze([
  "DISCOVERED_UNREVIEWED",
  "REVIEW_READY",
  "ADMITTED",
  "REJECTED"
]);

export const GATE_F2_RECOMMENDATION_STATES = Object.freeze([
  "SEARCH_ONLY",
  "REFERENCE_ONLY_INCOMPLETE_HARD_METADATA",
  "NOT_APPLICABLE"
]);

export const GATE_F2_HARD_METADATA_STATES = Object.freeze([
  "SEARCH_GATE_COMPLETE",
  "SEARCH_GATE_INCOMPLETE",
  "NOT_REVIEWED",
  "REJECTED"
]);

export const GATE_F2_INGREDIENT_MAPPING_STATES = Object.freeze([
  "NORMALIZED_GATE_F_V1",
  "UNRESOLVED",
  "NOT_REVIEWED",
  "NOT_APPLICABLE"
]);

export const GATE_F2_RECIPE_ROLES = Object.freeze([
  "staple_everyday",
  "canonical_classic",
  "regional_traditional",
  "contemporary_modern",
  "genuinely_new_trending",
  "constraint_first",
  "technique_learning"
]);

export const GATE_F2_SOURCE = Object.freeze({
  id: SOURCE_ID,
  name: SOURCE_NAME,
  category: "Category:Recipes",
  api: "https://en.wikibooks.org/w/api.php",
  license: LICENSE,
  licenseUrl: LICENSE_URL,
  attribution: "Wikibooks contributors; see the source page history",
  runtimeFetch: false,
  imagesBundled: false,
  sourceNutritionImportedAsAuthority: false,
  discoveryPayload: "METADATA_AND_EXACT_REVISION_IDS_ONLY"
});

const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;
const isIsoDateTime = value => isNonEmptyString(value) && Number.isFinite(Date.parse(value));

export const wikibooksPageUrl = title =>
  `https://en.wikibooks.org/wiki/${encodeURIComponent(title).replaceAll("%2F", "/")}`;

export const wikibooksRevisionUrl = revid =>
  `https://en.wikibooks.org/w/index.php?oldid=${revid}`;

const countBy = values => Object.fromEntries(
  [...values.reduce((map, value) => {
    const key = value ?? "unknown";
    map.set(String(key), (map.get(String(key)) || 0) + 1);
    return map;
  }, new Map()).entries()].sort((a, b) => a[0].localeCompare(b[0]))
);

const flatten = (records, getter) => records.flatMap(record => {
  const value = getter(record);
  return Array.isArray(value) ? value : [];
});

function validateCoverage(record, errors) {
  if (record.reviewState !== "ADMITTED") return;
  const coverage = record.coverage;
  if (!coverage || typeof coverage !== "object") {
    errors.push(`${record.id}: admitted records require coverage metadata`);
    return;
  }
  if (!isNonEmptyString(coverage.cuisine)) {
    errors.push(`${record.id}: admitted records require coverage.cuisine`);
  }
  if (!("region" in coverage)) {
    errors.push(`${record.id}: admitted records require explicit coverage.region (string or null)`);
  }
  if (!("country" in coverage)) {
    errors.push(`${record.id}: admitted records require explicit coverage.country (string or null)`);
  }
  for (const field of ["mealTypes", "recipeRoles", "constraintTags", "techniqueTags"]) {
    if (!Array.isArray(coverage[field])) {
      errors.push(`${record.id}: admitted records require coverage.${field} array`);
    }
  }
  for (const role of coverage.recipeRoles || []) {
    if (!GATE_F2_RECIPE_ROLES.includes(role)) {
      errors.push(`${record.id}: unknown recipe role ${role}`);
    }
  }
}

export function validateGateF2Ledger(ledger) {
  const errors = [];
  if (!ledger || typeof ledger !== "object") return ["ledger must be an object"];
  if (ledger.schemaVersion !== "wikibooks-gate-f2-review-ledger-v1") {
    errors.push("schemaVersion must be wikibooks-gate-f2-review-ledger-v1");
  }
  if (ledger.runtimeActivationAuthorized !== false) {
    errors.push("runtimeActivationAuthorized must remain false");
  }
  if (ledger.source?.runtimeFetch !== false) {
    errors.push("source.runtimeFetch must remain false");
  }
  if (ledger.source?.imagesBundled !== false) {
    errors.push("source.imagesBundled must remain false");
  }
  if (ledger.source?.sourceNutritionImportedAsAuthority !== false) {
    errors.push("source.sourceNutritionImportedAsAuthority must remain false");
  }
  if (ledger.source?.license !== LICENSE || ledger.source?.licenseUrl !== LICENSE_URL) {
    errors.push("source licence must remain CC-BY-SA-4.0 with the canonical licence URL");
  }
  if (!Array.isArray(ledger.records)) {
    errors.push("records must be an array");
    return errors;
  }

  const ids = new Set();
  const revisionKeys = new Set();

  for (const record of ledger.records) {
    const label = record?.id || record?.title || "record";
    if (!isNonEmptyString(record?.id)) errors.push(`${label}: id is required`);
    if (ids.has(record?.id)) errors.push(`${label}: duplicate id`);
    ids.add(record?.id);

    if (!GATE_F2_REVIEW_STATES.includes(record?.reviewState)) {
      errors.push(`${label}: invalid reviewState`);
    }
    if (!Number.isInteger(record?.pageid) || record.pageid <= 0) {
      errors.push(`${label}: positive integer pageid is required`);
    }
    if (!isNonEmptyString(record?.title) || !record.title.startsWith("Cookbook:")) {
      errors.push(`${label}: Cookbook: source title is required`);
    }
    if (!Number.isInteger(record?.revid) || record.revid <= 0) {
      errors.push(`${label}: positive integer revid is required`);
    }
    const timestampValid = isIsoDateTime(record?.timestamp);
    if (record?.reviewState === "REJECTED") {
      if (!timestampValid && record?.revisionTimestampState !== "NOT_RECORDED_IN_GATE_F_V1_REJECTION_SNAPSHOT") {
        errors.push(`${label}: rejected record needs a revision timestamp or explicit legacy timestamp state`);
      }
    } else if (!timestampValid) {
      errors.push(`${label}: valid revision timestamp is required`);
    }

    const revisionKey = `${record?.pageid}:${record?.revid}`;
    if (revisionKeys.has(revisionKey)) errors.push(`${label}: duplicate page/revision pair`);
    revisionKeys.add(revisionKey);

    if (record?.reviewState === "ADMITTED") {
      if (!isNonEmptyString(record.dishFamilyId)) {
        errors.push(`${label}: admitted record requires dishFamilyId`);
      }
      if (!isNonEmptyString(record.admissionState) || !record.admissionState.startsWith("ADMIT_")) {
        errors.push(`${label}: admitted record requires ADMIT_* admissionState`);
      }
      if (!GATE_F2_RECOMMENDATION_STATES.includes(record.recommendationState) ||
          record.recommendationState === "NOT_APPLICABLE") {
        errors.push(`${label}: admitted record requires a recommendationState`);
      }
      if (!GATE_F2_HARD_METADATA_STATES.includes(record.hardMetadataState) ||
          ["NOT_REVIEWED", "REJECTED"].includes(record.hardMetadataState)) {
        errors.push(`${label}: admitted record requires reviewed hardMetadataState`);
      }
      if (!GATE_F2_INGREDIENT_MAPPING_STATES.includes(record.ingredientMappingState) ||
          ["NOT_REVIEWED", "NOT_APPLICABLE"].includes(record.ingredientMappingState)) {
        errors.push(`${label}: admitted record requires reviewed ingredientMappingState`);
      }
      if (record.nutritionState !== "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED") {
        errors.push(`${label}: admitted record must preserve the nutrition firewall`);
      }
      if (!isNonEmptyString(record.runtimeArtifact?.module) || !isNonEmptyString(record.runtimeArtifact?.recipeId)) {
        errors.push(`${label}: admitted record requires an explicit existing runtimeArtifact pointer`);
      }
    }

    if (record?.reviewState === "REJECTED") {
      if (!isNonEmptyString(record.rejectionReason)) {
        errors.push(`${label}: rejected record requires rejectionReason`);
      }
      if (record.recommendationState !== "NOT_APPLICABLE") {
        errors.push(`${label}: rejected record recommendationState must be NOT_APPLICABLE`);
      }
      if (record.hardMetadataState !== "REJECTED") {
        errors.push(`${label}: rejected record hardMetadataState must be REJECTED`);
      }
      if (record.ingredientMappingState !== "NOT_APPLICABLE") {
        errors.push(`${label}: rejected record ingredientMappingState must be NOT_APPLICABLE`);
      }
      if (record.runtimeArtifact !== null) {
        errors.push(`${label}: rejected record runtimeArtifact must be null`);
      }
    }

    if (["DISCOVERED_UNREVIEWED", "REVIEW_READY"].includes(record?.reviewState)) {
      if (record.runtimeArtifact !== null) {
        errors.push(`${label}: unadmitted record runtimeArtifact must be null`);
      }
      if (record.recommendationState !== "NOT_APPLICABLE") {
        errors.push(`${label}: unadmitted record recommendationState must be NOT_APPLICABLE`);
      }
    }

    validateCoverage(record, errors);
  }

  return errors;
}

export function assertValidGateF2Ledger(ledger) {
  const errors = validateGateF2Ledger(ledger);
  if (errors.length) {
    throw new Error(`Invalid Gate F2 review ledger:\n- ${errors.join("\n- ")}`);
  }
  return ledger;
}

function compactProvenance(record, source) {
  return {
    sourceName: source.name,
    sourcePageTitle: record.title,
    sourcePageId: record.pageid,
    sourceRevisionId: record.revid,
    sourceRevisionTimestamp: record.timestamp,
    sourceUrl: wikibooksPageUrl(record.title),
    sourceRevisionUrl: wikibooksRevisionUrl(record.revid),
    attribution: source.attribution,
    license: source.license,
    licenseUrl: source.licenseUrl,
    mediaIncluded: false,
    sourceNutritionImportedAsAuthority: false
  };
}

export function buildGateF2CompactIndex(ledger) {
  assertValidGateF2Ledger(ledger);
  const admitted = ledger.records
    .filter(record => record.reviewState === "ADMITTED")
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(record => ({
      id: record.id,
      dishFamilyId: record.dishFamilyId,
      reviewState: record.reviewState,
      admissionState: record.admissionState,
      recommendationState: record.recommendationState,
      hardMetadataState: record.hardMetadataState,
      ingredientMappingState: record.ingredientMappingState,
      nutritionState: record.nutritionState,
      coverage: record.coverage,
      runtimeArtifact: record.runtimeArtifact,
      provenance: compactProvenance(record, ledger.source)
    }));

  const rejections = ledger.records
    .filter(record => record.reviewState === "REJECTED")
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(record => ({
      id: record.id,
      title: record.title,
      pageid: record.pageid,
      revid: record.revid,
      timestamp: record.timestamp,
      rejectionReason: record.rejectionReason,
      provenance: compactProvenance(record, ledger.source)
    }));

  return {
    schemaVersion: "wikibooks-gate-f2-compact-index-v1",
    sourceId: ledger.source.id,
    generatedFromLedgerSchema: ledger.schemaVersion,
    runtimeActivationAuthorized: false,
    admittedRecordCount: admitted.length,
    rejectedRecordCount: rejections.length,
    records: admitted,
    reviewedRejections: rejections
  };
}

export function gateF2CoverageReport(ledger) {
  assertValidGateF2Ledger(ledger);
  const admitted = ledger.records.filter(record => record.reviewState === "ADMITTED");
  const rejected = ledger.records.filter(record => record.reviewState === "REJECTED");
  const discovered = ledger.records.filter(record => record.reviewState === "DISCOVERED_UNREVIEWED");
  const reviewReady = ledger.records.filter(record => record.reviewState === "REVIEW_READY");

  const roleCounts = Object.fromEntries(GATE_F2_RECIPE_ROLES.map(role => [role, 0]));
  for (const role of flatten(admitted, record => record.coverage.recipeRoles)) {
    roleCounts[role] += 1;
  }

  return {
    schemaVersion: "wikibooks-gate-f2-coverage-report-v1",
    runtimeActivationAuthorized: false,
    sourceMeasuredRecipePages: ledger.discoveryMeasuredRecipePages ?? null,
    trackedRecordCount: ledger.records.length,
    discoveryUnreviewedCount: discovered.length,
    reviewReadyCount: reviewReady.length,
    admittedCount: admitted.length,
    rejectedCount: rejected.length,
    searchOnlyCount: admitted.filter(record => record.recommendationState === "SEARCH_ONLY").length,
    referenceOnlyCount: admitted.filter(record => record.recommendationState === "REFERENCE_ONLY_INCOMPLETE_HARD_METADATA").length,
    dishFamilyCount: new Set(admitted.map(record => record.dishFamilyId)).size,
    cuisineCounts: countBy(admitted.map(record => record.coverage.cuisine)),
    regionCounts: countBy(admitted.map(record => record.coverage.region)),
    countryCounts: countBy(admitted.map(record => record.coverage.country)),
    mealTypeCounts: countBy(flatten(admitted, record => record.coverage.mealTypes)),
    constraintTagCounts: countBy(flatten(admitted, record => record.coverage.constraintTags)),
    techniqueTagCounts: countBy(flatten(admitted, record => record.coverage.techniqueTags)),
    recipeRoleCounts: roleCounts,
    missingRecipeRoles: GATE_F2_RECIPE_ROLES.filter(role => roleCounts[role] === 0),
    rejectionReasonCounts: countBy(rejected.map(record => record.rejectionReason)),
    exactRevisionPinnedCount: ledger.records.filter(record => Number.isInteger(record.revid)).length,
    nutritionFirewallCount: admitted.filter(record => record.nutritionState === "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED").length,
    unresolvedIngredientMappingCount: admitted.filter(record => record.ingredientMappingState === "UNRESOLVED").length,
    policies: {
      runtimeFetch: false,
      runtimeActivationAuthorized: false,
      mediaIncluded: false,
      sourceNutritionImportedAsAuthority: false,
      unknownMetadataMayBeGuessed: false
    }
  };
}
