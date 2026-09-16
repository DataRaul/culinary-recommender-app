# Corpus Scale Step 8G — Turabi v8006 live protected population PASS

Date: 2026-09-16

Status: **PASS / v8006 ACTIVE / CONTINUE BOUNDED STEP 8G LOOP**

## Terminal

`STEP_8G_ORA_TURABI_V8006_PROTECTED_POPULATION_PASS`

The owner-authenticated production flow completed the earned Turabi Efendi 1864 protected-only expansion on the existing two-shard topology. The original runner encountered a restart-state bug after v8006 was already active; PR #175 added a strict recovery runner that first verified the exact already-written v8006 composition before completing idempotent replay, hydration, rollback/fail-closed proof and final reactivation.

- Parent protected corpus: `v8005` / 2,464 recipes.
- Turabi child layer: 442 recipes.
- Active composed protected corpus: `v8006` / 2,906 recipes.
- Body batches: 45.
- Route batches: 45.
- Maximum rows in a fresh batch: 10.
- Recipe-body shards: 2.
- Full-corpus scans: 0.
- Maximum observed D1 subqueries during the recovery terminal run: 8.
- Inherited maximum protected-request ceiling: 16.
- Fresh route-write prewrite ceiling remains 16/16 with zero assumed headroom.
- Body replay: idempotent PASS.
- Route replay: idempotent PASS.
- Six-layer hydration across v8001-v8006: PASS.
- Rollback to v8005: PASS.
- v8006 hydration after rollback: fail-closed PASS.
- Final reactivation: v8006 PASS.

Canonical evidence: `data/generated/step8g/ora-turabi-v8006-live-pass.json`.

## Implementation and recovery validation

The protected runtime was implemented in PR #173 and merged as `35bfbad7d88a9211fffae1289e36f57e8b9282ab`.

The original deployed runner exposed a resumability defect: after activation had already advanced the pointer to v8006, restarting from the beginning attempted `copy-parent-routes` under an obsolete assumption that v8005 must still be active. The server correctly failed closed with `V8005_PARENT_NOT_ACTIVE`; no budget or topology boundary was breached.

PR #175 repaired the recovery path and merged as `e7494bb0c3fb3cf448bbb9ccf91f986c473be61a`.

- Post-recovery main validation run: `35091062457` — PASS.
- Repository validation: PASS.
- Browser validation: PASS.
- Production public-runtime smoke: PASS.
- Pages deployment run: `35091061753` — PASS.
- Cloudflare Pages deployment: PASS.
- The authenticated recovery runner was observed on the deployed production surface and returned the terminal above.

The recovery runner did not blindly skip the failed step. It required v8006 already active, verified the exact frozen closure of 442 child bodies, 2,464 parent routes, 442 child routes and 2,906 composed routes, replayed all frozen body and route batches idempotently, proved six-layer hydration, rolled back to v8005, proved v8006 hydration failed closed while rolled back, and reactivated v8006.

The frozen source remains `AdamBouhmad/open-recipe-archive@ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`, bounded to the 442-record Turabi Efendi 1864 shelf cohort from *A Turkish Cookery Book*. The source label is historical provenance only. It does not import cultural-authenticity authority, ontology authority, dietary/allergen authority, nutrition authority or scaling authority.

## Preserved firewalls

This terminal changes protected storage only.

- Public runtime changed: **false**.
- Public runtime remains 85 recipes.
- Historical golden corpus remains 84 recipes.
- Step 8F authority remains exactly `unitools_tortilla_espanola`.
- Recommendation admission changed: **false**.
- Automatic broader public admission authorized: **false**.
- Third shard used or authorized: **false**.
- D1 request-budget expansion used or authorized: **false**.
- Billing expansion used or authorized: **false**.
- Nutrition lane modified: **false**.
- YT-CUL lane modified: **false**.
- Knowledge Core write performed: **false**.
- Cultural-authenticity authority imported: **false**.

## Capacity interpretation

The recovery run observed at most 8 D1 subqueries because it verified and replayed an already-populated v8006 state. That lower observation does **not** widen the design envelope. The frozen prewrite still establishes a fresh route-write ceiling of exactly 16/16 D1 subqueries at 10 rows, with zero assumed headroom. No additional D1 query may be added to the fresh route-write path without redesign, and no third shard or paid infrastructure is authorized by this terminal.

The protected composed corpus is now 2,906 recipes against the 170,000 required-capacity programme target. This closeout does not justify raw-count expansion by itself; every later cohort must independently earn rights, marginal-value measurement, prewrite budget safety, implementation and any required live production gate.

## Continuation authority

Step 8G remains active. The next machine action is source discovery/measurement for the next independently rights-clean protected cohort. No next cohort is admitted merely because v8006 passed, and no additional public recommendation activation is implied by this protected-scale PASS.
