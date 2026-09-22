# Step 8G v8016 — D1 cost optimization before production population

Date: 2026-09-22

Status: `PRE_PRODUCTION_D1_COST_OPTIMIZATION__NO_PRODUCTION_WRITES`

## Why this was required

The previously merged v8016 runtime was safe under the per-request D1 subquery ceiling, but its physical route-composition model was unnecessarily expensive on the Cloudflare D1 Free plan.

The old v8016 plan would:

1. write the 501 new protected recipe bodies;
2. **copy all 16,510 v8015 route rows into a new v8016 composition**;
3. write 501 new v8016 route rows;
4. write and verify body/route receipts;
5. activate, rollback-test, and reactivate the pointer.

Cloudflare D1 Free currently includes 100,000 rows written per day and 5 million rows read per day. Since 1 September 2026, D1 fails Free-plan queries after the daily row-read or row-write limit is reached. D1 bills/limits rows written, including index writes, rather than raw SQL-query count.

References:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
- https://developers.cloudflare.com/d1/worker-api/return-object/

## Optimization

v8016 now uses:

`PARENT_V8015_REFERENCE_PLUS_V8016_DELTA`

The complete v8015 route composition already exists and is immutable. v8016 therefore does **not** duplicate those 16,510 routes. While v8016 is active, hydration resolves recipes from:

- parent routes: `composition_version='v8015'`
- new routes: `composition_version='v8016'`

The active pointer must still be v8016. After rollback to v8015, the v8016 hydration runtime fails closed because its pointer guard is no longer satisfied.

The v8016 physical route delta is therefore only **501 rows**.

## Batch-write optimization

Fresh body and route writes previously used one SQL INSERT statement per recipe row inside a D1 batch.

They now use one bounded multi-row INSERT statement plus one receipt INSERT per batch.

With the existing maximum of 10 recipe rows per batch:

- fresh body write: designed maximum **6 D1 subqueries including auth** (previously 15);
- fresh route write: designed maximum **7 including auth** (previously 16);
- bounded hydration: internal maximum **7**, therefore **8 including auth**;
- overall optimized expected request ceiling: **8**;
- hard fail-safe API ceiling remains **16**.

The owner runner fails if an observed request exceeds 8, even though the API retains the 16-query safety firewall.

## Row-write effect

At the application-table level, excluding index amplification and DDL metadata:

- old deterministic v8016 owner path: approximately **17,719** inserted/updated rows;
- optimized path: approximately **1,209**;
- avoided base-table writes: **16,510**;
- reduction: approximately **93.18%**.

Cloudflare's actual `meta.rows_written` is the authoritative usage measure and can be higher because indexes also count as written rows. Eliminating 16,510 route inserts also eliminates their associated index-write amplification.

## Invariants preserved

This optimization does not change:

- the Kenney-Herbert rights classification;
- the exact 501-recipe cohort;
- source/recipe payload fingerprints;
- v8016 layer manifest SHA;
- v8016 population-plan SHA;
- two-shard topology;
- public runtime (85 recipes);
- recommendation admission;
- cultural-authenticity authority;
- billing authorization.

No production D1 write is performed by this optimization PR.

## Production gate after merge

The owner-authenticated v8016 population remains required. Before running it, production must contain the optimized runtime. The terminal PASS must prove:

- parent v8015 / 16,510;
- child v8016 / 501;
- composed logical corpus / 17,011;
- **zero parent-route copy rows**;
- route storage mode `PARENT_V8015_REFERENCE_PLUS_V8016_DELTA`;
- observed D1 subqueries per request <= 8;
- sixteen-layer hydration;
- rollback to v8015 and v8016-only hydration fail-closed;
- final v8016 active;
- no public/recommendation/topology/billing widening.

Machine-readable optimization evidence:
`data/generated/step8g/v8016-d1-cost-optimization.json`.
