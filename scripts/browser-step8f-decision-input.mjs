import { chromium } from "playwright";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "What should you cook?" }).waitFor();
const status = (await page.locator("#statusPill").textContent())?.trim();
if (status !== "84 recipes · 76 curated + 8 open external · deterministic") {
  throw new Error(`Step 8F preactivation browser check detected public-runtime drift: ${status}`);
}

const result = await page.evaluate(async () => {
  const [corpus, profileModule, recommendation, planner, search, catalog] = await Promise.all([
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
  const rawCandidate = frozen.recipes[0];
  const candidate = {
    ...rawCandidate,
    mainProtein: rawCandidate.mainProtein ?? null,
    discovery: { flavourProfile: [], ...(rawCandidate.discovery || {}) }
  };
  const universe = [...corpus.ALL_RECIPES, candidate];
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
  const searchResult = search.searchRecipesByIngredients(universe, profile, { mainIngredientId: "potato", maxMinutes: 180, skill: 4 });
  const eggProfile = profileModule.normalizeProfile({ ...profile, allergens: ["egg"] });
  const eggRank = recommendation.rankRecipes([candidate], eggProfile, { mealType: "dinner" });
  const v2Rows = catalog.createRecipeSourceV2(universe).list();
  const v2Rank = recommendation.rankRecipes(v2Rows, profile, { mealType: "dinner" });
  const directRank = recommendation.rankRecipes(universe, profile, { mealType: "dinner" });
  return {
    frozenRuntimeActivationAuthorized: frozen.runtimeActivationAuthorized,
    frozenPublicRuntimeChanged: frozen.publicRuntimeChanged,
    publicCount: corpus.ALL_RECIPES.length,
    publicContainsCandidate: corpus.ALL_RECIPES.some(recipe => recipe.id === candidate.id),
    candidateId: candidate.id,
    candidateEligible: rank.eligible.map(item => item.recipe.id),
    candidatePlan: plan.items.map(item => item.recipe.id),
    candidateSearchVisible: searchResult.eligible.some(item => item.recipe.id === candidate.id),
    eggHardReasons: eggRank.rejected[0]?.hardReasons || [],
    v1v2IdsMatch: JSON.stringify(v2Rows.map(recipe => recipe.id)) === JSON.stringify(universe.map(recipe => recipe.id)),
    v1v2RankIdsMatch: JSON.stringify(v2Rank.eligible.map(item => item.recipe.id)) === JSON.stringify(directRank.eligible.map(item => item.recipe.id))
  };
});

if (result.frozenRuntimeActivationAuthorized !== false || result.frozenPublicRuntimeChanged !== false) throw new Error("Step 8F fixture carries activation authority");
if (result.publicCount !== 84 || result.publicContainsCandidate) throw new Error("Step 8F candidate leaked into current public corpus");
if (result.candidateId !== "unitools_tortilla_espanola") throw new Error(`Unexpected Step 8F candidate: ${result.candidateId}`);
if (result.candidateEligible.join(",") !== "unitools_tortilla_espanola") throw new Error("Step 8F candidate did not pass browser ranking semantics");
if (result.candidatePlan.join(",") !== "unitools_tortilla_espanola") throw new Error("Step 8F candidate did not pass browser planner semantics");
if (!result.candidateSearchVisible) throw new Error("Step 8F candidate did not pass browser search semantics");
if (!result.eggHardReasons.includes("declared allergen: egg")) throw new Error("Step 8F browser hard-allergen check failed");
if (!result.v1v2IdsMatch || !result.v1v2RankIdsMatch) throw new Error("Step 8F browser V1/V2 candidate parity failed");
if (errors.length) throw new Error(`Step 8F browser page errors: ${errors.join(" | ")}`);

await browser.close();
console.log("Step 8F preactivation browser decision-input acceptance passed.");
