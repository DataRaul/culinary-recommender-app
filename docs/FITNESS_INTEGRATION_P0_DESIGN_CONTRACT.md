# D5 Fitness Integration — P0 Adapter Design Contract

Date: **2026-09-24**

Status: **PASS / D5 P0 ADAPTER DESIGN CONTRACT VALIDATED / NO RUNTIME ACTIVATION**

Entry terminal: `FURTHER_PRODUCT_FEATURES_REASSESSMENT_AFTER_D3_PASS`

## Objective

Design the smallest safe bridge from the separate Workout Recommender into Culinary Recommender without merging the two applications, creating cloud sync, importing health/injury context, or turning exercise data into nutritional or medical authority.

P0 is a **design contract only**. It does not activate fitness-driven culinary behavior.

## Verified source boundary

Source repository:

`DataRaul/Mobile-first-workout-recommendation-app`

Pinned source main:

`3fd69badda5269021728e5a5d1681aac98d17147`

The source app currently exports `workout-recommender-backup.json`, writes schema v3, accepts schemas v2/v3, stores live state in that browser's localStorage, has no account/cloud sync, and requires explicit user file permission for portable backup restore.

Culinary P0 therefore accepts only an explicitly **user-selected local backup file**. It must never read the workout app's localStorage, scan a shared folder, auto-refresh from a file, or write back to the workout repository/app.

## Exact P0 allowlist

Only these source fields may cross the boundary:

- `schemaVersion`;
- `profile.goal`;
- `profile.daysPerWeek`;
- `profile.sessionMinutes`;
- `profile.trainingWeekdays`.

The resulting Culinary-side context is limited to:

- source backup schema version;
- training goal;
- planned training days per week;
- planned session minutes;
- preferred training weekdays.

No other source field is retained by the adapter.

## Explicitly excluded fields

P0 excludes by design:

- profile name;
- experience level;
- pain/injury/safety constraints;
- equipment and gym availability;
- favorites;
- workout split/structure and exercise IDs;
- draft/active/previous programme details;
- active session;
- workout history;
- weights, repetitions, RIR or other set performance;
- readiness-check state;
- preference details;
- unknown future fields.

The raw backup is parse-only input and is not a Culinary persistence artifact. A hash of the raw backup is also not persisted because it would create an unnecessary fingerprint of a file containing excluded personal data.

## Source-value validation

P0 mirrors only source-app values verified at the pinned source SHA:

- goals: strength, hypertrophy, power, endurance, general fitness, conditioning, mobility;
- training days: 2–6 per week;
- session length: 30, 45, 60 or 75 minutes;
- weekdays: integer 0–6, unique, and when supplied their count must match days per week.

Unsupported schema or malformed allowlisted fields fail closed.

## Behavioral firewalls

Fitness context has **no authority** to:

- alter recipe ranking or eligibility;
- override allergens, dietary restrictions or permanent exclusions;
- become nutrition evidence;
- estimate calorie burn, TDEE or energy expenditure;
- prescribe calories, macros, supplements or therapeutic diets;
- infer injury, disease or medical state;
- admit public recipes;
- mutate the protected corpus.

Any future use of the context requires a separate behavior contract with deterministic tests and normal browser acceptance.

## Failure behavior

- invalid JSON: reject;
- unsupported backup schema: reject;
- missing profile: reject;
- invalid allowlisted values: reject;
- source app unavailable: Culinary remains fully usable and unchanged;
- sensitive-only data: no context is derived from it.

No failure in the fitness adapter may block ordinary Culinary use.

## Repository implementation

Validation run **#1063 / 36028970545** passed the deterministic and browser suite for the built design contract. A final PR-head validation remains mandatory after recording this evidence.

This design gate adds:

- `config/fitness_integration_p0.json`;
- `scripts/fitness-integration-p0.mjs`;
- `tests/fitness-integration-p0.test.js`.

The deterministic extraction helper exists to prove field minimization and fail-closed semantics. It is not wired into browser/runtime behavior in this gate.

## Hard non-authorizations

P0 does not authorize:

- adapter UI/runtime activation;
- culinary behavior changes;
- raw workout backup persistence;
- automatic cross-app access or cloud sync;
- workout-app writes;
- calorie/TDEE estimation;
- individualized macro/supplement/medical advice;
- protected D1 writes or a third shard;
- paid infrastructure/API;
- Knowledge Core writes;
- Barbecue workflow/state mutation.

## Next gate

After this design contract validates:

`D5_FITNESS_INTEGRATION_P0_ADAPTER_PROTOTYPE`

That prototype must remain local/user-initiated, display the exact allowlisted context before any persistence, prove excluded fields cannot cross the boundary, and still must not activate fitness-derived culinary ranking or nutrition behavior.
