# EU Regulatory Truth Scaffold V1

State: **EU_REGULATORY_TRUTH_SCAFFOLD_V1_PASS**  
Owner-authorized lane: **Lane 3**  
Date: **2026-09-25**  
Gate: **EU_REGULATORY_TRUTH_SCAFFOLD_V1_PASS — EARNED**

## Objective

Create a bounded, audit-only source layer for EU/EFSA regulatory and food-classification truth while preserving the existing separation between RecipeSource, NutritionSource and regulatory evidence.

This gate does **not** implement regulatory product behavior. It only establishes source identity, authority, legal-weight semantics, currentness requirements and deterministic isolation.

## Isolation contract

Lane 3 must remain independent of the two D1-blocked protected-corpus/calibration paths and of the scheduled Barbecue child programme.

- protected D1 reads/writes: 0/0;
- protected recipe-body reads/exports/rewrites: 0;
- recommendation/ranking/planner authority changes: 0;
- NutritionSource composition authority changes: 0;
- public/runtime fetch or behavior changes: 0;
- Knowledge Core writes: 0;
- Barbecue workflow/quota/generated-state mutations: 0;
- paid infrastructure/API/corpus-licensing changes: 0.

## Source-role model

The scaffold distinguishes three materially different source roles.

1. **Classification taxonomy** — EFSA FoodEx2 is a standardised food classification/description system. It is useful for mapping and harmonisation but is not itself a legislative authorisation or prohibition.
2. **Informational register/database** — Commission search tools can be authoritative reference surfaces while still being expressly informational or derived from controlling legal acts. The legal act remains controlling where the source states that limitation.
3. **Primary legal text / legally backed Union list** — EUR-Lex legislation and Commission lists backed by implementing regulations are recorded with their controlling legal instrument and a re-verification requirement.

No registry entry gains automatic app behavior authority merely because its underlying source is legally authoritative.

## Bounded official source families

The V1 registry covers exactly seven source families:

- EFSA FoodEx2 / data standardisation;
- European Commission EU Register of Nutrition and Health Claims;
- European Commission EU Pesticides Database;
- European Commission Food Additives Database;
- Regulation (EU) No 1169/2011 / Annex II allergen and food-information rules;
- European Commission Union list of novel foods / Implementing Regulation (EU) 2017/2470 as amended;
- Commission Regulation (EU) 2023/915 on maximum levels for specified contaminants, using the current consolidated text when substantive use is later authorized.

Canonical static registry: `src/data/eu-regulatory-evidence-sources-v1.js`.

## Currentness and legal-weight rules

Every source is marked `REVERIFY_OFFICIAL_SOURCE_BEFORE_SUBSTANTIVE_USE`.

This is mandatory because registers, Union lists and consolidated legal texts can change. In particular:

- the EU Pesticides Database itself states that it is for information and has no legal value; Official Journal acts control;
- the health-claims register is an information/reference surface and identifies claim-specific legal acts;
- the additives database is based on the Union list in Regulation (EC) No 1333/2008;
- the novel-food Union list is maintained through Implementing Regulation (EU) 2017/2470 and later amendments;
- Regulation (EU) 2023/915 has amended/consolidated versions, so substantive use must resolve the then-current official text.

## Gate requirements

`EU_REGULATORY_TRUTH_SCAFFOLD_V1_PASS` requires:

1. all seven official source families registered;
2. authority, canonical URL, source role, legal weight and controlling-law boundary retained;
3. `runtimeFetch:false`;
4. `datasetImport:false`;
5. `appBehaviorAuthority:false`;
6. no runtime source file imports of the registry;
7. deterministic tests proving lane isolation;
8. no D1, recommendation, Knowledge Core, Barbecue, billing or public-runtime mutation.

Passing this gate only authorizes a later **bounded source-review/research** step. Any mapping from regulatory evidence into allergen handling, safety constraints, claims display, ingredient eligibility, recommendation logic or other product behavior remains a separate explicit behavior contract and gate.

## Gate closeout — PASS

Validate public V0 run **#1106 / 36128087354** completed **SUCCESS**. Static/unit validation, the new Lane 3 isolation tests and Chromium browser acceptance all passed. Production public-runtime smoke was skipped by the existing PR workflow policy; no public/runtime code was changed.

The earned successor state is `RESEARCH_READY_FOR_BOUNDED_SOURCE_REVIEW__BEHAVIOR_STILL_SEPARATELY_GATED`. The registry remains non-runtime and no D1, protected-corpus, recommendation, NutritionSource, Knowledge Core, Barbecue, billing or public behavior authority has been added.
