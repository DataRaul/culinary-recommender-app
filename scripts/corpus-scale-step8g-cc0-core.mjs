import { INGREDIENTS, normalizeIngredient } from "../src/data/ingredients.js";

export const STEP8G_CC0_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_CC0_MARKDOWN_MARGINAL_VALUE_V1";
export const STEP8G_CC0_CANDIDATE_TERMINAL = "STEP_8G_CC0_MARKDOWN_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const STEP8G_CC0_LOW_VALUE_TERMINAL = "STEP_8G_STOP_MARGINAL_VALUE_LOW";

const normalize = value => String(value ?? "")
  .normalize("NFKD")
  .replace(/\p{M}+/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const addNormalized = (set, value) => {
  const normalized = normalize(value);
  if (normalized) set.add(normalized);
};

const markdownText = value => String(value ?? "")
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/[*_`]/g, "")
  .trim();

function cleanIngredientLine(line) {
  let value = markdownText(String(line ?? "").replace(/^\s*[-*+]\s+/, ""));
  value = value.replace(/^~\s*/, "");
  value = value.replace(/^\d+\s+\d+\/\d+\s+/, "");
  value = value.replace(/^\d+\/\d+\s+/, "");
  value = value.replace(/^\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*(?:kg|g|mg|lb|lbs|oz|l|ml|cl|dl|tsp|tbsp|cup|cups|can|cans|jar|jars|package|packages|piece|pieces)?\b\s*/i, "");
  value = value.replace(/^\([^)]*\)\s*/, "");
  value = value.replace(/^(?:of\s+)/i, "");
  return value.trim();
}

function sectionBody(markdown, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$`, "im");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const rest = markdown.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

export function parseCc0MarkdownRecipe(markdown, { fileName = "unknown.md" } = {}) {
  const text = String(markdown ?? "");
  const titleMatch = /^#\s+(.+)$/m.exec(text);
  const ingredientsBody = sectionBody(text, "Ingredients");
  const directionsBody = sectionBody(text, "(?:Directions|Instructions|Method)");
  const tagsMatch = /^;tags:\s*(.+)$/mi.exec(text);

  const ingredients = ingredientsBody
    .split(/\r?\n/)
    .filter(line => /^\s*[-*+]\s+/.test(line))
    .map(cleanIngredientLine)
    .filter(Boolean);

  const directions = directionsBody
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*(?:\d+[.)]|[-*+])\s*/, "").trim())
    .filter(Boolean);

  const tags = tagsMatch
    ? tagsMatch[1].split(/\s+/).map(markdownText).filter(Boolean)
    : [];

  return {
    fileName,
    title: markdownText(titleMatch?.[1] ?? ""),
    ingredients,
    directions,
    tags,
    quality: {
      hasTitle: Boolean(titleMatch?.[1]?.trim()),
      hasIngredients: ingredients.length > 0,
      hasDirections: directions.length > 0,
      hasTags: tags.length > 0
    }
  };
}

function publicTitle(recipe) {
  return recipe?.identity?.canonicalTitle || recipe?.title || recipe?.id || "";
}

function publicIngredientNames(recipe) {
  return (recipe?.ingredients || []).flatMap(ingredient => [
    ingredient?.name?.en,
    typeof ingredient?.name === "string" ? ingredient.name : null,
    ingredient?.label
  ]).filter(Boolean);
}

function publicDirectCanonicalIds(recipe) {
  const ids = [];
  for (const ingredient of recipe?.ingredients || []) {
    for (const candidate of [ingredient?.ingredientId, ingredient?.id]) {
      if (candidate && INGREDIENTS[candidate]) ids.push(candidate);
    }
  }
  return ids;
}

function unitoolsTitle(recipe) {
  return recipe?.name?.en || recipe?.nativeName || recipe?.slug || "";
}

function unitoolsIngredientNames(recipe) {
  return (recipe?.ingredients || []).flatMap(ingredient => [ingredient?.name?.en, ingredient?.name?.ru]).filter(Boolean);
}

function forkTitle(recipe) {
  return recipe?.title || recipe?.slug || recipe?.id || "";
}

function forkIngredientNames(recipe) {
  return (recipe?.ingredients || []).map(ingredient => ingredient?.name).filter(Boolean);
}

function titleSet(values, getter) {
  const set = new Set();
  for (const value of values || []) addNormalized(set, getter(value));
  return set;
}

function ingredientPhraseSet(values, getter) {
  const set = new Set();
  for (const value of values || []) {
    for (const ingredient of getter(value)) addNormalized(set, ingredient);
  }
  return set;
}

function ontologyStats(values, nameGetter, directIdGetter = () => []) {
  let ingredientOccurrences = 0;
  let resolvedOccurrences = 0;
  const resolvedCanonicalIds = new Set();
  const unresolvedPhrases = new Set();

  for (const value of values || []) {
    for (const id of directIdGetter(value).filter(Boolean)) resolvedCanonicalIds.add(id);
    for (const rawName of nameGetter(value)) {
      const phrase = normalize(rawName);
      if (!phrase) continue;
      ingredientOccurrences += 1;
      const canonical = normalizeIngredient(rawName);
      if (canonical) {
        resolvedOccurrences += 1;
        resolvedCanonicalIds.add(canonical);
      } else {
        unresolvedPhrases.add(phrase);
      }
    }
  }

  return {
    ingredientOccurrences,
    resolvedOccurrences,
    unresolvedOccurrences: ingredientOccurrences - resolvedOccurrences,
    resolvedOccurrenceRatio: ingredientOccurrences ? resolvedOccurrences / ingredientOccurrences : 0,
    resolvedCanonicalIds,
    unresolvedPhrases
  };
}

const difference = (a, b) => [...a].filter(value => !b.has(value));
const intersection = (a, b) => [...a].filter(value => b.has(value));

export function measureStep8GCc0MarkdownMarginalValue({
  candidateRecipes,
  publicRecipes,
  unitoolsRecipes,
  forkRecipes,
  rightsAuditPass = false,
  sourceQualityPass = false
}) {
  if (!Array.isArray(candidateRecipes) || candidateRecipes.length === 0) throw new Error("candidateRecipes are required");
  if (!Array.isArray(publicRecipes)) throw new Error("publicRecipes are required");
  if (!Array.isArray(unitoolsRecipes)) throw new Error("unitoolsRecipes are required");
  if (!Array.isArray(forkRecipes)) throw new Error("forkRecipes are required");

  const candidateTitles = titleSet(candidateRecipes, recipe => recipe?.title);
  const baselineTitles = new Set([
    ...titleSet(publicRecipes, publicTitle),
    ...titleSet(unitoolsRecipes, unitoolsTitle),
    ...titleSet(forkRecipes, forkTitle)
  ]);
  const overlappingTitles = intersection(candidateTitles, baselineTitles);
  const novelTitles = difference(candidateTitles, baselineTitles);

  const candidatePhrases = ingredientPhraseSet(candidateRecipes, recipe => recipe?.ingredients || []);
  const baselinePhrases = new Set([
    ...ingredientPhraseSet(publicRecipes, publicIngredientNames),
    ...ingredientPhraseSet(unitoolsRecipes, unitoolsIngredientNames),
    ...ingredientPhraseSet(forkRecipes, forkIngredientNames)
  ]);
  const novelPhrases = difference(candidatePhrases, baselinePhrases);

  const publicOntology = ontologyStats(publicRecipes, publicIngredientNames, publicDirectCanonicalIds);
  const unitoolsOntology = ontologyStats(unitoolsRecipes, unitoolsIngredientNames);
  const forkOntology = ontologyStats(forkRecipes, forkIngredientNames);
  const candidateOntology = ontologyStats(candidateRecipes, recipe => recipe?.ingredients || []);

  const baselineCanonicalIds = new Set([
    ...publicOntology.resolvedCanonicalIds,
    ...unitoolsOntology.resolvedCanonicalIds,
    ...forkOntology.resolvedCanonicalIds
  ]);
  const newCanonicalIds = difference(candidateOntology.resolvedCanonicalIds, baselineCanonicalIds);

  const uniqueTitleRatio = candidateRecipes.length ? candidateTitles.size / candidateRecipes.length : 0;
  const novelTitleRatio = candidateTitles.size ? novelTitles.length / candidateTitles.size : 0;
  const lexicalNovelIngredientPhraseRatio = candidatePhrases.size ? novelPhrases.length / candidatePhrases.size : 0;
  const parseableCount = candidateRecipes.filter(recipe => recipe?.quality?.hasTitle && recipe?.quality?.hasIngredients && recipe?.quality?.hasDirections).length;
  const taggedCount = candidateRecipes.filter(recipe => recipe?.quality?.hasTags).length;
  const parseableRatio = candidateRecipes.length ? parseableCount / candidateRecipes.length : 0;

  const tagValues = new Set();
  for (const recipe of candidateRecipes) for (const tag of recipe?.tags || []) addNormalized(tagValues, tag);

  const thresholds = {
    minParseableRatio: 0.95,
    minUniqueTitleRatio: 0.8,
    minNovelTitleRatio: 0.5
  };
  const structuralQualityPass = parseableRatio >= thresholds.minParseableRatio;
  const culinaryCoveragePass = uniqueTitleRatio >= thresholds.minUniqueTitleRatio && novelTitleRatio >= thresholds.minNovelTitleRatio;
  const pass = rightsAuditPass === true && sourceQualityPass === true && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: STEP8G_CC0_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? STEP8G_CC0_CANDIDATE_TERMINAL : STEP8G_CC0_LOW_VALUE_TERMINAL,
    baseline: {
      publicRecipeCount: publicRecipes.length,
      protectedUnitoolsCount: unitoolsRecipes.length,
      protectedForkRecipeCount: forkRecipes.length,
      combinedRecipeCount: publicRecipes.length + unitoolsRecipes.length + forkRecipes.length,
      distinctNormalizedTitles: baselineTitles.size,
      distinctNormalizedIngredientPhrases: baselinePhrases.size,
      distinctResolvedCanonicalIngredientIds: baselineCanonicalIds.size,
      canonicalOntologySize: Object.keys(INGREDIENTS).length
    },
    candidate: {
      sourceRecipeCount: candidateRecipes.length,
      parseableRecipeCount: parseableCount,
      parseableRecipeRatio: parseableRatio,
      taggedRecipeCount: taggedCount,
      distinctTagCount: tagValues.size,
      distinctNormalizedTitles: candidateTitles.size,
      duplicateNormalizedTitleCount: Math.max(0, candidateRecipes.length - candidateTitles.size),
      exactBaselineTitleOverlapCount: overlappingTitles.length,
      novelNormalizedTitleCount: novelTitles.length,
      uniqueTitleRatio,
      novelTitleRatio,
      lexicalIngredientPhrases: {
        distinctNormalizedIngredientPhrases: candidatePhrases.size,
        novelNormalizedIngredientPhraseCount: novelPhrases.length,
        lexicalNovelIngredientPhraseRatio
      },
      ontology: {
        ingredientOccurrences: candidateOntology.ingredientOccurrences,
        resolvedIngredientOccurrences: candidateOntology.resolvedOccurrences,
        unresolvedIngredientOccurrences: candidateOntology.unresolvedOccurrences,
        resolvedOccurrenceRatio: candidateOntology.resolvedOccurrenceRatio,
        distinctResolvedCanonicalIngredientCount: candidateOntology.resolvedCanonicalIds.size,
        canonicalIngredientIdsNewToBaselineCount: newCanonicalIds.length,
        canonicalIngredientIdsNewToBaseline: newCanonicalIds.slice(0, 100),
        distinctUnresolvedIngredientPhraseCount: candidateOntology.unresolvedPhrases.size,
        unresolvedIngredientPhraseSamples: [...candidateOntology.unresolvedPhrases].sort().slice(0, 50),
        sourceSpecificIngredientIdsUsedAsOntologyAuthority: false
      },
      familyOverlap: {
        exactTitleOverlapReviewCandidateCount: overlappingTitles.length,
        automaticDishFamilyAssignmentsPerformed: false,
        note: "Exact-title overlap is a review signal only. The candidate source carries no canonical app dish-family authority."
      }
    },
    thresholds,
    gates: {
      rightsAuditPass: rightsAuditPass === true,
      sourceQualityPass: sourceQualityPass === true,
      structuralQualityPass,
      culinaryCoveragePass
    },
    reviewSignal: {
      protectedStorageValue: pass ? "HIGH_CANDIDATE" : "LOW_OR_UNPROVEN",
      recommendationReviewCost: candidateOntology.resolvedOccurrenceRatio >= 0.8
        ? "LOWER"
        : candidateOntology.resolvedOccurrenceRatio >= 0.4
          ? "MODERATE"
          : "HIGH",
      note: "Candidate markdown ingredient phrases are normalized only for measurement. They are not promoted to canonical ingredient or hard-metadata authority."
    },
    boundaries: {
      liveD1WritesAuthorized: false,
      publicRuntimeChangeAuthorized: false,
      recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false,
      billingExpansionAuthorized: false,
      nutritionAuthorityImported: false,
      knowledgeCoreWriteAuthorized: false
    },
    evidenceSamples: {
      overlappingTitles: overlappingTitles.slice(0, 25),
      novelTitles: novelTitles.slice(0, 25),
      novelIngredientPhrases: novelPhrases.slice(0, 50)
    }
  };
}
