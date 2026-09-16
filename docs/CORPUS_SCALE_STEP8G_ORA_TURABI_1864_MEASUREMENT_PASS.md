# Corpus Scale Step 8G — Turabi Efendi 1864 measurement PASS

Date: 2026-09-16

Status: **PASS / V8006 PREWRITE EARNED / NO LIVE WRITE AUTHORITY**

Terminal:

`STEP_8G_ORA_TURABI_EFENDI_1864_MEASUREMENT_EARNED_COHORT_CANDIDATE`

## Exact cohort

The measured candidate is the exact 442-record `ottoman-turkish` shelf from pinned Open Recipe Archive commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`, bounded to:

- source work: `A Turkish Cookery Book`;
- author/compiler: `Turabi Efendi`;
- source year: `1864`;
- source item: `https://archive.org/details/b21527830`;
- record-level licence: `public-domain`.

Documentary rights scope is defined in `docs/CORPUS_SCALE_STEP8G_ORA_TURABI_1864_RIGHTS_AND_MEASUREMENT.md`. Wellcome independently marks the digitized 1864 source with a Public Domain Mark. This clears only this bounded historical shelf.

## Measurement result

The deterministic measurement ran in GitHub Actions run `35035941153` and produced artifact `10423296747`, digest `sha256:aaa2744a3ac86acb1f67696a4459f2bb2f6773bdebe8d3d92a5acca98f706e60`.

Against the complete active protected `v8005 / 2,464` composition and current 85-recipe public runtime for overlap detection:

- candidate recipes: **442**;
- parseable recipes: **442 / 442 = 100%**;
- distinct normalized titles: **367 / 442 = 83.03%**, above the 80% threshold;
- exact normalized-title overlap with baseline: **0**;
- novel normalized titles: **367 / 367 = 100%**, above the 50% threshold;
- distinct ingredient phrases: **946**;
- novel ingredient phrases: **778**;
- ontology-resolved ingredient-occurrence ratio: **26.53%**;
- resolved canonical ingredient IDs observed: **28**;
- unresolved normalized ingredient phrases: **913**.

All measurement gates passed: documentary rights, exact count, row-level rights metadata, structural quality and culinary coverage.

## Interpretation

This cohort earns a **separate v8006 prewrite/capacity design** because it contributes materially new protected-corpus coverage despite substantial historical ingredient-language normalization cost.

The low ontology-resolution signal is useful protected-scale evidence. It is not a reason to infer recommendation readiness, nor does it grant cultural-authenticity authority. The historical shelf label remains provenance/search metadata only.

## Boundaries preserved

This PASS authorizes **no D1 write** and does not change the live protected corpus. The active protected state remains `v8005 / 2,464` until a later independently earned production population terminal.

It also does not authorize:

- public recommendation admission;
- any expansion beyond the exact Step 8F public authority `unitools_tortilla_espanola`;
- a third shard;
- D1 request-budget expansion beyond 16;
- billing or paid infrastructure;
- Nutrition or YT-CUL mutation;
- Knowledge Core writes;
- cultural-authenticity, nutrition, diet, allergen or scaling authority from the source.

Because v8005 already reached exactly `16 / 16` observed D1 subqueries on the fresh route-write path, the v8006 prewrite must prove the existing ceiling again with zero assumed headroom. A prewrite failure is a valid stop and must not be repaired by silently raising the budget.

Canonical measurement evidence: `data/generated/step8g/ora-turabi-1864-measurement.json`.
