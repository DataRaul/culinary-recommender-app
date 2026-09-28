import { chromium } from "playwright";
const baseUrl=process.env.APP_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[]; page.on("pageerror",e=>errors.push(e.message));
await page.goto(baseUrl,{waitUntil:"networkidle"});
await page.getByRole("heading",{name:"What should you cook?"}).waitFor();
const status=(await page.locator("#statusPill").textContent())?.trim();
if(status!=="85 recipes · 76 curated + 9 open external · deterministic") throw new Error("P3 preactivation public-runtime drift: "+status);
const result=await page.evaluate(async()=>{
  const [corpus,profileModule,recommendation,planner,search,catalog]=await Promise.all([
    import("/src/data/corpus-v1.js"),import("/src/domain/profile.js"),import("/src/domain/recommendation.js"),import("/src/domain/planner.js"),import("/src/domain/search.js"),import("/src/domain/catalog.js")
  ]);
  const artifact=await fetch("/data/generated/culinary-brain-c4-tapioca-p3-candidate-v1.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("P3 candidate fetch failed: "+r.status);return r.json();});
  const candidate=artifact.recipe;
  const profile=profileModule.normalizeProfile({...profileModule.DEFAULT_PROFILE,maxMinutes:180,skill:4,budget:4,cuisinePreferences:[],priorityPacks:[],allergens:[],excludedIngredientIds:[],unavailableIngredientIds:[]});
  const rank=mealType=>recommendation.rankRecipes([candidate],profile,{mealType});
  const plan=planner.planSlots([candidate],profile,[{id:"p3-browser-breakfast",order:1,day:"P3",mealType:"breakfast"}]);
  const searchResult=search.searchRecipesByIngredients([...corpus.PUBLIC_RUNTIME_RECIPES,candidate],profile,{mainIngredientId:"tapioca_starch",mealType:"breakfast",maxMinutes:180,skill:4});
  const reasons=(patch)=>recommendation.rankRecipes([candidate],profileModule.normalizeProfile({...profile,...patch}),{mealType:"breakfast"}).rejected[0]?.hardReasons||[];
  const v2=catalog.createRecipeSourceV2([candidate]).list();
  return {
    publicCount:corpus.PUBLIC_RUNTIME_RECIPES.length,candidateInPublic:corpus.PUBLIC_RUNTIME_RECIPES.some(r=>r.id===candidate.id),runtimeActivationAuthorized:candidate.governance.runtimeActivationAuthorized,
    breakfastIds:rank("breakfast").eligible.map(x=>x.recipe.id),snackIds:rank("snack").eligible.map(x=>x.recipe.id),dinnerReasons:rank("dinner").rejected[0]?.hardReasons||[],
    planIds:plan.items.map(x=>x.recipe.id),searchVisible:searchResult.eligible.some(x=>x.recipe.id===candidate.id),
    eggReasons:reasons({allergens:["egg"]}),milkReasons:reasons({allergens:["milk"]}),vegetarianReasons:reasons({dietaryMode:"vegetarian"}),
    excludedReasons:reasons({excludedIngredientIds:["tapioca_starch"]}),unavailableReasons:reasons({unavailableIngredientIds:["tapioca_starch"]}),
    v2Exact:JSON.stringify(v2)===JSON.stringify([candidate])
  };
});
if(result.publicCount!==85||result.candidateInPublic) throw new Error("P3 candidate leaked into public runtime");
if(result.runtimeActivationAuthorized!==false) throw new Error("P3 candidate activation authority changed");
if(result.breakfastIds.join(",")!=="unitools_pao_de_queijo"||result.snackIds.join(",")!=="unitools_pao_de_queijo") throw new Error("P3 reviewed meal roles failed");
if(!result.dinnerReasons.includes("not tagged for dinner")) throw new Error("P3 dinner gate failed");
if(result.planIds.join(",")!=="unitools_pao_de_queijo"||!result.searchVisible) throw new Error("P3 planner/search simulation failed");
if(!result.eggReasons.includes("declared allergen: egg")||!result.milkReasons.includes("declared allergen: milk")) throw new Error("P3 allergen gate failed");
if(!result.vegetarianReasons.includes("not vegetarian")) throw new Error("P3 dietary gate failed");
if(!result.excludedReasons.includes("contains excluded ingredient: tapioca_starch")) throw new Error("P3 exclusion gate failed");
if(!result.unavailableReasons.includes("unavailable without supported substitute: tapioca_starch")) throw new Error("P3 availability gate failed");
if(!result.v2Exact) throw new Error("P3 V2 roundtrip failed");
if(errors.length) throw new Error("P3 browser page errors: "+errors.join(" | "));
await browser.close();
console.log("P3 tapioca preactivation browser acceptance passed.");
