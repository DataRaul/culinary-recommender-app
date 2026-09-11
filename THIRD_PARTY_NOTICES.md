# Third-Party Notices

## English Wikibooks Cookbook text

Gate F may bundle a bounded set of recipe text adapted from the English Wikibooks Cookbook.

- Source project: English Wikibooks Cookbook
- Source index: https://en.wikibooks.org/wiki/Category:Recipes
- Copyright/reuse policy: https://en.wikibooks.org/wiki/Wikibooks:Copyrights
- Licence chosen for downstream reuse: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- Licence: https://creativecommons.org/licenses/by-sa/4.0/
- Attribution: Wikibooks contributors; each admitted record preserves a direct source-page and exact-revision link so the corresponding contributor history remains available.
- Modification notice: imported records are transformed from Wikibooks text into the Culinary Recommender recipe schema. The transformed Wikibooks-derived text remains CC BY-SA 4.0.

This notice applies only to the bundled/adapted Wikibooks-derived content identified by its per-record provenance. It does not grant a licence to unrelated project-authored application code, project-authored recipes, or other repository content.

Gate F does not bundle Wikibooks/Commons images or other non-text media. Those assets can use different licences and require separate review.

## ForkRecipe recipe content — Step 7E protected pilot

Step 7E bundles a deterministic 500-record protected pilot selected from the pinned ForkRecipe recipe-content repository.

- Source project: ForkRecipe recipes
- Source repository: https://github.com/futurechef/forkrecipe-recipes
- Pinned source commit: `c32255266af39bd77444d39452f3df8088ac8fd9`
- Licence declared by the source repository for recipe content: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- Licence: https://creativecommons.org/licenses/by-sa/4.0/
- Attribution: ForkRecipe and the individual record author retained in each protected source packet; each packet also retains an immutable pinned-file source URL.
- Modification notice: source records are wrapped in a Culinary Recommender provenance/rights envelope and compressed into bounded protected-pilot chunks. The ForkRecipe-derived recipe content remains subject to CC BY-SA 4.0.

This Step 7E notice applies only to the ForkRecipe-derived fields retained in the per-record protected source packets. It does not grant a licence to unrelated project code or project-authored content.

Step 7E excludes source media, imports no source nutrition values as NutritionSource authority, derives no dietary/allergen safety claims from source prose or tags, and does not make ForkRecipe pilot records publicly recommendation-eligible. The bundled pilot is served only through the existing authenticated/fail-closed private canary architecture while the Step 7E gate is being evaluated.

## Norwegian Food Composition Table data

Bounded nutrition evidence may include static values derived from the Norwegian Food Composition Table published by the Norwegian Food Safety Authority (Mattilsynet).

- Source: Norwegian Food Composition Table 2026
- Website: https://www.matvaretabellen.no/
- Licence: Norwegian Licence for Open Government Data (NLOD) 2.0
- Attribution: Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no
- Reuse boundary: only explicitly reviewed source rows and fields identified by project provenance are bundled. The application does not fetch Matvaretabellen at runtime and does not infer unreviewed food identities, portions or conversions from nearby records.

B6, B15 and B17 are separate bounded portion-evidence roles. B9, B11, B14, B16, B18, B19, B20, B22, B23, B24, B25, B26, B27, B28, B29, B31, B32, B35, B36, B43 and B44 are standalone reviewed composition roles. B10, B12, B13, B21, B30 and B34 are exact tracked-field completion roles where existing reviewed composition has no value. Composition evidence never implies portion evidence, portion evidence never implies composition evidence, and admission in any one tranche does not silently authorize another role or food identity. B24 additionally preserves the source record's narrower goat-milk qualifier for feta rather than generalizing it into a universal feta or neighboring-cheese claim. B25 similarly preserves the source record's pearled FoodEx2 qualifier for uncooked barley and does not generalize the value to cooked barley or every barley variety/form. B26 is restricted to dried/uncooked rice noodles and does not authorize cooked rice-noodle composition, cooked-yield conversion or neighboring wheat-noodle identities. B27 is restricted to uncooked jasmine rice and does not authorize cooked jasmine rice, generic rice, basmati rice or another named rice identity. B28 preserves the narrower finely ground table-salt source identity and does not generalize it into mineral, herbal, iodized, sea-salt or neighboring-seasoning identities; it adds composition only and authorizes no household-unit conversion. B29 is restricted to the canonical wheat/flour tortilla-wrap identity and does not authorize corn tortillas, neighboring flatbreads or a tortilla-piece weight. B30 fills only the missing fat field of the already-reviewed generic soy-sauce identity, does not displace populated Ciqual fields, and does not authorize sweetened, tamari, gluten-free or neighboring fermented-soy identities. B31 preserves the source record's narrower cow-whey qualifier for ricotta at medium confidence and does not generalize that composition to sheep-, goat- or mixed-milk ricotta or neighboring fresh cheeses. B32 is restricted to exact black pepper (`Piper nigrum L.`) composition and deliberately excludes white pepper and other pepper products; it adds no teaspoon or other household-unit mass authority. B34 fills only the previously missing energy/carbohydrate/fat fields for exact raw spring onion and the missing fat field for exact raw peeled/pitted mango; populated USDA/Ciqual fields and the separately governed B6 piece conversions remain unchanged. B35 is restricted to exact generic miso-paste composition and does not authorize a tablespoon mass, another household-unit conversion, a named miso subtype or neighboring fermented-soy foods. B36 preserves the source row's narrower smooth, oil-added peanut-butter form at medium confidence and does not generalize it to every peanut-butter formulation or authorize any household-unit mass. B43 is restricted to exact raw kale leaf composition and does not authorize frozen, steamed or otherwise cooked kale, the source edible-part percentage, or any household-unit/yield conversion. B44 is restricted to exact plain dried uncooked durum-wheat pasta and does not authorize fresh, whole-grain, filled, gluten-free or cooked pasta, cooking yield, or household-unit conversion.

## USDA Standard Reference data

B37, B40 and B41 bundle separate bounded household-portion records derived from the official USDA National Nutrient Database for Standard Reference, Release 28 reports.

- Source authority: U.S. Department of Agriculture, Agricultural Research Service
- Dataset: USDA National Nutrient Database for Standard Reference, Release 28
- Official archive/version page: https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/methods-and-application-of-food-composition-laboratory/mafcl-site-pages/sr11-sr28/
- Current USDA successor/licensing statement: FoodData Central data are public-domain data published under CC0 1.0 Universal; attribution to USDA is requested.
- Reuse boundary: only explicitly reviewed household measures are bundled; SR28 composition is not imported by these tranches.

B37 uses Food Group 16 report https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg16.pdf . Four reviewed peanut-butter variants—chunk/smooth crossed with with/without salt—each publish 32 g for 2 tbsp, so B37 admits exactly 16 g per canonical `peanut_butter` tablespoon. It does not authorize teaspoon or cup conversion, neighboring nut or seed butters, peanuts, peanut sauce, or any SR28 composition value. The independent B36 Matvaretabellen composition evidence remains governed by its own source and carbohydrate-semantic contract.

B40 uses Food Group 02 report https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg02.pdf . NDB `02047`, **Salt, table**, directly publishes Measure 1 = **6.0 g: 1 tsp**. B40 admits only canonical `salt|tsp` at 6 g/tsp and preserves medium confidence because the repository identity is broader than the source's table-salt form. It does not authorize sea/mineral/herbal/smoked salt, tablespoon or cup conversion, generic spoon arithmetic, or any SR28 composition value. The independent B28 Matvaretabellen table-salt composition evidence remains governed by its own source and semantic contract.

B41 uses Food Group 04 report https://www.ars.usda.gov/SP2UserFiles/Place/80400525/Data/SR/SR28/reports/sr28fg04.pdf . NDB `04058`, **Oil, sesame, salad or cooking**, directly publishes Measure 3 = **4.5 g: 1 tsp**. B41 admits only canonical `sesame_oil|tsp` at 4.5 g/tsp and preserves medium confidence because the source retains a salad-or-cooking qualifier while the repository identity is generic. Although the source also publishes tablespoon and cup values, B41 does not admit them. It does not authorize toasted-sesame-oil-specific identity, another oil, sesame seeds, tahini, generic spoon arithmetic, or any SR28 composition value. Existing Ciqual sesame-oil composition remains independently governed.

## USDA Nationwide Food Consumption Survey historical portion data

B38 bundles one bounded historical household-portion row from the U.S. Department of Agriculture's **Coding Manual to Handle Data from Nationwide Survey of Individuals, Spring 1977-78**, CFE Admin. Report No. 352.

- Source authority: U.S. Department of Agriculture
- Dataset: Nationwide Food Consumption Survey 1977-78
- Source report: https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/7778/cfe_admin_rep_352.pdf
- Reviewed food code: `414-2011`, **Soybean product: Miso**
- Reviewed measure: **1 tablespoon = 17 g edible portion**
- Reuse boundary: B38 records only this exact historical portion row. It does not import historical nutrient composition and does not infer another unit or food identity.

B38 is a separate portion-only role with medium confidence because the source is historical. The same USDA table separately identifies `414-2010` **Miso sauce** at a different tablespoon mass, so B38 deliberately does not generalize the generic miso row to miso sauce, named miso subtypes, teaspoons, cups or neighboring fermented-soy foods. The independent B35 Matvaretabellen composition evidence remains governed by its own source and carbohydrate-semantic contract.

## Japan Standard Tables of Food Composition data

B39 bundles one exact composition row from Japan's Ministry of Education, Culture, Sports, Science and Technology (MEXT), **Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023**.

- Source authority: Ministry of Education, Culture, Sports, Science and Technology (MEXT), Japan
- Dataset: Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023
- Reviewed food number: `17016`, **Rice vinegar**
- Source page: https://fooddb.mext.go.jp/details/details.pl?ITEM_NO=17_17016_7
- Reuse guidance: https://www.mext.go.jp/a_menu/syokuhinseibun/index.htm
- Attribution: Source: Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023, MEXT.
- Reuse boundary: MEXT states that food-composition data may be freely used and asks secondary users, including applications, to identify the source. B39 stores only the reviewed food-17016 tracked fields and no source prose beyond bounded identity/provenance metadata.

B39 is a standalone composition-only provider extension. It preserves MEXT's `CHOAVLDF-` available-carbohydrate-by-difference field as a distinct semantic, never treats it as USDA total carbohydrate-by-difference, and does not authorize a tablespoon mass, generic vinegar, seasoned rice vinegar, black rice vinegar, grain/wine vinegar or another household/yield conversion.