import { INGREDIENTS, normalizeIngredient, ingredientById, ingredientFamilies } from "../data/ingredients.js";

const SPECIAL_EXCLUSION_ALIASES = new Map([
  ["coco", "coconut"],
  ["pineapple", "pineapple"],
  ["pina", "pineapple"],
  ["piña", "pineapple"]
]);

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const familyExists = id => Object.values(INGREDIENTS).some(ingredient =>
  ingredient.family === id || ingredient.families?.includes(id)
);

export function ingredientMatchesPermanentExclusion(ingredientId, exclusionId) {
  if (!ingredientId || !exclusionId) return false;
  if (ingredientId === exclusionId) return true;
  if (ingredientFamilies(ingredientId).includes(exclusionId)) return true;
  return ingredientId.startsWith(`${exclusionId}_`);
}

export function isIngredientPermanentlyExcluded(ingredientId, excludedIngredientIds = []) {
  return (excludedIngredientIds || []).some(exclusionId => ingredientMatchesPermanentExclusion(ingredientId, exclusionId));
}

export function resolvePermanentExclusion(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  // A generic family name such as "coconut" intentionally takes precedence over one current form.
  const rawId = slugify(raw);
  if (familyExists(rawId)) {
    return { id: rawId, label: raw.toLowerCase(), recognized: true, familyWide: true, futureOnly: false };
  }

  const normalized = normalizeIngredient(raw);
  if (normalized) {
    return { id: normalized, label: ingredientById(normalized)?.name || raw, recognized: true, familyWide: false, futureOnly: false };
  }

  const special = SPECIAL_EXCLUSION_ALIASES.get(raw.toLowerCase());
  if (special) {
    const familyWide = familyExists(special);
    const ingredient = ingredientById(special);
    return {
      id: special,
      label: special === "pineapple" ? "pineapple" : raw.toLowerCase(),
      recognized: familyWide || Boolean(ingredient),
      familyWide,
      futureOnly: !familyWide && !ingredient
    };
  }

  if (!rawId) return null;
  return { id: rawId, label: raw.toLowerCase(), recognized: false, familyWide: false, futureOnly: true };
}

export function permanentExclusionLabel(id) {
  if (familyExists(id)) return `${String(id).replaceAll("_", " ")} · all forms`;
  return ingredientById(id)?.name || String(id || "").replaceAll("_", " ");
}
