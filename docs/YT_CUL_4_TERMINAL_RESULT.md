# YT-CUL-4 — Terminal Result

Date: 2026-09-05

Workflow run: `33986444162`

Terminal classification: `YT_CUL_4_CHANNEL_PLAYLIST_EFFICIENCY_GAIN`

Status: `PASS`

## Preregistered result

YT-CUL-4 tested whether channel/playlist-first discovery could produce independently reviewable culinary/source pathways with materially fewer `search.list` calls than YT-CUL-3.

The preregistered efficiency-gain threshold was earned.

## Quota result

- owner-verified Search Queries daily limit: `100`;
- known successful Search calls before YT-CUL-4: `25`;
- YT-CUL-4 Search calls planned/executed: `8/8`;
- total known successful Search calls through YT-CUL-4: `33`;
- protected Search reserve: `5`;
- remaining capacity before the protected reserve: `62`.

General Queries reads during the lane:

- `channels.list`: `1`;
- `playlistItems.list`: `24`;
- `videos.list`: `8`;
- total general read calls: `33` against the owner-reported `10,000/day` general Queries limit.

## Discovery funnel

Durable aggregate evidence from the policy-safe workflow summary:

- channel Search calls: `4`;
- playlist Search calls: `4`;
- channel result slots: `40`;
- playlist result slots: `40`;
- transient unique channel candidates: `40`;
- transient unique playlist candidates: `40`;
- selected channel candidates: `12`;
- selected playlist candidates: `12`;
- playlist surfaces inspected: `24`;
- transient unique video pointers reached through lower-cost reads: `398`;
- non-social independent-source pointers observed transiently: `265`;
- bounded independent review attempts: `40`;
- independently reachable/reviewed external pages: `12`;
- independently confirmed Recipe-structured pages: `5`;
- unique confirmed source domains: `4`.

These are discovery/review counts, not recipes acquired and not Atlas promotions.

## Efficiency comparison

YT-CUL-3 baseline:

- confirmed Recipe pages per Search call: `6 / 24 = 0.25`.

YT-CUL-4:

- confirmed Recipe pages per Search call: `5 / 8 = 0.625`;
- Search-efficiency ratio versus YT-CUL-3: `2.5x`;
- confirmed Recipe pages per independent review attempt: `5 / 40 = 0.125`.

The lane therefore materially reduced Search consumption for independently confirmed recipe-source pathways, while independent external review remained the dominant downstream bottleneck.

The preregistered `YT_CUL_4_CHANNEL_PLAYLIST_EFFICIENCY_GAIN` threshold required at least four confirmed Recipe pages, four unique confirmed domains, eight independently reachable pages and at least `0.50` confirmed Recipe pages per Search call. Actual result: `5`, `4`, `12`, and `0.625` respectively.

## Safety / policy controls

The workflow summary recorded:

- raw YouTube API Data embedded durably: `false`;
- external URLs embedded durably: `false`;
- transient raw payload deleted before job exit: `true`;
- transient TTL metadata: `7 days`;
- YouTube statistics read: `false`;
- Search pagination used: `false`;
- playlist pagination used: `false`;
- audiovisual content downloaded: `false`;
- creator-quality score created: `false`;
- authenticity score created: `false`;
- engagement score created: `false`;
- Blue Lagoon credential mapped: `false`;
- Blue Lagoon cross-use authorized: `false`;
- automatic Atlas promotion authorized: `false`;
- automatic app admission authorized: `false`;
- public-runtime activation authorized: `false`;
- gross YouTube results counted as recipes acquired: `false`.

All `28/28` focused YT-CUL-0/2/3/4 safety tests passed before live spend.

## Decision

`YT_CUL_4_CHANNEL_PLAYLIST_EFFICIENCY_GAIN`

YT-CUL-5 is **earned** as the next conditional YouTube Culinary phase. YT-CUL-5 is not executed by this result and remains subject to fresh GitHub, policy and quota reconciliation.

The preferred acquisition pattern going forward is therefore:

```text
bounded Search for high-value channel / playlist / source surfaces
→ lower-cost read fan-out
→ transient outbound source discovery
→ independent external review
→ separately governed Atlas / app gates
```

This result does not create any recipe, Atlas, nutrition, rights, safety, app-authoring or public-runtime authority.
