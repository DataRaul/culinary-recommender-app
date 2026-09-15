# Corpus Scale Step 8G — Bosse & Watanna 1914 measurement PASS

Date: 2026-09-15

Status: **PASS / V8005 PREWRITE DESIGN EARNED / NO LIVE WRITE AUTHORITY**

Terminal:

`STEP_8G_ORA_BOSSE_WATANNA_1914_MEASUREMENT_EARNED_COHORT_CANDIDATE`

## Exact cohort

The measurement covers exactly 109 records in the pinned Open Recipe Archive `japanese-kitchen` shelf from Sara Bosse & Onoto Watanna's 1914 *Chinese-Japanese Cook Book* at commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`.

The source-work rights gate passed only because every row retained the exact collection/source/author/year/Internet Archive URL/`public-domain` tuple and the separate documentary rights audit was present. No broader Open Recipe Archive rights inference is made.

## Measurement against active v8004

Baseline protected composition: **2,355 recipes / v8004**.

- UniTools: 501.
- ForkRecipe: 915.
- CC0 `sylGauthier/recipes`: 226.
- Abbott 1864: 713.
- Current public runtime used for overlap detection: 85 recipes.

Candidate result:

- recipes: **109**;
- parseable: **109 / 109 = 100%**;
- distinct normalized titles: **107**;
- unique-title ratio: **98.17%**;
- exact title overlaps with the full v8004/public baseline: **0**;
- novel normalized titles: **107 / 107 = 100%**;
- distinct ingredient phrases: **430**;
- novel ingredient phrases: **370**;
- canonical ingredient occurrence resolution: **13.31%**;
- resolved canonical ingredient IDs: **19**;
- unresolved normalized ingredient phrases: **410**.

The established Step 8G gates are 95% parseability, 80% unique normalized titles and 50% novel normalized titles. The cohort clears all three without threshold relaxation.

## Interpretation

This is a strong **protected-scale** candidate because it is small, structurally complete and almost entirely novel by title while introducing a large amount of heterogeneous historical ingredient language.

The low 13.31% ontology-resolution rate is not hidden or treated as quality authority. It is a high review-cost signal. It increases the value of the cohort for protected-scale/normalization stress, but it is evidence **against** automatic recommendation admission. No source diet, allergen, nutrition, scaling or cultural-authenticity metadata becomes authoritative.

The 1914 work is a historical Chinese/Japanese-American adaptation. The archive's shelf/culture labels are retained only as source provenance. This PASS does not assert canonical modern Japanese authenticity.

## Evidence

Canonical evidence:

- `data/generated/step8g/ora-bosse-watanna-1914-measurement.json`
- workflow run `35024287385`
- artifact `10418364480`
- artifact digest `sha256:5b18bc9d9cec1a05acf258107b99b6ee293f583f696651aa8f55d5d023636ae5`

## Authority earned

This PASS earns only a **v8005 no-write prewrite/capacity design** for parent v8004 + 109 candidate records, targeting 2,464 composed protected recipes if and only if the prewrite passes.

It does not authorize:

- production D1 writes;
- v8005 activation;
- recommendation admission or public runtime changes;
- a third shard;
- a larger D1 query/request budget;
- billing or paid infrastructure;
- Nutrition or YT-CUL mutation;
- Knowledge Core writes.

Because the v8004 production run observed **16/16 D1 subqueries**, the v8005 prewrite must independently demonstrate that every planned operation remains within the existing maximum. Any design that requires more than 16 must fail closed or be redesigned; this measurement does not authorize a limit increase.
