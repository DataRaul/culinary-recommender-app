import { chromium } from "playwright";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:4173";

async function searchForPilotRecipe(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("heading", { name: "Cook what you already have" }).waitFor();
  await page.getByLabel(/Main ingredient/).fill("salmon");
  await page.getByLabel("Recommendation lens").selectOption("ingredients");
  await page.getByLabel("Time today").selectOption("60");
  await page.getByLabel("Effort / skill today").selectOption("4");
  await page.getByRole("button", { name: /Find dishes/ }).click();
  const card = page.locator('.search-result-card').filter({ hasText: "Miso Salmon" }).first();
  await card.waitFor();
  return card;
}

const browser = await chromium.launch({ headless: true });

try {
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const card = await searchForPilotRecipe(page);
    const media = card.locator('.recipe-media[data-recipe-id="east_asian_miso_salmon_rice"]');
    await media.waitFor();
    await page.waitForFunction(
      () => document.querySelector('.recipe-media[data-recipe-id="east_asian_miso_salmon_rice"]')?.dataset.imageState === "loaded"
    );
    const image = media.locator("img[data-recipe-image]");
    const details = await image.evaluate(node => ({
      alt: node.getAttribute("alt"),
      loading: node.getAttribute("loading"),
      decoding: node.getAttribute("decoding"),
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      rect: node.getBoundingClientRect().toJSON()
    }));
    if (!details.alt || !/miso salmon/i.test(details.alt)) throw new Error("P0 image alt text is missing or incorrect");
    if (details.loading !== "lazy") throw new Error("P0 image is not lazy-loaded");
    if (details.decoding !== "async") throw new Error("P0 image does not prefer async decoding");
    if (details.naturalWidth <= 0 || details.naturalHeight <= 0) throw new Error("P0 image did not load");
    const ratio = details.rect.width / details.rect.height;
    if (Math.abs(ratio - (4 / 3)) > 0.03) throw new Error(`P0 media box ratio drifted: ${ratio}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) throw new Error("P0 image integration introduced mobile horizontal overflow");
    if (errors.length) throw new Error(`P0 loaded-image page errors: ${errors.join(" | ")}`);
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route("**/assets/recipes/east_asian_miso_salmon_rice.svg", route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const card = await searchForPilotRecipe(page);
    const media = card.locator('.recipe-media[data-recipe-id="east_asian_miso_salmon_rice"]');
    await media.waitFor();
    await page.waitForFunction(
      () => document.querySelector('.recipe-media[data-recipe-id="east_asian_miso_salmon_rice"]')?.dataset.imageState === "error"
    );
    await media.locator(".recipe-media-fallback").getByText("Recipe image unavailable").waitFor();
    await card.getByRole("heading", { name: /Miso Salmon/i }).waitFor();
    await card.getByText(/Uses salmon/i).waitFor();
    await card.getByText("Ingredients & method").waitFor();
    if (errors.length) throw new Error(`P0 fallback page errors: ${errors.join(" | ")}`);
    await context.close();
  }

  console.log("Recipe Images P0 browser integration passed.");
} finally {
  await browser.close();
}
