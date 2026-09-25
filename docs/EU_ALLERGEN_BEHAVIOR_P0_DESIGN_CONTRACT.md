# EU Allergen Behavior P0 Design Contract

State: **DESIGN PASS CANDIDATE — ACTIVATION NOT AUTHORIZED**  
Lane: **Lane 3 — EU regulatory truth**  
Date: **2026-09-25**  
Upstream: `EU_REGULATORY_ALLERGEN_GAP_AUDIT_V1_PASS`

## Decision

The smallest defensible behavior candidate is **celery only**.

The audit found five missing Annex II headline category tokens, but celery is materially different from the other four:

- `celery` already exists as a canonical ingredient;
- the ingredient currently has an empty allergen array;
- at least one public recipe uses that canonical ingredient;
- the existing hard-filter architecture already supports additive string allergen tokens.

This makes celery a narrow, testable correction candidate without inventing new ingredient identities or concentration semantics.

## Proposed P0 activation — not yet authorized

If separately authorized, P0 would make exactly these behavior changes:

1. add `celery` to the canonical celery ingredient's allergen array;
2. add `celery` to the known public celery recipe's declared-allergen metadata;
3. add a **Celery** checkbox to the existing declared-allergen UI;
4. add a deterministic invariant that every public recipe's declared allergens are a superset of the allergen union implied by its canonical ingredients;
5. prove in unit/browser acceptance that selecting celery blocks the celery-containing recipe before scoring and constrains substitutions.

No storage-schema bump is required: profile allergen arrays already preserve extensible string tokens.

## Why P0 does not activate the other missing categories

### Mustard, lupin and molluscs

The current canonical ingredient ontology does not contain these identities. Adding a hard-filter vocabulary before a canonical ingredient exists would create UI surface without evidence-bearing recipe semantics. They remain future ontology-triggered gates.

### Sulphur dioxide / sulphites

Annex II is threshold-dependent. A boolean ingredient tag cannot truthfully represent a concentration threshold. This requires a separate evidence/schema design before any behavior is considered.

## Residual known gaps

Even after a future celery activation:

- `tree_nut` remains an aggregate category token while the ontology contains only a subset of Annex II named nut species;
- `gluten` remains an aggregate token and does not model every named cereal/exception individually;
- mustard, lupin and molluscs remain absent until exact canonical identities are needed;
- sulphites remain blocked on threshold-aware semantics.

P0 must not present itself as complete EU Annex II coverage.

## Required acceptance for future activation

The activation PR must prove:

- allergen hard filtering still occurs before scoring;
- celery selection persists in local profile state;
- the public celery recipe is blocked when celery is declared;
- existing fish and other allergen browser acceptance remains green;
- substitution safety cannot reintroduce celery for a celery-declaring profile;
- recipe declared-allergen metadata covers the canonical ingredient-allergen union;
- cross-contamination / medical-boundary messaging remains unchanged;
- full deterministic and Chromium acceptance passes.

## Authority boundary

This design contract changes **no runtime behavior**.

Activation is blocked because it changes hard recommendation eligibility and safety filtering, which is outside the owner-authorized research/scaffolding boundary for Lane 3.

The future implementation gate is:

`EU_ALLERGEN_CELERY_P0_ACTIVATION — BLOCKED_PENDING_OWNER_AUTHORIZATION`.

All existing Lane 3 isolation remains: zero protected D1, zero protected-body access, zero NutritionSource authority change, zero Knowledge Core write, zero Barbecue mutation and zero paid infrastructure/API change.
