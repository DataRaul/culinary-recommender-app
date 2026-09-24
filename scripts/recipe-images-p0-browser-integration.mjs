export const RECIPE_IMAGES_P0_BROWSER_INTEGRATION_SCHEMA = "CULINARY_RECIPE_IMAGES_P0_BROWSER_INTEGRATION_V1";

const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function validateRecipeImagesP0BrowserIntegration(integration, pilot) {
  const errors = [];
  if (!isObject(integration)) return ["browser integration config must be an object"];
  if (integration.schemaVersion !== RECIPE_IMAGES_P0_BROWSER_INTEGRATION_SCHEMA) errors.push("unexpected browser integration schemaVersion");
  if (!["BROWSER_INTEGRATION_BUILT_VALIDATION_PENDING","BROWSER_INTEGRATION_PASS"].includes(integration.state)) {
    errors.push("unexpected browser integration state");
  }
  if (integration.entryGate !== "D3_RECIPE_IMAGES_P0_ASSET_PILOT_PASS") errors.push("browser integration entry gate mismatch");
  if (integration.assetPilot !== "config/recipe_images_p0_asset_pilot.json") errors.push("asset pilot path mismatch");

  const expectedIds = (pilot?.assets || []).map(row => row.recipeId).sort();
  const actualIds = [...(integration.exactRecipeIds || [])].sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) errors.push("browser integration recipe IDs must exactly match the validated asset pilot");
  if (!Array.isArray(integration.surfaces) || !integration.surfaces.includes("PLAN_RECIPE_CARD") || !integration.surfaces.includes("INGREDIENT_SEARCH_RESULT_CARD")) {
    errors.push("browser integration must cover plan and ingredient-search cards");
  }

  const presentation = integration.presentation || {};
  if (presentation.aspectRatio !== "4:3") errors.push("browser integration aspect ratio must remain 4:3");
  if (presentation.width !== 960 || presentation.height !== 720) errors.push("browser integration dimensions must remain 960x720");
  for (const key of ["lazyLoading","asyncDecode","altTextFromValidatedRegistry","sameOriginAssetsOnly","offlineCacheExactPilotAssets","fallbackOnLoadError","fallbackPreservesRecipeContent"]) {
    if (presentation[key] !== true) errors.push(`presentation.${key} must be true`);
  }

  for (const [key, value] of Object.entries(integration.behavior || {})) {
    if (value !== false) errors.push(`behavior.${key} must remain false`);
  }

  if (integration.mediaAuthority?.exactPilotUiMediaActivationAuthorized !== true) {
    errors.push("exact pilot UI media activation must be explicit");
  }
  for (const key of [
    "thirdPartyRecipeSourceMediaAuthorized",
    "protectedCorpusSourceMediaAuthorized",
    "wikibooksCommonsMediaAuthorized",
    "remoteMediaAuthorized",
    "stockMediaAuthorized"
  ]) {
    if (integration.mediaAuthority?.[key] !== false) errors.push(`mediaAuthority.${key} must remain false`);
  }

  for (const [key, value] of Object.entries(integration.infrastructureAuthority || {})) {
    if (value !== false) errors.push(`infrastructureAuthority.${key} must remain false`);
  }

  if (integration.passTerminal !== "D3_RECIPE_IMAGES_P0_BROWSER_INTEGRATION_PASS") errors.push("unexpected passTerminal");
  if (integration.nextGateOnPass !== "D3_RECIPE_IMAGES_P0_CLOSEOUT") errors.push("unexpected nextGateOnPass");
  return errors;
}

export function summarizeRecipeImagesP0BrowserIntegration(integration, pilot) {
  const errors = validateRecipeImagesP0BrowserIntegration(integration, pilot);
  return errors.length ? { pass: false, errors } : {
    pass: true,
    terminal: integration.passTerminal,
    state: integration.state,
    recipeCount: integration.exactRecipeIds.length,
    surfaces: [...integration.surfaces],
    publicRecipeRuntimeChanged: false,
    externalMediaAdmissionAuthorized: false,
    protectedCorpusMutationAuthorized: false,
    nextGate: integration.nextGateOnPass
  };
}
