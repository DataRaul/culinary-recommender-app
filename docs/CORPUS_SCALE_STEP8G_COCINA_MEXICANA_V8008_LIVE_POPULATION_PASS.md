# Step 8G — cocina-mexicana v8008 protected population PASS

Date: 2026-09-18

## Terminal

`STEP_8G_COCINA_MEXICANA_V8008_PROTECTED_POPULATION_PASS`

The owner-authenticated production runner returned PASS after restart-safe exact population verification, idempotent body/route replay, eight-layer bounded hydration, rollback fail-closed proof, reactivation, and terminal evidence collection.

## Proven protected state

- Active protected version: `v8008`
- Parent protected version: `v8007`
- Parent recipes: 3,695
- cocina-mexicana child recipes: 6,476
- Composed protected recipes: **10,171**
- Recipe-body shards: 2
- Body batches: 649
- Route batches: 649
- Maximum observed D1 subqueries: **16 / 16**
- D1 budget headroom assumed: false
- Full-corpus scans: 0
- Public runtime remains 85 recipes and was not changed
- Recommendation admission was not changed
- No third shard was used
- No billing expansion was authorized or used

## Source cohorts and provenance

The live layer contains exactly two independently rights-cleared historical source cohorts from pinned Open Recipe Archive commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`:

1. `ORA_GALVAN_RIVERA_1845_DICCIONARIO_COCINA_AE3BD2C` — Mariano Galván Rivera, *Diccionario de cocina, ó El nuevo cocinero mexicano* (1845), 4,347 records.
2. `ORA_COCINERA_POBLANA_1890_ANONYMOUS_AE3BD2C` — *La cocinera poblana* (1890), 2,129 records, with the author intentionally represented as `author not identified` under the independently documented anonymous-source classification.

The preceding source audit and prewrite evidence remain controlling for rights/reuse basis, attribution/disclosure classification, source identity, capacity and request-budget proof.

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling, or medical authority.

## Runtime proofs

The owner-authenticated run proved:

- exact 6,476 child body closure;
- exact 3,695 parent-route preservation;
- exact 10,171 composed routes;
- idempotent body replay;
- idempotent route replay;
- eight-layer hydration across v8001 through v8008;
- rollback from v8008 to v8007;
- v8008-only hydration fails closed after rollback;
- successful reactivation leaving v8008 active.

The observed maximum reached the existing design ceiling of 16 D1 subqueries. This PASS therefore confirms the existing envelope but provides **zero assumed D1-query headroom** for future source layers.

## Roadmap disposition

This PASS satisfies the v8008 owner-authenticated production-write gate.

It does **not** earn `LEGAL_CORPUS_BASELINE_PASS`. Fresh ORA source-level discovery was rebased on live `v8008` / 10,171 and completed successfully in workflow run `35341380297` / job `105587824804`. It found **29 rights-review-eligible source cohorts** after excluding all six already-protected ORA source cohorts and preserving the existing `cocina-espanola` rights hold.

The highest-ranked current candidate is `magyar-konyha`: Rézi néni, *Képes budapesti szakácskönyv* (1901), 1,240 recipes, 100% parseability, 1,204 novel normalized titles. Discovery does not clear rights or authorize ingestion; the next authority is source-specific documentary rights review only.

Continuation therefore remains `STEP8G_RIGHTS_CLEAN_PROTECTED_SCALE`, beginning with the Hungarian source audit and bounded v8008 marginal-value measurement before any prewrite. Recipe Family, Nutrition expansion, YouTube refinement, broader recommendation optimization, public corpus widening, third-shard work and billing expansion remain downstream or unauthorized.

Canonical machine-readable live evidence: `data/generated/step8g/cocina-mexicana-v8008-live-pass.json`.

Fresh discovery summary: `data/generated/step8g/ora-next-source-discovery-v8008-summary.json`.
