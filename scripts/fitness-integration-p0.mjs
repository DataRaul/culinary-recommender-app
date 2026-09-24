export const FITNESS_INTEGRATION_P0_SCHEMA = "CULINARY_FITNESS_INTEGRATION_P0_DESIGN_V1";

const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const unique = values => [...new Set(values)];

export function validateFitnessIntegrationP0Config(config) {
  const errors = [];
  if (!isObject(config)) return ["config must be an object"];
  if (config.schemaVersion !== FITNESS_INTEGRATION_P0_SCHEMA) errors.push("unexpected schemaVersion");
  if (config.state !== "P0_ADAPTER_DESIGN_CONTRACT") errors.push("state must be P0_ADAPTER_DESIGN_CONTRACT");
  if (config.entryTerminal !== "FURTHER_PRODUCT_FEATURES_REASSESSMENT_AFTER_D3_PASS") errors.push("entry terminal mismatch");
  if (config.capabilityId !== "D5") errors.push("capabilityId must be D5");

  const source = config.sourceContract || {};
  if (source.repository !== "DataRaul/Mobile-first-workout-recommendation-app") errors.push("unexpected workout source repository");
  if (!/^[a-f0-9]{40}$/.test(source.pinnedMainSha || "")) errors.push("source main SHA must be pinned");
  if (source.portableBackupFileName !== "workout-recommender-backup.json") errors.push("unexpected portable backup filename");
  if (JSON.stringify(source.acceptedBackupSchemaVersions) !== JSON.stringify([2,3])) errors.push("P0 must accept only workout backup schemas 2 and 3");
  if (source.preferredBackupSchemaVersion !== 3) errors.push("preferred workout backup schema must be 3");
  if (source.inputMode !== "USER_SELECTED_LOCAL_FILE_ONLY") errors.push("input must remain user-selected local file only");
  for (const key of [
    "automaticFolderReadAllowed",
    "crossAppLocalStorageReadAllowed",
    "cloudSyncAllowed",
    "sourceAppMutationAllowed",
    "automaticRefreshAllowed"
  ]) {
    if (source[key] !== false) errors.push(`sourceContract.${key} must remain false`);
  }

  const fields = config.fieldContract || {};
  const requiredAllowed = [
    "schemaVersion",
    "profile.goal",
    "profile.daysPerWeek",
    "profile.sessionMinutes",
    "profile.trainingWeekdays"
  ];
  if (JSON.stringify(fields.allowedSourceFields) !== JSON.stringify(requiredAllowed)) errors.push("allowed source fields must remain the exact P0 allowlist");
  const requiredOutputs = [
    "sourceBackupSchemaVersion",
    "trainingGoal",
    "plannedTrainingDaysPerWeek",
    "plannedSessionMinutes",
    "preferredTrainingWeekdays"
  ];
  if (JSON.stringify(fields.outputFields) !== JSON.stringify(requiredOutputs)) errors.push("output fields must remain the exact P0 context shape");
  if (!Array.isArray(fields.allowedTrainingGoals) || fields.allowedTrainingGoals.length !== 7) errors.push("training goal allowlist is required");
  if (JSON.stringify(fields.allowedDaysPerWeek) !== JSON.stringify([2,3,4,5,6])) errors.push("days-per-week allowlist mismatch");
  if (JSON.stringify(fields.allowedSessionMinutes) !== JSON.stringify([30,45,60,75])) errors.push("session-minute allowlist mismatch");
  if (JSON.stringify(fields.weekdayValues) !== JSON.stringify([0,1,2,3,4,5,6])) errors.push("weekday allowlist mismatch");

  const minimization = config.minimization || {};
  for (const key of [
    "rawBackupPersistenceAllowed",
    "sourceBackupHashPersistenceAllowed",
    "sourceNameAllowed",
    "sourceConstraintsAllowed",
    "sourceLevelAllowed",
    "sourceEquipmentAllowed",
    "sourceFavoritesAllowed",
    "sourceWorkoutStructureAllowed",
    "sourceProgrammeDetailsAllowed",
    "sourceActiveSessionAllowed",
    "sourceHistoryAllowed",
    "sourceSetLoadRepsRirAllowed",
    "sourceGymStateAllowed",
    "sourceReadinessCheckAllowed",
    "sourcePreferenceDetailsAllowed"
  ]) {
    if (minimization[key] !== false) errors.push(`minimization.${key} must remain false`);
  }
  if (minimization.unknownFieldsIgnoredNotPersisted !== true) errors.push("unknown fields must be ignored and not persisted");
  if (minimization.explicitPreviewBeforeAnyFuturePersistenceRequired !== true) errors.push("future persistence requires an explicit preview");

  for (const [key,value] of Object.entries(config.behaviorFirewalls || {})) {
    if (value !== false) errors.push(`behaviorFirewalls.${key} must remain false`);
  }

  const authority = config.authority || {};
  if (authority.designContractAuthorized !== true) errors.push("design contract must be explicitly authorized");
  for (const key of [
    "adapterPrototypeAuthorized",
    "publicRuntimeActivationAuthorized",
    "culinaryBehaviorChangeAuthorized",
    "protectedD1WriteAuthorized",
    "thirdD1ShardAuthorized",
    "paidInfrastructureAuthorized",
    "knowledgeCoreWriteAuthorized",
    "workoutRepositoryWriteAuthorized",
    "barbecueMutationAuthorized"
  ]) {
    if (authority[key] !== false) errors.push(`authority.${key} must remain false`);
  }
  if (config.nextGate !== "D5_FITNESS_INTEGRATION_P0_ADAPTER_PROTOTYPE") errors.push("unexpected nextGate");
  return errors;
}

export function validateWorkoutBackupForFitnessContext(backup, config) {
  const errors = [];
  if (!isObject(backup)) return ["backup must be an object"];
  const source = config?.sourceContract || {};
  if (!source.acceptedBackupSchemaVersions?.includes(backup.schemaVersion)) errors.push("unsupported workout backup schema");
  if (!isObject(backup.profile)) return [...errors, "workout backup profile is required"];

  const fields = config?.fieldContract || {};
  if (!fields.allowedTrainingGoals?.includes(backup.profile.goal)) errors.push("unsupported training goal");
  if (!fields.allowedDaysPerWeek?.includes(Number(backup.profile.daysPerWeek))) errors.push("unsupported training days per week");
  if (!fields.allowedSessionMinutes?.includes(Number(backup.profile.sessionMinutes))) errors.push("unsupported session minutes");

  if (backup.profile.trainingWeekdays != null) {
    if (!Array.isArray(backup.profile.trainingWeekdays)) {
      errors.push("training weekdays must be an array when present");
    } else {
      const days = backup.profile.trainingWeekdays.map(Number);
      if (days.some(day => !fields.weekdayValues?.includes(day))) errors.push("training weekdays contain an unsupported value");
      if (unique(days).length !== days.length) errors.push("training weekdays must be unique");
      if (days.length !== Number(backup.profile.daysPerWeek)) errors.push("training weekdays must match days per week when present");
    }
  }
  return errors;
}

export function extractFitnessContextFromWorkoutBackup(backup, config) {
  const configErrors = validateFitnessIntegrationP0Config(config);
  if (configErrors.length) throw new Error(`Invalid Fitness Integration P0 config:\n- ${configErrors.join("\n- ")}`);
  const errors = validateWorkoutBackupForFitnessContext(backup, config);
  if (errors.length) throw new Error(`Workout backup is not admissible for P0 fitness context:\n- ${errors.join("\n- ")}`);

  const weekdays = Array.isArray(backup.profile.trainingWeekdays)
    ? backup.profile.trainingWeekdays.map(Number)
    : [];

  return {
    sourceBackupSchemaVersion: Number(backup.schemaVersion),
    trainingGoal: backup.profile.goal,
    plannedTrainingDaysPerWeek: Number(backup.profile.daysPerWeek),
    plannedSessionMinutes: Number(backup.profile.sessionMinutes),
    preferredTrainingWeekdays: weekdays
  };
}
