# Corpus Scale Step 7E — ForkRecipe production-shaped pilot

Status: **SOURCE AUDIT PASS / PROTECTED 500-RECORD LIVE PILOT PASS / NO PUBLIC ACTIVATION AUTHORITY**

Date: **2026-09-06**

Entry authority: `STEP_7D_PROTECTED_84_CANARY_PASS` on app main `08bce89b340c88bf175cc5bac57f62f7e29af731`.

Terminal live result:

`STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS`

This gate is governed by `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md`, the generalized source control plane, and all existing nutrition, allergen/dietary, source-rights, public-runtime and Knowledge Core boundaries.

## 1. Scope

Step 7E evaluated one **500-record rights-clean real-source cohort** using the already-proven authenticated/fail-closed architecture. It did not authorize public recommendation expansion, automatic corpus admission, paid infrastructure, a paid corpus/API, or the eight future recipe-body D1 shard databases.

Source:

- repository: `futurechef/forkrecipe-recipes`;
- pinned commit: `c32255266af39bd77444d39452f3df8088ac8fd9`;
- verified pinned tree / upstream validator count: **915 recipes**;
- upstream README count text: **916 recipes** — retained as non-blocking source-documentation drift, not silently normalized;
- source-level content licence declaration: CC BY-SA 4.0;
- media: excluded;
- external nutrition: never imported as NutritionSource authority.

The upstream commit is immutable for this Step 7E decision. Later upstream changes require a new source-version event and cannot silently rewrite this pilot.

## 2. Rights gate

The pinned audit requires all of the following independently:

1. README identifies the repository as the recipe-content data layer;
2. README explicitly licenses all recipes CC BY-SA 4.0;
3. README states content is originally authored or adapted from public-domain sources;
4. repository `LICENSE` contains the CC BY-SA 4.0 licence;
5. `CONTRIBUTING.md` states accepted content uses the same licence;
6. contributor guidance rejects copying copyrighted commercial recipe prose.

The pinned source audit passed all six rights checks. Every protected pilot packet retains pinned-file provenance and attribution. A future failure in source-level rights evidence holds the cohort fail-closed.

## 3. Data-quality and adapter gate

The workflow checked out the exact upstream commit and ran the upstream zero-dependency validator before the Culinary adapter audit.

Pinned-source evidence:

- upstream validator: **PASS, 915 recipe(s) valid, no errors**;
- Culinary parse/data-quality decisions: **915 structurally valid protected-source-pilot candidates, 0 held, 0 rejected**;
- ratio systems: 630 `parts`, 236 `weight`, 49 `bakers_percentage`;
- source fork records: 10;
- exact normalized source-title duplicate pairs: 11;
- exact normalized title collisions with the existing public 84-record corpus: 3 (`baba-ganoush`, `huevos-rancheros`, `tzatziki`);
- source nutrition top-level fields observed: 0;
- source media top-level fields observed: 0;
- allowlisted source-packet payload: about 9.3 MB uncompressed across the 915 records.

The initial stale assumption of 916 records was corrected after fresh inspection proved the pinned tree and upstream validator contain 915 while the README says 916. The Step 7E expected count is pinned to the observed/validated tree count of **915**, with the README discrepancy retained as provenance drift.

The Culinary audit requires:

- exact deterministic recipe-file count and unique slugs/files;
- expected per-record `CC-BY-SA` declaration;
- supported source ratio system;
- non-empty ingredient and process structures;
- finite source ratio values;
- immutable pinned-file provenance;
- deterministic source-pilot packet hashes;
- generalized control-plane and ingestion-pipeline validation;
- duplicate/title-collision observations without automatic merging.

Documentation-count drift is recorded but is not by itself a blocking source-body defect when the pinned tree and upstream validator agree.

## 4. Quantity, nutrition, dietary and allergen firewall

ForkRecipe `ratioValue` / `ratioSystem` values are source-native relative recipe structure. Step 7E **does not convert them into absolute grams, household portions or NutritionSource quantity evidence**.

The source pilot therefore:

- promotes zero ratio values to absolute quantities;
- imports zero external nutrition values as authority;
- derives zero dietary or allergen claims from recipe titles/tags/prose;
- makes zero Step 7E records recommendation eligible;
- leaves canonical ingredient mapping and hard recommendation metadata partial pending later evidence/review.

This distinction is deliberate: a record can be rights-clean and structurally valid enough for the protected source pilot without being safe for public recommendation or nutrition calculation.

## 5. Admission semantics

A rights-clean, schema-valid ForkRecipe record may receive:

`ADMIT_PROTECTED_SOURCE_PILOT_ONLY`

This means only:

- exact source content is admitted to the bounded Step 7E protected pilot evidence set;
- provenance is verified against the pinned source file;
- parse passed;
- normalization, deduplication, ingredient quantity mapping and hard metadata remain explicitly partial;
- nutrition is firewalled;
- the portable source packet is available only for the protected live pilot.

It does **not** mean:

- public app admission;
- recommendation eligibility;
- dietary/allergen safety certification;
- nutrition authority;
- automatic Brain/Atlas promotion;
- public runtime activation.

All generated control-plane snapshots retain `runtimeActivationAuthorized: false` and `automaticAdmissionAuthorized: false`.

## 6. Production-shaped packet

Each pilot packet contains:

- source/commit/file identity;
- immutable source URL;
- attribution and CC BY-SA 4.0 rights envelope;
- a strict allowlisted copy of the source recipe fields;
- explicit no-media, no-nutrition-authority, no-diet/allergen-derivation and no-public-runtime flags;
- deterministic packet SHA-256 and byte count.

Unknown top-level source fields are not silently promoted into the packet. Media/nutrition-like top-level fields are not part of the allowlisted source body.

## 7. Repository audit workflow

`.github/workflows/corpus-scale-step7e.yml`:

1. checks out this app;
2. checks out ForkRecipe at the exact pinned commit;
3. verifies the commit SHA;
4. runs upstream `npm run validate`;
5. runs `scripts/run-forkrecipe-step7e-audit.mjs`;
6. uploads `summary.json`, generalized control-plane/pipeline snapshots, and the protected-pilot packet set as CI evidence.

The workflow uses no external secrets and does not write to Cloudflare or provision infrastructure.

## 8. Live protected pilot result

The deterministic live cohort selected exactly **500** recipes from the 915-record audited source universe, stored as **50 chunks of 10** in the existing `culinary-control` D1 only.

The final live verification proved:

- recipe count 500 / 500;
- chunk count 50 / 50;
- exact body bytes 5,115,695;
- exact live fingerprint `2aa8106f7521f9cf3f6c2f9ece13d328272f8400f90f4ae79b8cdc4750b5d8b6`;
- metadata validation PASS;
- authenticated protected sample returned with recommendation/public-runtime/nutrition/dietary/allergen/ratio-promotion boundaries all false;
- simulated Free-limit failure returned HTTP 503 `STEP7E_FREE_LIMIT_FAIL_CLOSED`, zero pilot queries and no protected data;
- credential-omitted request returned HTTP 401 before protected data;
- no future D1 shard was created;
- no paid plan or billing authorization was activated.

Canonical live evidence is recorded in `docs/CORPUS_SCALE_STEP7E_LIVE_500_CANARY.md`.

## 9. Terminal state and authority boundary

Step 7E terminal:

`STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS`

This closes the currently defined Step 7E protected-pilot gate. The governing architecture defines no Step 7F, so no new infrastructure, corpus promotion or public-runtime authority may be inferred from this PASS.

## 10. Hard boundaries

Not authorized by this file or the Step 7E PASS:

- creating any of the eight future recipe-body D1 shard databases;
- Workers Paid or any charge/overage authorization;
- Zero Trust / Access or R2 activation;
- public static publication of protected recipe bodies or indexes;
- external source runtime fetches;
- replacing the current authenticated same-origin session architecture;
- public V1→V2 cut-over;
- automatic source admission outside this bounded pilot;
- source nutrition as NutritionSource authority;
- source-prose dietary/allergen inference;
- source-ratio promotion to absolute quantities;
- source media activation;
- Knowledge Core writes or private Knowledge Core browser/runtime dependency.
