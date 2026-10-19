# Acquisition-first execution with non-blocking research lanes — owner adoption

Status: OWNER-APPROVED PROPOSED INTEGRATION (effective on main only after normal review/merge)
Date: 2026-10-18
Authority: `docs/ROADMAP.md` P0 acquisition-first; `AGENTS.md`, `docs/HANDOVER_PROTOCOL.md`, `docs/CONCURRENT_LANE_HANDOVERS.md`, and existing rights/CI gates remain controlling.

## Problem and decision
A long original-source, provenance or semantic-dedup investigation can absorb many validation cycles while adding **zero searchable recipes**. This is priority drift, not a prerequisite for independent acquisition. In particular, Soyer's historical research must not take over the main Culinary App lane or PR434 (the distinct HoChiPants origin audit).

**Standing owner decision:** Keep the **main Culinary App lane P0** continuously directed at obtaining, rights-clearing and making structurally usable recipes searchable; run uncertain, potentially valuable source research as a **secondary non-blocking branch/chat lane**. The secondary lane can later propose a separately gated PR against the latest main; it must not lock the acquisition roadmap while researching.

## Mandatory early escalation — before a repeat cycle
When a project task hits a material rights, access, provenance, unresolved source-body or semantic-dedup blocker, or after a meaningful work cycle produces no direct P0 value:
1. **Tell the owner promptly**, before consuming another substantial cycle. State precisely what blocked progress, why it matters, what actual user value was delivered (recipe counts/search visibility versus reports/tests), and estimated trade-off. Do not generate successive research versions as a substitute for a decision.
2. Recommend a small decision: **(A) remain P0 only if it is a critical dependency; (B) isolate in a P2 chat/branch lane and continue P0 elsewhere; (C) park until evidence becomes accessible.** Give a clear recommended option. Owner decides changes to priority/resource commitments; a prior explicit lane-isolation decision applies without repeated approval.
3. One targeted unchanged-dependency retry at most. Persist evidence, checkpoint, and stop only the affected lane while **main P0 continues**. Do not frame an inaccessible input as evidence of novelty.
4. Every further cycle must have a new decision-relevant input or measurable progress toward eligible recipes. Do not indefinitely expand metadata, revalidation, or handovers for their own sake.

## Lane ownership and isolation
| Lane | Priority, branch and chat | Delivery | Gate / coordination |
| --- | --- | --- | --- |
| `culinary-app` (canonical) | **P0**. Existing `continuity-state:docs/handovers/culinary-app/CURRENT.json`; new implementation packages from fresh main in their own ordinary branches; normal chat or Work | Discover another lawfully reusable source family, qualify provenance/structure/rights, import eligible records under existing authority, maintain **search/open** availability and measure net usable additions | Protected D1 and runtime changes only under existing gates, serialized shared writes; no recommendation-promotion prerequisite for searchable recipes |
| `culinary-soyer-research` (secondary) | **P2**. `research/soyer-secondary-20261018`; separate normal chat, read-only by default | Recover verified inputs; complete original-recipe and translated dedup; resolve references and documentary rights; produce an evidence-backed candidate cohort | Never overwrite canonical `culinary-app` CURRENT; no import/production write, no automatic merge, no review-budget reset; PR only when eligible and user/normal gates allow |
| Other independent research | Secondary by explicit owner steering | Same pattern as Soyer | Separate branches, source/evidence/owner, no implicit P0 critical-path promotion |

Soyer kickoff: `research/soyer-secondary-20261018:docs/research/soyer/SOYER_SECONDARY_CHAT_HANDOVER.json`.
Main kickoff: `docs/handovers/parallel-acquisition/MAIN_ACQUISITION_HANDOVER_20261018.json` (static starting handover, **not** a replacement for canonical CURRENT).
Soyer's index migration to the registered `continuity-state` lane registry, if needed, requires a **separately reviewed governance update** and atomic CURRENT/PREVIOUS bootstrap; do not silently edit another lane's checkpoints or invent completed publication.

## Merge and product acceptance
A secondary branch merges **only when** full exact-source/body and v8019-baseline provenance, documentary rights, deduplication/novelty or useful variant disposition, structural/usability review, required same-chat package reviews, CI and owner-controlled product admission are satisfied. Merge research evidence separately from protected recipe admission if appropriate; a merged research PR never automatically imports recipes. Reconcile current main and concurrent PR changes before proposing merge. Preserve the seven HoChiPants origin holds, six adaptation holds, all previously exhausted quality budgets, Based Cooking STOP, PR428/429/432, Brain and Barbecue.

## Business value / stop-rule checks
At each terminal gate report: candidate source families examined; rights-cleared/usable recipes; **net new recipes actually indexed and searchable**; blocked cohorts and decisive missing evidence; elapsed validation cycles; next best alternative. Zero recipes added can be a legitimate research result, but is **not a reason to displace P0**. Runtime safety, source legality and resource-cost gates are not weakened by this policy.

## Chat boundary
Separate chats can continue these branches independently when the user runs them; no asynchronous or unattended execution is implied. Within an individual implementation lane, retain the already-adopted same-chat Aligner → Solution Review → Builder → Supporter → Critic → Synthesis sequence and inherited local quality gates. Do not require the owner to shuttle between reviewer chats or repeat settled scope.

## Enforceable prospective adapter

The generic shared portfolio-priority contract is staged in Agent OS PR57, and the Culinary adapter is in this stacked consumer change. `config/package_quality_portfolio_adapter.json` pins the shared checker without changing frozen legacy contracts; `config/portfolio_priority_policy.json` sets P0 and isolated P2 lanes. At each new package boundary a validated decision and strategic Critic response must precede another research cycle. This only becomes active after both reviewed merges; no historical replay is authorized or necessary.
