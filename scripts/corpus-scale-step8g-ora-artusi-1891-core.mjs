import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_ARTUSI_1891_SOURCE = Object.freeze({
  cohortId: "ORA_ARTUSI_1891_SCIENZA_CUCINA_GUTENBERG_59047",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "cucina-italiana",
  sourceTitle: "La scienza in cucina e l'arte di mangiar bene",
  sourceAuthor: "Pellegrino Artusi",
  sourceUrl: "https://www.gutenberg.org/ebooks/59047",
  sourceYear: "1891",
  sourceYearSemantics: "WORK_FIRST_PUBLICATION_YEAR",
  digitizedEditionYear: "1922",
  digitizedEditionLabel: "25th edition",
  digitizedEditionRecipeCount: 790,
  license: "public-domain",
  expectedRecipeCount: 829,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_ARTUSI_1891_WORK_GUTENBERG_1922_EDITION"
});

export const ORA_ARTUSI_1891_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_ARTUSI_1891_V8009_MARGINAL_VALUE_V1";
export const ORA_ARTUSI_1891_CANDIDATE_TERMINAL = "STEP_8G_ORA_ARTUSI_1891_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_ARTUSI_1891_REJECT_TERMINAL = "STEP_8G_STOP_ORA_ARTUSI_1891_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const source = ORA_ARTUSI_1891_SOURCE;
  return candidate.collection === source.collection &&
    candidate.sourceUrl === source.sourceUrl &&
    candidate.sourceTitle === source.sourceTitle &&
    candidate.sourceAuthor === source.sourceAuthor &&
    candidate.sourceYear === source.sourceYear &&
    candidate.licenseId === source.license;
}

export function measureOraArtusi1891Candidate({
  candidateRows,
  baselineRecipes,
  rightsDocumented,
  repositoryReusePass,
  attributionClassified,
  editionSemanticsClassified,
  sourceGroundingSamplePass
}) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_ARTUSI_1891_CANDIDATE_EMPTY");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_ARTUSI_1891_BASELINE_EMPTY");

  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8009",
    activeProtectedCount: 10923
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_ARTUSI_1891_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true &&
    repositoryReusePass === true &&
    attributionClassified === true &&
    editionSemanticsClassified === true &&
    sourceGroundingSamplePass === true &&
    exactCountPass &&
    singleSourcePass &&
    rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_ARTUSI_1891_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_ARTUSI_1891_CANDIDATE_TERMINAL : ORA_ARTUSI_1891_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_ARTUSI_1891_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      sourceYear: candidate.sourceYear,
      sourceYearSemantics: ORA_ARTUSI_1891_SOURCE.sourceYearSemantics,
      sourceUrl: candidate.sourceUrl,
      digitizedEditionYear: ORA_ARTUSI_1891_SOURCE.digitizedEditionYear,
      digitizedEditionLabel: ORA_ARTUSI_1891_SOURCE.digitizedEditionLabel,
      digitizedEditionRecipeCount: ORA_ARTUSI_1891_SOURCE.digitizedEditionRecipeCount,
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
      sourceGroundingSamplePass: sourceGroundingSamplePass === true,
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
