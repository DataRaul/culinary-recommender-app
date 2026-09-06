# Step 7E service-worker cache root cause

## Finding

The legacy PWA service worker intercepted every same-scope GET and applied cache-first behavior indiscriminately. That included authenticated and stateful server routes such as `/api/auth/session`, `/api/protected-canary`, and `/api/step7e-pilot`.

This created a valid mechanism for stale live evidence:

- a cached `401 NO_SESSION` could survive a later successful sign-in;
- a cached `503 STEP7E_PILOT_NOT_INITIALIZED` could survive later successful materialization;
- diagnostic/canary navigation could be masked by stale PWA state.

The observed contradictions are therefore consistent with client-side Cache Storage reuse rather than requiring weakened cookie semantics or repeated Step 7E bootstrap work.

## Repair contract

- `/api/*` is network-only and never written to Cache Storage.
- protected generated ForkRecipe paths are network-only.
- auth/canary/diagnostic pages are network-only.
- cross-origin requests are not cached by the Culinary PWA.
- only successful same-origin ordinary static responses may be cached.
- offline shell fallback applies only to navigation requests.
- the cache namespace is bumped so the old cache is deleted.
- the new worker uses `skipWaiting()` and `clients.claim()` to minimize stale-worker persistence.

## Boundaries

This repair does not authorize billing, new D1 databases/shards, public ForkRecipe activation, recommendation eligibility, source nutrition/media authority, or Knowledge Core writes.
