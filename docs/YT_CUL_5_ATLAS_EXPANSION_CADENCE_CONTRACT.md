# YT-CUL-5 — Atlas Expansion Cadence Contract

Status: **LIVE EXECUTION COMPLETE / USEFUL_BUT_REVIEW_BOUND / ATLAS RELEVANCE GATE TIGHTENED POST-RUN**

Date: 2026-09-05

## Purpose

YT-CUL-5 is the bounded Atlas-expansion cadence earned by YT-CUL-4. It tests whether the channel/playlist-first acquisition pattern can expose independently reviewable recipe-source pathways across deliberately selected World Recipe Atlas gaps without granting YouTube any Atlas, app, nutrition, safety, rights or public-runtime authority.

The lane belongs to `DataRaul/culinary-recommender-app`. `DataRaul/knowledge-core` remains read-only/reconciliation context from this lane. No YT-CUL-5 result mutates Knowledge Core Atlas state.

## Baseline used for routing

Fresh read-only reconciliation against Knowledge Core main on 2026-09-05 found the canonical Atlas object reporting:

- 338 seed candidates across 20 macro-regional buckets;
- 32 `IDENTITY_VERIFIED` / 306 identity-unverified;
- 25 `STRUCTURE_VERIFIED`;
- 25 `VARIANT_AWARE`;
- 5 cumulative `TRANSFORMATION_AWARE`;
- 0 `APP_AUTHORING_ELIGIBLE`;
- 0 `PUBLIC_EXPORT_ELIGIBLE`.

This snapshot is routing context only. It is not copied into browser runtime and YT-CUL-5 does not update it.

## Preregistered live acquisition plan

Exactly 10 `search.list` calls were preregistered: five channel searches and five playlist searches covering five expansion directions:

1. Central & Southern Africa — breakfast/staple long tail;
2. Iran / Central Asia / Afghanistan — breads and soups;
3. Oceania & Pacific — earth-oven / leaf-wrapped / communal cooking;
4. Caribbean — breakfast / root-crop / one-pot long tail;
5. Andean & Northern South America — grains and soups, including a Spanish-language playlist query.

The search plan is a routing hypothesis, not a cultural claim. `traditional` in a search string never creates authenticity authority.

The YT-CUL-4 acquisition pattern was preserved:

- at most 15 selected channel candidates and 15 direct playlist candidates;
- one bounded `channels.list` batch for channel upload playlists where available;
- at most 30 playlist surfaces;
- at most 25 playlist items per surface, with no pagination;
- `videos.list` batched at <=50 IDs/request;
- at most 60 non-social external source reviews;
- no audiovisual download;
- no YouTube statistics;
- no creator/engagement/authenticity ranking.

## Quota contract

Owner-verified project-specific Search Queries limit was `100/day` for 2026-09-05. Known successful Search calls through YT-CUL-4 were `33`.

YT-CUL-5 preregistered and executed:

- Search calls: `10/10`;
- calls already used before lane: `33`;
- protected reserve: `5`;
- remaining before reserve after the lane: `52`;
- total known successful Search calls through YT-CUL-5: `43`.

Official Google documentation was rechecked on 2026-09-05. The project-specific Cloud Console limit remains authoritative.

References:

- https://developers.google.com/youtube/v3/docs/search/list
- https://developers.google.com/youtube/v3/docs/channels/list
- https://developers.google.com/youtube/v3/docs/playlistItems/list
- https://developers.google.com/youtube/v3/docs/videos/list
- https://developers.google.com/youtube/v3/determine_quota_cost
- https://developers.google.com/youtube/v3/revision_history

## Evidence and storage contract

Raw YouTube API Data stays runner-local only, carries seven-day TTL metadata, and is deleted before job exit. It is never uploaded as an artifact or committed.

External URLs discovered transiently through YouTube remain non-durable unless independently fetched. A reachable independent page with Recipe structured data is sufficient to create a **recipe-source review pointer**, but it is **not sufficient to nominate a World Recipe Atlas family**.

The post-run semantic audit made this distinction explicit because the first live run surfaced three generic Recipe-structured pages from one source domain. Those pages prove a reviewable external recipe-source pathway, but they do not by themselves prove relevance to the intended macro-region/family/meal-role/technique gap.

Canonical rule:

`INDEPENDENT_RECIPE_STRUCTURED_PAGE != ATLAS_FAMILY_RELEVANCE`

A durable source-review pointer may contain only:

- a bounded label extracted from independently fetched Recipe JSON-LD;
- independent source domain and normalized URL;
- evidence role `RECIPE_SOURCE_REVIEW_POINTER_ONLY`;
- explicit `atlasFamilyCandidateNominated=false`, `atlasPromotionAuthorized=false`, `appAdmissionAuthorized=false`, and `runtimeActivationAuthorized=false`.

No recipe prose, ingredient list, quantities, instructions, nutrition, YouTube title/description/channel metadata, YouTube statistics or audiovisual data is made durable.

## Atlas relevance authority gate

Atlas-family nomination requires a separate mapping through `scripts/youtube-culinary-atlas-relevance-gate.mjs`.

A mapping must:

- reference a known independently reviewed source pointer;
- carry review authority `KNOWLEDGE_CORE_ATLAS_REVIEW`;
- name the bounded Atlas candidate and claim scope;
- explicitly verify identity relevance;
- keep `automaticPromotionAuthorized=false`.

Even a verified relevance mapping creates a review nomination only; it does not create an Atlas lifecycle promotion. This app lane does not perform ordinary Knowledge Core implementation.

The current live run produced **0 verified Atlas relevance mappings and therefore 0 canonical Atlas family nominations**.

## Independent review network safety

The lane preserves the YT-CUL-3/4 SSRF boundary:

- HTTP(S) only;
- no localhost/local/private/reserved IP space;
- DNS resolution must remain public;
- YouTube, Google, social platforms, link hubs and commerce destinations excluded from independent-source review;
- at most 3 redirects;
- at most 512 KiB external HTML per candidate;
- 8-second external fetch timeout;
- URL-level failures remain transient.

## Canonical terminal classification

`YT_CUL_5_ATLAS_EXPANSION_CADENCE_EARNED` requires all of:

- >=5 **Atlas-relevance-verified** family nominations;
- >=4 unique independently confirmed source domains;
- >=10 independently reachable external pages;
- >=0.50 independently confirmed Recipe pages per Search call.

A raw Recipe-source pointer never satisfies the first condition.

`YT_CUL_5_USEFUL_BUT_REVIEW_BOUND` applies when the full cadence threshold is not met but independent-source review produces meaningful evidence, including >=3 independently confirmed Recipe pages or >=8 independently reachable external pages.

Otherwise return `YT_CUL_5_LOW_MARGINAL_VALUE`.

The canonical live result is `YT_CUL_5_USEFUL_BUT_REVIEW_BOUND`.

## Replay / rerun rule

The completed live workflow is historical evidence and must not be rerun with the old `33` prior-call assumption. Total known successful Search use is now `43` on the 2026-09-05 quota day. Any future live continuation requires a new preregistered quota vintage and fresh policy/quota reconciliation.

## YT-CUL-6 boundary

YT-CUL-6 is **not earned automatically**. App translation remains separately gated and still requires rights/provenance, ingredient/quantity normalization, dietary/allergen/safety, nutrition evidence, deterministic runtime acceptance and public-admission gates.
