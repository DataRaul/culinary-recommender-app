# V21 Limited-Evidence Secondary Lane Bounded Implementation V1

Date: 2026-10-04

## Decision

The runtime contract is implemented as a dormant, owner-only-capable secondary-lane adapter without live exposure.

This package does **not** activate the lane, wire a live API action, change the validated 86-recipe primary ranking, or admit any protected recipe into the primary recommendation surface.

## What is implemented

- A server-side runtime adapter that requires one explicit feature flag plus explicit mode `limited_evidence_secondary`.
- Fail-closed eligibility for anything except an unrestricted profile with no allergens, excluded ingredients or unavailable ingredients.
- Separate primary and secondary response lanes; secondary results can never displace or merge into the primary ranking.
- A hard top-20 hydration boundary and an 8-subquery ceiling, with zero writes and zero full-corpus scans.
- Required limited-evidence disclosure, explicit unknown soft-signal list, source-provenance preservation and non-primary validation state.
- A single feature-flag rollback path that returns current primary-only behavior without invoking the secondary hydrator.

## Frozen candidate universe

CI reconstructs the exact pinned v8018 evidence chain, re-derives the exact 500 quality cohort, applies the approved MAIN-to-lunch/dinner shadow policy and source-backed difficulty adapter, then filters the exact meal-targetable cohort.

The bounded candidate universe is **271** recipes with manifest digest:

`59ba7615f03ea5ab72637fd1f38dc5ebaba4124d50f3cfb412c2f814f8aacd1d`

The 500-quality-cohort digest remains:

`33a63f8971d0aa6e58f7f7f6e64a7b560f7d195d0624c8f679677d2999bcf7c7`

The generated runtime bundle is a CI artifact only in this gate. It is not committed to or loaded by the live runtime.

## Authority boundary

Authorized here: bounded implementation and deterministic reconstruction/testing only.

Not authorized here: owner-canary activation, live API wiring, public widening, recommendation admission, D1 reads or writes by this gate, candidate-manifest mutation, Knowledge Core writes, paid infrastructure, third-shard use, or Barbecue mutation.

Terminal on pass:

`V21_LIMITED_EVIDENCE_SECONDARY_LANE_BOUNDED_IMPLEMENTATION_PASS__OWNER_CANARY_AUTHORIZATION_REQUIRED`

Next gate:

`V21_LIMITED_EVIDENCE_SECONDARY_LANE_OWNER_CANARY_AUTHORIZATION_REVIEW_V1`
