import { normalizeProfile } from "./profile.js";

export const OWNER_SECONDARY_PLAN_SOURCE = "OWNER_LIMITED_EVIDENCE_V21";
export const OWNER_SECONDARY_PLAN_VALIDATION_STATE = "LIMITED_EVIDENCE_NOT_PRIMARY_VALIDATED";
export const OWNER_SECONDARY_MAX_RESULTS_PER_REQUEST = 20;
export const OWNER_SECONDARY_MAX_PLANNING_PAGES_PER_MEAL = 11;

const hasValues = value => Array.isArray(value) && value.length > 0;
const finiteNonNegative = value => typeof value === "number" && Number.isFinite(value) && value >= 0;

export function ownerSecondaryPlanningEligibility(rawProfile = {}) {
  const profile = normalizeProfile(rawProfile);
  const reasons = [];
  if (profile.dietaryMode !== "unrestricted") reasons.push("DIETARY_MODE_RESTRICTED");
  if (hasValues(profile.allergens)) reasons.push("ALLERGEN_FILTER_PRESENT");
  if (hasValues(profile.excludedIngredientIds)) reasons.push("INGREDIENT_EXCLUSION_PRESENT");
  if (hasValues(profile.unavailableIngredientIds)) reasons.push("UNAVAILABLE_INGREDIENT_PRESENT");
  if (profile.skill < 4) reasons.push("SKILL_BELOW_OWNER_LANE_MAXIMUM");
  return { eligible: reasons.length === 0, reasons, profile };
}

export function ownerSecondarySourceTotalMinutes(item = {}) {
  if (!finiteNonNegative(item.prepMinutes) || !finiteNonNegative(item.cookMinutes)) return null;
  return item.prepMinutes + item.cookMinutes;
}

export function ownerSecondaryCandidateFits(item, rawProfile, excludedIds = []) {
  const eligibility = ownerSecondaryPlanningEligibility(rawProfile);
  if (!eligibility.eligible) return false;
  const id = String(item?.protectedRecipeId || "");
  if (!id || new Set(excludedIds.map(String)).has(id)) return false;
  if (item?.recommendationValidationState !== OWNER_SECONDARY_PLAN_VALIDATION_STATE) return false;
  if (!item?.sourceProvenance?.sourceCohortId) return false;
  const totalMinutes = ownerSecondarySourceTotalMinutes(item);
  if (totalMinutes == null || totalMinutes > eligibility.profile.maxMinutes) return false;
  const ingredients = Array.isArray(item?.ingredients) ? item.ingredients.filter(Boolean) : [];
  const methodSteps = Array.isArray(item?.methodSteps) && item.methodSteps.length
    ? item.methodSteps
    : (Array.isArray(item?.directions) ? item.directions.map(text => ({ text })) : []);
  if (!ingredients.length || !methodSteps.some(step => String(step?.text || "").trim())) return false;
  return true;
}

export function chooseOwnerSecondarySwapCandidate(items, rawProfile, excludedIds = []) {
  return (Array.isArray(items) ? items : []).find(item => ownerSecondaryCandidateFits(item, rawProfile, excludedIds)) || null;
}

export function applyOwnerSecondaryFallbacks(primaryPlan, poolsByMealType, rawProfile, { excludeIds = [] } = {}) {
  const items = Array.isArray(primaryPlan?.items) ? primaryPlan.items : [];
  const shortfalls = Array.isArray(primaryPlan?.shortfalls) ? primaryPlan.shortfalls : [];
  const requestedSlotCount = items.length + shortfalls.length;
  const eligibility = ownerSecondaryPlanningEligibility(rawProfile);
  if (!eligibility.eligible) {
    return {
      ...primaryPlan,
      secondaryItems: [],
      shortfalls,
      complete: primaryPlan?.complete === true,
      secondaryFallback: {
        eligible: false,
        reasons: eligibility.reasons,
        requestedShortfallSlots: shortfalls.length,
        filledSlots: 0
      }
    };
  }

  const used = new Set(excludeIds.map(String));
  const secondaryItems = [];
  const unresolved = [];
  for (const shortfall of shortfalls) {
    const mealType = String(shortfall?.slot?.mealType || "");
    const pool = Array.isArray(poolsByMealType?.[mealType]) ? poolsByMealType[mealType] : [];
    const candidate = pool.find(row => ownerSecondaryCandidateFits(row, eligibility.profile, [...used]));
    if (!candidate) {
      unresolved.push(shortfall);
      continue;
    }
    used.add(String(candidate.protectedRecipeId));
    secondaryItems.push({
      ...candidate,
      slot: shortfall.slot,
      planSource: OWNER_SECONDARY_PLAN_SOURCE,
      sourceTotalMinutes: ownerSecondarySourceTotalMinutes(candidate)
    });
  }

  return {
    ...primaryPlan,
    secondaryItems,
    shortfalls: unresolved,
    complete: items.length + secondaryItems.length === requestedSlotCount,
    secondaryFallback: {
      eligible: true,
      reasons: [],
      requestedShortfallSlots: shortfalls.length,
      filledSlots: secondaryItems.length
    }
  };
}
