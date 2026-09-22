# Step 8G — Kenney-Herbert v8016 protected population PASS

Date: 2026-09-22

## Terminal

`STEP_8G_KENNEY_HERBERT_V8016_PROTECTED_POPULATION_PASS`

The owner-authenticated production run completed the exact 501-recipe Kenney-Herbert layer over live v8015, proved sixteen-layer bounded hydration, rollback/fail-closed behavior and reactivation, and left protected `v8016` active at **17,011 recipes**.

## Proven protected state

- Active protected version: `v8016`
- Parent protected version: `v8015`
- Parent recipes: 16,510
- Kenney-Herbert child recipes: 501
- Composed protected recipes: **17,011**
- Recipe-body shards: 2
- Body batches: 51
- Route batches: 51
- Maximum observed D1 subqueries: **8**
- Hard API D1 ceiling: 16
- Full-corpus scans: 0
- Public runtime changed: false
- Recommendation admission changed: false
- Third shard used: false
- Billing expansion: false

## D1-optimized route proof

The browser had a cached pre-optimization runner surface and therefore emitted the older completion label `16510-parent-routes`. The deployed authenticated API was then checked directly, without rerunning population.

That status proof returned:

- `optimizedMaxRequestD1Subqueries: 8`
- `routeStorageMode: PARENT_V8015_REFERENCE_PLUS_V8016_DELTA`
- `parentRouteRowsCopied: 0`
- `deltaRouteRowsExpected: 501`
- one D1 subquery for the status request, within the hard 16-query firewall.

The optimized API intentionally keeps `copy-parent-routes` as a backward-compatible action alias, but its implementation is verification-only: it verifies the immutable v8015 route base, rejects any stale copied-parent rows, and reports `physicalRowsWritten: 0`. The owner terminal also observed a maximum of 8 D1 subqueries, consistent with the optimized runtime.

Therefore no repeat production population was required, and no 16,510-row parent-route copy is accepted as part of this PASS.

## Source cohort and provenance

- cohort: `ORA_KENNEY_HERBERT_1885_CULINARY_JOTTINGS_CULINARYJOTTINGS00KENN`
- collection: `indian-kitchen`
- work: *Culinary Jottings for Madras*
- source author: Wyvern (A.R. Kenney-Herbert)
- canonical author: Arthur Robert Kenney-Herbert
- exact digitized edition: 1885 fifth edition
- recipes admitted: 501
- rights marker: `PASS_RIGHTS_VERIFIED_BOUNDED_KENNEY_HERBERT_1885_FIFTH_EDITION_TERM_EXPIRED`
- pinned Open Recipe Archive commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling or medical authority.

## Runtime proofs

The owner run proved:

- exact 501 child body closure;
- exact 17,011 logical route composition;
- idempotent body and route replay;
- sixteen-layer hydration across v8001 through v8016;
- rollback from v8016 to v8015;
- v8016-only hydration fails closed after rollback;
- successful reactivation leaving v8016 active;
- no public/recommendation/topology/billing widening.

## Roadmap disposition

This PASS satisfies the v8016 owner-authenticated production gate.

It does **not by itself** declare `LEGAL_CORPUS_BASELINE_PASS`. The next machine-only action is a fresh no-write source-discovery/marginal-value rebase against **v8016 / 17,011**, followed by explicit baseline reassessment.

No v8017 population work is authorized until that reassessment decides another protected layer is still warranted. Any future layer must preserve the delta-route architecture or use a separately reviewed canonical-route migration; full parent-route copying must not return.

Canonical machine-readable evidence: `data/generated/step8g/kenney-herbert-v8016-live-pass.json`.
