# Nutrition Evidence B48 + B49 — Fish Sauce

B48 and B49 resolve the sole authored canonical `fish_sauce` blocker while preserving the repository's composition-versus-portion evidence firewall.

## B48 — composition only

Source authority: Ministry of Education, Culture, Sports, Science and Technology (MEXT), Japan.

Dataset: **Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023**.

Reviewed food:

- food number: `17107`
- identity: **Nam pla (fish sauce)**
- source category: `SEASONINGS AND SPICES/Seasoning sauce/Nam pla (fish sauce)`
- source page: https://fooddb.mext.go.jp/details/details.pl?ITEM_NO=17_17107_7

Tracked values per 100 g:

- energy: **47 kcal**
- protein: **9.1 g**
- available carbohydrate by difference (`CHOAVLDF-`): **5.5 g**
- fat: **0.1 g**
- fibre: **0 g**

The source identity directly matches canonical `fish_sauce` for the authored Southeast Asian use. B48 authorizes composition only. It does not authorize a tablespoon or other household mass, density arithmetic, oyster sauce, soy sauce, fish stock, fermented fish paste, another fish seasoning, or any cooking/yield conversion.

MEXT available-carbohydrate semantics remain explicit as `AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF`; they are not silently treated as USDA total carbohydrate by difference.

## B49 — portion only

Source authority: U.S. Department of Agriculture, Agricultural Research Service.

Dataset: **USDA National Nutrient Database for Standard Reference, Release 28**.

Reviewed record:

- NDB: `06179`
- identity: **Sauce, fish, ready-to-serve**
- direct published measure: **1 tbsp = 18 g**
- source report: https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg06.pdf

B49 authorizes exactly canonical `fish_sauce|tbsp` at **18 g/tbsp**. It does not import SR28 nutrient composition, infer teaspoons/cups, perform generic tablespoon arithmetic, or authorize neighboring sauce identities.

## Authored scope and bounded effect

The authored corpus has one `fish_sauce` use:

- `se_asian_lime_chicken_rice_noodles`: `1 tbsp`

B48 supplies its composition and B49 independently supplies its direct tablespoon mass. The fish-sauce blocker is therefore cleared without coupling the two evidence roles.

Expected cumulative authored audit after B48+B49:

- recipes: **76**
- authoritative: **19**
- estimate-preserved: **57**
- `missing_density`: **60**
- `unsupported_quantity_unit`: **6**
- `ambiguous_portion_unit`: **20**
- fibre field gaps: **7**
- mixed incompatible carbohydrate-semantic events: **16**

`se_asian_lime_chicken_rice_noodles` remains estimate-preserved because its separate `lime|piece` quantity remains an explicit ambiguous-portion gate. B48+B49 do not weaken or bypass that gate.
