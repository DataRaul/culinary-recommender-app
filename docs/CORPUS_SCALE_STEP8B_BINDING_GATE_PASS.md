# Corpus Scale Step 8B — Pages D1 Binding Gate Pass

Date: 2026-09-13

Status: `HUMAN_ATTESTED_BINDING_GATE_PASS__REDEPLOY_REQUIRED_BEFORE_LIVE_CANARY`

The user attested that the existing production Cloudflare Pages project `culinary-recommender-app` now contains exactly these two D1 bindings:

- `CULINARY_RECIPE_SHARD_00_DB` -> `culinary-recipes-00`
- `CULINARY_RECIPE_SHARD_01_DB` -> `culinary-recipes-01`

No additional recipe-body bindings are authorized by Step 8B.

This evidence class is human-attested account configuration. It does not by itself prove that the deployed runtime can reach either D1 database and does not earn `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`.

The next machine sequence is:

1. trigger a fresh production deployment after the binding changes;
2. retain unauthenticated fail-closed behavior before shard access;
3. run the authenticated same-origin `/step8b-canary.html` sequence;
4. require exact verification of two bindings, Free-limit fail-closed behavior, bounded initialization, partial-stop/resume, idempotent replay, authenticated cross-shard read, pointer-only rollback, zero full-corpus scans, and max observed D1 subqueries <= 16;
5. only then validate the final Step 8B live evidence envelope and consider the terminal earned.

Step 8D remains blocked. No public recommendation activation, Nutrition-lane mutation, YT-CUL mutation, Knowledge Core write, R2, Workers Paid, Zero Trust/Access, payment method, checkout, or overage authorization is permitted by this gate.
