export const CULINARY_BRAIN_CORPUS_CALIBRATION_SCHEMA = "CULINARY_BRAIN_CORPUS_CALIBRATION_V1";

export function validateCulinaryBrainCorpusCalibration(config) {
  const errors = [];
  if (!config || typeof config !== "object") return ["config must be an object"];
  if (config.schemaVersion !== CULINARY_BRAIN_CORPUS_CALIBRATION_SCHEMA) errors.push("unexpected schemaVersion");
  if (config.pattern !== "FITNESS_BRAIN_CALIBRATION_ANALOGUE") errors.push("Fitness Brain analogue must remain explicit");
  if (config.knowledgeCoreDomain !== "culinary_nutrition") errors.push("culinary_nutrition must remain the canonical Brain domain");
  if (config.runtimeDependencyAuthorized !== false) errors.push("live Brain runtime dependency must remain unauthorized");
  if (config.executionRelationship?.browseSearchBlocksOnBrain !== false) errors.push("browse/search cannot block on Brain calibration");
  if (config.executionRelationship?.runsParallelWithMetadataUsability !== true) errors.push("Brain calibration must run parallel with metadata usability");
  if (config.executionRelationship?.goldenCalibrationRecipeCount !== 85) errors.push("golden calibration count must remain 85");
  if (config.executionRelationship?.initialProtectedPilotTarget !== 500) errors.push("protected pilot target must remain 500");
  if (config.executionRelationship?.fullCorpus?.version !== "v8018" || config.executionRelationship?.fullCorpus?.recipeCount !== 19268) errors.push("full corpus must remain v8018 / 19268");
  if (config.noMajorityVote !== true || config.disagreementOutcome !== "UNKNOWN_AMBIGUOUS_OR_REVIEW") errors.push("disagreement must fail closed rather than vote");

  const never = new Set(config.neverGrantedByBrainOrModelAlone || []);
  for (const field of ["SOURCE_RIGHTS","ALLERGEN_SAFETY","DIETARY_HARD_AUTHORITY","NUTRITION_AUTHORITY","PUBLIC_RECIPE_ADMISSION","RECOMMENDATION_ELIGIBILITY"]) {
    if (!never.has(field)) errors.push(`Brain authority firewall missing ${field}`);
  }

  const authority = config.authority || {};
  for (const [key,value] of Object.entries(authority)) {
    if (value !== false) errors.push(`authority.${key} must remain false`);
  }

  const expectedStages = [
    "C0_GOLDEN_85",
    "C1_STRATIFIED_PROTECTED_PILOT_APPROX_500",
    "C2_FROZEN_FULL_V8018_CLASSIFICATION",
    "C3_DETERMINISTIC_RECOMMENDATION_PRIOR_CALIBRATION",
    "C4_REAL_V8018_FAILURE_REPAIR_LOOP"
  ];
  if (JSON.stringify(config.calibrationStages) !== JSON.stringify(expectedStages)) errors.push("unexpected calibration stage sequence");
  return errors;
}
