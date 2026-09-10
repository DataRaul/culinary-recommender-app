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

B6, B15 and B17 are separate bounded portion-evidence roles. B9, B11, B14, B16, B18, B19, B20, B22, B23, B24, B25, B26, B27, B28, B29, B31, B32 and B35 are standalone reviewed composition roles. B10, B12, B13, B21, B30 and B34 are exact tracked-field completion roles where existing reviewed composition has no value. Composition evidence never implies portion evidence, portion evidence never implies composition evidence, and admission in any one tranche does not silently authorize another role or food identity. B24 additionally preserves the source record's narrower goat-milk qualifier for feta rather than generalizing it into a universal feta or neighboring-cheese claim. B25 similarly preserves the source record's pearled FoodEx2 qualifier for uncooked barley and does not generalize the value to cooked barley or every barley variety/form. B26 is restricted to dried/uncooked rice noodles and does not authorize cooked rice-noodle composition, cooked-yield conversion or neighboring wheat-noodle identities. B27 is restricted to uncooked jasmine rice and does not authorize cooked jasmine rice, generic rice, basmati rice or another named rice identity. B28 preserves the narrower finely ground table-salt source identity and does not generalize it into mineral, herbal, iodized, sea-salt or neighboring-seasoning identities; it adds composition only and authorizes no household-unit conversion. B29 is restricted to the canonical wheat/flour tortilla-wrap identity and does not authorize corn tortillas, neighboring flatbreads or a tortilla-piece weight. B30 fills only the missing fat field of the already-reviewed generic soy-sauce identity, does not displace populated Ciqual fields, and does not authorize sweetened, tamari, gluten-free or neighboring fermented-soy identities. B31 preserves the source record's narrower cow-whey qualifier for ricotta at medium confidence and does not generalize that composition to sheep-, goat- or mixed-milk ricotta or neighboring fresh cheeses. B32 is restricted to exact black pepper (`Piper nigrum L.`) composition and deliberately excludes white pepper and other pepper products; it adds no teaspoon or other household-unit mass authority. B34 fills only the previously missing energy/carbohydrate/fat fields for exact raw spring onion and the missing fat field for exact raw peeled/pitted mango; populated USDA/Ciqual fields and the separately governed B6 piece conversions remain unchanged. B35 is restricted to exact generic miso-paste composition and does not authorize a tablespoon mass, another household-unit conversion, a named miso subtype or neighboring fermented-soy foods.
