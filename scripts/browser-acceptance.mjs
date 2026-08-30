import { chromium } from "playwright";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });

async function mobileAcceptance() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "What should you cook?" }).waitFor();

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

  // Exact-slot planning: choose one lunch and one dinner only.
  const slots = page.locator('input[name="slot"]');
  for (let i = 0; i < await slots.count(); i++) await slots.nth(i).uncheck({ force: true });
  await page.locator('input[name="slot"][value="mon-lunch"]').check({ force: true });
  await page.locator('input[name="slot"][value="wed-dinner"]').check({ force: true });
  await page.getByText("2 selected").waitFor();
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
  await page.locator("#permanentExclusionPanel").getByRole("button", { name: /coconut milk ×/ }).waitFor();

  await page.locator("#permanentExclusionInput").fill("pineapple");
  await page.locator("#permanentExclusionForm").getByRole("button", { name: "Exclude" }).click();
  await page.getByRole("heading", { name: /Pantry & cannot-find list/ }).waitFor();
  await page.locator("#permanentExclusionPanel").getByRole("button", { name: /pineapple ×/ }).waitFor();

  const persisted = JSON.parse(await page.evaluate(() => localStorage.getItem("culinary-recommender.state.v1")));
  if (!persisted.profile.excludedIngredientIds.includes("coconut_milk")) throw new Error("Coconut permanent exclusion did not persist");
  if (!persisted.profile.excludedIngredientIds.includes("pineapple")) throw new Error("Future pineapple exclusion did not persist");
  if (!persisted.profile.unavailableIngredientIds.includes("tahini")) throw new Error("Temporary unavailability did not remain separate");

  // Search honors permanent exclusion: current tempeh recipe contains coconut milk.
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
  await page.getByLabel("Require all listed secondary ingredients").check();
  await page.getByRole("button", { name: /Find dishes/ }).click();
  const requireAllCards = await page.locator(".search-result-card").count();
  if (requireAllCards < 1) throw new Error("Require-all salmon + rice unexpectedly produced no result");
  const requireAllText = await page.locator(".search-result-card").allTextContents();
  if (!requireAllText.every(text => /rice/i.test(text))) throw new Error("Require-all results did not all use rice");

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
  if (errors.length) throw new Error(`Desktop page errors: ${errors.join(" | ")}`);
  await page.close();
}

await mobileAcceptance();
await desktopAcceptance();
await browser.close();
console.log("Comprehensive browser acceptance passed.");
