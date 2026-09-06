const CACHE = "culinary-recommender-v1-1-3-sensitive-network-only";
const ASSETS = ["./","./index.html","./styles.css","./search.css","./profile-packs.css","./manifest.webmanifest","./src/bootstrap.js","./src/external-corpus-runtime.js","./src/app.js","./src/search-ui.js","./src/exclusions-ui.js","./src/data/corpus-v1.js","./src/data/external/wikibooks-gate-f-v1.js","./src/data/recipes.js","./src/data/recipes-v1.js","./src/data/recipes-v1-search.js","./src/data/ingredients.js","./src/data/substitutions.js","./src/data/cost-heuristics.js","./src/data/nutrition-evidence.js","./src/data/usda-foundation-nutrients-v1.js","./src/data/usda-foundation-nutrients-b3.js","./src/data/usda-foundation-portions-v1.js","./src/data/ciqual-nutrients-b4.js","./src/data/ciqual-nutrients-b5.js","./src/data/ciqual-nutrients-b7.js","./src/data/matvaretabellen-portions-b6.js","./src/domain/profile.js","./src/domain/recommendation.js","./src/domain/search.js","./src/domain/exclusions.js","./src/domain/planner.js","./src/domain/grocery.js","./src/domain/cost.js","./src/domain/nutrition.js","./src/domain/nutrition-evidence-comparison.js","./src/domain/nutrition-source-policy.js","./src/domain/storage.js","./src/domain/substitution.js"];

const NETWORK_ONLY_PREFIXES = [
  "/api/",
  "/src/data/external/generated/forkrecipe-step7e-live/"
];
const NETWORK_ONLY_PATHS = new Set([
  "/auth-canary.html",
  "/auth-cookie-probe.html",
  "/auth-session-commit-probe.html",
  "/step7e-final.html"
]);

function isNetworkOnly(url) {
  return NETWORK_ONLY_PREFIXES.some(prefix => url.pathname.startsWith(prefix)) || NETWORK_ONLY_PATHS.has(url.pathname);
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin || isNetworkOnly(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (response.ok && response.type !== "opaque") {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        });
    })
  );
});
