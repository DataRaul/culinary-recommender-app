# D5 Fitness Integration — P0 Adapter Prototype

Date: **2026-09-24**

Status: **BUILT / VALIDATION PENDING**

## Scope

This prototype implements the already-approved one-way, user-selected local workout-backup boundary without activating fitness-derived Culinary behavior.

The browser accepts only a file explicitly selected by the user. It validates workout backup schemas 2/3 and extracts exactly:

- source backup schema version;
- training goal;
- planned training days per week;
- planned session minutes;
- preferred training weekdays.

The user sees this minimized context in a **not-saved preview** before persistence. Only after an explicit save action may the five-field context be stored in Culinary local browser state. The raw backup, a raw-file hash, names, experience level, injuries/pain, equipment, workout structure, active programme/session, history, loads/reps/RIR, readiness state, favorites, preference details and unknown future fields are discarded at the adapter boundary.

## Behavioral firewall

The stored context is intentionally inactive. It is not passed to recipe eligibility, ranking, planning, allergens, dietary rules, nutrition, calorie/TDEE logic, supplements, medical/injury logic, protected corpus state or public recipe admission.

The existing Culinary profile remains the only recommendation input. Removing the stored fitness context is supported directly from the Profile surface.

## Implementation

- `src/domain/fitness-integration-p0.js` — fail-closed parser/extractor and persistence sanitizer.
- `src/domain/storage.js` — stores only a sanitized five-field `fitnessContext` or `null`.
- `src/app.js` — user-selected file input, pre-persistence preview, explicit save and remove controls.
- `sw.js` — caches the adapter module so the existing offline shell remains coherent.
- deterministic tests prove exact field minimization and state sanitization.
- browser acceptance proves preview-before-save, sensitive-field exclusion, exact persisted shape and unchanged Culinary profile.

## Non-authorizations

This prototype does not authorize fitness-derived culinary ranking, calorie/TDEE estimation, nutrition or supplement prescription, medical inference, cloud sync, automatic folder/file reads, cross-app localStorage reads, workout-app writes, protected D1 writes, third-shard creation, paid infrastructure/API, Knowledge Core writes or Barbecue mutation.

After validation, further D5 behavior work is deferred and the independent app-development lane proceeds to `PROTECTED_CORPUS_RUNTIME_USABILITY_P1_PRIVATE_BROWSE_SEARCH_CANARY`.
