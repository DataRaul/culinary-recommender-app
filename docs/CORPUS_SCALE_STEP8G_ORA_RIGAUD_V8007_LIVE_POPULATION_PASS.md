# Step 8G — ORA Rigaud v8007 protected population PASS

Date: 2026-09-17

## Terminal

`STEP_8G_ORA_RIGAUD_V8007_PROTECTED_POPULATION_PASS`

The owner-authenticated production runner returned PASS after the restart-safe v8007 path completed exact population verification, idempotent replays, seven-layer bounded hydration, rollback fail-closed proof, reactivation, and terminal evidence collection.

## Proven protected state

- Active protected version: `v8007`
- Parent protected version: `v8006`
- Parent recipes: 2,906
- Rigaud child recipes: 789
- Composed protected recipes: 3,695
- Recipe-body shards: 2
- Body batches: 79
- Route batches: 79
- Maximum observed D1 subqueries in the authenticated run: 8
- Full-corpus scans: 0
- Public runtime remains 85 recipes and was not changed
- Recommendation admission was not changed
- No third shard was used
- No billing expansion was authorized or used

The fresh route-write design ceiling remains 16 D1 subqueries with zero assumed headroom. A lower observed maximum in this recovery-safe execution does not widen that contract.

## Source and authority boundary

Source cohort: `ORA_RIGAUD_1785_PORTUGUESE_SOURCE_AE3BD2C`

Source repository: `AdamBouhmad/open-recipe-archive` pinned at `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`.

Historical source identity: Lucas Rigaud, *Cozinheiro moderno, ou nova arte de cozinha* (1785), exact admitted 789-record subset documented by the preceding rights/measurement and prewrite gates.

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling, or medical authority.

## Roadmap disposition

This PASS satisfies the v8007 owner-authenticated production-write gate. It does **not** by itself earn `LEGAL_CORPUS_BASELINE_PASS` and does not unlock Recipe Family, Nutrition expansion, YouTube refinement, or broader public recommendation activation.

Continuation remains `STEP8G_RIGHTS_CLEAN_PROTECTED_SCALE`: audit and admit only independently rights-cleared cohorts, maintain explicit provenance/attribution classification, and stop fail-closed on unresolved rights, cost, topology, security, or diminishing marginal source value.

Canonical machine-readable evidence: `data/generated/step8g/ora-rigaud-v8007-live-pass.json`.
