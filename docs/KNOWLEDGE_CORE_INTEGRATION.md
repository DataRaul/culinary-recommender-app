# Knowledge Core Integration — Culinary Lab

Status: **BRANCH-LOCAL ARCHITECTURE RECONCILIATION / NO PUBLIC BEHAVIOR CHANGE**

Reconciled: 2026-09-01

## Canonical architecture

This repository consumes `DataRaul/knowledge-core` through the same generalized platform-adapter architecture used by other downstream repositories.

Canonical Knowledge Core architecture:

`docs/KNOWLEDGE_CORE_PLATFORM_ADAPTER_ARCHITECTURE.md`

Current reconciliation pin:

- Knowledge Core `main`: `043de7274ee85ce56ef1618f9b1bb31f7a99f6fc`
- canonical architecture rule: **Expose Knowledge Core as the platform, not each individual capability as a separate repo-local integration.**

The Culinary Lab therefore uses one integration model:

```text
current Culinary Lab question
        ↓
Culinary Lab establishes local facts / evidence / authority
        ↓
thin generalized Knowledge Core routing boundary
        ↓
smallest sufficient KC capability / culinary_nutrition object set
        ↓
return to Culinary Lab evidence, tests and gates
        ↓
Culinary Lab remains operational authority
```

The specialist Knowledge Core adapter `adapters/repo_culinary_recommender_app.md` is consumed **through** this generalized platform boundary. It does not create a second Culinary-specific integration architecture.

## Current private Brain reference

At this reconciliation checkpoint:

- active Knowledge Core branch: `agent/culinary-nutrition-brain-p0`
- branch head: `81d19c9e84c1f685fb555d0c584c7389fa370df7`
- branch comparison to KC `main`: **49 ahead / 3 behind**
- merge base: `0ab4c0d7a1882a494bc92ff0bdd6421764394eca`
- KC `main`-only changes are currently confined to `ops/WORKSTREAM_STATUS.md` and `ops/runner_registry.csv`
- open Knowledge Core PRs at this checkpoint: **none**

These are development/reference facts only. The public app's already-reviewed calibration artifact remains pinned to the narrower accepted Knowledge Core commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743` until a separately reviewed export changes that pin.

A newer private Brain head does not silently change deployed behavior.

## Authority split

### Knowledge Core owns reusable reasoning

Examples include:

- culinary/nutrition evidence hierarchy and inference boundaries;
- healthy-pattern reasoning;
- food-composition identity/form/uncertainty reasoning;
- food-safety reasoning boundaries;
- planning, affordability, pantry reuse and waste principles;
- culinary technique mechanisms;
- functional substitution reasoning;
- World Recipe Atlas discovery/identity/structure/variant methodology;
- transformation and technique-prerequisite methodology;
- freshness/trend methodology when developed;
- reusable corpus-critic methodology;
- recommendation calibration and negative capability;
- reusable coaching and cross-domain methods.

### Culinary Lab owns current product and empirical truth

This repository remains authoritative for:

- project-authored and admitted public recipe records;
- exact authored instructions;
- external `RecipeSource` records and exact source revisions;
- public ingredient ontology and quantity normalization;
- allergens, dietary restrictions and permanent exclusions;
- substitutions actually implemented;
- bounded NutritionSource evidence and source-selection logic;
- authoritative nutrition calculations and blocker diagnostics;
- recommendation ranking and planner behavior;
- user/profile/pantry/local state;
- UI, persistence and browser behavior;
- deterministic/browser tests;
- public runtime bundles;
- Gate F / F2 implementation and public admission decisions.

Knowledge Core must not replace these facts. This repository must not duplicate reusable Brain reasoning merely for convenience.

## Narrow routing rule

For a material Brain-informed question, record enough information to make the route auditable:

1. the project question / decision type;
2. the exact Culinary Lab commit or state being evaluated;
3. the smallest sufficient Knowledge Core capability/domain/object set;
4. the exact Knowledge Core commit or public-safe export pin;
5. required current project evidence;
6. missing reasoning/evidence or contradictions;
7. local tests/gates that remain authoritative;
8. any human authority required.

Do **not** load the entire Culinary Brain for every task. Do not create separate per-capability repo integrations.

## Public-safe export path

The only behavior-driving direction is:

```text
Knowledge Core canonical reasoning
        ↓
bounded offline review
        ↓
versioned / source-safe public export
        ↓
Culinary Lab adapter
        ↓
deterministic tests
        ↓
normal PR + browser acceptance
        ↓
public runtime
```

Every behavior-driving export must preserve:

- exact Knowledge Core pin;
- export schema/version;
- intended scope;
- relevant evidence/source state;
- explicit non-authorities;
- deterministic downstream acceptance.

Private Knowledge Core must never become a browser/runtime dependency.

## Reverse Lab → Brain feedback

Information may also flow safely in the opposite direction:

```text
public-safe Lab metadata / blocker evidence
        ↓
pinned offline snapshot
        ↓
Knowledge Core critic / reasoning
        ↓
review priorities / research questions / candidate Brain work
        ↓
separate governed Brain development
```

This reverse path can prioritize Brain research, Atlas verification, transformation work, technique gaps, nutrition/yield research or freshness-method development.

It cannot automatically promote canonical Brain knowledge.

App measurements are evidence for Brain review, not direct writes into Brain truth.

## Atlas / RecipeSource firewall

Preserve these non-equivalences:

- `IDENTITY_VERIFIED != STRUCTURE_VERIFIED`;
- `STRUCTURE_VERIFIED != VARIANT_AWARE`;
- `VARIANT_AWARE != TRANSFORMATION_AWARE`;
- `TRANSFORMATION_AWARE != APP_AUTHORING_ELIGIBLE`;
- `APP_AUTHORING_ELIGIBLE != PUBLIC_EXPORT_ELIGIBLE`.

A verified Atlas family is not a public recipe. A Brain app-authoring brief cannot bypass Gate F/F2, rights/provenance, ontology, hard metadata, nutrition or safety review.

Likewise, a public recipe record does not become canonical Brain knowledge or authoritative NutritionSource evidence merely because it is present in the app.

## Current Lab → Brain delta

The active private KC Culinary adapter/corpus critic predates the current public-app state. It is still pinned to an older Gate F/F2 snapshot and does not yet reflect the final merged PR #27 category-hint semantics.

Current public-app facts that a dedicated Brain lane may consume as public-safe reconciliation inputs include:

- app `main`: `e3d87bdec2880aae2b9ae59a8cde106a9bafb0c8`;
- Nutrition B8: **COMPLETE / MERGED**;
- authored authoritative nutrition: **1 / 76**;
- authoritative recipe: `indian_chicken_spinach_curry`;
- unsupported quantity blockers: **7**;
- missing-density blockers: **133**;
- ambiguous portions: **20**;
- mixed incompatible carbohydrate semantics: **16**;
- Gate F2: **CONTROL PLANE MERGED / RUNTIME GATED**;
- F2 merged lineage: PR #24 revision-aware control plane, PR #25 source-presence holds, PR #27 bounded category hints;
- F2 newly admitted recipes: **0**;
- category hints are current weak metadata only and are not revision-pinned evidence, authenticity, trend, nutrition, hard-metadata, recommendation or admission authority.

Those facts may update the Brain's audit inputs and research priorities. They do not authorize Knowledge Core promotion or public behavior.

## Current separation of development lanes

Repository development and Brain development should remain separate whenever possible:

- **Culinary Lab lane**: public app code/data/evidence, recipe unlocks, F2 review/admission tooling, status/integration docs, deterministic/browser validation.
- **Culinary Brain lane**: Knowledge Core branch reconciliation, canonical culinary reasoning, Atlas verification methodology/cohorts, freshness/trend methodology, transformations, technique-prerequisite/deliberate-practice reasoning, reusable critic updates.

Cross-repository changes require explicit reconciliation at the boundary; neither lane should casually write into the other's authority surface.

## No behavior change from this architecture reconciliation

This document changes integration architecture/status only. It does not authorize:

- recommendation-ranking changes;
- eligibility changes;
- substitution changes;
- new nutrition behavior;
- new public recipes;
- Atlas publication;
- runtime Knowledge Core access;
- automatic Lab → Brain promotion;
- automatic Brain → Lab behavior.

Normal repository evidence, deterministic tests, browser acceptance, PR/Actions gates and human policy gates remain controlling.
