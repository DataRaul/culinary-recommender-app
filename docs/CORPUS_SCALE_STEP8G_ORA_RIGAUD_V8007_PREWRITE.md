# Corpus Scale Step 8G — Lucas Rigaud 1785 v8007 prewrite

Status: **PASS — IMPLEMENTATION EARNED / NO LIVE WRITE YET**  
Date: 2026-09-16

## Result

The exact 789-record Lucas Rigaud 1785 cohort passed the no-write v8007 capacity and request-budget gate against the active v8006 / 2,906 protected parent.

Terminal: `STEP_8G_ORA_RIGAUD_1785_V8007_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED`

Frozen CI evidence:

- workflow run: `35107716388`
- artifact: `10451336020`
- artifact digest: `sha256:048a23d83ac5d5d55ec32a15d760e574315ed34bc2819d1e30c1438934f75852`
- canonical evidence: `data/generated/step8g/ora-rigaud-v8007-prewrite-evidence.json`
- canonical validation: `data/generated/step8g/ora-rigaud-v8007-prewrite-validation.json`

## Exact composition

- parent: v8006 / 2,906 protected recipes
- child: 789 Rigaud recipes
- target v8007 composition: 3,695 protected recipes
- protected body shards: exactly 2
- child shard rows: 399 / 390
- planned body batches: 79
- maximum rows per fresh batch: 10

Parent fingerprint: `345db0d7d8fd664807431de604596b6a685b48f382a0179c5c264a8758b4464b`.

Frozen v8007 layer manifest: `1b840b2d0c0ccd5e64309206a4e3640c6e51e9d7f505ab9e976414361c526d02`.

Frozen population plan: `e30f5ffb8c914e3138eae7375236daf3507210c2f4182e1c824b78fd3db1a7fd`.

## Capacity and request budget

The new layer adds 2,499,852 bytes of recipe-body payload, taking layered physical body payload from 16,345,185 to 18,845,037 bytes. Both existing shards remain well inside the project database budget.

The largest modeled live body-write request is 16,790 bytes, below the inherited 262,144-byte request ceiling.

Fresh route writes at 10 rows require exactly 16 D1 subqueries including auth. This is the inherited maximum. No headroom is assumed. An 11-row route batch would require 17 and must fail closed.

## Authority earned

This PASS earns implementation of a v8007 owner-authenticated protected-population runner on the existing two-shard / 16-query envelope.

It does **not** itself authorize or perform a production D1 write, public recommendation admission, third shard, D1-budget expansion, billing expansion, Nutrition/YT-CUL/Knowledge Core mutation, or cultural-authenticity authority import. Public runtime remains 85 recipes and Step 8F remains exactly `unitools_tortilla_espanola`.
