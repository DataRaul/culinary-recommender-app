# YT-CUL-0 — Architecture / Policy / Synthetic Implementation Contract

Status: **MERGED GREEN / ZERO LIVE QUOTA COMPLETE / LIVE API CALLS STILL FORBIDDEN PENDING YT-CUL-1**

Date: 2026-09-05

This contract implements the zero-live-quota phase of `docs/YOUTUBE_CULINARY_DISCOVERY_ATLAS_ROADMAP.md`. It is additive, does not alter public runtime behavior, and consumed zero live YouTube quota.

Canonical completion: PR #56 merged to `main` at `fcbbc5df8ca6ac10cb61b25b142506f51b8a6253`. Pull-request validation passed; post-merge main validation, Pages build and deploy also passed.

## Frozen client boundary

- API client identity: `CULINARY_YOUTUBE_DISCOVERY_V0`.
- Google Cloud project purpose: Culinary internal discovery only.
- Repository secret name for a later live phase: `CULINARY_YOUTUBE_API_KEY`.
- V0 public discovery does not require OAuth.
- YT-CUL-0 contains no network client and cannot read the API key.
- Live API calls remain unauthorized until YT-CUL-1 owner setup and a fresh policy/quota recheck pass.
- The Culinary API client must not share credentials, quota, planner state or evidence with `youtube-blue-lagoon-lab`.
- One Google Cloud API Project per API Client/use case is the controlling identity rule; do not create quota shards.

## Policy recheck — 2026-09-05

Current official YouTube documentation was rechecked before freezing this architecture:

1. `search.list` is in its own granular Search Queries quota bucket. The current default is 100 calls/day; each call costs 1 Search Query call and additional pages consume additional calls. Actual assigned project quota must still be read from the Google Cloud Console before activation.
2. Daily quota currently resets at midnight Pacific Time.
3. Public Data API search can be performed without user authorization.
4. YouTube Developer Policies require exactly one API Project per API Client and prohibit credential masking/misrepresentation or embedding credentials in open-source projects.
5. Non-authorized API Data may be temporarily stored only as necessary and for no longer than 30 calendar days, after which it must be deleted or refreshed.
6. The programme adopts a stricter default transient TTL of 7 days and a hard architectural maximum of 30 days.
7. Current baseline policy prohibits using API Data to create new or derived data or metrics. The additional derived-metrics/storage policy is an audited-permission path; this programme does not assume that permission exists.
8. Therefore creator/channel quality, authenticity, suitability, engagement or other custom YouTube-derived scores are not authorized by this phase.

Official implementation references:

- `https://developers.google.com/youtube/v3/docs/search/list`
- `https://developers.google.com/youtube/v3/determine_quota_cost`
- `https://developers.google.com/youtube/v3/revision_history`
- `https://developers.google.com/youtube/terms/developer-policies`
- `https://developers.google.com/youtube/terms/derived-metrics-policy`
- `https://developers.google.com/youtube/terms/revision-history`

These references are not a permanent policy pin. YT-CUL-2 must recheck the current policy and the actual Cloud Console quota before any live canary.

## Implemented control plane

Canonical implementation: `scripts/youtube-culinary-discovery-control-plane.mjs`.

### Client contract

The module fails closed unless all of the following remain true:

- `liveApiCallsAuthorized=false`;
- `publicRuntimeDependencyAuthorized=false`;
- `rawYoutubeApiDataDurableStorageAuthorized=false`;
- `derivedYoutubeMetricsAuthorized=false`;
- `crossUseWithBlueLagoonAuthorized=false`;
- `oneApiProjectPerClient=true`;
- default transient TTL = 7 days;
- maximum transient TTL = 30 days.

### Quota ledger

The quota ledger requires:

- explicit project identity;
- explicit quota date;
- configured current Search limit;
- hard reserve of at least 5 Search calls;
- acquisition budget = daily limit minus reserve;
- planned calls never exceeding acquisition budget;
- executed calls never exceeding planned calls;
- no Blue Lagoon/music client identity.

The implementation does not hard-code 100 as authority. A later live phase must populate the ledger from the actual verified assigned quota. With a verified 100-call limit and the minimum reserve, the default acquisition budget is 95 calls.

### Deterministic planner

Each planned Search call must have one roadmap-approved purpose. Requests are ordered deterministically by programme priority tier and query ID. The planner admits calls only while the acquisition budget remains and defers the remainder.

The planner rejects YouTube-derived engagement, creator-quality or authenticity scores. Prioritization must come from programme-owned admissible evidence such as Atlas gaps, unresolved variants, source gaps or control needs.

### Transient cache envelope

The module defines a deletable transient envelope with:

- cache key;
- endpoint;
- query identity;
- client identity;
- data class (`SYNTHETIC_FIXTURE` or later `YOUTUBE_API_DATA_TRANSIENT`);
- `retrievedAt`;
- `expiresAt`;
- TTL;
- explicit `rawYoutubeApiDataDurableStorageAuthorized=false`;
- payload.

Synthetic fixtures may imitate API response structure but contain no real YouTube API metadata. Later raw API responses may exist only in a transient storage surface and must never be committed to Git history.

The module includes deterministic expiry cleanup. Storage-provider lifecycle configuration remains a later deployment concern; the application-level contract already fails closed at a 30-day maximum.

### Durable-data firewall

Policy-safe durable objects are checked recursively against raw YouTube metadata fields including titles, descriptions, channel/video/playlist identifiers, tags, thumbnails and engagement statistics.

Durable summaries may retain programme-owned methodology, query-plan identity, counts, independent-source evidence and review outcomes. They may not embed raw YouTube API metadata.

### Promotion handoff

A durable promotion handoff requires an independently reviewed non-YouTube source. It carries no automatic Atlas or app admission authority and cannot authorize runtime activation.

The path remains:

```text
YouTube discovery pointer (transient)
→ independent culinary/source review
→ policy-safe promotion handoff
→ Knowledge Core Atlas gates
→ app Gate F2 / authoring review
→ rights + ontology + safety + nutrition + runtime gates
→ public admission only if separately earned
```

### Daily funnel report

The report contract contains only policy-safe programme metrics:

- calls planned / executed / reserved;
- result slots observed;
- transient unique candidate-pointer count;
- new candidate source-family count;
- Atlas family nominations;
- variant/technique questions nominated;
- independently reviewed candidate count;
- separately counted Atlas promotions for identity, structure, variant, technique and transformation;
- app handoffs;
- actual public admissions;
- marginal yield per executed Search call and per reviewed candidate.

Gross YouTube result count is explicitly not recipe acquisition.

## Validation contract

`tests/youtube-culinary-discovery-control-plane.test.js` verifies:

- separate-client / zero-live invariants;
- quota reserve behavior and Blue Lagoon isolation;
- deterministic planning and budget exhaustion;
- rejection of YouTube-derived scoring;
- 7-day default / 30-day maximum transient TTL and deterministic expiry cleanup;
- policy-safe durable reporting and independent-source handoffs;
- absence of live `fetch`/`https.request` networking and absence of API-secret reads in the YT-CUL-0 module.

Normal repository validation passed on PR #56 and on post-merge `main`.

## Terminal boundary of YT-CUL-0

YT-CUL-0 is **complete and merged green**. It consumed zero live YouTube API calls and introduced no public-runtime dependency.

The current next phase is **YT-CUL-1 — owner Google Cloud setup**. No live API call is authorized until that human setup exists and the YT-CUL-2 activation vintage fresh-rechecks current YouTube policy and the actual assigned Search Queries limit.
