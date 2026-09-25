// Audit-only EU/EFSA regulatory and classification source registry.
// This module is intentionally not imported by public/runtime application code.
// It provides no recommendation, nutrition-composition, allergen, safety, ranking or planner authority.

const source = entry => Object.freeze({
  checkedAt: "2026-09-25",
  currentnessPolicy: "REVERIFY_OFFICIAL_SOURCE_BEFORE_SUBSTANTIVE_USE",
  runtimeFetch: false,
  datasetImport: false,
  appBehaviorAuthority: false,
  recommendationAuthority: false,
  nutritionCompositionAuthority: false,
  ...entry
});

export const EU_REGULATORY_EVIDENCE_SOURCES_V1 = Object.freeze([
  source({
    id: "efsa-foodex2",
    authority: "European Food Safety Authority (EFSA)",
    canonicalUrl: "https://www.efsa.europa.eu/en/data/data-standardisation",
    sourceRole: "CLASSIFICATION_TAXONOMY",
    legalWeight: "NON_LEGISLATIVE_CLASSIFICATION_REFERENCE",
    controllingLegalSource: null,
    purpose: "Standardised food classification and description reference for regulatory/evidence mapping."
  }),
  source({
    id: "ec-eu-health-claims-register",
    authority: "European Commission",
    canonicalUrl: "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-health-claims_en",
    sourceRole: "INFORMATIONAL_REGISTER",
    legalWeight: "INFORMATION_ONLY__CLAIM_SPECIFIC_EU_LEGAL_ACTS_CONTROL",
    controllingLegalSource: "Regulation (EC) No 1924/2006 and the EU legal acts identified for specific claims",
    purpose: "Reference permitted nutrition claims plus authorised/non-authorised health-claim status and conditions."
  }),
  source({
    id: "ec-eu-pesticides-database",
    authority: "European Commission",
    canonicalUrl: "https://food.ec.europa.eu/plants/pesticides/eu-pesticides-database_en",
    sourceRole: "INFORMATIONAL_DATABASE",
    legalWeight: "NO_LEGAL_VALUE__OFFICIAL_JOURNAL_ACTS_CONTROL",
    controllingLegalSource: "Official Journal of the European Union legal acts governing pesticide active substances and MRLs",
    purpose: "Search reference for active substances, maximum residue levels and Member-State emergency authorisations."
  }),
  source({
    id: "ec-food-additives-database",
    authority: "European Commission",
    canonicalUrl: "https://food.ec.europa.eu/food-safety/food-improvement-agents/additives/database_en",
    sourceRole: "INFORMATIONAL_DATABASE",
    legalWeight: "UNION_LIST_DERIVED__CONTROLLING_LEGAL_TEXT_REQUIRED",
    controllingLegalSource: "Regulation (EC) No 1333/2008 Annex II and amendments",
    purpose: "Reference approved EU food additives and conditions of use."
  }),
  source({
    id: "eurlex-food-information-allergens-1169-2011",
    authority: "European Union / EUR-Lex",
    canonicalUrl: "https://eur-lex.europa.eu/eli/reg/2011/1169/oj",
    sourceRole: "PRIMARY_LEGAL_TEXT",
    legalWeight: "CONTROLLING_EU_LEGAL_TEXT",
    controllingLegalSource: "Regulation (EU) No 1169/2011, including Annex II",
    purpose: "Primary legal source for food-information obligations and substances/products causing allergies or intolerances."
  }),
  source({
    id: "ec-union-list-novel-foods",
    authority: "European Commission",
    canonicalUrl: "https://food.ec.europa.eu/food-safety/novel-food/authorisations/union-list-novel-foods_en",
    sourceRole: "AUTHORITATIVE_COMMISSION_LIST_WITH_LEGAL_ACT_BACKING",
    legalWeight: "IMPLEMENTING_REGULATION_CONTROLS",
    controllingLegalSource: "Commission Implementing Regulation (EU) 2017/2470 as amended",
    purpose: "Reference authorised novel foods, conditions of use, specifications and specific labelling requirements."
  }),
  source({
    id: "eurlex-contaminants-2023-915",
    authority: "European Union / EUR-Lex",
    canonicalUrl: "https://eur-lex.europa.eu/eli/reg/2023/915/oj",
    sourceRole: "PRIMARY_LEGAL_TEXT",
    legalWeight: "CONTROLLING_EU_LEGAL_TEXT__USE_CURRENT_CONSOLIDATED_VERSION",
    controllingLegalSource: "Commission Regulation (EU) 2023/915 as amended",
    purpose: "Primary legal source for maximum levels of specified contaminants in food."
  })
]);
