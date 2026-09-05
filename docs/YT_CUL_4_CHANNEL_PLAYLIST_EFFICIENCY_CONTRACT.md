# YT-CUL-4 — Channel / Playlist Efficiency Lane

Date: 2026-09-05

Status: `PREREGISTERED / LIVE_EXECUTION_PENDING`

## Objective

Test whether a channel/playlist-first discovery strategy can produce independently reviewable culinary/source pathways with materially fewer expensive `search.list` calls than the YT-CUL-3 dish/video-search strategy.

YT-CUL-4 is an efficiency experiment. It does **not** create creator quality, authenticity, popularity, engagement, Atlas, app-authoring, nutrition, dietary/allergen, freshness/trend or public-runtime authority.

## Baseline from YT-CUL-3

The merged YT-CUL-3 terminal result is the preregistered comparison baseline:

- Search Queries calls: `24`;
- independent review attempts: `40`;
- independently reachable pages: `14`;
- independently confirmed Recipe-structured pages: `6`;
- unique confirmed source domains: `6`;
- confirmed Recipe pages per Search call: `0.25`;
- confirmed Recipe pages per review attempt: `0.15`.

Gross YouTube results are not recipes acquired and are not used as an efficiency success criterion.

## Fresh activation checks

Immediately before implementation/execution:

- live GitHub `main`, open PRs and `docs/handovers/CURRENT.json` were reconciled;
- YT-CUL-3 is merged green and YT-CUL-4 is explicitly earned/ready;
- the owner-verified Culinary project Search Queries limit remains the current same-day authority at `100/day`;
- known successful Search Queries calls already consumed on the current quota day are `25` (`1` YT-CUL-2 + `24` YT-CUL-3);
- current official YouTube documentation was rechecked on 2026-09-05: `search.list` remains one unit in the granular Search Queries bucket, while `channels.list`, `playlistItems.list` and `videos.list` are one unit each in the general Queries bucket;
- current policy/revision history still requires the existing raw-data/transient-storage and derived-metrics boundaries.

Official references:

- https://developers.google.com/youtube/v3/docs/search/list
- https://developers.google.com/youtube/v3/docs/channels/list
- https://developers.google.com/youtube/v3/docs/playlistItems/list
- https://developers.google.com/youtube/v3/docs/videos/list
- https://developers.google.com/youtube/v3/revision_history
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/revision-history

The project-specific Google Cloud Console quota remains authoritative if it differs from documented defaults.

## Search spend

YT-CUL-4 deliberately uses only `8` Search Queries calls:

- assigned Search Queries limit: `100/day`;
- protected reserve: `5`;
- already consumed before YT-CUL-4: `25`;
- preregistered YT-CUL-4 Search calls: `8`;
- total after complete YT-CUL-4: `33`;
- remaining capacity before protected reserve: `62`.

There is no pagination for Search. A failed attempted Search request is conservatively counted as consumed in the lane ledger.

## Preregistered search portfolio

Search is used only to discover channel and playlist surfaces. Query text is programme-owned methodology and may be durable; returned YouTube metadata may not.

| ID | Purpose | Type | Query |
|---|---|---|---|
| c01 | CREATOR_OR_CHANNEL_DISCOVERY | channel | `traditional West African cooking recipes` |
| c02 | CREATOR_OR_CHANNEL_DISCOVERY | channel | `traditional Central Asian cooking recipes` |
| c03 | CREATOR_OR_CHANNEL_DISCOVERY | channel | `traditional Caribbean cooking recipes` |
| c04 | CREATOR_OR_CHANNEL_DISCOVERY | channel | `traditional South Asian home cooking recipes` |
| p01 | PLAYLIST_DISCOVERY | playlist | `traditional West African recipe playlist` |
| p02 | PLAYLIST_DISCOVERY | playlist | `traditional Central Asian recipe playlist` |
| p03 | PLAYLIST_DISCOVERY | playlist | `traditional Caribbean recipe playlist` |
| p04 | PLAYLIST_DISCOVERY | playlist | `traditional Southeast Asian recipe playlist` |

Each Search call requests at most `10` results, uses `safeSearch=strict`, and uses the dedicated Culinary key via `X-Goog-Api-Key` rather than the request URL.

## Lower-cost read fan-out

The lane then uses policy-compliant general read methods instead of further Search:

1. deterministically select at most `12` unique channel candidates and `12` unique playlist candidates from the transient Search result set;
2. fetch selected channels in batched `channels.list(part=contentDetails)` calls to obtain uploads-playlist pointers;
3. inspect at most `24` resulting playlist surfaces total, one first page each, via `playlistItems.list(part=contentDetails,maxResults=25)`;
4. de-duplicate the resulting video pointers and retrieve descriptions in batches of at most `50` via `videos.list(part=snippet)`;
5. transiently extract non-social outbound HTTP(S) links;
6. independently review at most `40` external pages using the same bounded network-safety contract as YT-CUL-3.

No Search pagination, channel-video Search, playlist pagination, audiovisual download, comment retrieval or engagement/statistics retrieval is allowed.

## Independent-source review

External-source review remains bounded and fail-closed:

- YouTube/Google/social/commerce/link-hub destinations are excluded from independent-source candidates;
- localhost, IP literals in private/reserved ranges, and DNS resolutions to private/reserved ranges are rejected;
- redirects are bounded and revalidated;
- only bounded HTML/XHTML responses are accepted;
- page reads are capped at `512 KiB`;
- durable output records only aggregate counts and whether independently fetched pages expose `Recipe` structured data;
- URL-level details remain transient and are deleted before job exit.

## Transient-data firewall

All raw Search, channel, playlist-item and video responses remain runner-local only under a temporary directory with seven-day TTL metadata and are deleted before exit. No raw YouTube title, description, channel ID/name, playlist ID/name, video ID, thumbnail, external URL or other YouTube API Data is committed or uploaded as an artifact.

## Durable efficiency metrics

The terminal summary may durably record only aggregate/programme-owned metrics:

- Search calls planned/executed/reserved and remaining capacity;
- general read-call counts by API method;
- channel/playlist result slots and selected-resource counts;
- unique transient video-pointer count;
- external-source pointer count;
- independent review attempts/reachable pages;
- confirmed Recipe-structured pages and unique confirmed source-domain count;
- confirmed Recipe pages per Search call;
- confirmed Recipe pages per review attempt;
- YT-CUL-3 baseline values and improvement ratio;
- policy/storage/separation control facts.

No custom YouTube-derived creator/authenticity/quality/engagement score is created.

## Preregistered terminal classification

### `YT_CUL_4_CHANNEL_PLAYLIST_EFFICIENCY_GAIN`

Requires all of:

- at least `4` independently confirmed Recipe-structured pages;
- at least `4` unique confirmed source domains;
- at least `8` independently reachable external pages;
- at least `0.50` confirmed Recipe pages per executed Search call.

The `0.50` threshold is double the YT-CUL-3 baseline of `0.25` confirmed Recipe pages per Search call. This outcome earns YT-CUL-5 as the next YouTube phase, subject to normal fresh policy/quota reconciliation.

### `YT_CUL_4_USEFUL_NO_CLEAR_EFFICIENCY_GAIN`

Returned when the efficiency-gain threshold is not met but any of these are true:

- at least `3` independently confirmed Recipe-structured pages; or
- at least `8` independently reachable external pages; or
- at least `20` non-social independent-source pointers.

This means the channel/playlist surface is useful but did not prove a clear Search-efficiency gain over YT-CUL-3. YT-CUL-5 is not automatically earned; the roadmap should reconcile the review bottleneck before further scale.

### `YT_CUL_4_LOW_MARGINAL_VALUE`

Returned when policy/storage controls pass but neither useful-yield threshold is earned.

### `POLICY_OR_STORAGE_REDESIGN_REQUIRED`

Returned fail-closed if quota reserve protection, client separation, response-shape expectations, transient deletion, durable metadata firewall, policy/configuration checks, or independent-review network-safety controls fail.

## Non-authority

YT-CUL-4 cannot automatically:

- identify a creator as authoritative or authentic;
- persist a channel/playlist/video classification from YouTube API Data;
- promote a World Recipe Atlas family/variant/technique/transformation claim;
- create Gate F2 or app-authoring admission;
- calculate nutrition or change dietary/allergen/safety semantics;
- change public browser behavior;
- activate YT-CUL-5 unless the preregistered terminal result earns it.
