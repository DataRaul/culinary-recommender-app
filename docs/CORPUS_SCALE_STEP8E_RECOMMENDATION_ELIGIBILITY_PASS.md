# Corpus Scale Step 8E — Recommendation Eligibility PASS

Status: **TERMINAL PASS / STEP 8F DECISION INPUT READY / PUBLIC ACTIVATION NOT AUTHORIZED**

Date: **2026-09-14**

Terminal: `STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS`

## Result

The exact pinned UniTools 1.1.0 cohort populated by Step 8D was evaluated through the existing app-owned ingredient identity, quantity, control-plane and ingestion-pipeline boundaries. The immutable source remained `farcrak/unitools-recipes@1d09e9548d957dd0375301146a86dddf5e269c1b`, blob `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`.

The strict preflight reviewed **501 stored records** and **5,404 ingredient occurrences**. Existing canonical name/alias authority resolved 2,524 occurrences; 2,807 remained unresolved and 73 were conflicting. Exactly **one recipe** resolved every ingredient without inventing new alias or source-ID authority:

- source slug: `tortilla-espanola`
- canonical candidate: `unitools_tortilla_espanola`
- dish family: `spanish_potato_omelet`
- hard allergen: `egg`
- reviewed dietary tag: `vegetarian`
- remaining protected records: **500 stored-only**

This narrow result is intentional. Step 8E does not promote source IDs or convenient source prose into canonical ingredient identity merely to increase yield.

## Frozen evidence

- readiness/admission workflow: **34862136962 — PASS**
- full repository + browser preactivation validation: **34862136927 — PASS**
- frozen evidence: `data/generated/step8e/admission-evidence.json`
- exact eligible subset: `data/generated/step8e/eligible-subset.json`
- control-plane SHA-256: `055747a8d4209908a35b7f2391be480d2b27c530a013a661986c49f6887f7609`
- ingestion-pipeline SHA-256: `c85be509e10d15b55a4a05e30eaf122a90154b25dd63888ca14823ace857f395`
- admission-manifest SHA-256: `a382db79f9dac4845bdae721b6e4231e6f10c7922183013b508a9d0c28662569`

CI regenerates the frozen evidence and exact subset from the immutable source and fails on semantic drift.

## Step 8F preactivation checks

The one-record candidate was tested as an isolated fixture through the real recommendation modules. The current public corpus remains **84 recipes** and does not contain the candidate. Machine checks passed for:

- hard dietary/allergen/permanent-exclusion/time/skill filters;
- deterministic ranking and one-slot planner behavior;
- ingredient search behavior;
- RecipeSource direct/V2 parity over bounded profiles;
- CC-BY-SA attribution and transformation provenance;
- source nutrition firewall;
- headless browser preactivation behavior using real browser modules.

`runtimeActivationAuthorized` remains **false** and `publicRuntimeChanged` remains **false**.

## Boundaries preserved

Step 8E performed no D1 writes, created no third shard, authorized no billing, modified no Nutrition or YT-CUL state, wrote nothing to Knowledge Core, and did not activate normal public recommendations.

## Current gate

Step 8F is now the current explicit human gate. The only decision input is the exact frozen one-record subset above. No broader UniTools cohort is eligible or implicitly authorized.
