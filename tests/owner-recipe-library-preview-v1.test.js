import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Owner Recipe Library is unified into Search rather than exposed as a duplicate nav destination", () => {
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const search = readFileSync(new URL("../src/search-ui.js", import.meta.url), "utf8");
  assert.doesNotMatch(index, /data-view="library"/);
  assert.doesNotMatch(index, /ownerLibraryNav/);
  assert.match(index, /data-view="search"/);
  assert.match(search, /All recipes · 19,268/);
  assert.match(search, /searchSurfaceMode = "all-recipes"/);
  assert.match(search, /const OWNER_CATALOG_API = "\/api\/protected-corpus\/v1"/);
});

test("unified owner Search supports bounded browse search detail without recommendation admission", () => {
  const search = readFileSync(new URL("../src/search-ui.js", import.meta.url), "utf8");
  assert.match(search, /const action = ownerCatalogState\.query \? "search" : "browse"/);
  assert.match(search, /action:"detail"/);
  assert.match(search, /limit:24/);
  assert.match(search, /Available · not recommendation-validated/);
  assert.match(search, /Availability is not the same as recommendation validation/);
  assert.match(search, /search availability does not grant recommendation, nutrition, dietary\/allergen or public-runtime authority/);
});

test("unified owner Search reuses fail-closed protected browse/search/detail API", () => {
  const route = readFileSync(new URL("../functions/api/protected-corpus/v1.js", import.meta.url), "utf8");
  assert.match(route, /await authorize\(request, env\)/);
  assert.match(route, /action === "browse"/);
  assert.match(route, /action === "search"/);
  assert.match(route, /action === "detail"/);
  assert.match(route, /recommendationAdmissionChanged: false/);
  assert.match(route, /fullCorpusScans: 0/);
});
