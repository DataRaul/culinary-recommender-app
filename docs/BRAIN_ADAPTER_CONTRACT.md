# Culinary & Nutrition Brain — Public App Adapter Contract V1

Authorized: 2026-08-31

## Status

**Brain P0 is authorized.** The Knowledge Core foundation and bounded free operator pass are constructed on `DataRaul/knowledge-core` commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743` (`culinary_nutrition`).

This document authorizes the **adapter contract and deterministic calibration scaffolding**. It does **not** silently authorize a recommendation-ranking change.

## Ownership boundary

Knowledge Core owns reusable reasoning such as:
- evidence authority and uncertainty boundaries;
- healthy-diet pattern priors for generally healthy adults;
- culinary technique/workflow principles;
- substitution-by-function reasoning;
- food-safety scope and escalation boundaries;
- public-export eligibility.

This public repository remains authoritative for:
- recipe and ingredient data;
- bounded composition and portion evidence;
- exact recommendation calculations and hard filters;
- user/profile/pantry/availability state;
- public runtime behavior and tests.

## Runtime rule

The browser app must never fetch, import or depend on private Knowledge Core at runtime.

The only permitted flow is:

```text
Knowledge Core canonical object(s)
        ↓ offline review
narrow versioned public-safe export
        ↓ committed static app artifact
app deterministic adapter / tests
        ↓ PR validation + browser acceptance
public runtime
```

## Current public artifact

`src/data/brain-public-policy-v1.js` is a **calibration-only** policy artifact pinned to the Knowledge Core commit above. It records authority ordering, public reasoning dimensions and hard boundaries. Nothing imports it into ranking code yet.

State: `CALIBRATION_ONLY_NO_RANKING_CHANGE`.

## Allowed public export classes

A future Brain-derived export may contain only source-safe normalized material such as:
- versioned policy priors;
- technique/difficulty criteria;
- functional substitution metadata;
- healthy-pattern contribution tags;
- confidence / uncertainty / explanation labels.

## Prohibited exports

Do not export:
- copyrighted recipe/book/video prose or bulk transcripts;
- private source notes;
- individualized diagnosis, therapeutic-diet instructions or supplement doses;
- creator health claims treated as nutrition authority;
- raw source tables whose reuse terms do not permit the public artifact;
- instructions that relax allergens, dietary restrictions, permanent exclusions or other hard constraints;
- dynamic URLs or code that fetches Knowledge Core at runtime.

## Evidence authority order

1. hard safety and dietary constraints;
2. official nutrition and food-safety evidence;
3. bounded culinary operator heuristics within their operational scope;
4. soft user preferences.

No lower layer can override a higher hard boundary.

## Integration gate for behavior changes

Before any Brain-derived rule changes ranking, eligibility, substitutions or user-visible nutrition behavior:
1. identify the exact Knowledge Core commit and canonical object(s);
2. define a narrow public-safe schema/version;
3. prove licensing/source-safe derivation;
4. keep hard constraints fail-closed;
5. add deterministic regression tests including negative/shortfall cases;
6. run `npm run validate` and browser acceptance;
7. review the diff against the accepted V0.9.3 shell and current V1 evidence policy;
8. merge only after normal PR/CI gates pass.

## Residual Brain gaps

The P0 free-source pass is intentionally saturated for general fundamentals. Additional long-form content is gap-triggered:
- Harold McGee only when deeper food chemistry changes a decision;
- Samin Nosrat selectively if flavor-balancing diagnosis remains under-specified;
- peer-reviewed yield/nutrient-retention research when it can unlock authoritative recipe nutrition;
- cuisine-specific experts/primary sources for authenticity/adaptation rather than one generic authority.

`The Food Lab` is not an immediate ingestion priority because the current free Kenji corpus already supplies substantial overlapping mechanism evidence.
