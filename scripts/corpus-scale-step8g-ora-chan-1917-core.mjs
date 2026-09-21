import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_CHAN_1917_SOURCE = Object.freeze({
  cohortId: "ORA_CHAN_1917_CHINESE_COOK_BOOK_CHINESECOOKBOOK00CHAN",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "chinese-kitchen",
  sourceTitle: "The Chinese Cook Book",
  sourceAuthor: "Shiu Wong Chan",
  canonicalAuthor: "Shiu Wong Chan",
  sourceUrl: "https://archive.org/details/chinesecookbook00chan",
  sourceYear: "1917",
  sourceYearSemantics: "EXACT_DIGITIZED_FIRST_EDITION_YEAR",
  workFirstPublicationYear: "1917",
  digitizedEditionYear: "1917",
  digitizedEditionLabel: "1st edition",
  publisher: "Frederick A. Stokes Company",
  publicationPlace: "New York",
  license: "public-domain",
  expectedRecipeCount: 145,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_CHAN_1917_FIRST_EDITION_US_ORIGIN_TERM_EXPIRED"
});

export const ORA_CHAN_1917_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_CHAN_1917_V8014_MARGINAL_VALUE_V1";
export const ORA_CHAN_1917_CANDIDATE_TERMINAL = "STEP_8G_ORA_CHAN_1917_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_CHAN_1917_REJECT_TERMINAL = "STEP_8G_STOP_ORA_CHAN_1917_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const s = ORA_CHAN_1917_SOURCE;
  return candidate.collection === s.collection &&
    candidate.sourceUrl === s.sourceUrl &&
    candidate.sourceTitle === s.sourceTitle &&
    candidate.sourceAuthor === s.sourceAuthor &&
    candidate.sourceYear === s.sourceYear &&
    candidate.licenseId === s.license;
}

export function measureOraChan1917Candidate({
  candidateRows, baselineRecipes, rightsDocumented, repositoryReusePass,
  attributionClassified, editionSemanticsClassified
}) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_CHAN_1917_CANDIDATE_EMPTY");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_CHAN_1917_BASELINE_EMPTY");

  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8014",
    activeProtectedCount: 16365
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_CHAN_1917_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true && repositoryReusePass === true &&
    attributionClassified === true && editionSemanticsClassified === true &&
    exactCountPass && singleSourcePass && rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_CHAN_1917_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_CHAN_1917_CANDIDATE_TERMINAL : ORA_CHAN_1917_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_CHAN_1917_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      sourceYear: candidate.sourceYear,
      sourceYearSemantics: ORA_CHAN_1917_SOURCE.sourceYearSemantics,
      workFirstPublicationYear: ORA_CHAN_1917_SOURCE.workFirstPublicationYear,
      sourceUrl: candidate.sourceUrl,
      digitizedEditionYear: ORA_CHAN_1917_SOURCE.digitizedEditionYear,
      digitizedEditionLabel: ORA_CHAN_1917_SOURCE.digitizedEditionLabel,
      publisher: ORA_CHAN_1917_SOURCE.publisher,
      publicationPlace: ORA_CHAN_1917_SOURCE.publicationPlace,
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
