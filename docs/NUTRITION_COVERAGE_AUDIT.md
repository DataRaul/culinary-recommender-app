# Authoritative Nutrition Coverage Audit V1

Audit date: 2026-08-31  
Corpus: 76 project-authored recipes  
Policy: user-approved Canary Islands / Spain / Europe conditional European-primary nutrition evidence policy

## Purpose

Measure how much of the current recipe corpus can legitimately replace project-authored nutrition estimates with complete authoritative static calculations under the existing fail-closed evidence rules.

This audit is diagnostic. It does not relax evidence requirements, change recipe ranking or convert partial evidence into authoritative nutrition.

## Baseline result — PR #16 / V1.0.8

- recipes audited: **76**
- complete authoritative static recipe calculations: **0**
- recipes retaining project-authored estimates: **76**
- authoritative recipe ratio: **0.0000**
- missing-density blocker events: **356**
- unsupported-quantity-unit blocker events: **86**
- mixed incompatible carbohydrate-semantic events: **12**

The zero-complete result is not treated as a failure of the evidence architecture. It demonstrates that the architecture is correctly refusing false completeness. A recipe becomes authoritative only when every required ingredient has sufficient reviewed composition, every required quantity resolves to defensible mass, every tracked nutrient is present, and the selected nutrient semantics can form one coherent recipe total.

## Highest-frequency baseline density blockers

| Canonical ingredient | Blocker events |
|---|---:|
| onion | 29 |
| garlic | 26 |
| lemon | 25 |
| olive_oil | 19 |
| cumin | 18 |
| lime | 18 |
| tomato | 18 |
| smoked_paprika | 17 |
| bell_pepper | 16 |
| cabbage | 14 |
| parsley | 14 |
| chickpeas | 12 |
| spinach | 12 |
| soy_sauce | 11 |
| carrot | 8 |
| fresh_ginger | 7 |
| brown_rice | 6 |
| tofu_firm | 6 |

Some ingredients already had partial or source-specific evidence. A blocker count means the selected calculation lacked usable density at that recipe point; it does not mean the ingredient was absent from every source ledger.

## Quantity blockers

The calculator accepts direct `g` / `kg` mass and only explicitly reviewed household conversions. Current source-backed automatic household conversion remains deliberately narrow.

Frequent unsupported-unit cases include:

- onion, red onion and garlic expressed as pieces/cloves;
- eggs expressed as eggs rather than a sufficiently specified reviewed mass form;
- carrots, cucumber, aubergine, avocado and mango expressed as pieces/fractions;
- spring onion expressed as pieces;
- oils, sauces and spices expressed in household measures where no exact source-backed mass mapping has been approved.

The project must not solve these blockers with generic internet averages. Acceptable future routes are:

1. official source-backed household weights whose food form/size semantics match the recipe;
2. project-authored recipe quantities stated directly in grams where editorially appropriate;
3. another documented authoritative weight source with compatible reuse terms.

## Semantic blockers

The architecture treats USDA `1005` carbohydrate by difference and Ciqual `CHOAVL` available carbohydrate as incompatible semantics for summation. These are intentionally not added into one authoritative recipe carbohydrate total. Where a complete coherent reviewed USDA calculation exists, the approved policy may retain it as fallback; otherwise the recipe estimate remains primary.

## Nutrition B5 measured candidate result — V1.0.9

A bounded deterministic report was run on the integrated 22-record B5 branch in GitHub Actions run `33443162092` before the one-off audit workflow was removed.

Result:

- recipes audited: **76**
- complete authoritative static recipe calculations: **0**
- recipes retaining project-authored estimates: **76**
- authoritative recipe ratio: **0.0000**
- missing-density blocker events: **141**
- unsupported-quantity-unit blocker events: **202**
- mixed incompatible carbohydrate-semantic events: **16**
- newly authoritative recipe IDs: **none**

Relative to the PR #16 baseline, missing-density events fell by **215**. The rise in unsupported-quantity events from 86 to 202 is primarily a blocker reclassification, not a weakening or regression: once B5 supplies a reviewed composition density, the audit can expose the next fail-closed blocker at that recipe point, often an unsupported piece, spoon, clove or other household quantity. The semantic-event count also rises because more recipes now reach multi-source composition evaluation; incompatible carbohydrate definitions remain rejected rather than silently combined.

This is the intended coverage-driven interpretation of B5: composition breadth materially improves evidence reach while revealing that defensible quantity normalization is now the dominant route to complete-recipe coverage. B5 deliberately leaves **0 / 76** authoritative rather than manufacturing completeness.

The measured B5 snapshot is regression-tested in `tests/nutrition-coverage-audit.test.js`.

## Prioritization rule after B5

Future nutrition evidence expansion should be driven by expected recipe-level unlocks rather than database size. Priority order is now:

1. high-frequency quantity blockers with authoritative portion/weight evidence or editorially justified explicit gram quantities;
2. remaining high-frequency missing densities where the canonical form can be reviewed strongly;
3. ingredient/nutrient gaps that unlock complete recipes rather than merely adding isolated evidence;
4. semantic-coherence improvements without flattening distinct nutrient definitions.

A future gate must continue to report **recipes newly made authoritative**, not only foods newly mapped.

## Reproducibility

Run:

```bash
npm run report:nutrition-coverage
```

The report is generated by `src/domain/nutrition-coverage-audit.js` over `ALL_RECIPES` and `publicNutritionSource`. Output is deterministic and includes recipe-level blockers, source-selection state, methods and semantic issues.
