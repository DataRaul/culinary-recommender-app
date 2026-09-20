import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_VIARD_1806_SOURCE = Object.freeze({
  cohortId: "ORA_VIARD_1806_LE_CUISINIER_IMPERIAL_LECUISINIERIMPE00VIARGOOG",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "cuisine-francaise",
  sourceTitle: "Le Cuisinier impérial",
  sourceAuthor: "A. Viard",
  canonicalAuthor: "André Viard",
  sourceUrl: "https://archive.org/details/lecuisinierimpe00viargoog",
  sourceYear: "1806",
  sourceYearSemantics: "SOURCE_TUPLE_YEAR_ALIGNED_WITH_BNF_1806_FIRST_EDITION",
  workFirstPublicationYear: "1806",
  digitizedEditionYear: "1806",
  digitizedEditionLabel: "1806 first edition bibliographic alignment",
  license: "public-domain",
  expectedRecipeCount: 807,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_VIARD_1806_FIRST_EDITION_ALIGNMENT"
});

export const ORA_VIARD_1806_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_VIARD_1806_V8012_MARGINAL_VALUE_V1";
export const ORA_VIARD_1806_CANDIDATE_TERMINAL = "STEP_8G_ORA_VIARD_1806_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_VIARD_1806_REJECT_TERMINAL = "STEP_8G_STOP_ORA_VIARD_1806_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const s = ORA_VIARD_1806_SOURCE;
  return candidate.collection === s.collection &&
    candidate.sourceUrl === s.sourceUrl &&
    candidate.sourceTitle === s.sourceTitle &&
    candidate.sourceAuthor === s.sourceAuthor &&
    candidate.sourceYear === s.sourceYear &&
    candidate.licenseId === s.license;
}

export function measureOraViard1806Candidate({
  candidateRows, baselineRecipes, rightsDocumented, repositoryReusePass,
  attributionClassified, editionSemanticsClassified
}) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_VIARD_1806_CANDIDATE_EMPTY");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_VIARD_1806_BASELINE_EMPTY");

  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8012",
    activeProtectedCount: 14846
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_VIARD_1806_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true && repositoryReusePass === true &&
    attributionClassified === true && editionSemanticsClassified === true &&
    exactCountPass && singleSourcePass && rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_VIARD_1806_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_VIARD_1806_CANDIDATE_TERMINAL : ORA_VIARD_1806_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_VIARD_1806_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      sourceYear: candidate.sourceYear,
      sourceYearSemantics: ORA_VIARD_1806_SOURCE.sourceYearSemantics,
      workFirstPublicationYear: ORA_VIARD_1806_SOURCE.workFirstPublicationYear,
      sourceUrl: candidate.sourceUrl,
      digitizedEditionYear: ORA_VIARD_1806_SOURCE.digitizedEditionYear,
      digitizedEditionLabel: ORA_VIARD_1806_SOURCE.digitizedEditionLabel,
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
