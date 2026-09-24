import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  extractFitnessContextFromWorkoutBackup,
  validateFitnessIntegrationP0Config,
  validateWorkoutBackupForFitnessContext
} from "../scripts/fitness-integration-p0.mjs";

const config = JSON.parse(
  await readFile(new URL("../config/fitness_integration_p0.json", import.meta.url), "utf8")
);

function backup(overrides = {}) {
  const base = {
    schemaVersion: 3,
    profile: {
      name: "Must not cross the adapter",
      goal: "hypertrophy",
      level: "intermediate",
      daysPerWeek: 3,
      sessionMinutes: 60,
      durationWeeks: 12,
      equipmentPreset: "full_gym",
      equipment: ["barbell"],
      constraints: ["back_pain"],
      favorites: ["exercise-private"],
      trainingWeekdays: [1,3,5],
      workoutDays: [{ name: "Private structure" }]
    },
    activeProgram: { id: "private-program", workouts: [{ exercises: [{ weight: 100, reps: 8, rir: 2 }] }] },
    activeSession: { id: "private-session" },
    history: [{ id: "private-history", weight: 100, reps: 8, rir: 2 }],
    gym: { unavailableExerciseIds: ["private-gym-state"] },
    preferences: { readinessCheck: { value: "private-readiness" }, language: "en" }
  };
  return { ...base, ...overrides };
}

test("D5 P0 design contract is valid and authorizes design only", () => {
  assert.deepEqual(validateFitnessIntegrationP0Config(config), []);
  assert.equal(config.sourceContract.inputMode, "USER_SELECTED_LOCAL_FILE_ONLY");
  assert.equal(config.minimization.rawBackupPersistenceAllowed, false);
  assert.equal(config.authority.adapterPrototypeAuthorized, false);
  assert.equal(config.authority.publicRuntimeActivationAuthorized, false);
  assert.equal(config.nextGate, "D5_FITNESS_INTEGRATION_P0_ADAPTER_PROTOTYPE");
});

test("P0 extracts only the exact minimum fitness-planning context", () => {
  assert.deepEqual(validateWorkoutBackupForFitnessContext(backup(), config), []);
  assert.deepEqual(extractFitnessContextFromWorkoutBackup(backup(), config), {
    sourceBackupSchemaVersion: 3,
    trainingGoal: "hypertrophy",
    plannedTrainingDaysPerWeek: 3,
    plannedSessionMinutes: 60,
    preferredTrainingWeekdays: [1,3,5]
  });
});

test("sensitive workout fields cannot leak through the extracted context", () => {
  const context = extractFitnessContextFromWorkoutBackup(backup(), config);
  const serialized = JSON.stringify(context);
  for (const forbidden of [
    "Must not cross the adapter",
    "back_pain",
    "intermediate",
    "barbell",
    "exercise-private",
    "private-program",
    "private-session",
    "private-history",
    "private-gym-state",
    "private-readiness",
    "weight",
    "rir"
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.deepEqual(Object.keys(context), config.fieldContract.outputFields);
});

test("unsupported or malformed workout backups fail closed", () => {
  for (const candidate of [
    { schemaVersion: 999, profile: backup().profile },
    { schemaVersion: 3, profile: null },
    { schemaVersion: 3, profile: { ...backup().profile, goal: "medical_rehab" } },
    { schemaVersion: 3, profile: { ...backup().profile, daysPerWeek: 7 } },
    { schemaVersion: 3, profile: { ...backup().profile, sessionMinutes: 120 } },
    { schemaVersion: 3, profile: { ...backup().profile, trainingWeekdays: [1,1,5] } },
    { schemaVersion: 3, profile: { ...backup().profile, trainingWeekdays: [1,3] } }
  ]) {
    assert.notDeepEqual(validateWorkoutBackupForFitnessContext(candidate, config), []);
    assert.throws(() => extractFitnessContextFromWorkoutBackup(candidate, config));
  }
});

test("fitness context never gains culinary, medical, calorie or nutrition authority", () => {
  for (const [key,value] of Object.entries(config.behaviorFirewalls)) {
    assert.equal(value, false, key);
  }
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
    const mutated = structuredClone(config);
    mutated.authority[key] = true;
    assert.ok(validateFitnessIntegrationP0Config(mutated).some(error => error.includes(key)));
  }
});
