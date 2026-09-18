# Step 8G — magyar-konyha 1901 provenance hold

Date: 2026-09-18

Status: `HOLD_SOURCE_PROVENANCE_FAIL_CLOSED__NO_MEASUREMENT__NO_PREWRITE`

## Candidate from fresh v8008 discovery

Fresh source-level discovery against active protected `v8008` / 10,171 ranked this source first:

- Collection: `magyar-konyha`
- ORA source title: *Képes budapesti szakácskönyv*
- ORA source author: `Rézi néni`
- ORA source year: 1901
- Exact source URL: `https://archive.org/details/b28112982`
- ORA licence marker: `public-domain`
- Candidate records: 1,240
- Parseable ratio: 1.0
- Distinct normalized titles: 1,204
- Novel title ratio against v8008: 1.0

Discovery is a structural/marginal-value screen only. It does not clear rights.

## Provenance conflict

The exact source identity fails the source-specific provenance gate.

The pinned ORA rows assign *Képes budapesti szakácskönyv* (1901), Internet Archive item `b28112982`, to `Rézi néni`.

Independent bibliography for that exact item does not support that attribution:

1. Open Library maps Internet Archive item `b28112982` to the 1901 seventh edition of *Képes budapesti szakácskönyv* and catalogues it under Antónia Zemplényi Szabó and Josefa Sz. Hilaire:
   `https://openlibrary.org/works/OL24893799W/K%C3%A9pes_budapesti_szak%C3%A1csk%C3%B6nyv`

2. A detailed 1901 bibliographic listing identifies Sz. Hilaire Josefa, Kovács Irma, Dorn Anna, Gombos Erzsi, Moesz Gézáné, özvegy Gyöngyössy Sámuelné and Zemplényi Szabó Antalné as underlying contributors, with Zemplényi Szabó Antónia as editor. The same listing identifies that editor name as the pseudonym used by Zempléni Szabó Antal:
   `https://www.antikvarium.hu/aukcio/index.php?aid=13275&bid=912510&t=cd`

3. The Hungarian Electronic Library identifies Rézi Néni as Doleskó Teréz in connection with *Szegedi szakácskönyv*, a different cookbook:
   `https://mek.oszk.hu/14200/14263/fulszoveg.html`

This is therefore not a harmless spelling difference. The current ORA author field appears to conflate the exact 1901 source with a different Hungarian cookbook author/work lineage.

## Disposition

Terminal:

`STEP_8G_HOLD_MAGYAR_KONYHA_1901_PROVENANCE_AUTHOR_MISMATCH`

The complete 1,240-record source cohort is held fail-closed.

No source-specific rights clearance is earned from the current packet. The repository's `public-domain` marker is not sufficient to override the provenance conflict, and private D1 storage would not create reuse permission.

This hold intentionally does **not** claim that the historical 1901 work is still copyrighted. The narrower controlling finding is that the exact source/editor/contributor provenance needed for this project's rights and attribution machinery is not currently reliable enough to admit the cohort.

## Re-entry requirements

The source may be reconsidered only if all of the following are completed:

1. correct the exact work/editor/contributor identity for Internet Archive item `b28112982`;
2. establish a source-specific rights/reuse basis using that corrected provenance;
3. classify attribution/disclosure requirements against the corrected identity;
4. only then run bounded marginal-value measurement against the then-current protected corpus;
5. earn a separate prewrite before any protected population.

## Continuation

The ORA discovery contract now supports source-specific holds. This exact source key is excluded with reason `SOURCE_RIGHTS_OR_PROVENANCE_HOLD`; it is not mislabeled as already protected.

The next source candidate must be selected by rerunning the pinned v8008 discovery with this hold active. No live D1 write, public runtime change, recommendation admission, billing expansion, third shard, Nutrition, YT-CUL or Knowledge Core mutation is authorized by this hold.

Machine-readable hold evidence: `data/generated/step8g/magyar-konyha-1901-provenance-hold.json`.
