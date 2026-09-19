# Step 8G — Česká kuchařka 1883 provenance hold

Date: 2026-09-19

Status: `HOLD_SOURCE_PROVENANCE_FAIL_CLOSED__NO_MEASUREMENT__NO_PREWRITE`

## Candidate from fresh v8009 discovery

Fresh source-level discovery against active protected `v8009` / 10,923 ranked this source first:

- Collection: `ceska-kuchyne`
- ORA source title: *Česká kuchařka*
- ORA source author: `Marie Dumková`
- ORA source year: 1883
- Exact source URL: `https://archive.org/details/ceska_kucharka-dumkova`
- ORA licence marker: `public-domain`
- Candidate records: 1,876
- Parseable ratio: 1.0
- Distinct normalized titles: 1,781
- Novel normalized titles against v8009: 1,780
- Exact v8009 title overlaps: 1
- Novel title ratio: 0.9994385176866929
- Novel ingredient phrases: 3,688

Discovery is a structural/marginal-value screen only. It does not clear rights.

## Provenance conflict

The exact source identity fails the source-specific provenance gate.

The pinned ORA rows assign *Česká kuchařka* (1883), Internet Archive item `ceska_kucharka-dumkova`, to `Marie Dumková`.

Independent evidence for the exact work does not support that attribution:

1. The National Library of the Czech Republic's Kramerius record for the exact 1883 monograph identifies **Hanna Dumková** as author, Alois Hynek as publisher, Prague as publication place, and [1883] as the date:
   `https://kramerius.nkp.cz/kramerius/MShowMonograph.do?id=17692`

2. Czech Wikisource's author authority page identifies **Hana (Hanna) Dumková**, 1847–1920, as a Czech cookbook writer and lists *Česká kuchařka* (1883) among her works with the National Library copy:
   `https://cs.wikisource.org/wiki/Autor:Hana_Dumkov%C3%A1`

3. Czech Copyright Act No. 121/2000 §27 provides the ordinary author-life-plus-70-years economic-rights term, and §28 addresses free use after expiry:
   `https://e-sbirka.gov.cz/sb/2000/121`

The 1920 death date means the work appears old enough to be outside the ordinary Czech economic-rights term. That does **not** repair the current packet's wrong or unresolved author identity, which remains material to exact provenance and attribution.

## Disposition

Terminal:

`STEP_8G_HOLD_CESKA_KUCHARKA_1883_PROVENANCE_AUTHOR_MISMATCH`

The complete 1,876-record source cohort is held fail-closed.

No source-specific rights clearance is earned from the current packet. The ORA `public-domain` marker and apparent copyright-term expiry are not sufficient to override the provenance conflict, and private D1 storage would not create reuse permission.

## Re-entry requirements

The source may be reconsidered only if all of the following are completed:

1. correct/reconcile the exact author identity for the ORA source key;
2. establish a source-specific rights/reuse basis using corrected provenance;
3. classify attribution/disclosure requirements against the corrected identity;
4. only then run bounded marginal-value measurement against the then-current protected corpus;
5. earn a separate prewrite before any protected population.

## Continuation

The exact source key is added to the source-specific hold set with reason `SOURCE_RIGHTS_OR_PROVENANCE_HOLD`. It is not mislabeled as already protected.

The next source candidate is selected by rerunning the pinned v8009 discovery with both the Magyar 1901 and Česká kuchařka 1883 holds active. No live D1 write, public runtime change, recommendation admission, billing expansion, third shard, Nutrition, YT-CUL or Knowledge Core mutation is authorized by this hold.

Machine-readable hold evidence: `data/generated/step8g/ceska-kucharka-1883-provenance-hold.json`.
