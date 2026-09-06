# Repository Agent Instructions

GitHub is the source of truth for deterministic Culinary Recommender / Culinary Lab project state.

This file establishes the generalized agent-facing Knowledge Core platform boundary for repository-aware agents and ChatGPT/Codex project work. It does **not** replace the existing app, nutrition, recipe-corpus, Brain-export, product, architecture, or browser-runtime contracts documented in `README.md`, `docs/GATES.md`, `docs/ROADMAP.md`, `docs/BRAIN_ADAPTER_CONTRACT.md`, `docs/ARCHITECTURE.md`, and related current files.

## Existing Culinary boundaries remain controlling

- The public application owns public recipe records, source normalization, ingredient/quantity normalization, nutrition calculations and blockers, profile/pantry state, hard dietary/allergen/permanent exclusions, ranking/planner behavior, UI/persistence, deterministic tests and browser acceptance.
- Knowledge Core owns reusable culinary/nutrition reasoning, World Recipe Atlas verification policy, evidence and inference boundaries, public-export eligibility, reusable coaching, and bounded Consulting/Advisory reasoning.
- Brain/Lab state and public app state are not the same data store and must not become one shared mutable runtime.
- The public browser application **must not dynamically fetch, import, or depend on private `DataRaul/knowledge-core` at runtime**. Existing reviewed public-safe static artifacts and their provenance remain the only allowed bridge into public runtime behavior.
- A private Brain update does not automatically change ranking, eligibility, substitutions, nutrition calculations, recipe admission, planner behavior, or any other public behavior.
- Any behavior-changing public export remains separately gated by the existing Culinary contracts, deterministic tests, normal PR validation, profile/browser acceptance, and any required human review.
- Preserve the Culinary Brain / Knowledge Core lane separately from ordinary Culinary Lab implementation. Do not create a second Culinary-specific integration architecture.

## Knowledge Core platform adapter

`DataRaul/knowledge-core` is the canonical reusable reasoning platform for this repository. Culinary Recommender carries only a thin agent-facing routing boundary; do not copy or fork canonical Knowledge Core objects, methods, coach contracts, Consulting logic, or domain logic into this repository for convenience.

- Route each substantive task to the smallest sufficient Knowledge Core capability or domain set after establishing current Culinary repository truth and the applicable local gates.
- When Culinary-specialist reasoning is needed, consume the canonical `adapters/repo_culinary_recommender_app.md` through the generalized Knowledge Core platform boundary rather than creating a direct private-KC browser/runtime integration.
- Preserve exact Knowledge Core commit/object provenance when a material decision or public-safe export requires it. Later Knowledge Core updates do not rewrite the historical reasoning basis of an earlier Culinary decision.
- The canonical conversation-facing layer is `adapters/chatgpt_conversation_runtime_router.md` in Knowledge Core. It coordinates `adapters/chatgpt_instruction_coach.md`, `adapters/chatgpt_work_project_coach.md`, and `adapters/chatgpt_consulting_advisory.md`; do not duplicate those files here.

### Conversation-runtime activation

For every substantive user request at a normal user-facing response boundary, apply the canonical conversation runtime router after establishing current Culinary Lab/app truth and the active lane contract.

- **Instruction Coach:** execute the user's requested work first, then evaluate instruction quality. Surface at most one distinct reusable improvement when material; `No material coaching point` is valid when the request is already sufficiently specified. Do not append routine coaching to trivial retrieval, formatting, deterministic audit, or already-scoped implementation work.
- **Work / Project Coach:** evaluate project-operating quality when a material issue exists in terminal state, source of truth, Brain/Lab separation, sequencing/dependencies, validation, integration, public-export handoff, browser acceptance, or activity-versus-completion. Surface at most one distinct project-operating improvement after deduplication.
- **Consulting & Advisory:** apply the frozen classifier in `domains/consulting_advisory/evaluation/CONSULTING_ACTIVATION_TRIGGER_SPEC_V1.md`. Engage proportionately for material option/business-case trade-offs, cross-domain synthesis, contradictions/binding constraints, roadmap/scale/systemization decisions, research-to-recommendation transitions, recommendation-to-public-export/implementation handoffs, and impact/value review. Remain silent for simple blocker-count retrieval, deterministic audits, one clear specialist owner, fully scoped implementation, simple deterministic choices, pure transformation, long/complex execution prose by itself, or coach-only meta-feedback.
- **Deduplication:** Consulting owns the material decision synthesis; Work / Project Coach owns one distinct execution-process point; Instruction Coach owns one distinct instruction-learning point. Never repeat the same observation across surfaces. Normally expose no more than one or two coaching findings total.
- **No-narration precedence:** when the active Culinary lane carries a standing instruction such as `no narration unless error, human needed, material cost/access gate, terminal result, or continuation boundary`, routine Coach/Consulting output must not interrupt autonomous repository execution. Internal evaluation remains allowed, but ordinary coaching/advisory material may surface only at an already-allowed response boundary unless the finding itself creates a genuine gate or terminal decision.
- **Authority:** Coach/Consulting routing grants no authority to weaken nutrition/source semantics, quantity evidence, corpus gates, public-safe export review, browser acceptance, or any other Culinary evidence/behavior gate. It also grants no authority to introduce private Knowledge Core browser/runtime dependency.

## Standing autonomous execution authority

The user has explicitly authorized autonomous continuation of technically resolvable Culinary App / Culinary Lab repository work without repeated approvals.

- Do not ask for repeated approval to open ordinary implementation PRs, run normal repository CI, browser acceptance, path-scoped validation, benchmark workflows already required by the active roadmap gate, or technically necessary CI reruns/repairs that stay within the established repository workflow and ordinary GitHub Actions usage.
- Ordinary GitHub Actions validation spend for this lane is standing-preapproved. The earlier per-run approval requirement is superseded by this repository instruction.
- Continue autonomously through implementation, validation, PR repair and safe merge when gates pass.
- Interrupt the user only for a genuine unrecoverable error, a material new cost decision outside ordinary repository Actions usage, a paid service/API/infrastructure/corpus-license decision, a security/access decision, another genuine human-only gate, a terminal material result that should be surfaced, or a continuation boundary.
- A materially abnormal CI loop, runaway Actions consumption, or a new recurring/paid cost is a cost gate; ordinary expected CI is not.
- Preserve the standing target of zero recurring infrastructure cost for the accepted small invited-user deployment unless the user explicitly changes it.

## Human-gate batching and live-verification efficiency

Apply the canonical Knowledge Core `Work / Project Coach`, `Consulting & Advisory`, Project Execution, and `AI-Human Execution Boundary` mechanisms through the thin adapter above. The local operating objective is **minimum human interruption for maximum diagnostic/verification value**.

### Machine work first; human-only evidence last

- Front-load every authorized machine-executable prerequisite before asking the user to act: repository reconciliation, implementation, deterministic tests, CI, deployment, rollback/recovery path, diagnostics, sanitized evidence capture, exact acceptance criteria, and the next-action decision tree.
- If a human-only action is needed only to obtain terminal production evidence, defer and batch it until all non-dependent work inside the **currently earned roadmap gate** is complete.
- Do not use this rule to cross an unearned gate, pre-authorize paid infrastructure, create deferred recipe-body shards, activate public source behavior, or otherwise exceed current roadmap authority.
- If a human-only action genuinely blocks further authorized machine work (for example identity/credential verification, physical action, external approval, or an irreversible/security-sensitive decision), ask only at the first point where it becomes the actual constraint. After it is satisfied, resume autonomous `AUTO` / `AUTO + VERIFY` work without returning ordinary sequencing to the user.

### One high-information verification path

- Before any live browser canary where environment can affect state, classify the execution surface explicitly: ChatGPT in-app browser/WebView versus external browser, tab/navigation continuity, origin, cookie/storage context, and whether opening a new link may create a new browser context. Do not interpret an auth/session failure until this context is known.
- Prefer one diagnostic capable of separating several plausible hypotheses over a series of low-information human probes.
- Prepare a single continuous human verification session whenever possible. Keep stateful flows in the same browser/WebView/navigation chain and avoid requiring the user to reopen links from ChatGPT between dependent steps.
- Within a genuinely branching human session, use one action at a time only when the result determines the next action. If the remaining sequence can be safely automated or navigated by the application, automate it instead of asking the user to reproduce it manually.

### No blind or duplicate retries

- **Never ask the user to repeat the same live action merely because the previous result was undesirable.** A retry is justified only when at least one material variable has changed: code/deployment candidate, server state, browser/context state, diagnostic instrumentation, or the explicit hypothesis being tested.
- After any failed human live check, classify the failure and state what new information was learned before another user action is requested.
- If the previous action was ambiguous because it may have occurred in a different browser/WebView/context, resolve that environmental ambiguity before changing application logic or requesting another equivalent retry.
- Repeated identical clicks/logins/checks with no changed hypothesis are an execution anti-pattern and should trigger autonomous reconciliation rather than another human request.

### Terminal human-verification batch

For a gate that requires human live evidence, the preferred pattern is:

```text
all authorized machine implementation
→ deterministic/local validation
→ CI + deployment verification
→ production-safe diagnostic instrumentation if needed
→ exact pass/fail criteria frozen
→ ONE continuous human verification window
→ capture sanitized evidence
→ autonomous evidence recording / handover / merge / terminal-state verification
```

A terminal human verification window should be as short as the evidence contract allows. After the user supplies the final required live evidence, the agent should complete the remaining authorized documentation, reconciliation, merge and closeout steps autonomously.

## Continuation-before-context-loss authority

Before conversation context becomes unreliable, the active agent must stop ordinary implementation at a safe boundary, warn the user that continuation is being prepared, fresh-reconcile GitHub, and save a complete resumable state through `docs/HANDOVER_PROTOCOL.md` and `docs/handovers/CURRENT.json`.

- Rotate `CURRENT -> PREVIOUS` and write a new complete CURRENT before context loss, not after.
- The saved CURRENT must include the exact live main SHA/baseline, open PR/branch/CI state, standing autonomy and CI authority, the next executable action, and any active human/error/cost gate.
- A new chat must be able to continue from the repository handover without requiring the user to reconstruct or copy-paste prior chat state.

## Conversation-time versus browser-runtime rule

These two paths are intentionally different:

```text
ChatGPT/Codex repository reasoning
→ current Culinary repository truth
→ generalized Knowledge Core platform boundary
→ smallest sufficient Culinary / Coach / Consulting route
→ return to Culinary evidence, tests and gates

PUBLIC BROWSER APPLICATION
→ reviewed public-safe static artifacts only
→ no dynamic/private Knowledge Core runtime dependency
```

Conversation-time access to private Knowledge Core is therefore permitted for repository reasoning when the project contract allows it; browser-time private Knowledge Core access remains prohibited.

If a future Knowledge Core capability would materially change Culinary behavior or governance, integrate it through this generalized platform boundary with explicit project validation and any required human authorization rather than by silent adoption.
