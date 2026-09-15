import { chromium } from "playwright";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "What should you cook?" }).waitFor();
const status = (await page.locator("#statusPill").textContent())?.trim();
if (status !== "85 recipes · 76 curated + 9 open external · deterministic") {
  throw new Error(`Step 8F activation browser check detected public-runtime drift: ${status}`);
}

const result = await page.evaluate(async () => {
  const [legacy, corpus, profileModule, recommendation, planner, search, catalog] = await Promise.all([
    import("/src/data/recipes.js"),
    import("/src/data/corpus-v1.js"),
    import("/src/domain/profile.js"),
    import("/src/domain/recommendation.js"),
    import("/src/domain/planner.js"),
    import("/src/domain/search.js"),
    import("/src/domain/catalog.js")
  ]);
  const frozen = await fetch("/data/generated/step8e/eligible-subset.json", { cache: "no-store" }).then(response => {
    if (!response.ok) throw new Error(`eligible subset fetch failed: ${response.status}`);
    return response.json();
  });
  const candidate = legacy.RECIPES.find(recipe => recipe.id === "unitools_tortilla_espanola");
  if (!candidate) throw new Error("activated Step 8F candidate missing from live RECIPES runtime");

  const profile = profileModule.normalizeProfile({
    ...profileModule.DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: ["Spanish"],
    priorityPacks: [],
    allergens: [],
    excludedIngredientIds: [],
    unavailableIngredientIds: []
  });
  const rank = recommendation.rankRecipes([candidate], profile, { mealType: "dinner" });
  const plan = planner.planSlots([candidate], profile, [{ id: "browser-step8f", order: 1, day: "Decision", mealType: "dinner" }]);
  const searchResult = search.searchRecipesByIngredients(legacy.RECIPES, profile, { mainIngredientId: "potato", maxMinutes: 180, skill: 4 });
  const eggProfile = profileModule.normalizeProfile({ ...profile, allergens: ["egg"] });
  const eggRank = recommendation.rankRecipes([candidate], eggProfile, { mealType: "dinner" });
  const explicitV2 = catalog.createRecipeSourceV2(corpus.PUBLIC_RUNTIME_RECIPES).list();
  return {
    frozenRuntimeActivationAuthorized: frozen.runtimeActivationAuthorized,
    frozenPublicRuntimeChanged: frozen.publicRuntimeChanged,
    goldenCount: corpus.ALL_RECIPES.length,
    canonicalPublicCount: corpus.PUBLIC_RUNTIME_RECIPES.length,
    liveRuntimeCount: legacy.RECIPES.length,
    publicContainsCandidate: legacy.RECIPES.some(recipe => recipe.id === candidate.id),
    candidateId: candidate.id,
    candidateRuntimeActivationAuthorized: candidate.governance?.runtimeActivationAuthorized,
    candidateEligible: rank.eligible.map(item => item.recipe.id),
    candidatePlan: plan.items.map(item => item.recipe.id),
    candidateSearchVisible: searchResult.eligible.some(item => item.recipe.id === candidate.id),
    eggHardReasons: eggRank.rejected[0]?.hardReasons || [],
    explicitV2IdsMatch: JSON.stringify(explicitV2.map(recipe => recipe.id)) === JSON.stringify(corpus.PUBLIC_RUNTIME_RECIPES.map(recipe => recipe.id)),
    explicitV2RankIdsMatch: JSON.stringify(recommendation.rankRecipes(explicitV2, profile, { mealType: "dinner" }).eligible.map(item => item.recipe.id)) === JSON.stringify(recommendation.rankRecipes(corpus.PUBLIC_RUNTIME_RECIPES, profile, { mealType: "dinner" }).eligible.map(item => item.recipe.id))
  };
});

if (result.frozenRuntimeActivationAuthorized !== false || result.frozenPublicRuntimeChanged !== false) throw new Error("Step 8E frozen evidence was mutated during activation");
if (result.goldenCount !== 84) throw new Error(`Historical golden corpus drifted: ${result.goldenCount}`);
if (result.canonicalPublicCount !== 85 || result.liveRuntimeCount !== 85 || !result.publicContainsCandidate) throw new Error("Step 8F candidate is not active in the 85-record public runtime");
if (result.candidateId !== "unitools_tortilla_espanola") throw new Error(`Unexpected Step 8F candidate: ${result.candidateId}`);
if (result.candidateRuntimeActivationAuthorized !== true) throw new Error("Activated Step 8F record lacks explicit runtime authority");
if (result.candidateEligible.join(",") !== "unitools_tortilla_espanola") throw new Error("Step 8F candidate did not pass browser ranking semantics");
if (result.candidatePlan.join(",") !== "unitools_tortilla_espanola") throw new Error("Step 8F candidate did not pass browser planner semantics");
if (!result.candidateSearchVisible) throw new Error("Step 8F candidate did not pass browser search semantics");
if (!result.eggHardReasons.includes("declared allergen: egg")) throw new Error("Step 8F browser hard-allergen check failed");
if (!result.explicitV2IdsMatch || !result.explicitV2RankIdsMatch) throw new Error("Step 8F explicit 85-record V1/direct versus V2 parity failed");
if (errors.length) throw new Error(`Step 8F browser page errors: ${errors.join(" | ")}`);

await browser.close();
console.log("Step 8F activated public-runtime browser acceptance passed.");
