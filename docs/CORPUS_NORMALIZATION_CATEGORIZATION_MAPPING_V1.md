# Corpus normalization / categorization mapping V1

Date: 2026-09-23

Status: `CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1_PASS__FROZEN`

## Result

The first post-baseline normalization layer is frozen as a **versioned, deterministic, reversible metadata overlay** over the exact pinned-source reconstruction of protected corpus `v8018 / 19,268`.

Initial full evidence run: `35906244182`  
Initial artifact: `10770429269 / corpus-normalization-mapping-v1`  
Initial artifact digest: `sha256:e33746038d723bc30ae9e04c69f57ddde11f5e0a767127a7361bf9f4b2b9a181`  
Canonical compact evidence: `data/generated/corpus-normalization-mapping-v1.json`

Measured result:

- observed / valid / unique overlay records: **19,268 / 19,268 / 19,268**
- every cohort count and frozen structural threshold: **PASS**
- legacy CC0 structural exceptions preserved unchanged: **3**
- explicit source country authority: **501**
- reviewed dish-category mappings: **1,079**
- reviewed meal-role mappings: **524**
- source-scale-preserving difficulty mappings: **1,416**
- prep minutes: **501 exact**
- cook minutes: **501 exact**
- total minutes: **870 exact + 501 reviewed derivations + 45 explicit ambiguous**
- servings: **501 exact**
- geography region, culinary tradition, technique-family and reviewed dietary authority: **0 by design**

## V1 authority

V1 grants narrow canonical authority only where the source field and transformation are low ambiguity:

- explicit source `country` may populate `geography.country`;
- explicit numeric prep/cook/total minutes may populate the corresponding canonical time field;
- ForkRecipe `totalTime` may be parsed only when it matches the deterministic hours/minutes grammar;
- ForkRecipe `activeTime` remains a source hint and is **not** relabeled as prep time;
- explicit positive `baseServings` may populate `serving.servings`;
- difficulty preserves its original source scale rather than pretending numeric 1–5 and easy/medium/hard are equivalent;
- the known source `category` vocabulary is reviewed into two independent vocabularies: dish category and meal role.

## Explicit non-authority

V1 does **not** promote source cuisine, culture, tags or historical collection names into culinary-tradition/authenticity authority; infer regions; promote tags/diets into reviewed dietary authority; relabel active time as prep time; or invent missing values.

Those dimensions remain explicit `UNKNOWN` or `AMBIGUOUS`.

## Runtime and legal boundary

This mapping performed:

- D1 reads: **0**
- D1 writes: **0**
- protected bodies exported or rewritten: **0**
- public runtime change: **false**
- recommendation behavior change: **false**
- nutrition mutation: **false**
- YouTube mutation: **false**
- Knowledge Core write: **false**
- billing expansion: **false**
- third shard: **false**

The complete overlay remains CI evidence only at this gate. It is not a protected-body rewrite and is not admitted to runtime storage.

## Successor

The mapping/freeze gate is complete. The next primary roadmap lane is:

`NUTRITION_VITAMIN_APPLICABILITY_AUDIT`

This successor must remain evidence-first and fail closed. Mapping PASS does not itself authorize D1 mutation, public/recommendation activation, inferred nutrition, a third shard, billing expansion, YT-CUL retry or Knowledge Core writes.
