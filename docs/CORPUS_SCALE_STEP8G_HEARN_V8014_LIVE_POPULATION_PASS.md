# Step 8G — Lafcadio Hearn v8014 protected population PASS

Date: 2026-09-21

## Terminal

`STEP_8G_HEARN_V8014_PROTECTED_POPULATION_PASS`

The owner-authenticated production runner returned PASS after restart-safe exact population verification, idempotent body/route replay, fourteen-layer bounded hydration, rollback fail-closed proof, reactivation, and terminal evidence collection.

## Proven protected state

- Active protected version: `v8014`
- Parent protected version: `v8013`
- Parent recipes: 15,653
- Hearn child recipes: 712
- Composed protected recipes: **16,365**
- Recipe-body shards: 2
- Body batches: 72
- Route batches: 72
- Maximum observed D1 subqueries: **16 / 16**
- D1 budget headroom assumed: false
- Full-corpus scans: 0
- Public runtime was not changed
- Recommendation admission was not changed
- No third shard was used
- No billing expansion was authorized or used

## Source cohort and provenance

The live layer contains the independently qualified cohort `ORA_HEARN_1885_LA_CUISINE_CREOLE_LACUISINECREOLEC00HEAR` from pinned Open Recipe Archive commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`:

- collection: `louisiana-creole`
- work: *La Cuisine Creole*
- author: Lafcadio Hearn
- year semantics: exact digitized 1885 second edition
- exact source URL: `https://archive.org/details/lacuisinecreolec00hear`
- recipes admitted: 712
- bounded measurement before admission: 712 / 712 parseable, 649 novel normalized titles, ~97.01% novelty

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling, or medical authority.

## Runtime proofs

The owner-authenticated run proved:

- exact 712 child body closure;
- exact 15,653 parent-route preservation;
- exact 16,365 composed routes;
- idempotent body replay;
- idempotent route replay;
- fourteen-layer hydration across v8001 through v8014;
- rollback from v8014 to v8013;
- v8014-only hydration fails closed after rollback;
- successful reactivation leaving v8014 active.

The observed maximum again reached the existing design ceiling of 16 D1 subqueries. This PASS confirms the current two-shard envelope but provides **zero assumed D1-query headroom** for another source layer.

## Operational note

The first repaired owner attempt on 2026-09-20 was blocked by Cloudflare D1's free-tier daily row-write quota. The project failed closed, no paid upgrade was authorized, and the restart-safe runner completed successfully after the daily reset. This was a provider quota gate rather than a corpus-integrity or runtime-contract failure.

## Roadmap disposition

This PASS satisfies the Hearn v8014 owner-authenticated production-write gate.

It does **not by itself** earn `LEGAL_CORPUS_BASELINE_PASS`. The controlling Legal Corpus First decision requires a fresh source-discovery/marginal-value rebase against live v8014 / 16,365, preservation of all existing rights/provenance holds, and a separate baseline reassessment.

The next autonomous lane is therefore:

`fresh post-v8014 discovery -> independently rights-clean candidate / diminishing-marginal-value decision -> LEGAL_CORPUS_BASELINE_PASS reassessment`

Recipe Family, Nutrition expansion, broad recommendation optimization, public corpus widening, third-shard work and billing expansion remain downstream or unauthorized until that reassessment is complete.

Canonical machine-readable live evidence: `data/generated/step8g/hearn-v8014-live-pass.json`.
