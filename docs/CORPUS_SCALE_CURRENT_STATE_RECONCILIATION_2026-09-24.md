# Corpus Scale — Current-State Reconciliation

Date: **2026-09-24**

Status: **PASS / CURRENT SCALE FOUNDATION RECONCILED / LIVE DOWNSTREAM ARCHITECTURE PRESERVED**

Terminal: `CURRENT_SCALE_FOUNDATION_RECONCILIATION_PASS`

## Purpose

This document closes the independent 100k Scale Program continuation started from the hardened Step 1 contract. The continuation did **not** recreate historical Steps 2–8 blindly. It fresh-reconciled the current public runtime and only changed existing scale artifacts where the present 85-record public seed exposed a real compatibility gap.

The separate Barbecue scheduled programme is not an input to this lane and remains unchanged.

## Fresh Step 1–6 continuation evidence

The immutable historical behavioral/data oracle remains:

- `ALL_RECIPES`: **84 records**.

The current public-runtime scale seed remains:

- `PUBLIC_RUNTIME_RECIPES`: **85 records**;
- the difference is the exact Step 8F-approved `unitools_tortilla_espanola` activation.

Current continuation lineage:

- **Step 1 V2 — PASS:** PR #291 hardened deterministic 1k → 100k synthetic scale against the current 85-record seed while preserving the historical 84-record oracle.
- **Step 2 — PASS:** PR #294 proved exact current-runtime `RecipeSource` V2 serialization plus ranking/planner/ingredient-search parity; V1 remains the default runtime source.
- **Step 3 — PASS:** PR #295 moved the portable object-layout build path to the current 85-record runtime while retaining exact historical-84 compatibility.
- **Step 4 — PASS:** PR #296 reran the full current-runtime-seeded 1k → 100k bounded indexed-retrieval proof. At 100k: build **4.400 s**, maximum observed retrieval p95 **16.031 ms**, maximum rank/filter p95 **5.542 ms**, sampled RSS **272.8 MB**, sampled heap **78.7 MB**. All frozen bounded-read/transfer gates passed and D1 remained **not earned by this benchmark**.
- **Step 5 — PASS:** PR #297 fresh-revalidated the existing source-neutral ingestion/control plane. No recipe-count-specific compatibility gap was found, so it was not reinvented.
- **Step 6 — PASS:** PR #297 reconciled ordinary incremental-validation fixtures to the current 85-record public seed while independently preserving the 84-record golden-retention oracle.

No Step 1–6 continuation change authorized real-source population, public-runtime widening, protected-corpus mutation, paid infrastructure, a third D1 recipe shard, Knowledge Core writes, or Barbecue mutation.

## Downstream live architecture reconciliation

Historical Step 7/8 work is **ahead of** the original 100k architecture and must be preserved rather than replayed.

Current established downstream evidence includes:

- Step 7A: `NO_BILLING_AUTH_170K_ARCHITECTURE_PASS`; repository-only proof passed the **170k required / 250k stress** ladder using the no-billing-authorization D1-shaped architecture.
- Step 7B: `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` for the accepted developer resources.
- Step 7C: `STEP_7C_LIVE_AUTH_REVOCATION_CANARY_PASS`.
- Step 7D: `STEP_7D_PROTECTED_84_CANARY_PASS`.
- Step 7E: `STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS`.
- Step 8A–8E: population/shard/source/recommendation-readiness gates passed.
- Step 8F: `STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED`; exactly one reviewed record was activated, producing the current **85-record** public runtime.
- Step 8G: protected population advanced through the legal-corpus programme to **v8018 / 19,268 protected recipes**, exactly **two** recipe-body D1 shards and a certified maximum of **8 D1 subqueries/request** in the final owner run.
- Post-v8018: `LEGAL_CORPUS_BASELINE_PASS`; final hold-adjusted discovery measured **0 rights-review-eligible** remaining source cohorts under the frozen discovery/marginal-value contract.

Therefore the current continuation does **not** re-provision Cloudflare, replay protected population, retry held source cohorts, create a third shard, or reopen billing/security decisions already settled by the live programme.

## Architecture decision

The old R2-first 100k design remains useful decision lineage, but it is not the current production storage authority.

The current protected runtime follows the later no-billing-authorization architecture:

- public Pages shell;
- same-origin authenticated Worker/Pages Functions boundary;
- application-owned exact invitation authorization;
- hard-capped Free-plan posture;
- D1-based protected storage;
- exactly two earned recipe-body shards at the current v8018 population;
- fail-closed quota/error behavior;
- provider-neutral RecipeSource and corpus-build contracts;
- no automatic paid upgrade path.

The Step 4 result that “D1 is not earned by the local 100k object-index benchmark” is not a contradiction. It means corpus size alone does not justify SQL. The later D1 architecture was earned under a separate no-billing/private-auth/live-protected-runtime decision and was subsequently validated in production-shaped canaries.

## Current boundary

The scale foundation is reconciled. The active corpus/product order remains governed by the current roadmap and post-v8018 baseline.

This pass does **not** authorize:

- a 86th public recipe;
- v8019 or another protected source cohort;
- a third recipe-body shard;
- Workers Paid, R2, Zero Trust / Access, paid APIs or paid corpus licences;
- weakening provenance, rights, nutrition, allergen, dietary or permanent-exclusion gates;
- private Knowledge Core runtime dependency;
- Barbecue scheduled-lane changes.

The independent scale-development lane may now be treated as **foundation-complete** unless a future product feature or measured runtime result exposes a new scale compatibility gap.
