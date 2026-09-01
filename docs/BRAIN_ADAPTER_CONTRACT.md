# Culinary & Nutrition Brain — Public App Adapter Contract V1

Authorized: 2026-08-31

## Status

**Brain P0 is authorized.** The already-reviewed public calibration foundation remains pinned to `DataRaul/knowledge-core` commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743` (`culinary_nutrition`).

Private Brain/Atlas development has advanced beyond that public calibration pin. At the 2026-09-01 reconciliation checkpoint the active private branch is `agent/culinary-nutrition-brain-p0` at `81d19c9e84c1f685fb555d0c584c7389fa370df7`, 49 commits ahead of and 3 behind Knowledge Core `main` `043de7274ee85ce56ef1618f9b1bb31f7a99f6fc`.

The newer private branch head is a development/reference state only. It does **not** silently update the public artifact or authorize a recommendation-ranking change.

This document authorizes the **adapter contract and deterministic calibration scaffolding**. It does **not** silently authorize ranking, eligibility, substitution, recipe admission, nutrition or other runtime behavior.

## Generalized Knowledge Core platform boundary

Culinary uses the same generalized Knowledge Core platform-adapter architecture as other downstream repositories.

See `docs/KNOWLEDGE_CORE_INTEGRATION.md` for the project-side routing contract and `DataRaul/knowledge-core/docs/KNOWLEDGE_CORE_PLATFORM_ADAPTER_ARCHITECTURE.md` for the canonical Knowledge Core architecture.

The required pattern is:

```text
Culinary Lab project question / current evidence
        ↓
thin generalized Knowledge Core routing boundary
        ↓
smallest sufficient KC capability / culinary_nutrition object set
        ↓
return to Culinary Lab evidence, tests and gates
        ↓
Culinary Lab remains operational authority
```

Knowledge Core's specialist `adapters/repo_culinary_recommender_app.md` is consumed **through** this generalized platform boundary. It is not a second Culinary-specific integration architecture.

Do not copy whole Brain objects, coaching implementations or domain logic into this repository. Do not load every Brain object for every task. Route narrowly.

## Ownership boundary

Knowledge Core owns reusable reasoning such as:
- evidence authority and uncertainty boundaries;
- healthy-diet pattern priors for generally healthy adults;
- culinary technique/workflow principles;
- substitution-by-function reasoning;
- food-safety scope and escalation boundaries;
- World Recipe Atlas discovery/identity/structure/variant methodology;
- transformation and technique-prerequisite reasoning;
- reusable corpus-critic methodology;
- freshness/trend methodology when developed;
- recommendation calibration / negative capability;
- public-export eligibility.

This public repository remains authoritative for:
- exact project-authored and admitted public recipe data;
- external `RecipeSource` records and exact source-revision provenance;
- public ingredient ontology and quantity normalization;
- bounded composition and portion evidence;
- exact nutrition calculations and blocker diagnostics;
- exact recommendation calculations and hard filters;
- implemented substitutions;
- user/profile/pantry/availability state;
- public runtime behavior, UI, persistence and tests;
- Gate F/F2 runtime admission decisions.

Knowledge Core must not substitute for current app truth. Public app facts do not automatically become canonical reusable Brain knowledge.

## Runtime rule

The browser app must never fetch, import or depend on private Knowledge Core at runtime.

The only permitted behavior-driving flow is:

```text
Knowledge Core canonical object(s)
        ↓ offline bounded review
narrow versioned public-safe export
        ↓ committed static app artifact
app deterministic adapter / tests
        ↓ normal PR validation + browser acceptance
public runtime
```

## Current public artifact

`src/data/brain-public-policy-v1.js` is a **calibration-only** policy artifact pinned to the accepted Knowledge Core calibration commit above. It records authority ordering, public reasoning dimensions and hard boundaries. Nothing imports it into ranking code yet.

State: `CALIBRATION_ONLY_NO_RANKING_CHANGE`.

A future public export must pin its own exact Knowledge Core commit/schema. The private branch head is not a moving runtime dependency.

## World Recipe Atlas / RecipeSource boundary

Private Brain verification states are deliberately non-equivalent:

- `IDENTITY_VERIFIED != STRUCTURE_VERIFIED`;
- `STRUCTURE_VERIFIED != VARIANT_AWARE`;
- `VARIANT_AWARE != TRANSFORMATION_AWARE`;
- `TRANSFORMATION_AWARE != APP_AUTHORING_ELIGIBLE`;
- `APP_AUTHORING_ELIGIBLE != PUBLIC_EXPORT_ELIGIBLE`.

At the current private branch checkpoint the Atlas has 338 seed families across 20 macro-regional buckets, with 20 identity/structure/variant-aware families, four transformation-aware families, P4 technique linkage for all 20 initial promoted families, and **0 app-authoring / 0 public-export eligible**.

Those states cannot admit a public recipe.

A verified Atlas family or app-authoring brief must still pass the app's Gate F/F2 rights/provenance path, ontology/hard-metadata review, ingredient/quantity semantics, allergen/dietary/permanent-exclusion rules, NutritionSource firewall, deterministic tests and normal public acceptance.

Source recipe content/public runtime ingestion belongs to the Culinary Lab's `RecipeSource` and Gate F/F2, not to the private Brain.

## Reverse Lab → Brain feedback

Public-safe app metadata and measured blocker state may be consumed offline by Knowledge Core as review/research input:

```text
pinned public-safe Lab snapshot
        ↓
Knowledge Core critic / reasoning
        ↓
review priorities / research questions
        ↓
separately governed Brain development
```

This may identify what the Brain should research next. It may not directly promote canonical Brain conclusions.

The active private Culinary adapter/corpus critic currently predates the final public-app PR #27 category-hint semantics. A separate Brain lane should reconcile that stale pin against current app `main` before another large Brain/Atlas expansion wave.

Category hints remain current weak metadata only. They are not revision-pinned evidence and cannot prove authenticity, trend status, hard metadata, nutrition, dietary truth, recommendation eligibility or public admission.

## Allowed public export classes

A future Brain-derived export may contain only source-safe normalized material such as:
- versioned policy priors;
- technique/difficulty criteria at the exact verified scope;
- functional substitution metadata;
- healthy-pattern contribution tags;
- confidence / uncertainty / explanation labels;
- bounded app-authoring briefs that contain only rights-safe, source-safe normalized reasoning.

## Prohibited exports

Do not export:
- copyrighted recipe/book/video prose or bulk transcripts;
- private source notes;
- individualized diagnosis, therapeutic-diet instructions or supplement doses;
- creator health claims treated as nutrition authority;
- raw source tables whose reuse terms do not permit the public artifact;
- instructions that relax allergens, dietary restrictions, permanent exclusions or other hard constraints;
- dynamic URLs or code that fetches Knowledge Core at runtime;
- Atlas state as automatic recipe/publication eligibility;
- corpus-critic findings as admission authority.

## Evidence authority order

1. hard safety and dietary constraints;
2. official nutrition and food-safety evidence;
3. bounded culinary operator heuristics within their operational scope;
4. soft user preferences.

No lower layer can override a higher hard boundary.

## Integration gate for behavior changes

Before any Brain-derived rule changes ranking, eligibility, substitutions or user-visible nutrition behavior:
1. identify the exact Knowledge Core commit and canonical object(s);
2. define the project question / decision type and smallest sufficient Knowledge Core capability set;
3. define a narrow public-safe schema/version;
4. prove licensing/source-safe derivation;
5. record required current app evidence and unresolved gaps;
6. keep hard constraints fail-closed;
7. add deterministic regression tests including negative/shortfall cases;
8. run `npm run validate` and browser acceptance;
9. review the diff against the accepted V0.9.3 shell and current V1 evidence policy;
10. merge only after normal PR/CI gates and any required human gate pass.

## Residual Brain gaps

The P0 free-source pass is intentionally saturated for general fundamentals. Additional long-form content is gap-triggered:
- Harold McGee only when deeper food chemistry changes a decision;
- Samin Nosrat selectively if flavor-balancing diagnosis remains under-specified;
- Ruhlman selectively when a generative ratio/family gap remains after current technique/Atlas normalization;
- peer-reviewed yield/nutrient-retention research when it can unlock authoritative recipe nutrition;
- cuisine-specific experts/primary sources for authenticity/variant/transformation work rather than one generic authority.

`The Food Lab` is not an immediate ingestion priority because the current free Kenji corpus already supplies substantial overlapping mechanism evidence.

Current private Brain continuation should prioritize branch/main reconciliation and current-Lab input synchronization before another broad content wave unless newer GitHub state makes that obsolete.
