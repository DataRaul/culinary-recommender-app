import { createHash } from "node:crypto";

export const C4_POLICY_SCHEMA="CULINARY_BRAIN_C4_HARD_AUTHORITY_POLICY_REVIEW_V1";
export const C4_POLICY_SUMMARY_SCHEMA="CULINARY_BRAIN_C4_HARD_AUTHORITY_POLICY_REVIEW_SUMMARY_V1";
export const C4_POLICY_TERMINAL="CULINARY_BRAIN_C4_HARD_AUTHORITY_POLICY_REVIEW_PASS__100_POLICY_COMPLETE_CANDIDATES__RECONCILIATION_READY";
const ENTRY="CULINARY_BRAIN_C4_HARD_AUTHORITY_EVIDENCE_AUDIT_PASS__POLICY_REVIEW_READY";
const sha256=value=>createHash("sha256").update(String(value)).digest("hex");
const sortedUnique=values=>[...new Set(values)].sort();

export function validateC4HardAuthorityPolicyContract(contract){
  const errors=[];
  if(contract?.schemaVersion!==C4_POLICY_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.expectedRepairCohortCount!==112) errors.push("expectedRepairCohortCount");
  if(contract?.expectedIngredientCount!==49) errors.push("expectedIngredientCount");
  if(contract?.entryTerminal!==ENTRY) errors.push("entryTerminal");
  if(contract?.targetTerminal!==C4_POLICY_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGate!=="C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_V1") errors.push("nextGate");
  const tokens=contract?.supportedAllergenTokens||[];
  if(JSON.stringify(tokens)!==JSON.stringify(sortedUnique(tokens)) || tokens.length!==10) errors.push("supportedAllergenTokens");
  const rows=contract?.ingredientPolicies||[];
  if(rows.length!==49 || new Set(rows.map(r=>r.ingredientId)).size!==49) errors.push("ingredientPolicies");
  for(const row of rows){
    if(!row?.ingredientId) errors.push("ingredientId");
    if(!["REVIEWED_CURRENT_PROFILE_COMPLETE","HOLD_FORMULATION_VARIANT"].includes(row?.policyState)) errors.push("policyState:"+row?.ingredientId);
    if(!Array.isArray(row?.reviewedPresentAllergens) || row.reviewedPresentAllergens.some(a=>!tokens.includes(a))) errors.push("allergens:"+row?.ingredientId);
    if(row.policyState==="REVIEWED_CURRENT_PROFILE_COMPLETE"){
      if(typeof row.vegetarian!=="boolean" || typeof row.vegan!=="boolean") errors.push("dietary:"+row.ingredientId);
      if(row.vegan && !row.vegetarian) errors.push("veganImpliesVegetarian:"+row.ingredientId);
      if(row.supportedAllergenCoverage!=="COMPLETE_FOR_CURRENT_MAPPED_PROFILE_TOKENS") errors.push("coverage:"+row.ingredientId);
    } else {
      if(row.vegetarian!==null || row.vegan!==null) errors.push("heldDietary:"+row.ingredientId);
      if(row.supportedAllergenCoverage!=="INCOMPLETE_FORMULATION_VARIANT") errors.push("heldCoverage:"+row.ingredientId);
    }
  }
  for(const [key,value] of Object.entries(contract?.authority||{})) if(value!==false) errors.push("authority."+key);
  return sortedUnique(errors);
}

export function buildC4HardAuthorityPolicyReview({contract,evidence}){
  const contractErrors=validateC4HardAuthorityPolicyContract(contract);
  if(contractErrors.length) throw new Error("C4_POLICY_CONTRACT_INVALID__"+contractErrors.join(","));
  if(evidence?.terminal!==ENTRY || evidence?.pass!==true) throw new Error("C4_POLICY_ENTRY_TERMINAL_REQUIRED");
  if(evidence?.protectedCorpusVersion!=="v8018" || evidence?.repairCohortCount!==contract.expectedRepairCohortCount) throw new Error("C4_POLICY_REPAIR_COHORT_MISMATCH");
  if(evidence?.repairCohortDigestSha256!==contract.expectedRepairCohortDigestSha256) throw new Error("C4_POLICY_REPAIR_DIGEST_MISMATCH");
  if(evidence?.distinctCanonicalIngredientCount!==contract.expectedIngredientCount) throw new Error("C4_POLICY_INGREDIENT_COUNT_MISMATCH");
  if(evidence?.canonicalIngredientCatalogDigestSha256!==contract.expectedCatalogDigestSha256) throw new Error("C4_POLICY_CATALOG_DIGEST_MISMATCH");
  if(!Array.isArray(evidence?.distinctIngredientIds) || !Array.isArray(evidence?.catalogRows) || !Array.isArray(evidence?.recipeRows)) throw new Error("C4_POLICY_FULL_EVIDENCE_REQUIRED");
  if(sha256(JSON.stringify(evidence.distinctIngredientIds))!==sha256(JSON.stringify(sortedUnique(evidence.distinctIngredientIds)))) throw new Error("C4_POLICY_INGREDIENT_ORDER_NONDETERMINISTIC");

  const evidenceIds=sortedUnique(evidence.distinctIngredientIds);
  const policyIds=sortedUnique(contract.ingredientPolicies.map(row=>row.ingredientId));
  if(JSON.stringify(evidenceIds)!==JSON.stringify(policyIds)) throw new Error("C4_POLICY_INGREDIENT_SET_MISMATCH");
  const catalog=new Map(evidence.catalogRows.map(row=>[row.id,row]));
  const policy=new Map(contract.ingredientPolicies.map(row=>[row.ingredientId,row]));
  for(const id of evidenceIds){
    const expected=sortedUnique(catalog.get(id)?.allergens||[]);
    const reviewed=sortedUnique(policy.get(id)?.reviewedPresentAllergens||[]);
    if(JSON.stringify(expected)!==JSON.stringify(reviewed)) throw new Error("C4_POLICY_POSITIVE_ALLERGEN_DRIFT__"+id);
  }

  const recipeRows=evidence.recipeRows.map(recipe=>{
    const decisions=recipe.ingredientIds.map(id=>policy.get(id));
    const holds=decisions.filter(row=>row.policyState!=="REVIEWED_CURRENT_PROFILE_COMPLETE").map(row=>row.ingredientId).sort();
    const policyComplete=holds.length===0;
    const candidateDeclaredAllergens=policyComplete
      ? sortedUnique(decisions.flatMap(row=>row.reviewedPresentAllergens))
      : [];
    const candidateDietaryTags=[];
    if(policyComplete){
      candidateDietaryTags.push("unrestricted");
      if(decisions.every(row=>row.vegetarian===true)) candidateDietaryTags.push("vegetarian");
      if(decisions.every(row=>row.vegan===true)) candidateDietaryTags.push("vegan");
    }
    return {
      recipeKey:recipe.recipeKey,
      ingredientIds:[...recipe.ingredientIds],
      policyComplete,
      heldIngredientIds:holds,
      candidateDeclaredAllergens,
      candidateDietaryTags,
      authorityState:policyComplete?"CANDIDATE_HARD_METADATA_ONLY__RECONCILIATION_REQUIRED":"HOLD__INGREDIENT_POLICY_INCOMPLETE"
    };
  });
  const completeRows=recipeRows.filter(row=>row.policyComplete);
  const holdRows=recipeRows.filter(row=>!row.policyComplete);
  const completePolicyIngredientCount=contract.ingredientPolicies.filter(r=>r.policyState==="REVIEWED_CURRENT_PROFILE_COMPLETE").length;
  const heldPolicyIngredientIds=contract.ingredientPolicies.filter(r=>r.policyState!=="REVIEWED_CURRENT_PROFILE_COMPLETE").map(r=>r.ingredientId).sort();
  const dietaryTagCandidateCounts={
    unrestricted:completeRows.filter(r=>r.candidateDietaryTags.includes("unrestricted")).length,
    vegetarian:completeRows.filter(r=>r.candidateDietaryTags.includes("vegetarian")).length,
    vegan:completeRows.filter(r=>r.candidateDietaryTags.includes("vegan")).length
  };
  const allergenCandidateCounts={};
  for(const row of completeRows) for(const a of row.candidateDeclaredAllergens) allergenCandidateCounts[a]=(allergenCandidateCounts[a]||0)+1;

  const summary={
    schemaVersion:C4_POLICY_SUMMARY_SCHEMA,
    date:"2026-09-27",
    pass:completeRows.length===100 && holdRows.length===12 && completePolicyIngredientCount===45,
    terminal:C4_POLICY_TERMINAL,
    protectedCorpusVersion:"v8018",
    repairCohortCount:recipeRows.length,
    repairCohortDigestSha256:contract.expectedRepairCohortDigestSha256,
    canonicalIngredientCatalogDigestSha256:contract.expectedCatalogDigestSha256,
    reviewedIngredientPolicyCount:contract.ingredientPolicies.length,
    policyCompleteIngredientCount:completePolicyIngredientCount,
    heldPolicyIngredientCount:heldPolicyIngredientIds.length,
    heldPolicyIngredientIds,
    policyCompleteRecipeCandidateCount:completeRows.length,
    policyHeldRecipeCount:holdRows.length,
    dietaryTagCandidateCounts,
    declaredAllergenCandidateRecipeCounts:Object.fromEntries(Object.entries(allergenCandidateCounts).sort(([a],[b])=>a.localeCompare(b))),
    recommendationAuthorityPromoted:false,
    hardSafetyRuntimeAuthorityPromoted:false,
    semantics:{
      completenessScope:"CURRENT_MAPPED_PROFILE_ALLERGEN_TOKENS_ONLY",
      emptyPresentListMeansGlobalAllergenFree:false,
      crossContactGuarantee:false,
      productLabelGuarantee:false,
      residualEuCategoriesInferred:false,
      heldIngredientBlocksRecipeCandidate:true
    },
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,
      publicRuntimeChanged:false,recommendationBehaviorChanged:false,recommendationAdmissionChanged:false,
      nutritionAuthorityPromoted:false,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
    },
    nextGate:"C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_V1"
  };
  return {summary,full:{...summary,ingredientPolicies:contract.ingredientPolicies,recipeRows}};
}

export function validateC4HardAuthorityPolicySummary(summary){
  const errors=[];
  if(summary?.schemaVersion!==C4_POLICY_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true || summary?.terminal!==C4_POLICY_TERMINAL) errors.push("terminal");
  if(summary?.reviewedIngredientPolicyCount!==49 || summary?.policyCompleteIngredientCount!==45 || summary?.heldPolicyIngredientCount!==4) errors.push("ingredientCounts");
  if(summary?.policyCompleteRecipeCandidateCount!==100 || summary?.policyHeldRecipeCount!==12) errors.push("recipeCounts");
  if(summary?.dietaryTagCandidateCounts?.unrestricted!==100 || summary?.dietaryTagCandidateCounts?.vegetarian!==91 || summary?.dietaryTagCandidateCounts?.vegan!==23) errors.push("dietaryCounts");
  if(summary?.recommendationAuthorityPromoted!==false || summary?.hardSafetyRuntimeAuthorityPromoted!==false) errors.push("authority");
  if(summary?.nextGate!=="C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_V1") errors.push("nextGate");
  return errors;
}
