# YouTube Culinary Discovery Atlas — Roadmap V0

Status: **YT-CUL-0 MERGED GREEN / YT-CUL-1 COMPLETE / YT-CUL-2 PASS + MERGED GREEN / YT-CUL-3 USEFUL_BUT_REVIEW_BOUND + MERGED GREEN / YT-CUL-4 EARNED + READY**

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

Use one distinct Google Cloud API Project for the distinct Culinary internal discovery client. This is not a second Blue Lagoon quota shard and must not be reused to increase quota for the Blue Lagoon music use case.

Current project/client identity:

- Google Cloud project display identity: `culinary-youtube-discovery`
- API: `YouTube Data API v3`
- credential for V0 public-data discovery: API key only
- repository secret: `CULINARY_YOUTUBE_API_KEY`
- OAuth: not required for V0 public search/read operations
- service accounts: not used
- owner-verified Search Queries daily limit on 2026-09-05: `100/day`

Never commit the key, paste it into repository files, or place it in handovers.

Current official quota semantics to verify in the Cloud Console before each activation vintage:

- `search.list` uses the Search Queries bucket;
- current documented default Search Queries limit is 100 calls/day per API project/client;
- the actual assigned project limit is authoritative;
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

1. an approved transient object-store prefix with lifecycle/cleanup only if the current canonical corpus architecture permits it;
2. otherwise runner-local temporary storage for bounded pilots;
3. never Git commit history.

The transient layer must record `retrieved_at`, source endpoint, query identity, project/client vintage and expiry/refresh deadline.

YT-CUL-2 and YT-CUL-3 proved the runner-local path: raw API data was stored only in temporary runner storage with seven-day TTL metadata and deleted before job exit. No raw YouTube API data was persisted as a Git object or workflow artifact.

## Search planning and quota control

Each live day is a bounded quota day, not an unstructured scrape.

Current V0 limits after activation:

- hard daily Search limit: owner-verified project limit `100/day` as of 2026-09-05;
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

### YT-CUL-1 — owner Google Cloud setup

State: `COMPLETE`

The distinct Culinary Google Cloud project exists, YouTube Data API v3 is enabled, the restricted API key is available to GitHub Actions as `CULINARY_YOUTUBE_API_KEY`, and the owner verified the actual assigned Search Queries daily limit as `100/day` on 2026-09-05. The key remains secret and is not reproduced in durable project state.

No second YouTube account is required for public-data V0 and no quota-sharding project was created for this client/use case.

### YT-CUL-2 — zero/low-quota connectivity canary

State: `PASS / MERGED_GREEN`

Completed in PR #58, merged to `main` at `56104c104e63342772e0db4dbf21d8ebf8b471ca`.

Canonical artifacts:

- `scripts/run-youtube-culinary-connectivity-canary.mjs`
- `tests/youtube-culinary-connectivity-canary.test.js`
- `.github/workflows/yt-cul-2-canary.yml`
- `docs/YT_CUL_2_CONNECTIVITY_CANARY_CONTRACT.md`

Activation evidence:

- fresh policy/quota recheck completed on 2026-09-05;
- actual assigned Search Queries daily limit verified as `100`;
- dedicated canary workflow run `33984625070` passed;
- exactly `1` live `search.list` call executed;
- HTTP `200` and `1` result slot observed;
- five-call protected reserve remained intact; `94` calls remained before the reserve boundary after the canary;
- all `11` focused YT-CUL-0/YT-CUL-2 safety tests passed;
- raw API payload remained transient and was deleted before job exit;
- no raw YouTube API metadata was embedded in durable output;
- no Blue Lagoon credential, quota ledger, planner state or evidence participated;
- normal PR validation passed;
- post-merge main validation run `33984711330` passed;
- Pages build/deploy run `33984710650` passed.

The earlier fail-closed preflight consumed `0` Search calls. Total successful YT-CUL live Search calls through YT-CUL-2: `1`.

### YT-CUL-3 — one-day bounded discovery pilot

State: `PASS / MERGED_GREEN / YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND`

Completed in PR #60, merged to `main` at `2b099f4b9c61ce8d43a4a8d0420fdb8ba9d3e83f`.

Canonical artifacts:

- `scripts/run-youtube-culinary-discovery-pilot.mjs`
- `tests/youtube-culinary-discovery-pilot.test.js`
- `.github/workflows/yt-cul-3-one-day-pilot.yml`
- `docs/YT_CUL_3_ONE_DAY_DISCOVERY_PILOT_CONTRACT.md`
- `docs/YT_CUL_3_TERMINAL_RESULT.md`

Live evidence from workflow run `33985467639`:

- all `20/20` focused YT-CUL safety tests passed before live spend;
- Search Queries calls planned/executed: `24/24` after the prior one-call YT-CUL-2 canary;
- total known successful Search Queries calls on the quota day through YT-CUL-3: `25`;
- five-call protected reserve remained intact, leaving `70` calls before the reserve boundary;
- batched `videos.list` general Queries calls: `12`;
- result slots observed: `600`;
- transient unique candidate pointers: `573`;
- transient unique candidate channels: `444`;
- non-social independent-source pointers observed transiently: `648`;
- bounded independent-source review attempts: `40`;
- independently reachable/reviewed external pages: `14`;
- independently confirmed Recipe-structured pages: `6` across `6` unique confirmed source domains;
- raw YouTube API Data and external URLs remained non-durable and transient payloads were deleted before job exit;
- creator/authenticity/engagement scores created: `0`;
- automatic Atlas promotions: `0`;
- automatic app handoffs/admissions: `0`;
- public recipes admitted automatically: `0`;
- no Blue Lagoon credential, quota, planner state or evidence participated.

The preregistered `YOUTUBE_CULINARY_DISCOVERY_HIGH_INFORMATION_GAIN` threshold was not earned because independently confirmed Recipe pages were `6`, below the required `10`. The preregistered `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND` threshold was clearly earned. The pilot therefore establishes that bounded YouTube Search + batched reads can expose a large discovery surface and meaningful independent recipe-source pathways while **independent downstream review remains the binding constraint**.

PR #60 validation run `33985600607` passed. Post-merge main validation run `33985681225` passed and Pages build/deploy run `33985680803` passed.

### YT-CUL-4 — channel/playlist efficiency lane

State: `READY / EARNED_BY_YT-CUL-3_USEFUL_BUT_REVIEW_BOUND / NOT_YET_EXECUTED`

YT-CUL-3 earned continuation. Prefer Search for discovering high-value channels/playlists/source pathways, then use lower-cost policy-compliant read methods where possible rather than spending Search on every individual dish. Preserve all YT-CUL-0 through YT-CUL-3 quota, storage, evidence, network-safety and Blue Lagoon-separation controls.

Before any YT-CUL-4 live execution on the same quota day, fresh-recheck current policy/project quota and account for the `25` already-consumed Search Queries calls; preserve the five-call reserve.

### YT-CUL-5 — Atlas expansion cadence

State: `CONDITIONAL`

Only after the efficiency lane earns continuation. Prioritize macro-region, family, meal-role, technique and variant gaps. Preserve identity/structure/variant distinctions and multilingual alias handling.

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

- Corpus Scale continues independently according to the current canonical `docs/ROADMAP_HANDOVER.md` and `docs/handovers/CURRENT.json`; this YouTube child roadmap must not overwrite that lane's current architecture or human gates.
- Nutrition recipe-unlock work remains independent.
- Culinary Brain / World Recipe Atlas verification may continue independently.
- YT-CUL-0 is complete and merged green.
- YT-CUL-1 owner/API setup is complete.
- YT-CUL-2 is PASS and merged green.
- YT-CUL-3 is `USEFUL_BUT_REVIEW_BOUND`, PASS and merged green.
- YT-CUL-4 is earned and ready but not executed.
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
