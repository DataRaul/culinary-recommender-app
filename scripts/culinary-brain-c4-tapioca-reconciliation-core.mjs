import {RECIPES} from '../src/data/recipes.js';
import {UNITOOLS_STEP8F_RECIPES} from '../src/data/external/unitools-step8f-v1.js';

export function reconcileTapiocaCandidate({dataset,identity,source}) {
  if (identity?.terminal!=='CULINARY_BRAIN_C4_TAPIOCA_IDENTITY_AND_HARD_POLICY_REVIEW_PASS__RECONCILIATION_READY' || identity?.overlayActivated!==false || identity?.candidateDietaryTags?.join()!=='unrestricted' || identity?.candidateDeclaredAllergens?.join()!=='egg,milk' || dataset?.recipes?.length!==501) throw new Error('C4_TAPIOCA_RECONCILIATION_ENTRY_MISMATCH');
  const recipe=dataset.recipes.find(r=>r.slug==='pao-de-queijo');
  if (!recipe || recipe.category!=='bread' || recipe.difficulty!=='medium' || recipe.prepMinutes!==25 || recipe.cookMinutes!==25 || recipe.baseServings!==6 || recipe.steps?.length!==5 || recipe.steps.some(step=>!step.text?.en?.trim())) throw new Error('C4_TAPIOCA_METADATA_DRIFT');
  if (source?.source?.commit!=='1d09e9548d957dd0375301146a86dddf5e269c1b' || source?.source?.dataBlobSha!=='a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed') throw new Error('C4_TAPIOCA_PROVENANCE_DRIFT');
  const canonicalId='unitools_pao_de_queijo';
  const existing=[...RECIPES,...UNITOOLS_STEP8F_RECIPES];
  if (existing.some(row=>row.id===canonicalId || row.provenance?.sourceItemId==='pao-de-queijo')) throw new Error('C4_TAPIOCA_PUBLIC_DUPLICATE');
  return {
    schemaVersion:'CULINARY_BRAIN_C4_TAPIOCA_RECONCILIATION_V1',date:'2026-09-28',pass:true,
    terminal:'CULINARY_BRAIN_C4_TAPIOCA_RECONCILIATION_PASS__BOUNDED_P3_CONTRACT_READY',
    protectedCorpusVersion:'v8018',sourceCohortId:'unitools-world-recipes-v1_1_0',sourceSlug:recipe.slug,proposedCanonicalId:canonicalId,
    proposedIngredientIdentity:'tapioca_starch',identityOverlayActivated:false,
    sourceVersionCommit:source.source.commit,sourceDataBlobSha:source.source.dataBlobSha,
    reviewedMealTypes:['breakfast','snack'],mealRoleAuthority:'EXACT_RECIPE_REVIEW_WITH_EMBRATUR_BREAKFAST_AND_COFFEE_BREAK_EVIDENCE',
    reviewedDifficulty:{sourceLabel:'medium',runtimeScaleValue:3,scope:'EXACT_RECIPE_ONLY'},
    totalMinutes:50,timeAuthority:'SOURCE_EXPLICIT_PREP_PLUS_COOK',servings:6,instructionStepCount:5,
    candidateDeclaredAllergens:['egg','milk'],candidateDietaryTags:['unrestricted'],sourceNutritionImported:false,
    candidateHardMetadataReadyForBoundedAdmissionContract:true,publicDuplicateFound:false,
    publicRuntimeChanged:false,recommendationAdmissionChanged:false,protectedD1Writes:0,
    nextGate:'C4_TAPIOCA_BOUNDED_P3_ADMISSION_CONTRACT_V1'
  };
}
