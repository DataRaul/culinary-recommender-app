# Corpus normalization / categorization mapping V1

Date: 2026-09-23

Status: `IMPLEMENTATION_CANDIDATE__CI_EVIDENCE_PENDING`

## Purpose

Implement the first post-baseline normalization layer as a **versioned, deterministic, reversible metadata overlay** over the exact pinned-source reconstruction of protected corpus `v8018 / 19,268`.

This change does not read or write protected D1 recipe bodies and does not alter public runtime, recommendation behavior, nutrition, YouTube state, Knowledge Core, shard topology or billing.

## V1 authority

V1 intentionally grants narrow canonical authority only where the source field and transformation are low ambiguity:

- explicit source `country` may populate `geography.country`;
- explicit numeric prep/cook/total minutes may populate the corresponding canonical time field;
- ForkRecipe `totalTime` may be parsed only when it matches the deterministic hours/minutes grammar;
- ForkRecipe `activeTime` remains a source hint and is **not** relabeled as prep time;
- explicit positive `baseServings` may populate `serving.servings`;
- difficulty preserves its original source scale rather than pretending numeric 1–5 and easy/medium/hard are equivalent;
- the known 22-value source `category` vocabulary is reviewed into two independent vocabularies: dish category and meal role.

## Explicit non-authority

V1 does **not** promote:

- source cuisine, culture, tags or historical collection names into culinary-tradition/authenticity authority;
- any region inference from country/culture/collection;
- tags/diets into reviewed dietary authority;
- active time into prep time;
- missing values into inferred values.

Those dimensions remain explicit `UNKNOWN` or `AMBIGUOUS`.

## Evidence contract

The workflow must reconstruct all 19,268 records from the exact frozen source commits, preserve cohort counts and structural thresholds, retain all raw source hints on every overlay record, validate controlled vocabulary membership and emit both:

- a compact mapping summary;
- the complete reversible overlay as a CI artifact.

The complete overlay is evidence only at this gate. It is not a protected-body rewrite and is not admitted to runtime storage.

## Terminal outcomes

- `CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1_PASS`
- `CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1_FAIL`

A PASS advances only to review/freeze of this metadata authority. It does not itself authorize D1 mutation, public/recommendation activation or the downstream nutrition lane.
