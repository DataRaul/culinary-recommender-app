import { chromium } from "playwright";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "What should you cook?" }).waitFor();

const status = (await page.locator("#statusPill").textContent())?.trim();
if (status !== "86 recipes · 76 curated + 10 open external · deterministic") {
  throw new Error("P3 activation public-runtime status drift: " + status);
}

const result = await page.evaluate(async () => {
  const [corpus, ingredients, profileModule, recommendation, planner, search, catalog, attribution] = await Promise.all([
    import("/src/data/corpus-v1.js"),
    import("/src/data/ingredients.js"),
    import("/src/domain/profile.js"),
    import("/src/domain/recommendation.js"),
    import("/src/domain/planner.js"),
    import("/src/domain/search.js"),
    import("/src/domain/catalog.js"),
    import("/src/domain/public-attribution.js")
  ]);
  const candidate = corpus.PUBLIC_RUNTIME_RECIPES.find(recipe => recipe.id === "unitools_pao_de_queijo");
  if (!candidate) throw new Error("P3 activated candidate missing");
  const profile = profileModule.normalizeProfile({
    ...profileModule.DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    priorityPacks: [],
    allergens: [],
    excludedIngredientIds: [],
    unavailableIngredientIds: []
  });
  const rank = mealType => recommendation.rankRecipes([candidate], profile, { mealType });
  const reasons = patch => recommendation.rankRecipes(
    [candidate],
    profileModule.normalizeProfile({ ...profile, ...patch }),
    { mealType: "breakfast" }
  ).rejected[0]?.hardReasons || [];
  const plan = planner.planSlots([candidate], profile, [{ id: "p3-live-browser", order: 1, day: "P3", mealType: "breakfast" }]);
  const searchResult = search.searchRecipesByIngredients(corpus.PUBLIC_RUNTIME_RECIPES, profile, {
    mainIngredientId: "tapioca_starch",
    mealType: "breakfast",
    maxMinutes: 180,
    skill: 4
  });
  const v2 = catalog.createRecipeSourceV2(corpus.PUBLIC_RUNTIME_RECIPES).list();
  return {
    publicCount: corpus.PUBLIC_RUNTIME_RECIPES.length,
    publicExternalCount: corpus.PUBLIC_EXTERNAL_RECIPES.length,
    p3ActivatedCount: corpus.P3_ACTIVATED_EXTERNAL_RECIPES.length,
    runtimeActivationAuthorized: candidate.governance.runtimeActivationAuthorized,
    candidateSemanticsOnly: candidate.governance.candidateSemanticsOnly,
    tapiocaExact: ingredients.normalizeIngredient("tapioca starch"),
    tapiocaGeneric: ingredients.normalizeIngredient("tapioca"),
    breakfastIds: rank("breakfast").eligible.map(item => item.recipe.id),
    snackIds: rank("snack").eligible.map(item => item.recipe.id),
    lunchReasons: rank("lunch").rejected[0]?.hardReasons || [],
    dinnerReasons: rank("dinner").rejected[0]?.hardReasons || [],
    planIds: plan.items.map(item => item.recipe.id),
    searchVisible: searchResult.eligible.some(item => item.recipe.id === candidate.id),
    eggReasons: reasons({ allergens: ["egg"] }),
    milkReasons: reasons({ allergens: ["milk"] }),
    vegetarianReasons: reasons({ dietaryMode: "vegetarian" }),
    excludedReasons: reasons({ excludedIngredientIds: ["tapioca_starch"] }),
    unavailableReasons: reasons({ unavailableIngredientIds: ["tapioca_starch"] }),
    attributionAllowed: attribution.inspectExternalRecipeProvenance(candidate.provenance).allowed,
    nutritionUnknown: Object.values(candidate.nutrition.perServing).every(value => value === null),
    v2Exact: JSON.stringify(v2) === JSON.stringify(corpus.PUBLIC_RUNTIME_RECIPES)
  };
});

if (result.publicCount !== 86 || result.publicExternalCount !== 10 || result.p3ActivatedCount !== 1) throw new Error("P3 activation runtime counts failed");
if (result.runtimeActivationAuthorized !== true || result.candidateSemanticsOnly !== false) throw new Error("P3 activation authority failed");
if (result.tapiocaExact !== "tapioca_starch" || result.tapiocaGeneric !== null) throw new Error("P3 exact tapioca identity boundary failed");
if (result.breakfastIds.join(",") !== "unitools_pao_de_queijo" || result.snackIds.join(",") !== "unitools_pao_de_queijo") throw new Error("P3 reviewed meal roles failed");
if (!result.lunchReasons.includes("not tagged for lunch") || !result.dinnerReasons.includes("not tagged for dinner")) throw new Error("P3 non-reviewed meal fail-closed gate failed");
if (result.planIds.join(",") !== "unitools_pao_de_queijo" || !result.searchVisible) throw new Error("P3 planner/search runtime activation failed");
if (!result.eggReasons.includes("declared allergen: egg") || !result.milkReasons.includes("declared allergen: milk")) throw new Error("P3 allergen gate failed");
if (!result.vegetarianReasons.includes("not vegetarian")) throw new Error("P3 dietary gate failed");
if (!result.excludedReasons.includes("contains excluded ingredient: tapioca_starch")) throw new Error("P3 exclusion gate failed");
if (!result.unavailableReasons.includes("unavailable without supported substitute: tapioca_starch")) throw new Error("P3 availability gate failed");
if (!result.attributionAllowed || !result.nutritionUnknown || !result.v2Exact) throw new Error("P3 attribution/nutrition/V2 parity failed");

await page.locator('button[data-view="search"]').click();
await page.locator("#searchMainIngredient").fill("tapioca starch");
await page.locator("#searchProfileMode").selectOption("ingredients");
await page.locator("#searchTime").selectOption("180");
await page.locator("#searchSkill").selectOption("4");
await page.locator("#ingredientSearchForm").getByRole("button", { name: /Find dishes/ }).click();
await page.getByRole("heading", { name: "Pão de queijo" }).waitFor();

const searchText = await page.locator("#searchResults").textContent();
for (const required of ["open external recipe", "nutrition evidence pending", "UniTools", "CC BY-SA 4.0"]) {
  if (!searchText?.includes(required)) throw new Error("P3 public Search presentation missing: " + required);
}
if (errors.length) throw new Error("P3 browser page errors: " + errors.join(" | "));

await browser.close();
console.log("P3 tapioca bounded activation browser acceptance passed.");
