import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_ATRUTEL_1874_SOURCE = Object.freeze({
  cohortId: "ORA_ATRUTEL_1874_EASY_ECONOMICAL_JEWISH_COOKERY_B2807967X",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "jewish-kitchen",
  sourceTitle: "An Easy and Economical Book of Jewish Cookery",
  sourceAuthor: "Estella Atrutel",
  canonicalAuthor: "Estella Benzaquen Atrutel",
  titlePageAuthor: "Mrs. J. Atrutel",
  sourceUrl: "https://archive.org/details/b2807967x",
  sourceYear: "1874",
  digitizedEditionYear: "1874",
  digitizedEditionLabel: "1874 first edition",
  publisher: "Alabaster & Passmore",
  publicationPlace: "London",
  authorDeathYear: "1884",
  wellcomeLicence: "Public Domain Mark",
  license: "public-domain",
  expectedRecipeCount: 481,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_ATRUTEL_1874_FIRST_EDITION_AUTHOR_TERM_EXPIRED"
});

export const ORA_ATRUTEL_1874_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_ATRUTEL_1874_V8017_MARGINAL_VALUE_V1";
export const ORA_ATRUTEL_1874_CANDIDATE_TERMINAL = "STEP_8G_ORA_ATRUTEL_1874_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_ATRUTEL_1874_REJECT_TERMINAL = "STEP_8G_STOP_ORA_ATRUTEL_1874_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const s = ORA_ATRUTEL_1874_SOURCE;
  return candidate.collection === s.collection &&
    candidate.sourceUrl === s.sourceUrl &&
    candidate.sourceTitle === s.sourceTitle &&
    candidate.sourceAuthor === s.sourceAuthor &&
    candidate.sourceYear === s.sourceYear &&
    candidate.licenseId === s.license;
}

export function measureOraAtrutel1874Candidate({
  candidateRows,
  baselineRecipes,
  rightsDocumented,
  repositoryReusePass,
  attributionClassified,
  exactEditionClassified,
  authorTermClassified,
  exactSourcePublicDomainClassified
}) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_ATRUTEL_1874_CANDIDATE_EMPTY");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_ATRUTEL_1874_BASELINE_EMPTY");

  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8017",
    activeProtectedCount: 18787
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_ATRUTEL_1874_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true &&
    repositoryReusePass === true &&
    attributionClassified === true &&
    exactEditionClassified === true &&
    authorTermClassified === true &&
    exactSourcePublicDomainClassified === true &&
    exactCountPass && singleSourcePass && rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_ATRUTEL_1874_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_ATRUTEL_1874_CANDIDATE_TERMINAL : ORA_ATRUTEL_1874_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_ATRUTEL_1874_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      canonicalAuthor: ORA_ATRUTEL_1874_SOURCE.canonicalAuthor,
      titlePageAuthor: ORA_ATRUTEL_1874_SOURCE.titlePageAuthor,
      sourceYear: candidate.sourceYear,
      sourceUrl: candidate.sourceUrl,
      digitizedEditionYear: ORA_ATRUTEL_1874_SOURCE.digitizedEditionYear,
      digitizedEditionLabel: ORA_ATRUTEL_1874_SOURCE.digitizedEditionLabel,
      publisher: ORA_ATRUTEL_1874_SOURCE.publisher,
      publicationPlace: ORA_ATRUTEL_1874_SOURCE.publicationPlace,
      authorDeathYear: ORA_ATRUTEL_1874_SOURCE.authorDeathYear,
      wellcomeLicence: ORA_ATRUTEL_1874_SOURCE.wellcomeLicence,
      recipeCount: candidate.recipeCount,
      parseableRecipeCount: candidate.parseableRecipeCount,
      parseableRecipeRatio: candidate.parseableRecipeRatio,
      distinctNormalizedTitles: candidate.distinctNormalizedTitles,
      uniqueTitleRatio: candidate.uniqueTitleRatio,
      exactBaselineTitleOverlapCount: candidate.exactBaselineTitleOverlapCount,
      novelNormalizedTitleCount: candidate.novelNormalizedTitleCount,
      novelTitleRatio: candidate.novelTitleRatio,
      distinctIngredientPhraseCount: candidate.distinctIngredientPhraseCount,
      novelIngredientPhraseCount: candidate.novelIngredientPhraseCount,
      ontologyResolvedOccurrenceRatio: candidate.ontologyResolvedOccurrenceRatio,
      ontologyResolvedCanonicalIngredientCount: candidate.ontologyResolvedCanonicalIngredientCount,
      ontologyUnresolvedPhraseCount: candidate.ontologyUnresolvedPhraseCount,
      culturalAuthorityImported: false,
      historicalSourceLabelOnly: true
    } : null,
    thresholds: discovery.thresholds,
    gates: {
      rightsDocumented: rightsDocumented === true,
      repositoryReusePass: repositoryReusePass === true,
      attributionClassified: attributionClassified === true,
      exactEditionClassified: exactEditionClassified === true,
      authorTermClassified: authorTermClassified === true,
      exactSourcePublicDomainClassified: exactSourcePublicDomainClassified === true,
      exactCountPass,
      singleSourcePass,
      rightsMetadataPass,
      rightsAuditPass,
      structuralQualityPass,
      culinaryCoveragePass
    },
    evidenceSamples: candidate?.evidenceSamples || {},
    nextAuthority: pass ? "SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY" : "NONE_STOP_OR_SELECT_OTHER_SOURCE",
    boundaries: {
      liveD1WritesPerformed: 0,
      protectedPopulationAuthorized: false,
      publicRuntimeChangeAuthorized: false,
      recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false,
      d1BudgetExpansionAuthorized: false,
      billingExpansionAuthorized: false,
      nutritionLaneModified: false,
      youtubeCulinaryStateModified: false,
      knowledgeCoreWritePerformed: false,
      culturalAuthenticityAuthorityImported: false
    }
  };
}
