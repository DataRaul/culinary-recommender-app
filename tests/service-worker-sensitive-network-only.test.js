import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

test("service worker never Cache-Storages API/auth/protected Step 7E traffic", () => {
  assert.match(sw, /const CACHE = "culinary-recommender-v1-1-3-sensitive-network-only"/);
  assert.match(sw, /"\/api\/"/);
  assert.match(sw, /"\/src\/data\/external\/generated\/forkrecipe-step7e-live\/"/);
  assert.match(sw, /"\/auth-canary\.html"/);
  assert.match(sw, /"\/auth-cookie-probe\.html"/);
  assert.match(sw, /"\/auth-session-commit-probe\.html"/);
  assert.match(sw, /"\/step7e-final\.html"/);

  const bypassIndex = sw.indexOf("if (url.origin !== self.location.origin || isNetworkOnly(url))");
  const cacheLookupIndex = sw.indexOf("caches.match(event.request)");
  assert.ok(bypassIndex >= 0, "network-only bypass must exist");
  assert.ok(cacheLookupIndex > bypassIndex, "network-only bypass must execute before Cache Storage lookup");
  assert.match(sw.slice(bypassIndex, cacheLookupIndex), /event\.respondWith\(fetch\(event\.request\)\)/);
});

test("service worker cache migration activates immediately and purges stale API cache entries", () => {
  assert.match(sw, /self\.skipWaiting\(\)/);
  assert.match(sw, /self\.clients\.claim\(\)/);
  assert.match(sw, /keys\.filter\(key => key !== CACHE\)\.map\(key => caches\.delete\(key\)\)/);
  assert.doesNotMatch(sw, /culinary-recommender-v1-1-1-nutrition-b7/);
});

test("ordinary cache only stores successful same-origin responses and only navigations get offline shell fallback", () => {
  assert.match(sw, /url\.origin !== self\.location\.origin/);
  assert.match(sw, /response\.ok && response\.type !== "opaque"/);
  assert.match(sw, /event\.request\.mode === "navigate"/);
  assert.match(sw, /return Response\.error\(\)/);
});
