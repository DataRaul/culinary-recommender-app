import { normalizeIngredient } from "../src/data/ingredients.js";

export const ORA_BW_SOURCE = Object.freeze({
  cohortId: "ORA_BOSSE_WATANNA_1914_JAPANESE_SHELF_AE3BD2C",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "japanese-kitchen",
  sourceTitle: "Chinese-Japanese Cook Book",
  sourceAuthor: "Sara Bosse & Onoto Watanna",
  sourceUrl: "https://archive.org/details/chinesejapanesec00boss_0",
  sourceYear: "1914",
  license: "public-domain",
  expectedRecipeCount: 109,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_BOSSE_WATANNA_1914_JAPANESE_SHELF"
});

export const ORA_BW_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_BOSSE_WATANNA_1914_MARGINAL_VALUE_V1";
export const ORA_BW_CANDIDATE_TERMINAL = "STEP_8G_ORA_BOSSE_WATANNA_1914_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_BW_REJECT_TERMINAL = "STEP_8G_STOP_ORA_BOSSE_WATANNA_1914_MARGINAL_VALUE_OR_RIGHTS_FAIL";

const normalize = value => String(value ?? "")
  .normalize("NFKD")
  .replace(/\p{M}+/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function section(body, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$`, "im");
  const match = pattern.exec(body);
  if (!match) return "";
  const rest = body.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

export function parseOraJsonlRecipe(row = {}) {
  const body = String(row.body ?? "");
  const ingredients = section(body, "Ingredients")
    .split(/\r?\n/)
    .filter(line => /^\s*[-*+]\s+/.test(line))
    .map(line => line.replace(/^\s*[-*+]\s+/, "").trim())
    .filter(Boolean);
  const directions = section(body, "(?:Directions|Instructions|Method)")
    .split(/\r?\n/)
    .filter(line => /^\s*(?:\d+[.)]|[-*+])\s+/.test(line))
    .map(line => line.replace(/^\s*(?:\d+[.)]|[-*+])\s+/, "").trim())
    .filter(Boolean);

  return {
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    ingredients,
    directions,
    source: {
      collection: String(row.collection ?? ""),
      author: String(row.author ?? ""),
      sourceTitle: String(row.source_title ?? ""),
      sourceUrl: String(row.source_url ?? ""),
      sourceYear: String(row.source_year ?? ""),
      license: String(row.license ?? "")
    },
    quality: {
      hasTitle: Boolean(row.title),
      hasIngredients: ingredients.length > 0,
      hasDirections: directions.length > 0
    }
  };
}

function addNormalized(set, value) {
  const normalized = normalize(value);
  if (normalized) set.add(normalized);
}

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

function buildTitleSet(values) {
  const out = new Set();
  for (const value of values) addNormalized(out, titleOf(value));
  return out;
}

function buildPhraseSet(values) {
  const out = new Set();
  for (const value of values) for (const phrase of ingredientPhrases(value)) addNormalized(out, phrase);
  return out;
}

function union(...sets) { return new Set(sets.flatMap(set => [...set])); }
function difference(a, b) { return [...a].filter(value => !b.has(value)); }
function intersection(a, b) { return [...a].filter(value => b.has(value)); }

function ontologyStats(recipes) {
  let occurrences = 0;
  let resolved = 0;
  const ids = new Set();
  const unresolved = new Set();
  for (const recipe of recipes) {
    for (const phrase of recipe.ingredients) {
      occurrences += 1;
      const id = normalizeIngredient(phrase);
      if (id) {
        resolved += 1;
        ids.add(id);
      } else {
        addNormalized(unresolved, phrase);
      }
    }
  }
  return {
    occurrences,
    resolved,
    resolvedRatio: occurrences ? resolved / occurrences : 0,
    ids,
    unresolved
  };
}

export function measureOraBosseWatannaCandidate({
  candidateRecipes,
  publicRecipes,
  unitoolsRecipes,
  forkRecipes,
  cc0Recipes,
  abbottRecipes,
  rightsDocumented
}) {
  if (!Array.isArray(candidateRecipes) || candidateRecipes.length === 0) throw new Error("ORA_BW_CANDIDATE_EMPTY");

  const source = ORA_BW_SOURCE;
  const rightsViolations = candidateRecipes.filter(recipe =>
    recipe.source.collection !== source.collection ||
    recipe.source.sourceUrl !== source.sourceUrl ||
    recipe.source.sourceTitle !== source.sourceTitle ||
    recipe.source.author !== source.sourceAuthor ||
    recipe.source.sourceYear !== source.sourceYear ||
    recipe.source.license !== source.license
  );
  const exactCountPass = candidateRecipes.length === source.expectedRecipeCount;
  const rightsAuditPass = rightsDocumented === true && exactCountPass && rightsViolations.length === 0;

  const candidateTitles = buildTitleSet(candidateRecipes);
  const baselineTitles = union(
    buildTitleSet(publicRecipes),
    buildTitleSet(unitoolsRecipes),
    buildTitleSet(forkRecipes),
    buildTitleSet(cc0Recipes),
    buildTitleSet(abbottRecipes)
  );
  const candidatePhrases = buildPhraseSet(candidateRecipes);
  const baselinePhrases = union(
    buildPhraseSet(publicRecipes),
    buildPhraseSet(unitoolsRecipes),
    buildPhraseSet(forkRecipes),
    buildPhraseSet(cc0Recipes),
    buildPhraseSet(abbottRecipes)
  );

  const parseableCount = candidateRecipes.filter(recipe => recipe.quality.hasTitle && recipe.quality.hasIngredients && recipe.quality.hasDirections).length;
  const parseableRatio = parseableCount / candidateRecipes.length;
  const uniqueTitleRatio = candidateTitles.size / candidateRecipes.length;
  const novelTitles = difference(candidateTitles, baselineTitles);
  const titleOverlaps = intersection(candidateTitles, baselineTitles);
  const novelTitleRatio = candidateTitles.size ? novelTitles.length / candidateTitles.size : 0;
  const novelPhrases = difference(candidatePhrases, baselinePhrases);
  const ontology = ontologyStats(candidateRecipes);

  const thresholds = Object.freeze({ minParseableRatio: 0.95, minUniqueTitleRatio: 0.8, minNovelTitleRatio: 0.5 });
  const structuralQualityPass = parseableRatio >= thresholds.minParseableRatio;
  const culinaryCoveragePass = uniqueTitleRatio >= thresholds.minUniqueTitleRatio && novelTitleRatio >= thresholds.minNovelTitleRatio;
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_BW_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_BW_CANDIDATE_TERMINAL : ORA_BW_REJECT_TERMINAL,
    baseline: {
      publicRecipeCount: publicRecipes.length,
      protectedUnitoolsCount: unitoolsRecipes.length,
      protectedForkRecipeCount: forkRecipes.length,
      protectedCc0Count: cc0Recipes.length,
      protectedAbbottCount: abbottRecipes.length,
      protectedComposedRecipeCount: unitoolsRecipes.length + forkRecipes.length + cc0Recipes.length + abbottRecipes.length,
      expectedActiveProtectedVersion: "v8004",
      distinctNormalizedTitles: baselineTitles.size
    },
    candidate: {
      cohortId: source.cohortId,
      collection: source.collection,
      sourceWork: source.sourceTitle,
      sourceAuthor: source.sourceAuthor,
      sourceYear: source.sourceYear,
      sourceUrl: source.sourceUrl,
      recipeCount: candidateRecipes.length,
      parseableRecipeCount: parseableCount,
      parseableRecipeRatio: parseableRatio,
      distinctNormalizedTitles: candidateTitles.size,
      uniqueTitleRatio,
      exactBaselineTitleOverlapCount: titleOverlaps.length,
      novelNormalizedTitleCount: novelTitles.length,
      novelTitleRatio,
      distinctIngredientPhraseCount: candidatePhrases.size,
      novelIngredientPhraseCount: novelPhrases.length,
      ontologyResolvedOccurrenceRatio: ontology.resolvedRatio,
      ontologyResolvedCanonicalIngredientCount: ontology.ids.size,
      ontologyUnresolvedPhraseCount: ontology.unresolved.size,
      culturalAuthorityImported: false,
      historicalSourceLabelOnly: true
    },
    thresholds,
    gates: {
      rightsDocumented: rightsDocumented === true,
      exactCountPass,
      rightsMetadataPass: rightsViolations.length === 0,
      rightsAuditPass,
      structuralQualityPass,
      culinaryCoveragePass
    },
    rightsViolations: rightsViolations.slice(0, 20).map(row => ({ slug: row.slug, source: row.source })),
    evidenceSamples: {
      overlappingTitles: titleOverlaps.slice(0, 25),
      novelTitles: novelTitles.slice(0, 25),
      novelIngredientPhrases: novelPhrases.slice(0, 50),
      unresolvedIngredientPhrases: [...ontology.unresolved].sort().slice(0, 50)
    },
    boundaries: {
      liveD1WritesAuthorized: false,
      protectedPopulationAuthorized: false,
      publicRuntimeChangeAuthorized: false,
      recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false,
      billingExpansionAuthorized: false,
      nutritionAuthorityImported: false,
      culturalAuthenticityAuthorityImported: false,
      knowledgeCoreWriteAuthorized: false
    }
  };
}
