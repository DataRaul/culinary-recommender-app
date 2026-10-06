import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("normal app exposes Owner Recipe Library only through authenticated owner navigation", () => {
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(index, /id="ownerLibraryNav"/);
  assert.match(index, /data-view="library"/);
  assert.match(index, /ownerLibraryNav[^>]*hidden/);
  assert.match(app, /const OWNER_LIBRARY_API = "\/api\/protected-corpus\/v1"/);
  assert.match(app, /libraryNav\.hidden = !ownerAccess/);
  assert.match(app, /if \(activeView === "library"\) renderOwnerLibrary\(\)/);
});

test("Owner Recipe Library preview supports bounded browse search detail without recommendation admission", () => {
  const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /action = ownerLibraryState\.query \? "search" : "browse"/);
  assert.match(app, /action:"detail"/);
  assert.match(app, /limit:24/);
  assert.match(app, /19,268 protected recipes/);
  assert.match(app, /Available · not recommendation-validated/);
  assert.match(app, /Library availability is separate from recommendation eligibility/);
  assert.match(app, /owner-library availability does not grant recommendation, nutrition, dietary\/allergen or public-runtime authority/);
  assert.doesNotMatch(app, /ownerLibrary.*recommendationAdmissionChanged\s*=\s*true/s);
});

test("Owner Recipe Library reuses fail-closed protected browse/search/detail API", () => {
  const route = readFileSync(new URL("../functions/api/protected-corpus/v1.js", import.meta.url), "utf8");
  assert.match(route, /await authorize\(request, env\)/);
  assert.match(route, /action === "browse"/);
  assert.match(route, /action === "search"/);
  assert.match(route, /action === "detail"/);
  assert.match(route, /recommendationAdmissionChanged: false/);
  assert.match(route, /fullCorpusScans: 0/);
});
