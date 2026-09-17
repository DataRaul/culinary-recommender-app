# Step 8G — `cocina-mexicana` rights, measurement and v8008 prewrite

Status: `PASS_RIGHTS__PASS_V8007_MARGINAL_VALUE__PASS_V8008_PREWRITE__IMPLEMENTATION_EARNED__NO_LIVE_WRITE_AUTHORITY`

Pinned source repository: `AdamBouhmad/open-recipe-archive`

Pinned commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Collection: `cocina-mexicana` — 6,476 exact records.

## Evidence chain

- Source inventory workflow `35268075750`; artifact `10517174541`; artifact SHA-256 `4e1042e695043b06679e0a5e7cf5fbadbaab821d02b7072951386534da6da627`.
- Frozen inventory: `data/generated/step8g/cocina-mexicana-source-inventory.json`.
- v8007 marginal-value workflow `35268436563`; artifact `10517771007`; artifact ZIP SHA-256 `7d40c55e26f834090024f8045faceaf87541520722d564261dccec0858790b59`.
- Frozen measurement: `data/generated/step8g/cocina-mexicana-v8007-measurement.json`.
- v8008 prewrite workflow `35268881210`; job `105362867228`; artifact `10517207835`; artifact ZIP SHA-256 `c89d570403b7667208e5d0d9d0f74e049bee2bbb21a3b8f24368557fc3f48dca`.
- Frozen prewrite: `data/generated/step8g/cocina-mexicana-v8008-prewrite-evidence.json` and `data/generated/step8g/cocina-mexicana-v8008-prewrite-validation.json`.

## Exact source cohorts

### Mariano Galván Rivera, 1845

Cohort `ORA_GALVAN_RIVERA_1845_DICCIONARIO_COCINA_AE3BD2C` contains 4,347 records from *Diccionario de cocina, ó El nuevo cocinero mexicano*, source URL `https://archive.org/details/bub_gb_NdQqAAAAYAAJ`.

Independent bibliographic evidence identifies Mariano Galván Rivera as 1782–1876 and identifies the 1845 edition. Google Books exposes an 1845 full-view copy. Spain's transitional copyright rule preserves the older term for authors who died before 7 December 1987; the 1879 Act provided life plus eighty years, so the exploitation term expired decades ago. ORA marks the cohort `public-domain`, and the pinned ORA repository layer is Unlicensed.

Rights marker: `PASS_RIGHTS_VERIFIED_BOUNDED_GALVAN_RIVERA_1845_DICCIONARIO_COCINA`.

Against active protected `v8007` / 3,695, all rights, exact-count, metadata, repository-reuse, attribution, single-source, structural-quality and culinary-coverage gates passed. The cohort is 100% structurally parseable, has 4,228 distinct normalized titles, zero exact baseline title overlaps and 10,308 distinct ingredient phrases.

### *La cocinera poblana*, 1890 — author not identified

Cohort `ORA_COCINERA_POBLANA_1890_ANONYMOUS_AE3BD2C` contains 2,129 records, source URL `https://archive.org/details/lacocinerapobla00unkngoog`.

The blank author field is intentional, not missing evidence. Open Library independently catalogues the 1890 edition as `[author not identified]`; Real Academia de Gastronomía records the nineteenth-century editions and the corrected/enlarged 1890 fourth edition. Spain's consolidated Intellectual Property Act provides a publication-based term for anonymous works; the 1890 publication is far beyond that term. ORA marks the cohort `public-domain`, and the pinned ORA repository layer is Unlicensed.

Rights marker: `PASS_RIGHTS_VERIFIED_BOUNDED_COCINERA_POBLANA_1890_ANONYMOUS`.

Against active protected `v8007` / 3,695, all source-specific rights, exact-count, metadata, repository-reuse, attribution, single-source, structural-quality and culinary-coverage gates passed. The cohort is 100% structurally parseable, has 1,963 distinct normalized titles, zero exact baseline title overlaps and 4,545 distinct ingredient phrases.

## Attribution/disclosure classification

Attribution/disclosure state: `CLASSIFIED_READY_FOR_PRIVATE_CORPUS__UI_DISPLAY_STILL_DOWNSTREAM_TEST_REQUIRED`.

If these records later become user-visible, preserve historical source title, identified author or `author not identified`, source year, stable source reference, ORA provenance/pinned revision or equivalent audit reference, and reuse classification (`public-domain` historical work + Unlicense repository layer). Do not treat private storage as a rights basis.

## v8008 prewrite result

Terminal: `STEP_8G_COCINA_MEXICANA_V8008_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED`.

The exact two-source 6,476-record layer composes over active `v8007` / 3,695 to provisional `v8008` / **10,171** protected recipes while preserving all existing technical firewalls:

- exactly 2 recipe-body shards;
- 649 body batches, maximum 10 rows each;
- maximum individual body 8,884 bytes;
- maximum batch body bytes 42,779;
- maximum measured write request 18,032 bytes vs 262,144-byte cap;
- cumulative layered physical body bytes 39,021,497;
- shard 0 projected total: 5,109 rows / 19,710,678 body bytes;
- shard 1 projected total: 5,062 rows / 19,310,819 body bytes;
- both shard and total storage budgets pass;
- maximum planned D1 subqueries remains exactly 16/16, with fresh route write the limiting operation;
- no D1 headroom is assumed;
- deterministic IDs, body-size, batch-size, topology, request-size, count and capacity gates all pass.

Frozen hashes include parent fingerprint `0f2c41cef744badf98033a5016cfad15b3f28b9e57cccfdeb98c1957f82b526b`, child descriptor universe `4fffaae4e19a377b5aff1cde46883eec3d6c79081ddd719ad33e5109eae21547`, v8008 manifest `beaddc9251cef158732e3a737593629af83e93a1dd237eabbae1775678d34fcb`, and population plan `d0fa90fa966fec3c7c5c64f57baefa0bce15432328f86a3d439631fa2e5c7460`.

## Authority earned and not earned

This chain earns **technical implementation of the v8008 protected runtime and owner runner** on the existing two-shard / 16-query / no-billing architecture.

It does **not** authorize production D1 population. The eventual live write remains a separate owner-authenticated human gate after implementation, CI and deployment independently pass.

It also does not authorize broader public runtime/recommendation admission, a third shard, D1 budget expansion, billing, Nutrition, YT-CUL, Knowledge Core writes, Recipe Family work, or cultural-authenticity/nutrition/allergen/dietary/scaling authority.
