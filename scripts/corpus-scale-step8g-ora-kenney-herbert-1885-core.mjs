import { discoverOraNextSources } from "./corpus-scale-step8g-ora-next-source-discovery-core.mjs";

export const ORA_KENNEY_HERBERT_1885_SOURCE = Object.freeze({
  cohortId: "ORA_KENNEY_HERBERT_1885_CULINARY_JOTTINGS_CULINARYJOTTINGS00KENN",
  repository: "AdamBouhmad/open-recipe-archive",
  commit: "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8",
  collection: "indian-kitchen",
  sourceTitle: "Culinary Jottings for Madras",
  sourceAuthor: "Wyvern (A.R. Kenney-Herbert)",
  canonicalAuthor: "Arthur Robert Kenney-Herbert",
  sourceUrl: "https://archive.org/details/culinaryjottings00kenn",
  sourceYear: "1885",
  sourceYearSemantics: "EXACT_DIGITIZED_FIFTH_EDITION_YEAR",
  workFirstPublicationYear: "1878",
  digitizedEditionYear: "1885",
  digitizedEditionLabel: "5th edition",
  publisher: "Higginbotham and Co.",
  publicationPlace: "Madras",
  license: "public-domain",
  expectedRecipeCount: 501,
  rightsMarker: "PASS_RIGHTS_VERIFIED_BOUNDED_KENNEY_HERBERT_1885_FIFTH_EDITION_TERM_EXPIRED"
});

export const ORA_KENNEY_HERBERT_1885_MEASUREMENT_SCHEMA = "CORPUS_SCALE_STEP8G_ORA_KENNEY_HERBERT_1885_V8015_MARGINAL_VALUE_V1";
export const ORA_KENNEY_HERBERT_1885_CANDIDATE_TERMINAL = "STEP_8G_ORA_KENNEY_HERBERT_1885_MEASUREMENT_EARNED_COHORT_CANDIDATE";
export const ORA_KENNEY_HERBERT_1885_REJECT_TERMINAL = "STEP_8G_STOP_ORA_KENNEY_HERBERT_1885_MARGINAL_VALUE_OR_RIGHTS_FAIL";

function exactIdentity(candidate = {}) {
  const s = ORA_KENNEY_HERBERT_1885_SOURCE;
  return candidate.collection === s.collection &&
    candidate.sourceUrl === s.sourceUrl &&
    candidate.sourceTitle === s.sourceTitle &&
    candidate.sourceAuthor === s.sourceAuthor &&
    candidate.sourceYear === s.sourceYear &&
    candidate.licenseId === s.license;
}

export function measureOraKenneyHerbert1885Candidate({
  candidateRows, baselineRecipes, rightsDocumented, repositoryReusePass,
  attributionClassified, editionSemanticsClassified
}) {
  if (!Array.isArray(candidateRows) || candidateRows.length === 0) throw new Error("ORA_KENNEY_HERBERT_1885_CANDIDATE_EMPTY");
  if (!Array.isArray(baselineRecipes) || baselineRecipes.length === 0) throw new Error("ORA_KENNEY_HERBERT_1885_BASELINE_EMPTY");

  const discovery = discoverOraNextSources({
    collectionRows: candidateRows,
    baselineRecipes,
    activeProtectedVersion: "v8015",
    activeProtectedCount: 16510
  });
  const candidate = discovery.allMeasuredCandidates[0] || null;
  const exactCountPass = candidateRows.length === ORA_KENNEY_HERBERT_1885_SOURCE.expectedRecipeCount;
  const singleSourcePass = discovery.sourceGroupCount === 1 && discovery.allMeasuredCandidates.length === 1;
  const rightsMetadataPass = Boolean(candidate) && exactIdentity(candidate);
  const rightsAuditPass = rightsDocumented === true && repositoryReusePass === true &&
    attributionClassified === true && editionSemanticsClassified === true &&
    exactCountPass && singleSourcePass && rightsMetadataPass;
  const structuralQualityPass = Boolean(candidate?.structuralPass);
  const culinaryCoveragePass = Boolean(candidate?.marginalValuePass);
  const pass = rightsAuditPass && structuralQualityPass && culinaryCoveragePass;

  return {
    schema: ORA_KENNEY_HERBERT_1885_MEASUREMENT_SCHEMA,
    pass,
    terminal: pass ? ORA_KENNEY_HERBERT_1885_CANDIDATE_TERMINAL : ORA_KENNEY_HERBERT_1885_REJECT_TERMINAL,
    baseline: discovery.baseline,
    candidate: candidate ? {
      cohortId: ORA_KENNEY_HERBERT_1885_SOURCE.cohortId,
      collection: candidate.collection,
      sourceWork: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      canonicalAuthor: ORA_KENNEY_HERBERT_1885_SOURCE.canonicalAuthor,
      sourceYear: candidate.sourceYear,
      sourceYearSemantics: ORA_KENNEY_HERBERT_1885_SOURCE.sourceYearSemantics,
      workFirstPublicationYear: ORA_KENNEY_HERBERT_1885_SOURCE.workFirstPublicationYear,
      sourceUrl: candidate.sourceUrl,
      digitizedEditionYear: ORA_KENNEY_HERBERT_1885_SOURCE.digitizedEditionYear,
      digitizedEditionLabel: ORA_KENNEY_HERBERT_1885_SOURCE.digitizedEditionLabel,
      publisher: ORA_KENNEY_HERBERT_1885_SOURCE.publisher,
      publicationPlace: ORA_KENNEY_HERBERT_1885_SOURCE.publicationPlace,
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
