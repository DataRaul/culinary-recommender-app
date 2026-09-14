export const STEP8G_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_MARGINAL_VALUE_V1";
export const STEP8G_FORKRECIPE_CANDIDATE_TERMINAL = "STEP_8G_FORKRECIPE_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const STEP8G_FORKRECIPE_LOW_VALUE_TERMINAL = "STEP_8G_STOP_MARGINAL_VALUE_LOW";

const normalize = value => String(value ?? "")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const addNormalized = (set, value) => {
  const normalized = normalize(value);
  if (normalized) set.add(normalized);
};

function publicTitle(recipe) {
  return recipe?.identity?.canonicalTitle || recipe?.title || recipe?.id || "";
}

function publicIngredientNames(recipe) {
  const values = [];
  for (const ingredient of recipe?.ingredients || []) {
    values.push(ingredient?.name?.en, ingredient?.name, ingredient?.label, ingredient?.ingredientId, ingredient?.id);
  }
  return values;
}

function unitoolsIngredientNames(recipe) {
  return (recipe?.ingredients || []).flatMap(ingredient => [ingredient?.name?.en, ingredient?.name?.ru, ingredient?.id]);
}

function forkIngredientNames(recipe) {
  return (recipe?.ingredients || []).flatMap(ingredient => [ingredient?.name, ingredient?.ingId]);
}

function titleSet(values, getter) {
  const set = new Set();
  for (const value of values || []) addNormalized(set, getter(value));
  return set;
}

function ingredientSet(values, getter) {
  const set = new Set();
  for (const value of values || []) {
    for (const ingredient of getter(value)) addNormalized(set, ingredient);
  }
  return set;
}

function setDifference(a, b) {
  return [...a].filter(value => !b.has(value));
}

function setIntersection(a, b) {
  return [...a].filter(value => b.has(value));
}

function distinctFieldValues(entries, selector) {
  const set = new Set();
  for (const entry of entries || []) {
    const value = selector(entry?.recipe ?? entry);
    if (Array.isArray(value)) value.forEach(item => addNormalized(set, item));
    else addNormalized(set, value);
  }
  return set;
}

export function measureStep8GForkRecipeMarginalValue({
  forkEntries,
  unitoolsDataset,
  publicRecipes,
  rightsAuditPass = false,
  sourceQualityPass = false
}) {
  if (!Array.isArray(forkEntries) || forkEntries.length === 0) throw new Error("forkEntries are required");
  if (!Array.isArray(unitoolsDataset?.recipes)) throw new Error("unitoolsDataset.recipes is required");
  if (!Array.isArray(publicRecipes)) throw new Error("publicRecipes are required");

  const forkRecipes = forkEntries.map(entry => entry?.recipe ?? entry);
  const forkTitles = titleSet(forkRecipes, recipe => recipe?.title);
  const publicTitles = titleSet(publicRecipes, publicTitle);
  const unitoolsTitles = titleSet(unitoolsDataset.recipes, recipe => recipe?.name?.en || recipe?.nativeName || recipe?.slug);
  const baselineTitles = new Set([...publicTitles, ...unitoolsTitles]);
  const forkTitleOverlap = setIntersection(forkTitles, baselineTitles);
  const forkUniqueTitles = setDifference(forkTitles, baselineTitles);

  const forkIngredients = ingredientSet(forkRecipes, forkIngredientNames);
  const publicIngredients = ingredientSet(publicRecipes, publicIngredientNames);
  const unitoolsIngredients = ingredientSet(unitoolsDataset.recipes, unitoolsIngredientNames);
  const baselineIngredients = new Set([...publicIngredients, ...unitoolsIngredients]);
  const novelIngredients = setDifference(forkIngredients, baselineIngredients);

  const cuisineValues = distinctFieldValues(forkRecipes, recipe => recipe?.cuisine);
  const cultureValues = distinctFieldValues(forkRecipes, recipe => recipe?.culture);
  const categoryValues = distinctFieldValues(forkRecipes, recipe => recipe?.category);
  const tagValues = distinctFieldValues(forkRecipes, recipe => recipe?.tags || []);
  const ratioSystemValues = distinctFieldValues(forkRecipes, recipe => recipe?.ratioSystem);
  const forkLineageCount = forkRecipes.filter(recipe => recipe?.parentSlug || recipe?.parentRepoId).length;

  const duplicateTitleCount = Math.max(0, forkRecipes.length - forkTitles.size);
  const uniqueTitleRatio = forkRecipes.length ? forkTitles.size / forkRecipes.length : 0;
  const novelTitleRatio = forkTitles.size ? forkUniqueTitles.length / forkTitles.size : 0;
  const novelIngredientRatio = forkIngredients.size ? novelIngredients.length / forkIngredients.size : 0;

  const thresholds = {
    minUniqueTitleRatio: 0.8,
    minNovelTitleRatio: 0.5,
    minNovelIngredientNames: 25,
    minNovelIngredientRatio: 0.1
  };

  const coveragePass = uniqueTitleRatio >= thresholds.minUniqueTitleRatio
    && novelTitleRatio >= thresholds.minNovelTitleRatio
    && novelIngredients.length >= thresholds.minNovelIngredientNames
    && novelIngredientRatio >= thresholds.minNovelIngredientRatio;

  const pass = rightsAuditPass === true && sourceQualityPass === true && coveragePass;

  return {
    schema: STEP8G_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? STEP8G_FORKRECIPE_CANDIDATE_TERMINAL : STEP8G_FORKRECIPE_LOW_VALUE_TERMINAL,
    baseline: {
      publicRecipeCount: publicRecipes.length,
      protectedUnitoolsCount: unitoolsDataset.recipes.length,
      combinedRecipeCount: publicRecipes.length + unitoolsDataset.recipes.length,
      distinctNormalizedTitles: baselineTitles.size,
      distinctNormalizedIngredientNames: baselineIngredients.size
    },
    candidate: {
      sourceRecipeCount: forkRecipes.length,
      distinctNormalizedTitles: forkTitles.size,
      duplicateNormalizedTitleCount: duplicateTitleCount,
      exactBaselineTitleOverlapCount: forkTitleOverlap.length,
      novelNormalizedTitleCount: forkUniqueTitles.length,
      uniqueTitleRatio,
      novelTitleRatio,
      distinctNormalizedIngredientNames: forkIngredients.size,
      novelNormalizedIngredientNameCount: novelIngredients.length,
      novelIngredientRatio,
      cuisineValueCount: cuisineValues.size,
      cultureValueCount: cultureValues.size,
      categoryValueCount: categoryValues.size,
      tagValueCount: tagValues.size,
      ratioSystems: [...ratioSystemValues].sort(),
      forkLineageCount
    },
    thresholds,
    gates: {
      rightsAuditPass: rightsAuditPass === true,
      sourceQualityPass: sourceQualityPass === true,
      coveragePass
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
      overlappingTitles: forkTitleOverlap.slice(0, 25),
      novelTitles: forkUniqueTitles.slice(0, 25),
      novelIngredientNames: novelIngredients.slice(0, 50)
    }
  };
}
