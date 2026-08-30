import { normalizeIngredient, ingredientById } from "../data/ingredients.js";

const SPECIAL_EXCLUSION_ALIASES = new Map([
  ["coconut", "coconut_milk"],
  ["coco", "coconut_milk"],
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

export function resolvePermanentExclusion(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = normalizeIngredient(raw);
  if (normalized) {
    return { id: normalized, label: ingredientById(normalized)?.name || raw, recognized: true, futureOnly: false };
  }
  const special = SPECIAL_EXCLUSION_ALIASES.get(raw.toLowerCase());
  if (special) {
    const ingredient = ingredientById(special);
    return {
      id: special,
      label: special === "pineapple" ? "pineapple" : ingredient?.name || raw,
      recognized: Boolean(ingredient),
      futureOnly: !ingredient
    };
  }
  const id = slugify(raw);
  if (!id) return null;
  return { id, label: raw.toLowerCase(), recognized: false, futureOnly: true };
}

export function permanentExclusionLabel(id) {
  return ingredientById(id)?.name || String(id || "").replaceAll("_", " ");
}
