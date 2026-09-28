import {resolveWithReviewedUnitoolsAlias} from './culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs';
import {ingredientById} from '../src/data/ingredients.js';

export function reviewTapiocaIdentity({dataset,contract,gap}) {
  if (gap?.terminal !== 'CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_PASS__TAPIOCA_IDENTITY_REVIEW_READY' || gap?.selectedGap?.recipeSlug !== 'pao-de-queijo' || dataset?.recipes?.length !== 501) throw new Error('C4_TAPIOCA_ENTRY_MISMATCH');
  if (ingredientById('tapioca_starch')) throw new Error('C4_TAPIOCA_CANONICAL_ID_ALREADY_EXISTS');
  const recipe=dataset.recipes.find(row=>row.slug==='pao-de-queijo');
  if (!recipe || recipe.country!=='BR' || recipe.category!=='bread' || recipe.difficulty!=='medium' || recipe.prepMinutes!==25 || recipe.cookMinutes!==25) throw new Error('C4_TAPIOCA_SOURCE_METADATA_DRIFT');
  const rows=recipe.ingredients.map(i=>({sourceId:i.id,sourceName:i.name.en,resolution:resolveWithReviewedUnitoolsAlias(i,contract)}));
  const missing=rows.filter(row=>row.resolution.status!=='RESOLVED');
  if (missing.length!==1 || missing[0].resolution.status!=='UNRESOLVED' || missing[0].sourceId!=='tapioca' || missing[0].sourceName!=='Tapioca starch') throw new Error('C4_TAPIOCA_IDENTITY_DRIFT');
  const resolved=rows.filter(row=>row.resolution.status==='RESOLVED').map(row=>row.resolution.canonicalIngredientId).sort();
  if (JSON.stringify(resolved)!==JSON.stringify(['eggs','milk','mozzarella','neutral_oil','parmesan','salt','water'].sort())) throw new Error('C4_TAPIOCA_OTHER_INGREDIENT_DRIFT');
  const positive=[...new Set(resolved.flatMap(id=>ingredientById(id)?.allergens||[]))].sort();
  if (JSON.stringify(positive)!==JSON.stringify(['egg','milk'])) throw new Error('C4_TAPIOCA_POSITIVE_ALLERGEN_DRIFT');
  return {
    schemaVersion:'CULINARY_BRAIN_C4_TAPIOCA_IDENTITY_REVIEW_V1',date:'2026-09-28',pass:true,
    terminal:'CULINARY_BRAIN_C4_TAPIOCA_IDENTITY_AND_HARD_POLICY_REVIEW_PASS__RECONCILIATION_READY',
    protectedCorpusVersion:'v8018',sourceCohortId:'unitools-world-recipes-v1_1_0',recipeSlug:recipe.slug,
    sourceIngredient:{id:'tapioca',name:'Tapioca starch'},proposedCanonicalIdentity:'tapioca_starch',
    identityScope:'EXACT_PINNED_SOURCE_RECIPE_ONLY',existingResolvedIngredientIds:resolved,
    identityReadyAfterProposedOverlay:true,globalCatalogChanged:false,overlayActivated:false,
    sourceDietClaimsNotPromoted:[...recipe.diets].sort(),candidateDeclaredAllergens:['egg','milk'],
    candidateDietaryTags:['unrestricted'],vegetarianHeldReason:'PARMESAN_RENNET_NOT_ESTABLISHED',
    allergenCoverageScope:'CURRENT_MAPPED_PROFILE_TOKENS_ONLY',
    manufacturerOrCrossContactGuarantee:false,globalAllergenFreeClaim:false,hardDietaryAllergenRuntimeAuthorityPromoted:false,
    newRecommendationReadyRecipes:0,recommendationAdmissionChanged:false,publicRuntimeChanged:false,
    nextGate:'C4_TAPIOCA_RECIPE_HARD_POLICY_AND_METADATA_RECONCILIATION_V1'
  };
}
