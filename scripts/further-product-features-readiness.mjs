export const FURTHER_PRODUCT_FEATURES_SCHEMA = "CULINARY_FURTHER_PRODUCT_FEATURES_READINESS_V1";

const REQUIRED_IDS = Object.freeze(["D1","D2","D3","D4","D5","D6"]);

export function validateFurtherProductFeaturesReadiness(config) {
  const errors = [];
  if (!config || typeof config !== "object") return ["config must be an object"];
  if (config.schemaVersion !== FURTHER_PRODUCT_FEATURES_SCHEMA) errors.push("unexpected schemaVersion");
  const allowedStates = new Set(["READINESS_AUDIT_PASS","POST_D3_REASSESSMENT_PASS"]);
  if (!allowedStates.has(config.state)) errors.push("unexpected readiness state");
  if (!config.currentFacts || typeof config.currentFacts !== "object") errors.push("currentFacts are required");
  if (!Array.isArray(config.capabilities)) return [...errors, "capabilities must be an array"];

  const ids = config.capabilities.map(row => row?.id);
  if (new Set(ids).size !== ids.length) errors.push("capability ids must be unique");
  for (const id of REQUIRED_IDS) if (!ids.includes(id)) errors.push(`missing capability ${id}`);

  const byId = new Map(config.capabilities.map(row => [row.id, row]));
  for (const row of config.capabilities) {
    if (row.runtimeActivationAuthorized !== false) errors.push(`${row.id}: runtimeActivationAuthorized must remain false`);
  }

  const d1 = byId.get("D1");
  if (config.currentFacts?.vitaminMineralSchemaReady !== true && d1?.state !== "BLOCKED") {
    errors.push("D1 must remain BLOCKED while vitamin/mineral schema is not ready");
  }

  const d3 = byId.get("D3");
  const d3AllowedStates = new Set(["READY_FOR_BOUNDED_P0_DESIGN","P0_DESIGN_CONTRACT_BUILT_VALIDATION_PENDING","P0_DESIGN_CONTRACT_PASS","P0_ASSET_PILOT_BUILT_VALIDATION_PENDING","P0_ASSET_PILOT_PASS","P0_BROWSER_INTEGRATION_BUILT_VALIDATION_PENDING","P0_BROWSER_INTEGRATION_PASS","P0_COMPLETE"]);
  if (!d3AllowedStates.has(d3?.state)) errors.push("D3 state is outside the bounded P0 design progression");
  if (d3?.mediaBoundary?.thirdPartyRecipeSourceImagesAuthorized !== false) errors.push("D3 third-party source images must remain unauthorized");
  if (d3?.mediaBoundary?.protectedCorpusSourceImagesAuthorized !== false) errors.push("D3 protected-corpus source images must remain unauthorized");
  if (d3?.mediaBoundary?.wikibooksCommonsImagesAuthorized !== false) errors.push("D3 Wikibooks/Commons images must remain unauthorized");
  if (d3?.mediaBoundary?.recordLevelProvenanceRequired !== true) errors.push("D3 requires record-level media provenance");
  if (d3?.mediaBoundary?.altTextRequired !== true) errors.push("D3 requires alt text");
  if (d3?.mediaBoundary?.performanceBudgetRequired !== true) errors.push("D3 requires an explicit performance budget");

  if (config.state === "POST_D3_REASSESSMENT_PASS" && d3?.state !== "P0_COMPLETE") {
    errors.push("D3 must be P0_COMPLETE before post-D3 reassessment");
  }

  const d5 = byId.get("D5");
  if (config.state === "POST_D3_REASSESSMENT_PASS") {
    if (config.selectedNextDesignCandidate !== "D5") errors.push("D5 must be the selected next design candidate after D3 closeout");
    if (d5?.state !== "READY_FOR_BOUNDED_ADAPTER_DESIGN") errors.push("D5 must be ready for bounded adapter design");
    const boundary = d5?.adapterBoundary || {};
    if (boundary.inputMode !== "USER_SELECTED_PORTABLE_BACKUP_ONLY") errors.push("D5 input must remain user-selected portable backup only");
    if (boundary.automaticFolderReadAuthorized !== false) errors.push("D5 automatic folder read must remain unauthorized");
    if (boundary.crossAppLocalStorageReadAuthorized !== false) errors.push("D5 cross-app localStorage read must remain unauthorized");
    if (boundary.cloudSyncAuthorized !== false) errors.push("D5 cloud sync must remain unauthorized");
    if (boundary.sourceAppMutationAuthorized !== false) errors.push("D5 source-app mutation must remain unauthorized");
    if (boundary.sensitiveWorkoutFieldsDefaultExcluded !== true) errors.push("D5 sensitive workout fields must be excluded by default");
    if (boundary.medicalInferenceAuthorized !== false) errors.push("D5 medical inference must remain unauthorized");
    if (boundary.calorieBurnEstimationAuthorized !== false) errors.push("D5 calorie-burn estimation must remain unauthorized");
    if (boundary.individualizedMacroOrSupplementPrescriptionAuthorized !== false) errors.push("D5 individualized macro/supplement prescription must remain unauthorized");
  }

  const d4 = byId.get("D4");
  if (d4?.state !== "BLOCKED") errors.push("D4 must remain BLOCKED without a lawful reliable price/user-evidence path");

  const d6 = byId.get("D6");
  if (config.currentFacts?.barbecuePilotComplete !== true && d6?.state !== "DEFERRED_OWNER_PRIORITY_SEQUENCE") {
    errors.push("D6 must preserve owner-priority sequencing while the barbecue pilot is incomplete");
  }

  const authority = config.authority || {};
  for (const key of [
    "publicRuntimeChangeAuthorized",
    "newExternalMediaAdmissionAuthorized",
    "protectedCorpusMutationAuthorized",
    "thirdD1ShardAuthorized",
    "paidInfrastructureAuthorized",
    "knowledgeCoreWriteAuthorized",
    "barbecueMutationAuthorized"
  ]) {
    if (authority[key] !== false) errors.push(`authority.${key} must remain false`);
  }
  if (authority.boundedDesignWorkAuthorized !== true) errors.push("bounded design work must be explicitly authorized");
  const expectedNextGate = config.state === "POST_D3_REASSESSMENT_PASS"
    ? "D5_FITNESS_INTEGRATION_P0_ADAPTER_DESIGN"
    : d3?.state === "READY_FOR_BOUNDED_P0_DESIGN"
      ? "D3_RECIPE_IMAGES_P0_DESIGN_CONTRACT"
      : d3?.state === "P0_DESIGN_CONTRACT_BUILT_VALIDATION_PENDING"
        ? "D3_RECIPE_IMAGES_P0_DESIGN_CONTRACT_VALIDATION"
        : d3?.state === "P0_DESIGN_CONTRACT_PASS"
          ? "D3_RECIPE_IMAGES_P0_ASSET_PILOT"
          : d3?.state === "P0_ASSET_PILOT_BUILT_VALIDATION_PENDING"
            ? "D3_RECIPE_IMAGES_P0_ASSET_PILOT_VALIDATION"
            : d3?.state === "P0_ASSET_PILOT_PASS"
              ? "D3_RECIPE_IMAGES_P0_BROWSER_INTEGRATION"
              : d3?.state === "P0_BROWSER_INTEGRATION_BUILT_VALIDATION_PENDING"
                ? "D3_RECIPE_IMAGES_P0_BROWSER_INTEGRATION_VALIDATION"
                : d3?.state === "P0_BROWSER_INTEGRATION_PASS"
                  ? "D3_RECIPE_IMAGES_P0_CLOSEOUT"
                  : "FURTHER_PRODUCT_FEATURES_REASSESSMENT_AFTER_D3";
  if (config.nextGate !== expectedNextGate) errors.push("unexpected nextGate");
  return errors;
}

export function summarizeFurtherProductFeaturesReadiness(config) {
  const errors = validateFurtherProductFeaturesReadiness(config);
  if (errors.length) return { pass: false, errors };
  const selected = config.capabilities.find(row => row.id === config.selectedNextDesignCandidate);
  return {
    pass: true,
    terminal: config.state === "POST_D3_REASSESSMENT_PASS" ? "FURTHER_PRODUCT_FEATURES_REASSESSMENT_AFTER_D3_PASS" : "FURTHER_PRODUCT_FEATURES_READINESS_PASS",
    selectedNextDesignCandidate: selected.id,
    selectedName: selected.name,
    selectedState: selected.state,
    blocked: config.capabilities.filter(row => row.state === "BLOCKED").map(row => row.id),
    deferred: config.capabilities.filter(row => row.state.startsWith("DEFERRED")).map(row => row.id),
    runtimeActivationAuthorized: false,
    nextGate: config.nextGate
  };
}
