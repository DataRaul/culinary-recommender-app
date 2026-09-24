# Corpus Scale / 100k Readiness — Step 6 Incremental Large-Corpus Validation

Status: **PASS / CURRENT 85-SEED INCREMENTAL VALIDATION RECONCILED / HISTORICAL 84 ORACLE PRESERVED / NO REAL LARGE-CORPUS POPULATION**

Step 5 established a deterministic source registry, rights/provenance control plane, explicit review decisions and source-neutral ingestion stages. Step 6 adds the validation architecture needed to change a large portable corpus without making every ordinary pull request run a full 100k × profile-matrix workload. In the current continuation, ordinary incremental fixtures start from the 85-record `PUBLIC_RUNTIME_RECIPES` scale seed while the immutable 84-record `ALL_RECIPES` corpus remains the historical golden retention oracle.

## Objective

Normal corpus-change validation must be proportional to the change while remaining fail-closed.

The validation path is:

```text
previous portable manifest + lightweight metadata/indexes
                    ↓
next portable manifest + lightweight metadata/indexes
                    ↓
semantic diff plan
  - added / removed / changed recipe IDs
  - metadata changes
  - ordinal drift
  - affected metadata shards
  - changed index keys
                    ↓
small change?
  YES → hydrate + validate only affected recipe bodies
        verify affected shards/index semantics
        retain reviewed golden corpus exactly
        run bounded deterministic regression sample
  NO  → FULL_VALIDATION_REQUIRED
```

The separately runnable 100k benchmark remains separate from routine CI.

## Stable ordinal rule

The Step 3 portable layout uses integer ordinals in metadata and index postings. Incremental validation therefore requires existing recipe IDs to keep their ordinals across ordinary corpus versions.

New records may append without renumbering existing records.

If an existing ID moves to a different ordinal, Step 6 returns:

`FULL_VALIDATION_REQUIRED / EXISTING_RECIPE_ORDINAL_DRIFT`

This prevents a small apparent edit from silently rewriting most index postings and detail paths.

A future explicit compaction/repacking operation may renumber the corpus, but it must use the full-validation path and cannot masquerade as an incremental update.

## Incremental-change budget

Default normal-CI budget:

- at most **1,000 affected recipe IDs**; and
- at most **10%** of the larger previous/next corpus.

Affected IDs are the union of:

- added IDs;
- removed IDs;
- changed detail bodies;
- changed lightweight metadata.

If either bound is exceeded, the plan fails over to `FULL_VALIDATION_REQUIRED` rather than weakening checks.

These are CI-shape limits, not recipe-admission limits. A larger reviewed cohort can still be admitted; it simply earns the full corpus-validation path rather than incremental CI.

## Semantic diff instead of version-string hash noise

Step 3 embeds the corpus version inside metadata/index JSON. Raw cross-version object hashes therefore change even when their semantic content is the same.

Step 6 compares semantic state instead:

- recipe detail SHA/byte identity by recipe ID;
- metadata rows excluding physical ordinal/detail-pointer fields;
- index key → ordered ordinal postings;
- existing ID → ordinal mapping.

This avoids falsely classifying every object as changed merely because `v0001` became `v0002`.

## Lightweight global scan versus heavy detail hydration

The plan may read all lightweight metadata/index objects to establish the exact semantic diff. It does **not** hydrate every recipe body.

For an incremental plan, full recipe JSON is hydrated only for added/changed records that require schema/provenance validation.

This is intentionally different from Step 3 full validation, which validates every detail object.

## Changed-record schema gate

Every newly added or changed canonical recipe must retain the current runtime structural minimum:

- non-empty `id`;
- `identity.canonicalTitle`;
- ingredient array with canonical ingredient IDs;
- instruction array;
- culinary object;
- time object;
- dietary-tag array;
- nutrition object;
- governance object.

Unknown/nullable source-backed hard metadata may remain explicit under existing governance; Step 6 does not invent missing values merely to satisfy a schema check.

## External provenance gate

Changed external recipes must retain:

- source name;
- source URL;
- licence;
- explicit licence-URL/null field;
- immutable version/revision/snapshot locator;
- `governance.sourceNutritionIgnoredForAuthority === true`;
- no implicit media admission.

Step 6 intentionally does **not** require external recipe nutrition to remain unavailable forever. A later separately reviewed `NutritionSource` may calculate authoritative nutrition. The invariant is that source recipe nutrition never becomes authority merely because the recipe text was imported.

## Affected shard/index validation

For an incremental plan:

- affected next-version metadata shard descriptors/hashes/row counts are verified;
- changed index objects are verified against the expected posting lists derived from the lightweight canonical metadata rows;
- removed index keys are allowed only when the expected next posting list is empty;
- unchanged recipe bodies are skipped rather than needlessly parsed again.

The plan records exactly which recipe IDs, metadata shards and index keys were validated.

## Golden corpus retention

The reviewed 84-record corpus remains the behavioral/data oracle during scale-up.

`validateGoldenRecipeRetention()` requires every historical golden recipe ID to remain present and byte-equivalent in a larger next corpus unless an explicit separately reviewed change intentionally updates that golden record. Separately, the incremental planner now exercises the current 85-record public runtime as its ordinary previous-version seed, so the one explicitly activated Step 8F record cannot disappear merely because the historical oracle remains 84.

Adding thousands of new recipes therefore cannot silently rewrite an existing reviewed recipe.

If a golden recipe legitimately changes under another reviewed lane, the golden baseline must be explicitly refreshed rather than bypassed.

## Bounded deterministic regression set

`selectDeterministicRegressionSample()` selects IDs by SHA-256(seed + ID), independent of input order.

The default sample size is **32**. `buildBoundedRegressionRecipeSet()` combines bounded samples from:

- affected next-version recipe IDs; and
- stable unchanged recipe IDs.

Normal CI can run existing deterministic ranking/hard-filter invariants over this bounded set without exploding to 100k × every profile.

The existing 15,552-profile baseline and browser acceptance remain in normal repository validation for the current reviewed runtime corpus. The large new corpus is not multiplied by that entire matrix in ordinary CI.

## Full validation remains available

Step 6 does not delete or weaken Step 3 full validation or Step 4 scale benchmarks.

A full validation is required when, for example:

- existing recipe ordinals drift;
- the changeset exceeds the incremental budget;
- the portable corpus contract changes;
- metadata sharding semantics materially change;
- an incremental invariant cannot establish correctness confidently.

The 100k performance/retrieval benchmark remains separately runnable and is not triggered merely because a handful of records changed.

## Validation contract

`tests/corpus-scale-step6.test.js` covers:

- explicit 85-record current-scale-seed / 84-record historical-oracle separation;
- append-only incremental addition;
- detail-only change without invented index churn;
- ordinal-drift fallback to full validation;
- explicit incremental-budget fallback;
- detail tamper detection;
- index tamper detection;
- external provenance and source-nutrition firewall checks;
- exact 84-record golden retention;
- deterministic bounded sampling;
- bounded recommendation regression without 100k profile explosion.

All existing repository tests and browser acceptance remain mandatory before merge.

## Hard non-authorizations

Step 6 does **not** authorize:

- real Open Recipe Archive population;
- RecipeDB/ForkRecipe/UniTools population;
- public runtime cut-over to V2;
- Cloudflare provisioning;
- D1;
- paid infrastructure/APIs/corpus licences;
- automatic source admission;
- weakening rights/provenance/nutrition/media/hard-filter gates;
- private Knowledge Core browser/runtime dependency.

## Current validation evidence

PR #297 full repository validation run #1029 passed the current-seed Step 6 suite and full browser acceptance. The added reconciliation proof starts ordinary incremental planning from all 85 current public-runtime records, proves a semantic no-op across portable version roots, preserves all 85 unchanged records without index churn, and independently verifies exact retention of the historical 84-record golden oracle.

## Step 6 PASS condition

Step 6 passes when:

1. small append/change fixtures generate `INCREMENTAL` plans;
2. changed details/shards/indexes validate fail-closed;
3. ordinal drift and excessive churn return `FULL_VALIDATION_REQUIRED`;
4. external provenance/nutrition boundaries remain enforced;
5. the reviewed golden corpus remains retainable exactly;
6. bounded deterministic regression sampling works independently of corpus size;
7. the full existing repository/browser suite remains green.

## Next action after PASS

**Step 7 — Production-shaped real-source pilot preparation and bounded source-B audit.**

Step 7 is the first point where Cloudflare provisioning and the preferred ~928-record Open Recipe Archive Spanish candidate cohort become relevant. Before any real admission, revalidate current external rights/licence evidence, source-book/edition public-domain status, Cloudflare free-tier/product limits and the exact invitation-only Access configuration.

Actual Cloudflare account/domain/Access setup may require a human setup/security gate. Paid infrastructure remains unauthorized unless separately approved.
