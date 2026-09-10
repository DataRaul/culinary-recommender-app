export const STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION = "CORPUS_SCALE_STEP8C_SOURCE_QUALIFICATION_V1";

export const STEP8C_OUTCOMES = Object.freeze({
  QUALIFIED: "QUALIFIED_PROTECTED_POPULATION_INPUT",
  HOLD: "HOLD_RIGHTS_AMBIGUOUS",
  SALVAGE_ONLY: "SOURCE_COHORT_SALVAGE_ONLY",
  REJECT: "REJECT_RIGHTS_INCOMPATIBLE"
});

const SHA40 = /^[a-f0-9]{40}$/;
const SHA64 = /^[a-f0-9]{64}$/;
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;

function pushIf(errors, condition, code) {
  if (condition) errors.push(code);
}

function validateEvidenceRefs(source, errors) {
  pushIf(errors, !Array.isArray(source.evidenceRefs) || source.evidenceRefs.length < 2, "INSUFFICIENT_EVIDENCE_REFS");
  if (Array.isArray(source.evidenceRefs)) {
    pushIf(errors, source.evidenceRefs.some(ref => !isNonEmptyString(ref)), "INVALID_EVIDENCE_REF");
  }
}

function validateImmutableSnapshot(source, errors) {
  const snapshot = source.snapshot;
  pushIf(errors, !isObject(snapshot), "IMMUTABLE_SNAPSHOT_MISSING");
  if (!isObject(snapshot)) return;
  pushIf(errors, !isNonEmptyString(snapshot.repository), "SNAPSHOT_REPOSITORY_MISSING");
  pushIf(errors, !SHA40.test(snapshot.commit || ""), "SNAPSHOT_COMMIT_INVALID");
  pushIf(errors, !isNonEmptyString(snapshot.dataPath), "SNAPSHOT_DATA_PATH_MISSING");
  pushIf(errors, !SHA40.test(snapshot.dataBlobSha || ""), "SNAPSHOT_DATA_BLOB_INVALID");
  pushIf(errors, !isNonEmptyString(snapshot.datasetVersion), "SNAPSHOT_DATASET_VERSION_MISSING");
  pushIf(errors, !Number.isInteger(snapshot.recordCount) || snapshot.recordCount <= 0, "SNAPSHOT_RECORD_COUNT_INVALID");
  pushIf(errors, snapshot.mutableLatestUrlUsedAsIdentity === true, "MUTABLE_LATEST_URL_CANNOT_BE_SOURCE_IDENTITY");
}

function validateContentRights(source, errors) {
  const rights = source.rights;
  pushIf(errors, !isObject(rights), "CONTENT_RIGHTS_MISSING");
  if (!isObject(rights)) return;
  pushIf(errors, rights.contentLevelLicenseExplicit !== true, "CONTENT_LEVEL_LICENSE_NOT_EXPLICIT");
  pushIf(errors, !isNonEmptyString(rights.licenseId), "LICENSE_ID_MISSING");
  pushIf(errors, rights.reproductionAllowed !== true, "REPRODUCTION_RIGHT_NOT_ESTABLISHED");
  pushIf(errors, rights.transformationAllowed !== true, "TRANSFORMATION_RIGHT_NOT_ESTABLISHED");
  pushIf(errors, rights.storageAndRehostingAllowed !== true, "STORAGE_REHOSTING_RIGHT_NOT_ESTABLISHED");
  pushIf(errors, rights.attributionRequirementsRecorded !== true, "ATTRIBUTION_REQUIREMENTS_NOT_RECORDED");
  pushIf(errors, rights.shareAlikeRequirementsRecorded !== true && /BY-SA/.test(rights.licenseId || ""), "SHAREALIKE_REQUIREMENTS_NOT_RECORDED");
}

function validateAuthorityFirewalls(source, errors) {
  const boundaries = source.boundaries;
  pushIf(errors, !isObject(boundaries), "SOURCE_BOUNDARIES_MISSING");
  if (!isObject(boundaries)) return;
  pushIf(errors, boundaries.mediaExcluded !== true, "MEDIA_MUST_BE_EXCLUDED");
  pushIf(errors, boundaries.sourceNutritionAuthoritative !== false, "SOURCE_NUTRITION_AUTHORITY_MUST_BE_FALSE");
  pushIf(errors, boundaries.sourceDietaryAllergenClaimsAuthoritative !== false, "SOURCE_DIETARY_ALLERGEN_AUTHORITY_MUST_BE_FALSE");
  pushIf(errors, boundaries.sourceScalingRulesPromotedToCanonicalQuantity !== false, "SOURCE_SCALING_PROMOTION_MUST_BE_FALSE");
  pushIf(errors, boundaries.automaticAppAdmissionAuthorized !== false, "AUTOMATIC_APP_ADMISSION_MUST_BE_FALSE");
  pushIf(errors, boundaries.publicRuntimeActivationAuthorized !== false, "PUBLIC_RUNTIME_AUTHORITY_MUST_BE_FALSE");
  pushIf(errors, boundaries.knowledgeCoreWriteAuthorized !== false, "KNOWLEDGE_CORE_WRITE_MUST_BE_FALSE");
}

export function evaluateStep8CSourceQualification(source = {}) {
  if (!isObject(source)) throw new Error("source qualification input must be an object");
  const errors = [];
  pushIf(errors, !isNonEmptyString(source.id), "SOURCE_ID_MISSING");
  pushIf(errors, !isNonEmptyString(source.name), "SOURCE_NAME_MISSING");
  validateEvidenceRefs(source, errors);
  validateImmutableSnapshot(source, errors);
  validateContentRights(source, errors);
  validateAuthorityFirewalls(source, errors);

  const provenance = source.provenance || {};
  if (provenance.knownUnderlyingThirdPartyRecipeProse === true) {
    if (provenance.recordLevelRightsResolutionRequired === true) {
      return {
        contractVersion: STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION,
        sourceId: source.id || null,
        outcome: STEP8C_OUTCOMES.SALVAGE_ONLY,
        protectedPopulationAllowed: false,
        reasons: ["UNDERLYING_THIRD_PARTY_RECIPE_PROSE_REQUIRES_RECORD_OR_COHORT_RIGHTS_RESOLUTION"],
        errors
      };
    }
    return {
      contractVersion: STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION,
      sourceId: source.id || null,
      outcome: STEP8C_OUTCOMES.HOLD,
      protectedPopulationAllowed: false,
      reasons: ["UNDERLYING_THIRD_PARTY_RECIPE_PROSE_RIGHTS_UNRESOLVED"],
      errors
    };
  }

  if (provenance.transformationLayerRightsExplicit === false && provenance.materialModernTransformationObserved === true) {
    return {
      contractVersion: STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION,
      sourceId: source.id || null,
      outcome: STEP8C_OUTCOMES.HOLD,
      protectedPopulationAllowed: false,
      reasons: ["MATERIAL_MODERN_TRANSFORMATION_LAYER_RIGHTS_UNRESOLVED"],
      errors
    };
  }

  if (errors.length) {
    return {
      contractVersion: STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION,
      sourceId: source.id || null,
      outcome: STEP8C_OUTCOMES.HOLD,
      protectedPopulationAllowed: false,
      reasons: [...errors],
      errors
    };
  }

  return {
    contractVersion: STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION,
    sourceId: source.id,
    outcome: STEP8C_OUTCOMES.QUALIFIED,
    protectedPopulationAllowed: true,
    qualifiedRecordCount: source.snapshot.recordCount,
    sourceVersion: source.snapshot.datasetVersion,
    immutableCommit: source.snapshot.commit,
    dataBlobSha: source.snapshot.dataBlobSha,
    licenseId: source.rights.licenseId,
    obligations: {
      attributionRequired: source.rights.attributionRequired === true,
      shareAlikeRequired: source.rights.shareAlikeRequired === true,
      nonCommercialOnly: source.rights.nonCommercialOnly === true
    },
    authority: {
      protectedPopulationInputOnly: true,
      publicRuntimeActivationAuthorized: false,
      automaticAppAdmissionAuthorized: false,
      sourceNutritionAuthoritative: false
    },
    reasons: ["PINNED_CONTENT_LEVEL_RIGHTS_AND_PROVENANCE_EVIDENCE_COMPLETE"],
    errors: []
  };
}

export function evaluateStep8CPortfolio(sources = []) {
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("sources must be a non-empty array");
  const ids = new Set();
  const results = sources.map(source => {
    if (ids.has(source.id)) throw new Error(`duplicate Step 8C source id: ${source.id}`);
    ids.add(source.id);
    return evaluateStep8CSourceQualification(source);
  });
  const qualified = results.filter(result => result.outcome === STEP8C_OUTCOMES.QUALIFIED);
  return {
    contractVersion: STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION,
    results,
    terminal: qualified.length
      ? "STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE"
      : "STEP_8C_NO_SCALABLE_RIGHTS_CLEAN_COHORT_YET",
    protectedPopulationInputs: qualified.map(result => ({
      sourceId: result.sourceId,
      recordCount: result.qualifiedRecordCount,
      sourceVersion: result.sourceVersion,
      immutableCommit: result.immutableCommit,
      dataBlobSha: result.dataBlobSha,
      licenseId: result.licenseId
    }))
  };
}

export function validateStep8CTerminalEvidence(evidence = {}) {
  const errors = [];
  pushIf(errors, evidence.repositoryOnly !== true, "STEP8C_MUST_BE_REPOSITORY_ONLY");
  pushIf(errors, !SHA64.test(evidence.evidenceFingerprint || ""), "EVIDENCE_FINGERPRINT_INVALID");
  pushIf(errors, evidence.corpusPopulationPerformed !== false, "CORPUS_POPULATION_MUST_REMAIN_FALSE");
  pushIf(errors, evidence.createdRecipeBodyShards !== 0, "RECIPE_BODY_SHARDS_MUST_REMAIN_ZERO");
  pushIf(errors, evidence.publicRuntimeChanged !== false, "PUBLIC_RUNTIME_MUST_REMAIN_UNCHANGED");
  pushIf(errors, evidence.billingAuthorizationObserved !== false, "BILLING_AUTHORIZATION_MUST_REMAIN_FALSE");
  pushIf(errors, evidence.youtubeStateModified !== false, "YT_CUL_STATE_MUST_REMAIN_UNCHANGED");
  pushIf(errors, evidence.nutritionBLaneModified !== false, "NUTRITION_B_MUST_REMAIN_UNCHANGED");
  pushIf(errors, evidence.knowledgeCoreWritePerformed !== false, "KNOWLEDGE_CORE_WRITE_MUST_REMAIN_FALSE");
  return {
    pass: errors.length === 0,
    terminal: errors.length === 0 ? evidence.portfolioTerminal || null : null,
    errors
  };
}
