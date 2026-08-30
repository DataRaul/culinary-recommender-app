import { DEFAULT_PROFILE, normalizeProfile } from "./profile.js";
import { DEFAULT_PANTRY_STAPLES } from "../data/ingredients.js";

export const STORAGE_KEY = "culinary-recommender.state.v1";
export const SCHEMA_VERSION = 1;

export const DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  profile: normalizeProfile({ ...DEFAULT_PROFILE, pantryStapleIds: DEFAULT_PANTRY_STAPLES }),
  selectedSlotIds: ["mon-lunch", "tue-lunch", "wed-dinner", "fri-dinner", "sat-dinner"],
  plan: null,
  savedPlans: [],
  recommendationHistory: [],
  preferences: { language: "en", reducedMotion: false },
  availabilityHistory: []
};

const clone = value => JSON.parse(JSON.stringify(value));

export function normalizeState(input = {}) {
  const value = input && typeof input === "object" ? input : {};
  return {
    ...clone(DEFAULT_STATE),
    ...value,
    schemaVersion: SCHEMA_VERSION,
    profile: normalizeProfile(value.profile || DEFAULT_STATE.profile),
    selectedSlotIds: Array.isArray(value.selectedSlotIds) ? [...new Set(value.selectedSlotIds)] : [...DEFAULT_STATE.selectedSlotIds],
    savedPlans: Array.isArray(value.savedPlans) ? value.savedPlans : [],
    recommendationHistory: Array.isArray(value.recommendationHistory) ? value.recommendationHistory : [],
    availabilityHistory: Array.isArray(value.availabilityHistory) ? value.availabilityHistory : [],
    preferences: { ...DEFAULT_STATE.preferences, ...(value.preferences || {}) }
  };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
    if (parsed?.schemaVersion === SCHEMA_VERSION) return normalizeState(parsed);
  } catch {}
  return clone(DEFAULT_STATE);
}

export function saveState(state, storage = globalThis.localStorage) {
  const normalized = normalizeState(state);
  storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function exportState(state) {
  return JSON.stringify(normalizeState(state), null, 2);
}

export function importState(text) {
  const parsed = JSON.parse(text);
  if (parsed?.schemaVersion !== SCHEMA_VERSION) throw new Error("Unsupported Culinary Recommender backup schema.");
  return normalizeState(parsed);
}
