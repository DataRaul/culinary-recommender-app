import { chromium } from "playwright";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });

async function mobileAcceptance() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "What should you cook?" }).waitFor();
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (mobileOverflow) throw new Error("Mobile layout has unexpected horizontal overflow");

  // Composable priority packs: default Healthy Convenience + lunch Meal Prep + dinner Culinary Explorer.
  const mealPrep = page.locator(".priority-pack-card").filter({ hasText: "Meal Prep" });
  const explorer = page.locator(".priority-pack-card").filter({ hasText: "Culinary Explorer" });
  const weeknight = page.locator(".priority-pack-card").filter({ hasText: "Weeknight Fast" });
  await mealPrep.getByRole("checkbox").check();
  await mealPrep.locator("select").selectOption("lunch");
  await explorer.getByRole("checkbox").check();
  await explorer.locator("select").selectOption("dinner");
  await weeknight.getByRole("checkbox").click();
  if (await weeknight.getByRole("checkbox").isChecked()) throw new Error("Fourth priority pack should be rejected");
  await page.getByText("3 of 3 selected.").waitFor();

  // Cuisine preferences are independent and multi-select. The inputs are visually styled inside label chips,
  // so force the underlying checkbox action while still asserting the persisted DOM state afterward.
  await page.getByRole("checkbox", { name: "Indian" }).check({ force: true });
  await page.getByRole("checkbox", { name: "Thai / Southeast Asian" }).check({ force: true });
  if (!(await page.getByRole("checkbox", { name: "Indian" }).isChecked())) throw new Error("Indian cuisine preference did not persist in UI");
  if (!(await page.getByRole("checkbox", { name: "Thai / Southeast Asian" }).isChecked())) throw new Error("Southeast Asian cuisine preference did not persist in UI");
  await page.getByRole("checkbox", { name: "Local / Canarian" }).waitFor();

  // Exact-slot planning: trigger the same checkbox change events while avoiding sticky-nav pointer geometry.
  await page.locator('input[name="slot"]').evaluateAll(inputs => {
    for (const input of inputs) {
      const shouldBeChecked = input.value === "mon-lunch" || input.value === "wed-dinner";
      if (input.checked !== shouldBeChecked) input.click();
    }
  });
  await page.getByText("2 selected").waitFor();
  const selectedSlotIds = await page.locator('input[name="slot"]:checked').evaluateAll(inputs => inputs.map(input => input.value));
  if (selectedSlotIds.join("|") !== "mon-lunch|wed-dinner") throw new Error(`Unexpected selected slots: ${selectedSlotIds.join(",")}`);
  await page.getByRole("button", { name: /Build my plan/ }).click();
  await page.getByRole("heading", { name: /2 meals, built as a portfolio/ }).waitFor();
  if (await page.locator(".recipe-card").count() !== 2) throw new Error("Exact-slot plan did not contain exactly two recipes");

  // One-dish swap preserves plan size and replaces the selected card where alternatives exist.
  const beforeTitles = await page.locator(".recipe-card h3").allTextContents();
  await page.locator(".swap-button").first().click();
  if (await page.locator(".recipe-card").count() !== 2) throw new Error("Swap changed plan size");
  const afterTitles = await page.locator(".recipe-card h3").allTextContents();
  if (beforeTitles.join("|") === afterTitles.join("|")) throw new Error("Swap did not change any recipe");

  // Grocery aggregation.
  await page.getByRole("button", { name: "Groceries" }).click();
  await page.getByRole("heading", { name: /One list, normalized where practical/ }).waitFor();
  if (await page.locator(".grocery-list li").count() < 1) throw new Error("Grocery list is empty for a non-empty plan");

  // Pantry/current inventory, temporary unavailability, substitution, and permanent exclusions.
  await page.getByRole("button", { name: "Pantry" }).click();
  await page.getByRole("heading", { name: /Pantry & cannot-find list/ }).waitFor();
  await page.getByLabel("Add an ingredient").first().fill("chickpeas");
  await page.locator("#currentPantryForm").getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: /chickpeas ×/ }).waitFor();

  await page.locator("#unavailableInput").fill("tahini");
  await page.locator("#unavailableForm").getByRole("button", { name: "Remember" }).click();
  await page.getByRole("heading", { name: "Can't get right now" }).waitFor();
  await page.getByRole("button", { name: /tahini ×/ }).waitFor();

  await page.locator("#substitutionInput").fill("feta");
  await page.locator("#substitutionForm").getByRole("button", { name: "Check" }).click();
  if (!(await page.locator("#substitutionResult").innerText()).trim()) throw new Error("Substitution checker returned no user-visible result");

  await page.locator("#permanentExclusionInput").fill("coconut");
  await page.locator("#permanentExclusionForm").getByRole("button", { name: "Exclude" }).click();
  await page.getByRole("heading", { name: /Pantry & cannot-find list/ }).waitFor();
  await page.locator("#permanentExclusionPanel").getByRole("button", { name: /coconut · all forms ×/ }).waitFor();

  await page.locator("#permanentExclusionInput").fill("pineapple");
  await page.locator("#permanentExclusionForm").getByRole("button", { name: "Exclude" }).click();
  await page.getByRole("heading", { name: /Pantry & cannot-find list/ }).waitFor();
  await page.locator("#permanentExclusionPanel").getByRole("button", { name: /pineapple ×/ }).waitFor();

  const persisted = JSON.parse(await page.evaluate(() => localStorage.getItem("culinary-recommender.state.v1")));
  if (!persisted.profile.excludedIngredientIds.includes("coconut")) throw new Error("Coconut family exclusion did not persist");
  if (!persisted.profile.excludedIngredientIds.includes("pineapple")) throw new Error("Future pineapple exclusion did not persist");
  if (!persisted.profile.unavailableIngredientIds.includes("tahini")) throw new Error("Temporary unavailability did not remain separate");

  // Search honors permanent family exclusion: current tempeh recipe contains coconut milk.
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("heading", { name: "Cook what you already have" }).waitFor();
  await page.getByLabel(/Main ingredient/).fill("tempeh");
  await page.getByLabel("Recommendation lens").selectOption("ingredients");
  await page.getByLabel("Time today").selectOption("60");
  await page.getByLabel("Effort / skill today").selectOption("4");
  await page.getByRole("button", { name: /Find dishes/ }).click();
  const tempehText = await page.locator("#searchResults").innerText();
  if (tempehText.includes("Tempeh, Broccoli & Coconut Curry")) throw new Error("Permanently excluded coconut leaked into search");
  if (!tempehText.includes("excluded ingredient")) throw new Error("Permanent exclusion shortfall was not explained");

  // Salmon + rice and require-all behavior.
  await page.getByLabel(/Main ingredient/).fill("salmon");
  await page.getByLabel(/Other ingredients/).fill("rice");
  await page.getByRole("button", { name: /Find dishes/ }).click();
  const firstSearchTitle = await page.locator(".search-result-card h3").first().innerText();
  if (!/salmon/i.test(firstSearchTitle)) throw new Error("Salmon search did not return a salmon recipe first");
  await page.getByLabel("Require all listed secondary ingredients").check({ force: true });
  await page.getByRole("button", { name: /Find dishes/ }).click();
  const requireAllCards = await page.locator(".search-result-card").count();
  if (requireAllCards < 1) throw new Error("Require-all salmon + rice unexpectedly produced no result");
  const requireAllText = await page.locator(".search-result-card").allTextContents();
  if (!requireAllText.every(text => /rice/i.test(text))) throw new Error("Require-all results did not all use rice");

  // User-facing allergen configuration: save fish as a hard safety filter, then prove salmon is blocked.
  await page.getByRole("button", { name: "Profile" }).click();
  await page.getByRole("heading", { name: "Profile & privacy" }).waitFor();
  await page.locator('#allergenSafetyPanel [data-allergen="fish"]').check({ force: true });
  await page.locator("#saveAllergens").click();
  await page.getByRole("heading", { name: "Profile & privacy" }).waitFor();
  await page.locator("#allergenSafetyPanel").waitFor();
  const allergyState = JSON.parse(await page.evaluate(() => localStorage.getItem("culinary-recommender.state.v1")));
  if (!allergyState.profile.allergens.includes("fish")) throw new Error("Fish allergen filter did not persist");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByLabel(/Main ingredient/).fill("salmon");
  await page.getByLabel("Recommendation lens").selectOption("ingredients");
  await page.getByLabel("Time today").selectOption("60");
  await page.getByLabel("Effort / skill today").selectOption("4");
  await page.getByRole("button", { name: /Find dishes/ }).click();
  const allergySearchText = await page.locator("#searchResults").innerText();
  if (!allergySearchText.includes("declared allergen: fish")) throw new Error("User-facing fish allergen did not block salmon search");

  // Profile export/import round trip in-browser.
  await page.getByRole("button", { name: "Profile" }).click();
  await page.getByRole("heading", { name: "Profile & privacy" }).waitFor();
  const backupText = await page.evaluate(() => localStorage.getItem("culinary-recommender.state.v1"));
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith(".json")) throw new Error("Profile export did not produce JSON");
  await page.getByLabel("Dietary mode").selectOption("vegan");
  const changed = JSON.parse(await page.evaluate(() => localStorage.getItem("culinary-recommender.state.v1")));
  if (changed.profile.dietaryMode !== "vegan") throw new Error("Profile change did not persist before import test");
  await page.locator("#importProfile").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(backupText) });
  await page.getByText("Backup imported.").waitFor();
  const restored = JSON.parse(await page.evaluate(() => localStorage.getItem("culinary-recommender.state.v1")));
  if (restored.profile.dietaryMode === "vegan") throw new Error("Profile import did not restore prior dietary mode");

  // D5 P0 adapter: explicit local file selection -> minimized preview -> explicit save.
  const workoutBackup = {
    schemaVersion: 3,
    profile: {
      name: "Must never cross",
      goal: "hypertrophy",
      level: "intermediate",
      daysPerWeek: 3,
      sessionMinutes: 60,
      constraints: ["back_pain"],
      equipment: ["barbell"],
      favorites: ["private-favorite"],
      trainingWeekdays: [1,3,5]
    },
    activeProgram: { id: "private-program", weight: 100, reps: 8, rir: 2 },
    activeSession: { id: "private-session" },
    history: [{ id: "private-history", weight: 100, reps: 8, rir: 2 }],
    preferences: { readinessCheck: { value: "private-readiness" } }
  };
  const profileBeforeFitness = JSON.stringify(restored.profile);
  await page.locator("#importWorkoutBackup").setInputFiles({
    name: "workout-recommender-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(workoutBackup))
  });
  await page.getByText("Preview — not saved").waitFor();
  const previewText = await page.locator("#fitnessPreview").innerText();
  for (const forbidden of ["Must never cross","back_pain","barbell","private-program","private-session","private-history","private-readiness","100"]) {
    if (previewText.includes(forbidden)) throw new Error(`Sensitive workout field leaked into preview: ${forbidden}`);
  }
  const beforeFitnessSave = JSON.parse(await page.evaluate(() => localStorage.getItem("culinary-recommender.state.v1")));
  if (beforeFitnessSave.fitnessContext) throw new Error("Fitness context persisted before explicit save");
  await page.locator("#saveFitnessContext").click();
  await page.getByText("Stored local fitness context · inactive").waitFor();
  const afterFitnessSave = JSON.parse(await page.evaluate(() => localStorage.getItem("culinary-recommender.state.v1")));
  const fitnessKeys = Object.keys(afterFitnessSave.fitnessContext || {});
  const expectedFitnessKeys = ["sourceBackupSchemaVersion","trainingGoal","plannedTrainingDaysPerWeek","plannedSessionMinutes","preferredTrainingWeekdays"];
  if (fitnessKeys.join("|") !== expectedFitnessKeys.join("|")) throw new Error(`Unexpected persisted fitness context fields: ${fitnessKeys.join(",")}`);
  const storedFitnessText = JSON.stringify(afterFitnessSave.fitnessContext);
  for (const forbidden of ["Must never cross","back_pain","barbell","private-program","private-session","private-history","private-readiness","weight","reps","rir"]) {
    if (storedFitnessText.includes(forbidden)) throw new Error(`Sensitive workout field leaked into persistence: ${forbidden}`);
  }
  if (JSON.stringify(afterFitnessSave.profile) !== profileBeforeFitness) throw new Error("Fitness adapter mutated the Culinary recommendation profile");

  if (errors.length) throw new Error(`Mobile page errors: ${errors.join(" | ")}`);
  await page.close();
}

async function desktopAcceptance() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "What should you cook?" }).waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error("Desktop layout has unexpected horizontal overflow");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("heading", { name: "Cook what you already have" }).waitFor();
  await page.getByRole("button", { name: "Profile" }).click();
  await page.getByRole("heading", { name: "Profile & privacy" }).waitFor();
  await page.locator("#allergenSafetyPanel").waitFor();

  // PWA shell should continue to load offline once the service worker has installed and controls the page.
  const hasServiceWorker = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    await navigator.serviceWorker.ready;
    return true;
  });
  if (!hasServiceWorker) throw new Error("Service worker did not become ready");
  await page.reload({ waitUntil: "networkidle" });
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  if (!controlled) throw new Error("Service worker did not control the reloaded app");
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /Profile & privacy|What should you cook\?/ }).waitFor();
  await page.context().setOffline(false);

  if (errors.length) throw new Error(`Desktop page errors: ${errors.join(" | ")}`);
  await page.close();
}


async function protectedCorpusAcceptance() {
  // First prove the page sends no protected query before the session check succeeds.
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    let protectedCalls = 0;
    await page.route("**/api/auth/session", route => route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ authenticated:false, reason:"NO_SESSION" })
    }));
    await page.route("**/api/protected-corpus/v1**", route => {
      protectedCalls += 1;
      return route.fulfill({ status:500, contentType:"application/json", body:JSON.stringify({ ok:false }) });
    });
    await page.goto(`${baseUrl}/protected-corpus.html`, { waitUntil:"networkidle" });
    await page.getByText(/Authenticated access is required/).waitFor();
    if (protectedCalls !== 0) throw new Error("Protected corpus page queried protected API before authentication");
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/auth/session", route => route.fulfill({
    status:200,
    contentType:"application/json",
    body:JSON.stringify({ authenticated:true, account:{ id:"owner", email:"owner@example.test" } })
  }));
  await page.route("**/api/protected-corpus/v1**", route => {
    const url = new URL(route.request().url());
    const action = url.searchParams.get("action") || "status";
    const common = { ok:true, step:"PROTECTED-CORPUS-P1", protectedDataReturned:false, publicRuntimeChanged:false, recommendationAdmissionChanged:false, fullCorpusScans:0, metrics:{ d1Subqueries:2, targetMaxD1Subqueries:8, hardMaxD1Subqueries:16, withinTarget:true, withinHardLimit:true } };
    if (action === "status") return route.fulfill({
      status:200, contentType:"application/json",
      body:JSON.stringify({ ...common, pass:true, ready:true, activeVersion:"v8018", indexedRecipeCount:19268, ftsRecipeCount:19268, structuralPartialCount:3, lastIndexedRecipeId:"zz-last", expectedRecipeCount:19268 })
    });
    if (action === "browse") return route.fulfill({
      status:200, contentType:"application/json",
      body:JSON.stringify({ ...common, protectedDataReturned:true, pass:true, items:[
        { recipeId:"recipe-a", title:"Alpha Soup", sourceCohortId:"SOURCE_A", sourceWork:"Historic Cookery", sourceAuthor:"Author A", sourceYear:"1901", structuralState:"PARSEABLE" },
        { recipeId:"recipe-b", title:"Beta Tart", sourceCohortId:"SOURCE_B", sourceWork:"Cookery Book", sourceAuthor:"Author B", sourceYear:"1888", structuralState:"PARTIAL" }
      ], nextCursor:null })
    });
    if (action === "search") {
      const isCarbonara = url.searchParams.get("q") === "carbonara";
      return route.fulfill({
        status:200, contentType:"application/json",
        body:JSON.stringify({ ...common, protectedDataReturned:true, pass:true, items:isCarbonara ? [
          { recipeId:"unitools:spaghetti-carbonara", title:"Spaghetti Carbonara", sourceCohortId:"unitools-world-recipes-v1_1_0", sourceWork:"UniTools", sourceAuthor:null, sourceYear:null, structuralState:"PARSEABLE" }
        ] : [
          { recipeId:"recipe-a", title:"Alpha Soup", sourceCohortId:"SOURCE_A", sourceWork:"Historic Cookery", sourceAuthor:"Author A", sourceYear:"1901", structuralState:"PARSEABLE" }
        ], nextCursor:null })
      });
    }
    if (action === "detail") {
      const recipeId = url.searchParams.get("recipeId");
      const item = recipeId === "unitools:risotto-alla-milanese"
        ? { recipeId, shardNumber:0, title:"Risotto alla Milanese", sourceCohortId:"unitools-world-recipes-v1_1_0", sourceWork:"UniTools", sourceUrl:"https://example.test/risotto", structuralState:"PARSEABLE", ingredients:["1 cup ingredient"], directions:["Cook carefully."], authority:{ protectedBrowseOnly:true, recommendationEligible:false, publicRuntimeActivated:false, nutritionAuthorityGranted:false, dietaryAllergenAuthorityGranted:false } }
        : recipeId === "unitools:spaghetti-carbonara"
          ? { recipeId, shardNumber:1, title:"Spaghetti Carbonara", sourceCohortId:"unitools-world-recipes-v1_1_0", sourceWork:"UniTools", sourceUrl:"https://example.test/carbonara", structuralState:"PARSEABLE", ingredients:["1 cup ingredient"], directions:["Cook carefully."], authority:{ protectedBrowseOnly:true, recommendationEligible:false, publicRuntimeActivated:false, nutritionAuthorityGranted:false, dietaryAllergenAuthorityGranted:false } }
          : { recipeId:"recipe-a", shardNumber:0, title:"Alpha Soup", sourceCohortId:"SOURCE_A", sourceWork:"Historic Cookery", sourceAuthor:"Author A", sourceYear:"1901", sourceUrl:"https://example.test/source", structuralState:"PARSEABLE", ingredients:["1 cup ingredient"], directions:["Cook carefully."], authority:{ protectedBrowseOnly:true, recommendationEligible:false, publicRuntimeActivated:false, nutritionAuthorityGranted:false, dietaryAllergenAuthorityGranted:false } };
      return route.fulfill({
        status:200, contentType:"application/json",
        body:JSON.stringify({ ...common, protectedDataReturned:true, pass:true, item })
      });
    }
    return route.fulfill({ status:400, contentType:"application/json", body:JSON.stringify({ ...common, ok:false, error:"UNKNOWN_ACTION" }) });
  });

  await page.goto(`${baseUrl}/protected-corpus.html`, { waitUntil:"networkidle" });
  await page.getByRole("heading", { name:"Protected recipe corpus" }).waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error("Protected corpus mobile layout has unexpected horizontal overflow");
  await page.getByText(/19,268 \/ 19,268 recipes indexed/).waitFor();
  if (await page.locator(".recipe").count() !== 2) throw new Error("Protected browse did not render bounded results");

  await page.getByLabel("Search protected recipes").fill("soup");
  await page.getByRole("button", { name:"Search" }).click();
  await page.getByText(/1 result\(s\) in this page for/).waitFor();
  await page.getByText("Alpha Soup").waitFor();
  if (await page.locator(".recipe").count() !== 1) throw new Error("Protected search did not replace browse results");

  await page.getByText("Alpha Soup").click();
  await page.getByRole("heading", { name:"Alpha Soup" }).waitFor();
  await page.getByText(/recommendation authority: not granted/i).waitFor();
  const provenance = page.getByRole("link", { name:"Open source/provenance" });
  await provenance.waitFor();
  if ((await provenance.getAttribute("href")) !== "https://example.test/source") throw new Error("Protected detail provenance URL missing");

  await page.getByRole("button", { name:"Run live verification" }).click();
  await page.getByText(/PROTECTED_CORPUS_P1_LIVE_OWNER_CANARY_PASS/).waitFor();
  const canaryEvidence = JSON.parse(await page.locator("#canaryEvidence").innerText());
  if (canaryEvidence.activeVersion !== "v8018") throw new Error("Live verifier did not pin v8018");
  if (canaryEvidence.indexedRecipeCount !== 19268 || canaryEvidence.ftsRecipeCount !== 19268 || canaryEvidence.structuralPartialCount !== 3) throw new Error("Live verifier exact corpus counts failed");
  if (canaryEvidence.browsePass !== true || canaryEvidence.searchPass !== true || canaryEvidence.detailShard0Pass !== true || canaryEvidence.detailShard1Pass !== true || canaryEvidence.sourceProvenancePass !== true) throw new Error("Live verifier functional matrix failed");
  if (canaryEvidence.maxObservedD1Subqueries > 8 || canaryEvidence.fullCorpusScans !== 0) throw new Error("Live verifier D1/scan budget failed");
  if (canaryEvidence.publicRuntimeChanged !== false || canaryEvidence.recommendationAdmissionChanged !== false) throw new Error("Live verifier authority firewall failed");

  if (errors.length) throw new Error(`Protected corpus page errors: ${errors.join(" | ")}`);
  await page.close();
}

await mobileAcceptance();
await desktopAcceptance();
await protectedCorpusAcceptance();
await browser.close();
console.log("Comprehensive browser acceptance passed.");
