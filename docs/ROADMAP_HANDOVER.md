# Roadmap Handover Pointer

Status: ACTIVE

This file is the continuation pointer for `docs/ROADMAP.md`. Live GitHub and `docs/handovers/CURRENT.json` outrank historical summaries.

## Canonical routing

Always use:

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- handover protocol: `docs/HANDOVER_PROTOCOL.md`
- canonical programme: `docs/ROADMAP.md`
- execution-priority amendment: `docs/ROADMAP_EXECUTION_PRIORITY_AMENDMENT_2026-09-06.md`
- 170k no-billing architecture: `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md`
- Step 7A measured rebaseline: `docs/CORPUS_SCALE_STEP7A_NO_BILLING_AUTH_REBASELINE.md`
- Step 7D protected runtime evidence: `docs/CORPUS_SCALE_STEP7D_PROTECTED_84_CANARY.md`
- Step 7E source pilot: `docs/CORPUS_SCALE_STEP7E_FORKRECIPE_PILOT.md`
- Step 7E live 500 evidence: `docs/CORPUS_SCALE_STEP7E_LIVE_500_CANARY.md`
- Step 8 roadmap: `docs/CORPUS_SCALE_STEP8_MEASURED_POPULATION_ROADMAP.md`
- Step 8 machine gate contract: `config/corpus_scale_step8_roadmap.json`
- Step 8A population contract: `docs/CORPUS_SCALE_STEP8A_POPULATION_CONTRACT.md`
- Step 8A validation evidence: `docs/CORPUS_SCALE_STEP8A_VALIDATION.md`
- YouTube generated state: `data/generated/youtube-culinary-daily-discovery-state.json`
- YouTube daily roadmap: `docs/YOUTUBE_CULINARY_DAILY_DISCOVERY_TO_YT_CUL_6_ROADMAP.md`

Older Access/R2/100k summaries are historical only for runtime/storage/cost sequencing. The 170k no-billing architecture and Step 8 documents control current Corpus Scale work.

## Corpus Scale status

Required capacity: **170,000** admitted recipes. Synthetic stress/headroom target: **250,000**.

Hard cost rule: **never accept a product/subscription setup that authorizes automatic overage/payment charges.** Workers Paid, R2 and Zero Trust/Access remain rejected. Free exhaustion must fail closed.

Steps 7A–7E are complete. Step 7E terminal is:

`STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS`

There is **no Step 7F**. Post-Step-7E continuation is Step 8.

### Step 8A — COMPLETE / PASS / MERGED GREEN

Terminal:

`STEP_8A_POPULATION_CONTRACT_PASS`

PR #113 merged at `68e5f159000a8b7c1677155f49ef9cde7a0801b9`.

Evidence:

- PR validation `34499533385`: PASS;
- evidence rerun `34499738756`: PASS;
- post-merge validation `34499905915`: PASS, including production smoke;
- Pages deployment `34499905387`: PASS.

Step 8A proved only the repository population contract. It created **zero** recipe-body D1 shards and performed **zero** protected corpus population.

Frozen implementation properties:

- deterministic shard routing reuses the Step 7A router;
- first live canary topology: exactly **2 recipe-body shards**;
- maximum planned recipe-body shards remains **8**, with one database slot reserved;
- pre-8B write plan remains <=10 recipe rows + one receipt/metadata statement;
- exact receipts support idempotent/resumable population;
- conflicts fail closed;
- rollback is an integrity-checked immutable-parent version pointer switch, not destructive deletion;
- public runtime, automatic admission, source nutrition/dietary/allergen/ratio authority and billing authority remain false.

### Current earned work

Two lanes may now proceed in parallel:

1. **8B machine prerequisite preparation** — repository work only until the live gate. A human/account action is mandatory before creating even the first of the two recipe-body D1 canary shards.
2. **8C scalable source qualification** — documentary source/rights evidence may proceed autonomously. Human/legal escalation occurs only if a materially valuable ambiguity remains after documentary evidence is exhausted.

Step 8D remains blocked until both 8B and 8C produce their required PASS inputs.

Step 8E remains blocked behind 8D. Step 8F remains an explicit human public-runtime gate. Step 8G remains blocked behind 8D and does **not** depend on 8F.

## Source state entering 8C

- existing curated corpus + Wikibooks: established;
- Open Recipe Archive Spanish: `HOLD_RIGHTS_AMBIGUOUS`, zero admitted;
- Open Recipe Archive complete corpus: candidate but not ready while transformation/content-rights provenance remains unresolved;
- ForkRecipe: Step 7E protected-pilot PASS only, zero public recommendation admission;
- UniTools: candidate not yet audited;
- RecipeDB: conditional source-cohort salvage gate.

Raw recipe count is never an admission criterion.

## Concurrency boundaries

The Nutrition B lane is independent and must not be modified or duplicated by Corpus Scale work.

YT-CUL-5D / YT-CUL-6 state is independent and read-only from Corpus Scale. Fresh reconciliation on 2026-09-10 found the generated daily state active with `lastCompletedQuotaDate: 2026-09-10`; do not overwrite or infer its current readiness from this pointer—read the generated state directly.

Knowledge Core is read-only/reconciliation from the App lane. Conversation-time Brain/consultant/coach use must not create a private Knowledge Core browser/runtime dependency or bypass normal public-safe behavior gates.

## Next execution rule

Proceed with **8B machine prerequisites + 8C source qualification in parallel**. Do not create D1 recipe-body shards, populate Step 8D, activate new public recommendations, change Nutrition B or YT-CUL state, write Knowledge Core, or authorize paid/overage infrastructure until the relevant later gate is explicitly earned.
