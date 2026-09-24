export const FITNESS_CONTEXT_OUTPUT_FIELDS = Object.freeze([
  "sourceBackupSchemaVersion",
  "trainingGoal",
  "plannedTrainingDaysPerWeek",
  "plannedSessionMinutes",
  "preferredTrainingWeekdays"
]);

export const FITNESS_CONTEXT_SOURCE_FIELDS = Object.freeze([
  "schemaVersion",
  "profile.goal",
  "profile.daysPerWeek",
  "profile.sessionMinutes",
  "profile.trainingWeekdays"
]);

const ACCEPTED_SCHEMAS = new Set([2, 3]);
const ALLOWED_GOALS = new Set(["strength","hypertrophy","power","endurance","general","conditioning","mobility"]);
const ALLOWED_DAYS = new Set([2,3,4,5,6]);
const ALLOWED_SESSION_MINUTES = new Set([30,45,60,75]);
const ALLOWED_WEEKDAYS = new Set([0,1,2,3,4,5,6]);
const isObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function normalizeWeekdays(value, plannedDays) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error("Training weekdays must be an array when present.");
  const days = value.map(Number);
  if (days.some(day => !ALLOWED_WEEKDAYS.has(day))) throw new Error("Training weekdays contain an unsupported value.");
  if (new Set(days).size !== days.length) throw new Error("Training weekdays must be unique.");
  if (days.length !== plannedDays) throw new Error("Training weekdays must match planned training days when present.");
  return days;
}

export function validateWorkoutBackupForFitnessContext(backup) {
  const errors = [];
  if (!isObject(backup)) return ["Workout backup must be an object."];
  if (!ACCEPTED_SCHEMAS.has(Number(backup.schemaVersion))) errors.push("Unsupported workout backup schema.");
  if (!isObject(backup.profile)) return [...errors, "Workout backup profile is required."];

  const goal = backup.profile.goal;
  const days = Number(backup.profile.daysPerWeek);
  const minutes = Number(backup.profile.sessionMinutes);
  if (!ALLOWED_GOALS.has(goal)) errors.push("Unsupported training goal.");
  if (!ALLOWED_DAYS.has(days)) errors.push("Unsupported training days per week.");
  if (!ALLOWED_SESSION_MINUTES.has(minutes)) errors.push("Unsupported session minutes.");
  try { normalizeWeekdays(backup.profile.trainingWeekdays, days); }
  catch (error) { errors.push(error.message); }
  return errors;
}

export function extractFitnessContextFromWorkoutBackup(backup) {
  const errors = validateWorkoutBackupForFitnessContext(backup);
  if (errors.length) throw new Error(errors.join(" "));
  const days = Number(backup.profile.daysPerWeek);
  return {
    sourceBackupSchemaVersion: Number(backup.schemaVersion),
    trainingGoal: backup.profile.goal,
    plannedTrainingDaysPerWeek: days,
    plannedSessionMinutes: Number(backup.profile.sessionMinutes),
    preferredTrainingWeekdays: normalizeWeekdays(backup.profile.trainingWeekdays, days)
  };
}

export function parseWorkoutBackupForFitnessContext(text) {
  let backup;
  try { backup = JSON.parse(text); }
  catch { throw new Error("Workout backup is not valid JSON."); }
  return extractFitnessContextFromWorkoutBackup(backup);
}

export function sanitizeFitnessContext(value) {
  if (!isObject(value)) return null;
  const days = Number(value.plannedTrainingDaysPerWeek);
  const schema = Number(value.sourceBackupSchemaVersion);
  const minutes = Number(value.plannedSessionMinutes);
  const goal = value.trainingGoal;
  if (!ACCEPTED_SCHEMAS.has(schema) || !ALLOWED_GOALS.has(goal) || !ALLOWED_DAYS.has(days) || !ALLOWED_SESSION_MINUTES.has(minutes)) return null;

  let weekdays;
  const weekdayInput = Array.isArray(value.preferredTrainingWeekdays) && value.preferredTrainingWeekdays.length === 0
    ? null
    : value.preferredTrainingWeekdays;
  try { weekdays = normalizeWeekdays(weekdayInput, days); }
  catch { return null; }

  return {
    sourceBackupSchemaVersion: schema,
    trainingGoal: goal,
    plannedTrainingDaysPerWeek: days,
    plannedSessionMinutes: minutes,
    preferredTrainingWeekdays: weekdays
  };
}
