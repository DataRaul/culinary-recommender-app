import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";
import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { buildStep8DArtifacts } from "./corpus-scale-step8d-core.mjs";

export const STEP8E_PREFLIGHT_VERSION = "CORPUS_SCALE_STEP8E_PREFLIGHT_V1";

const norm = value => String(value ?? "")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const countBy = values => Object.entries(values.reduce((acc, value) => {
  const key = String(value ?? "<null>");
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));

export function resolveStep8EIngredient(sourceIngredient) {
  const sourceName = sourceIngredient?.name?.en || null;
  const sourceIdText = sourceIngredient?.id == null ? null : String(sourceIngredient.id).replace(/[_-]+/g, " ");
  const nameMapping = sourceName ? normalizeIngredient(sourceName) : null;
  const sourceIdDiagnosticMapping = sourceIdText ? normalizeIngredient(sourceIdText) : null;
  const mappings = [...new Set([nameMapping, sourceIdDiagnosticMapping].filter(Boolean))];

  let status = "UNRESOLVED";
  let canonicalIngredientId = null;
  if (nameMapping && sourceIdDiagnosticMapping && nameMapping !== sourceIdDiagnosticMapping) {
    status = "CONFLICT";
  } else if (nameMapping) {
    status = "RESOLVED";
    canonicalIngredientId = nameMapping;
  }

  return {
    candidates: [sourceName, sourceIdText].filter(Boolean),
    status,
    canonicalIngredientId,
    mappings,
    nameMapping,
    sourceIdDiagnosticMapping,
    identityAuthority: "SOURCE_ENGLISH_NAME_THROUGH_EXISTING_CANONICAL_ALIAS_INDEX",
    sourceIdUsedAsAuthority: false
  };
}

export function step8ETitleKey(value) {
  return norm(value);
}

function existingTitleIndex() {
  const index = new Map();
  for (const recipe of ALL_RECIPES) {
    const title = recipe.identity?.canonicalTitle || recipe.title || recipe.name || recipe.id;
    const key = step8ETitleKey(title);
    if (!key) continue;
    const list = index.get(key) || [];
    list.push(recipe.id);
    index.set(key, list);
  }
  return index;
}

export function scanStep8EReadiness(dataset, contract) {
  const artifacts = buildStep8DArtifacts(dataset, contract);
  const titleIndex = existingTitleIndex();
  const ingredientOccurrences = [];
  const recipeRows = [];
  const sourceUnits = [];
  const difficulties = [];
  const categories = [];
  let resolvedIngredientOccurrences = 0;
  let unresolvedIngredientOccurrences = 0;
  let conflictingIngredientOccurrences = 0;
  let numericQuantityOccurrences = 0;
  let nullQuantityOccurrences = 0;
  let nonPositiveQuantityOccurrences = 0;

  for (const [ordinal, sourceRecipe] of dataset.recipes.entries()) {
    const packet = artifacts.packets[ordinal];
    const mappings = [];
    let allIngredientsMapped = true;
    let allQuantitiesPositiveOrExplicitNull = true;
    for (const ingredient of sourceRecipe.ingredients || []) {
      const resolved = resolveStep8EIngredient(ingredient);
      mappings.push({
        sourceId: ingredient.id ?? null,
        sourceName: ingredient.name?.en ?? ingredient.name?.ru ?? null,
        sourceUnit: ingredient.unit ?? null,
        sourceQuantity: ingredient.quantity ?? null,
        ...resolved
      });
      sourceUnits.push(ingredient.unit ?? null);
      ingredientOccurrences.push({
        id: ingredient.id ?? null,
        name: ingredient.name?.en ?? ingredient.name?.ru ?? null,
        status: resolved.status,
        canonicalIngredientId: resolved.canonicalIngredientId
      });
      if (resolved.status === "RESOLVED") resolvedIngredientOccurrences += 1;
      else {
        allIngredientsMapped = false;
        if (resolved.status === "CONFLICT") conflictingIngredientOccurrences += 1;
        else unresolvedIngredientOccurrences += 1;
      }
      if (ingredient.quantity == null) {
        nullQuantityOccurrences += 1;
      } else if (typeof ingredient.quantity === "number" && Number.isFinite(ingredient.quantity) && ingredient.quantity > 0) {
        numericQuantityOccurrences += 1;
      } else {
        nonPositiveQuantityOccurrences += 1;
        allQuantitiesPositiveOrExplicitNull = false;
      }
    }

    const totalMinutes = [sourceRecipe.prepMinutes, sourceRecipe.cookMinutes]
      .filter(value => typeof value === "number" && Number.isFinite(value) && value >= 0)
      .reduce((sum, value) => sum + value, 0);
    const hasBothTimeParts = [sourceRecipe.prepMinutes, sourceRecipe.cookMinutes]
      .every(value => typeof value === "number" && Number.isFinite(value) && value >= 0);
    const title = sourceRecipe.name?.en || sourceRecipe.nativeName || sourceRecipe.slug;
    const titleKey = step8ETitleKey(title);
    const exactTitleMatches = titleIndex.get(titleKey) || [];
    difficulties.push(sourceRecipe.difficulty ?? null);
    categories.push(sourceRecipe.category ?? null);

    recipeRows.push({
      ordinal,
      recipeId: packet.identity.recipeId,
      sourceSlug: sourceRecipe.slug,
      title,
      titleKey,
      ingredientCount: mappings.length,
      allIngredientsMapped,
      allQuantitiesPositiveOrExplicitNull,
      hasBothTimeParts,
      totalMinutes: hasBothTimeParts ? totalMinutes : null,
      baseServingsExplicit: typeof sourceRecipe.baseServings === "number" && Number.isFinite(sourceRecipe.baseServings) && sourceRecipe.baseServings > 0,
      difficulty: sourceRecipe.difficulty ?? null,
      category: sourceRecipe.category ?? null,
      country: sourceRecipe.country ?? null,
      exactTitleMatches,
      ingredientMappings: mappings
    });
  }

  const unresolved = countBy(ingredientOccurrences
    .filter(item => item.status !== "RESOLVED")
    .map(item => `${item.id ?? "<no-id>"} :: ${item.name ?? "<no-name>"} :: ${item.status}`));
  const resolvedIds = countBy(ingredientOccurrences
    .filter(item => item.status === "RESOLVED")
    .map(item => item.canonicalIngredientId));

  return {
    preflightVersion: STEP8E_PREFLIGHT_VERSION,
    pass: true,
    terminalCandidate: "STEP8E_PREFLIGHT_READINESS_COMPLETE",
    source: {
      sourceCohortId: contract.source.sourceCohortId,
      repository: contract.source.repository,
      commit: contract.source.commit,
      dataPath: contract.source.dataPath,
      dataBlobSha: contract.source.dataBlobSha,
      datasetVersion: dataset.version,
      recipeCount: dataset.recipes.length
    },
    inheritedStep8D: {
      manifestSha256: artifacts.manifest.manifestSha256,
      populationPlanSha256: artifacts.populationPlan.populationPlanSha256,
      packetCount: artifacts.packets.length,
      publicRecommendationEligible: artifacts.manifest.authority.publicRecommendationEligible
    },
    ontology: {
      canonicalIngredientCount: Object.keys(INGREDIENTS).length,
      ingredientOccurrences: ingredientOccurrences.length,
      resolvedIngredientOccurrences,
      unresolvedIngredientOccurrences,
      conflictingIngredientOccurrences,
      recipesAllIngredientsMapped: recipeRows.filter(row => row.allIngredientsMapped).length,
      unresolvedTop: unresolved.slice(0, 100),
      resolvedCanonicalIds: resolvedIds,
      sourceIdUsedAsIdentityAuthority: false
    },
    quantities: {
      numericQuantityOccurrences,
      nullQuantityOccurrences,
      nonPositiveQuantityOccurrences,
      recipesAllQuantitiesPositiveOrExplicitNull: recipeRows.filter(row => row.allQuantitiesPositiveOrExplicitNull).length,
      sourceUnits: countBy(sourceUnits)
    },
    hardMetadata: {
      recipesWithBothTimeParts: recipeRows.filter(row => row.hasBothTimeParts).length,
      recipesWithExplicitPositiveServings: recipeRows.filter(row => row.baseServingsExplicit).length,
      difficultyValues: countBy(difficulties),
      categoryValues: countBy(categories),
      countryCount: new Set(recipeRows.map(row => row.country).filter(Boolean)).size
    },
    duplicateSignals: {
      exactTitleMatchRecipeCount: recipeRows.filter(row => row.exactTitleMatches.length > 0).length,
      rows: recipeRows.filter(row => row.exactTitleMatches.length > 0).map(row => ({
        recipeId: row.recipeId,
        title: row.title,
        exactTitleMatches: row.exactTitleMatches
      }))
    },
    recipeRows,
    boundaries: {
      admissionDecisionsPerformed: false,
      publicRuntimeChanged: false,
      d1WritesPerformed: 0,
      thirdShardUsed: false,
      billingExpansion: false,
      nutritionLaneModified: false,
      youtubeCulinaryStateModified: false,
      knowledgeCoreWritePerformed: false
    }
  };
}
