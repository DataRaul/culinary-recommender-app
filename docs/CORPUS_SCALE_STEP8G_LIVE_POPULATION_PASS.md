# Corpus Scale Step 8G — live protected population PASS

Date: 2026-09-14

Terminal: `STEP_8G_FORKRECIPE_V8002_PROTECTED_POPULATION_PASS`

The authenticated production operator run completed successfully after the browser source-order fix merged in PR #154. The protected ForkRecipe layer `v8002` is now physically populated and left active for protected Step 8G work only.

## Live production evidence

- ForkRecipe child layer: 915 recipes
- Existing parent layer `v8001`: 501 recipes
- Composed protected corpus: 1,416 recipes
- Body batches: 93
- Route batches: 144
- Recipe-body shards: 2
- Idempotent body replay: PASS
- Idempotent route replay: PASS
- Mixed-layer cross-shard hydration: PASS
- Pointer rollback to `v8001`: PASS
- Hydration fail-closed after rollback: PASS
- Final protected active version: `v8002`
- Full-corpus scans: 0
- Maximum observed D1 subqueries: 16

## Boundaries preserved

- Public runtime changed: false
- Recommendation admission changed: false
- Third shard used: false
- Billing expansion: false
- Step 8F remains parked
- Nutrition lane remains independent
- Knowledge Core remains read-only from this lane

This terminal earns the next bounded Step 8G protected-scale iteration only. It does not authorize public-runtime activation or automatic recommendation admission.

Canonical machine evidence: `data/generated/step8g/live-population-pass.json`.
