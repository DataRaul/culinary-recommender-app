# Culinary Brain C3 — Deterministic Recommendation Prior Calibration V1

C3 asks a narrow question after C2: has any C2 soft semantic field earned the right to influence deterministic recommendation ranking?

The answer is determined fail-closed against the exact current 85-recipe public runtime, the C2 terminal summary, the pinned public Brain policy, and the current deterministic recommender.

C3 runs a fixed 12-case profile/context matrix twice and requires identical ranking digests with zero hard-constraint violations. It also verifies that the Brain policy remains calibration-only and is not imported into recommendation runtime code.

C2 classified only dish category and meal role. Neither is promoted in C3:
- dishCategory remains review-only and the current scorer has no user-facing dish-category preference signal;
- mealRole remains review-only and current meal-type semantics are a hard eligibility scope, so an inferred soft prior cannot duplicate or weaken that boundary.

Therefore a valid C3 PASS retains the current deterministic scorer unchanged and records zero new runtime prior promotions. This is an earned negative calibration result, not a failure: the system refuses to manufacture ranking value from review-only semantics.

C3 performs no protected D1/body access, does not widen recommendation/public authority, does not alter nutrition/dietary/source-rights authority, does not add a Knowledge Core runtime dependency, and does not mutate Barbecue.

Target terminal: CULINARY_BRAIN_C3_PRIOR_CALIBRATION_PASS__NO_NEW_RUNTIME_PRIOR_PROMOTION__C4_READY.
