import { ingredientById } from "../src/data/ingredients.js";
export const R2_HARD_SAFETY_SCHEMA="CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_HARD_SAFETY_POLICY_V1";
export const R2_HARD_SAFETY_TERMINAL="PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_HARD_SAFETY_PASS__R3_READY";
export const R2_HARD_SAFETY_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_HARD_SAFETY_SUMMARY_V1";
const ENTRY="PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_IDENTITY_REVIEW_PASS__HARD_SAFETY_POLICY_READY";
const sorted=v=>[...new Set(v)].sort();

export function validateR2HardSafetyContract(contract,identity){
  const errors=[];
  if(contract?.schemaVersion!==R2_HARD_SAFETY_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!==ENTRY) errors.push("entryTerminal");
  if(identity?.pass!==true||identity?.terminal!==ENTRY||identity?.identityReadyCandidateCount!==1||identity?.identityReadyDigestSha256!==contract?.expectedIdentityReadyDigestSha256) errors.push("identityEvidence");
  if(contract?.expectedIdentityReadyCandidateCount!==1||contract?.candidate?.sourceSlug!=="chimichurri") errors.push("candidate");
  const ids=contract?.candidate?.canonicalIngredientIds||[];
  const expected=["chilli_flakes","garlic","olive_oil","oregano","parsley","salt","vinegar","water"];
  if(JSON.stringify(ids)!==JSON.stringify(expected)) errors.push("ingredientIds");
  const identityIds=identity?.identityReadyCandidates?.[0]?.canonicalIngredientIds||[];
  if(JSON.stringify(identityIds)!==JSON.stringify(expected)) errors.push("identityIngredientIds");
  const tokens=contract?.supportedAllergenTokens||[];
  if(JSON.stringify(tokens)!==JSON.stringify(sorted(tokens))||tokens.length!==10) errors.push("supportedAllergenTokens");
  const policies=contract?.ingredientPolicies||[];
  if(policies.length!==8||new Set(policies.map(r=>r.ingredientId)).size!==8) errors.push("policyCount");
  if(JSON.stringify(sorted(policies.map(r=>r.ingredientId)))!==JSON.stringify(expected)) errors.push("policyIngredientSet");
  for(const row of policies){
    const ingredient=ingredientById(row.ingredientId);
    if(!ingredient) errors.push("missingIngredient:"+row.ingredientId);
    if(row.policyState!=="REVIEWED_CURRENT_PROFILE_COMPLETE"||row.supportedAllergenCoverage!=="COMPLETE_FOR_CURRENT_MAPPED_PROFILE_TOKENS") errors.push("policyState:"+row.ingredientId);
    if(typeof row.vegetarian!=="boolean"||typeof row.vegan!=="boolean"||row.vegan&&!row.vegetarian) errors.push("dietary:"+row.ingredientId);
    if(JSON.stringify(sorted(row.reviewedPresentAllergens||[]))!==JSON.stringify(sorted(ingredient?.allergens||[]))) errors.push("allergenDrift:"+row.ingredientId);
  }
  const auth=contract?.authority||{};
  if(auth.candidateHardSafetyProposalAuthorizedOnPass!==true) errors.push("proposalAuthority");
  for(const k of ["runtimeHardSafetyAuthorityPromotionAuthorized","recommendationAdmissionAuthorized","publicRuntimeWideningAuthorized","sourceDietaryClaimPromotionAuthorized","sourceNutritionPromotionAuthorized","protectedD1ReadAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","knowledgeCoreWriteAuthorized","paidModelOrApiAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]) if(auth[k]!==false) errors.push("authority."+k);
  if(contract?.targetTerminal!==R2_HARD_SAFETY_TERMINAL||contract?.nextGate!=="R3_CANDIDATE_METADATA_RECONCILIATION_AND_MACHINE_ACCEPTANCE") errors.push("terminal");
  return [...new Set(errors)].sort();
}

export function buildR2HardSafetyReview({contract,identity,dataset}){
  const errors=validateR2HardSafetyContract(contract,identity);
  if(errors.length) throw new Error("R2_HARD_SAFETY_CONTRACT_INVALID__"+errors.join(","));
  const recipe=(dataset?.recipes||[]).find(r=>r.slug===contract.candidate.sourceSlug);
  if(!recipe) throw new Error("R2_HARD_SAFETY_SOURCE_RECIPE_MISSING");
  const policies=contract.ingredientPolicies;
  const declaredAllergens=sorted(policies.flatMap(r=>r.reviewedPresentAllergens));
  const dietaryTags=["unrestricted"];
  if(policies.every(r=>r.vegetarian===true)) dietaryTags.push("vegetarian");
  if(policies.every(r=>r.vegan===true)) dietaryTags.push("vegan");
  const arrays=Object.fromEntries(Object.entries(recipe).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length]).sort(([a],[b])=>a.localeCompare(b)));
  const sourceMetadataDiagnostic={
    prepMinutes:Number.isFinite(recipe.prepMinutes)?recipe.prepMinutes:null,
    cookMinutes:Number.isFinite(recipe.cookMinutes)?recipe.cookMinutes:null,
    totalMinutes:Number.isFinite(recipe.prepMinutes)&&Number.isFinite(recipe.cookMinutes)?recipe.prepMinutes+recipe.cookMinutes:null,
    baseServings:Number.isFinite(recipe.baseServings)?recipe.baseServings:null,
    sourceDifficulty:typeof recipe.difficulty==="string"?recipe.difficulty:null,
    sourceCategory:typeof recipe.category==="string"?recipe.category:null,
    topLevelKeys:Object.keys(recipe).sort(),
    arrayFieldCounts:arrays
  };
  return {
    schemaVersion:R2_HARD_SAFETY_SUMMARY_SCHEMA,
    date:"2026-09-29",
    pass:true,
    terminal:R2_HARD_SAFETY_TERMINAL,
    protectedCorpusVersion:"v8018",
    candidate:{
      sourceSlug:contract.candidate.sourceSlug,
      canonicalIngredientIds:contract.candidate.canonicalIngredientIds,
      candidateDeclaredAllergens:declaredAllergens,
      candidateDietaryTags:dietaryTags,
      authorityScope:"CANDIDATE_ONLY__CURRENT_MAPPED_PROFILE_TOKENS"
    },
    reviewedIngredientPolicyCount:policies.length,
    sourceMetadataDiagnostic,
    semantics:{
      emptyDeclaredAllergensMeansGlobalAllergenFree:false,
      crossContactGuarantee:false,
      productLabelGuarantee:false,
      sourceDietaryClaimsPromoted:false,
      sourceNutritionPromoted:false
    },
    runtimeHardSafetyAuthorityPromoted:false,
    recommendationAdmissionChanged:false,
    publicRuntimeChanged:false,
    boundaries:{protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,knowledgeCoreWrites:0,paidInfrastructureUsed:false,thirdShardUsed:false,barbecueMutation:false},
    nextGate:contract.nextGate
  };
}
