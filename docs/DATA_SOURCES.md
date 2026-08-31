# Data Sources & Licensing Audit

Audit date: 2026-08-31.

## Shipped project-authored corpus
The public runtime ships only project-authored structured recipes, ingredient mappings and substitution guidance. No third-party recipe text, photographs or recipe-database dump is bundled.

The repository intentionally has **no general licence yet**. Until a later explicit licensing decision, original repository content remains under default copyright. External source licences are recorded independently and are not implied to license this repository.

### Project-authored recipe corpus
- V0 source reference: `data/project-authored-v0`
- V1 source reference: `data/project-authored-v1`
- V1 search-coverage source reference: `data/project-authored-v1-search-coverage`
- recipes remain original project-authored structured content;
- no copied third-party recipe prose or external recipe dataset is used;
- recipe nutrition fields remain low-confidence `INFERRED_ESTIMATE` values unless a recipe obtains complete authoritative static coverage through the separate NutritionSource.

### Ingredient ontology and substitution graph
The canonical ingredient ontology, English/Spanish aliases, family relationships and controlled substitution guidance are project-authored application data. Substitutions are labelled `close_substitute`, `functional_substitute`, `flavour_direction`, `texture_substitute`, `dietary_substitute`, or `emergency_approximation`. Allergen and permanent-exclusion constraints override substitution suggestions.

## Nutrition evidence
### USDA FoodData Central Foundation Foods — BOUNDED STATIC COMPOSITION + PORTION EVIDENCE
USDA FoodData Central remains one authoritative source family for V1 nutrition evidence; it is not treated as universally representative of European food supply.

Verified source facts:
- FoodData Central data are public-use CC0 / U.S. public-domain data;
- Foundation Foods provides analytically derived nutrient/component data and unusually deep underlying metadata, including sample counts/acquisition and analytical information;
- selected release: FoodData Central Version 15.0, published 2026-04-30;
- official static Foundation downloads are available, so the public application requires no runtime API key or network call.

Official references:
- https://fdc.nal.usda.gov/
- https://fdc.nal.usda.gov/download-datasets/
- https://fdc.nal.usda.gov/log/
- https://fdc.nal.usda.gov/Foundation_Foods_Documentation/

### Bounded composition extraction
Temporary standard-public-run workflows downloaded the official archive:

`FoodData_Central_foundation_food_csv_2026-04-30.zip`

Reusable extraction scripts join the official Foundation food, food, nutrient and portion tables and retain only manually reviewed canonical ingredient identities. The bulk USDA archive is **not** committed.

`src/data/usda-foundation-nutrients-v1.js` contains the original bounded per-100g records for 14 canonical ingredients:

- chicken breast;
- black, cannellini/white, pinto and kidney beans;
- green beans;
- Hass avocado;
- ripe banana;
- canned light tuna in water;
- raw cashews, almonds and walnuts;
- raw pumpkin and sunflower seeds.

Nutrition B3 adds 15 reviewed records in `src/data/usda-foundation-nutrients-b3.js`:

- broccoli;
- Grade-A large whole egg;
- red onion;
- yellow onion as an explicitly variety-qualified match for canonical `onion`;
- garlic;
- white-button mushroom as an explicitly species/form-qualified match for canonical `mushroom`;
- mature raw carrot;
- raw pineapple;
- cucumber with peel;
- raw unenriched white long-grain rice as an explicitly form-qualified match for canonical `rice`;
- cauliflower;
- aubergine/eggplant;
- canned tomato paste without added salt;
- crushed canned tomato;
- spring onion/scallion.

The combined bounded ledger therefore contains 29 manually reviewed Foundation identities. Candidate search never promotes a match automatically. Generic salmon, milk, yogurt, mango, apple and ambiguous potato/sweet-potato variants were among the candidates deliberately not promoted merely to inflate coverage.

### Tracked nutrient semantics
Tracked fields are:
- protein — nutrient `1003`;
- total fat — `1004`;
- carbohydrate by difference — `1005`;
- fibre — `1079` where published;
- energy — prefer `2048` (Metabolizable Energy, Atwater Specific Factors), with architecture-level fallback to `2047` (Atwater General Factors) and legacy `1008` only when needed.

Foundation records do not always publish every tracked field. Missing fields are stored as `null`; **null is never interpreted as zero**. In B3, cucumber lacks tracked fibre and spring onion lacks tracked energy, carbohydrate and fat; those records remain partial.

### Bounded portion evidence
`src/data/usda-foundation-portions-v1.js` preserves source household-weight rows separately from automatic conversion policy.

Reviewed portion evidence currently includes:

- **banana / FDC 1105314** — 1 peeled Banana = **115 g**, 102 data points;
- **tuna / FDC 334194** — 1 can = **107 g drained solids** or **142 g total can contents**, 48 data points each;
- **broccoli / FDC 747447** — 1 chopped cup = **76 g**, 12 data points;
- **egg / FDC 748967** — 1 whole shell-less Grade-A large egg = **50.3 g**, 526 data points;
- **yellow onion / FDC 790646** — 1 edible onion = **143 g**, 44 data points;
- **red onion / FDC 790577** — 1 edible onion = **197 g**, 30 data points.

Automatic conversion is intentionally narrower than source availability:

- canonical banana `piece` / `pieces` may use 115 g per unit because the source measure itself is one peeled Banana;
- ordinary tuna `can` / `cans` is **not** assigned a weight because the source publishes two incompatible states and a bare recipe unit does not identify which state applies;
- B3 broccoli/egg/onion household weights remain evidence-only because current recipe semantics do not encode enough chopped-cup form, egg size/grade or onion variety/size detail to apply them automatically;
- foods with no reviewed portion match remain unsupported outside direct mass units.

No generic household-weight table, search-engine average, recipe-blog conversion or hidden teaspoon/tablespoon/piece assumption is used to increase apparent coverage.

### Recipe calculation boundary
`src/domain/nutrition.js` accepts direct `g`/`kg` quantities and a deliberately small set of source-backed portion conversions.

For each tracked nutrient the calculator reports whether every required recipe ingredient is covered. A recipe-level authoritative static calculation becomes primary only when:
1. every required ingredient has a matched static density;
2. every required ingredient quantity has either direct mass or an unambiguous reviewed portion conversion;
3. every tracked nutrient is present across all required ingredients.

Otherwise the project-authored estimate remains primary and the partial static calculation is exposed only as evidence/coverage metadata. Applied portion conversions carry their source/quantity provenance in the calculation audit.

Even a complete static ingredient calculation is labelled medium confidence because recipe cooking/yield effects and food-form assumptions can still matter.

## European composition and regulatory truth lane — RESEARCHED, NOT YET MIXED INTO RUNTIME
European evidence should complement rather than simply replace USDA. Geographic relevance, food definitions, analytical provenance, sampling, nutrient definitions and legal status are distinct dimensions. The intended architecture is source-specific provenance plus explicit cross-source reconciliation, not averaging incompatible rows.

### Finland — Fineli / THL — STRONG OPEN INGESTION CANDIDATE
Official national food composition database maintained by the Finnish Institute for Health and Welfare (THL).

Current open-data facts reviewed 2026-08-31:
- composition packages include 4,232 foods and up to 74 nutrient components;
- food names are available in Finnish, Swedish and English;
- household measures and portion weights are included in the downloadable package;
- JSON API endpoints are published for components, food search and food-by-ID;
- open data licence: **CC BY 4.0** with attribution to Finnish Institute for Health and Welfare / Fineli;
- THL explicitly permits copying, distribution, modification and derivative use under that attribution condition.

Official references:
- https://fineli.fi/fineli/fi/avoin-data
- https://fineli.fi/fineli/api/v1/components/
- https://fineli.fi/fineli/api/v1/foods
- https://fineli.fi/fineli/v2/api-docs

Assessment: best currently identified European source for a bounded machine-readable public-app ingestion because both access and reuse terms are explicit. It should be integrated as its own source ledger, not used to silently overwrite USDA values.

### France — Ciqual 2025 / ANSES — STRONG OPEN STATIC CANDIDATE
France's reference food-composition table is managed by ANSES.

Current facts reviewed 2026-08-31:
- Ciqual 2025 contains **3,484 foods and 74 constituents**;
- public XLS/XLSX/XML downloads are available via Recherche Data Gouv;
- licence: **Etalab Open Licence 2.0**, compatible with CC BY 2.0;
- ANSES documentation states that source information exists for each constituent/food and is available through XML or the online nutrition sheets;
- the methodology uses multiple data sources including analytical data from Ciqual-defined sampling plans intended to represent French consumption.

Official references:
- https://ciqual.anses.fr/cms/fr/la-table-ciqual-2025
- https://doi.org/10.57745/RDMHWY

Assessment: strong geographically relevant static cross-check/ingestion candidate, especially for Spain-adjacent European food forms. Prefer XML where constituent-level source provenance is needed.

### Denmark — Frida / DTU National Food Institute — HIGH-QUALITY, ATTRIBUTION/TERMS REVIEW
Official Danish food-composition database maintained by DTU National Food Institute in collaboration with the Danish Veterinary and Food Administration.

Current facts reviewed 2026-08-31:
- current public lineage reached Frida 6.1 in 2026;
- datasets include nutrient data plus normalized source/reference tables, food descriptions, FoodEx2 and LanguaL coding, parameters and source metadata;
- data are downloadable and free to users;
- DTU documentation requires clear source acknowledgement and preserves copyright rather than using the same permissive CC0 model as USDA.

Official references:
- https://www.food.dtu.dk/english/About-us/Facilities-and-infrastructure/Food-Data-database-on-nutrients-in-food
- https://doi.org/10.11583/DTU.32312844
- https://frida.fooddata.dk/

Assessment: very useful European comparison/provenance source. Before bundling a derived subset publicly, retain exact attribution and re-check the current 6.1 reuse text rather than assuming a generic open-data licence.

### Netherlands — NEVO / RIVM — HIGH-QUALITY, REUSE-CONSTRAINED
Official Dutch food-composition database managed by RIVM / Netherlands Ministry of Health.

Current facts reviewed 2026-08-31:
- NEVO online 2025/9.0 contains more than **2,300 foods and 130 nutrients**;
- every nutrient value retains a source/reference;
- preferred values come from chemical analyses by accredited laboratories where available, with other sources explicitly documented;
- full dataset is downloadable free after accepting conditions;
- the current conditions require source/version attribution and constrain modification/use; older/current terms also include conditions relevant to charging end users.

Official references:
- https://www.rivm.nl/en/dutch-food-composition-database
- https://www.rivm.nl/en/dutch-food-composition-database/use-of-nevo-online/request-dataset
- https://www.rivm.nl/documenten/conditions-for-use-of-nevo-online-version

Assessment: excellent truth/reference source, but not a default bundling candidate until the current licence/monetisation implications are reconciled explicitly.

### Spain — BEDCA / AESAN network — LOCAL RELEVANCE, REUSE RESTRICTED
BEDCA is the Spanish food-composition database developed by Red BEDCA with AESAN coordination/funding and documented to EuroFIR specifications.

Current audit:
- particularly relevant for Spanish/Canary food forms;
- public access exists, but the published use conditions require clear attribution and prohibit modification/alteration of original meaning;
- the public system and terms are older and do not present the same clean machine-readable/open-licence contract as Fineli or Ciqual.

Official references:
- https://www.bedca.net/
- https://www.bedca.net/bdpub/UsoBD.pdf

Assessment: keep as a Spain-specific validation/reference lane until exact redistribution/API terms are resolved. Do not scrape or silently republish.

### EuroFIR FoodEXplorer — HARMONISATION/COMPARISON TOOL, NOT DEFAULT RUNTIME SOURCE
EuroFIR provides harmonised access across many national food-composition databases and standardises food/component/value descriptions using LanguaL, FoodEx2 and EuroFIR vocabularies.

Current access facts:
- full FoodEXplorer access is membership/pay-per-view based;
- temporary access is priced and downloads are limited;
- publication/use remains subject to specific national licence agreements.

Official references:
- https://www.eurofir.org/our-tools/foodexplorer/
- https://www.eurofir.org/food-information/how-to-access-fcdbs/

Assessment: useful for expert cross-database reconciliation, but not appropriate as a no-cost public runtime dependency under the current project constraints.

## EU-level food standards / safety data — DISTINCT FROM FOOD COMPOSITION
The European Commission and EFSA provide high-value regulatory and classification data that should form a separate **regulatory truth lane**, not be mixed into nutrient composition values.

### EFSA FoodEx2 and data standardisation
FoodEx2 is EFSA's hierarchical food classification/description system used alongside SSD2 for harmonised food/feed analytical and exposure data.

Official reference:
- https://www.efsa.europa.eu/en/data/data-standardisation

Potential project use: canonical food classification, cross-source identity reconciliation and future contaminants/exposure evidence mapping. FoodEx2 is not itself a nutrient-composition database.

### EU Register of nutrition and health claims
The European Commission register records authorised/non-authorised health claims, conditions of use, restrictions and legal acts. A downloadable health-claims dataset is available.

Official reference:
- https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-health-claims_en

Potential project use: future claims/supplement guidance validation. It must never be converted into personalised medical advice.

### EU Pesticides Database
The Commission database exposes active substances, maximum residue levels (MRLs), emergency authorisations, downloadable data and machine-to-machine APIs.

Official reference:
- https://food.ec.europa.eu/plants/pesticides/eu-pesticides-database_en

Potential project use: future ingredient-safety/legal-context evidence. Database values are informational; the Official Journal remains the legal source of truth.

### EU food-safety databases
The Commission's food-safety portal links searchable regulatory resources for food additives, allergens, nutrients approved for use, novel foods, feed additives, contaminants, RASFF and related controls.

Official reference:
- https://food.ec.europa.eu/horizontal-topics/eu-food-safety-databases-and-other-online-services_en

Potential project use: future regulatory validation layers. These are legal/safety datasets and should not alter recipe ranking unless a separately designed safety contract authorises that behavior.

## European evidence architecture conclusion
The evidence review does **not** support a simple claim that Europe is categorically more truthful than the US, nor the reverse. USDA Foundation is unusually transparent about analytical samples and underlying metadata; several European national databases are broader and more geographically relevant to this app, and some provide excellent per-value provenance.

The strongest next architecture is therefore:
1. preserve source-specific food identity and food form;
2. preserve analytical/derived/reference status per nutrient where available;
3. preserve geography and publication/version date;
4. never average conflicting sources merely to create one number;
5. prefer a source that matches the recipe food form and geography when evidence quality is comparable;
6. expose cross-source disagreement as uncertainty rather than hiding it;
7. keep regulatory/legal evidence separate from composition evidence;
8. use permissively licensed Fineli and Ciqual first for a European bounded ingestion pilot; treat Frida, NEVO and BEDCA according to their exact reuse terms.

### Open Food Facts — COMPATIBILITY REVIEW REQUIRED
Open Food Facts remains unbundled. Its ODbL terms require an explicit compatibility and derived-database architecture decision before integration.

## Recipe dataset candidates
Previously identified third-party recipe datasets remain **not ingested**. Public visibility alone is not sufficient provenance. Recipe count remains subordinate to provenance, structure, culinary quality and editorial control.

## Cost evidence state
Cost is a relative deterministic heuristic rather than live market data. V1 uses project-authored Spain/Canary ingredient classes, package-sensitivity flags, availability assumptions and portfolio reuse effects. These are intentionally low-confidence planning heuristics and do not claim current supermarket prices or exact euros per serving.

## Current nutrition state
The app has a real authoritative static evidence lane, but coverage is intentionally partial. Most recipe cards may still display the existing low-confidence project estimate until their entire required ingredient/nutrient/quantity set is covered. The existence of some USDA or European source records must never be presented as if the whole corpus has authoritative recipe nutrition.
