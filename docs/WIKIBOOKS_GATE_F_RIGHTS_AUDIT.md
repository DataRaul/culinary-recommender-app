# Wikibooks Cookbook — Gate F Rights & Provenance Audit

Status: **PASS FOR BOUNDED TEXT-ONLY INGEST, SUBJECT TO THE CONTROLS BELOW**  
Gate: V1.1 Recipe Corpus Gate F  
Reviewed: 2026-09-01  
Source project: English Wikibooks Cookbook

## Decision

The public app may acquire and redistribute a bounded **text-only** subset of English Wikibooks Cookbook recipes under **CC BY-SA 4.0**, provided every admitted record preserves page-level source/revision provenance, attribution, licence notice, modification state and any additional source-specific attribution notice that applies to that page.

This audit does **not** authorize importing recipe images or other non-text media. Wikimedia-hosted non-text media can carry different per-file licences and must be reviewed separately before use.

This audit also does not make the rest of this repository CC BY-SA. Imported/adapted Wikibooks recipe text is kept in a separate external-content lane and remains CC BY-SA 4.0. Project-authored application code/data remains under its existing repository terms unless separately licensed.

## Official basis

### English Wikibooks copyright policy

`https://en.wikibooks.org/wiki/Wikibooks:Copyrights`

English Wikibooks states that community-developed text may be copied, distributed and modified under **Creative Commons Attribution-ShareAlike 4.0 International** and, unless otherwise noted, GFDL. It further states that a link back to the relevant book/module is generally sufficient attribution because the page history identifies contributors.

The same policy warns that text imported into Wikibooks from external sources can carry additional attribution requirements shown on the page or talk page. Those notices must be preserved by downstream reusers where applicable.

### Wikimedia Terms of Use

`https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use`

For Wikimedia text reuse, attribution may be satisfied by a hyperlink/URL to the reused page, a stable freely accessible copy with equivalent author credit, or an author list. Modified/adapted text must be clearly identified as modified and distributed under CC BY-SA 4.0 or later, with a licence notice/link.

### CC BY-SA 4.0

Canonical licence: `https://creativecommons.org/licenses/by-sa/4.0/`

The chosen reuse path is CC BY-SA 4.0 rather than GFDL. The app must provide appropriate credit, licence link, modification notice and ShareAlike treatment for adapted Wikibooks text.

### Wikimedia API access

`https://www.mediawiki.org/wiki/Wikimedia_APIs/Access_policy`  
`https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines`

Acquisition uses the MediaWiki API with a descriptive User-Agent, bounded sequential requests, caching/static snapshots and no attempt to bypass throttling or access controls. The browser runtime does not call Wikibooks.

## Chosen ingest path

1. **Discovery only:** query `Category:Recipes` through the official MediaWiki Action API.
2. **Snapshot:** record each selected page's `pageid`, exact `revid`, revision timestamp, canonical page URL and revision permalink.
3. **Read by revision:** normalization uses the recorded revision, not an unpinned latest page.
4. **Text only:** ingest title, recipe text needed for normalized ingredients/instructions, and source category metadata. Do not ingest images/media in Gate F.
5. **Separate licensed lane:** external records live in a Wikibooks-specific source bundle and carry `CC-BY-SA-4.0` provenance per record.
6. **Modification disclosure:** normalized records explicitly state that the Wikibooks source text was transformed into the Culinary Recommender schema.
7. **Public attribution:** every external recipe retains a source page link, exact revision link, `Wikibooks contributors` attribution, and CC BY-SA 4.0 link. UI rendering must expose that provenance wherever the external recipe itself is rendered.
8. **No nutrition authority transfer:** imported recipe nutrition statements, if present in source text, are not imported as authoritative `NutritionSource` values.

## Page-level admission firewall

A candidate page is not automatically safe merely because it appears in `Category:Recipes`.

For the bounded Gate F tranche, a record may be admitted only when:

- the source is a `Cookbook:` recipe page;
- exact page and revision IDs are recorded;
- the page text is available under the standard Wikibooks text licence path;
- no detected page-level notice requires a reuse treatment the pipeline does not yet preserve;
- title/ingredient/instruction extraction succeeds without inventing missing text;
- imported expression remains clearly attributed and ShareAlike;
- media are excluded;
- unsupported or ambiguous records are rejected with a reason rather than repaired by guesswork.

If a page contains an additional source/attribution/copyright notice that the importer cannot preserve faithfully, the Gate F importer must reject that page until the notice is explicitly reviewed.

## Repository boundary

The repository currently has no general project licence. To avoid misleading licence scope:

- project-authored code and authored recipe corpus remain unchanged;
- Wikibooks-derived records are stored separately and identify `CC-BY-SA-4.0` at record/source-bundle level;
- a third-party notice explains that only the imported/adapted Wikibooks text is offered under CC BY-SA 4.0;
- no repository-level statement may imply that Wikimedia or Wikibooks endorses this app.

## Attribution payload required per admitted record

At minimum:

```text
sourceName: English Wikibooks Cookbook
sourcePageTitle: <Cookbook:...>
sourcePageId: <pageid>
sourceRevisionId: <revid>
sourceRevisionTimestamp: <ISO timestamp>
sourceUrl: https://en.wikibooks.org/wiki/<encoded title>
sourceRevisionUrl: https://en.wikibooks.org/w/index.php?oldid=<revid>
attribution: Wikibooks contributors; see source page history
license: CC-BY-SA-4.0
licenseUrl: https://creativecommons.org/licenses/by-sa/4.0/
modifiedFromSource: true
transformation: normalized into Culinary Recommender recipe schema
```

Any extra source-specific attribution notice must be retained in an additional field and surfaced with the public attribution.

## Explicit exclusions in Gate F

- images and other non-text media;
- source nutrition values as authoritative composition;
- pages with unresolved additional licensing/attribution notices;
- runtime API fetching from the public app;
- automatic acceptance of parser guesses;
- removal of ShareAlike/attribution metadata during deduplication or dish-family clustering.

## Audit conclusion

**PASS:** Wikibooks Cookbook can serve as the mandatory first external corpus under the roadmap using a bounded, static, revision-pinned, attributed CC BY-SA 4.0 text pipeline.

A later expansion may widen the snapshot only after the same page-level provenance and rejection controls remain green. Media/image reuse requires a separate rights review.
