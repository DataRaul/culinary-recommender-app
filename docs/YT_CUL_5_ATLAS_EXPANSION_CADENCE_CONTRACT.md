# YT-CUL-5 — Atlas Expansion Cadence Contract

Status: **IMPLEMENTED / LIVE EXECUTION PENDING**

Date: 2026-09-05

## Purpose

YT-CUL-5 is the bounded Atlas-expansion cadence earned by the YT-CUL-4 channel/playlist efficiency result. It tests whether the preferred acquisition pattern can repeatedly produce **independently evidenced Atlas identity candidates** across deliberately selected World Recipe Atlas gaps without granting YouTube any Atlas, app, nutrition, safety, rights or public-runtime authority.

The lane belongs to `DataRaul/culinary-recommender-app`. `DataRaul/knowledge-core` remains read-only/reconciliation context from this lane. YT-CUL-5 may create policy-safe **promotion handoffs**, but it must not mutate Knowledge Core Atlas state.

## Baseline used for routing

Fresh read-only reconciliation against Knowledge Core main on 2026-09-05 found the canonical Atlas object reporting:

- 338 seed candidates across 20 macro-regional buckets;
- 32 `IDENTITY_VERIFIED` / 306 identity-unverified;
- 25 `STRUCTURE_VERIFIED`;
- 25 `VARIANT_AWARE`;
- 5 cumulative `TRANSFORMATION_AWARE`;
- 0 `APP_AUTHORING_ELIGIBLE`;
- 0 `PUBLIC_EXPORT_ELIGIBLE`.

This snapshot is used only to choose information-gain directions. It is not copied into browser runtime and YT-CUL-5 does not update it.

## Live acquisition plan

Preregister exactly 10 `search.list` calls: five channel searches and five playlist searches covering five expansion directions:

1. Central & Southern Africa — breakfast/staple long tail;
2. Iran / Central Asia / Afghanistan — breads and soups;
3. Oceania & Pacific — earth-oven / leaf-wrapped / communal cooking;
4. Caribbean — breakfast / root-crop / one-pot long tail;
5. Andean & Northern South America — grains and soups, including a Spanish-language playlist query.

The search plan is a routing hypothesis, not a cultural claim. `traditional` in a search string never creates authenticity authority.

After Search, use the YT-CUL-4 pattern:

- select at most 15 channel candidates and 15 direct playlist candidates deterministically;
- resolve channel upload playlists with one bounded `channels.list` batch where available;
- inspect at most 30 playlist surfaces;
- request at most 25 playlist items per surface and do not paginate;
- batch `videos.list` reads up to 50 IDs/request;
- inspect at most 60 non-social external source URLs;
- download no audiovisual content;
- read no YouTube statistics;
- create no creator/engagement/authenticity ranking.

## Quota contract

Owner-verified project-specific Search Queries limit remains `100/day` for 2026-09-05. Known successful Search calls through YT-CUL-4 are `33`.

YT-CUL-5 therefore preregisters:

- Search calls: `10`;
- calls already used before lane: `33`;
- protected reserve: `5`;
- expected remaining before reserve after successful lane: `52`.

Official Google documentation was rechecked on 2026-09-05:

- `search.list`: current documented default 100/day; one call consumes one Search Queries call;
- `channels.list`: 1 general quota unit/call;
- `playlistItems.list`: 1 general quota unit/call;
- `videos.list`: 1 general quota unit/call;
- the project-specific Cloud Console limit remains authoritative;
- current quota documentation says default general Data API allocation is 10,000 units/day for other endpoints and daily quotas reset at midnight Pacific Time.

References:

- https://developers.google.com/youtube/v3/docs/search/list
- https://developers.google.com/youtube/v3/docs/channels/list
- https://developers.google.com/youtube/v3/docs/playlistItems/list
- https://developers.google.com/youtube/v3/docs/videos/list
- https://developers.google.com/youtube/v3/determine_quota_cost
- https://developers.google.com/youtube/v3/revision_history

## Evidence and storage contract

Raw YouTube API Data stays runner-local only, carries seven-day TTL metadata, and is deleted before job exit. It is never uploaded as an artifact or committed.

External URLs discovered transiently through YouTube remain non-durable unless the URL is independently fetched and the external page itself confirms Recipe-structured data. Only then may the lane create a durable promotion handoff under the existing `createPromotionHandoff` contract.

A YT-CUL-5 identity candidate handoff may contain only:

- a bounded candidate label extracted from independently fetched Recipe JSON-LD;
- independent source domain and normalized URL;
- evidence role `INDEPENDENT_RECIPE_PAGE_DISCOVERY_ONLY`;
- an `IDENTITY` promotion-handoff wrapper;
- explicit `automaticAtlasPromotionAuthorized=false`, `automaticAppAdmissionAuthorized=false`, `atlasStateChanged=false`, and `appStateChanged=false`.

No recipe prose, ingredient list, quantities, instructions, nutrition, YouTube title/description/channel metadata, YouTube statistics or audiovisual data is made durable.

## Independent review network safety

The lane preserves the YT-CUL-3/4 SSRF boundary:

- only HTTP(S);
- no localhost/local/private/reserved IP space;
- DNS resolution must remain public;
- YouTube, Google, social platforms, link hubs and commerce destinations are excluded from independent-source review;
- at most 3 redirects;
- at most 512 KiB external HTML per candidate;
- 8-second external fetch timeout;
- URL-level failures remain transient.

## Terminal classification

`YT_CUL_5_ATLAS_EXPANSION_CADENCE_EARNED` requires all of:

- >=5 independent identity candidate handoffs;
- >=4 unique independently confirmed source domains;
- >=10 independently reachable external pages;
- >=0.50 independently confirmed Recipe pages per Search call.

`YT_CUL_5_USEFUL_BUT_REVIEW_BOUND` is returned when the full cadence threshold is not met but at least one of these holds:

- >=3 candidate handoffs;
- >=3 independently confirmed Recipe pages;
- >=8 independently reachable external pages.

Otherwise return `YT_CUL_5_LOW_MARGINAL_VALUE`.

Every terminal result keeps Atlas promotions at zero. A handoff is a review candidate, not an Atlas state transition.

## YT-CUL-6 boundary

YT-CUL-5 never automatically starts or authorizes YT-CUL-6. App translation remains separately gated and still requires rights/provenance, ingredient/quantity normalization, dietary/allergen/safety, nutrition evidence, deterministic runtime acceptance and public-admission gates.
