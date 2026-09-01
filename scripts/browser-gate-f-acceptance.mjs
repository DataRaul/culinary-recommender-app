import { chromium } from "playwright";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "What should you cook?" }).waitFor();
const statusPill = page.locator("#statusPill");
await statusPill.waitFor({ state: "attached" });
if ((await statusPill.textContent())?.trim() !== "84 recipes · 76 curated + 8 open external · deterministic") {
  throw new Error(`Gate F runtime status is incorrect: ${(await statusPill.textContent())?.trim()}`);
}

await page.getByRole("button", { name: "Search" }).click();
await page.getByRole("heading", { name: "Cook what you already have" }).waitFor();
await page.getByLabel(/Main ingredient/).fill("aubergine");
await page.getByLabel("Recommendation lens").selectOption("ingredients");
await page.getByLabel("Time today").selectOption("60");
await page.getByLabel("Effort / skill today").selectOption("4");
await page.getByRole("button", { name: /Find dishes/ }).click();

const baba = page.locator(".search-result-card").filter({ hasText: "Baba Ganoush" });
await baba.waitFor();
const visibleSummary = (await baba.innerText()).toLowerCase();
for (const expected of ["open external recipe", "nutrition evidence pending"]) {
  if (!visibleSummary.includes(expected)) throw new Error(`Gate F external Search summary missing: ${expected}`);
}

const details = baba.locator("details");
await details.evaluate(element => { element.open = true; });
const provenanceText = (await details.innerText()).toLowerCase();
for (const expected of ["revision 4629606", "cc by-sa 4.0", "wikibooks contributors", "recipe text has been normalized and adapted into the culinary recommender schema", "source nutrition values are not imported as authoritative composition"]) {
  if (!provenanceText.includes(expected)) throw new Error(`Gate F external Search provenance missing: ${expected}`);
}

const sourceLink = baba.getByRole("link", { name: "English Wikibooks Cookbook" });
if (await sourceLink.getAttribute("href") !== "https://en.wikibooks.org/wiki/Cookbook%3ABaba%20Ganoush") {
  throw new Error("Gate F Wikibooks source-page link is not revision-provenance compatible");
}
const revisionLink = baba.getByRole("link", { name: "revision 4629606" });
if (await revisionLink.getAttribute("href") !== "https://en.wikibooks.org/w/index.php?oldid=4629606") {
  throw new Error("Gate F exact revision link is incorrect");
}

// External records are search-only at this gate. Weekly planning remains the authored-corpus path.
await page.getByRole("button", { name: "Ideas" }).click();
await page.getByRole("heading", { name: "What should you cook?" }).waitFor();
await page.locator('input[name="slot"]').evaluateAll(inputs => {
  for (const input of inputs) {
    const shouldBeChecked = input.value === "mon-lunch";
    if (input.checked !== shouldBeChecked) input.click();
  }
});
await page.getByRole("button", { name: /Build my plan/ }).click();
await page.getByRole("heading", { name: /1 meal, built as a portfolio/ }).waitFor();
const plannedTitles = await page.locator(".recipe-card h3").allTextContents();
if (plannedTitles.includes("Baba Ganoush") || plannedTitles.includes("Bruschetta (base)")) {
  throw new Error("Search-only external recipe leaked into weekly planner");
}

if (errors.length) throw new Error(`Gate F browser page errors: ${errors.join(" | ")}`);
await browser.close();
console.log("Gate F browser acceptance passed.");
