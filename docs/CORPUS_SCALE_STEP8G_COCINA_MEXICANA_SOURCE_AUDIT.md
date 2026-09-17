# Step 8G — `cocina-mexicana` source rights and provenance audit

Status: `PASS_RIGHTS_AND_V8007_MARGINAL_VALUE__PREWRITE_CAPACITY_MEASUREMENT_ONLY__NO_INGESTION_AUTHORITY`

Pinned source repository: `AdamBouhmad/open-recipe-archive`

Pinned commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Collection: `cocina-mexicana`

Pinned collection count: 6,476 records.

Inventory workflow: `35268075750`

Inventory artifact: `10517174541`

Inventory artifact SHA-256: `4e1042e695043b06679e0a5e7cf5fbadbaab821d02b7072951386534da6da627`

Measurement workflow: `35268436563`

Measurement artifact: `10517771007`

Measurement artifact ZIP SHA-256: `7d40c55e26f834090024f8045faceaf87541520722d564261dccec0858790b59`

Frozen measurement evidence: `data/generated/step8g/cocina-mexicana-v8007-measurement.json`

## Exact pinned source groups

### A — Mariano Galván Rivera, 1845

- Cohort ID: `ORA_GALVAN_RIVERA_1845_DICCIONARIO_COCINA_AE3BD2C`
- Title: *Diccionario de cocina, ó El nuevo cocinero mexicano*
- Author: Mariano Galván Rivera
- Source year: 1845
- Pinned source URL: `https://archive.org/details/bub_gb_NdQqAAAAYAAJ`
- Exact pinned records: 4,347
- Parseable ratio: 1.0
- ORA metadata: `public-domain`

Independent bibliographic evidence identifies Galván Rivera as 1782–1876 and identifies the 1845 edition. Google Books exposes an 1845 full-view copy. Under Spain's current consolidated Intellectual Property Act, the transitional rule preserves the older term for authors who died before 7 December 1987; the 1879 Act provided life plus eighty years. On the independently recorded 1876 death date, that exploitation term expired decades ago.

Rights marker: `PASS_RIGHTS_VERIFIED_BOUNDED_GALVAN_RIVERA_1845_DICCIONARIO_COCINA`

Measurement result: PASS against active protected `v8007` / 3,695. All rights, exact-count, metadata, repository-reuse, attribution, single-source, structural-quality and culinary-coverage gates passed. The 4,347 records yielded 4,228 distinct normalized titles, zero exact baseline title overlaps, and 10,308 distinct ingredient phrases.

### B — *La cocinera poblana*, 1890, author not identified

- Cohort ID: `ORA_COCINERA_POBLANA_1890_ANONYMOUS_AE3BD2C`
- Title: *La cocinera poblana*
- Author field in pinned ORA rows: empty
- Source year: 1890
- Pinned source URL: `https://archive.org/details/lacocinerapobla00unkngoog`
- Exact pinned records: 2,129
- Parseable ratio: 1.0
- ORA metadata: `public-domain`

The blank author is not treated as missing evidence. Open Library independently catalogues the 1890 edition as `[author not identified]`, provides the matching Internet Archive lineage, and exposes download/read options. Real Academia de Gastronomía independently records the work's nineteenth-century editions and the corrected/enlarged 1890 fourth edition. Spain's consolidated Intellectual Property Act provides a publication-based term for anonymous works; the 1890 lawful publication is far beyond that term.

Rights marker: `PASS_RIGHTS_VERIFIED_BOUNDED_COCINERA_POBLANA_1890_ANONYMOUS`

Measurement result: PASS against active protected `v8007` / 3,695. All source-specific rights, exact-count, metadata, repository-reuse, attribution, single-source, structural-quality and culinary-coverage gates passed. The 2,129 records yielded 1,963 distinct normalized titles, zero exact baseline title overlaps, and 4,545 distinct ingredient phrases.

## Repository-layer permission

The historical-work public-domain analysis above is separate from permission for the ORA repository's transformed/structured recipe text. The pinned ORA repository is distributed under the Unlicense, which grants unrestricted reuse of that repository layer. Private runtime does not create or substitute for either rights basis.

## Attribution and disclosure classification

Neither cohort should be treated as attribution-free product data merely because exploitation copyright is expired or the repository layer is Unlicensed. The Culinary legal-corpus policy requires provenance presentation, and the known-author cohort should preserve author/source identity conservatively. The anonymous cohort should display `author not identified` rather than invent an author.

Required product provenance fields when these records eventually become user-visible:

- historical source title;
- historical author when identified, otherwise `author not identified`;
- source year;
- source URL or stable source reference;
- ORA repository/source provenance and pinned revision or equivalent audit reference;
- rights/reuse classification (`public-domain` historical work + Unlicense repository layer).

Attribution/disclosure state: `CLASSIFIED_READY_FOR_PRIVATE_CORPUS__UI_DISPLAY_STILL_DOWNSTREAM_TEST_REQUIRED`.

## What this PASS earns

The two independently rights-cleared source cohorts also passed bounded marginal-value measurement against active protected `v8007`. Together, 6,476 recipes therefore earn **source-specific prewrite/capacity measurement only**.

The next gate must prove deterministic IDs, body/route hashes and sizes, two-shard distribution, batch/request bounds, storage/cost headroom, rollback/composition feasibility, and the inherited 16-subquery request ceiling before any implementation or production-write authority can be earned.

This PASS does **not** authorize D1 mutation, protected population, public activation, recommendation admission, third-shard creation, billing, Nutrition, YT-CUL, Knowledge Core writes, or cultural-authenticity claims. If one source cohort later fails capacity/prewrite, it must be held independently rather than weakening the gate for the other.

## Authority boundaries

No live D1 writes, public-runtime changes, recommendation admission, third shard, billing expansion, Nutrition mutation, YT-CUL mutation, Knowledge Core mutation, or cultural-authenticity authority are granted by this audit.
