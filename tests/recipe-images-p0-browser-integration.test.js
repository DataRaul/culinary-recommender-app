import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  RECIPE_IMAGES_P0_BROWSER_REGISTRY,
  recipeImageForId,
  recipeImageMarkup
} from "../src/recipe-images-p0-runtime.js";

const integration = JSON.parse(
  await readFile(new URL("../config/recipe_images_p0_browser_integration.json", import.meta.url), "utf8")
);
const pilot = JSON.parse(
  await readFile(new URL("../config/recipe_images_p0_asset_pilot.json", import.meta.url), "utf8")
);
const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const searchSource = await readFile(new URL("../src/search-ui.js", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const sw = await readFile(new URL("../sw.js", import.meta.url), "utf8");

test("browser registry exactly matches the validated six-asset pilot", () => {
  const runtimeIds = Object.keys(RECIPE_IMAGES_P0_BROWSER_REGISTRY).sort();
  const integrationIds = [...integration.exactRecipeIds].sort();
  const pilotIds = pilot.assets.map(row => row.recipeId).sort();
  assert.deepEqual(runtimeIds, integrationIds);
  assert.deepEqual(runtimeIds, pilotIds);
  for (const row of pilot.assets) {
    const runtime = recipeImageForId(row.recipeId);
    assert.ok(runtime);
    assert.equal(runtime.assetId, row.assetId);
    assert.equal(runtime.assetPath, `.${row.assetPath}`);
    assert.equal(runtime.width, row.width);
    assert.equal(runtime.height, row.height);
    assert.equal(runtime.altText, row.altText);
  }
  assert.equal(recipeImageForId("unitools_tortilla_espanola"), null);
});

test("image markup is accessible, bounded and presentation-only", () => {
  const markup = recipeImageMarkup("east_asian_miso_salmon_rice");
  assert.match(markup, /class="recipe-media"/);
  assert.match(markup, /data-image-state="loading"/);
  assert.match(markup, /loading="lazy"/);
  assert.match(markup, /decoding="async"/);
  assert.match(markup, /width="960"/);
  assert.match(markup, /height="720"/);
  assert.match(markup, /alt="Stylized miso salmon/);
  assert.match(markup, /src="\.\/assets\/recipes\/east_asian_miso_salmon_rice\.svg"/);
  assert.equal(recipeImageMarkup("unitools_tortilla_espanola"), "");
});

test("plan and ingredient-search cards both bind the exact P0 media runtime", () => {
  for (const source of [appSource, searchSource]) {
    assert.match(source, /recipeImageMarkup/);
    assert.match(source, /bindRecipeImageFallbacks/);
  }
  assert.match(appSource, /recipeImageMarkup\(r\.id\)/);
  assert.match(searchSource, /recipeImageMarkup\(recipe\.id\)/);
});

test("CSS reserves a 4:3 box and hides broken/loading images behind deterministic fallback", () => {
  assert.match(css, /\.recipe-media\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/s);
  assert.match(css, /\.recipe-media-image\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(css, /data-image-state="loaded"[^}]*opacity:\s*1/s);
  assert.match(css, /recipe-media-fallback/);
});

test("service worker caches only the exact same-origin P0 runtime and six assets", () => {
  assert.match(sw, /recipe-images-p0-runtime\.js/);
  for (const row of pilot.assets) {
    assert.ok(sw.includes(`.${row.assetPath}`), row.recipeId);
  }
  assert.doesNotMatch(sw, /https?:\/\/.*assets\/recipes/);
});

test("browser integration changes media presentation only", () => {
  assert.equal(integration.mediaAuthority.exactPilotUiMediaActivationAuthorized, true);
  for (const [key, value] of Object.entries(integration.behavior)) {
    assert.equal(value, false, key);
  }
  for (const key of [
    "thirdPartyRecipeSourceMediaAuthorized",
    "protectedCorpusSourceMediaAuthorized",
    "wikibooksCommonsMediaAuthorized",
    "remoteMediaAuthorized",
    "stockMediaAuthorized"
  ]) {
    assert.equal(integration.mediaAuthority[key], false, key);
  }
  for (const value of Object.values(integration.infrastructureAuthority)) assert.equal(value, false);
});
