import { createHash } from "node:crypto";
import { resolveWithReviewedUnitoolsAlias } from "./culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs";

export const C4_UNITOOLS_CANONICAL_GAP_SCHEMA="CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_V1";
export const C4_UNITOOLS_CANONICAL_GAP_SUMMARY_SCHEMA="CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_SUMMARY_V1";
export const C4_UNITOOLS_CANONICAL_GAP_TERMINAL="CULINARY_BRAIN_C4_UNITOOLS_CANONICAL_GAP_DESIGN_PASS__REVIEW_READY";
const ENTRY_TERMINAL="CULINARY_BRAIN_C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_PASS";
const norm=value=>String(value??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
const gapKey=ingredient=>norm(ingredient?.id)+" :: "+norm(ingredient?.name?.en);

export function validateC4UnitoolsCanonicalGapContract(contract){
  const errors=[];
  if(contract?.schemaVersion!==C4_UNITOOLS_CANONICAL_GAP_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!==ENTRY_TERMINAL) errors.push("entryTerminal");
  if(contract?.sourceCohortId!=="unitools-world-recipes-v1_1_0") errors.push("sourceCohortId");
  if(contract?.expectedSourceRecipeCount!==501) errors.push("recipeCount");
  const b=contract?.expectedPostAliasBaseline||{};
  if(b.resolvedIngredientOccurrences!==2638||b.unresolvedIngredientOccurrences!==2693||b.conflictingIngredientOccurrences!==73||b.fullyMappedRecipeCount!==1) errors.push("baseline");
  if(contract?.ranking?.excludeRecipesWithIdentityConflicts!==true) errors.push("conflictPolicy");
  for(const [key,value] of Object.entries(contract?.authority||{})) if(value!==false) errors.push("authority."+key);
  if(contract?.targetTerminal!==C4_UNITOOLS_CANONICAL_GAP_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGate!=="C4_UNITOOLS_CANONICAL_GAP_REVIEW_V1") errors.push("nextGate");
  return [...new Set(errors)].sort();
}

export function inventoryUnitoolsCanonicalGaps(dataset, aliasContract){
  const rows=[];
  let resolved=0,unresolved=0,conflicts=0,fullyMapped=0;
  const gapAgg=new Map();
  for(const recipe of dataset?.recipes||[]){
    const unresolvedIngredients=[];
    const conflictIngredients=[];
    let totalUnresolvedOccurrences=0;
    for(const ingredient of recipe.ingredients||[]){
      const result=resolveWithReviewedUnitoolsAlias(ingredient,aliasContract);
      if(result.status==="RESOLVED") resolved++;
      else if(result.status==="CONFLICT"){conflicts++; conflictIngredients.push({sourceId:ingredient?.id??null,sourceName:ingredient?.name?.en??null});}
      else {unresolved++; totalUnresolvedOccurrences++; unresolvedIngredients.push({sourceId:ingredient?.id??null,sourceName:ingredient?.name?.en??null});}
    }
    if(unresolvedIngredients.length===0&&conflictIngredients.length===0){fullyMapped++; continue;}
    const uniqueMap=new Map();
    for(const ingredient of unresolvedIngredients){
      const key=gapKey(ingredient);
      const current=uniqueMap.get(key)||{key,sourceId:ingredient.sourceId,sourceName:ingredient.sourceName,occurrenceCount:0};
      current.occurrenceCount++;
      uniqueMap.set(key,current);
    }
    const distinctGaps=[...uniqueMap.values()].sort((a,b)=>a.key.localeCompare(b.key));
    rows.push({
      sourceSlug:recipe.slug,
      title:recipe?.name?.en||recipe.nativeName||recipe.slug,
      category:recipe.category??null,
      difficulty:recipe.difficulty??null,
      prepMinutes:recipe.prepMinutes??null,
      cookMinutes:recipe.cookMinutes??null,
      distinctUnresolvedGapCount:distinctGaps.length,
      totalUnresolvedOccurrences,
      identityConflictCount:conflictIngredients.length,
      distinctGaps,
      conflicts:conflictIngredients
    });
    if(conflictIngredients.length===0){
      for(const gap of distinctGaps){
        const agg=gapAgg.get(gap.key)||{...gap,blockedRecipeCount:0,oneGapRecipeCount:0,recipeSlugs:[]};
        agg.blockedRecipeCount++;
        agg.recipeSlugs.push(recipe.slug);
        gapAgg.set(gap.key,agg);
      }
    }
  }
  const eligibleRows=rows.filter(row=>row.identityConflictCount===0&&row.distinctUnresolvedGapCount>0)
    .sort((a,b)=>a.distinctUnresolvedGapCount-b.distinctUnresolvedGapCount||a.totalUnresolvedOccurrences-b.totalUnresolvedOccurrences||a.sourceSlug.localeCompare(b.sourceSlug));
  const minDistinctGapCount=eligibleRows.length?eligibleRows[0].distinctUnresolvedGapCount:null;
  const minRows=minDistinctGapCount==null?[]:eligibleRows.filter(row=>row.distinctUnresolvedGapCount===minDistinctGapCount);
  for(const row of eligibleRows.filter(row=>row.distinctUnresolvedGapCount===1)){
    const agg=gapAgg.get(row.distinctGaps[0].key);
    if(agg) agg.oneGapRecipeCount++;
  }
  const aggregates=[...gapAgg.values()].map(row=>({...row,recipeSlugs:[...row.recipeSlugs].sort()}))
    .sort((a,b)=>b.oneGapRecipeCount-a.oneGapRecipeCount||b.blockedRecipeCount-a.blockedRecipeCount||a.key.localeCompare(b.key));
  const distribution={};
  for(const row of eligibleRows) distribution[row.distinctUnresolvedGapCount]=(distribution[row.distinctUnresolvedGapCount]||0)+1;
  return {rows,eligibleRows,minDistinctGapCount,minRows,aggregates,distribution,resolved,unresolved,conflicts,fullyMapped};
}

export function buildC4UnitoolsCanonicalGapDesign({contract,aliasReviewSummary,aliasContract,dataset}){
  const errors=validateC4UnitoolsCanonicalGapContract(contract);
  if(errors.length) throw new Error("C4_UNITOOLS_CANONICAL_GAP_CONTRACT_INVALID__"+errors.join(","));
  if(aliasReviewSummary?.pass!==true||aliasReviewSummary?.terminal!==ENTRY_TERMINAL) throw new Error("C4_UNITOOLS_CANONICAL_GAP_ALIAS_REVIEW_REQUIRED");
  if(dataset?.recipes?.length!==contract.expectedSourceRecipeCount) throw new Error("C4_UNITOOLS_CANONICAL_GAP_RECIPE_COUNT_MISMATCH");
  const inv=inventoryUnitoolsCanonicalGaps(dataset,aliasContract);
  const baseline=contract.expectedPostAliasBaseline;
  if(inv.resolved!==baseline.resolvedIngredientOccurrences||inv.unresolved!==baseline.unresolvedIngredientOccurrences||inv.conflicts!==baseline.conflictingIngredientOccurrences||inv.fullyMapped!==baseline.fullyMappedRecipeCount) throw new Error("C4_UNITOOLS_CANONICAL_GAP_BASELINE_DRIFT");
  const detailed=inv.minRows.slice(0,contract.ranking.maxDetailedRows);
  const digest=createHash("sha256").update(JSON.stringify(detailed.map(row=>({sourceSlug:row.sourceSlug,distinctGaps:row.distinctGaps})))).digest("hex");
  return {
    schemaVersion:C4_UNITOOLS_CANONICAL_GAP_SUMMARY_SCHEMA,
    date:"2026-09-28",
    pass:true,
    terminal:C4_UNITOOLS_CANONICAL_GAP_TERMINAL,
    protectedCorpusVersion:"v8018",
    sourceCohortId:contract.sourceCohortId,
    baseline:{
      recipeCount:dataset.recipes.length,
      fullyMappedRecipeCount:inv.fullyMapped,
      resolvedIngredientOccurrences:inv.resolved,
      unresolvedIngredientOccurrences:inv.unresolved,
      conflictingIngredientOccurrences:inv.conflicts
    },
    gapInventory:{
      conflictFreeBlockedRecipeCount:inv.eligibleRows.length,
      recipesWithIdentityConflicts:inv.rows.filter(row=>row.identityConflictCount>0).length,
      minDistinctGapCount:inv.minDistinctGapCount,
      minGapRecipeCount:inv.minRows.length,
      gapCountDistribution:inv.distribution,
      minGapRows:detailed,
      minGapRowsDigestSha256:digest,
      topGapAggregates:inv.aggregates.slice(0,50)
    },
    authorityPromoted:false,
    recommendationAdmissionChanged:false,
    publicRuntimeChanged:false,
    boundaries:{canonicalIngredientsCreated:0,additionalAliasMappingsAdded:0,protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false},
    nextGate:contract.nextGate
  };
}
