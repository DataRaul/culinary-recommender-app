import { ingredientById } from "../src/data/ingredients.js";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { resolveWithReviewedUnitoolsAlias } from "./culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs";

export const P3_SCHEMA = "CULINARY_BRAIN_C4_TAPIOCA_BOUNDED_P3_ADMISSION_CONTRACT_V1";
export const P3_SUMMARY_SCHEMA = "CULINARY_BRAIN_C4_TAPIOCA_BOUNDED_P3_ADMISSION_SUMMARY_V1";
export const P3_TERMINAL = "CULINARY_BRAIN_C4_TAPIOCA_BOUNDED_P3_CONTRACT_PASS__PREACTIVATION_READY";
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const expectedMapped = { tapioca:"tapioca_starch", milk:"milk", water:"water", oil:"neutral_oil", eggs:"eggs", cheese:"parmesan", mozzarella:"mozzarella", salt:"salt" };

export function validateP3Contract(contract) {
  const errors=[];
  if(contract?.schemaVersion!==P3_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!=="CULINARY_BRAIN_C4_TAPIOCA_RECONCILIATION_PASS__BOUNDED_P3_CONTRACT_READY") errors.push("entryTerminal");
  if(contract?.source?.sourceCohortId!=="unitools-world-recipes-v1_1_0") errors.push("sourceCohortId");
  if(contract?.source?.commit!=="1d09e9548d957dd0375301146a86dddf5e269c1b") errors.push("sourceCommit");
  if(contract?.source?.dataBlobSha!=="a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed") errors.push("sourceBlob");
  if(contract?.source?.sourceSlug!=="pao-de-queijo") errors.push("sourceSlug");
  if(contract?.candidate?.canonicalRecipeId!=="unitools_pao_de_queijo") errors.push("candidateId");
  if(!same(contract?.candidate?.reviewedMealTypes,["breakfast","snack"])) errors.push("mealTypes");
  if(contract?.candidate?.runtimeDifficulty!==3||contract?.candidate?.totalMinutes!==50||contract?.candidate?.servings!==6||contract?.candidate?.instructionStepCount!==5) errors.push("hardMetadata");
  if(!same(contract?.candidate?.declaredAllergens,["egg","milk"])||!same(contract?.candidate?.dietaryTags,["unrestricted"])) errors.push("hardSafety");
  const auth=contract?.authority||{};
  for(const key of ["candidateSerializationAuthorized","hardFilterSimulationAuthorized","browserPreactivationAcceptanceAuthorized","exactRecipeLocalIngredientOverlayAuthorized"]) if(auth[key]!==true) errors.push("authority."+key);
  for(const key of ["runtimeActivationAuthorized","publicRuntimeWideningAuthorized","automaticRecommendationAdmissionAuthorized","globalIngredientCatalogMutationAuthorized","protectedD1ReadAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","knowledgeCoreWriteAuthorized","paidModelOrApiAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]) if(auth[key]!==false) errors.push("authority."+key);
  if(contract?.targetTerminal!==P3_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGate!=="C4_TAPIOCA_P3_OWNER_ACTIVATION_AUTHORIZATION") errors.push("nextGate");
  return [...new Set(errors)].sort();
}

export function validateP3Candidate({contract,reconciliation,aliasContract,dataset,candidateArtifact}) {
  const errors=validateP3Contract(contract);
  if(errors.length) throw new Error("P3_CONTRACT_INVALID__"+errors.join(","));
  if(reconciliation?.terminal!==contract.entryTerminal||reconciliation?.candidateHardMetadataReadyForBoundedAdmissionContract!==true) throw new Error("P3_RECONCILIATION_ENTRY_MISMATCH");
  if(reconciliation?.identityOverlayActivated!==false||reconciliation?.publicDuplicateFound!==false||reconciliation?.recommendationAdmissionChanged!==false) throw new Error("P3_RECONCILIATION_BOUNDARY_MISMATCH");
  if(dataset?.recipes?.length!==501) throw new Error("P3_SOURCE_COUNT_MISMATCH");
  const source=dataset.recipes.find(row=>row.slug===contract.source.sourceSlug);
  if(!source) throw new Error("P3_SOURCE_RECIPE_MISSING");
  if(source.country!=="BR"||source.category!=="bread"||source.difficulty!=="medium"||source.prepMinutes!==25||source.cookMinutes!==25||source.baseServings!==6) throw new Error("P3_SOURCE_HARD_METADATA_DRIFT");
  if(!Array.isArray(source.steps)||source.steps.length!==5||source.steps.some(step=>!step?.text?.en?.trim())) throw new Error("P3_SOURCE_INSTRUCTION_DRIFT");
  if(ingredientById("tapioca_starch")) throw new Error("P3_GLOBAL_TAPIOCA_IDENTITY_MUST_REMAIN_ABSENT");
  const recipe=candidateArtifact?.recipe;
  if(candidateArtifact?.schemaVersion!=="CULINARY_BRAIN_C4_TAPIOCA_P3_CANDIDATE_V1"||candidateArtifact?.candidateOnly!==true||recipe?.id!==contract.candidate.canonicalRecipeId) throw new Error("P3_CANDIDATE_IDENTITY_MISMATCH");
  if(recipe?.identity?.canonicalTitle!==(source.name?.en||source.nativeName)) throw new Error("P3_CANDIDATE_TITLE_DRIFT");
  if(recipe?.governance?.recommendationState!=="ELIGIBLE"||recipe?.governance?.candidateSemanticsOnly!==true||recipe?.governance?.runtimeActivationAuthorized!==false) throw new Error("P3_CANDIDATE_GOVERNANCE_MISMATCH");
  if(PUBLIC_RUNTIME_RECIPES.length!==85||PUBLIC_RUNTIME_RECIPES.some(row=>row.id===recipe.id||row.provenance?.sourceItemId===contract.source.sourceSlug)) throw new Error("P3_PUBLIC_RUNTIME_BOUNDARY_MISMATCH");
  if(!same(recipe?.culinary?.mealTypes,["breakfast","snack"])||recipe?.culinary?.difficulty!==3||recipe?.time?.totalMinutes!==50||recipe?.serving?.servings!==6) throw new Error("P3_CANDIDATE_HARD_METADATA_MISMATCH");
  if(!same(recipe?.dietaryTags,["unrestricted"])||!same(recipe?.allergySafety?.declaredAllergens,["egg","milk"])) throw new Error("P3_CANDIDATE_HARD_SAFETY_MISMATCH");
  if(recipe?.nutrition?.estimationState!=="EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED"||Object.values(recipe?.nutrition?.perServing||{}).some(value=>value!==null)) throw new Error("P3_NUTRITION_FIREWALL_MISMATCH");
  if(recipe?.ingredients?.length!==source.ingredients?.length||recipe.ingredients.length!==8) throw new Error("P3_INGREDIENT_COUNT_DRIFT");
  for(let i=0;i<source.ingredients.length;i++){
    const src=source.ingredients[i], dst=recipe.ingredients[i];
    let expectedId;
    if(src.id==="tapioca"&&src.name?.en==="Tapioca starch") expectedId="tapioca_starch";
    else {
      const resolved=resolveWithReviewedUnitoolsAlias(src,aliasContract);
      if(resolved.status!=="RESOLVED") throw new Error("P3_SOURCE_INGREDIENT_NOT_RESOLVED__"+src.id);
      expectedId=resolved.canonicalIngredientId;
    }
    if(expectedMapped[src.id]!==expectedId) throw new Error("P3_EXPECTED_IDENTITY_DRIFT__"+src.id);
    if(dst?.canonicalIngredientId!==expectedId) throw new Error("P3_CANDIDATE_INGREDIENT_ID_DRIFT__"+i);
    if(dst?.quantity!==(src.quantity??null)||dst?.unit!==(src.unit??null)) throw new Error("P3_CANDIDATE_INGREDIENT_QUANTITY_DRIFT__"+i);
    if(dst?.sourceText!==(src.name?.en||src.name?.ru||String(src.id||""))) throw new Error("P3_CANDIDATE_INGREDIENT_TEXT_DRIFT__"+i);
  }
  for(let i=0;i<source.steps.length;i++) if(recipe.instructions?.[i]?.text!==source.steps[i]?.text?.en) throw new Error("P3_CANDIDATE_INSTRUCTION_DRIFT__"+i);
  return recipe;
}

export function buildP3Summary(args) {
  const recipe=validateP3Candidate(args);
  return {
    schemaVersion:P3_SUMMARY_SCHEMA,date:"2026-09-28",pass:true,terminal:P3_TERMINAL,protectedCorpusVersion:"v8018",
    sourceKey:"unitools-world-recipes-v1_1_0::pao-de-queijo",candidateId:recipe.id,
    sourcePin:{commit:args.contract.source.commit,dataBlobSha:args.contract.source.dataBlobSha},
    candidateSerialization:{ingredientCount:recipe.ingredients.length,instructionStepCount:recipe.instructions.length,reviewedMealTypes:recipe.culinary.mealTypes,runtimeDifficulty:recipe.culinary.difficulty,totalMinutes:recipe.time.totalMinutes,servings:recipe.serving.servings},
    hardSafety:{declaredAllergens:recipe.allergySafety.declaredAllergens,dietaryTags:recipe.dietaryTags,exactRecipeLocalIngredientOverlay:"tapioca_starch",globalIngredientCatalogChanged:false},
    runtimeBoundary:{publicRuntimeRecipeCount:PUBLIC_RUNTIME_RECIPES.length,candidatePresentInPublicRuntime:false,runtimeActivationAuthorized:false,protectedRecommendationAdmissionCount:0,newPublicRuntimeRecipeCount:0,sourceNutritionImported:false},
    browserPreactivationAcceptanceRequired:true,ownerActivationAuthorizationRequired:true,nextGate:args.contract.nextGate
  };
}
