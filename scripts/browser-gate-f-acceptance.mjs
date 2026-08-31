import { chromium } from "playwright";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "What should you cook?" }).waitFor();
await page.getByText("84 recipes · 76 curated + 8 open external · deterministic", { exact: true }).waitFor();

await page.getByRole("button", { name: "Search" }).click();
await page.getByRole("heading", { name: "Cook what you already have" }).waitFor();
await page.getByLabel(/Main ingredient/).fill("aubergine");
await page.getByLabel("Recommendation lens").selectOption("ingredients");
await page.getByLabel("Time today").selectOption("60");
await page.getByLabel("Effort / skill today").selectOption("4");
await page.getByRole("button", { name: /Find dishes/ }).click();

const baba = page.locator(".search-result-card").filter({ hasText: "Baba Ganoush" });
await baba.waitFor();
const text = await baba.innerText();
for (const expected of ["open external recipe", "nutrition evidence pending", "revision 4629606", "CC BY-SA 4.0", "Wikibooks contributors"]) {
  if (!text.includes(expected)) throw new Error(`Gate F external Search card missing: ${expected}`);
}
if (!text.includes("Source nutrition values are not imported as authoritative composition")) {
  throw new Error("Gate F nutrition-source firewall is not visible in Search provenance");
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
