# Corpus Scale Step 8G — CC0 Markdown v8003 Prewrite

Status: **PASS / LIVE PROTECTED-POPULATION IMPLEMENTATION EARNED / STEP 8F PARKED**

Date: **2026-09-15**

The preceding measurement of pinned `sylGauthier/recipes@b12e481d1c220a13e0847a34e148d5872a16928e` earned `STEP_8G_CC0_MARKDOWN_MEASUREMENT_EARNED_COHORT_CANDIDATE` for protected-scale testing only.

The exact no-write prewrite now passes for:

- active parent: `v8002` = 501 UniTools + 915 ForkRecipe = 1,416 protected recipes;
- child: `v8003` = 226 pinned CC0 Markdown recipes;
- composed protected corpus: **1,642 recipes**;
- existing topology: exactly **two** recipe-body shards;
- prior bodies remain immutable and are not copied into `v8003`;
- route index extends to 1,642 exact `(recipe_id -> corpus_version + shard)` routes;
- full-corpus scans remain zero.

## Earned prewrite evidence

- terminal candidate: `STEP_8G_CC0_V8003_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED`;
- child body bytes: 646,803;
- cumulative protected body bytes: 12,665,095;
- shard 0 composed rows/body bytes: 828 / 6,388,025;
- shard 1 composed rows/body bytes: 814 / 6,277,070;
- child batches: 23, maximum 10 rows per batch;
- maximum body: 7,288 bytes;
- maximum write request: 41,116 / 262,144 bytes;
- maximum planned write D1 subqueries: 15 / 16;
- mixed `v8001` + `v8002` + `v8003` hydration probe: PASS at 4 D1 subqueries;
- route-index SHA-256: `792e20e1bbc140c88a72beb04076942588dde759170cf38d7f7389455a783d6a`;
- composition SHA-256: `d78596da1e04bdcbdea780495def018424ee6e4d026d8781fbdc8d1119540b15`;
- prewrite validation run: `34949821164`.

The source packet preserves the exact raw Markdown plus pinned repository/commit/path/content fingerprint. Parsed ingredients, directions and tags are explicitly non-authoritative source metadata and do not become canonical ingredient, nutrition, dietary/allergen or scaling authority.

This PASS earns implementation of the authenticated live protected-population path for this exact `v8003` layer on the existing two-shard topology. The prewrite itself performed **zero D1 writes**.

Hard boundaries remain unchanged: Step 8F stays parked; public recommendations are unchanged; no third shard or billing expansion is authorized; Nutrition and YT-CUL are not mutated; Knowledge Core is read-only from this lane.
