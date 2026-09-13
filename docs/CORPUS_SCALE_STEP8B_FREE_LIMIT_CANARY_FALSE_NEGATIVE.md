# Corpus Scale Step 8B — Free-limit Canary False Negative

Date: 2026-09-13

Observed live result after production D1 bindings became visible:

- session check passed;
- status check passed;
- both D1 binding verification checks passed;
- simulated Free-limit path returned HTTP 503 with `STEP8B_FREE_LIMIT_FAIL_CLOSED`;
- `shardQueries` was exactly `0`;
- the browser canary nevertheless reported failure.

Root cause: the page used JavaScript `value || -1` when validating `shardQueries`. Because numeric zero is falsy, the legitimate zero was converted to `-1`, producing a false negative.

Repair: use nullish coalescing (`value ?? -1`) so only absent/null values fall back to `-1`; preserve zero as valid evidence. A static regression test prevents reintroduction of the faulty `|| -1` form.

Safety classification: `CANARY_PRESENTATION_FALSE_NEGATIVE__RUNTIME_FAIL_CLOSED_BEHAVIOR_PASS`. No Step 8B data write occurred during this failed page run because execution stopped before initialization. Step 8B terminal remains unearned until the full authenticated live canary and external unauthenticated denial complete.
