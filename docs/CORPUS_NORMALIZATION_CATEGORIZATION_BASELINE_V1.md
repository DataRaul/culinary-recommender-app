# Corpus normalization / categorization baseline V1

Date: 2026-09-23

Status: `CORPUS_NORMALIZATION_CATEGORIZATION_BASELINE_PASS`

## Scope and method

This is the first post-`LEGAL_CORPUS_BASELINE_PASS` product-order gate. It performs a **no-write** reconstruction and taxonomy audit of protected corpus `v8018` without reading protected D1 bodies.

The audit reconstructs the exact 18-layer protected ancestry from the frozen source pins used at admission:

- UniTools: 501
- ForkRecipe: 915
- CC0 Markdown: 226
- admitted Open Recipe Archive cohorts: 17,626
- total: **19,268**

Workflow run: `35895304230`  
Artifact: `10766372521` / `corpus-normalization-baseline-v1`  
Artifact digest: `sha256:d3aafd52587b74184ace55e322c1fb13c15d066962e201fa8dad0ada5651d57b`

Canonical compact evidence: `data/generated/corpus-normalization-baseline-v1.json`  
Frozen audit contract: `config/corpus_normalization_baseline_v1.json`

## Structural result

- observed recipes: **19,268 / 19,268**
- titles present: **19,268 / 19,268**
- structurally parseable: **19,265 / 19,268 = 99.9844%**
- every cohort meets or exceeds its original admission threshold
- all ORA cohorts except the previously accepted CC0 source are structurally complete under their frozen source parser

The three explicit CC0 exceptions are unchanged historical source records:

- `eggs.md` — no parsed ingredient or direction section
- `peanut-butter.md` — no parsed ingredient section; 8 directions
- `spices-during-pregnancy.md` — no parsed ingredient or direction section

The CC0 cohort remains above its original frozen structural gate: **223 / 226 = 98.6726%**, minimum **95%**. The normalization layer must preserve these as explicit unknown/incomplete states rather than invent missing structure.

## Raw source-signal coverage

These are **source hints**, not canonical app authority:

| Raw signal | Records | Coverage |
|---|---:|---:|
| tags | 18,766 | 97.39% |
| culture | 18,541 | 96.23% |
| collection label | 17,626 | 91.48% |
| category | 1,416 | 7.35% |
| difficulty | 1,416 | 7.35% |
| time | 1,416 | 7.35% |
| cuisine | 915 | 4.75% |
| country | 501 | 2.60% |
| servings | 501 | 2.60% |
| diets | 302 | 1.57% |

The vocabulary is heterogeneous:

- **1,485** normalized tag values; **769** occur only once
- **377** culture values; **228** occur only once
- **80** cuisine values; **26** occur only once
- category mixes dish type and meal/function semantics, including `main`, `proteins`, `condiments`, `dessert/desserts`, `breakfast`, `side`, `drink/beverages`
- difficulty mixes two incompatible scales: numeric **1–5** and labels **easy / medium / hard**
- the same normalized values frequently appear across cuisine, culture and tags, so field-name coincidence cannot be treated as semantic equivalence

## Authority decision

Canonical taxonomy authority remains **zero by design** at this baseline. Raw source country/cuisine/culture/category/tag/diet/difficulty/time/serving values remain provenance or source hints until separately mapped and reviewed.

Historical ORA collection labels remain provenance-only and must never be silently promoted to cuisine/authenticity authority.

## Next gate

`CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1`

The first implementation is a **versioned, deterministic, reversible overlay**, not a protected-body rewrite.

Initial scope:

1. exact/reviewed normalization for low-ambiguity geography, time, servings and difficulty;
2. separate controlled vocabularies for dish category and meal role;
3. preserve source cuisine/culture/tags as hints and provenance;
4. represent `AMBIGUOUS` and `UNKNOWN` explicitly;
5. preserve the three CC0 structural exceptions without fabrication;
6. no recommendation behavior change, public activation, nutrition mutation, D1 mutation, Knowledge Core write, third shard or billing expansion.

## Boundaries

- D1 reads: **0**
- D1 writes: **0**
- protected bodies exported: **0**
- public runtime changed: **false**
- recommendation admission changed: **false**
- nutrition lane modified: **false**
- YT-CUL lane modified: **false**
- Knowledge Core write: **false**
- billing expansion: **false**
- third shard used: **false**
