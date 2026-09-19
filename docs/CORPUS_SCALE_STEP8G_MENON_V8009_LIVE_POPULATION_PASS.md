# Step 8G — Menon v8009 protected population PASS

Date: 2026-09-19

## Terminal

`STEP_8G_MENON_V8009_PROTECTED_POPULATION_PASS`

The owner-authenticated production runner returned PASS after restart-safe exact population verification, idempotent body/route replay, nine-layer bounded hydration, rollback fail-closed proof, reactivation, and terminal evidence collection.

## Proven protected state

- Active protected version: `v8009`
- Parent protected version: `v8008`
- Parent recipes: 10,171
- Menon child recipes: 752
- Composed protected recipes: **10,923**
- Recipe-body shards: 2
- Body batches: 76
- Route batches: 76
- Maximum observed D1 subqueries: **16 / 16**
- D1 budget headroom assumed: false
- Full-corpus scans: 0
- Public runtime was not changed
- Recommendation admission was not changed
- No third shard was used
- No billing expansion was authorized or used

## Source cohort and provenance

The live layer contains the independently qualified cohort `ORA_MENON_1801_CUISINIERE_BOURGEOISE_B22019935` from pinned Open Recipe Archive commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`:

- collection: `cuisine-francaise`
- work: *La Cuisinière bourgeoise*
- repository author label: `Menon`
- identified-author display used by the runtime: `Joseph Menon`
- year: 1801
- source: `https://archive.org/details/b22019935`
- recipes: 752

The preceding source-specific rights/measurement and v8009 prewrite evidence remain controlling for rights/reuse basis, attribution/disclosure classification, exact source identity, capacity, deterministic IDs/routes, and request-budget proof.

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling, or medical authority.

## Runtime proofs

The owner-authenticated run proved:

- exact 752 child body closure;
- exact 10,171 parent-route preservation;
- exact 10,923 composed routes;
- idempotent body replay;
- idempotent route replay;
- nine-layer hydration across v8001 through v8009;
- rollback from v8009 to v8008;
- v8009-only hydration fails closed after rollback;
- successful reactivation leaving v8009 active.

The observed maximum again reached the existing design ceiling of 16 D1 subqueries. This PASS confirms the two-shard envelope but provides **zero assumed D1-query headroom** for future source layers.

## Roadmap disposition

This PASS satisfies the Menon v8009 owner-authenticated production-write gate.

It does **not by itself** earn `LEGAL_CORPUS_BASELINE_PASS`. The controlling Legal Corpus First decision explicitly requires continued source-level rights/provenance review until the useful rights-clean corpus is bounded by diminishing marginal coverage/quality value, technical/cost constraints, or another explicit stop condition.

The no-write Open Recipe Archive source discovery was then rebased against live `v8009` / 10,923 in workflow run `35433855145` / job `105873090635`. It passed with **27 rights-review-eligible cohorts** after excluding all seven already-protected ORA sources, preserving the exact Magyar 1901 provenance hold, and preserving the existing `cocina-espanola` collection hold.

The highest-ranked remaining candidate is `ceska-kuchyne`: Marie Dumková, *Česká kuchařka* (1883), 1,876 recipes, 100% parseability, 1,780 novel normalized titles, one exact baseline-title overlap, and 3,688 novel ingredient phrases. Discovery does not clear rights or authorize ingestion; the next authority is **source-specific documentary rights review only**.

Recipe Family, Nutrition expansion, broad recommendation optimization, public corpus widening, third-shard work and billing expansion remain downstream or unauthorized under the current roadmap order.

Canonical machine-readable live evidence: `data/generated/step8g/menon-v8009-live-pass.json`.

Fresh v8009 discovery summary: `data/generated/step8g/ora-next-source-discovery-v8009-summary.json`.
