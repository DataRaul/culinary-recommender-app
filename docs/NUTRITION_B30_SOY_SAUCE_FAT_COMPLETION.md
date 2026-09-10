# Nutrition B30 — exact soy-sauce fat completion

## Scope

B30 adds one bounded static tracked-field completion from the official Norwegian Food Composition Table 2026 for canonical `soy_sauce`. It is not a new full-source replacement: the already-reviewed Ciqual B5 soy-sauce record remains primary for every populated tracked field, while Matvaretabellen may fill only the missing `fatG` field.

No new household-unit conversion, product-variant inference, edible-part conversion, cooked-yield factor or runtime source fetch is introduced.

## Reviewed identity

- Canonical ingredient: `soy_sauce`
- Existing Ciqual B5 identity: **Soy sauce, prepacked**, alim code `11104`
- Completion source: **Soy sauce**, Matvaretabellen Food ID `10.126`
- Scientific name: **Glycine max (L.) Merr.**
- FoodEx2: **Soy sauce (A044R)**
- Source form: fermented liquid soy condiment containing wheat, with water and salt added
- Match confidence: **high**

The same Matvaretabellen food already underpins the separately reviewed B6 tablespoon portion evidence, but B30 remains composition-only and does not inherit or create quantity authority.

B30 does not generalize to sweet soy sauce, tamari, gluten-free soy sauce, soybean paste or miso.

## Field-completion rule

Ciqual B5 already provides reviewed values for energy, protein, available carbohydrate and fibre, but its fat field is null. B30 therefore makes only this field eligible for completion:

| Nutrient | Runtime source | Value per 100 g | Source code | Role |
| --- | --- | ---: | --- | --- |
| Energy | Ciqual B5 | 39.9 kcal | existing Ciqual evidence | unchanged primary |
| Protein | Ciqual B5 | 7.25 g | existing Ciqual evidence | unchanged primary |
| Available carbohydrate | Ciqual B5 | 1.72 g | existing Ciqual evidence | unchanged primary |
| Fat | Matvaretabellen B30 | 0.0 g | `60a` | exact missing-field completion |
| Dietary fibre | Ciqual B5 | 0.9 g | existing Ciqual evidence | unchanged primary |

Matvaretabellen publishes fat as 0 g with code `60a`, indicating an analysed value below the limit of detection or quantification that is represented as zero. B30 preserves that source meaning rather than inventing a project-authored zero.

The runtime completion guard rejects any attempt to use B30 where a reviewed baseline value already exists.

## Authored impact contract

The authored corpus currently contains 11 soy-sauce uses. Existing B6 evidence already resolves their tablespoon quantities. Before B30, each otherwise-used soy-sauce record carries a missing `fatG` field from Ciqual B5.

Expected cumulative authored audit after B30:

- authoritative recipes: **17 / 76**
- estimate-preserved recipes: **59 / 76**
- `missing_density`: **77**
- `unsupported_quantity_unit`: **9**
- `ambiguous_portion_unit`: **20**
- missing `fatG` field events: **18 → 7**
- missing carbohydrate fields: **5**
- missing energy fields: **5**
- missing fibre fields: **7**
- mixed incompatible carbohydrate-semantic events: **16**

B30 is therefore a high-leverage field-completeness tranche but is not expected by itself to unlock an additional authored recipe. Remaining soy-sauce recipes still preserve independent density, quantity, form or semantic blockers where present.

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/soy-sauce/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
