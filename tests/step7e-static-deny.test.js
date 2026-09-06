import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { onRequest } from "../functions/_middleware.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";

test("Step 7E generated payload path is routed through Functions and denied", async () => {
  const routes = JSON.parse(await readFile(new URL("../_routes.json", import.meta.url), "utf8"));
  assert.ok(routes.include.includes("/src/data/external/generated/forkrecipe-step7e-live/*"));

  let nextCalled = false;
  const response = await onRequest({
    request: new Request(`${ORIGIN}/src/data/external/generated/forkrecipe-step7e-live/chunk-000.mjs`),
    next: async () => {
      nextCalled = true;
      return new Response("should not run");
    }
  });
  assert.equal(response.status, 404);
  assert.equal(nextCalled, false);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("Step 7E deny middleware preserves ordinary API routing", async () => {
  let nextCalled = false;
  const response = await onRequest({
    request: new Request(`${ORIGIN}/api/auth/session`),
    next: async () => {
      nextCalled = true;
      return new Response("next", { status: 200 });
    }
  });
  assert.equal(response.status, 200);
  assert.equal(nextCalled, true);
});

test("GitHub Pages configuration excludes generated Step 7E payload directory", async () => {
  const config = await readFile(new URL("../_config.yml", import.meta.url), "utf8");
  assert.match(config, /src\/data\/external\/generated\/forkrecipe-step7e-live/);
});
