# Authoritative Nutrition Coverage Audit V1

Audit date: 2026-09-01  
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

## Nutrition B6 / V1.0.10 measured result

B6 added a bounded official portion-evidence lane from the Norwegian Food Safety Authority's **Norwegian Food Composition Table 2026**. The static subset is used under **NLOD 2.0** with attribution. No runtime fetch occurs and no Norwegian composition values were introduced by this gate.

Only 14 exact food/unit mappings were promoted after manual review:

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

B6 deliberately did **not** promote convenient conversions where semantics were unresolved:

- lime: source exposes conflicting 17 g and 65 g piece rows → `ambiguous_portion_unit`;
- avocado: source exposes 130 g small and 220 g large → `ambiguous_portion_unit` for bare piece;
- `onion|small`: source did not establish a small-onion weight;
- `sesame_oil|tsp`: source publishes tablespoon/decilitre, not teaspoon; no 1/3 spoon arithmetic is inferred;
- `red_onion|piece`: no exact acceptable reviewed Matvaretabellen row was promoted.

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

Relative to B5, B6 resolved or truthfully reclassified **175 of 202** formerly unsupported quantity events while preserving 20 ambiguous events as explicit failures and leaving only 27 still unsupported.

## Nutrition B7 / V1.1.1 measured result

B7 returned to recipe-unlock-oriented composition review. It admitted only three reviewed ANSES-Ciqual 2025 records: raw quinoa, raw shrimp/prawn and dry regular pasta as a bounded category-level match for orzo/risoni.

The authored 76-recipe audit measured:

- complete authoritative static recipe calculations: **0**
- recipes retaining project-authored estimates: **76**
- missing-density blocker events: **133**
- unsupported-quantity-unit blocker events: **27**
- explicitly ambiguous-portion blocker events: **20**
- mixed incompatible carbohydrate-semantic events: **16**
- missing tracked-field events: carbohydrate **28**, energy **5**, fat **65**, fibre **36**

The missing-density count fell **141 → 133**. B7 also made missing tracked fields independently visible so a composition record with an unpublished nutrient cannot be mistaken for a quantity/density failure.

## Nutrition B8 / recipe-unlock evidence measured candidate

B8 prioritizes recipe completion over database size. The decisive new evidence is a **portion-only** USDA FoodData Central **SR Legacy final release (2018-04)** row for raw onion:

- food: `Onions, raw`
- FDC ID: `170000`
- NDB number: `11282`
- exact portion row: `85862`
- source modifier: `small`
- amount: `1`
- reviewed mass: **70 g**
- reuse state: static public-domain / CC0-compatible U.S. government evidence

This row is used only for canonical `onion` with recipe unit `small`. It does **not** replace B6's ordinary onion `piece = 160 g`, does not apply to red onion, and does not infer any diameter or other size class. SR Legacy composition is explicitly outside this B8 tranche.

Candidate validation run `33494074325` passed **104 / 104** deterministic tests and measured:

- recipes audited: **76**
- complete authoritative static recipe calculations: **1**
- recipes retaining project-authored estimates: **75**
- authoritative recipe ratio: **0.0132**
- newly authoritative recipe ID: **`indian_chicken_spinach_curry`**
- missing-density blocker events: **133**
- unsupported-quantity-unit blocker events: **7**
- explicitly ambiguous-portion blocker events: **20**
- mixed incompatible carbohydrate-semantic events: **16**
- missing tracked-field events: carbohydrate **28**, energy **5**, fat **65**, fibre **36**

The exact small-onion row therefore reduces unsupported quantity blockers **27 → 7** and earns the first authoritative authored recipe without changing composition-source selection or weakening any semantic firewall.

### B8 Foundation review decisions

B8 also exactly extracted the highest-priority candidates from FoodData Central Foundation Foods 2026-04. They are deliberately **not** promoted merely because a source row exists:

- `lentils` → FDC `2644283`, `Lentils, dry`: strong exact dry-form candidate, but tracked fibre is unpublished; runtime promotion is deferred because it would currently reclassify blockers rather than complete a recipe.
- `turkey_mince` → FDC `2514747`, `Turkey, ground, 93% lean/ 7% fat, raw`: raw ground form is useful but the 93/7 fat level is more specific than the canonical ingredient and tracked fibre is unpublished; deferred rather than called exact generic turkey mince.
- `cottage_cheese` → FDC `2346384`, full-fat large/small curd: fat-level-qualified and missing tracked fibre; deferred.
- `tahini` → FDC `2262073`, `Sesame butter, creamy`: complete tracked fields, but identity equivalence to canonical tahini remains insufficiently strict for this recipe-unlock tranche; deferred.
- `salt` → FDC `746775`, iodized table salt: the exact extraction publishes energy but leaves tracked protein/carbohydrate/fat/fibre unpublished; rejected for complete composition rather than hardcoding assumed zeros.
- passata candidate `Tomatoes, crushed, canned` remains rejected as the wrong form.
- prepared frozen edamame remains deferred because authored preparation state is not exact.
- no Foundation 2026-04 candidate was found for exact smoked paprika, lemon replacement or dry basmati rice. These remain unresolved under the current composition policy.

The machine-readable review ledger is `scripts/usda-foundation-b8-reviewed-decisions.json`.

## Current blocker interpretation

After the exact B8 onion unlock, quantity uncertainty is much narrower:

- 20 events remain explicitly ambiguous rather than guessed;
- only 7 events remain genuinely unsupported;
- generic Matvaretabellen onion `piece` remains distinct from SR Legacy onion `small`.

The dominant remaining recipe-unlock opportunities are now composition/form and tracked-field problems. Exact smoked paprika is especially high leverage, but generic paprika is not an admissible substitute. Lemon/olive-oil field gaps and the existing carbohydrate-semantic firewall also remain important.

A new composition-source class is not introduced merely to remove a blocker. In particular, B8 does not silently turn the already-approved Matvaretabellen **portion** lane into a composition lane.

## Semantic blockers

The architecture treats USDA `1005` carbohydrate by difference and Ciqual `CHOAVL` available carbohydrate as incompatible semantics for summation. They are never added into one authoritative recipe carbohydrate total.

B8 does not alter this firewall. The measured count remains **16**. Where a complete coherent reviewed USDA calculation exists, the approved policy may retain it as fallback; otherwise the project-authored estimate remains primary.

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

The report is generated by `src/domain/nutrition-coverage-audit.js` over the selected recipe set and `publicNutritionSource`. Output is deterministic and includes recipe-level blockers, tracked nutrient-field gaps, source-selection state, methods and semantic issues. The authored progress denominator remains **76**, independent of the eight separately admitted Gate F RecipeSource records.
