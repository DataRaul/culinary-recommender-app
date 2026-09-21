# Step 8G — Shiu Wong Chan v8015 protected population PASS

Date: 2026-09-21

## Terminal

`STEP_8G_CHAN_V8015_PROTECTED_POPULATION_PASS`

The owner-authenticated production runner returned PASS after restart-safe exact population verification, idempotent body/route replay, fifteen-layer bounded hydration, rollback fail-closed proof, reactivation, and terminal evidence collection.

## Proven protected state

- Active protected version: `v8015`
- Parent protected version: `v8014`
- Parent recipes: 16,365
- Chan child recipes: 145
- Composed protected recipes: **16,510**
- Recipe-body shards: 2
- Body batches: 15
- Route batches: 15
- Maximum observed D1 subqueries: **16 / 16**
- D1 budget headroom assumed: false
- Full-corpus scans: 0
- Public runtime was not changed
- Recommendation admission was not changed
- No third shard was used
- No billing expansion was authorized or used

## Source cohort and provenance

The live layer contains the independently qualified cohort `ORA_CHAN_1917_CHINESE_COOK_BOOK_CHINESECOOKBOOK00CHAN` from pinned Open Recipe Archive commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`:

- collection: `chinese-kitchen`
- work: *The Chinese Cook Book*
- author: Shiu Wong Chan
- year semantics: exact digitized 1917 first edition
- exact source URL: `https://archive.org/details/chinesecookbook00chan`
- recipes admitted: 145
- bounded measurement before admission: 145 / 145 parseable, 138 novel normalized titles, ~95.83% novelty

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling, or medical authority.

## Runtime proofs

The owner-authenticated run proved:

- exact 145 child body closure;
- exact 16,365 parent-route preservation;
- exact 16,510 composed routes;
- idempotent body replay;
- idempotent route replay;
- fifteen-layer hydration across v8001 through v8015;
- rollback from v8015 to v8014;
- v8015-only hydration fails closed after rollback;
- successful reactivation leaving v8015 active.

The observed maximum again reached the current 16 D1-subquery design ceiling. The two-shard topology still passes, but **zero D1-query headroom is assumed** for any future layer.

## Roadmap disposition

This PASS satisfies the Chan v8015 owner-authenticated production-write gate.

It does **not by itself** earn `LEGAL_CORPUS_BASELINE_PASS`. The controlling Legal Corpus First decision requires a fresh source-discovery/marginal-value rebase against live v8015 / 16,510, preservation of all existing rights/provenance holds, and a separate baseline reassessment.

The next autonomous lane is therefore:

`fresh post-v8015 discovery -> independently rights-clean candidate / diminishing-marginal-value decision -> LEGAL_CORPUS_BASELINE_PASS reassessment`

Recipe Family, Nutrition expansion, broad recommendation optimization, public corpus widening, third-shard work and billing expansion remain downstream or unauthorized until that reassessment is complete.

Canonical machine-readable live evidence: `data/generated/step8g/chan-v8015-live-pass.json`.
