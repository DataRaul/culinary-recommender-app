import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_FROKEN_JENSEN_1921_SOURCE = Object.freeze({
  cohortId: "ORA_FROKEN_JENSEN_1921_KOGEBOG_23RD_FRKENJENSENSKO00JENS",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "danske-kokken",
  sourceTitle: "Frøken Jensens kogebog",
  sourceAuthor: "Kristine Marie Jensen",
  sourceUrl: "https://archive.org/details/frkenjensensko00jens",
  sourceYear: "1921",
  sourceYearSemantics: "EXACT_DIGITIZED_EDITION_YEAR",
  workFirstPublicationYear: "1901",
  digitizedEditionYear: "1921",
  digitizedEditionLabel: "23rd printing",
  license: "public-domain",
  expectedRecipeCount: 1372,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_FROKEN_JENSEN_1921_23RD_PRINTING"
});

export const ORA_FROKEN_JENSEN_1921_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_FROKEN_JENSEN_1921_V8010_MARGINAL_VALUE_V1";
export const ORA_FROKEN_JENSEN_1921_CANDIDATE_TERMINAL = "STEP_8G_ORA_FROKEN_JENSEN_1921_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_FROKEN_JENSEN_1921_REJECT_TERMINAL = "STEP_8G_STOP_ORA_FROKEN_JENSEN_1921_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const source = ORA_FROKEN_JENSEN_1921_SOURCE;
  return candidate.collection === source.collection &&
    candidate.sourceUrl === source.sourceUrl &&
    candidate.sourceTitle === source.sourceTitle &&
    candidate.sourceAuthor === source.sourceAuthor &&
    candidate.sourceYear === source.sourceYear &&
    candidate.licenseId === source.license;
}

export function measureOraFrokenJensen1921Candidate({
  candidateRows,
  baselineRecipes,
  rightsDocumented,
  repositoryReusePass,
  attributionClassified,
  editionSemanticsClassified
}) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_FROKEN_JENSEN_1921_CANDIDATE_EMPTY");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_FROKEN_JENSEN_1921_BASELINE_EMPTY");

  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8010",
    activeProtectedCount: 11752
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_FROKEN_JENSEN_1921_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true &&
    repositoryReusePass === true &&
    attributionClassified === true &&
    editionSemanticsClassified === true &&
    exactCountPass &&
    singleSourcePass &&
    rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_FROKEN_JENSEN_1921_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_FROKEN_JENSEN_1921_CANDIDATE_TERMINAL : ORA_FROKEN_JENSEN_1921_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_FROKEN_JENSEN_1921_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      sourceYear: candidate.sourceYear,
      sourceYearSemantics: ORA_FROKEN_JENSEN_1921_SOURCE.sourceYearSemantics,
      workFirstPublicationYear: ORA_FROKEN_JENSEN_1921_SOURCE.workFirstPublicationYear,
      sourceUrl: candidate.sourceUrl,
      digitizedEditionYear: ORA_FROKEN_JENSEN_1921_SOURCE.digitizedEditionYear,
      digitizedEditionLabel: ORA_FROKEN_JENSEN_1921_SOURCE.digitizedEditionLabel,
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
