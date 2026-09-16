import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_RIGAUD_SOURCE = Object.freeze({
  cohortId: "ORA_RIGAUD_1785_PORTUGUESE_SOURCE_AE3BD2C",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "cozinha-portuguesa",
  sourceTitle: "Cozinheiro moderno, ou nova arte de cozinha",
  sourceAuthor: "Lucas Rigaud",
  sourceUrl: "https://archive.org/details/b28764626",
  sourceYear: "1785",
  license: "public-domain",
  expectedRecipeCount: 789,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_RIGAUD_1785_PORTUGUESE_SOURCE"
});

export const ORA_RIGAUD_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_RIGAUD_1785_MARGINAL_VALUE_V1";
export const ORA_RIGAUD_CANDIDATE_TERMINAL = "STEP_8G_ORA_RIGAUD_1785_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_RIGAUD_REJECT_TERMINAL = "STEP_8G_STOP_ORA_RIGAUD_1785_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const source = ORA_RIGAUD_SOURCE;
  return candidate.collection === source.collection &&
    candidate.sourceUrl === source.sourceUrl &&
    candidate.sourceTitle === source.sourceTitle &&
    candidate.sourceAuthor === source.sourceAuthor &&
    candidate.sourceYear === source.sourceYear &&
    candidate.licenseId === source.license;
}

export function measureOraRigaudCandidate({ candidateRows, baselineRecipes, rightsDocumented }) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_RIGAUD_CANDIDATE_EMPTY");
  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8006",
    activeProtectedCount: 2906
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_RIGAUD_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true && exactCountPass && singleSourcePass && rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_RIGAUD_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_RIGAUD_CANDIDATE_TERMINAL : ORA_RIGAUD_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_RIGAUD_SOURCE.cohortId,
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
      exactCountPass,
      singleSourcePass,
      rightsMetadataPass,
      rightsAuditPass,
      structuralQualityPass,
      culinaryCoveragePass
    },
    evidenceSamples: candidate?.evidenceSamples || {},
    boundaries: {
      liveD1WritesAuthorized: false,
      protectedPopulationAuthorized: false,
      publicRuntimeChangeAuthorized: false,
      recommendationAdmissionAuthorized: false,
      thirdShardAuthorized: false,
      d1BudgetExpansionAuthorized: false,
      billingExpansionAuthorized: false,
      nutritionAuthorityImported: false,
      culturalAuthenticityAuthorityImported: false,
      knowledgeCoreWriteAuthorized: false
    }
  };
}
