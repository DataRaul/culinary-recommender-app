# Culinary Handover Circuit Breaker

Status: ACTIVE  
Policy: `config/context_safety_policy.json`

## Why V3 exists

The first two Culinary continuity designs preserved repository state but still allowed the active chat to continue silently into successor work. In real use, the chat could then become stuck before a user-visible handover appeared.

The reliable pattern observed in the Video Production Lab is simpler:

```text
fresh reconcile
→ execute exactly one bounded package/gate
→ terminalize or reach a real waiting/gate state
→ persist exact continuation state
→ output handover
→ STOP
```

Culinary now uses that pattern.

## Hard rule

One chat execution cycle may execute **one bounded package only**.

At the first terminal boundary—package terminal, material PR merge/close, human/error/cost/security gate, stable external wait, or early context risk—the agent must:

1. fresh-reconcile live GitHub;
2. rotate `continuity-state:docs/handovers/CURRENT.json -> PREVIOUS.json`;
3. write one complete new CURRENT;
4. re-read and verify CURRENT;
5. output the same complete CURRENT object to the user;
6. **STOP**.

Even if the successor gate is READY and already authorized, it belongs to the next chat/execution cycle.

## No silent continuation

A repository-only checkpoint is not enough at package completion. The terminal handover must be user-visible.

Standing “no narration” rules do not suppress this output because terminal/continuation boundaries are explicitly allowed response points.

## Early context rule

Do not wait for a precise context threshold.

If telemetry exists, approximately **50% used** is an intentionally conservative early trigger. Handover earlier if useful. If telemetry does not exist, never estimate a fake percentage; use context/tool-history risk and stop early.

## Loop breakers

### External waiting/status

One bounded re-check of an unchanged external status is allowed. If there is still no material change:

```text
record exact waiting state
→ record exact next re-check action
→ handover
→ STOP
```

Do not sit in a GitHub/CI/provider polling loop.

### Repair/revalidation

One bounded diagnosis and one justified repair/revalidation cycle may remain inside the package. If the same failure repeats or the cause is still materially uncertain, hand over and stop rather than trying equivalent repairs indefinitely.

## Handover location

Canonical resumability state:

- `continuity-state:docs/handovers/CURRENT.json`
- `continuity-state:docs/handovers/PREVIOUS.json`

Live `main`, open PRs, checks and authoritative generated state remain project truth and outrank the handover.

## Cost

No scheduled context watcher, polling workflow or background GitHub Action is used. Continuity-state writes are direct GitHub state writes with `[skip ci]`.

## Acceptance criterion

The mechanism passes only when a normal Culinary chat completes one bounded package and **automatically outputs a copy-pasteable handover and stops before beginning the successor package**.
