# Roadmap Execution-Priority Amendment — Heavyweight Work First

Date: 2026-09-06
Status: **ACTIVE / ADDITIVE / BINDING FOR EXECUTION PRIORITY**

This file is an additive amendment to `docs/ROADMAP.md` and the current Corpus Scale / Step-7 programme. It changes **execution priority**, not gate authority. Existing source-rights, nutrition, allergen/dietary, cost, security, public-runtime, Knowledge Core and human-approval boundaries remain controlling.

## Decision

Within every **already-earned roadmap gate**, prioritize work in this order:

1. **Heavyweight machine-executable work first** — architecture, source/rights audit, data-quality and adapter work, deterministic ingestion/materialization, storage/index/query design, scale/capacity work, failure-mode engineering, tests, CI, deployment preparation and automated evidence capture.
2. **Minimum necessary live architectural proof second** — only the smallest human/browser/runtime verification required to prove a non-waivable boundary such as protected-data access, revocation, fail-closed behavior, billing/account state or another genuinely external fact.
3. **Convenience and compatibility polish later** — login UX, browser/WebView quirks, redirect ergonomics, diagnostic presentation and similar last-mile behavior must not become a standing critical path after the protected architecture has already been proven.

## Authentication rule

Authentication is a **security/availability boundary**, not a feature-polish programme.

Once one supported production path has proved all required properties — authenticated invited access, server-side authorization, protected-data denial without authorization, revocation and fail-closed behavior — the authentication architecture is considered **proven for roadmap sequencing**.

After that point:

- do not reopen broad authentication work merely to perfect every browser/WebView/tab/navigation combination;
- do not repeatedly ask the owner to retry equivalent sign-in actions without a changed hypothesis or implementation;
- repair only a reproducible defect that blocks the currently required protected operation, weakens the security boundary, or affects an actual supported production-user path;
- prefer routing around brittle presentation/static-path issues when the proven protected `/api/*` boundary remains correct;
- preserve fail-closed behavior: unavailable login may reduce availability, but it must never grant protected-data access.

## Parallelism and human interruption

- Front-load all non-dependent autonomous work inside the currently earned gate before requesting human-only evidence.
- Run independent heavy work in parallel when it does not consume unearned authority, shared mutable state, paid resources or deferred infrastructure.
- Batch human verification into the smallest high-information terminal window possible.
- A human-only check becomes the critical path only when it genuinely blocks further authorized machine work or is itself the required terminal evidence.
- Never cross an unearned gate merely to avoid waiting for a required security, cost, rights or authority proof.

## Step 7E application

For the current Step 7E programme, this means:

- the ForkRecipe rights/data-quality audit, deterministic protected-pilot packet construction, 500-record materialization, exact count/chunk/byte/fingerprint checks, Free-limit fail-closed engineering and automated verification are heavyweight work and take precedence over login/UI polish;
- the owner-facing authentication step exists only to prove the protected 500-record pilot through the already-proven production authorization boundary;
- once that bounded final protected verification passes, ordinary auth/browser polish must not delay the next earned heavyweight roadmap work unless a new material defect appears.

## Change condition

Revisit this amendment only if evidence shows that deferring a last-mile item would create a material security, data-integrity, cost, rights, availability or supported-user-path risk, or if a later roadmap gate explicitly makes that item a prerequisite.
