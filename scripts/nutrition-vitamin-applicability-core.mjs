import { normalizeIngredient } from "../src/data/ingredients.js";

const normalizeSpace = value => String(value ?? "").replace(/\s+/g, " ").trim();

export function cleanIngredientIdentityCandidate(line) {
  let value = String(line ?? "")
    .replace(/^\s*[-*+]\s+/, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();

  value = value.replace(/^~\s*/, "");
  value = value.replace(/^\d+\s+\d+\/\d+\s+/, "");
  value = value.replace(/^\d+\/\d+\s+/, "");
  value = value.replace(
    /^\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*(?:kg|g|mg|lb|lbs|oz|l|ml|cl|dl|tsp|tbsp|teaspoon|teaspoons|tablespoon|tablespoons|cup|cups|can|cans|jar|jars|package|packages|piece|pieces)?\b\s*/i,
    ""
  );
  value = value.replace(/^\([^)]*\)\s*/, "");
  value = value.replace(/^(?:of\s+)/i, "");
  value = value.replace(/\s*,\s*(?:chopped|diced|minced|sliced|crushed|grated|peeled|trimmed|to taste).*$/i, "");
  return normalizeSpace(value);
}

export function exactIdentityAudit(rawNames, { clean = false } = {}) {
  const rows = [];
  for (const raw of rawNames || []) {
    const candidate = clean ? cleanIngredientIdentityCandidate(raw) : normalizeSpace(raw);
    if (!candidate) continue;
    const canonicalIngredientId = normalizeIngredient(candidate);
    rows.push({
      raw: normalizeSpace(raw),
      candidate,
      canonicalIngredientId: canonicalIngredientId || null,
      state: canonicalIngredientId ? "EXACT_ALIAS_MATCH" : "UNRESOLVED"
    });
  }
  const resolved = rows.filter(row => row.canonicalIngredientId).length;
  return {
    occurrenceCount: rows.length,
    resolvedOccurrenceCount: resolved,
    unresolvedOccurrenceCount: rows.length - resolved,
    resolvedOccurrenceRatio: rows.length ? Number((resolved / rows.length).toFixed(6)) : 0,
    allResolved: rows.length > 0 && resolved === rows.length,
    rows
  };
}

export function prepareUnitoolsNutritionCandidate(sourceRecipe) {
  const ingredients = [];
  const blockers = [];
  for (const [index, ingredient] of (sourceRecipe?.ingredients || []).entries()) {
    const sourceName = ingredient?.name?.en || null;
    const canonicalIngredientId = sourceName ? normalizeIngredient(sourceName) : null;
    if (!canonicalIngredientId) {
      blockers.push({ index, reason: "IDENTITY_UNRESOLVED", sourceName });
      continue;
    }
    const quantity = ingredient?.quantity;
    const unit = typeof ingredient?.unit === "string" ? ingredient.unit.trim() : "";
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      blockers.push({ index, reason: "STRUCTURED_QUANTITY_NOT_POSITIVE", sourceName, canonicalIngredientId });
      continue;
    }
    if (!unit) {
      blockers.push({ index, reason: "STRUCTURED_UNIT_MISSING", sourceName, canonicalIngredientId });
      continue;
    }
    ingredients.push({
      canonicalIngredientId,
      quantity,
      unit,
      required: true
    });
  }

  const servings = sourceRecipe?.baseServings;
  if (typeof servings !== "number" || !Number.isFinite(servings) || servings <= 0) {
    blockers.push({ index: null, reason: "SERVINGS_NOT_POSITIVE_EXPLICIT", sourceName: null });
  }

  const expectedIngredientCount = Array.isArray(sourceRecipe?.ingredients) ? sourceRecipe.ingredients.length : 0;
  const ready = expectedIngredientCount > 0 &&
    ingredients.length === expectedIngredientCount &&
    blockers.length === 0;

  return {
    ready,
    blockers,
    recipe: ready ? {
      id: `nutrition-audit-unitools-${sourceRecipe.slug || "unknown"}`,
      ingredients,
      serving: { servings },
      nutrition: {
        perServing: {
          energyKcal: null,
          proteinG: null,
          carbohydrateG: null,
          fatG: null,
          fibreG: null
        },
        estimationState: "AUDIT_ONLY_NO_SOURCE_NUTRITION_IMPORT",
        confidence: "unknown",
        provenance: "Audit-only exact source structure."
      }
    } : null
  };
}

export function compactCoverageAudit(audit) {
  return {
    recipeCount: audit.recipeCount,
    authoritativeRecipeCount: audit.authoritativeRecipeCount,
    estimateRecipeCount: audit.estimateRecipeCount,
    authoritativeRecipeRatio: audit.authoritativeRecipeRatio,
    sourceSelectionStateCounts: audit.sourceSelectionStateCounts,
    methodCounts: audit.methodCounts,
    blockerCounts: audit.blockerCounts,
    missingNutrientFieldCounts: audit.missingNutrientFieldCounts,
    semanticIssueCounts: audit.semanticIssueCounts,
    authoritativeRecipeIds: audit.authoritativeRecipeIds
  };
}

export function detectTrackedNutrientKeys(nutritionModuleText) {
  const match = /const\s+nutrientKeys\s*=\s*\[([^\]]+)\]/m.exec(String(nutritionModuleText ?? ""));
  if (!match) throw new Error("NUTRIENT_KEYS_DECLARATION_NOT_FOUND");
  return [...match[1].matchAll(/"([^"]+)"/g)].map(item => item[1]);
}

export function classifyVitaminMineralCapability(trackedKeys) {
  const macroKeys = new Set(["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"]);
  const nonMacroKeys = (trackedKeys || []).filter(key => !macroKeys.has(key));
  return {
    trackedNutrientKeys: [...(trackedKeys || [])],
    macroTrackedKeys: (trackedKeys || []).filter(key => macroKeys.has(key)),
    vitaminMineralTrackedKeys: nonMacroKeys,
    vitaminMineralSchemaReady: nonMacroKeys.length > 0,
    authoritativeVitaminMineralRecipeCount: 0,
    state: nonMacroKeys.length > 0 ? "REQUIRES_SEPARATE_VALUE_COVERAGE_AUDIT" : "SCHEMA_NOT_IMPLEMENTED",
    note: nonMacroKeys.length > 0
      ? "Non-macro fields are present in the engine and require a separate source/value coverage check."
      : "The current authoritative calculation engine exposes only energy, protein, carbohydrate, fat and fibre. No vitamin/mineral values are inferred from source datasets."
  };
}
