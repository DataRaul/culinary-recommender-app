# Protected Corpus Recommendation Expansion V1

Status: **ITERATION V2 PASS WITH FAIL-CLOSED HOLD / NEXT FRONTIER V3 READY**

Owner authorization was received on 2026-09-29 after terminal P4 product acceptance. This is a new successor programme; it does not reopen or rewrite the completed Protected Corpus Runtime Usability V1 history.

## Objective

Progressively earn additional hard-safe recommendation candidates from protected corpus v8018 / 19,268 without automatic mass admission.

The programme starts from the production-validated baseline:

- protected v8018: **19,268** recipes, two shards;
- public runtime: **86** recipes;
- protected-origin activations: **1**;
- current post-P3 ingredient-identity-ready protected recipes: **113**;
- current unresolved-identity recipes: **19,155**;
- prior P4 owner live acceptance: **PASS**.

## Execution sequence

```text
R0 authorization + frozen baseline                         PASS
-> R1 post-P3 frontier measurement                        PASS
-> R2 bounded identity + hard dietary/allergen repair     PASS
-> R3 deterministic recommendation/planner acceptance     PASS WITH HOLD
-> R4 owner bounded admission                             NOT OPEN
-> next frontier iteration                                READY
```

Candidate-only machine work through R3 is authorized. Runtime activation is not. Each R4 gate may authorize **at most one exact recipe**, and every admitted recipe must pass R5 before another admission gate can open.

## Frontier policy

R1 starts with the pinned UniTools 1.1.0 cohort because all 501 records carry explicit prep/cook time, positive servings, difficulty and category metadata. Ingredient identity is the measured dominant blocker there.

The measurement must use the current post-P3 canonical layer, preserve already-reviewed exact-cohort alias decisions, exclude conflicts, hold ambiguous ingredient identity, and rank measured unlock leverage. The first frozen evaluation tranche is capped at 10 recipes.

Source nutrition and source vegetarian/gluten-free or similar claims do not become runtime authority merely because a recipe enters this programme. Difficulty and meal role require reviewed runtime-compatible authority. Unknowns stay fail-closed.

## Firewalls

This authorization does **not** authorize automatic recommendation admission, public-runtime widening, protected D1 writes, protected-body rewrite, new protected-source ingestion, a third shard, paid infrastructure/API/corpus licensing, Knowledge Core writes, or Barbecue mutation.

Canonical contract: `config/protected_corpus_recommendation_expansion_v1.json`.

R0 evidence: `data/generated/protected-corpus-recommendation-expansion-r0-baseline-v1.json`.

Next: `R1_POST_P3_FRONTIER_MEASUREMENT`.


## R1 result

R1 passed on the exact pinned 501-recipe UniTools cohort. After applying the current post-P3 canonical layer plus the already-reviewed exact-cohort alias overlay, **428** records are conflict-free with the required explicit time/servings/difficulty/category metadata. Excluding the already activated `pao-de-queijo` and known public duplicate `tortilla-espanola`, there are **0** zero-gap candidates and **2** one-gap candidates.

The frozen 10-recipe R2 tranche is: `cachapas`, `chapati-kenyan`, `ajvar`, `arepas`, `arroz-con-coco`, `avgolemono`, `burek-bosanski`, `chimichurri`, `dograma`, and `draniki`. Digest: `6dbf598c8a00e07bd0b1bdfae75146d7683487afcc3f0bfc9c0e07ddf938b9c0`.

The two closest candidates remain fail-closed on exactly one unresolved identity each: `cachapas` → **Soft white cheese** and `chapati-kenyan` → **Flour**. R1 makes no identity decision and no runtime admission. R2 is now ready to review the frozen tranche only.

Compact evidence: `data/generated/protected-corpus-recommendation-expansion-r1-frontier-compact-v1.json`.


### R2 identity review

The frozen 10-recipe R1 tranche received 15 explicit identity decisions. Five form-preserving existing-identity mappings are candidate-active only inside the frozen tranche; ten ambiguous/composite/missing identities remain held. The deterministic measurement yields exactly **one** identity-ready recipe: `chimichurri`, with canonical ingredients `chilli_flakes`, `garlic`, `olive_oil`, `oregano`, `parsley`, `salt`, `vinegar`, and `water`. All nine other candidates remain fail-closed.

Identity-ready digest: `49c6c2f288c3f9b07aefec95a4c4212c26e86bfc9abe44e679d69bee6bce3611`. Hard safety remains a separate R2 policy gate; no runtime authority or admission is created by identity readiness.


## R2 hard-safety result

The R2 hard-safety policy passed for the sole identity-ready candidate, `chimichurri`. All eight mapped ingredients have reviewed current-profile allergen coverage and boolean vegetarian/vegan policy rows. Candidate-only tags are `unrestricted`, `vegetarian`, and `vegan`; the mapped declared-allergen list is empty, which is explicitly **not** a global allergen-free or cross-contact guarantee. Runtime authority and admission remain unchanged.

Evidence: `data/generated/protected-corpus-recommendation-expansion-r2-hard-safety-summary-v1.json`.

## R3 result

R3 passed by **fail-closed abstention**, not by admission. `chimichurri` is a source-category `sauce`, which is not reviewed authority for a standalone meal role. Its source timing is internally inconsistent for runtime elapsed-time filtering: prep + cook declares 15 minutes, step-minute fields sum to 20, and the final instruction adds a two-hour stand. The candidate therefore keeps empty runtime meal roles and unknown total time, is rejected by recommendation for every current meal type, and produces planner shortfalls instead of being selected.

No owner admission gate opens. Next is `R1_NEXT_FRONTIER_ITERATION_V2` under the existing candidate discovery/repair authority.


## Iteration V2 result

The next bounded frontier excluded all previously processed recipes and froze 10 new UniTools candidates: `flia`, `gurasa`, `halloumi-grilled`, `hangi-style-chicken`, `hummus`, `injera`, `jasha-maroo`, `karjalanpiirakka`, `matapa`, and `moros-y-cristianos`. All ten began at two unresolved ingredient identities.

Nineteen exact unresolved keys were reviewed. Six form/variety mappings to existing canonical identities were accepted only inside this iteration and thirteen identities remained held. Exactly one recipe became identity-ready: `jasha-maroo`.

Hard-safety review covered all ten mapped canonical ingredients. The candidate-only result is `unrestricted` with no mapped declared allergens; source dietary claims remain non-authoritative.

Machine acceptance again held fail-closed. Source category `main` is not exact runtime meal-role authority, and source timing declares 55 minutes while explicit step minutes sum to 60. Recommendation and planner therefore abstain; public runtime stays 86 and no owner admission gate opens.

Evidence: `data/generated/protected-corpus-recommendation-expansion-iteration-v2-summary-v1.json`.

Next: `R1_NEXT_FRONTIER_ITERATION_V3`.
