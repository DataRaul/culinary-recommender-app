# Further Product Features — Readiness V1

Date: **2026-09-24**

Status: **PASS / D3 RECIPE IMAGES READY FOR BOUNDED P0 DESIGN / NO RUNTIME ACTIVATION**

Terminal: `FURTHER_PRODUCT_FEATURES_READINESS_PASS`

## Why this gate exists

The owner-approved post-baseline sequence is now materially complete through:

- legal corpus baseline;
- corpus normalization/categorization;
- nutrition/vitamin applicability audit;
- recommendation readiness;
- bounded Recipe Family/adaptation expansion;
- current scale-foundation reconciliation.

The Barbecue Technique Corpus is active as a **separate scheduled owner-priority lane** and must not be disturbed by ordinary app-development work.

This gate therefore asks which deferred product capability can enter bounded design work **without requiring a new external-data source, security decision, paid service, protected-corpus mutation, public-recipe admission, Knowledge Core write or Barbecue change**.

## Current facts

- protected corpus: **v8018 / 19,268**;
- public runtime: **85 recipes**;
- recommendation readiness: `USABLE_RECOMMENDATION_BASELINE_PASS`;
- Recipe Family bounded expansion: **8 APP_AUTHORING_ELIGIBLE / 2 HOLD / 0 public admissions**;
- scale foundation: `CURRENT_SCALE_FOUNDATION_RECONCILIATION_PASS`;
- vitamin/mineral schema: **not implemented**;
- protected recipes automatically recommendation-ready: **0**;
- Barbecue scheduled pilot: **active / first normal acquisition still independent**.

## Capability disposition

| Capability | Readiness result | Why |
|---|---|---|
| D1 Nutrient Gap Awareness | **BLOCKED** | vitamin/mineral schema and authoritative healthy-population layer are not ready |
| D2 Supplement Routine Checker | **BLOCKED** | dedicated supplement evidence/safety layer is not built |
| D3 Recipe Images | **READY FOR BOUNDED P0 DESIGN** | text/data/recommendation/scale foundations are now strong; a media pilot can be designed without importing third-party recipe-source images |
| D4 Local Grocery Price Intelligence | **BLOCKED** | no lawful reliable live/local price source or user/receipt evidence pipeline is established |
| D5 Fitness Integration | **DEFERRED** | requires a separate thin-adapter/ownership/input contract |
| D6 Advanced Culinary Exploration | **DEFERRED BY OWNER-PRIORITY SEQUENCE** | the Barbecue Technique Corpus is the active owner-priority technique-learning lane and remains incomplete |

## Selected next design candidate — D3 Recipe Images

D3 is selected because its original activation boundary was:

> only after text/data/recommendations are strong

That prerequisite is now earned by the legal-corpus, recommendation-readiness, Recipe Family and scale-foundation evidence. Selection is for **design only**.

D3 readiness does **not** authorize importing or reusing source media from:

- Wikibooks/Commons;
- protected v8018 source packets;
- UniTools/ForkRecipe/Open Recipe Archive;
- any other recipe source merely because its text/data rights were reviewed.

Media is a separate rights/provenance lane.

The initial P0 design must default to only:

- project-authored assets; or
- project-commissioned/generated assets with recorded provenance and an explicit reusable project licence/usage state.

Every pilot asset must have:

- stable recipe association;
- record-level provenance;
- descriptive alt text;
- explicit asset/reuse state;
- deterministic fallback when no image exists;
- mobile/browser performance budgets;
- zero effect on recipe identity, ranking, dietary/allergen filters, nutrition authority or source attribution.

## Hard non-authorizations

This gate does not authorize:

- public runtime behavior changes;
- third-party recipe-source image admission;
- protected-corpus image extraction;
- Wikibooks/Commons media use;
- new D1 writes or a third shard;
- paid image APIs, stock services or infrastructure;
- Knowledge Core writes;
- Barbecue workflow/state changes;
- weakening any provenance, licensing, accessibility or performance boundary.

## D3 progression

The bounded design gate is now implemented and validated in PR #300. `D3_RECIPE_IMAGES_P0_DESIGN_CONTRACT` is PASS with a six-recipe project-authored cohort and explicit media/provenance/accessibility/performance firewalls.

## D3 asset-pilot progression

The six exact project-authored SVG assets are now materialized under `assets/recipes/`, with a deterministic builder that computes byte counts/content hashes and rejects remote or active SVG constructs. Public UI activation remains false until validation passes.

## Next executable action

`D3_RECIPE_IMAGES_P0_ASSET_PILOT_VALIDATION`

Run the full repository/browser suite, close the asset-pilot evidence, then proceed to bounded browser integration only if green.
