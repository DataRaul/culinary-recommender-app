# YT-CUL-3 — Terminal Result

Date: 2026-09-05

Terminal classification: `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND`

Canonical live workflow run: `33985467639`

## Policy-safe result

- prerequisite/safety tests: `20/20 PASS`
- Search Queries assigned daily limit: `100`
- Search calls already consumed before pilot: `1` (YT-CUL-2 canary)
- Search calls planned/executed by YT-CUL-3: `24 / 24`
- protected Search reserve: `5`
- Search capacity remaining before reserve after YT-CUL-3: `70`
- `videos.list` general Queries calls: `12`
- result slots observed: `600`
- transient unique candidate pointers: `573`
- transient unique candidate channels: `444`
- non-social independent-source pointers observed transiently: `648`
- independent review attempts: `40` (preregistered cap)
- independently reachable/reviewed external pages: `14`
- independently confirmed Recipe-structured pages: `6`
- unique confirmed source domains: `6`
- Atlas family candidates nominated automatically: `0`
- Atlas promotions: `0`
- app handoffs created automatically: `0`
- public recipes admitted automatically: `0`

## Controls

- raw YouTube API Data embedded in durable output: `false`
- external URLs embedded in durable output: `false`
- transient raw payload deleted before job exit: `true`
- transient TTL metadata: `7 days`
- YouTube-derived creator quality score created: `false`
- YouTube-derived authenticity score created: `false`
- YouTube-derived engagement score created: `false`
- Blue Lagoon credential mapped: `false`
- cross-use with Blue Lagoon authorized: `false`
- automatic Atlas promotion authorized: `false`
- automatic app admission authorized: `false`
- public runtime activation authorized: `false`
- gross YouTube results counted as recipes acquired: `false`

## Interpretation

The high-information-gain threshold was not earned: the pilot confirmed six Recipe-structured external pages rather than the preregistered minimum of ten. The `USEFUL_BUT_REVIEW_BOUND` threshold was clearly earned through multiple independent criteria: six confirmed Recipe pages, fourteen reachable external pages, hundreds of non-social external source pointers, and broad transient candidate coverage.

The material finding is therefore not that YouTube results themselves are recipe evidence. It is that the bounded Search + batched read path can expose a large discovery surface and a meaningful number of independently verifiable recipe-source pathways at low Search cost, while downstream independent review remains the binding constraint.

Under the canonical roadmap this earns the conditional YT-CUL-4 channel/playlist efficiency lane. YT-CUL-4 is not executed by this result document.
