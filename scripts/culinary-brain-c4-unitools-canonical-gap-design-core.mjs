import { resolveWithReviewedUnitoolsAlias } from './culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs';

export const TERMINAL = 'CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_PASS__TAPIOCA_IDENTITY_REVIEW_READY';

export function designCanonicalGap({dataset, contract, aliasSummary}) {
  if (aliasSummary?.pass !== true || aliasSummary?.terminal !== 'CULINARY_BRAIN_C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_PASS' || aliasSummary?.newlyFullyMappedRecipeCount !== 0 || dataset?.recipes?.length !== 501) throw new Error('C4_CANONICAL_GAP_ENTRY_MISMATCH');
  const near = [];
  for (const recipe of dataset.recipes) {
    const blocked = recipe.ingredients.map(ingredient => ({ingredient, resolution: resolveWithReviewedUnitoolsAlias(ingredient, contract)})).filter(row => row.resolution.status !== 'RESOLVED');
    if (blocked.length === 1 && blocked[0].resolution.status === 'UNRESOLVED') near.push({slug: recipe.slug, sourceId: blocked[0].ingredient.id, sourceName: blocked[0].ingredient.name.en});
  }
  near.sort((a,b) => a.slug.localeCompare(b.slug));
  if (JSON.stringify(near) !== JSON.stringify([
    {slug:'cachapas',sourceId:'cheese',sourceName:'Soft white cheese'},
    {slug:'chapati-kenyan',sourceId:'flour',sourceName:'Flour'},
    {slug:'pao-de-queijo',sourceId:'tapioca',sourceName:'Tapioca starch'}
  ])) throw new Error('C4_CANONICAL_GAP_SINGLE_BLOCKER_DRIFT');
  return {
    schemaVersion:'CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_V1', date:'2026-09-28', pass:true, terminal:TERMINAL,
    protectedCorpusVersion:'v8018', sourceCohortId:'unitools-world-recipes-v1_1_0', sourceRecipeCount:501,
    postAliasResolvedOccurrences:aliasSummary.postReviewResolvedIngredientOccurrences,
    postAliasFullyMappedRecipes:aliasSummary.postReviewFullyMappedRecipeCount,
    oneUnresolvedIngredientRecipes:near,
    selectedGap:{sourceId:'tapioca',sourceName:'Tapioca starch',recipeSlug:'pao-de-queijo',reason:'EXACT_NAMED_SINGLE_INGREDIENT_GAP_WITHOUT_EXISTING_CANONICAL_ID',potentialNewIdentityReadyRecipes:1},
    heldGaps:[{sourceId:'cheese',sourceName:'Soft white cheese',recipeSlug:'cachapas',reason:'CHEESE_FORMULATION_AMBIGUOUS'}, {sourceId:'flour',sourceName:'Flour',recipeSlug:'chapati-kenyan',reason:'FLOUR_GRAIN_AND_ALLERGEN_AMBIGUOUS'}],
    newCanonicalIngredients:0, newFullyMappedRecipes:0, hardAuthorityPromoted:false, recommendationAdmissionChanged:false, publicRuntimeChanged:false,
    nextGate:'C4_TAPIOCA_CANONICAL_IDENTITY_AND_HARD_POLICY_REVIEW_V1'
  };
}
