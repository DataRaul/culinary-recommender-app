# Corpus Scale Step 7A — No-Billing-Authorization 170k Rebaseline

Status: **PASS / MERGED GREEN / STEP 7B HUMAN FREE-RESOURCE CHECK EARNED**

Canonical architecture: `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md`.

Terminal implementation: PR #66, merged at `8cc1a672d7f7dc33d12b17169908c69685a733c4`.

## Decision this gate answered

Can the Culinary runtime preserve all of the following simultaneously without provisioning an external paid/usage-authorized resource?

- 170,000 admitted-recipe required capacity;
- 250,000 synthetic stress/headroom measurement;
- invitation-only protected corpus access;
- provider-neutral `RecipeSource` V2 and identity boundaries;
- bounded candidate hydration (`<=256`);
- a deliberately sharded D1-Free-shaped storage/query model with one reserved database slot;
- no protected large-corpus recipe/index assets on ordinary public Pages paths;
- no full-corpus runtime scans;
- no automatic billing/overage authority.

**Answer: PASS for the local/provider-neutral architecture proof.**

This result does not create D1, activate Workers Paid, configure Google identity, activate Cloudflare Zero Trust, activate R2 or admit a real external corpus.

## Existing evidence preserved

Steps 1–6 remain historical merged-green evidence. Step 7A extends rather than rewrites them:

- Step 1: deterministic synthetic scaling and recipe/index size budgets;
- Step 2: `RecipeSource` V1/V2 parity;
- Step 3: provider-neutral portable corpus layout;
- Step 4: bounded indexed retrieval before evaluator/scorer;
- Step 5: generalized source admission control plane;
- Step 6: incremental validation architecture.

The reviewed 84-record runtime corpus remains the behavioral golden oracle.

## Scale ladder

Full run passed:

`1,000 -> 10,000 -> 50,000 -> 100,000 -> 170,000 -> 250,000 stress`

170k is the required production capacity. 250k is a stress/headroom test and is not a commitment to populate 250k recipes.

## D1-shaped provider-neutral storage model

Step 7A models the candidate free layout without creating Cloudflare resources:

- 1 control/auth/index database;
- 8 recipe-body database shards;
- 1 database slot reserved for migration/emergency headroom.

Recipe rows remain portable JSON payloads. Recipe-to-database routing uses a deterministic stable hash of recipe ID.

The storage estimate is deliberately conservative rather than pretending to reproduce Cloudflare's internal SQLite accounting exactly:

`estimated recipe row bytes = ceil((serialized body bytes + recipe-id bytes + 256) * 1.25)`

Compact posting-list indexes are modeled as packed unsigned 32-bit recipe ordinals plus 512 bytes of per-artifact metadata/row overhead:

`estimated index row bytes = posting_count * 4 + 512`

A fixed 16 MiB control/auth allowance is added to the control/index database.

These are **architecture estimates**, not actual D1 billing/storage measurements. The later protected runtime canary must measure real D1 state before corpus expansion.

## Project safety budgets

At 170k required capacity:

- total estimated D1 footprint: **<= 3.5 GiB**;
- each database: **<= 350 MiB**;
- one database slot remains reserved;
- compact index artifact row: **<= 1 MiB**;
- candidate hydration: **<= 256 recipes/query**;
- D1 subqueries: **<= 16/protected request**;
- full-corpus scans: **0**.

At the 250k stress point, compact index artifact rows must still remain <=1 MiB so even a posting containing every ordinal remains comfortably below the currently documented 2 MiB D1 row/BLOB ceiling.

## Measured terminal evidence

Dedicated Step 7A workflow: `33986959491` — **PASS**.  
Public validation: `33986959477` — **PASS**.  
Step-1 regression workflow: `33986959483` — **PASS**.  
Focused contract tests: **10/10 PASS**.

Golden oracle:

- recipe count: **84**;
- IDs SHA-256: `062105fae761ce06357fdd2b068ed41c89590b9b89d984fbbe3ebb76d1b1407a`;
- record SHA-256: `4b876f65ca0aa2ab6db3c2e4f1ca6c0af9e91f03e3923dfd3bfd9da2bcfe2f41`.

### 170k required point

- raw serialized recipe bytes: **663,576,660**;
- estimated recipe-store bytes: **892,941,516**;
- control/auth/index DB estimate: **29,514,044 bytes**;
- total estimated footprint: **922,455,560 bytes** versus **3,758,096,384-byte** project budget;
- max recipe-body shard: **111,938,240 bytes** versus **367,001,600-byte** per-DB project budget;
- max index artifact row: **680,512 bytes** versus **1,048,576-byte** project budget;
- database slots: **9 used + 1 reserved**;
- candidate hydration: **<=256**;
- modeled D1 subqueries: **10–12/request** versus project cap **16**;
- full-corpus scans: **0**.

### 250k stress point

- raw serialized recipe bytes: **975,908,151**;
- estimated recipe-store bytes: **1,313,226,540**;
- control/auth/index DB estimate: **35,472,108 bytes**;
- total estimated footprint: **1,348,698,648 bytes**;
- max recipe-body shard: **164,884,232 bytes**;
- max index artifact row: **1,000,512 bytes**, still below the 1 MiB project cap;
- database slots: **9 used + 1 reserved**;
- candidate hydration: **<=256**;
- modeled D1 subqueries: **10–12/request**;
- full-corpus scans: **0**.

## Protected query model

For each deterministic benchmark scenario:

1. one current-account/allowlist check;
2. one compact index row read per query dimension;
3. posting intersection;
4. deterministic cap to <=256 candidates;
5. candidate IDs grouped by recipe database shard;
6. one batched detail query per touched recipe shard;
7. existing evaluator/scorer/planner remains downstream.

Modeled D1 subqueries therefore equal:

`1 auth/account + N index rows + N touched recipe shards`

The measured range is 10–12, below the project cap of 16.

## Worker CPU proxy boundary

The harness measures local wall-clock time for only the deterministic Worker-shaped routing work: posting intersection, candidate bounding and shard grouping.

The architecture budget records **8 ms p95 as an advisory warning**, not a terminal CI failure, because GitHub-runner wall-clock time is not equivalent to Cloudflare Workers CPU accounting.

At 170k, local p95 proxy measurements ranged approximately **8.71–11.88 ms** across the benchmark scenarios. At 250k stress, the highest observed local p95 proxy was **21.56 ms**.

These values do **not** prove a Workers Free CPU failure. They confirm that actual Workers CPU measurement remains necessary. **Actual Workers Free CPU usage is therefore a mandatory Step 7D protected-canary gate before corpus expansion.**

## Authentication / authorization contract

Step 7A does not create a Google client or production login. It freezes provider-neutral behavior:

- `IdentityVerifier` is provider-neutral;
- no public signup;
- exact invited email membership remains separate from authentication;
- allowlist/account bindings are private runtime state only;
- provider subject + issuer are the stable binding identity;
- owner email is runtime-private bootstrap input, never a repository literal;
- sessions require protected cookies/signing and a current account/revocation check;
- reusable provider credentials are not stored as app sessions.

Initial identity candidate is Google GIS/OIDC. The pure contract tests require server-side signature verification, audience, issuer and expiry checks. Google-authoritative email proof is limited to Gmail identities and Google Workspace identities with the hosted-domain signal; third-party-email Google Accounts are not silently accepted as authoritative email ownership.

## Static-data firewall

Because Cloudflare Access is no longer part of the architecture, the Pages shell itself may be publicly reachable. Therefore **new protected large-corpus recipe bodies and protected retrieval-index artifacts must never be emitted as ordinary public Pages assets**.

Step 7A passed the future deployment-separation contract. It does not retroactively change the current public 84-record app in this repository-only gate; protected cutover of the reviewed oracle occurs only in the later Step 7D security/runtime canary.

## Terminal result

`NO_BILLING_AUTH_170K_ARCHITECTURE_PASS`

This PASS earns only the next human **Step 7B Free developer-resource provisioning check**. It does not authorize payment, a `$0` subscription with overage authorization, D1 population, Workers Paid, Zero Trust, R2, production Google identity or real-source ingestion.

If the account-side D1/Workers step displays checkout, subscription activation, payment authorization, overage authorization or ambiguous billing language, stop and reject or inspect the resource regardless of this local PASS.

## Next action

**Step 7B — human Free developer-resource provisioning check.**

First action only:

`Cloudflare Dashboard -> Storage & databases -> D1 SQLite Database`

Inspect the next screen before accepting anything.

Allowed terminal classifications:

- `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`
- `BILLING_OR_OVERAGE_AUTHORIZATION_PRESENT`
- `AMBIGUOUS`
