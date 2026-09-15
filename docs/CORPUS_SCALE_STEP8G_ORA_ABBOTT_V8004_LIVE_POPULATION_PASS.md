# Corpus Scale Step 8G — Abbott v8004 live protected population PASS

Date: 2026-09-15

Status: **PASS / v8004 ACTIVE / CONTINUE BOUNDED STEP 8G LOOP**

## Terminal

`STEP_8G_ORA_ABBOTT_V8004_PROTECTED_POPULATION_PASS`

The owner-authenticated production runner completed the earned Edward Abbott 1864 protected-only expansion on the existing two-shard topology.

- Parent protected corpus: `v8003` / 1,642 recipes.
- Abbott child layer: 713 recipes.
- Active composed protected corpus: `v8004` / 2,355 recipes.
- Body batches: 73.
- Route batches: 73.
- Recipe-body shards: 2.
- Full-corpus scans: 0.
- Maximum observed D1 subqueries: 16, equal to but not above the existing protected-request ceiling.
- Body replay: idempotent PASS.
- Route replay: idempotent PASS.
- Four-layer hydration across v8001-v8004: PASS.
- Rollback to v8003: PASS.
- v8004 hydration after rollback: fail-closed PASS.
- Final reactivation: v8004 PASS.

Canonical evidence: `data/generated/step8g/ora-abbott-v8004-live-pass.json`.

## Implementation and machine validation

The protected runtime was implemented in PR #165 and merged as `c2171ed3a9e54f3006644324bb9107a17febd4d6`.

- Dedicated Abbott exact-source parity / integrity run: `35015839187` — PASS.
- PR repository + browser validation run: `35015839171` — PASS.
- Post-merge validation run: `35016016846` — PASS, including repository validation, browser tests and production public-runtime smoke.
- Pages deployment run: `35016015375` — PASS.
- The authenticated production runner was observed on the deployed production surface and returned the terminal above.

The frozen source remains `AdamBouhmad/open-recipe-archive@ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`, bounded to the Edward Abbott 1864 public-domain cohort. Exact source parity remains 713 recipes.

## Preserved firewalls

This terminal changes protected storage only.

- Public runtime changed: **false**.
- Recommendation admission changed: **false**.
- Automatic broader public admission authorized: **false**.
- Third shard used or authorized: **false**.
- Billing expansion used or authorized: **false**.
- Nutrition lane modified: **false**.
- YT-CUL lane modified: **false**.
- Knowledge Core write performed: **false**.
- Step 8F remains scoped to exactly `unitools_tortilla_espanola`; the public runtime remains 85 recipes and the historical golden corpus remains 84.

## Capacity interpretation

`maxObservedD1Subqueries = 16` is a PASS because it equals the inherited maximum, but it is **not spare headroom**. A later Step 8G cohort must independently prove its request/query budget in prewrite before live population. This terminal does not authorize a third shard, paid infrastructure or a larger D1 request budget.

## Continuation authority

Step 8G remains active. The next action is another bounded rights-clean cohort measurement/prewrite only if marginal coverage or quality justifies it. No additional public recommendation activation is implied by this protected-scale PASS.
