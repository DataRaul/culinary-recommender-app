# V21 Limited-Evidence Secondary Lane — Full Owner 271 Rollout V1

Date: 2026-10-05

## Decision

The owner authorized the exact frozen **271-candidate** limited-evidence secondary universe for the authenticated owner-only product surface.

This is a widening of the already accepted V21 owner canary, not a primary-recommendation admission. The validated primary runtime remains **86** recipes and public recommendation behavior remains unchanged.

## Runtime shape

- Endpoint: `/api/protected-corpus/limited-evidence-secondary`.
- Explicit mode: `limited_evidence_secondary`.
- Exact frozen candidate manifest digest: `59ba7615f03ea5ab72637fd1f38dc5ebaba4124d50f3cfb412c2f814f8aacd1d`.
- The accepted fixed unrestricted shadow profile is retained for this first full-owner rollout; restricted profiles fail closed.
- Meal eligibility remains breakfast **22**, lunch **207**, dinner **207**, snack **42**.
- Results are paginated and capped at **20 hydrated recipes per request**, allowing the owner to traverse the complete eligible surface without increasing the request-level D1 envelope.
- Every result remains labeled **Limited-evidence suggestions** and `LIMITED_EVIDENCE_NOT_PRIMARY_VALIDATED`.

## Safety / cost boundaries

The rollout remains authenticated-owner-only, read-only, two-shard, zero-write and zero-full-scan. At most eight D1 subqueries are allowed per request including authentication. The existing `CULINARY_LIMITED_EVIDENCE_SECONDARY_LANE_V1=0` kill switch disables the lane without migration.

No public runtime widening, primary/public recommendation admission, candidate mutation, Knowledge Core write, paid model/API, third shard, or Barbecue mutation is authorized.

## Terminal and next gate

Implementation target:

`V21_LIMITED_EVIDENCE_SECONDARY_LANE_FULL_OWNER_271_ROLLOUT_PASS__OWNER_PRODUCT_ACCEPTANCE_REQUIRED`

Next gate after green deployment is authenticated owner product acceptance of pagination, labeling, provenance, and bounded read-only behavior.
