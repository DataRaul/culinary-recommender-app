# Package quality protocol — owner-selected pilot V1

Status: PROCEDURAL_PILOT. Apply to every substantive bounded package in this project. Read the root AGENTS instructions, existing contracts and `config/package_quality_adapter.json`. Fetch the shared skill, role references and checker from the exact public source commit in that adapter; verify file hashes before execution. A connector can materialize those exact files; a local checkout can supply `--agent-os-root`. Never fetch floating main for execution or install a paid API/service. This is developer workflow only, outside application/notebook runtime.

## Normal cycle

1. **Align internally.** Reconcile live main/open PRs/checks, lane authority, latest user steering, versioned lane goal and checkpoint. Route through canonical KC `domains/project_execution/objects/agentic_work_mandate_harness.md`; the canonical conversation router retains optional post-task coaching. Retrieve known context before asking. A clear request or continue needs no ritual question.
2. **Record a package contract.** Copy `docs/package_quality/CONTRACT_TEMPLATE.json` into a new named contract and fill it from evidence. Use the existing lane goal if sufficient; otherwise record a small versioned goal under `docs/package_quality/goals/<lane>/vN.json`. The supplied quality-pilot goal covers installation only, not other research/product goals. Preserve authorized outcome, why, acceptance IDs, fixed constraints, source/time and goal revisions. Examples are not universal requirements.
3. **Build/check.** Keep one bounded outcome. Record criterion → deliverable → evidence → contribution. Recheck alignment after material discoveries. Scope corrections are autonomous; new goals or frozen-criterion changes require existing authority. Preserve failures, remaining budget and blockers across continue/resume.
4. **Freeze.** Use the hash-pinned shared checker through the wrapper. Include every proposed publication change and generated deliverable plus evidence; in a real checkout use `--git-base` to include changed/untracked paths. Connector publishers use the exact outgoing Git tree entries, including deletions. Avoid circular hashes: packet and review reports are validated sidecars.
5. **Supporter session.** Invoke the pinned constructive role in a separate session, inspecting actual files and user-outcome coverage. Both roles independently route to minimal KC domains and record exact commit/object/applied-rule provenance. Classify required fixes separately from optional additions. Integrate justified corrections, refreeze and obtain a final-candidate recheck.
6. **Fresh critic session.** Give final artifact, contract, goal and source evidence without the supporter verdict or author's reasoning initially. Challenge failures, contradictions, missing evidence and scope. Final reports from both roles must bind the same candidate and cover all criteria.
7. **Validate before publication.** Fresh-read current base and branch head. Run the checker with `--current-base` and an exact outgoing path inventory. Changed candidate/criteria/goal/adapter/evidence/base invalidates earlier reports. Missing reviewers/mandatory knowledge, unresolved material defects or exhausted budget holds publication. Then use existing authorized PR/merge/CI paths; preserve required CI and verify resulting main/runtime. Review readiness is not operational completion.
8. **Checkpoint.** Store goal version/hash, last evidence, reports, unfinished criteria, failures, decisions, remaining budget and exact authorized next action. Reconcile and check the goal again on takeover. A handover is a locator/history record, never evidence of freshness or success.

## Invocation

```bash
python scripts/package_quality.py --agent-os-root /exact/pinned/agent-os freeze --contract docs/package_quality/contracts/<package>.json --paths <all-publication-changes> --output docs/package_quality/evidence/<package>/packet.json
python scripts/package_quality.py --agent-os-root /exact/pinned/agent-os validate --packet docs/package_quality/evidence/<package>/packet.json --supporter docs/package_quality/evidence/<package>/supporter.json --critic docs/package_quality/evidence/<package>/critic.json --current-base <fresh-main-sha> --publication-list /scratch/outgoing-paths.json
```

The wrapper verifies shared file SHA-256 values and runs the standard-library checker with this project root. It does not launch agents, call APIs, fetch data, publish changes or replace CI. The coordinator invokes native reviewer sessions from the role procedures; if separate sessions are unavailable, record HOLD rather than independent PASS. Session IDs in JSON are self-reported, and unrestricted GitHub tools can bypass this procedural policy. No exclusive publisher is installed.

## User-visible behavior and cost

Use ordinary prompts. Alignment is usually internal; ask only for a consequential missing choice. During a package, give concise permitted progress updates. At terminal, report outcome, supporter/critic findings resolved or held, contribution, remaining gap and next gate; do not merely say PASS. New prompts reuse goal/state under current authority. Current chats must read updated root instructions before their next package; repository files cannot inject new instructions into already-running chats.

No new paid service, recurring API charge or scheduled Actions is required. Reviews consume the existing account's usage and extra time. Record elapsed time/session count and usage only when observable. Bound review/repair by the adapter and stronger local limits. This installation has deterministic and independent review evidence, but baseline-versus-protocol reliability/cost improvement remains unmeasured; compare frozen identical packets with hidden expected outcomes and predeclared admission thresholds before broader rollout.

## Culinary local boundary

Preserve Brain/Lab separation, public-safe exports, corpus rights/provenance, hard dietary/allergen constraints, recipe eligibility, recommendation admission and browser/owner acceptance. The public application has no private Knowledge Core runtime dependency. This protocol does not change recipes, ranking, public runtime or billing, and does not interfere with the independent Barbecue Technique Corpus scheduled lane.

Reuse the canonical `continuity-state:docs/handovers/CURRENT.json` / `PREVIOUS.json` pair from `docs/HANDOVER_PROTOCOL.md`. Main's CURRENT remains a pointer. Add a `package_quality` namespace to the next complete checkpoint; preserve existing fields. The shared rotation checker prepares the pair, then the coordinator publishes both in one commit with an expected-head lease and `[skip ci]`. Re-fetch CURRENT and verify it before emitting the exact complete JSON to the user.

**Exactly one bounded package per execution cycle, then full handover and STOP.** A stable waiting state or context boundary also stops. One unchanged external recheck and one equivalent repair/revalidation cycle remain the stronger local limits. Supporter/critic are internal steps, not successor packages. Do not begin the next discovery/product package merely because the pilot gate passed.
