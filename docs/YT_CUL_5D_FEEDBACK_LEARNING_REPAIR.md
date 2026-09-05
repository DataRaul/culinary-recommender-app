# YT-CUL-5D — Canonical Feedback Learning Repair

Date: 2026-09-05

State: `MERGED_GREEN / FEEDBACK_AWARE_DAILY_CONTROL_ACTIVE`

Merge: `42a6951dda2e9c2ccad2969341bccf3188670a48`.

Validation: full repository validate + browser acceptance PASS on PR #79.

## Why this repair exists

The original YT-CUL-5D control plane adapted Search volume to packet yield, duplicates, source concentration and review backlog, but next-query targeting mostly rotated under-sampled Atlas focuses. That was safe but insufficient for the stronger programme objective: verified Knowledge Core outcomes must feed back into what the discovery system searches next.

This repair makes the loop explicitly:

```text
Search
→ independent evidence
→ ATLAS_RELEVANCE_REVIEW_READY packet
→ canonical Knowledge Core ACCEPTED / REJECTED / HELD outcome
→ policy-safe feedback context retained in app cumulative state
→ next-day focus ranking + Search scaling decision
→ continued exploration
→ repeat until YT-CUL-6 or a hard hold
```

## Deterministic learning law

The app does not train a black-box model and does not silently rewrite its query strategy.

For each canonical review outcome, the durable app state retains only policy-safe feedback context already present in the packet:

- bounded Atlas gap;
- candidate label;
- claim scope;
- independent source domain.

Recent canonical outcomes are scored by bounded Atlas gap:

- `ACCEPTED`: +3;
- `REJECTED`: -2;
- `HELD`: -1.

That score changes next-query priority. Accepted focuses are preferentially exploited; repeatedly rejected or held focuses lose priority.

## Exploration protection

At least 25% of an active daily budget is reserved for exploration after canonical feedback exists. Exploration prioritizes focuses with the least canonical feedback and then the least prior Search exposure.

This prevents the system from overfitting one early successful cuisine, region or source family.

## Search-scaling protection

Review-ready packet volume alone can no longer increase Search above the 16-call baseline.

Search may scale above 16 only after at least four canonical resolved outcomes (`ACCEPTED` or `REJECTED`) exist and the recent resolved acceptance rate is at least 50%, while the existing packet-yield, source-diversity, duplicate and backlog controls also remain healthy.

If at least four canonical resolved outcomes exist and acceptance is below 25%, Search budget is reduced even when raw packet volume looks healthy.

Existing absolute controls remain unchanged:

- minimum active budget: 8;
- baseline: 16;
- ordinary maximum: 32;
- five-call protected reserve;
- backlog hold at 40 unresolved packets;
- low-marginal-value hold after three consecutive active zero-packet days;
- policy/quota fail-closed guard;
- YT-CUL-6 automatic Search stop.

## Daily reporting

The scheduled GitHub Actions summary now exposes, in addition to acquisition/conversion KPIs:

- recent canonical accepted / rejected / held counts;
- canonical resolved acceptance rate;
- whether feedback-aware targeting is active;
- whether enough canonical feedback exists to unlock Search scaling;
- YT-CUL-6 readiness.

## Authority boundary

This repair does not let the Culinary App impersonate the Culinary Brain.

Only outcomes carrying `reviewAuthority: KNOWLEDGE_CORE_ATLAS_REVIEW` enter the learning signal. The app may adapt discovery to those outcomes, but it cannot create them, promote Atlas state, mark app authoring eligibility, or publish recipes by itself.

The remaining end-to-end automation dependency is therefore a canonical Knowledge Core review processor / governed cross-repository outcome bridge. Until that exists, YT-CUL-5D can learn from canonical outcomes when supplied, but it cannot manufacture the verification step that creates them.
