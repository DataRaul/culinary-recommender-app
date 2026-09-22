import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_FANNIE_FARMER_1910_SOURCE = Object.freeze({
  cohortId: "ORA_FANNIE_FARMER_BOSTON_COOKING_SCHOOL_GUTENBERG_65061",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "ye-old-american",
  sourceTitle: "The Boston Cooking-School Cook Book",
  sourceAuthor: "Fannie Merritt Farmer",
  canonicalAuthor: "Fannie Merritt Farmer",
  sourceUrl: "https://www.gutenberg.org/ebooks/65061",
  sourceYear: "1896",
  sourceYearSemantics: "ORA_WORK_FIRST_PUBLICATION_YEAR_1896__EXACT_DIGITIZED_EDITION_1910_REVISED",
  workFirstPublicationYear: "1896",
  digitizedEditionYear: "1910",
  digitizedEditionLabel: "1910 revised edition with 125 new recipes",
  publisher: "Little, Brown, and Company",
  publicationPlace: "Boston",
  projectGutenbergEbookNumber: "65061",
  projectGutenbergCopyrightStatus: "Public domain in the USA.",
  license: "public-domain",
  expectedRecipeCount: 1776,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_FANNIE_FARMER_1910_REVISED_EDITION_TERM_EXPIRED"
});

export const ORA_FANNIE_FARMER_1910_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_FANNIE_FARMER_1910_V8016_MARGINAL_VALUE_V1";
export const ORA_FANNIE_FARMER_1910_CANDIDATE_TERMINAL = "STEP_8G_ORA_FANNIE_FARMER_1910_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_FANNIE_FARMER_1910_REJECT_TERMINAL = "STEP_8G_STOP_ORA_FANNIE_FARMER_1910_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const s = ORA_FANNIE_FARMER_1910_SOURCE;
  return candidate.collection === s.collection &&
    candidate.sourceUrl === s.sourceUrl &&
    candidate.sourceTitle === s.sourceTitle &&
    candidate.sourceAuthor === s.sourceAuthor &&
    candidate.sourceYear === s.sourceYear &&
    candidate.licenseId === s.license;
}

export function measureOraFannieFarmer1910Candidate({
  candidateRows, baselineRecipes, rightsDocumented, repositoryReusePass,
  attributionClassified, editionSemanticsClassified, exactSourcePublicDomainClassified
}) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_FANNIE_FARMER_1910_CANDIDATE_EMPTY");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_FANNIE_FARMER_1910_BASELINE_EMPTY");

  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8016",
    activeProtectedCount: 17011
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_FANNIE_FARMER_1910_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true && repositoryReusePass === true &&
    attributionClassified === true && editionSemanticsClassified === true &&
    exactSourcePublicDomainClassified === true &&
    exactCountPass && singleSourcePass && rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_FANNIE_FARMER_1910_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_FANNIE_FARMER_1910_CANDIDATE_TERMINAL : ORA_FANNIE_FARMER_1910_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_FANNIE_FARMER_1910_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      canonicalAuthor: ORA_FANNIE_FARMER_1910_SOURCE.canonicalAuthor,
      sourceYear: candidate.sourceYear,
      sourceYearSemantics: ORA_FANNIE_FARMER_1910_SOURCE.sourceYearSemantics,
      workFirstPublicationYear: ORA_FANNIE_FARMER_1910_SOURCE.workFirstPublicationYear,
      sourceUrl: candidate.sourceUrl,
      digitizedEditionYear: ORA_FANNIE_FARMER_1910_SOURCE.digitizedEditionYear,
      digitizedEditionLabel: ORA_FANNIE_FARMER_1910_SOURCE.digitizedEditionLabel,
      publisher: ORA_FANNIE_FARMER_1910_SOURCE.publisher,
      publicationPlace: ORA_FANNIE_FARMER_1910_SOURCE.publicationPlace,
      projectGutenbergEbookNumber: ORA_FANNIE_FARMER_1910_SOURCE.projectGutenbergEbookNumber,
      projectGutenbergCopyrightStatus: ORA_FANNIE_FARMER_1910_SOURCE.projectGutenbergCopyrightStatus,
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
      editionSemanticsClassified: editionSemanticsClassified === true,
      exactSourcePublicDomainClassified: exactSourcePublicDomainClassified === true,
      exactCountPass, singleSourcePass, rightsMetadataPass, rightsAuditPass,
      structuralQualityPass, culinaryCoveragePass
    },
    evidenceSamples: candidate?.evidenceSamples || {},
    nextAuthority: pass ? "SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY" : "NONE_STOP_OR_SELECT_OTHER_SOURCE",
    boundaries: {
      liveD1WritesPerformed: 0, protectedPopulationAuthorized: false,
      publicRuntimeChangeAuthorized: false, recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false, d1BudgetExpansionAuthorized: false,
      billingExpansionAuthorized: false, nutritionLaneModified: false,
      youtubeCulinaryStateModified: false, knowledgeCoreWritePerformed: false,
      culturalAuthenticityAuthorityImported: false
    }
  };
}
