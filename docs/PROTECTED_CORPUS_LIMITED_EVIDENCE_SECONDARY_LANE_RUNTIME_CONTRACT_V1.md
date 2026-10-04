# V21 Limited-Evidence Secondary Lane Runtime Contract V1

Date: 2026-10-04

## Contract decision

The 271-candidate limited-evidence lane may proceed to a bounded implementation candidate, but only behind a strict runtime boundary.

This contract does **not** activate the lane.

## Request boundary

The secondary lane is:

- authenticated-owner-only for V1;
- disabled by default;
- available only through explicit mode `limited_evidence_secondary`;
- restricted to an unrestricted profile with no allergens, excluded ingredients or unavailable ingredients;
- capped at 20 returned secondary results;
- never used as an automatic fallback from the primary recommendation lane.

## Response boundary

Primary validated recommendations and limited-evidence suggestions must be returned and rendered as separate lanes.

Secondary candidates:

- cannot displace primary recipes;
- cannot be merged into the primary score ordering;
- must be labeled **Limited-evidence suggestions**;
- must carry an explicit disclosure that nutrition, protein, budget, meal-prep suitability and novelty may be unknown;
- must retain source provenance and recommendation-validation state.

Unknown values remain unknown and may not be rendered or implied as known.

## Candidate universe

V1 uses only the exact frozen **271 meal-targetable candidates** already evaluated. The manifest must be immutable for the V1 implementation.

The remaining **229** frozen-cohort recipes stay held. MAIN-to-lunch/dinner remains a product-slot hypothesis rather than a source fact. DESSERT, BEVERAGE, SIDE and unknown-role recipes remain outside this runtime lane.

## Cost and rollback

The implementation must be read-only:

- 0 D1 writes;
- 0 full-corpus scans per request;
- at most 8 D1 subqueries per request;
- top-K hydration only;
- no third shard;
- no paid infrastructure.

A single feature flag must disable the lane and restore current primary-only behavior without data migration. The existing 86-recipe primary lane must remain behaviorally independent.

## Authority

This contract authorizes only the next bounded implementation package. It does not authorize owner-canary activation, public runtime widening, recommendation admission, protected D1 writes, or candidate-manifest mutation.

Terminal:

`V21_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_CONTRACT_PASS__BOUNDED_IMPLEMENTATION_NEXT`

Next:

`V21_LIMITED_EVIDENCE_SECONDARY_LANE_BOUNDED_IMPLEMENTATION_V1`
