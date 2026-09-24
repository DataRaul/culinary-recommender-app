export const FURTHER_PRODUCT_FEATURES_SCHEMA = "CULINARY_FURTHER_PRODUCT_FEATURES_READINESS_V1";

const REQUIRED_IDS = Object.freeze(["D1","D2","D3","D4","D5","D6"]);

export function validateFurtherProductFeaturesReadiness(config) {
  const errors = [];
  if (!config || typeof config !== "object") return ["config must be an object"];
  if (config.schemaVersion !== FURTHER_PRODUCT_FEATURES_SCHEMA) errors.push("unexpected schemaVersion");
  if (config.state !== "READINESS_AUDIT_PASS") errors.push("state must be READINESS_AUDIT_PASS");
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
  if (config.selectedNextDesignCandidate !== "D3") errors.push("D3 must be the selected next design candidate for this audit");
  const d3AllowedStates = new Set(["READY_FOR_BOUNDED_P0_DESIGN","P0_DESIGN_CONTRACT_BUILT_VALIDATION_PENDING","P0_DESIGN_CONTRACT_PASS","P0_ASSET_PILOT_BUILT_VALIDATION_PENDING","P0_ASSET_PILOT_PASS"]);
  if (!d3AllowedStates.has(d3?.state)) errors.push("D3 state is outside the bounded P0 design progression");
  if (d3?.mediaBoundary?.thirdPartyRecipeSourceImagesAuthorized !== false) errors.push("D3 third-party source images must remain unauthorized");
  if (d3?.mediaBoundary?.protectedCorpusSourceImagesAuthorized !== false) errors.push("D3 protected-corpus source images must remain unauthorized");
  if (d3?.mediaBoundary?.wikibooksCommonsImagesAuthorized !== false) errors.push("D3 Wikibooks/Commons images must remain unauthorized");
  if (d3?.mediaBoundary?.recordLevelProvenanceRequired !== true) errors.push("D3 requires record-level media provenance");
  if (d3?.mediaBoundary?.altTextRequired !== true) errors.push("D3 requires alt text");
  if (d3?.mediaBoundary?.performanceBudgetRequired !== true) errors.push("D3 requires an explicit performance budget");

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
  const expectedNextGate = d3?.state === "READY_FOR_BOUNDED_P0_DESIGN"
    ? "D3_RECIPE_IMAGES_P0_DESIGN_CONTRACT"
    : d3?.state === "P0_DESIGN_CONTRACT_BUILT_VALIDATION_PENDING"
      ? "D3_RECIPE_IMAGES_P0_DESIGN_CONTRACT_VALIDATION"
      : d3?.state === "P0_DESIGN_CONTRACT_PASS"
        ? "D3_RECIPE_IMAGES_P0_ASSET_PILOT"
        : d3?.state === "P0_ASSET_PILOT_BUILT_VALIDATION_PENDING"
          ? "D3_RECIPE_IMAGES_P0_ASSET_PILOT_VALIDATION"
          : "D3_RECIPE_IMAGES_P0_BROWSER_INTEGRATION";
  if (config.nextGate !== expectedNextGate) errors.push("unexpected nextGate");
  return errors;
}

export function summarizeFurtherProductFeaturesReadiness(config) {
  const errors = validateFurtherProductFeaturesReadiness(config);
  if (errors.length) return { pass: false, errors };
  const selected = config.capabilities.find(row => row.id === config.selectedNextDesignCandidate);
  return {
    pass: true,
    terminal: "FURTHER_PRODUCT_FEATURES_READINESS_PASS",
    selectedNextDesignCandidate: selected.id,
    selectedName: selected.name,
    selectedState: selected.state,
    blocked: config.capabilities.filter(row => row.state === "BLOCKED").map(row => row.id),
    deferred: config.capabilities.filter(row => row.state.startsWith("DEFERRED")).map(row => row.id),
    runtimeActivationAuthorized: false,
    nextGate: config.nextGate
  };
}
