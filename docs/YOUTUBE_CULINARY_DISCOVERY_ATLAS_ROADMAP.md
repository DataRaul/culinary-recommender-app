# YouTube Culinary Discovery Atlas — Roadmap V0

Status: **YT-CUL-0 MERGED GREEN / YT-CUL-1 HUMAN SETUP REQUIRED / LIVE API ACQUISITION BLOCKED UNTIL OWNER PROJECT+SECRET SETUP AND FRESH POLICY+QUOTA CHECK**

Date: 2026-09-05

## Decision

Add YouTube as a high-throughput **discovery/navigation layer** ahead of the existing World Recipe Atlas and Recipe Corpus gates. Do not turn YouTube into the permanent recipe database, do not copy raw video descriptions into Git history, and do not let YouTube discovery bypass rights, provenance, culinary verification, safety, nutrition, Gate F/F2 or public-runtime acceptance.

The intended funnel is:

```text
YouTube Culinary Discovery API client
→ transient search/result cache
→ candidate channels/playlists/videos/source links
→ independent source/claim review
→ Knowledge Core World Recipe Atlas family/variant/technique candidates
→ app Gate F2 review queue / app-authored candidate
→ ingredient/quantity/safety/nutrition/runtime gates
→ admitted public recipe only when all downstream gates pass
```

## Why this exists

The existing programme has strong verification and runtime gates but discovery can be expensive and slow. YouTube can cheaply expose a much broader long tail of dishes, spellings, regional/household variants, techniques and creator-linked recipe sources. The programme should therefore optimize **verified information gain per search call and per unit of downstream review effort**, not raw video count or raw recipe count.

## Source-of-truth and lane ownership

- `DataRaul/knowledge-core` owns reusable Culinary Brain / World Recipe Atlas discovery, family, variant, technique and evidence semantics.
- `DataRaul/culinary-recommender-app` owns the operational API client, transient acquisition/control plane, Gate F/F2 review, actual public recipe records and all public-runtime behavior.
- The browser app must never dynamically depend on private Knowledge Core.
- YouTube discovery creates no automatic authenticity, canonicality, nutrition, dietary/allergen, freshness/trend or public-export authority.

## Google / YouTube API client boundary

Create one distinct Google Cloud API Project for the distinct Culinary internal discovery client. This is not a second Blue Lagoon quota shard and must not be reused to increase quota for the Blue Lagoon music use case.

Recommended project/client identity:

- Google Cloud project display name: `culinary-youtube-discovery`
- API: `YouTube Data API v3`
- credential for V0 public-data discovery: API key only
- repository secret: `CULINARY_YOUTUBE_API_KEY`
- OAuth: not required for V0 public search/read operations
- service accounts: not used

Never commit the key, paste it into repository files, or place it in handovers.

Current official quota semantics to verify in the Cloud Console before each activation vintage:

- `search.list` uses the Search Queries bucket;
- current default Search Queries limit is 100 calls/day per API project/client;
- one call can request up to 50 results;
- additional pages consume additional Search calls;
- other Data API methods use their applicable quota buckets;
- quota resets at midnight Pacific Time under current documentation.

The project must be treated as a separate API client/use case, not as quota sharding. If Google/YouTube policy, assigned quota, audit requirements or the project configuration differ from these assumptions, live execution stops and the roadmap is updated before spend.

## YouTube API policy / storage gate

The V0 architecture is deliberately fail-closed around current YouTube API policies:

1. Raw titles, descriptions, creator names and other non-authorized API Data must not be committed into immutable Git history.
2. Any temporary non-authorized API Data cache must have a refresh/delete horizon no longer than the current YouTube policy permits; V0 targets <= 7 days by default and never exceeds 30 days.
3. Durable custom culinary classifications/derived metrics from YouTube API Data are **not assumed permitted**. Before automated long-lived classification, aggregation or model-assisted extraction is activated, review the current Developer Policies / derived-metrics policy and use the audit/permission path if required.
4. YouTube audiovisual content is never downloaded, mirrored or cached by this programme.
5. Durable Atlas claims should preferentially be promoted from independently reviewed culinary/cultural/recipe sources. YouTube may remain a discovery pointer or bounded source only when the applicable source/rights/policy review passes.

Official policy references for implementation review:

- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/developer-policies-guide
- https://developers.google.com/youtube/terms/derived-metrics-policy
- https://developers.google.com/youtube/v3/revision_history
- https://developers.google.com/youtube/v3/docs/search/list

## Storage architecture

### Durable Git / Knowledge Core

Store only:

- methodology and query-plan vintages;
- search-purpose taxonomy;
- quota budgets and guards;
- independently verified culinary claims/family/variant promotions;
- external non-YouTube source provenance when that source is the durable evidence;
- compact run summaries that are policy-safe and do not embed raw YouTube metadata;
- acceptance/rejection reasons and handover state.

### Transient acquisition cache

Store raw YouTube API responses only in a deletable/refreshable transient surface. Preferred order:

1. Cloudflare R2 transient prefix with lifecycle/cleanup once the already accepted R2 setup exists;
2. otherwise short-retention CI/job artifact or runner-local temporary storage for bounded pilots;
3. never Git commit history.

The transient layer must record `retrieved_at`, source endpoint, query identity, project/client vintage and expiry/refresh deadline.

## Search planning and quota control

Each live day is a bounded quota day, not an unstructured scrape.

Initial V0 default after activation:

- hard daily Search limit: read from current project quota; expected default 100/day;
- reserve: >= 5 Search calls;
- planned acquisition target: <= 95 Search calls/day;
- no automatic quota extension request;
- no second Culinary project for the same client/use case;
- no Blue Lagoon credential sharing or cross-charging.

Every Search call must carry one declared purpose:

- `DISH_FAMILY_DISCOVERY`
- `CUISINE_REGION_GAP`
- `VARIANT_DISCOVERY`
- `TECHNIQUE_SOURCE_DISCOVERY`
- `CREATOR_OR_CHANNEL_DISCOVERY`
- `PLAYLIST_DISCOVERY`
- `EXTERNAL_RECIPE_SOURCE_DISCOVERY`
- `TARGETED_REPLICATION`
- `CONTROL`

The planner should allocate quota adaptively only from prior **programme-owned admissible evidence**. It must not rank creators with prohibited custom YouTube scores or treat view/like/subscriber metrics as culinary quality or authenticity.

## Measurement funnel

The user-facing scorecard is a conversion funnel, not an opaque quality score.

For each completed quota day report:

1. Search calls planned / executed / reserved.
2. Result slots observed and transient unique candidate pointers.
3. New candidate source sites or source families discovered.
4. New Atlas dish-family candidates nominated.
5. New variant axes or technique/source questions nominated.
6. Candidates independently reviewed.
7. Atlas promotions actually earned: identity / structure / variant / technique / transformation, each separately.
8. App handoffs created for Gate F2 or app authoring review.
9. Public recipes actually admitted after downstream rights/ontology/safety/nutrition/runtime gates.
10. Marginal yield per Search call and per reviewed candidate, using only policy-permitted programme metrics.

Never report gross YouTube results as recipes acquired.

## Development sequence

### YT-CUL-0 — architecture + policy gate

State: `MERGED_GREEN / ZERO_LIVE_QUOTA_COMPLETE`

Completed in PR #56, merged to `main` at `fcbbc5df8ca6ac10cb61b25b142506f51b8a6253`.

Implemented canonical artifacts:

- `scripts/youtube-culinary-discovery-control-plane.mjs`
- `tests/youtube-culinary-discovery-control-plane.test.js`
- `docs/YT_CUL_0_IMPLEMENTATION_CONTRACT.md`

Delivered:

- frozen separate Culinary API-client purpose and Blue Lagoon isolation;
- policy/storage data classes, 7-day default transient TTL and 30-day hard maximum;
- configurable quota ledger with >=5-call reserve and deterministic planner;
- approved search-purpose taxonomy and fail-closed rejection of YouTube-derived creator/engagement/authenticity scoring;
- transient-cache expiry/cleanup semantics;
- durable raw-YouTube-metadata firewall;
- independent-source promotion handoff with no automatic Atlas/app authority;
- daily conversion-funnel and marginal-yield report contract;
- synthetic tests proving zero live networking and zero API-secret reads.

Validation passed on the pull request and again on post-merge `main`; Pages build/deploy also passed. Live YouTube API calls consumed by YT-CUL-0: `0`.

Policy was rechecked against official YouTube documentation on 2026-09-05. The live activation vintage must recheck it again.

### YT-CUL-1 — owner Google Cloud setup

State: `HUMAN_SETUP_REQUIRED / CURRENT_NEXT_ACTION`

Owner creates the distinct Google Cloud project, enables YouTube Data API v3, creates/restricts an API key, verifies assigned Search quota, and stores the key only as `CULINARY_YOUTUBE_API_KEY` in the repository/runner secret store.

No second YouTube account is required for public-data V0.

The safe completion signal is non-secret only: confirm the project/API/secret setup exists and report the assigned Search Queries daily limit. Never paste the API key into chat, issues, commits or handovers.

### YT-CUL-2 — zero/low-quota connectivity canary

State: `BLOCKED_ON_YT-CUL-1`

- fresh-recheck current YouTube policy and actual assigned project quota before the first call;
- execute a tiny canary;
- prove key/project separation from Blue Lagoon;
- prove quota ledger/reserve behavior;
- prove raw metadata never enters Git history;
- prove expiry/cleanup behavior;
- stop on any policy/configuration mismatch.

### YT-CUL-3 — one-day bounded discovery pilot

State: `BLOCKED_ON_YT-CUL-2 PASS`

Run one governed quota day. Primary objective: estimate the conversion funnel from Search calls to useful independent culinary/source evidence. Do not scale from gross result count.

Terminal outputs include:

- `YOUTUBE_CULINARY_DISCOVERY_HIGH_INFORMATION_GAIN`
- `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND`
- `YOUTUBE_CULINARY_DISCOVERY_LOW_MARGINAL_VALUE`
- `POLICY_OR_STORAGE_REDESIGN_REQUIRED`

### YT-CUL-4 — channel/playlist efficiency lane

State: `CONDITIONAL`

If YT-CUL-3 shows useful yield, use Search preferentially to discover high-value channels/playlists/source sites, then use lower-cost read methods where policy-compliant rather than spending Search on every individual dish.

### YT-CUL-5 — Atlas expansion cadence

State: `CONDITIONAL`

Only after the pilot earns continuation. Prioritize macro-region, family, meal-role, technique and variant gaps. Preserve identity/structure/variant distinctions and multilingual alias handling.

### YT-CUL-6 — app translation

State: `SEPARATELY_GATED`

A Knowledge Core promotion or YouTube-discovered candidate does not become an app recipe automatically. Translation path remains:

```text
Atlas/source candidate
→ app review queue
→ rights/provenance
→ ingredient + quantity normalization
→ hard metadata / dietary / allergen / safety
→ nutrition evidence/calculation
→ runtime acceptance
→ public admission
```

## Parallelism with existing roadmap

This lane is intentionally parallel and non-blocking:

- Corpus Scale Steps 1–6 remain complete.
- Corpus Scale Step 7 remains blocked on the existing Cloudflare owner/security setup gate.
- Nutrition recipe-unlock work remains independent.
- Culinary Brain / World Recipe Atlas verification may continue independently.
- YT-CUL-0 is complete and merged green with zero live quota consumed.
- YT-CUL-1 is the current separate owner/API-credential gate.
- YT-CUL-2 and later live phases remain blocked until YT-CUL-1 completes and current policy/quota are rechecked.
- No YouTube work may modify Blue Lagoon quota, credentials, planner state or evidence.

## Handover / auto-continuation integration

This roadmap is a canonical child programme of `docs/ROADMAP.md` and must be discoverable from `docs/ROADMAP_HANDOVER.md` and `docs/handovers/CURRENT.json`.

At every continuation boundary:

- preserve the current YT-CUL gate/status;
- record current Google-project setup state without secrets;
- record quota vintage/assigned limit when verified;
- record transient-storage mode and TTL;
- record last completed quota day and its terminal result;
- record the exact next action;
- keep Blue Lagoon and Culinary credentials/use cases separate.

The daily/control-tower refresh may summarize the lane, but it cannot silently advance policy, cost, credential or public-runtime gates.

## Success criterion

The programme succeeds if YouTube materially reduces the cost of discovering **new independently verifiable culinary knowledge and app-usable candidates** while preserving rights, evidence and runtime gates.

The target is not `many videos`. The target is:

```text
more verified dish families + variants + techniques + source pathways
per bounded Search call and per downstream review hour
without weakening governance
```
