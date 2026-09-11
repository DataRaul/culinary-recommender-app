# Nutrition B42 — reviewed USDA Foundation red-onion piece evidence

## Decision

**ADMIT_BOUNDED_DIRECT_PORTION_EVIDENCE.**

B42 promotes one household conversion that was already retained as evidence in the pinned USDA Foundation Foods 2026-04 extract but was deliberately not activated by the historical B3 tranche.

## Source

U.S. Department of Agriculture, Agricultural Research Service, FoodData Central Foundation Foods Version 15.0, release 2026-04-30.

Reviewed row:

- canonical ingredient: `red_onion`
- FDC ID: `790577`
- NDB number: `100252`
- description: `Onions, red, raw`
- source measure: `1 Onion`
- modifier: `Edible`
- gram weight: **197 g**
- data points: **30**

The source is the same pinned Foundation dataset already bundled by `src/data/usda-foundation-portions-v1.js`. B42 is therefore a later conversion-policy review, not a new data ingestion or a new composition source.

## Why the later review is admissible

B3 correctly kept non-banana household rows evidence-only while the repository had not yet established conservative piece-matching policy. Later B6 work established that a direct, size-unqualified source piece can support a size-unqualified authored `piece` when food identity and form are exact, while an explicitly qualified authored unit such as `small` must not be inferred from an unqualified source piece.

The B42 row satisfies that later rule:

- source identity is exact raw red onion;
- canonical identity is exact `red_onion`;
- source measure is one edible onion with no small/medium/large label;
- both authored uses are unqualified `piece` quantities;
- no competing size-labelled source row is being selected or averaged.

Natural produce-size variability is preserved by **medium confidence**. B42 does not authorize `small`, `large`, cups, spoons, generic onion, spring onion, shallot, or another allium.

## Composition separation

B42 is quantity-only. It does not alter USDA/Ciqual/Matvaretabellen composition selection and does not import any new nutrient values. Historical B3 conversion data remains frozen; the B42 decision is layered separately over the existing Foundation portion resolver.

## Authored scope

The full authored corpus contains exactly two `red_onion|piece` uses:

- `canarian_sardine_potato_bowl` — `0.5 piece` → **98.5 g**;
- `med_tuna_white_bean_salad` — `0.25 piece` → **49.25 g**.

B42 may clear only those red-onion quantity blockers. Whether either complete recipe becomes authoritative is determined by the integrated cumulative audit and all independent composition, quantity, field and semantic gates; B42 does not predeclare a recipe unlock.
