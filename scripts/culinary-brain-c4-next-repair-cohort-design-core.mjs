export const C4_NEXT_REPAIR_DESIGN_SCHEMA="CULINARY_BRAIN_C4_NEXT_REPAIR_COHORT_DESIGN_V1";
export const C4_NEXT_REPAIR_DESIGN_SUMMARY_SCHEMA="CULINARY_BRAIN_C4_NEXT_REPAIR_COHORT_DESIGN_SUMMARY_V1";
export const C4_NEXT_REPAIR_DESIGN_TERMINAL="CULINARY_BRAIN_C4_NEXT_REPAIR_COHORT_DESIGN_PASS__UNITOOLS_ALIAS_REVIEW_READY";
const ENTRY_TERMINAL="CULINARY_BRAIN_C4_BOUNDED_P3_DUPLICATE_SAFE_ADMISSION_PASS__EXISTING_CANONICAL_ALIGNMENT_ONLY";

const keyForMapping=m=>`${m?.sourceId??"<no-id>"} :: ${m?.sourceName??"<no-name>"} :: ${m?.status??"UNKNOWN"}`;

export function validateC4NextRepairDesignContract(contract){
  const errors=[];
  if(contract?.schemaVersion!==C4_NEXT_REPAIR_DESIGN_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!==ENTRY_TERMINAL) errors.push("entryTerminal");
  if(contract?.candidateSourceCohort?.id!=="unitools-world-recipes-v1_1_0") errors.push("sourceCohort");
  if(contract?.expectedSourceRecipeCount!==501) errors.push("recipeCount");
  if(contract?.expectedCurrentAllIngredientsMappedCount!==1) errors.push("mappedCount");
  if(contract?.rankingPolicy?.topCandidateCount!==25) errors.push("topCandidateCount");
  if(contract?.rankingPolicy?.excludeConflictRowsFromAliasPromotionCandidates!==true) errors.push("conflictPolicy");
  for(const [key,value] of Object.entries(contract?.authority||{})) if(value!==false) errors.push("authority."+key);
  if(contract?.targetTerminal!==C4_NEXT_REPAIR_DESIGN_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGate!=="C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_V1") errors.push("nextGate");
  return [...new Set(errors)].sort();
}

export function rankUnitoolsAliasLeverage(preflight){
  const occurrence=new Map();
  const singleUnlock=new Map();
  for(const row of preflight?.recipeRows||[]){
    const unresolved=(row.ingredientMappings||[]).filter(m=>m.status!=="RESOLVED");
    for(const m of unresolved){
      const key=keyForMapping(m);
      const prev=occurrence.get(key)||{key,sourceId:m.sourceId??null,sourceName:m.sourceName??null,status:m.status,occurrenceCount:0};
      prev.occurrenceCount++;
      occurrence.set(key,prev);
    }
    if(unresolved.length===0||unresolved.some(m=>m.status==="CONFLICT")) continue;
    const keys=[...new Set(unresolved.map(keyForMapping))];
    if(keys.length===1) singleUnlock.set(keys[0],(singleUnlock.get(keys[0])||0)+1);
  }
  return [...occurrence.values()]
    .filter(row=>row.status==="UNRESOLVED")
    .map(row=>({...row,singleAliasRecipesPotentiallyUnlocked:singleUnlock.get(row.key)||0}))
    .sort((a,b)=>b.singleAliasRecipesPotentiallyUnlocked-a.singleAliasRecipesPotentiallyUnlocked||b.occurrenceCount-a.occurrenceCount||a.key.localeCompare(b.key));
}

export function buildC4NextRepairCohortDesign({contract,p3,preflight}){
  const errors=validateC4NextRepairDesignContract(contract);
  if(errors.length) throw new Error("C4_NEXT_REPAIR_DESIGN_CONTRACT_INVALID__"+errors.join(","));
  if(p3?.pass!==true||p3?.terminal!==ENTRY_TERMINAL) throw new Error("C4_NEXT_REPAIR_DESIGN_P3_REQUIRED");
  if(preflight?.pass!==true||preflight?.source?.sourceCohortId!==contract.candidateSourceCohort.id) throw new Error("C4_NEXT_REPAIR_DESIGN_UNITOOLS_PREFLIGHT_REQUIRED");
  const ontology=preflight.ontology||{};
  const expected={
    recipeCount:contract.expectedSourceRecipeCount,
    mapped:contract.expectedCurrentAllIngredientsMappedCount,
    occurrences:contract.expectedIngredientOccurrenceCount,
    resolved:contract.expectedResolvedIngredientOccurrenceCount,
    unresolved:contract.expectedUnresolvedIngredientOccurrenceCount,
    conflicts:contract.expectedConflictingIngredientOccurrenceCount
  };
  if(preflight.source.recipeCount!==expected.recipeCount||ontology.recipesAllIngredientsMapped!==expected.mapped||ontology.ingredientOccurrences!==expected.occurrences||ontology.resolvedIngredientOccurrences!==expected.resolved||ontology.unresolvedIngredientOccurrences!==expected.unresolved||ontology.conflictingIngredientOccurrences!==expected.conflicts) throw new Error("C4_NEXT_REPAIR_DESIGN_UNITOOLS_BASELINE_DRIFT");

  const ranked=rankUnitoolsAliasLeverage(preflight);
  const top=ranked.slice(0,contract.rankingPolicy.topCandidateCount);
  const potentialUnlockCount=top.reduce((sum,row)=>sum+row.singleAliasRecipesPotentiallyUnlocked,0);
  return {
    schemaVersion:C4_NEXT_REPAIR_DESIGN_SUMMARY_SCHEMA,
    date:"2026-09-28",
    pass:true,
    terminal:C4_NEXT_REPAIR_DESIGN_TERMINAL,
    protectedCorpusVersion:"v8018",
    sourceCohort:{
      id:preflight.source.sourceCohortId,
      recipeCount:preflight.source.recipeCount,
      commit:preflight.source.commit,
      dataBlobSha:preflight.source.dataBlobSha
    },
    currentIdentityBaseline:{
      ingredientOccurrenceCount:ontology.ingredientOccurrences,
      resolvedIngredientOccurrenceCount:ontology.resolvedIngredientOccurrences,
      unresolvedIngredientOccurrenceCount:ontology.unresolvedIngredientOccurrences,
      conflictingIngredientOccurrenceCount:ontology.conflictingIngredientOccurrences,
      recipesAllIngredientsMapped:ontology.recipesAllIngredientsMapped,
      storedOnlyRecipeCount:preflight.source.recipeCount-ontology.recipesAllIngredientsMapped
    },
    hardMetadataLeverage:{
      recipesWithBothTimeParts:preflight.hardMetadata?.recipesWithBothTimeParts??0,
      recipesWithExplicitPositiveServings:preflight.hardMetadata?.recipesWithExplicitPositiveServings??0,
      difficultyValues:preflight.hardMetadata?.difficultyValues||[],
      categoryValues:preflight.hardMetadata?.categoryValues||[]
    },
    selection:{
      strategy:"REVIEW_HIGH_LEVERAGE_UNITOOLS_UNRESOLVED_INGREDIENT_NAMES_FIRST",
      topCandidateCount:top.length,
      topCandidates:top,
      sumSingleAliasRecipeUnlockPotentialAcrossTopCandidates:potentialUnlockCount,
      conflictRowsExcludedFromPromotionCandidates:true
    },
    authorityPromoted:false,
    recommendationAdmissionChanged:false,
    publicRuntimeChanged:false,
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      ingredientAliasMappingsAdded:0,
      hardDietaryAllergenAuthorityPromoted:false,
      publicRuntimeWidened:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:contract.nextGate
  };
}
