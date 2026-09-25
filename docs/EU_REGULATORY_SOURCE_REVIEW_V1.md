# EU Regulatory Source Review V1

State: **PASS CANDIDATE**  
Lane: **Lane 3 — EU regulatory truth**  
Date: **2026-09-25**  
Target gate: **EU_REGULATORY_SOURCE_REVIEW_V1_PASS**

## Objective

Verify the seven source families registered by the Lane 3 scaffold and determine what each source can safely support in research before any regulatory evidence is allowed to affect app behavior.

The review is deliberately narrow: official-source role, legal weight, currentness snapshot, safe research uses and explicit non-authority boundaries.

## Findings by source family

### EFSA FoodEx2

EFSA's data-standardisation surface was last reviewed on 2026-07-13 and identifies FoodEx2 as the standardised system for classifying and describing foods. Revision 2 and recent maintenance materials are exposed from the official source.

**Research use:** food-category / identifier / hierarchy mapping design.  
**Not granted:** legislative authority, composition authority, recommendation authority or bulk import.

### EU Register of Health Claims

The Commission explicitly describes the register as **for information only**. It exposes authorised and non-authorised health claims, conditions/restrictions and claim-specific EU legal acts; a complete health-claims dataset is available as an Excel download.

**Research use:** claim-state and legal-act pointer research.  
**Not granted:** automatic claim display, recipe health scoring or medical/nutrition authority.

### EU Pesticides Database

The Commission explicitly states that the database has **no legal value** and that official information is published in the Official Journal. The Commission also exposes downloads and machine-to-machine APIs.

**Research use:** MRL/reference discovery and legal-act pointer research.  
**Not granted:** treating the database itself as controlling law, inferring actual residue in a recipe ingredient, or recipe exclusion.

### EU Food Additives Database

The Commission database is a reference tool based on the Union list in Annex II of Regulation (EC) No 1333/2008. EUR-Lex currently exposes a consolidated Regulation 1333/2008 version dated **2026-08-18**.

**Research use:** E-number/additive identity, food-category and condition-of-use research.  
**Not granted:** inferring product-specific additive presence from generic canonical ingredients.

### Regulation (EU) No 1169/2011 / Annex II

EUR-Lex reports the current consolidated version as **2025-04-01**. Annex II supplies the controlling EU category list for substances/products causing allergies or intolerances.

**Research use:** compare the app's existing allergen vocabulary against Annex II.  
**Not granted:** changing ingredient allergen tags, profile hard filters or recommendation behavior.

### Union list of novel foods

The Commission identifies Implementing Regulation (EU) 2017/2470 as the Union list. EUR-Lex reports the current consolidated version as **2026-08-10**.

**Research use:** exact novel-food identity, authorised conditions, specifications and specific labelling research.  
**Not granted:** generic ingredient eligibility or automatic exclusion.

### Commission Regulation (EU) 2023/915 — contaminants

EUR-Lex reports a current consolidated version dated **2026-08-19**.

**Research use:** commodity/scope/limit research.  
**Not granted:** inferring actual contamination, recipe safety or recommendation eligibility from a legal maximum alone.

## Priority finding

The safest high-value successor inside the already-authorized research/scaffolding boundary is an **Annex II allergen vocabulary gap audit** against the public ingredient ontology.

That audit is implemented separately in `config/eu_regulatory_allergen_gap_audit_v1.json` and changes no runtime behavior.

## Gate conditions

The review earns `EU_REGULATORY_SOURCE_REVIEW_V1_PASS` only if:

- all seven source families retain their correct classification vs informational vs legal role;
- currentness is snapshotted where an official consolidated version is observable;
- every source has bounded safe research uses;
- every source remains `directRecipeSafetyAuthority:false`;
- every source remains `bulkImportAuthorized:false`;
- D1, protected corpus, public runtime, Knowledge Core, Barbecue and billing remain untouched.
