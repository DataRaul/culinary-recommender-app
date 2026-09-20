# Step 8G — André Viard v8013 protected population PASS

Date: 2026-09-20

## Terminal

`STEP_8G_VIARD_V8013_PROTECTED_POPULATION_PASS`

The owner-authenticated production runner returned PASS after restart-safe exact population verification, idempotent body/route replay, thirteen-layer bounded hydration, rollback fail-closed proof, reactivation, and terminal evidence collection.

## Proven protected state

- Active protected version: `v8013`
- Parent protected version: `v8012`
- Parent recipes: 14,846
- Viard child recipes: 807
- Composed protected recipes: **15,653**
- Recipe-body shards: 2
- Body batches: 81
- Route batches: 81
- Maximum observed D1 subqueries: **16 / 16**
- D1 budget headroom assumed: false
- Full-corpus scans: 0
- Public runtime was not changed
- Recommendation admission was not changed
- No third shard was used
- No billing expansion was authorized or used

## Source cohort and provenance

The live layer contains the independently qualified cohort `ORA_VIARD_1806_LE_CUISINIER_IMPERIAL_LECUISINIERIMPE00VIARGOOG` from pinned Open Recipe Archive commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`:

- collection: `cuisine-francaise`
- work: *Le Cuisinier impérial*
- ORA author form: A. Viard
- canonical bibliographic author: André Viard
- year: 1806
- exact source URL: `https://archive.org/details/lecuisinierimpe00viargoog`
- recipes admitted: 807

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling, or medical authority.

## Runtime proofs

The owner-authenticated run proved:

- exact 807 child body closure;
- exact 14,846 parent-route preservation;
- exact 15,653 composed routes;
- idempotent body replay;
- idempotent route replay;
- thirteen-layer hydration across v8001 through v8013;
- rollback from v8013 to v8012;
- v8013-only hydration fails closed after rollback;
- successful reactivation leaving v8013 active.

The observed maximum again reached the existing design ceiling of 16 D1 subqueries. This PASS confirms the current two-shard envelope but provides **zero assumed D1-query headroom** for another source layer.

## Roadmap disposition

This PASS satisfies the Viard v8013 owner-authenticated production-write gate.

It does **not by itself** earn `LEGAL_CORPUS_BASELINE_PASS`. The controlling Legal Corpus First decision requires a fresh source-discovery/marginal-value rebase against live v8013 / 15,653 and a separate baseline reassessment.

Recipe Family, Nutrition expansion, broad recommendation optimization, public corpus widening, third-shard work and billing expansion remain downstream or unauthorized until that reassessment is complete.

Canonical machine-readable live evidence: `data/generated/step8g/viard-v8013-live-pass.json`.
