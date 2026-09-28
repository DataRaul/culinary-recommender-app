import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { ingredientById } from "../src/data/ingredients.js";
import { createRecipeSourceV2 } from "../src/domain/catalog.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";
import { searchRecipesByIngredients } from "../src/domain/search.js";
import { validateP3Contract } from "../scripts/culinary-brain-c4-tapioca-bounded-p3-admission-core.mjs";
const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const contract=read("config/culinary_brain_c4_tapioca_bounded_p3_admission_contract_v1.json");
const artifact=read("data/generated/culinary-brain-c4-tapioca-p3-candidate-v1.json");
const summary=read("data/generated/culinary-brain-c4-tapioca-bounded-p3-admission-summary-v1.json");
const candidate=artifact.recipe;
const permissive=normalizeProfile({...DEFAULT_PROFILE,maxMinutes:180,skill:4,budget:4,cuisinePreferences:[],priorityPacks:[],allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[]});

test("P3 contract is fail-closed and keeps activation authority off",()=>{
  assert.deepEqual(validateP3Contract(contract),[]);
  assert.equal(contract.authority.runtimeActivationAuthorized,false);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized,false);
  assert.equal(contract.authority.automaticRecommendationAdmissionAuthorized,false);
  assert.equal(contract.authority.barbecueMutationAuthorized,false);
  assert.equal(summary.terminal,"CULINARY_BRAIN_C4_TAPIOCA_BOUNDED_P3_CONTRACT_PASS__PREACTIVATION_READY");
  assert.equal(summary.ownerActivationAuthorizationRequired,true);
});
test("candidate artifact preserves the frozen preactivation snapshot after the separately authorized activation",()=>{
  assert.equal(summary.runtimeBoundary.publicRuntimeRecipeCount,85);
  assert.equal(summary.runtimeBoundary.candidatePresentInPublicRuntime,false);
  assert.equal(summary.runtimeBoundary.runtimeActivationAuthorized,false);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length,86);
  assert.equal(PUBLIC_RUNTIME_RECIPES.some(recipe=>recipe.id===candidate.id),true);
  assert.equal(candidate.id,"unitools_pao_de_queijo");
  assert.equal(candidate.governance.candidateSemanticsOnly,true);
  assert.equal(candidate.governance.runtimeActivationAuthorized,false);
  assert.equal(ingredientById("tapioca_starch")?.id,"tapioca_starch");
  assert.deepEqual(candidate.ingredients.map(item=>item.canonicalIngredientId),["tapioca_starch","milk","water","neutral_oil","eggs","parmesan","mozzarella","salt"]);
});
test("candidate is eligible only for reviewed breakfast and snack",()=>{
  for(const mealType of ["breakfast","snack"]) assert.deepEqual(rankRecipes([candidate],permissive,{mealType}).eligible.map(item=>item.recipe.id),[candidate.id]);
  for(const mealType of ["lunch","dinner"]) assert.match(rankRecipes([candidate],permissive,{mealType}).rejected[0].hardReasons.join(" | "),new RegExp("not tagged for "+mealType));
  const plan=planSlots([candidate],permissive,[{id:"p3-breakfast",order:1,day:"P3",mealType:"breakfast"}]);
  assert.equal(plan.complete,true); assert.equal(plan.items[0].recipe.id,candidate.id);
});
test("candidate hard safety filters fail closed",()=>{
  for(const allergen of ["egg","milk"]){const p=normalizeProfile({...permissive,allergens:[allergen]});assert.match(rankRecipes([candidate],p,{mealType:"breakfast"}).rejected[0].hardReasons.join(" | "),new RegExp("declared allergen: "+allergen));}
  for(const dietaryMode of ["vegetarian","vegan"]){const p=normalizeProfile({...permissive,dietaryMode});assert.match(rankRecipes([candidate],p,{mealType:"breakfast"}).rejected[0].hardReasons.join(" | "),new RegExp("not "+dietaryMode));}
  assert.match(rankRecipes([candidate],normalizeProfile({...permissive,excludedIngredientIds:["tapioca_starch"]}),{mealType:"breakfast"}).rejected[0].hardReasons.join(" | "),/contains excluded ingredient: tapioca_starch/);
  assert.match(rankRecipes([candidate],normalizeProfile({...permissive,unavailableIngredientIds:["tapioca_starch"]}),{mealType:"breakfast"}).rejected[0].hardReasons.join(" | "),/unavailable without supported substitute: tapioca_starch/);
  assert.match(rankRecipes([candidate],normalizeProfile({...permissive,maxMinutes:45}),{mealType:"breakfast"}).rejected[0].hardReasons.join(" | "),/over 45-minute limit/);
  assert.match(rankRecipes([candidate],normalizeProfile({...permissive,skill:2}),{mealType:"breakfast"}).rejected[0].hardReasons.join(" | "),/above selected cooking skill/);
});
test("candidate search and portable V2 semantics work without admission",()=>{
  const universe=Object.freeze([candidate]);
  const result=searchRecipesByIngredients(universe,permissive,{mainIngredientId:"tapioca_starch",mealType:"breakfast",maxMinutes:180,skill:4});
  assert.ok(result.eligible.some(item=>item.recipe.id===candidate.id));
  const v2=createRecipeSourceV2([candidate]).list();
  assert.deepEqual(v2,[candidate]);
  assert.deepEqual(rankRecipes(v2,permissive,{mealType:"breakfast"}),rankRecipes([candidate],permissive,{mealType:"breakfast"}));
});
test("candidate preserves attribution and nutrition firewall",()=>{
  assert.equal(candidate.provenance.license,"CC-BY-SA-4.0");
  assert.match(candidate.provenance.attribution,/UniTools/);
  assert.equal(candidate.nutrition.estimationState,"EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED");
  assert.equal(candidate.nutrition.perServing.energyKcal,null);
  assert.equal(candidate.governance.sourceNutritionIgnoredForAuthority,true);
  assert.deepEqual(candidate.dietaryTags,["unrestricted"]);
  assert.deepEqual(candidate.allergySafety.declaredAllergens,["egg","milk"]);
});
