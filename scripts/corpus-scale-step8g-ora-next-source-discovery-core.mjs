import { normalizeIngredient } from "../src/data/ingredients.js";
import { parseOraJsonlRecipe } from "./corpus-scale-step8g-ora-bosse-watanna-core.mjs";

export const ORA_NEXT_SOURCE_DISCOVERY_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_NEXT_SOURCE_DISCOVERY_V1";
export const ORA_NEXT_SOURCE_DISCOVERY_FOUND = "STEP_8G_ORA_NEXT_SOURCE_DISCOVERY_CANDIDATES_FOUND";
export const ORA_NEXT_SOURCE_DISCOVERY_NONE = "STEP_8G_ORA_NEXT_SOURCE_DISCOVERY_NO_MATERIAL_CANDIDATE";
export const MIN_SOURCE_RECIPE_COUNT = 50;
export const MIN_PARSEABLE_RATIO = 0.95;
export const MIN_UNIQUE_TITLE_RATIO = 0.8;
export const MIN_NOVEL_TITLE_RATIO = 0.5;

const normalize = value => String(value ?? "")
  .normalize("NFKD")
  .replace(/\p{M}+/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function titleOf(recipe) {
  return recipe?.identity?.canonicalTitle || recipe?.title || recipe?.name?.en || recipe?.nativeName || recipe?.slug || recipe?.id || "";
}

function ingredientPhrases(recipe) {
  if (Array.isArray(recipe?.ingredients) && recipe.ingredients.every(row => typeof row === "string")) return recipe.ingredients;
  return (recipe?.ingredients || []).flatMap(row => [
    row?.name?.en,
    row?.name?.ru,
    typeof row?.name === "string" ? row.name : null,
    row?.label
  ]).filter(Boolean);
}

function buildSet(recipes, extractor) {
  const out = new Set();
  for (const recipe of recipes) {
    for (const value of extractor(recipe)) {
      const key = normalize(value);
      if (key) out.add(key);
    }
  }
  return out;
}

function titleSet(recipes) { return buildSet(recipes, recipe => [titleOf(recipe)]); }
function phraseSet(recipes) { return buildSet(recipes, ingredientPhrases); }
function difference(a, b) { return [...a].filter(value => !b.has(value)); }
function intersection(a, b) { return [...a].filter(value => b.has(value)); }

function sourceKey(row) {
  return [row.collection, row.source_url, row.source_title, row.author, String(row.source_year ?? ""), row.license]
    .map(value => String(value ?? "").trim())
    .join("\u001f");
}

function sourceIdentity(row) {
  return {
    collection: String(row.collection ?? ""),
    sourceUrl: String(row.source_url ?? ""),
    sourceTitle: String(row.source_title ?? ""),
    sourceAuthor: String(row.author ?? ""),
    sourceYear: String(row.source_year ?? ""),
    licenseId: String(row.license ?? "")
  };
}

function ontologyStats(recipes) {
  let occurrences = 0;
  let resolved = 0;
  const ids = new Set();
  const unresolved = new Set();
  for (const recipe of recipes) {
    for (const phrase of recipe.ingredients || []) {
      occurrences += 1;
      const id = normalizeIngredient(phrase);
      if (id) {
        resolved += 1;
        ids.add(id);
      } else {
        const key = normalize(phrase);
        if (key) unresolved.add(key);
      }
    }
  }
  return {
    resolvedRatio: occurrences ? resolved / occurrences : 0,
    resolvedCanonicalIngredientCount: ids.size,
    unresolvedPhraseCount: unresolved.size
  };
}

export function discoverOraNextSources({
  collectionRows,
  baselineRecipes,
  excludedSourceKeys = new Set(),
  heldCollections = new Set(),
  activeProtectedVersion = "v8006",
  activeProtectedCount = 2906
}) {
  if (!Array.isArray(collectionRows) || collectionRows.length === 0) throw new Error("ORA_DISCOVERY_ROWS_REQUIRED");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_DISCOVERY_BASELINE_REQUIRED");

  const baselineTitles = titleSet(baselineRecipes);
  const baselinePhrases = phraseSet(baselineRecipes);
  const groups = new Map();
  for (const row of collectionRows) {
    const key = sourceKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const candidates = [];
  const excluded = [];
  for (const [key, rows] of groups) {
    const identity = sourceIdentity(rows[0]);
    const reasons = [];
    if (excludedSourceKeys.has(key)) reasons.push("ALREADY_PROTECTED_SOURCE");
    if (heldCollections.has(identity.collection)) reasons.push("COLLECTION_RIGHTS_HOLD");
    if (identity.licenseId !== "public-domain") reasons.push("NOT_PUBLIC_DOMAIN_METADATA");
    if (!identity.sourceUrl || !identity.sourceTitle || !identity.sourceAuthor || !identity.sourceYear) reasons.push("INCOMPLETE_SOURCE_IDENTITY");
    if (rows.length < MIN_SOURCE_RECIPE_COUNT) reasons.push("BELOW_MATERIAL_SIZE_FLOOR");
    if (reasons.length) {
      excluded.push({ ...identity, recipeCount: rows.length, reasons });
      continue;
    }

    const recipes = rows.map(parseOraJsonlRecipe);
    const parseableCount = recipes.filter(recipe => recipe.quality.hasTitle && recipe.quality.hasIngredients && recipe.quality.hasDirections).length;
    const parseableRatio = parseableCount / recipes.length;
    const titles = titleSet(recipes);
    const phrases = phraseSet(recipes);
    const uniqueTitleRatio = titles.size / recipes.length;
    const novelTitles = difference(titles, baselineTitles);
    const overlappingTitles = intersection(titles, baselineTitles);
    const novelTitleRatio = titles.size ? novelTitles.length / titles.size : 0;
    const novelPhrases = difference(phrases, baselinePhrases);
    const ontology = ontologyStats(recipes);
    const structuralPass = parseableRatio >= MIN_PARSEABLE_RATIO;
    const marginalValuePass = uniqueTitleRatio >= MIN_UNIQUE_TITLE_RATIO && novelTitleRatio >= MIN_NOVEL_TITLE_RATIO;

    candidates.push({
      sourceKey: key,
      ...identity,
      recipeCount: recipes.length,
      parseableRecipeCount: parseableCount,
      parseableRecipeRatio: parseableRatio,
      distinctNormalizedTitles: titles.size,
      uniqueTitleRatio,
      exactBaselineTitleOverlapCount: overlappingTitles.length,
      novelNormalizedTitleCount: novelTitles.length,
      novelTitleRatio,
      distinctIngredientPhraseCount: phrases.size,
      novelIngredientPhraseCount: novelPhrases.length,
      ontologyResolvedOccurrenceRatio: ontology.resolvedRatio,
      ontologyResolvedCanonicalIngredientCount: ontology.resolvedCanonicalIngredientCount,
      ontologyUnresolvedPhraseCount: ontology.unresolvedPhraseCount,
      structuralPass,
      marginalValuePass,
      discoveryEligibleForRightsReview: structuralPass && marginalValuePass,
      rightsReviewStatus: "REQUIRED_SOURCE_SPECIFIC_DOCUMENTARY_REVIEW",
      measurementEarned: false,
      historicalSourceLabelOnly: true,
      culturalAuthenticityAuthorityImported: false,
      evidenceSamples: {
        overlappingTitles: overlappingTitles.slice(0, 10),
        novelTitles: novelTitles.slice(0, 15),
        novelIngredientPhrases: novelPhrases.slice(0, 20)
      }
    });
  }

  candidates.sort((a, b) =>
    Number(b.discoveryEligibleForRightsReview) - Number(a.discoveryEligibleForRightsReview) ||
    b.novelTitleRatio - a.novelTitleRatio ||
    b.uniqueTitleRatio - a.uniqueTitleRatio ||
    b.parseableRecipeRatio - a.parseableRecipeRatio ||
    b.novelNormalizedTitleCount - a.novelNormalizedTitleCount ||
    a.sourceTitle.localeCompare(b.sourceTitle)
  );

  const eligible = candidates.filter(row => row.discoveryEligibleForRightsReview);
  return {
    schema: ORA_NEXT_SOURCE_DISCOVERY_SCHEMA,
    pass: true,
    terminal: eligible.length ? ORA_NEXT_SOURCE_DISCOVERY_FOUND : ORA_NEXT_SOURCE_DISCOVERY_NONE,
    baseline: {
      activeProtectedVersion,
      activeProtectedCount,
      baselineRecipeObjects: baselineRecipes.length,
      distinctNormalizedTitles: baselineTitles.size,
      distinctIngredientPhrases: baselinePhrases.size
    },
    thresholds: {
      minSourceRecipeCount: MIN_SOURCE_RECIPE_COUNT,
      minParseableRatio: MIN_PARSEABLE_RATIO,
      minUniqueTitleRatio: MIN_UNIQUE_TITLE_RATIO,
      minNovelTitleRatio: MIN_NOVEL_TITLE_RATIO
    },
    sourceGroupCount: groups.size,
    measuredCandidateCount: candidates.length,
    rightsReviewEligibleCount: eligible.length,
    topRightsReviewCandidates: eligible.slice(0, 12),
    allMeasuredCandidates: candidates,
    excludedSources: excluded,
    interpretation: eligible.length
      ? "Discovery identified structurally useful source-level cohorts for separate documentary rights review. No source is rights-cleared or measurement-earned by this scan."
      : "No source-level cohort cleared the discovery structure and marginal-value screen. No rights review, prewrite or population is earned.",
    boundaries: {
      liveD1WritesPerformed: 0,
      sourceRightsClearedByDiscovery: false,
      measurementEarnedByDiscovery: false,
      protectedPopulationAuthorized: false,
      publicRuntimeChangeAuthorized: false,
      recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false,
      d1BudgetExpansionAuthorized: false,
      billingExpansionAuthorized: false,
      nutritionLaneModified: false,
      youtubeCulinaryStateModified: false,
      knowledgeCoreWritePerformed: false,
      culturalAuthenticityAuthorityImported: false
    }
  };
}

export function oraSourceKey(row) { return sourceKey(row); }
