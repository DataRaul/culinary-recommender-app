# Step 8G — Artusi v8010 protected population PASS

Date: 2026-09-19

## Terminal

`STEP_8G_ARTUSI_V8010_PROTECTED_POPULATION_PASS`

The owner-authenticated production runner returned PASS after restart-safe exact population verification, idempotent body/route replay, ten-layer bounded hydration, rollback fail-closed proof, reactivation, and terminal evidence collection.

## Proven protected state

- Active protected version: `v8010`
- Parent protected version: `v8009`
- Parent recipes: 10,923
- Artusi child recipes: 829
- Composed protected recipes: **11,752**
- Recipe-body shards: 2
- Body batches: 83
- Route batches: 83
- Maximum observed D1 subqueries: **16 / 16**
- D1 budget headroom assumed: false
- Full-corpus scans: 0
- Public runtime was not changed
- Recommendation admission was not changed
- No third shard was used
- No billing expansion was authorized or used

## Source cohort and provenance

The live layer contains the independently qualified cohort `ORA_ARTUSI_1891_SCIENZA_CUCINA_GUTENBERG_59047` from pinned Open Recipe Archive commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`:

- collection: `cucina-italiana`
- work: *La scienza in cucina e l'arte di mangiar bene*
- author: Pellegrino Artusi
- work first-publication year: 1891
- exact digitized source: Project Gutenberg eBook #59047
- digitized edition: 25th edition, 1922
- recipes admitted from ORA cohort: 829

The preceding source-specific rights/measurement and v8010 prewrite evidence remain controlling for rights/reuse basis, attribution/disclosure classification, exact source identity, work-year versus digitized-edition semantics, capacity, deterministic IDs/routes, and request-budget proof.

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling, or medical authority.

## Runtime proofs

The owner-authenticated run proved:

- exact 829 child body closure;
- exact 10,923 parent-route preservation;
- exact 11,752 composed routes;
- idempotent body replay;
- idempotent route replay;
- ten-layer hydration across v8001 through v8010;
- rollback from v8010 to v8009;
- v8010-only hydration fails closed after rollback;
- successful reactivation leaving v8010 active.

The observed maximum again reached the existing design ceiling of 16 D1 subqueries. This PASS confirms the current two-shard envelope but provides **zero assumed D1-query headroom** for future source layers.

## Roadmap disposition

This PASS satisfies the Artusi v8010 owner-authenticated production-write gate.

It does **not by itself** earn `LEGAL_CORPUS_BASELINE_PASS`. The controlling Legal Corpus First decision requires continued rights/provenance review until the useful rights-clean corpus is bounded by diminishing marginal coverage/quality value, technical/cost constraints, or another explicit stop condition.

The next no-write source-discovery run must therefore be rebased against live `v8010` / 11,752, exclude all sources protected through Artusi, preserve the exact Magyar 1901 and Česká kuchařka 1883 provenance holds, and preserve the existing `cocina-espanola` collection hold. Discovery remains non-authoritative for rights and cannot itself authorize ingestion.

Recipe Family, Nutrition expansion, broad recommendation optimization, public corpus widening, third-shard work and billing expansion remain downstream or unauthorized under the current roadmap order.

Canonical machine-readable live evidence: `data/generated/step8g/artusi-v8010-live-pass.json`.
