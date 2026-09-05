# Corpus Scale / 170k No-Billing-Authorization Architecture

Status: **CONSULTANT + PROJECT-COACH RECONCILED / CURRENT CANDIDATE ARCHITECTURE / REBASELINE REQUIRED BEFORE ACCOUNT PROVISIONING**

Decision date: **2026-09-05**

This document supersedes `docs/CORPUS_SCALE_ZERO_BILL_170K_ARCHITECTURE.md` for authentication, protected-data placement, cost authority, and Step-7 provisioning order. The earlier zero-bill document remains decision lineage: it correctly rejected R2 and identified hard-capped Workers Free/D1 Free as promising, but it still assumed Cloudflare Zero Trust / Access. The owner then reached Cloudflare's Zero Trust Free activation screen and observed an explicit authorization allowing Cloudflare to charge the stored card for usage beyond the included allowance. Under the owner's stronger constraint, that activation is rejected.

All existing source-rights, nutrition, allergen/dietary/permanent-exclusion, RecipeSource V2 portability, deterministic ranking/planning, Brain/Lab separation, and invitation-only membership rules remain controlling.

## 1. Binding constraint

The infrastructure requirement is now:

> **Do not activate or accept any product/subscription whose setup requires authorization to charge a payment method for usage beyond free limits. Normal or abnormal application usage must not be capable of creating an automatic infrastructure overage charge. Exhaustion must fail closed.**

Consequences:

- **R2 remains rejected** because activation is usage-billed beyond its free allowance.
- **Cloudflare Zero Trust / Access is rejected for this deployment** because the owner-visible `Zero Trust Free` activation flow explicitly requested authorization to charge the stored card for usage beyond included allowance.
- Do not accept a `$0` checkout if its terms authorize overage billing.
- A payment card being stored on an account is not itself architecture authority. No new paid or usage-authorized subscription may be activated.
- Workers Free and D1 Free are only candidates while they remain true hard-capped Free-plan resources that do not require a charge authorization to provision/use. If an account-side provisioning screen contradicts this, stop and reject that resource.

## 2. Required scale target

Production engineering target remains:

- **170,000 admitted recipes required capacity**;
- **250,000 synthetic stress/headroom target**;
- 250k is a stress test, not a population commitment.

The existing reviewed 84-recipe corpus remains the behavioral golden oracle. External recipe admission remains incremental and source-rights gated.

Required synthetic ladder:

`1k -> 10k -> 50k -> 100k -> 170k -> 250k stress`

## 3. Consultant decision

The material decision is not `which Cloudflare product is nicest?`; it is `how to preserve private invitation-only access and 170k scale without ever authorizing automatic infrastructure charges?`

Options considered:

1. **Cloudflare Zero Trust / Access + R2:** reject; both conflict with the no-charge-authorization rule as encountered/account-priced.
2. **Pages-only private corpus:** reject as primary design; Pages is a public static delivery surface and would couple protected corpus artifacts to deployment/repository ergonomics.
3. **Custom passwords/shared secret:** reject; weak membership lifecycle and unnecessary credential liability.
4. **Application-owned identity + exact private allowlist + hard-capped Free Worker/D1:** preferred candidate, subject to measured scale proof and account-side no-billing-authorization verification.
5. **Alternative provider:** retained as an explicit fallback if Workers Free/D1 Free provisioning ever requests billing authorization or fails the measured capacity/security gates.

Binding constraints are non-compensable: no amount of expected low usage can override a billing-authorization screen, and no convenience can justify exposing protected corpus/index data publicly.

## 4. Canonical candidate architecture

```text
GitHub repository
  - code / review / version history
  - schemas, source registry, provenance/rights ledgers
  - deterministic corpus/index builders
  - manifests/hashes
  - no invited-email list, session secret or private corpus runtime data
        |
        v
Cloudflare Pages Free
  - public application/login shell only
  - no protected recipe bodies
  - no protected retrieval-index files
        |
        v
Pages Function / Worker on Workers Free
  - /api/* and every protected-data route
  - authentication + authorization boundary
  - exact private allowlist check
  - bounded retrieval only
  - fail closed on Free-plan exhaustion
        |
        +-------------------------+
        |                         |
        v                         v
External identity proof      D1 Free candidate
(initial: Google GIS/OIDC)   deliberately sharded
  - proves identity             - 1 control/auth/index DB
  - server verifies token       - ~8 recipe-body DBs
  - no app password store       - 1 DB slot reserved
                                - no full scans
        |                         |
        +-----------+-------------+
                    v
              RecipeSource V2
                    |
                    v
existing deterministic hard filters
+ evaluator + scorer + planner
```

The static Pages shell may be publicly reachable because the repository/app shell is already public. **Protected corpus functionality and data remain unavailable without server-side authentication and allowlist authorization.**

## 5. Application-owned invitation gate

Cloudflare Access is removed. Invitation membership becomes an app-owned server-side authorization contract.

Required properties:

1. No public signup.
2. Owner-managed exact invited identities only.
3. The allowlist lives only in private runtime state (initially the D1 control/auth database), never in public GitHub.
4. Authentication proves identity; authorization separately checks current allowlist membership.
5. Removing/disabling an identity revokes future protected requests.
6. Browser/UI hiding is never authorization; `/api/*` must enforce the gate on every protected request.
7. Sessions use Secure + HttpOnly + SameSite cookies or an equivalently protected mechanism and contain no reusable provider credential.
8. Session/signing secrets live in Cloudflare secret/runtime configuration, never GitHub.
9. The owner bootstrap path must not expose the owner email in repository source.
10. The authentication provider is replaceable behind an app-owned `IdentityVerifier` boundary.

## 6. Initial identity provider: Google Sign in with Google / OIDC

Initial implementation candidate: Google Identity Services (GIS) web sign-in.

Server-side rules:

- receive the Google ID token only over HTTPS;
- validate CSRF according to the selected GIS flow;
- verify Google's token signature;
- verify `aud`, `iss`, and `exp`;
- use Google's stable `sub` as the provider account identifier;
- evaluate the current email only for invitation matching, never as the stable primary key;
- require the email to match an exact enabled allowlist entry before creating a local session;
- after successful first binding, store provider issuer + `sub` with the invited account so later email change/rebinding can be handled explicitly.

Important evidence boundary from Google's current documentation:

- Google is authoritative for Gmail addresses, and for Google Workspace identities when `email_verified=true` and `hd` is present;
- a third-party email used to create a Google Account is not necessarily still controlled by that user merely because `email_verified=true`.

Therefore initial V1 may only treat Google-authoritative email identities as sufficient exact-email proof. If an intended invitee uses a non-Google-authoritative email, add another provider/proof path deliberately; do not silently weaken the exact-email gate.

Current references:

- `https://developers.google.com/identity/gsi/web/guides/verify-google-id-token`
- `https://developers.google.com/identity/gsi/web/guides/display-button`

Creating/configuring the identity client is a later human account step. If its setup requests paid billing or charge authorization, stop and re-evaluate rather than accepting.

## 7. Protected-data placement

The prior idea of serving compact protected indexes as ordinary static Pages assets is removed because the Pages hostname itself is no longer protected by Cloudflare Access.

Pages may contain only public shell/build artifacts and public-safe non-corpus metadata.

Protected search indexes and recipe bodies must be obtainable only through the authenticated Worker boundary.

Preferred D1 layout hypothesis:

- **1 control/auth/index DB** containing:
  - corpus/version manifest;
  - allowlist/account bindings and revocation state;
  - compact versioned posting/index shards;
  - only minimal session/auth metadata if stateless signed sessions are insufficient;
- **~8 recipe-body DB shards** containing portable recipe payload rows;
- **1 DB slot reserved** for migration/emergency headroom.

Index postings should remain deterministic pre-built artifacts, stored as bounded rows/blobs rather than exploded into a highly normalized many-row search schema. The D1 Free maximum row/BLOB size must be respected by sharding postings well below the platform maximum; initial architecture target is **<=1 MiB per index artifact row**.

## 8. D1 Free candidate evidence

Cloudflare documentation revalidated on 2026-09-05 states for Workers Free / D1 Free:

- 10 databases;
- 500 MB maximum database size;
- 5 GB total storage;
- 5 million rows read/day;
- 100,000 rows written/day;
- 50 D1 subqueries per Worker invocation;
- 2 MB maximum string/BLOB/table-row size;
- when Free daily row-read/write limits are exceeded, queries fail until reset;
- when Free storage is exhausted, additional writes/schema/index changes fail rather than silently moving to paid usage.

Current references:

- `https://developers.cloudflare.com/d1/platform/limits/`
- `https://developers.cloudflare.com/d1/platform/pricing/`
- `https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/`

This makes D1 Free materially different from R2 and the observed Zero Trust activation flow. **However documentation is not account-side authorization. D1 must still pass an owner-visible provisioning check with no billing/overage authorization before it becomes an accepted production resource.**

## 9. Workers Free candidate evidence

Cloudflare documentation revalidated on 2026-09-05 states that users have Workers Free by default and currently lists:

- 100,000 requests/day;
- 10 ms CPU/request;
- 128 MB memory;
- 50 subrequests/request.

Static asset requests are free/unlimited, while Worker-routed requests beyond Free limits receive an error rather than falling back when configured to run the Worker first for the protected route pattern.

Current references:

- `https://developers.cloudflare.com/workers/platform/pricing/`
- `https://developers.cloudflare.com/workers/platform/limits/`
- `https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/`

The project must remain on Workers Free; do not activate Workers Paid. If deployment/provisioning asks the owner to authorize paid or usage-based charges, stop.

## 10. Internal safety budgets for 170k

Do not architect to provider maxima.

Initial proof budgets:

- **<=3.5 GB total D1 footprint at 170k**;
- **<=350 MB per database**;
- **1 database slot always reserved**;
- **<=1 MiB per compact index artifact row**;
- **<=256 hydrated candidate recipes** per recommendation/search request;
- **<=16 D1 subqueries per protected application request** as the project budget, despite the provider maximum of 50;
- **0 full-corpus scans**;
- **0 public protected-index or recipe-body assets**;
- **1 allowlist/account-status read per protected request at most** unless caching/revocation tests earn a different shape;
- **no automatic provider upgrade path**.

The existing Step-1 average recipe-detail threshold of <=12 KiB implies approximately 1.95 GiB for 170k recipe bodies before SQLite/index overhead. The 3.5 GB project budget remains a hypothesis to prove, not permission to provision/populate D1.

## 11. Session and revocation model

Preferred session shape:

1. browser obtains a provider credential only during sign-in;
2. Worker verifies provider credential + exact enabled allowlist entry;
3. Worker creates a short-lived signed session cookie containing only an internal account identifier/version and expiry;
4. protected requests verify the session and current account/allowlist active state server-side;
5. disabling the account/allowlist state makes subsequent protected requests fail;
6. provider tokens are not stored as reusable long-lived application credentials.

The exact session lifetime and revocation-cache policy remain implementation parameters to benchmark/security-test. Security wins over reducing a single indexed D1 account read.

## 12. Project Coach correction: observable terminal states

The Project Coach review identifies the previous failure mode: the roadmap sent the owner into external-account setup before all billing/security assumptions were proven. The new sequence therefore separates repository proof from account clicks.

No external resource becomes `accepted` merely because docs describe a Free tier.

Every human provisioning step has three possible results:

- `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` -> continue;
- `BILLING_OR_OVERAGE_AUTHORIZATION_PRESENT` -> stop/reject provider/resource;
- `AMBIGUOUS` -> stop and inspect before acceptance.

## 13. Revised Step 7 sequence

### Step 7A — no-billing-auth 170k repository rebaseline

**Repository-only / autonomous / next executable action.**

Extend existing Steps 1–6 rather than restarting them:

- extend synthetic scale ladder through 170k required + 250k stress;
- simulate the 1 control/index/auth + ~8 recipe-shard + 1 reserve D1 layout;
- measure total/per-shard footprint and index-artifact row sizes;
- model protected query shape, rows read/written and <=16 D1 subqueries/request;
- add Worker Free CPU/request-budget measurement/proxy and flag actual production CPU as a later canary gate;
- define `IdentityVerifier`, exact allowlist, session/revocation and owner-bootstrap contracts;
- prove protected data cannot be served from ordinary static Pages paths;
- preserve RecipeSource V2 parity, hard dietary/allergen/exclusion behavior, source-rights gates, nutrition separation and incremental validation.

Terminal outcomes:

- `NO_BILLING_AUTH_170K_ARCHITECTURE_PASS`
- `REBASELINE_REQUIRED_NO_PROVISIONING`

Only PASS permits account-side resource checks.

### Step 7B — Free developer-resource provisioning check

**Human/account-side, only after Step 7A PASS.**

Check/create the exact measured D1 Free resources and confirm the project remains on Workers Free.

Hard rule:

> If Cloudflare shows any checkout, subscription activation, payment authorization, or language permitting overage charges, do not accept it. Record `BILLING_OR_OVERAGE_AUTHORIZATION_PRESENT` and return to architecture selection.

If D1 creation succeeds with no such authorization, record `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`.

### Step 7C — identity-provider setup

**Human/account-side, after the app-side auth contract exists.**

Initial provider candidate: a dedicated Google web identity client for the Culinary app.

- configure the production Pages origin/login endpoint;
- do not expose secrets in GitHub/chat;
- if Google asks for billing/payment authorization, stop;
- bootstrap only the owner's exact invited identity first;
- expand invited identities only after owner login/revocation tests pass.

### Step 7D — protected 84-record canary

Before real corpus expansion:

- deploy the authenticated Worker path;
- keep the current 84 reviewed recipes as the behavioral/security oracle;
- verify unauthenticated requests cannot retrieve protected recipe/index data;
- verify unauthorized authenticated identity is denied;
- verify allowed identity works;
- verify revocation works;
- verify Free-limit failure path does not bypass auth;
- measure actual Worker CPU/subrequests and D1 reads/writes/storage.

### Step 7E — production-shaped 500–1000 rights-clean pilot

Only after 7A PASS + 7B free/no-billing confirmation + 7C auth setup + 7D security/runtime canary PASS:

- use the first rights-clean source cohort;
- ForkRecipe remains current leading candidate unless later evidence changes precedence;
- run every record through the existing generalized admit/hold/reject control plane;
- preserve nutrition separation and deterministic behavior;
- measure real Free-plan consumption and fail closed on quota exhaustion;
- no paid infrastructure.

## 14. Human state now

Current owner actions:

- **No further Cloudflare setup is required now.**
- Do **not** activate Zero Trust Free.
- Do **not** activate R2.
- Do **not** create D1 yet.
- Do **not** activate Workers Paid.
- Keep the already-created Pages project.

Optional billing-safety housekeeping, independent of the architecture: if the owner wants the stored Cloudflare payment method removed, Cloudflare documentation says payment methods can be deleted when no active paid subscriptions, pending usage-based transactions, or relevant renewal constraints block removal. This is optional and should be performed only after reviewing the account's Billing -> Subscriptions state; it is not required for Step 7A repository work.

## 15. Authority

Authorized now:

- autonomous Step 7A repository work, normal CI/benchmarks and safe PR/merge under `AGENTS.md`;
- keeping the existing Cloudflare Pages Free project;
- current YT-CUL child programme under its separate roadmap.

Not authorized now:

- Zero Trust / Access activation;
- R2 activation;
- D1 provisioning before Step 7A PASS;
- Workers Paid;
- any checkout or `$0` subscription carrying overage-charge authorization;
- paid API/backend/corpus licence;
- weakening any source-rights, nutrition, allergen, exclusion, public-export or Knowledge Core boundary.

## 16. Immediate next action

Repository lane:

`STEP_7A_NO_BILLING_AUTH_170K_REBASELINE` — **READY**.

Human lane:

`NO_ACTION_REQUIRED_UNTIL_STEP_7A_PASS`.

Cloudflare Zero Trust / Access:

`REJECTED_FOR_CURRENT_NO_BILLING_AUTHORIZATION_CONSTRAINT`.

R2:

`REJECTED_FOR_CURRENT_NO_BILLING_AUTHORIZATION_CONSTRAINT`.

D1:

`CANDIDATE_ONLY__DO_NOT_PROVISION_UNTIL_STEP_7A_PASS_AND_ACCOUNT_SIDE_NO_BILLING_AUTHORIZATION_CHECK`.
