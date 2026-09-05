# YT-CUL-3 — One-Day Bounded Discovery Pilot Contract

Date: 2026-09-05

Status: `PREREGISTERED / LIVE_EXECUTION_PENDING`

## Objective

Estimate whether the distinct Culinary YouTube Data API client materially reduces the cost of finding independently reviewable culinary/source pathways. The pilot measures a conversion funnel, not video popularity and not recipes acquired.

This phase does not create Atlas authority, app-authoring authority, nutrition authority, dietary/allergen authority, freshness/trend authority, or public-runtime authority.

## Fresh activation checks

Immediately before this pilot was prepared:

- live GitHub `main`, open pull requests and current handover state were reconciled;
- the current owner-verified Culinary project **Search Queries** limit remains `100/day` from Google Cloud Console;
- YT-CUL-2 already consumed exactly one successful Search Queries call in the current quota day;
- current official YouTube documentation was rechecked on 2026-09-05 and still states that `search.list` uses the granular Search Queries bucket at one call per request and that the default bucket is 100/day;
- current official documentation still states that general Data API reads such as `videos.list` consume the general Queries bucket, for which the owner-reported project limit is 10,000/day;
- the current YouTube API Terms/Developer Policy revision history still preserves the 2026 additional derived-metrics/data-storage policy boundary. No custom creator/authenticity/engagement score is authorized by this pilot.

Official references:

- https://developers.google.com/youtube/v3/docs/search/list
- https://developers.google.com/youtube/v3/determine_quota_cost
- https://developers.google.com/youtube/v3/revision_history
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/revision-history

The verified project-specific Cloud Console limits remain authoritative if they differ from documentation defaults.

## Search spend

This pilot intentionally does **not** exhaust the daily Search Queries bucket.

- assigned Search Queries limit: `100/day`
- protected reserve: `5`
- already consumed by the successful YT-CUL-2 canary in this quota day: `1`
- preregistered YT-CUL-3 Search calls: `24`
- `search.list` results requested per call: `25`
- maximum raw search-result slots: `600`
- remaining capacity before the protected reserve after a complete 24-call pilot: `70`

There is no pagination. A failed/invalid attempted Search request is conservatively counted as consumed for the pilot ledger.

After Search, unique video IDs may be enriched with batched `videos.list(part=snippet)` reads, at no more than 50 IDs per request. With at most 600 unique video IDs, the enrichment ceiling is 12 general Queries calls, far below the owner-reported 10,000/day general Queries limit.

## Preregistered query portfolio

The query texts are programme-owned methodology and may be durable. Raw YouTube results may not.

| ID | Purpose | Query |
|---|---|---|
| q01 | CUISINE_REGION_GAP | `traditional Sahel home cooking recipe` |
| q02 | CUISINE_REGION_GAP | `traditional Horn of Africa home cooking recipe` |
| q03 | CUISINE_REGION_GAP | `traditional Central African home cooking recipe` |
| q04 | CUISINE_REGION_GAP | `traditional Central Asian home cooking recipe` |
| q05 | CUISINE_REGION_GAP | `traditional Caucasus home cooking recipe` |
| q06 | CUISINE_REGION_GAP | `traditional Pacific Islands home cooking recipe` |
| q07 | CUISINE_REGION_GAP | `receta tradicional andina cocina casera` |
| q08 | CUISINE_REGION_GAP | `receta tradicional caribeña cocina casera` |
| q09 | DISH_FAMILY_DISCOVERY | `traditional Balkan home cooking dish recipe` |
| q10 | DISH_FAMILY_DISCOVERY | `traditional Levant home cooking dish recipe` |
| q11 | DISH_FAMILY_DISCOVERY | `traditional Southeast Asian home cooking dish recipe` |
| q12 | DISH_FAMILY_DISCOVERY | `traditional South Indian home cooking dish recipe` |
| q13 | VARIANT_DISCOVERY | `regional variations jollof rice recipe` |
| q14 | VARIANT_DISCOVERY | `regional variations khachapuri recipe` |
| q15 | VARIANT_DISCOVERY | `variantes regionales tamal receta tradicional` |
| q16 | VARIANT_DISCOVERY | `regional variations laksa traditional recipe` |
| q17 | TECHNIQUE_SOURCE_DISCOVERY | `traditional leaf wrapped cooking recipe` |
| q18 | TECHNIQUE_SOURCE_DISCOVERY | `traditional clay pot cooking recipe` |
| q19 | TECHNIQUE_SOURCE_DISCOVERY | `traditional fermented batter recipe` |
| q20 | TECHNIQUE_SOURCE_DISCOVERY | `traditional stone ground maize recipe` |
| q21 | EXTERNAL_RECIPE_SOURCE_DISCOVERY | `traditional West African cooking full recipe website` |
| q22 | EXTERNAL_RECIPE_SOURCE_DISCOVERY | `traditional Central Asian cooking full recipe website` |
| q23 | EXTERNAL_RECIPE_SOURCE_DISCOVERY | `traditional Caribbean cooking recipe link website` |
| q24 | CONTROL | `arepa traditional recipe` |

All Search requests use `safeSearch=strict`, `type=video`, one page only, and the dedicated Culinary API key through the `X-Goog-Api-Key` request header.

## Transient data and independent-source review

Raw Search and `videos.list` responses remain runner-local only. They are written only under a temporary directory with seven-day TTL metadata and are deleted before the job exits. No raw result title, description, video ID, channel ID, creator name, thumbnail, engagement statistic, or external URL is committed to Git or written into the durable workflow summary.

For the purpose of measuring independent-source conversion only, the live runner may transiently extract outbound HTTP(S) links from full video descriptions. It then:

1. removes YouTube, Google and major social/commerce/link-hub domains from the independent-source candidate set;
2. caps external review attempts at `40` unique URLs;
3. rejects localhost, IP literals or DNS resolutions in private/reserved address ranges;
4. follows at most three redirects, validating each destination;
5. accepts only bounded HTML/XHTML responses and reads at most `512 KiB` per page;
6. records only whether an independently fetched page was reachable and whether it exposed `Recipe` JSON-LD/schema markup;
7. stores only aggregate counts durably.

A reachable external page is an independently reviewed candidate for this pilot. A page exposing Recipe structured data is counted as an independently confirmed recipe-page pathway. Neither status is an Atlas identity/structure/variant/technique promotion.

## Durable funnel

The policy-safe terminal summary may contain only aggregate/control fields such as:

- Search calls planned/executed/reserved;
- general `videos.list` enrichment calls;
- result slots observed;
- transient unique candidate-pointer count;
- outbound independent-source pointers observed;
- independently reviewed external pages;
- independently confirmed Recipe-structured pages;
- unique independently confirmed source-domain count;
- Atlas promotions: always `0` unless separately earned from non-YouTube evidence outside this automated pilot;
- app handoffs: `0` unless separately reviewed;
- public recipe admissions: `0`;
- transient-cache deletion and policy/separation control facts.

Gross YouTube result count must never be reported as recipes acquired.

## Preregistered terminal classification

The runner assigns exactly one of the roadmap terminal outputs after the bounded run:

### `YOUTUBE_CULINARY_DISCOVERY_HIGH_INFORMATION_GAIN`

Requires all of:

- at least `10` independently confirmed Recipe-structured external pages;
- at least `6` unique independently confirmed source domains;
- at least `0.25` confirmed Recipe pages per executed Search call.

### `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND`

If the high-information threshold is not met, this result is earned by any of:

- at least `3` independently confirmed Recipe-structured external pages; or
- at least `8` independently reachable external pages; or
- at least `10` non-social independent-source pointers; or
- at least `200` transient unique YouTube candidate pointers together with at least `3` non-social independent-source pointers.

This outcome means the discovery surface appears useful, but manual/independent review remains the binding constraint.

### `YOUTUBE_CULINARY_DISCOVERY_LOW_MARGINAL_VALUE`

Returned when the policy/storage contract passes but neither useful-yield threshold is earned.

### `POLICY_OR_STORAGE_REDESIGN_REQUIRED`

Returned/raised fail-closed if quota reserve protection, client separation, response-shape expectations, transient deletion, durable metadata firewall, policy/configuration checks, or independent-review network-safety controls fail.

## Non-authority

The pilot does not automatically:

- add or verify a World Recipe Atlas family;
- create a durable YouTube-derived dish classification;
- score creators, authenticity, quality, engagement or popularity;
- create a Gate F2 admission;
- calculate nutrition;
- change public browser behavior;
- advance YT-CUL-4 unless the terminal result earns continuation under the roadmap.
