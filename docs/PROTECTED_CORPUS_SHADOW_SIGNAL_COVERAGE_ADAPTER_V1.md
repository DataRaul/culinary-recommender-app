# V21 Shadow Signal Coverage Adapter V1

Date: 2026-10-03

## Purpose

The previous meal-slot gate showed that the exact 500-recipe shadow cohort has enough volume, safety isolation, determinism and planner diversity, but only 36.1345% of the production scorer's positive weight is backed by finite evidence.

This gate tests the smallest evidence-preserving adapter that can improve that coverage without fabricating nutrition, price, novelty, meal-prep or dietary facts.

## Adapter

The only newly populated scoring input is **difficulty**, and only when the normalization overlay already holds an `EXACT_SOURCE_NORMALIZATION` or `REVIEWED_MAPPING` difficulty value.

The source scale remains preserved in provenance. For the shadow production-scorer compatibility probe only:

- numeric 1–5 maps to runtime 1,2,3,4,4;
- EASY maps to 1;
- MEDIUM maps to 2;
- HARD maps to 4.

This cross-scale mapping is a product-scoring hypothesis, not a source fact and not live authority.

No other missing scorer field may be populated by this adapter.

## Acceptance

The gate must preserve the exact frozen 500 cohort, preserve meal-slot eligibility counts, keep normal-mode and restricted-profile leakage at zero, improve top-20 scorer evidence coverage by at least 5 percentage points for every slot, and preserve deterministic complete seven-slot planners.

The **50%** live-readiness evidence floor from the preceding gate is unchanged. Improving coverage does not by itself authorize live recommendation exposure.

## Boundaries

No D1 reads/writes, protected-body rewrite, public-runtime widening, recommendation admission, live difficulty translation, live meal-role translation, candidate classification promotion, dietary/allergen promotion, Knowledge Core write, paid model/API, third shard, or Barbecue mutation is authorized.
