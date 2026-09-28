export const C4_CLOSEOUT_TERMINAL='CULINARY_BRAIN_C4_BOUNDED_FAILURE_REPAIR_PASS__ONE_DISTINCT_P3_CANDIDATE_READY';

export function closeC4({matrix,policy,duplicate,alias,gap,identity,reconciliation}) {
  if (matrix?.terminal!=='CULINARY_BRAIN_C4_FAILURE_MATRIX_PASS__112_IDENTITY_READY_REPAIR_COHORT_FROZEN' || matrix?.recipeCount!==19268 || matrix?.repairCohort?.recipeCount!==112) throw new Error('C4_CLOSEOUT_FULL_MATRIX_MISSING');
  if (policy?.terminal!=='CULINARY_BRAIN_C4_HARD_AUTHORITY_POLICY_REVIEW_PASS__100_POLICY_COMPLETE_CANDIDATES__RECONCILIATION_READY' || policy?.policyCompleteRecipeCandidateCount!==100 || policy?.policyHeldRecipeCount!==12 || policy?.repairCohortDigestSha256!==matrix.repairCohort.digestSha256) throw new Error('C4_CLOSEOUT_POLICY_MISMATCH');
  if (duplicate?.terminal!=='CULINARY_BRAIN_C4_BOUNDED_P3_DUPLICATE_SAFE_ADMISSION_PASS__EXISTING_CANONICAL_ALIGNMENT_ONLY' || duplicate?.p3?.existingCanonicalAlignmentCount!==1 || duplicate?.p3?.newlyAdmittedRuntimeRecipeCount!==0 || duplicate?.canonicalAlignment?.publicRuntimeRecipeCountAfter!==85) throw new Error('C4_CLOSEOUT_DUPLICATE_MISMATCH');
  if (alias?.terminal!=='CULINARY_BRAIN_C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_PASS' || alias?.newlyFullyMappedRecipeCount!==0 || gap?.terminal!=='CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_PASS__TAPIOCA_IDENTITY_REVIEW_READY') throw new Error('C4_CLOSEOUT_GAP_CHAIN_MISMATCH');
  if (identity?.terminal!=='CULINARY_BRAIN_C4_TAPIOCA_IDENTITY_AND_HARD_POLICY_REVIEW_PASS__RECONCILIATION_READY' || identity?.candidateDietaryTags?.join()!=='unrestricted' || identity?.candidateDeclaredAllergens?.join()!=='egg,milk') throw new Error('C4_CLOSEOUT_HARD_POLICY_MISMATCH');
  if (reconciliation?.terminal!=='CULINARY_BRAIN_C4_TAPIOCA_RECONCILIATION_PASS__BOUNDED_P3_CONTRACT_READY' || reconciliation?.sourceSlug!=='pao-de-queijo' || reconciliation?.candidateHardMetadataReadyForBoundedAdmissionContract!==true || reconciliation?.publicDuplicateFound!==false || reconciliation?.identityOverlayActivated!==false || reconciliation?.recommendationAdmissionChanged!==false) throw new Error('C4_CLOSEOUT_CANDIDATE_MISMATCH');
  return {
    schemaVersion:'CULINARY_BRAIN_C4_BOUNDED_CLOSEOUT_V1',date:'2026-09-28',pass:true,terminal:C4_CLOSEOUT_TERMINAL,
    protectedCorpusVersion:'v8018',protectedRecipeCount:19268,originalIdentityReadyCohortCount:112,
    originalIdentityReadyCohortDigestSha256:matrix.repairCohort.digestSha256,
    historicalPolicyCompleteCandidateCount:policy.policyCompleteRecipeCandidateCount,historicalPolicyHeldCount:policy.policyHeldRecipeCount,
    existingPublicCanonicalAlignmentCount:duplicate.p3.existingCanonicalAlignmentCount,distinctProtectedHardMetadataCandidateCount:1,
    distinctCandidate:{sourceKey:'unitools-world-recipes-v1_1_0::pao-de-queijo',proposedPublicId:'unitools_pao_de_queijo',dietaryScope:['unrestricted'],declaredAllergens:['egg','milk'],proposedIngredientOverlay:'tapioca_starch'},
    candidateOnly:true,identityOverlayActivated:false,protectedRecommendationAdmissionCount:0,newPublicRuntimeRecipeCount:0,
    sourceNutritionImported:false,fullCorpusMatrixBaselinePreserved:true,
    p3State:'BOUNDED_ADMISSION_CONTRACT_READY__NOT_ADMITTED',
    nextGate:'C4_TAPIOCA_BOUNDED_P3_ADMISSION_CONTRACT_V1'
  };
}
