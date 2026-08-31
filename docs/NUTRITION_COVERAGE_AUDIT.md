# Authoritative Nutrition Coverage Audit V1

Audit date: 2026-08-31  
Corpus: 76 project-authored recipes  
Policy: user-approved Canary Islands / Spain / Europe conditional European-primary nutrition evidence policy

## Purpose

Measure how much of the recipe corpus can legitimately replace project-authored nutrition estimates with complete authoritative static calculations under the existing fail-closed evidence rules.

This audit is diagnostic. It does not relax evidence requirements, change recipe ranking or convert partial evidence into authoritative nutrition. The primary progress metric is **recipes newly made authoritative**, with blocker-event counts used to explain why coverage does or does not move.

## PR #16 / V1.0.8 baseline

- recipes audited: **76**
- complete authoritative static recipe calculations: **0**
- recipes retaining project-authored estimates: **76**
- authoritative recipe ratio: **0.0000**
- missing-density blocker events: **356**
- unsupported-quantity-unit blocker events: **86**
- mixed incompatible carbohydrate-semantic events: **12**

The zero-complete result is not an implementation failure. It demonstrates that the architecture correctly refuses false completeness. A recipe becomes authoritative only when every required ingredient has sufficient reviewed composition, every required quantity resolves to defensible mass, every tracked nutrient is present, and the selected nutrient semantics can form one coherent recipe total.

## Nutrition B5 / V1.0.9 measured result

B5 added 22 strictly reviewed ANSES-Ciqual 2025 composition records while preserving the frozen 32-record B4 tranche. The integrated B5 report remained fail-closed:

- recipes audited: **76**
- complete authoritative static recipe calculations: **0**
- recipes retaining project-authored estimates: **76**
- missing-density blocker events: **141**
- unsupported-quantity-unit blocker events: **202**
- mixed incompatible carbohydrate-semantic events: **16**
- newly authoritative recipe IDs: **none**

Relative to PR #16, missing-density events fell by **215**. The rise from 86 to 202 unsupported-quantity events was diagnostic reclassification: once B5 supplied composition, many recipe points advanced to the next truthful blocker rather than being guessed into grams.

B5 merged through PR #17 at `5689b0e40c6c4d9d7040b0ee25b7cc41d898b751`; post-merge validation and Pages deployment passed.

## Nutrition B6 / V1.0.10 measured candidate

B6 adds a bounded official portion-evidence lane from the Norwegian Food Safety Authority's **Norwegian Food Composition Table 2026**. The static subset is used under **NLOD 2.0** with attribution. No runtime fetch occurs and no Norwegian composition values are introduced by this gate.

Only 14 exact food/unit mappings are promoted after manual review:

| Canonical ingredient | Recipe unit | Reviewed mass | Source food |
|---|---|---:|---|
| lemon | piece(s) | 80 g | `06.550` Lemon, raw |
| garlic | clove(s) | 3 g | `06.038` Garlic, raw |
| olive_oil | tbsp | 10 g | `08.112` Oil, olive, Extra Virgin |
| tomato | piece(s) | 95 g | `06.754` Tomato, unspecified, raw |
| bell_pepper | piece(s) | 145 g | exact agreement across green/red/yellow-orange raw rows |
| soy_sauce | tbsp | 13 g | `10.126` Soy sauce |
| onion | piece(s) | 160 g | `06.042` Onion, Norwegian, raw |
| carrot | piece(s) | 80 g | `06.036` Carrot, Norwegian, raw |
| cucumber | piece(s) | 325 g | `06.010` Cucumber, Norwegian, raw |
| eggs | piece(s) | 55 g | `02.001` Egg, raw |
| spring_onion | piece(s) | 19 g | `06.113` Scallion, spring onion, raw |
| curry_powder | tsp | 3 g | `06.158` Curry powder |
| aubergine | piece(s) | 285 g | `06.015` Aubergine, raw |
| mango | piece(s) | 335 g | `06.542` Mango, raw |

B6 deliberately does **not** promote convenient conversions where semantics are unresolved:

- lime: source exposes conflicting 17 g and 65 g piece rows → `ambiguous_portion_unit`;
- avocado: source exposes 130 g small and 220 g large → `ambiguous_portion_unit` for bare piece;
- `onion|small`: source does not establish a small-onion weight;
- `sesame_oil|tsp`: source publishes tablespoon/decilitre, not teaspoon; no 1/3 spoon arithmetic is inferred;
- `red_onion|piece`: no exact acceptable reviewed Matvaretabellen row is promoted.

The integrated B6 audit in Actions run `33445671486` passed all 83 deterministic tests and measured:

- recipes audited: **76**
- complete authoritative static recipe calculations: **0**
- recipes retaining project-authored estimates: **76**
- authoritative recipe ratio: **0.0000**
- missing-density blocker events: **141**
- unsupported-quantity-unit blocker events: **27**
- explicitly ambiguous-portion blocker events: **20**
- mixed incompatible carbohydrate-semantic events: **16**
- newly authoritative recipe IDs: **none**

Relative to B5, B6 resolves or truthfully reclassifies **175 of 202** formerly unsupported quantity events while preserving 20 ambiguous events as explicit failures and leaving only 27 still unsupported. It still creates **0 / 76** authoritative recipes because composition and semantic blockers remain.

This is a legitimate coverage gain without a headline recipe-count gain: the evidence graph is substantially closer to full recipe calculation while remaining fail-closed.

## Current blocker interpretation

After B6, the dominant unresolved density families include high-frequency forms such as:

- cumin — 18;
- smoked_paprika — 17;
- tofu_firm — 6;
- lentils — 5;
- noodles — 4;
- red_lentils — 4;
- turkey_mince — 4;
- plus smaller gaps across grains, sauces, proteins, herbs and pantry ingredients.

Quantity work is now narrower and more semantic:

- 20 events are known ambiguous rather than unknown;
- 27 events remain genuinely unsupported;
- common examples include `onion|small`, `sesame_oil|tsp` and `red_onion|piece`.

A future gate should prioritize **recipe-level unlock paths**, not database size. A candidate ingredient is high value when resolving it completes or nearly completes one or more recipes under coherent nutrient semantics.

## Semantic blockers

The architecture treats USDA `1005` carbohydrate by difference and Ciqual `CHOAVL` available carbohydrate as incompatible semantics for summation. They are never added into one authoritative recipe carbohydrate total.

The B6 quantity gate does not alter this firewall. The measured count remains **16**. Where a complete coherent reviewed USDA calculation exists, the approved policy may retain it as fallback; otherwise the project-authored estimate remains primary.

## Standing quantity rules

The calculator accepts direct `g` / `kg` mass and only explicitly reviewed household conversions. Generic web averages, recipe-blog conversions, midpoint choices and unstated arithmetic transformations are prohibited merely to increase coverage.

Acceptable future routes remain:

1. official source-backed household weights matching exact canonical food/form/unit semantics;
2. project-authored recipe quantities rewritten into explicit grams where editorially appropriate and truthful;
3. another authoritative reusable portion-weight source with compatible licensing;
4. explicit ontology/recipe-form refinement when ambiguity is caused by insufficient canonical semantics.

## Reproducibility

Run:

```bash
npm run report:nutrition-coverage
```

The report is generated by `src/domain/nutrition-coverage-audit.js` over `ALL_RECIPES` and `publicNutritionSource`. Output is deterministic and includes recipe-level blockers, source-selection state, methods and semantic issues.
