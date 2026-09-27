import { createHash } from "node:crypto";
import { ingredientById } from "../src/data/ingredients.js";

export const C4_HARD_AUTHORITY_EVIDENCE_SCHEMA = "CULINARY_BRAIN_C4_HARD_AUTHORITY_EVIDENCE_AUDIT_V1";
export const C4_HARD_AUTHORITY_EVIDENCE_SUMMARY_SCHEMA = "CULINARY_BRAIN_C4_HARD_AUTHORITY_EVIDENCE_AUDIT_SUMMARY_V1";
export const C4_HARD_AUTHORITY_EVIDENCE_TERMINAL = "CULINARY_BRAIN_C4_HARD_AUTHORITY_EVIDENCE_AUDIT_PASS__POLICY_REVIEW_READY";

const sha256=value=>createHash("sha256").update(String(value)).digest("hex");
const recipeKey=row=>String(row?.cohortId||"")+"::"+String(row?.sourceRecordKey||"");
const sortedUnique=values=>[...new Set(values)].sort();
const countBy=(rows,selector)=>{
  const m=new Map();
  for(const row of rows){
    const k=String(selector(row));
    m.set(k,(m.get(k)||0)+1);
  }
  return Object.fromEntries([...m.entries()].sort(([a],[b])=>a.localeCompare(b)));
};

export function validateC4HardAuthorityEvidenceContract(contract){
  const errors=[];
  if(contract?.schemaVersion!==C4_HARD_AUTHORITY_EVIDENCE_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.expectedProtectedRecipeCount!==19268) errors.push("expectedProtectedRecipeCount");
  if(contract?.expectedRepairCohortCount!==112) errors.push("expectedRepairCohortCount");
  if(!/^[a-f0-9]{64}$/.test(contract?.expectedRepairCohortDigestSha256||"")) errors.push("expectedRepairCohortDigestSha256");
  if(contract?.entryTerminal!=="CULINARY_BRAIN_C4_FAILURE_MATRIX_PASS__112_IDENTITY_READY_REPAIR_COHORT_FROZEN") errors.push("entryTerminal");
  if(contract?.targetTerminal!==C4_HARD_AUTHORITY_EVIDENCE_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGate!=="C4_HARD_AUTHORITY_POLICY_REVIEW_V1") errors.push("nextGate");
  if(contract?.semantics?.catalogAllergenSignalsArePositiveCandidateEvidenceOnly!==true) errors.push("positiveEvidenceOnly");
  if(contract?.semantics?.emptyCatalogAllergenSignalIsNotAllergenFreeProof!==true) errors.push("emptySignalSafety");
  if(contract?.semantics?.dietaryCompatibilityInferenceAuthorized!==false) errors.push("dietaryInference");
  if(contract?.semantics?.allergenFreeInferenceAuthorized!==false) errors.push("allergenFreeInference");
  for(const [key,value] of Object.entries(contract?.authority||{})) if(value!==false) errors.push("authority."+key);
  return errors;
}

export function buildC4HardAuthorityEvidence({contract,nutritionFull,c4MatrixSummary}){
  const contractErrors=validateC4HardAuthorityEvidenceContract(contract);
  if(contractErrors.length) throw new Error("C4_HARD_AUTHORITY_CONTRACT_INVALID__"+contractErrors.join(","));
  if(nutritionFull?.protectedCorpusVersion!=="v8018" || nutritionFull?.observedRecipeCount!==contract.expectedProtectedRecipeCount) {
    throw new Error("C4_HARD_AUTHORITY_NUTRITION_V8018_REQUIRED");
  }
  if(c4MatrixSummary?.terminal!==contract.entryTerminal || c4MatrixSummary?.pass!==true) {
    throw new Error("C4_HARD_AUTHORITY_C4_MATRIX_TERMINAL_REQUIRED");
  }
  if(c4MatrixSummary?.repairCohort?.recipeCount!==contract.expectedRepairCohortCount
    || c4MatrixSummary?.repairCohort?.digestSha256!==contract.expectedRepairCohortDigestSha256) {
    throw new Error("C4_HARD_AUTHORITY_REPAIR_COHORT_CONTRACT_MISMATCH");
  }

  const diagnostics=nutritionFull.protectedCorpusRecipeDiagnostics;
  if(!Array.isArray(diagnostics) || diagnostics.length!==contract.expectedProtectedRecipeCount) {
    throw new Error("C4_HARD_AUTHORITY_DIAGNOSTIC_COUNT_MISMATCH");
  }
  const ready=diagnostics
    .filter(row=>row.allIngredientIdentitiesResolved===true && Number(row.ingredientOccurrenceCount)>0)
    .sort((a,b)=>recipeKey(a).localeCompare(recipeKey(b)));
  if(ready.length!==contract.expectedRepairCohortCount) throw new Error("C4_HARD_AUTHORITY_READY_COUNT_MISMATCH_"+ready.length);

  const keys=ready.map(recipeKey);
  if(sha256(JSON.stringify(keys))!==contract.expectedRepairCohortDigestSha256) throw new Error("C4_HARD_AUTHORITY_READY_DIGEST_MISMATCH");

  const recipeRows=[];
  const ingredientIds=[];
  for(const row of ready){
    if(!Array.isArray(row.identityRows) || row.identityRows.length!==row.ingredientOccurrenceCount) {
      throw new Error("C4_HARD_AUTHORITY_IDENTITY_ROWS_MISSING_"+recipeKey(row));
    }
    const ids=[];
    for(const identity of row.identityRows){
      const id=identity?.canonicalIngredientId;
      if(!id || identity?.state!=="EXACT_ALIAS_MATCH") throw new Error("C4_HARD_AUTHORITY_NONEXACT_IDENTITY_"+recipeKey(row));
      if(!ingredientById(id)) throw new Error("C4_HARD_AUTHORITY_CATALOG_ID_MISSING_"+id);
      ids.push(id); ingredientIds.push(id);
    }
    const uniqueIds=sortedUnique(ids);
    const positiveAllergenSignals=sortedUnique(uniqueIds.flatMap(id=>ingredientById(id)?.allergens||[]));
    recipeRows.push({
      recipeKey:recipeKey(row),
      cohortId:row.cohortId,
      sourceSystem:row.sourceSystem,
      ingredientIds:uniqueIds,
      positiveCatalogAllergenSignals:positiveAllergenSignals,
      allergenEvidenceState:positiveAllergenSignals.length
        ? "POSITIVE_CATALOG_ALLERGEN_SIGNAL_PRESENT__CANDIDATE_ONLY"
        : "NO_KNOWN_CATALOG_ALLERGEN_SIGNAL__NOT_AN_ALLERGEN_FREE_CLAIM",
      hardAuthorityState:"NOT_EARNED__POLICY_REVIEW_REQUIRED"
    });
  }

  const distinctIngredientIds=sortedUnique(ingredientIds);
  const catalogRows=distinctIngredientIds.map(id=>{
    const ingredient=ingredientById(id);
    return {
      id,
      family:ingredient.family,
      families:[...(ingredient.families||[])].sort(),
      allergens:[...(ingredient.allergens||[])].sort()
    };
  });
  const catalogDigestSha256=sha256(JSON.stringify(catalogRows));
  const recipesWithPositiveAllergenSignalCount=recipeRows.filter(row=>row.positiveCatalogAllergenSignals.length>0).length;
  const allergenSignalCounts={};
  for(const row of recipeRows) for(const allergen of row.positiveCatalogAllergenSignals) {
    allergenSignalCounts[allergen]=(allergenSignalCounts[allergen]||0)+1;
  }

  const summary={
    schemaVersion:C4_HARD_AUTHORITY_EVIDENCE_SUMMARY_SCHEMA,
    date:"2026-09-27",
    pass:true,
    terminal:C4_HARD_AUTHORITY_EVIDENCE_TERMINAL,
    protectedCorpusVersion:"v8018",
    repairCohortCount:ready.length,
    repairCohortDigestSha256:contract.expectedRepairCohortDigestSha256,
    distinctCanonicalIngredientCount:distinctIngredientIds.length,
    canonicalIngredientCatalogDigestSha256:catalogDigestSha256,
    recipesWithPositiveCatalogAllergenSignalCount:recipesWithPositiveAllergenSignalCount,
    recipesWithoutPositiveCatalogAllergenSignalCount:ready.length-recipesWithPositiveAllergenSignalCount,
    positiveAllergenSignalRecipeCounts:Object.fromEntries(Object.entries(allergenSignalCounts).sort(([a],[b])=>a.localeCompare(b))),
    sourceSystemCounts:countBy(recipeRows,row=>row.sourceSystem),
    hardAuthorityEarnedCount:0,
    candidateEvidenceOnly:true,
    safetyInterpretation:{
      positiveCatalogAllergenSignalMaySupportLaterReviewedDeclaration:true,
      emptyCatalogAllergenSignalProvesAllergenFree:false,
      ingredientFamilyProvesDietaryCompatibility:false,
      titleProvesDietaryCompatibility:false
    },
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedRuntimeBodyReads:0,
      protectedBodiesRewritten:0,
      publicRuntimeChanged:false,
      recommendationBehaviorChanged:false,
      recommendationAuthorityWidened:false,
      dietaryAllergenAuthorityPromoted:false,
      nutritionAuthorityPromoted:false,
      knowledgeCoreRuntimeDependencyAdded:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:"C4_HARD_AUTHORITY_POLICY_REVIEW_V1"
  };
  return {summary,full:{...summary,distinctIngredientIds,catalogRows,recipeRows}};
}

export function validateC4HardAuthorityEvidenceSummary(summary){
  const errors=[];
  if(summary?.schemaVersion!==C4_HARD_AUTHORITY_EVIDENCE_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.terminal!==C4_HARD_AUTHORITY_EVIDENCE_TERMINAL || summary?.pass!==true) errors.push("terminal");
  if(summary?.repairCohortCount!==112) errors.push("repairCohortCount");
  if(!/^[a-f0-9]{64}$/.test(summary?.canonicalIngredientCatalogDigestSha256||"")) errors.push("catalogDigest");
  if(summary?.hardAuthorityEarnedCount!==0 || summary?.candidateEvidenceOnly!==true) errors.push("authority");
  if(summary?.safetyInterpretation?.emptyCatalogAllergenSignalProvesAllergenFree!==false) errors.push("allergenFree");
  if(summary?.safetyInterpretation?.ingredientFamilyProvesDietaryCompatibility!==false) errors.push("dietary");
  if(summary?.nextGate!=="C4_HARD_AUTHORITY_POLICY_REVIEW_V1") errors.push("nextGate");
  return errors;
}
