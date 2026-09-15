# Corpus Scale Step 8F — public runtime activation PASS

Date: 2026-09-15

Terminal: `STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED`

The owner explicitly authorized the exact Step 8E one-record subset and PR #160 activated only `unitools_tortilla_espanola`. PR validation, browser acceptance, Cloudflare deployment and the post-merge production smoke all passed.

## Public result

- Live public runtime: **84 → 85 recipes**.
- Public external records: **8 → 9**.
- Activated record: `unitools_tortilla_espanola` only.
- Historical `ALL_RECIPES` benchmark/oracle: **84 and unchanged**.
- The activated record can participate in ordinary ranking, planning and ingredient search.
- Egg-allergen, vegan, permanent-exclusion, time and skill hard filters remain enforced.
- UniTools attribution and CC-BY-SA-4.0 provenance remain visible.
- Source nutrition remains non-authoritative and unavailable unless separately calculated by the reviewed Nutrition lane.

## Boundaries preserved

- No automatic or bulk recommendation admission is authorized.
- The other protected/stored-only records remain non-public.
- Step 8G protected corpus remains v8003 with 1,642 recipes on two shards.
- No third shard and no billing expansion.
- Nutrition and YouTube Culinary lanes are unchanged.
- Knowledge Core remains read-only from this lane.

Canonical evidence: `data/generated/step8f/public-runtime-activation-pass.json`.
