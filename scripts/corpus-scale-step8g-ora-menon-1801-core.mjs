import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_MENON_1801_SOURCE = Object.freeze({
  cohortId: "ORA_MENON_1801_CUISINIERE_BOURGEOISE_B22019935",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "cuisine-francaise",
  sourceTitle: "La Cuisinière bourgeoise",
  sourceAuthor: "Menon",
  sourceUrl: "https://archive.org/details/b22019935",
  sourceYear: "1801",
  license: "public-domain",
  expectedRecipeCount: 752,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_MENON_1801_CUISINIERE_BOURGEOISE"
});

export const ORA_MENON_1801_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_MENON_1801_V8008_MARGINAL_VALUE_V1";
export const ORA_MENON_1801_CANDIDATE_TERMINAL = "STEP_8G_ORA_MENON_1801_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_MENON_1801_REJECT_TERMINAL = "STEP_8G_STOP_ORA_MENON_1801_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const source = ORA_MENON_1801_SOURCE;
  return candidate.collection === source.collection &&
    candidate.sourceUrl === source.sourceUrl &&
    candidate.sourceTitle === source.sourceTitle &&
    candidate.sourceAuthor === source.sourceAuthor &&
    candidate.sourceYear === source.sourceYear &&
    candidate.licenseId === source.license;
}

export function measureOraMenon1801Candidate({
  candidateRows,
  baselineRecipes,
  rightsDocumented,
  repositoryReusePass,
  attributionClassified
}) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_MENON_1801_CANDIDATE_EMPTY");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_MENON_1801_BASELINE_EMPTY");

  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8008",
    activeProtectedCount: 10171
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_MENON_1801_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true &&
    repositoryReusePass === true &&
    attributionClassified === true &&
    exactCountPass &&
    singleSourcePass &&
    rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_MENON_1801_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_MENON_1801_CANDIDATE_TERMINAL : ORA_MENON_1801_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_MENON_1801_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      sourceYear: candidate.sourceYear,
      sourceUrl: candidate.sourceUrl,
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
